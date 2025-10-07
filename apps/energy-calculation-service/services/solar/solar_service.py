"""
Serviço de cálculo de sistemas solares multi-inversor
Replicando lógica do notebook Python
"""

import numpy as np
import pandas as pd
import pvlib
from pvlib.temperature import TEMPERATURE_MODEL_PARAMETERS
from pvlib.iotools import get_nasa_power
import requests
import logging
from typing import Dict, Any

from models.solar.requests import SolarSystemCalculationRequest

logger = logging.getLogger(__name__)


class SolarCalculationService:

    @staticmethod
    def calculate(request: SolarSystemCalculationRequest) -> Dict[str, Any]:
        """
        Calcula sistema solar completo - replicando notebook
        """

        logger.info("=== Iniciando cálculo sistema solar ===")

        # Extrair parâmetros
        lat = request.lat
        lon = request.lon
        monthly_consumption_kwh = request.consumo_mensal_kwh
        startyear = request.startyear
        endyear = request.endyear
        preferred_source = request.origem_dados
        modelo_transposicao = request.modelo_transposicao
        mount_type = request.mount_type

        # Preparar perdas
        losses_parameters = {
            'soiling': request.perdas.sujeira,
            'shading': request.perdas.sombreamento,
            'mismatch': request.perdas.incompatibilidade,
            'wiring': request.perdas.fiacao,
            'Other': request.perdas.outras
        }

        # Preparar parâmetros do módulo
        modulo = request.modulo
        potencia_modulo = modulo.potencia_nominal_w

        module_parameters = {
            'alpha_sc': modulo.alpha_sc,
            'beta_oc': modulo.beta_oc,
            'gamma_r': modulo.gamma_r,
            'cells_in_series': modulo.cells_in_series,
            'STC': potencia_modulo,
            'V_oc_ref': modulo.voc_stc,
            'I_sc_ref': modulo.isc_stc,
            'V_mp_ref': modulo.vmpp,
            'I_mp_ref': modulo.impp,
            'a_ref': modulo.a_ref,
            'I_L_ref': modulo.il_ref,
            'I_o_ref': modulo.io_ref,
            'R_s': modulo.rs,
            'R_sh_ref': modulo.rsh_ref,
        }

        # Preparar configurações dos inversores
        inverter_configs = []
        for inv_config in request.inversores:
            inversor = inv_config.inversor

            mppts = []
            for orientacao in inv_config.orientacoes:
                mppts.append({
                    'tilt': orientacao.inclinacao,
                    'azimuth': orientacao.orientacao,
                    'modules_per_string': orientacao.modulos_por_string,
                    'strings': orientacao.numero_strings or 1,
                    'id': orientacao.nome
                })

            inverter_configs.append({
                'name': f"{inversor.fabricante} {inversor.modelo}",
                'paco_w': inversor.potencia_saida_ca_w,
                'efficiency_dc_ac': inversor.efficiency_dc_ac,
                'mppts': mppts
            })

        # Obter temperatura model
        temperature_model_params = TEMPERATURE_MODEL_PARAMETERS['sapm'].get(mount_type)
        if temperature_model_params is None:
            raise ValueError(f"mount_type '{mount_type}' não encontrado")

        # ========================================
        # BUSCAR DADOS METEOROLÓGICOS
        # ========================================

        df = None

        if preferred_source == 'NASA':
            df = SolarCalculationService._buscar_dados_nasa(lat, lon, startyear, endyear)
            if df is None:
                logger.warning("NASA falhou, tentando PVGIS")
                df = SolarCalculationService._buscar_dados_pvgis(lat, lon, startyear, endyear)
        else:  # PVGIS
            df = SolarCalculationService._buscar_dados_pvgis(lat, lon, startyear, endyear)
            if df is None:
                logger.warning("PVGIS falhou, tentando NASA")
                df = SolarCalculationService._buscar_dados_nasa(lat, lon, startyear, endyear)

        if df is None or df.empty:
            raise ValueError("Não foi possível obter dados meteorológicos")

        # Calcular posição solar
        solar_pos = pvlib.solarposition.get_solarposition(df.index, lat, lon)

        # Decompor se necessário
        if df['dni'].sum() == 0:
            logger.info("Decompondo GHI em DNI/DHI")
            decomp = pvlib.irradiance.louche(ghi=df['ghi'], solar_zenith=solar_pos['zenith'], datetime_or_doy=df.index)
            df['dni'] = decomp['dni']
            df['dhi'] = decomp['dhi']

        # ========================================
        # CALCULAR SISTEMA (LOOP POR INVERSOR)
        # ========================================

        ac_all = pd.Series(0.0, index=df.index)
        dc_all_pre_clipping = pd.Series(0.0, index=df.index)

        results_inverter = {}
        poa_global_mppt_results = {}
        total_kwp_by_mppt_id = {}

        for inv_cfg in inverter_configs:
            inv_name = inv_cfg['name']
            paco_inv = inv_cfg['paco_w']
            mppts_list = inv_cfg['mppts']
            efficiency_factor = inv_cfg['efficiency_dc_ac']

            dc_inv_total_pure = pd.Series(0.0, index=df.index)
            kwp_inv = 0.0

            # Loop por MPPT
            for i, mppt in enumerate(mppts_list):
                mppt_id = mppt.get('id', f'{inv_name}_MPPT_{i+1}')

                current_mppt_kwp = (mppt['modules_per_string'] * mppt['strings'] * potencia_modulo) / 1000.0
                total_kwp_by_mppt_id[mppt_id] = current_mppt_kwp
                kwp_inv += current_mppt_kwp

                # Calcular AOI
                aoi = pvlib.irradiance.aoi(mppt['tilt'], mppt['azimuth'], solar_pos['apparent_zenith'], solar_pos['azimuth'])
                dni_extra = pvlib.irradiance.get_extra_radiation(df.index)

                # Calcular POA
                poa_irrad = pvlib.irradiance.get_total_irradiance(
                    mppt['tilt'], mppt['azimuth'], solar_pos['apparent_zenith'], solar_pos['azimuth'],
                    df['dni'], df['ghi'], df['dhi'],
                    dni_extra=dni_extra,
                    model=modelo_transposicao
                )

                poa_global_mppt_results[mppt_id] = poa_irrad['poa_global']

                # Criar weather para MPPT
                weather_mppt = pd.DataFrame({
                    'ghi': df['ghi'], 'dni': df['dni'], 'dhi': df['dhi'],
                    'temp_air': df['temp_air'], 'wind_speed': df['wind_speed'],
                    'poa_global': poa_irrad['poa_global'],
                    'poa_direct': poa_irrad['poa_direct'], 'poa_diffuse': poa_irrad['poa_diffuse']
                }, index=df.index)

                pdc_stc_array = current_mppt_kwp * 1000.0

                # Criar sistema PV
                system = pvlib.pvsystem.PVSystem(
                    surface_tilt=mppt['tilt'], surface_azimuth=mppt['azimuth'],
                    module_parameters={**module_parameters, 'module_type':'glass_glass'},
                    modules_per_string=mppt['modules_per_string'],
                    strings_per_inverter=mppt['strings'],
                    inverter_parameters={'Paco': pdc_stc_array, 'Pdco': pdc_stc_array, 'pdc0': pdc_stc_array},
                    temperature_model_parameters=temperature_model_params,
                    losses_parameters={}
                )

                site = pvlib.location.Location(lat, lon, tz='America/Sao_Paulo')
                mc = pvlib.modelchain.ModelChain(
                    system, site, aoi_model='physical', ac_model='pvwatts',
                    transposition_model=modelo_transposicao
                )

                mc.run_model(weather_mppt)

                dc_pre_clipping_mppt = mc.results.dc['p_mp'].fillna(0)
                dc_inv_total_pure += dc_pre_clipping_mppt

            # Aplicar eficiência e clipping
            dc_pre_clipping_with_eff = dc_inv_total_pure * efficiency_factor
            ac_inv_output = np.minimum(dc_pre_clipping_with_eff, paco_inv)

            results_inverter[inv_name] = {
                'dc_pure': dc_inv_total_pure,
                'ac_pre_losses': ac_inv_output,
                'paco_w': paco_inv,
                'kwp': kwp_inv
            }

            ac_all += ac_inv_output
            dc_all_pre_clipping += dc_inv_total_pure

        # Aplicar perdas finais
        perdas_totais_pct = sum(losses_parameters.values())
        perdas_fator = (1.0 - perdas_totais_pct / 100.0)
        ac_after_losses = ac_all * perdas_fator

        potencia_total_kWp = sum(r['kwp'] for r in results_inverter.values())
        n_anos = df.index.year.nunique()

        # Energia total
        annual_energy_kwh = ac_after_losses.sum() / 1000.0 / n_anos
        annual_energy_total_kwh_pre_losses = ac_all.sum() / 1000.0 / n_anos
        annual_energy_dc_kwh = dc_all_pre_clipping.sum() / 1000.0 / n_anos

        # Clipping
        dc_with_eff = dc_all_pre_clipping * efficiency_factor
        dc_with_eff_energy = dc_with_eff.sum() / 1000.0 / n_anos
        perda_clipping_kwh = dc_with_eff_energy - annual_energy_total_kwh_pre_losses
        perda_clipping_pct = (perda_clipping_kwh / dc_with_eff_energy) * 100.0 if dc_with_eff_energy > 0 else 0.0

        # Geração mensal
        monthly_energy_kwh = ac_after_losses.groupby(ac_after_losses.index.month).sum() / 1000.0 / n_anos
        meses_str = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
        monthly_energy_kwh.index = meses_str

        # POA
        df_poa_hourly = pd.DataFrame(poa_global_mppt_results)
        weights = pd.Series(total_kwp_by_mppt_id)
        poa_weighted_sum = (df_poa_hourly * weights).sum(axis=1)
        poa_weighted_average_hourly = poa_weighted_sum / weights.sum()
        monthly_poa_kwh_m2 = poa_weighted_average_hourly.groupby(poa_weighted_average_hourly.index.month).sum() / 1000.0 / n_anos
        monthly_poa_kwh_m2.index = meses_str

        # Yield e PR
        yield_especifico = annual_energy_kwh / potencia_total_kWp
        fator_capacidade = (annual_energy_kwh / (potencia_total_kWp * 8760.0)) * 100.0
        PR_total = (ac_after_losses.sum() / dc_all_pre_clipping.sum()) if dc_all_pre_clipping.sum() > 0 else 0

        # Consumo
        annual_consumption_kwh = sum(monthly_consumption_kwh)

        # Resultados por inversor
        inverter_summary = []
        for inv_name, data in results_inverter.items():
            ac_final_inv_kwh = (data['ac_pre_losses'] * perdas_fator).sum() / 1000.0 / n_anos
            dc_inv_kwh = data['dc_pure'].sum() / 1000.0 / n_anos
            pr_inv = (ac_final_inv_kwh / dc_inv_kwh) if dc_inv_kwh > 0 else 0
            yield_inv = (ac_final_inv_kwh / data['kwp']) if data['kwp'] > 0 else 0

            inverter_summary.append({
                'Inversor': inv_name,
                'kWp': data['kwp'],
                'Geração AC (kWh/ano)': ac_final_inv_kwh,
                'Yield (kWh/kWp)': yield_inv,
                'PR (%)': pr_inv * 100.0
            })

        logger.info(f"Cálculo concluído: {potencia_total_kWp:.2f} kWp, {annual_energy_kwh:,.0f} kWh/ano")

        return {
            'potencia_total_kwp': potencia_total_kWp,
            'energia_anual_kwh': annual_energy_kwh,
            'energia_dc_anual_kwh': annual_energy_dc_kwh,
            'perda_clipping_kwh': perda_clipping_kwh,
            'perda_clipping_pct': perda_clipping_pct,
            'geracao_mensal_kwh': monthly_energy_kwh.to_dict(),
            'consumo_anual_kwh': annual_consumption_kwh,
            'yield_especifico': yield_especifico,
            'fator_capacidade': fator_capacidade,
            'pr_total': PR_total * 100.0,
            'anos_analisados': n_anos,
            'inversores': inverter_summary
        }

    @staticmethod
    def _buscar_dados_nasa(lat: float, lon: float, startyear: int, endyear: int) -> pd.DataFrame:
        """Busca dados NASA POWER"""
        try:
            logger.info(f"Buscando NASA POWER: {lat},{lon} [{startyear}-{endyear}]")

            df_utc, metadata = get_nasa_power(
                latitude=lat,
                longitude=lon,
                start=f'{startyear}-01-01',
                end=f'{endyear}-12-31',
                parameters=['ghi', 'dni', 'dhi', 'temp_air', 'wind_speed'],
                community='re',
                map_variables=True
            )

            if df_utc.empty:
                return None

            df = df_utc.copy()

            for col in ['ghi', 'dni', 'dhi', 'temp_air', 'wind_speed']:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0.0)

            df.index = df.index.tz_convert('America/Sao_Paulo')
            df = df[(df.index.year >= startyear) & (df.index.year <= endyear)]
            df = df[~df.index.duplicated(keep='first')]

            logger.info(f"NASA POWER OK: {len(df)} registros")
            return df

        except Exception as e:
            logger.error(f"Erro NASA: {e}")
            return None

    @staticmethod
    def _buscar_dados_pvgis(lat: float, lon: float, startyear: int, endyear: int) -> pd.DataFrame:
        """Busca dados PVGIS"""
        try:
            logger.info(f"Buscando PVGIS: {lat},{lon} [{startyear}-{endyear}]")

            url = f"https://re.jrc.ec.europa.eu/api/v5_2/seriescalc?lat={lat}&lon={lon}&startyear={startyear}&endyear={endyear}&outputformat=json&usehorizon=1&selectrad=1&angle=0&aspect=0"
            r = requests.get(url, timeout=60)
            r.raise_for_status()
            data = r.json()

            recs = []
            hourly = data.get('outputs', {}).get('hourly', [])
            for rec in hourly:
                try:
                    dt = pd.to_datetime(rec['time'], format='%Y%m%d:%H%M', utc=True)
                    recs.append({
                        'datetime': dt,
                        'ghi': float(rec.get('G(i)', 0.0)),
                        'dni': float(rec.get('Gb(n)', 0.0)),
                        'dhi': float(rec.get('Gd(i)', 0.0)),
                        'temp_air': float(rec.get('T2m', 25.0)),
                        'wind_speed': float(rec.get('WS10m', 2.0))
                    })
                except:
                    continue

            df = pd.DataFrame(recs).set_index('datetime')
            if df.empty:
                return None

            df.index = df.index.tz_convert('America/Sao_Paulo')
            logger.info(f"PVGIS OK: {len(df)} registros")
            return df

        except Exception as e:
            logger.error(f"Erro PVGIS: {e}")
            return None

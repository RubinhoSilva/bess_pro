"""
Serviço de cálculo de sistemas solares multi-inversor
Replicando lógica do notebook Python
"""

import numpy as np
import pandas as pd
import pvlib
from pvlib.temperature import TEMPERATURE_MODEL_PARAMETERS
import logging
from typing import Dict, Any

from models.solar.requests import SolarSystemCalculationRequest
from services.solar.pvgis_service import pvgis_service
from services.solar.nasa_service import nasa_service

logger = logging.getLogger(__name__)


class SolarCalculationService:

    @staticmethod
    def calculate(request: SolarSystemCalculationRequest) -> Dict[str, Any]:
        """
        Calcula sistema solar completo - replicando notebook
        """

        # Extrair parâmetros
        lat = request.lat
        lon = request.lon
        monthly_consumption_kwh = request.consumo_mensal_kwh
        startyear = request.startyear
        endyear = request.endyear
        preferred_source = request.origem_dados
        modelo_transposicao = request.modelo_transposicao
        mount_type = request.mount_type

        logger.info("=== Iniciando cálculo sistema solar ===")
        logger.info(f"Localização: {lat}, {lon}")
        logger.info(f"Período: {startyear}-{endyear}")
        logger.info(f"Fonte de dados preferida: {preferred_source}")
        logger.info(f"Modelo transposição: {modelo_transposicao}")
        logger.info(f"Tipo de montagem: {mount_type}")
        logger.info(f"Consumo mensal: {monthly_consumption_kwh} kWh")

        # Preparar perdas
        losses_parameters = {
            'soiling': request.perdas.sujeira,
            'shading': request.perdas.sombreamento,
            'mismatch': request.perdas.incompatibilidade,
            'wiring': request.perdas.fiacao,
            'Other': request.perdas.outras
        }
        
        total_losses_pct = sum(losses_parameters.values())
        logger.info(f"Configuração de perdas: {losses_parameters} (Total: {total_losses_pct}%)")

        # Preparar parâmetros do módulo
        modulo = request.modulo
        potencia_modulo = modulo.potencia_nominal_w
        
        # Calcular área do módulo
        area_modulo_m2 = 0
        if modulo.largura_mm and modulo.altura_mm:
            area_modulo_m2 = (modulo.largura_mm / 1000.0) * (modulo.altura_mm / 1000.0)
        elif hasattr(modulo, 'area_m2') and modulo.area_m2:
            area_modulo_m2 = modulo.area_m2
        else:
            # Área padrão se não disponível (aproximado para módulos de 550W)
            area_modulo_m2 = 2.3

        logger.info(f"Módulo: {modulo.fabricante} {modulo.modelo} - {potencia_modulo}W")
        logger.info(f"Parâmetros STC: Voc={modulo.voc_stc}V, Isc={modulo.isc_stc}A, Vmpp={modulo.vmpp}V, Impp={modulo.impp}A")
        logger.info(f"Área do módulo: {area_modulo_m2:.2f} m²")

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
        logger.info(f"Configurando {len(request.inversores)} inversor(es)")
        
        for i, inv_config in enumerate(request.inversores):
            inversor = inv_config.inversor
            logger.info(f"Inversor {i+1}: {inversor.fabricante} {inversor.modelo} - {inversor.potencia_saida_ca_w}W")

            mppts = []
            for j, orientacao in enumerate(inv_config.orientacoes):
                mppt_config = {
                    'tilt': orientacao.inclinacao,
                    'azimuth': orientacao.orientacao,
                    'modules_per_string': orientacao.modulos_por_string,
                    'strings': orientacao.numero_strings or 1,
                    'id': orientacao.nome
                }
                mppts.append(mppt_config)
                
                total_modules = orientacao.modulos_por_string * (orientacao.numero_strings or 1)
                kwp_mppt = (total_modules * potencia_modulo) / 1000.0
                logger.info(f"  MPPT {j+1} ({orientacao.nome}): {orientacao.inclinacao}°/{orientacao.orientacao}° - {total_modules} módulos ({kwp_mppt:.2f} kWp)")

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
        
        logger.info(f"Modelo de temperatura SAPM: {mount_type}")
        logger.debug(f"Parâmetros temperatura: {temperature_model_params}")

        # ========================================
        # BUSCAR DADOS METEOROLÓGICOS
        # ========================================

        df = None

        if preferred_source == 'NASA':
            logger.info("Tentando fonte primária: NASA POWER (com cache)")
            try:
                df = nasa_service.fetch_weather_data(lat, lon, use_cache=True)
                logger.info("NASA POWER dados obtidos com sucesso (usando cache)")
            except Exception as e:
                logger.warning(f"NASA falhou: {e}, tentando PVGIS como fallback")
                try:
                    df = pvgis_service.fetch_weather_data(lat, lon, use_cache=True)
                    logger.info("PVGIS fallback obtido com sucesso (usando cache)")
                except Exception as e2:
                    logger.error(f"Ambas as fontes falharam. NASA: {e}, PVGIS: {e2}")
                    df = None
        else:  # PVGIS
            logger.info("Tentando fonte primária: PVGIS (com cache)")
            try:
                df = pvgis_service.fetch_weather_data(lat, lon, use_cache=True)
                logger.info("PVGIS dados obtidos com sucesso (usando cache)")
            except Exception as e:
                logger.warning(f"PVGIS falhou: {e}, tentando NASA como fallback")
                try:
                    df = nasa_service.fetch_weather_data(lat, lon, use_cache=True)
                    logger.info("NASA fallback obtido com sucesso (usando cache)")
                except Exception as e2:
                    logger.error(f"Ambas as fontes falharam. PVGIS: {e}, NASA: {e2}")
                    df = None

        if df is None or df.empty:
            logger.error("Falha ao obter dados de ambas as fontes (NASA e PVGIS)")
            raise ValueError("Não foi possível obter dados meteorológicos")
    

        # Remover registros fora do período solicitado
        df = df[(df.index.year >= startyear) & (df.index.year <= endyear)]
        
        logger.info(f"Dados obtidos: {len(df)} registros de {df.index.min()} a {df.index.max()}")
        logger.info(f"Resumo irradiação - GHI: {df['ghi'].mean():.1f}±{df['ghi'].std():.1f} W/m²")
        
        # Verificar se DNI/DHI foram fornecidos pela fonte (PVGIS ou NASA POWER)
        if 'dni' in df.columns and 'dhi' in df.columns:
            dni_mean = df['dni'].mean()
            dhi_mean = df['dhi'].mean()
            if dni_mean > 0 and dhi_mean > 0:
                logger.info(f"✅ DNI/DHI de alta qualidade disponíveis: DNI={dni_mean:.1f}±{df['dni'].std():.1f} W/m², DHI={dhi_mean:.1f}±{df['dhi'].std():.1f} W/m²")
                logger.info("✅ Usando dados de irradiação direta da fonte (sem decomposição necessária)")
            else:
                logger.info("⚠️ DNI/DHI zerados, será necessária decomposição de GHI")
        else:
            logger.info("⚠️ Colunas DNI/DHI não encontradas, será necessária decomposição de GHI")
            
        logger.info(f"Resumo temperatura: {df['temp_air'].mean():.1f}±{df['temp_air'].std():.1f} °C")

        # Calcular número de anos para normalização
        n_anos = df.index.year.nunique()
        registros_por_ano = df.groupby(df.index.year).size()
        for ano, count in registros_por_ano.items():
            logger.info(f"Ano {ano}: {count} registros")
        logger.info(f"Período analisado: {n_anos} ano(s)")

        # Calcular posição solar
        logger.info("Calculando posição solar")
        logger.info(df.columns)

        solar_pos = pvlib.solarposition.get_solarposition(df.index, lat, lon)
        logger.debug(f"Posição solar calculada: zenite médio {solar_pos['zenith'].mean():.1f}°")
        

        # Decompor se necessário
        if df['dni'].sum() == 0:
            logger.info("DNI nulo, decompondo GHI em DNI/DHI usando modelo Louche")
            decomp = pvlib.irradiance.louche(ghi=df['ghi'], solar_zenith=solar_pos['zenith'], datetime_or_doy=df.index)
            df['dni'] = decomp['dni']
            df['dhi'] = decomp['dhi']
            logger.info(f"Decomposição concluída - DNI médio: {df['dni'].mean():.1f} W/m², DHI médio: {df['dhi'].mean():.1f} W/m²")
        else:
            logger.info(f"DNI já disponível: {df['dni'].mean():.1f}±{df['dni'].std():.1f} W/m²")

        # ========================================
        # CALCULAR SISTEMA (LOOP POR INVERSOR)
        # ========================================

        ac_all = pd.Series(0.0, index=df.index)
        dc_all_pre_clipping = pd.Series(0.0, index=df.index)

        results_inverter = {}
        poa_global_mppt_results = {}
        total_kwp_by_mppt_id = {}

        for inv_idx, inv_cfg in enumerate(inverter_configs):
            inv_name = inv_cfg['name']
            paco_inv = inv_cfg['paco_w']
            mppts_list = inv_cfg['mppts']
            efficiency_factor = inv_cfg['efficiency_dc_ac']

            logger.info(f"Processando inversor {inv_idx+1}/{len(inverter_configs)}: {inv_name}")
            logger.info(f"  Potência AC: {paco_inv}W, Eficiência: {efficiency_factor}")

            dc_inv_total_pure = pd.Series(0.0, index=df.index)
            kwp_inv = 0.0

            # Loop por MPPT
            for i, mppt in enumerate(mppts_list):
                mppt_id = mppt.get('id', f'{inv_name}_MPPT_{i+1}')

                current_mppt_kwp = (mppt['modules_per_string'] * mppt['strings'] * potencia_modulo) / 1000.0
                total_kwp_by_mppt_id[mppt_id] = current_mppt_kwp
                kwp_inv += current_mppt_kwp

                logger.info(f"  MPPT {i+1}/{len(mppts_list)} ({mppt_id}): {current_mppt_kwp:.2f} kWp")
                logger.debug(f"    Orientação: {mppt['tilt']}° inclinação, {mppt['azimuth']}° azimute")
                logger.debug(f"    Configuração: {mppt['modules_per_string']} módulos/string × {mppt['strings']} strings")

                # Calcular AOI
                aoi = pvlib.irradiance.aoi(mppt['tilt'], mppt['azimuth'], solar_pos['apparent_zenith'], solar_pos['azimuth'])
                dni_extra = pvlib.irradiance.get_extra_radiation(df.index)

                # Calcular POA
                logger.debug(f"    Calculando POA com modelo {modelo_transposicao}")
                poa_irrad = pvlib.irradiance.get_total_irradiance(
                    mppt['tilt'], mppt['azimuth'], solar_pos['apparent_zenith'], solar_pos['azimuth'],
                    df['dni'], df['ghi'], df['dhi'],
                    dni_extra=dni_extra,
                    model=modelo_transposicao
                )

                poa_global_mppt_results[mppt_id] = poa_irrad['poa_global']
                logger.debug(f"    POA global médio: {poa_irrad['poa_global'].mean():.1f} W/m²")

                # Criar weather para MPPT
                weather_mppt = pd.DataFrame({
                    'ghi': df['ghi'], 'dni': df['dni'], 'dhi': df['dhi'],
                    'temp_air': df['temp_air'], 'wind_speed': df['wind_speed'],
                    'poa_global': poa_irrad['poa_global'],
                    'poa_direct': poa_irrad['poa_direct'], 'poa_diffuse': poa_irrad['poa_diffuse']
                }, index=df.index)

                logger.info(f"    POA médio para {mppt_id}: {weather_mppt['poa_global'].mean():.1f} W/m²")
                logger.info(f"    POA direto médio para {mppt_id}: {weather_mppt['poa_direct'].mean():.1f} W/m²")
                logger.info(f"    POA difuso médio para {mppt_id}: {weather_mppt['poa_diffuse'].mean():.1f} W/m²")
                logger.info(f"    Temperatura média para {mppt_id}: {weather_mppt['temp_air'].mean():.1f} °C")
                logger.info(f"    Velocidade do vento média para {mppt_id}: {weather_mppt['wind_speed'].mean():.1f} m/s")
                logger.info(f"    Irradiação média GHI para {mppt_id}: {weather_mppt['ghi'].mean():.1f} W/m²")
                logger.info(f"    Irradiação média DNI para {mppt_id}: {weather_mppt['dni'].mean():.1f} W/m²")
                logger.info(f"    Irradiação média DHI para {mppt_id}: {weather_mppt['dhi'].mean():.1f} W/m²")
            

                pdc_stc_array = current_mppt_kwp * 1000.0

                logger.info(f"Surface tilt: {mppt['tilt']}°, azimuth: {mppt['azimuth']}°, kWp MPPT: {current_mppt_kwp:.2f} kWp")
                logger.info(f"Module Parameters: {module_parameters}")
                logger.info(f"Inverter parameters (Paco set to MPPT kWp): Paco={pdc_stc_array}W")
                logger.info(f"Temperature model parameters: {temperature_model_params}")


                # Criar sistema PV
                logger.info(f"    Criando sistema PV: {pdc_stc_array}W STC")
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

                logger.debug(f"    Executando ModelChain para {mppt_id}")
                mc.run_model(weather_mppt)

                dc_pre_clipping_mppt = mc.results.dc['p_mp'].fillna(0)
                dc_inv_total_pure += dc_pre_clipping_mppt
                dc_mppt_energy = dc_pre_clipping_mppt.sum() / 1000.0 / n_anos
                logger.info(f"    Energia DC MPPT: {dc_pre_clipping_mppt.sum() / 1000.0:.0f} kWh/ano")

                # ===== NOVO: Calcular AC individual para esta orientação =====
                # Aplicar eficiência e clipping individualmente
                ac_mppt_pre_clipping = np.minimum(dc_pre_clipping_mppt * efficiency_factor, paco_inv)
                
                # Aplicar perdas finais individuais
                perdas_totais_pct = sum(losses_parameters.values())
                perdas_fator = (1.0 - perdas_totais_pct / 100.0)
                ac_mppt_final = ac_mppt_pre_clipping * perdas_fator
                
                # Calcular geração anual individual
                mppt_annual_energy = ac_mppt_final.sum() / 1000.0 / n_anos
                
                # Calcular área utilizada
                total_modulos_mppt = mppt['modules_per_string'] * mppt['strings']
                area_orientacao_m2 = total_modulos_mppt * area_modulo_m2
                
                # Armazenar resultados individuais (criar o array aqui)
                if 'monthly_energy_by_orientation' not in locals():
                    monthly_energy_by_orientation = {}
                
                monthly_energy_by_orientation[mppt_id] = {
                    'nome': mppt_id,
                    'orientacao': mppt['azimuth'],
                    'inclinacao': mppt['tilt'],
                    'potencia_kwp': total_kwp_by_mppt_id[mppt_id],
                    'numero_modulos': total_modulos_mppt,
                    'area_utilizada_m2': area_orientacao_m2,
                    'geracao_anual_kwh': mppt_annual_energy,
                    'percentual_total': None  # Será calculado depois
                }
                
                # Adicionar ao AC total do sistema
                ac_all += ac_mppt_final

            # Removido: O ac_all já é somado individualmente acima
            # dc_pre_clipping_with_eff = dc_inv_total_pure * efficiency_factor
            # ac_inv_output = np.minimum(dc_pre_clipping_with_eff, paco_inv)

            results_inverter[inv_name] = {
                'dc_pure': dc_inv_total_pure,
                'ac_pre_losses': ac_all,  # Usar o ac_all que já foi somado
                'paco_w': paco_inv,
                'kwp': kwp_inv
            }

            # Removido: Já somado individualmente acima
            # ac_all += ac_inv_output
            dc_all_pre_clipping += dc_inv_total_pure
            
            # ac_inv_energy = ac_inv_output.sum() / 1000.0 / n_anos
            # logger.info(f"  Energia AC inversor: {ac_inv_energy:.0f} kWh/ano ({kwp_inv:.2f} kWp)")

        # Aplicar perdas finais (já foram aplicadas individualmente, mas precisamos ajustar o total)
        # Nota: As perdas já foram aplicadas individualmente em cada MPPT, mas mantemos para consistência
        perdas_totais_pct = sum(losses_parameters.values())
        perdas_fator = (1.0 - perdas_totais_pct / 100.0)
        # ac_after_losses = ac_all  # Já com perdas aplicadas individualmente
        ac_after_losses = ac_all  # Já com perdas aplicadas individualmente

        potencia_total_kWp = sum(r['kwp'] for r in results_inverter.values())

        logger.info(f"Aplicando perdas finais: {perdas_totais_pct}% (fator: {perdas_fator:.3f})")

        # Energia total
        annual_energy_kwh = ac_after_losses.sum() / 1000.0 / n_anos
        annual_energy_total_kwh_pre_losses = ac_all.sum() / 1000.0 / n_anos
        annual_energy_dc_kwh = dc_all_pre_clipping.sum() / 1000.0 / n_anos
        
        logger.info(f"Energia anual DC: {annual_energy_dc_kwh:.0f} kWh")
        logger.info(f"Energia anual AC (antes perdas): {annual_energy_total_kwh_pre_losses:.0f} kWh")
        logger.info(f"Energia anual AC (final): {annual_energy_kwh:.0f} kWh")

        # Clipping
        dc_with_eff = dc_all_pre_clipping * efficiency_factor
        dc_with_eff_energy = dc_with_eff.sum() / 1000.0 / n_anos
        perda_clipping_kwh = dc_with_eff_energy - annual_energy_total_kwh_pre_losses
        perda_clipping_pct = (perda_clipping_kwh / dc_with_eff_energy) * 100.0 if dc_with_eff_energy > 0 else 0.0
        
        # if perda_clipping_kwh > 0:
        #     logger.info(f"Perda total por clipping: {perda_clipping_kwh:.0f} kWh/ano ({perda_clipping_pct:.1f}%)")

        # Geração mensal
        monthly_energy_kwh = ac_after_losses.groupby(ac_after_losses.index.month).sum() / 1000.0 / n_anos
        meses_str = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
        monthly_energy_kwh.index = meses_str

        # Calcular percentuais das orientações (após ter o total)
        if 'monthly_energy_by_orientation' in locals():
            for mppt_id in monthly_energy_by_orientation:
                geracao_anual = monthly_energy_by_orientation[mppt_id]['geracao_anual_kwh']
                monthly_energy_by_orientation[mppt_id]['percentual_total'] = (geracao_anual / annual_energy_kwh * 100) if annual_energy_kwh > 0 else 0
        else:
            monthly_energy_by_orientation = {}

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
        
        logger.info(f"Métricas de desempenho:")
        logger.info(f"  Yield específico: {yield_especifico:.0f} kWh/kWp")
        logger.info(f"  Fator de capacidade: {fator_capacidade:.1f}%")
        logger.info(f"  Performance Ratio: {PR_total*100:.1f}%")

        # Consumo
        annual_consumption_kwh = sum(monthly_consumption_kwh)
        cobertura_consumo = (annual_energy_kwh / annual_consumption_kwh * 100) if annual_consumption_kwh > 0 else 0
        
        logger.info(f"Consumo anual: {annual_consumption_kwh:.0f} kWh")
        logger.info(f"Cobertura do consumo: {cobertura_consumo:.1f}%")

        # Resultados por inversor
        inverter_summary = []
        logger.info("Resumo por inversor:")
        for inv_name, data in results_inverter.items():
            ac_final_inv_kwh = (data['ac_pre_losses'] * perdas_fator).sum() / 1000.0 / n_anos
            dc_inv_kwh = data['dc_pure'].sum() / 1000.0 / n_anos
            pr_inv = (ac_final_inv_kwh / dc_inv_kwh) if dc_inv_kwh > 0 else 0
            yield_inv = (ac_final_inv_kwh / data['kwp']) if data['kwp'] > 0 else 0

            logger.info(f"  {inv_name}: {ac_final_inv_kwh:.0f} kWh/ano ({data['kwp']:.2f} kWp) - Yield: {yield_inv:.0f} kWh/kWp, PR: {pr_inv*100:.1f}%")

            inverter_summary.append({
                'Inversor': inv_name,
                'kWp': data['kwp'],
                'Geração AC (kWh/ano)': ac_final_inv_kwh,
                'Yield (kWh/kWp)': yield_inv,
                'PR (%)': pr_inv * 100.0
            })

        logger.info(f"=== Cálculo concluído: {potencia_total_kWp:.2f} kWp, {annual_energy_kwh:,.0f} kWh/ano ===")

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
            'inversores': inverter_summary,
            'geracao_por_orientacao': monthly_energy_by_orientation
        }

    # REMOVIDO: Funções _buscar_dados_nasa e _buscar_dados_pvgis foram removidas
# Agora usamos os serviços com cache: nasa_service.fetch_weather_data() e pvgis_service.fetch_weather_data()
# Isso garante uso do cache geohash e legado já implementado

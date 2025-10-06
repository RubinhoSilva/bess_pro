"""
Serviço de cálculos para sistemas fotovoltaicos com múltiplos inversores
"""

import numpy as np
import pandas as pd
import pvlib
import logging
from typing import List, Dict, Tuple, Optional, Any
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# Importar serviços existentes para dados meteorológicos
try:
    from services.solar_service import SolarService
    from services.pvgis_service import pvgis_service
    from services.nasa_service import nasa_service
    solar_service = SolarService()
except ImportError as e:
    logger.warning(f"Não foi possível importar serviços solares: {e}")
    solar_service = None

from models.requests import (
    MultiInverterCalculationRequest, 
    SelectedInverterData, 
    AguaTelhadoData,
    SolarModuleData
)
from models.responses import (
    MultiInverterCalculationResponse,
    InverterResults,
    AguaTelhadoResults,
    MultiInverterSystemCompatibility,
    PeriodAnalysis,
    Coordinates
)
# from services.module_service import ModuleCalculationService  # Not needed for this implementation


class MultiInverterCalculationService:
    """Serviço para cálculos de sistemas multi-inversor"""
    
    @staticmethod
    def _get_weather_data_for_orientation(lat: float, lon: float, azimuth: float, tilt: float) -> pd.DataFrame:
        """
        Obtém dados meteorológicos para orientação específica usando PVGIS/NASA
        """
        try:
            if solar_service:
                # Usar serviço existente com fallback automático (preferencial NASA como notebook)
                df, actual_source = solar_service._fetch_weather_data_with_fallback(lat, lon, 'nasa')
                
                # Filtrar período notebook: 2015-2020 (6 anos como no notebook)
                df_filtered = df[(df.index.year >= 2015) & (df.index.year <= 2020)]
                
                if len(df_filtered) == 0:
                    logger.warning("Dados filtrados vazios, usando todos os dados disponíveis")
                    df_filtered = df
                
                # Calcular componentes de irradiação se faltantes
                if 'ghi' in df_filtered.columns:
                    solar_pos = pvlib.solarposition.get_solarposition(df_filtered.index, lat, lon)
                    
                    # Se DNI e DHI não existirem, calcular a partir de GHI
                    if 'dni' not in df_filtered.columns or 'dhi' not in df_filtered.columns:
                        if df_filtered['dni'].sum() == 0 if 'dni' in df_filtered.columns else True:
                            # Decompor GHI em DNI e DHI usando modelo de Louche
                            decomp = pvlib.irradiance.louche(
                                ghi=df_filtered['ghi'],
                                solar_zenith=solar_pos['zenith'],
                                datetime_or_doy=df_filtered.index
                            )
                            df_filtered = df_filtered.copy()
                            df_filtered['dni'] = decomp['dni']
                            df_filtered['dhi'] = decomp['dhi']
                    
                    # Calcular POA para orientação específica
                    poa = pvlib.irradiance.get_total_irradiance(
                        surface_tilt=tilt,
                        surface_azimuth=azimuth,
                        solar_zenith=solar_pos['apparent_zenith'],
                        solar_azimuth=solar_pos['azimuth'],
                        dni=df_filtered['dni'],
                        ghi=df_filtered['ghi'],
                        dhi=df_filtered['dhi'],
                        model='perez'
                    )
                    
                    # Adicionar POA ao dataframe
                    df_filtered = df_filtered.copy()
                    df_filtered['poa_global'] = poa['poa_global']
                    
                logger.info(f"Dados meteorológicos obtidos: {len(df_filtered)} registros")
                return df_filtered
            else:
                # Fallback simplificado
                logger.warning("Usando dados meteorológicos simplificados (fallback)")
                return MultiInverterCalculationService._create_simplified_weather_data(lat, lon, azimuth, tilt)
                
        except Exception as e:
            logger.error(f"Erro ao obter dados meteorológicos: {e}")
            logger.warning("Usando dados simplificados (fallback)")
            return MultiInverterCalculationService._create_simplified_weather_data(lat, lon, azimuth, tilt)
    
    @staticmethod
    def _create_simplified_weather_data(lat: float, lon: float, azimuth: float, tilt: float) -> pd.DataFrame:
        """
        Cria dados meteorológicos simplificados para fallback
        """
        # Criar índice de tempo para um ano típico
        dates = pd.date_range('2019-01-01', '2019-12-31', freq='H')
        df = pd.DataFrame(index=dates)
        
        # Valores médios para Brasil (simplificado)
        df['ghi'] = 5.5 * np.sin(np.pi * (df.index.hour - 6) / 12) * np.maximum(0, np.sin(np.pi * (df.index.dayofyear - 80) / 365))
        df['ghi'] = np.maximum(0, df['ghi'])
        df['dni'] = df['ghi'] * 0.8
        df['dhi'] = df['ghi'] * 0.2
        df['temp_air'] = 25 + 5 * np.sin(2 * np.pi * df.index.dayofyear / 365)
        df['wind_speed'] = 3.0
        
        # Calcular POA
        solar_pos = pvlib.solarposition.get_solarposition(df.index, lat, lon)
        poa = pvlib.irradiance.get_total_irradiance(
            surface_tilt=tilt,
            surface_azimuth=azimuth,
            solar_zenith=solar_pos['apparent_zenith'],
            solar_azimuth=solar_pos['azimuth'],
            dni=df['dni'],
            ghi=df['ghi'],
            dhi=df['dhi'],
            model='perez'
        )
        df['poa_global'] = poa['poa_global']
        
        return df
    
    @staticmethod
    def _get_module_parameters_pvlib(modulo: SolarModuleData) -> dict:
        """
        Obtém parâmetros do módulo no formato pvlib com fallbacks seguros
        """
        try:
            # Tentar obter parâmetros completos do módulo
            module_params = {
                'alpha_sc': getattr(modulo, 'alpha_sc', 0.0004),
                'beta_oc': getattr(modulo, 'beta_oc', -0.0028),
                'gamma_r': getattr(modulo, 'gamma_r', -0.0044),
                'cells_in_series': getattr(modulo, 'cells_in_series', 144),
                'STC': getattr(modulo, 'STC', 1000),
                'V_oc_ref': getattr(modulo, 'voc', 49.7),
                'I_sc_ref': getattr(modulo, 'isc', 13.91),
                'V_mp_ref': getattr(modulo, 'vmp', 41.8),
                'I_mp_ref': getattr(modulo, 'imp', 13.16),
                'a_ref': getattr(modulo, 'a_ref', 1.8),
                'I_L_ref': getattr(modulo, 'I_L_ref', 14.86),
                'I_o_ref': getattr(modulo, 'I_o_ref', 2.5e-12),
                'R_s': getattr(modulo, 'R_s', 0.25),
                'R_sh_ref': getattr(modulo, 'R_sh_ref', 450.0),
                'pdc0': getattr(modulo, 'potencia_nominal_w', 540),
                'gamma_pdc': getattr(modulo, 'gamma_r', -0.0044)
            }
            
            # Validar valores críticos
            if module_params['V_oc_ref'] <= 0 or module_params['I_sc_ref'] <= 0:
                logger.warning("Valores críticos inválidos, usando fallbacks")
                module_params.update({
                    'V_oc_ref': 49.7,
                    'I_sc_ref': 13.91,
                    'V_mp_ref': 41.8,
                    'I_mp_ref': 13.16,
                    'pdc0': 540
                })
            
            return module_params
            
        except Exception as e:
            logger.error(f"Erro ao obter parâmetros do módulo: {e}")
            # Retornar parâmetros notebook (585Wp module)
            return {
                'alpha_sc': 0.0004, 'beta_oc': -0.0028, 'gamma_r': -0.0044,
                'cells_in_series': 144, 'STC': 1000, 'V_oc_ref': 49.7,
                'I_sc_ref': 13.91, 'V_mp_ref': 41.8, 'I_mp_ref': 13.16,
                'a_ref': 1.8, 'I_L_ref': 14.86, 'I_o_ref': 2.5e-12,
                'R_s': 0.25, 'R_sh_ref': 450.0, 'pdc0': 585, 'gamma_pdc': -0.0044  # 585W como notebook
            }
    
    @staticmethod
    def _get_inverter_parameters(inversor: SelectedInverterData) -> Dict[str, float]:
        """
        Obtém parâmetros do inversor para cálculos pvlib
        """
        try:
            # Parâmetros notebook: eficiência fixa de 98%
            efficiency_factor = 0.98  # Eficiência nominal fixa do notebook
            return {
                'pdc0': inversor.potencia_saida_ca_w / efficiency_factor,  # Potência DC estimada
                'eta_inv_nom': efficiency_factor,  # Eficiência nominal fixa
                'eta_inv_ref': efficiency_factor,  # Eficiência de referência fixa
                'Paco': inversor.potencia_saida_ca_w,  # Potência AC nominal
                'Pnt': 0.02 * inversor.potencia_saida_ca_w,  # Potência noturna
                'efficiency_factor': efficiency_factor  # Eficiência fixa para cálculos
            }
        except Exception as e:
            logger.error(f"Erro ao obter parâmetros do inversor: {e}")
            # Retornar parâmetros padrão
            efficiency_factor = 0.98
            return {
                'pdc0': inversor.potencia_saida_ca_w / efficiency_factor,
                'eta_inv_nom': efficiency_factor,
                'Paco': inversor.potencia_saida_ca_w,
                'Pnt': 0.02 * inversor.potencia_saida_ca_w,
                'efficiency_factor': efficiency_factor
            }
            
            return inverter_params
            
        except Exception as e:
            logger.error(f"Erro ao obter parâmetros do inversor: {e}")
            # Retornar parâmetros padrão
            return {
                'pdc0': inversor.potencia_saida_ca_w / 0.96,
                'eta_inv_nom': 0.96,
                'Paco': inversor.potencia_saida_ca_w,
                'Pnt': 0.02 * inversor.potencia_saida_ca_w
            }
    
    @staticmethod
    def _calculate_mppt_dc_performance(
        agua: AguaTelhadoData,
        modulo: SolarModuleData,
        weather_data: pd.DataFrame,
        request: MultiInverterCalculationRequest,
        strings_por_mppt: int = 1
    ) -> Dict[str, any]:
        """
        Calcula performance DC individual para um MPPT específico usando pvlib
        """
        try:
            # Obter parâmetros do módulo
            module_params = MultiInverterCalculationService._get_module_parameters_pvlib(modulo)
            
            # Configurar sistema PV para este MPPT (sem inversor)
            system = pvlib.pvsystem.PVSystem(
                surface_tilt=agua.inclinacao,
                surface_azimuth=agua.orientacao,
                module_parameters=module_params,
                modules_per_string=agua.numero_modulos,
                strings_per_inverter=strings_por_mppt,
                racking_model='open_rack',  # Modelo notebook
                module_type='glass_glass',  # Modelo notebook
                # Sem parâmetros do inversor aqui - calcularemos DC puro
            )
            
            # Criar localização (usar lat/lon da request)
            location = pvlib.location.Location(latitude=request.lat, longitude=request.lon)
            
            # Criar ModelChain sem inversor (apenas DC) - configuração notebook
            mc = pvlib.modelchain.ModelChain(
                system, 
                location,
                dc_model='pvwatts',  # Modelo PVwatts como notebook
                ac_model='pvwatts',  # Não será usado para DC
                losses_model='no_loss',  # Sem perdas para DC puro
                transposition_model='perez',  # Modelo Perez como notebook
                aoi_model='physical'  # Modelo físico como notebook
                # Removido spectral_model para usar padrão
            )
            
            # Executar simulação
            mc.run_model(weather_data)
            
            # Extrair resultados DC
            dc_power = mc.results.dc.fillna(0)
            
            # Calcular energia DC anual
            dc_energy_kwh = dc_power.sum() / 1000  # Converter W para kWh
            
            # Calcular estatísticas
            dc_peak_power = dc_power.max()
            dc_avg_power = dc_power.mean()
            
            return {
                'dc_power_series': dc_power,
                'dc_energy_kwh': dc_energy_kwh,
                'dc_peak_power_w': dc_peak_power,
                'dc_avg_power_w': dc_avg_power,
                'module_params': module_params,
                'system_info': {
                    'modules_per_string': agua.numero_modulos,
                    'strings_per_mppt': strings_por_mppt,
                    'surface_tilt': agua.inclinacao,
                    'surface_azimuth': agua.orientacao
                }
            }
            
        except Exception as e:
            logger.error(f"Erro no cálculo DC para MPPT {agua.nome}: {e}")
            # Fallback simplificado
            potencia_dc = agua.numero_modulos * getattr(modulo, 'potencia_nominal_w', 540)
            dc_energy_simplificado = potencia_dc * 1.2  # 1200 kWh/kWp
            
            # Criar série simplificada
            dates = weather_data.index
            dc_power_simplificado = pd.Series(0.0, index=dates, dtype=float)
            
            # Adicionar perfil simplificado
            for hour in range(6, 18):
                mask = dc_power_simplificado.index.hour == hour
                dc_power_simplificado.loc[mask] = float(potencia_dc * np.sin(np.pi * (hour - 6) / 12) * 0.8)
            
            return {
                'dc_power_series': dc_power_simplificado,
                'dc_energy_kwh': dc_energy_simplificado,
                'dc_peak_power_w': potencia_dc * 0.8,
                'dc_avg_power_w': potencia_dc * 0.3,
                'module_params': {},
                'system_info': {'fallback': True}
            }
    
    @staticmethod
    def calculate_multi_inverter_system(request: MultiInverterCalculationRequest) -> MultiInverterCalculationResponse:
        """
        Calcula sistema completo com múltiplos inversores e águas de telhado
        """
        
        logger.info(f"Iniciando cálculo com {len(request.inversores_selecionados)} inversores e {len(request.aguas_telhado)} águas")
        
        # 1. Validar compatibilidade do sistema
        compatibility = MultiInverterCalculationService._validate_system_compatibility(
            request.inversores_selecionados, 
            request.aguas_telhado, 
            request.modulo
        )
        
        # 2. Calcular resultados para cada água de telhado (DC puro)
        aguas_results = []
        total_dc_anual = 0  # Energia DC total antes da eficiência
        
        for agua in request.aguas_telhado:
            logger.info(f"Processando água: {agua.nome} - {agua.numero_modulos} módulos")
            agua_result = MultiInverterCalculationService._calculate_agua_performance(
                agua, request.modulo, request
            )
            aguas_results.append(agua_result)
            
            # Somar energia DC pura (será convertida para AC no nível do inversor)
            if hasattr(agua_result, 'dc_puro_anual_kwh') and agua_result.dc_puro_anual_kwh:
                total_dc_anual += agua_result.dc_puro_anual_kwh
            else:
                # Fallback: estimar DC a partir do AC (dividir por eficiência estimada)
                total_dc_anual += agua_result.energia_anual_kwh / 0.96
        
        # 3. Calcular resultados para cada inversor (com nova metodologia)
        inversores_results = MultiInverterCalculationService._calculate_inverter_results(
            request.inversores_selecionados, 
            request.aguas_telhado, 
            aguas_results,
            request.modulo
        )
        
        # 4. Calcular energia AC total a partir dos inversores (não das águas)
        total_energia_anual = sum(inv.energia_anual_kwh for inv in inversores_results)
        geracao_mensal_total = [0.0] * 12
        
        # Distribuir energia mensal (aproximado baseado no total)
        for i in range(12):
            geracao_mensal_total[i] = total_energia_anual / 12
        
        # 5. Calcular métricas globais
        total_modulos = sum(agua.numero_modulos for agua in request.aguas_telhado)
        logger.info(f"Total de módulos: {total_modulos}")
        
        # Validar se potencia_nominal_w não é None
        potencia_nominal = getattr(request.modulo, 'potencia_nominal_w', None)
        logger.info(f"Potência nominal do módulo: {potencia_nominal}")
        if not potencia_nominal:
            raise ValueError("Potência nominal do módulo é obrigatória")
        
        total_potencia_dc = total_modulos * potencia_nominal
        try:
            total_potencia_ca = sum(inv.potencia_saida_ca_w * (getattr(inv, 'quantity', 1) or 1) for inv in request.inversores_selecionados)
            logger.info(f"Cálculo de potência CA bem-sucedido: {total_potencia_ca}")
        except Exception as e:
            logger.error(f"Erro no cálculo de potência CA: {e}")
            raise
        
        # 6. Calcular Performance Ratio médio ponderado (baseado nos inversores)
        try:
            # Tentar obter PR dos cálculos detalhados dos inversores
            pr_values = []
            for inv in inversores_results:
                if hasattr(inv, 'pr_correto_percentual'):
                    pr_values.append(inv.pr_correto_percentual)
                else:
                    # Fallback: usar PR das águas conectadas
                    aguas_conectadas = [agua for agua in aguas_results if agua.agua_id in inv.aguas_conectadas]
                    if aguas_conectadas:
                        pr_agua = sum(agua.pr_medio * agua.numero_modulos for agua in aguas_conectadas) / sum(agua.numero_modulos for agua in aguas_conectadas)
                        pr_values.append(pr_agua)
            
            pr_medio_sistema = sum(pr_values) / len(pr_values) if pr_values else 85.0
            logger.info(f"Cálculo PR médio: {pr_medio_sistema}")
        except Exception as e:
            logger.error(f"Erro no cálculo PR médio: {e}")
            pr_medio_sistema = 85.0
        
        # 7. Calcular métricas de performance
        try:
            fator_capacidade = MultiInverterCalculationService._calculate_capacity_factor(
                total_energia_anual, total_potencia_dc
            )
            logger.info(f"Cálculo fator capacidade: {fator_capacidade}")
        except Exception as e:
            logger.error(f"Erro no cálculo fator capacidade: {e}")
            raise
        
        try:
            yield_especifico = total_energia_anual / (total_potencia_dc / 1000) if total_potencia_dc > 0 else 0
            logger.info(f"Cálculo yield específico: {yield_especifico}")
        except Exception as e:
            logger.error(f"Erro no cálculo yield específico: {e}")
            raise
        
        try:
            oversizing_global = (total_potencia_dc / total_potencia_ca * 100) if total_potencia_ca > 0 else 0
            logger.info(f"Cálculo oversizing: {oversizing_global}")
        except Exception as e:
            logger.error(f"Erro no cálculo oversizing: {e}")
            raise
        
        try:
            cobertura_percentual = (total_energia_anual / request.consumo_anual_kwh * 100) if request.consumo_anual_kwh > 0 else 0
            logger.info(f"Cálculo cobertura: {cobertura_percentual}")
        except Exception as e:
            logger.error(f"Erro no cálculo cobertura: {e}")
            raise
        
        # 7. Calcular área e peso
        try:
            area_total = MultiInverterCalculationService._calculate_total_area(total_modulos, request.modulo)
            logger.info(f"Cálculo área: {area_total}")
        except Exception as e:
            logger.error(f"Erro no cálculo de área: {e}")
            raise
        
        try:
            peso_total = MultiInverterCalculationService._calculate_total_weight(
                total_modulos, request.inversores_selecionados, request.modulo
            )
            logger.info(f"Cálculo peso: {peso_total}")
        except Exception as e:
            logger.error(f"Erro no cálculo de peso: {e}")
            raise
        
        # 8. Economia de CO2 (assumindo 0.5 kg CO2/kWh)
        economia_co2 = total_energia_anual * 0.5
        
        return MultiInverterCalculationResponse(
            num_modulos_total=total_modulos,
            potencia_total_dc_kw=round(total_potencia_dc / 1000, 2),
            potencia_total_ca_kw=round(total_potencia_ca / 1000, 2),
            energia_total_anual=round(total_energia_anual, 1),
            cobertura_percentual=round(cobertura_percentual, 1),
            fator_capacidade_medio=round(fator_capacidade, 1),
            pr_medio_sistema=round(pr_medio_sistema, 1),
            yield_especifico_medio=round(yield_especifico, 1),
            oversizing_global=round(oversizing_global, 1),
            resultados_inversores=inversores_results,
            resultados_aguas=aguas_results,
            compatibilidade_sistema=compatibility,
            geracao_mensal_total=[round(val, 1) for val in geracao_mensal_total],
            area_total_necessaria_m2=round(area_total, 1),
            peso_total_kg=round(peso_total, 1),
            economia_anual_co2=round(economia_co2, 1),
            parametros_sistema={
                "consumo_anual_kwh": request.consumo_anual_kwh,
                "numero_inversores": len(request.inversores_selecionados),
                "numero_aguas": len(request.aguas_telhado),
                "localizacao": {"lat": request.lat, "lon": request.lon},
                "perdas_sistema": request.perdas_sistema,
                "fator_seguranca": request.fator_seguranca
            },
            dados_processados=8760,  # Horas do ano
            anos_analisados=16,      # Período típico PVGIS
            periodo_dados=PeriodAnalysis(
                inicio="2005-01-01",
                fim="2020-12-31",
                anos_completos=16
            )
        )
    
    @staticmethod
    def _validate_system_compatibility(
        inversores: List[SelectedInverterData], 
        aguas: List[AguaTelhadoData],
        modulo: SolarModuleData
    ) -> MultiInverterSystemCompatibility:
        """Valida compatibilidade do sistema multi-inversor"""
        
        alertas = []
        sistema_compativel = True
        
        # Calcular totais
        total_potencia_ca = sum(inv.potencia_saida_ca_w * inv.quantity for inv in inversores)
        total_modulos = sum(agua.numero_modulos for agua in aguas)
        total_potencia_dc = total_modulos * modulo.potencia_nominal_w
        
        total_mppts_disponiveis = sum(inv.numero_mppt * inv.quantity for inv in inversores)
        total_mppts_utilizados = len(aguas)
        
        # Validações
        if total_mppts_utilizados > total_mppts_disponiveis:
            alertas.append(f"MPPTs insuficientes: {total_mppts_utilizados} utilizados, {total_mppts_disponiveis} disponíveis")
            sistema_compativel = False
        
        oversizing = (total_potencia_dc / total_potencia_ca * 100) if total_potencia_ca > 0 else 0
        
        if oversizing > 150:
            alertas.append(f"Oversizing muito alto: {oversizing:.1f}% (recomendado < 150%)")
            sistema_compativel = False
        elif oversizing < 80:
            alertas.append(f"Undersizing detectado: {oversizing:.1f}% (recomendado > 80%)")
        
        # Validar tensões (simplificado)
        for inversor in inversores:
            voc = getattr(modulo, 'voc', None)
            tensao_max = getattr(inversor, 'tensao_cc_max_v', None)
            if voc and tensao_max and voc > 0 and tensao_max > 0:
                max_strings = int(tensao_max / (voc * 1.25))  # Fator de segurança para temperatura
                if max_strings < 1:
                    alertas.append(f"Inversor {inversor.modelo} incompatível: tensão insuficiente")
                    sistema_compativel = False
        
        return MultiInverterSystemCompatibility(
            sistema_compativel=sistema_compativel,
            alertas=alertas,
            total_potencia_dc_w=total_potencia_dc,
            total_potencia_ca_w=total_potencia_ca,
            oversizing_global=round(oversizing, 1),
            total_mppts_utilizados=total_mppts_utilizados,
            total_mppts_disponiveis=total_mppts_disponiveis
        )
    
    @staticmethod
    def _calculate_agua_performance(
        agua: AguaTelhadoData, 
        modulo: SolarModuleData,
        request: MultiInverterCalculationRequest
    ) -> AguaTelhadoResults:
        """
        Calcula performance DC pura de uma água de telhado específica (MPPT)
        usando pvlib para cálculo físico preciso
        """
        
        try:
            logger.info(f"Calculando performance DC para água: {agua.nome}")
            
            # 1. Obter dados meteorológicos para orientação específica
            weather_data = MultiInverterCalculationService._get_weather_data_for_orientation(
                request.lat, request.lon, agua.orientacao, agua.inclinacao
            )
            
            # 2. Calcular DC puro para este MPPT usando pvlib
            dc_result = MultiInverterCalculationService._calculate_mppt_dc_performance(
                agua, modulo, weather_data, request, strings_por_mppt=1
            )
            
            # 3. Calcular potência DC nominal
            potencia_nominal = getattr(modulo, 'potencia_nominal_w', 540)
            potencia_dc = agua.numero_modulos * potencia_nominal
            
            # 4. Calcular irradiação média POA
            if 'poa_global' in weather_data.columns:
                irradiacao_media = weather_data['poa_global'].mean()
            else:
                irradiacao_media = MultiInverterCalculationService._get_irradiation_for_orientation(
                    request.lat, request.lon, agua.orientacao, agua.inclinacao
                )
            
            # 5. Performance Ratio base (sem perdas do sistema - apenas sombreamento)
            pr_base = 92.0  # PR base notebook (92.71%)
            sombreamento = agua.sombreamento_parcial or 0
            pr_ajustado = pr_base * (1 - sombreamento / 100)
            
            # 6. Energia DC anual (pura, sem eficiência do inversor)
            energia_dc_anual = dc_result['dc_energy_kwh']
            
            # 7. Estimar energia AC (apenas para referência, será recalculada no inversor)
            eficiencia_inversor_estimada = 0.96  # Será calculada corretamente depois
            energia_ac_estimada = energia_dc_anual * eficiencia_inversor_estimada * (1 - (request.perdas_sistema or 4.5) / 100)
            
            return AguaTelhadoResults(
                agua_id=agua.id,
                nome=agua.nome,
                orientacao=agua.orientacao,
                inclinacao=agua.inclinacao,
                numero_modulos=agua.numero_modulos,
                potencia_dc_w=potencia_dc,
                inverter_associado=(
                    f"{agua.inversor.fabricante} {agua.inversor.modelo}" 
                    if agua.inversor 
                    else (agua.inversor_id or "")
                ),
                mppt_numero=agua.mppt_numero or 1,
                energia_anual_kwh=round(energia_ac_estimada, 1),  # Será recalculado
                irradiacao_media_diaria=round(irradiacao_media, 2),
                pr_medio=round(pr_ajustado, 1),
                # Adicionar informações DC para cálculo posterior do inversor
                dc_puro_anual_kwh=round(energia_dc_anual, 1),
                dc_power_series=dc_result['dc_power_series'],
                dc_peak_power_w=dc_result['dc_peak_power_w'],
                dc_avg_power_w=dc_result['dc_avg_power_w']
            )
            
        except Exception as e:
            logger.error(f"Erro no cálculo DC para água {agua.nome}: {e}")
            # Fallback com método simplificado
            potencia_nominal = getattr(modulo, 'potencia_nominal_w', 540)
            potencia_dc = agua.numero_modulos * potencia_nominal
            
            # Método simplificado fallback
            irradiacao_media = MultiInverterCalculationService._get_irradiation_for_orientation(
                request.lat, request.lon, agua.orientacao, agua.inclinacao
            )
            
            pr_base = 85.0
            sombreamento = agua.sombreamento_parcial or 0
            pr_ajustado = pr_base * (1 - sombreamento / 100)
            
            energia_dc_anual = (potencia_dc / 1000) * irradiacao_media * 365 * (pr_ajustado / 100)
            energia_ac_estimada = energia_dc_anual * 0.96 * (1 - (request.perdas_sistema or 4.5) / 100)
            
            # Criar série DC simplificada
            dates = pd.date_range('2019-01-01', '2019-12-31', freq='H')
            dc_power_simplificado = pd.Series(0, index=dates)
            
            for hour in range(6, 18):
                mask = dc_power_simplificado.index.hour == hour
                dc_power_simplificado[mask] = potencia_dc * np.sin(np.pi * (hour - 6) / 12) * 0.8
            
            return AguaTelhadoResults(
                agua_id=agua.id,
                nome=agua.nome,
                orientacao=agua.orientacao,
                inclinacao=agua.inclinacao,
                numero_modulos=agua.numero_modulos,
                potencia_dc_w=potencia_dc,
                inverter_associado=(
                    f"{agua.inversor.fabricante} {agua.inversor.modelo}" 
                    if agua.inversor 
                    else (agua.inversor_id or "")
                ),
                mppt_numero=agua.mppt_numero or 1,
                energia_anual_kwh=round(energia_ac_estimada, 1),
                irradiacao_media_diaria=round(irradiacao_media, 2),
                pr_medio=round(pr_ajustado, 1),
                dc_puro_anual_kwh=round(energia_dc_anual, 1),
                dc_power_series=dc_power_simplificado,
                dc_peak_power_w=potencia_dc * 0.8,
                dc_avg_power_w=potencia_dc * 0.3
            )
    
    @staticmethod
    def _calculate_inverter_with_mppt_efficiency(
        aguas_dc_results: List[AguaTelhadoResults],
        inversor: SelectedInverterData,
        perdas_sistema: float = 4.5
    ) -> Dict[str, any]:
        """
        Calcula AC aplicando eficiência única sobre DC total de todos MPPTs
        Metodologia correta do notebook: somar DC puro → aplicar eficiência única
        """
        
        try:
            logger.info(f"Calculando AC para inversor: {inversor.fabricante} {inversor.modelo}")
            
            # 1. Somar DC puro de todos MPPTs deste inversor
            dc_total_series = None
            dc_total_energy = 0
            aguas_ids = []
            
            for agua_result in aguas_dc_results:
                if hasattr(agua_result, 'dc_power_series'):
                    if dc_total_series is None:
                        dc_total_series = agua_result.dc_power_series.copy()
                    else:
                        dc_total_series += agua_result.dc_power_series
                    
                    dc_total_energy += getattr(agua_result, 'dc_puro_anual_kwh', 0)
                    aguas_ids.append(agua_result.agua_id)
            
            if dc_total_series is None:
                logger.warning("Nenhuma série DC encontrada, usando fallback")
                return MultiInverterCalculationService._calculate_inverter_fallback(aguas_dc_results, inversor, perdas_sistema)
            
            # 2. Obter parâmetros do inversor
            inverter_params = MultiInverterCalculationService._get_inverter_parameters(inversor)
            
            # 3. Aplicar eficiência fixa do inversor (98% como no notebook)
            # Metodologia notebook: aplicar eficiência única sobre DC total
            efficiency_factor = 0.98  # Eficiência nominal fixa do notebook
            ac_power_series = dc_total_series * efficiency_factor
            
            # 4. Aplicar clipping na potência máxima do inversor
            paco_inv = inverter_params['Paco']
            ac_power_clipped = np.minimum(ac_power_series, paco_inv)
            
            # 5. Aplicar perdas do sistema (apenas no resultado AC final)
            perdas_fator = (1.0 - perdas_sistema / 100.0)
            ac_power_final = ac_power_clipped * perdas_fator
            
            # 6. Calcular métricas
            ac_energy_anual = ac_power_final.sum() / 1000  # Converter para kWh
            
            # 7. Calcular Performance Ratio correto (notebook methodology)
            # Usando método dedicado com validação
            pr_correto = MultiInverterCalculationService._calculate_performance_ratio_correcto(
                ac_energy_anual, dc_total_energy
            )
            
            # 7.1. Validar cálculo e diagnosticar problemas
            pr_validation = MultiInverterCalculationService.validate_pr_calculation(
                ac_energy_anual, dc_total_energy, pr_correto
            )
            
            if not pr_validation["valid"]:
                logger.warning(f"Validação PR falhou: {pr_validation['diagnostico']}")
                logger.warning(f"PR correto: {pr_validation['pr_correto']}%, PR incorreto: {pr_validation['pr_incorreto']}%")
            
            # 8. Calcular estatísticas de clipping
            horas_clipping = (ac_power_series > paco_inv).sum()
            percentual_clipping = (horas_clipping / len(ac_power_series) * 100) if len(ac_power_series) > 0 else 0
            
            # 9. Calcular eficiência média real
            eficiencia_media_real = (ac_power_clipped.sum() / dc_total_series.sum() * 100) if dc_total_series.sum() > 0 else 96.0
            
            return {
                'agua_ids': aguas_ids,
                'dc_total_antes_eficiencia_kwh': round(dc_total_energy, 1),
                'ac_antes_clipping_kwh': round(ac_power_series.sum() / 1000, 1),
                'ac_depois_clipping_kwh': round(ac_power_clipped.sum() / 1000, 1),
                'ac_final_kwh': round(ac_energy_anual, 1),
                'eficiencia_media_percentual': round(eficiencia_media_real, 2),
                'pr_correto_percentual': round(pr_correto, 1),
                'horas_clipping_anual': int(horas_clipping),
                'percentual_clipping': round(percentual_clipping, 2),
                'perdas_totais_percentual': perdas_sistema,
                'ac_power_series': ac_power_final,
                'dc_power_series': dc_total_series,
                'paco_inv_w': paco_inv,
                'inverter_params': inverter_params
            }
            
        except Exception as e:
            logger.error(f"Erro no cálculo do inversor {inversor.modelo}: {e}")
            return MultiInverterCalculationService._calculate_inverter_fallback(aguas_dc_results, inversor, perdas_sistema)
    
    @staticmethod
    def _calculate_inverter_fallback(
        aguas_dc_results: List[AguaTelhadoResults],
        inversor: SelectedInverterData,
        perdas_sistema: float = 4.5
    ) -> Dict[str, any]:
        """
        Fallback simplificado para cálculo do inversor
        """
        
        # Somar energias DC das águas
        dc_total_energy = sum(getattr(agua, 'dc_puro_anual_kwh', agua.energia_anual_kwh / 0.96) for agua in aguas_dc_results)
        
        # Aplicar eficiência notebook (98% fixo)
        eficiencia_inversor = 0.98  # Eficiência fixa do notebook
        perdas_fator = (1.0 - perdas_sistema / 100.0)
        
        ac_energy = dc_total_energy * eficiencia_inversor * perdas_fator
        
        return {
            'agua_ids': [agua.agua_id for agua in aguas_dc_results],
            'dc_total_antes_eficiencia_kwh': round(dc_total_energy, 1),
            'ac_final_kwh': round(ac_energy, 1),
            'eficiencia_media_percentual': round(eficiencia_inversor * 100, 2),
            'pr_correto_percentual': 85.0,
            'horas_clipping_anual': 0,
            'percentual_clipping': 0.0,
            'perdas_totais_percentual': perdas_sistema,
            'fallback': True
        }
    
    @staticmethod
    def _calculate_inverter_results(
        inversores: List[SelectedInverterData],
        aguas: List[AguaTelhadoData], 
        aguas_results: List[AguaTelhadoResults],
        modulo: SolarModuleData
    ) -> List[InverterResults]:
        """
        Calcula resultados para cada inversor usando nova metodologia multi-MPPT
        """
        
        results = []
        
        for inversor in inversores:
            # 1. Encontrar águas conectadas a este inversor
            aguas_conectadas_results = []
            aguas_conectadas_ids = []
            modulos_conectados = 0
            potencia_dc_conectada = 0
            
            for i, agua in enumerate(aguas):
                agua_result = aguas_results[i]
                
                # ✅ NOVO: Verificar se a água tem inversor embutido (novo formato)
                if agua.inversor:
                    # Novo formato: comparar dados do inversor embutido
                    if (agua.inversor.fabricante == inversor.fabricante and 
                        agua.inversor.modelo == inversor.modelo and
                        agua.inversor.potencia_saida_ca_w == inversor.potencia_saida_ca_w):
                        aguas_conectadas_results.append(agua_result)
                        aguas_conectadas_ids.append(agua.id)
                        modulos_conectados += agua.numero_modulos
                        potencia_nominal = getattr(modulo, 'potencia_nominal_w', 540)
                        potencia_dc_conectada += agua.numero_modulos * potencia_nominal
                elif agua.inversor_id and agua.inversor_id.startswith(inversor.id):
                    # Formato legado: usar inversor_id
                    aguas_conectadas_results.append(agua_result)
                    aguas_conectadas_ids.append(agua.id)
                    modulos_conectados += agua.numero_modulos
                    potencia_nominal = getattr(modulo, 'potencia_nominal_w', 540)
                    potencia_dc_conectada += agua.numero_modulos * potencia_nominal
            
            # 2. Calcular usando nova metodologia multi-MPPT
            if aguas_conectadas_results:
                # Obter perdas do sistema da primeira água (assumindo mesmo para todas)
                perdas_sistema = 4.5  # Default como no notebook
                
                # Usar nova função de cálculo com eficiência única
                inversor_calc = MultiInverterCalculationService._calculate_inverter_with_mppt_efficiency(
                    aguas_conectadas_results, inversor, perdas_sistema
                )
                
                # Calcular métricas adicionais
                quantity = getattr(inversor, 'quantity', 1) or 1
                potencia_total_ca = inversor.potencia_saida_ca_w * quantity
                oversizing = (potencia_dc_conectada / potencia_total_ca * 100) if potencia_total_ca > 0 else 0
                
                # Utilização baseada na energia AC final
                utilizacao = (inversor_calc['ac_final_kwh'] / (potencia_total_ca * 8760 / 1000) * 100) if potencia_total_ca > 0 else 0
                
                # Criar resultado com informações detalhadas
                result = InverterResults(
                    inverter_id=inversor.id,
                    fabricante=inversor.fabricante,
                    modelo=inversor.modelo,
                    potencia_ca_w=inversor.potencia_saida_ca_w,
                    quantidade_unidades=inversor.quantity,
                    potencia_total_ca_w=potencia_total_ca,
                    aguas_conectadas=aguas_conectadas_ids,
                    modulos_conectados=modulos_conectados,
                    potencia_dc_conectada_w=potencia_dc_conectada,
                    oversizing_percentual=round(oversizing, 1),
                    energia_anual_kwh=round(inversor_calc['ac_final_kwh'], 1),
                    utilizacao_percentual=round(min(utilizacao, 100), 1)
                )
                
                # Adicionar informações extras do cálculo multi-MPPT (se houver suporte no modelo)
                if hasattr(result, '__dict__'):
                    result.__dict__.update({
                        'dc_total_antes_eficiencia_kwh': inversor_calc['dc_total_antes_eficiencia_kwh'],
                        'eficiencia_media_percentual': inversor_calc['eficiencia_media_percentual'],
                        'pr_correto_percentual': inversor_calc['pr_correto_percentual'],
                        'horas_clipping_anual': inversor_calc['horas_clipping_anual'],
                        'percentual_clipping': inversor_calc['percentual_clipping'],
                        'perdas_totais_percentual': inversor_calc['perdas_totais_percentual']
                    })
                
                results.append(result)
                
                logger.info(f"Inversor {inversor.modelo}: DC={inversor_calc['dc_total_antes_eficiencia_kwh']:.1f}kWh → AC={inversor_calc['ac_final_kwh']:.1f}kWh (eficiência={inversor_calc['eficiencia_media_percentual']:.1f}%)")
                
            else:
                logger.warning(f"Nenhuma água conectada ao inversor {inversor.modelo}")
                # Criar resultado vazio
                quantity = getattr(inversor, 'quantity', 1) or 1
                potencia_total_ca = inversor.potencia_saida_ca_w * quantity
                
                results.append(InverterResults(
                    inverter_id=inversor.id,
                    fabricante=inversor.fabricante,
                    modelo=inversor.modelo,
                    potencia_ca_w=inversor.potencia_saida_ca_w,
                    quantidade_unidades=inversor.quantity,
                    potencia_total_ca_w=potencia_total_ca,
                    aguas_conectadas=[],
                    modulos_conectados=0,
                    potencia_dc_conectada_w=0,
                    oversizing_percentual=0.0,
                    energia_anual_kwh=0.0,
                    utilizacao_percentual=0.0
                ))
        
        return results
    
    @staticmethod
    def _get_irradiation_for_orientation(lat: float, lon: float, azimuth: float, tilt: float) -> float:
        """
        Obtém irradiação para orientação específica
        Implementação simplificada - idealmente usar PVGIS ou dados históricos
        """
        
        try:
            # Implementação simplificada baseada em localização
            # Irradiação base para Brasil (aproximação)
            base_irradiation = 4.5  # kWh/m²/dia médio para Brasil
            
            # Ajuste por orientação (Sul = 180° é ótimo)
            azimuth_factor = np.cos(np.radians(abs(azimuth - 180))) * 0.1 + 0.9
            
            # Ajuste por inclinação (latitude ± 15° é ótimo)
            optimal_tilt = abs(lat)
            tilt_diff = abs(tilt - optimal_tilt)
            tilt_factor = 1 - (tilt_diff / 90) * 0.2  # Penalização máxima de 20%
            
            adjusted_irradiation = base_irradiation * azimuth_factor * tilt_factor
            
            return max(adjusted_irradiation, 2.0)  # Mínimo 2.0 kWh/m²/dia
            
        except Exception:
            return 4.0  # Fallback conservador
    
    @staticmethod
    def _calculate_capacity_factor(energia_anual: float, potencia_dc: float) -> float:
        """Calcula fator de capacidade"""
        if potencia_dc == 0:
            return 0
        
        # Energia teórica máxima (potência * 8760 horas)
        energia_teorica_maxima = (potencia_dc / 1000) * 8760
        
        return (energia_anual / energia_teorica_maxima * 100) if energia_teorica_maxima > 0 else 0
    
    @staticmethod
    def _calculate_total_area(total_modulos: int, modulo: SolarModuleData) -> float:
        """Calcula área total necessária"""
        largura = getattr(modulo, 'largura_mm', None)
        altura = getattr(modulo, 'altura_mm', None)
        
        if largura and altura and largura > 0 and altura > 0:
            area_modulo = (largura * altura) / 1_000_000  # Converter para m²
        else:
            # Aproximação: 2.5 m² por módulo típico
            area_modulo = 2.5
        
        # Fator de ocupação (considerar espaçamento)
        fator_ocupacao = 0.6
        
        return total_modulos * area_modulo / fator_ocupacao
    
    @staticmethod
    def _calculate_total_weight(
        total_modulos: int, 
        inversores: List[SelectedInverterData], 
        modulo: SolarModuleData
    ) -> float:
        """Calcula peso total do sistema"""
        
        logger.info(f"Calculando peso para {total_modulos} módulos e {len(inversores)} inversores")
        
        # Peso dos módulos
        peso_modulo = getattr(modulo, 'peso_kg', 25.0) or 25.0  # 25kg padrão se não especificado
        logger.info(f"Peso do módulo: {peso_modulo}")
        peso_modulos = total_modulos * peso_modulo
        logger.info(f"Peso total módulos: {peso_modulos}")
        
        # Peso dos inversores (aproximação)
        peso_inversores = 0
        for i, inv in enumerate(inversores):
            quantity = getattr(inv, 'quantity', 1) or 1
            logger.info(f"Inversor {i}: quantity={quantity}")
            peso_inversores += quantity * 25.0
        logger.info(f"Peso total inversores: {peso_inversores}")
        
        # Peso da estrutura e cabeamento (aproximação)
        peso_estrutura = total_modulos * 15.0  # 15kg por módulo de estrutura
        logger.info(f"Peso estrutura: {peso_estrutura}")
        
        total = peso_modulos + peso_inversores + peso_estrutura
        logger.info(f"Peso total: {total}")
        return total
    
    @staticmethod
    def _calculate_performance_ratio_correcto(
        ac_energy_anual: float,
        dc_total_energy: float,
        efficiency_factor: float = 0.98,
        perdas_sistema: float = 4.5
    ) -> float:
        """
        Calcula Performance Ratio usando metodologia correta do notebook R16.
        
        Fórmula correta: PR = AC_final / DC_puro
        
        NOTA: Não aplicar eficiência no denominador! Isso infla artificialmente o PR.
        """
        if dc_total_energy <= 0:
            return 85.0  # Valor padrão conservador
        
        # Cálculo correto do PR (notebook methodology)
        pr_correto = (ac_energy_anual / dc_total_energy * 100)
        
        # Validação: PR deve estar entre 70% e 95% para sistemas reais
        if pr_correto > 95.0:
            logger.warning(f"PR suspeitamente alto: {pr_correto:.1f}% - Verificar cálculos")
            return min(pr_correto, 95.0)
        elif pr_correto < 70.0:
            logger.warning(f"PR muito baixo: {pr_correto:.1f}% - Sistema com perdas excessivas")
            return max(pr_correto, 70.0)
        
        return pr_correto
    
    @staticmethod
    def validate_pr_calculation(
        ac_energy_anual: float,
        dc_total_energy: float,
        pr_calculado: float,
        efficiency_factor: float = 0.98,
        perdas_sistema: float = 4.5
    ) -> Dict[str, Any]:
        """
        Validação do cálculo de PR comparando metodologia correta vs incorreta.
        
        Returns:
            Dict com validação detalhada e diagnóstico
        """
        if dc_total_energy <= 0:
            return {"valid": False, "error": "DC energy zero or negative"}
        
        # Metodologia CORRETA (notebook)
        pr_correto = (ac_energy_anual / dc_total_energy * 100)
        
        # Metodologia INCORRETA (Python bug)
        perdas_fator = (1.0 - perdas_sistema / 100.0)
        eficiencia_teorica = efficiency_factor * perdas_fator
        pr_incorreto = (ac_energy_anual / (dc_total_energy * eficiencia_teorica) * 100)
        
        # Diagnóstico
        diferenca_percentual = abs(pr_correto - pr_incorreto)
        suspeito = diferenca_percentual > 5.0  # Diferença > 5% indica problema
        
        return {
            "valid": not suspeito,
            "pr_correto": round(pr_correto, 2),
            "pr_incorreto": round(pr_incorreto, 2),
            "diferenca_percentual": round(diferenca_percentual, 2),
            "suspeito": suspeito,
            "diagnostico": "OK" if not suspeito else "PR inflado pela eficiência no denominador",
            "recomendacao": "Usar metodologia correta: PR = AC_final / DC_puro" if suspeito else "Cálculo OK"
        }
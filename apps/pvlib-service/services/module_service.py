import pandas as pd
import numpy as np
import logging
from typing import Dict, Any
from pvlib import pvsystem, modelchain, location
from pvlib.temperature import TEMPERATURE_MODEL_PARAMETERS

from core.config import settings
from core.exceptions import CalculationError
from models.requests import ModuleCalculationRequest
from models.responses import ModuleCalculationResponse, SystemCompatibility, PeriodAnalysis
from services.solar_service import solar_service
from utils.validators import validate_module_power, validate_consumption

logger = logging.getLogger(__name__)

class ModuleService:
    """Service para cálculo de módulos fotovoltaicos"""
    
    def __init__(self):
        self.solar_service = solar_service
    
    def calculate_required_modules(self, request: ModuleCalculationRequest) -> ModuleCalculationResponse:
        """
        Calcula número de módulos necessários
        
        Args:
            request: Parâmetros do sistema fotovoltaico
            
        Returns:
            Resultado completo do dimensionamento
        """
        logger.info(f"Calculando módulos para {request.lat}, {request.lon}")
        
        # Validar parâmetros
        validate_module_power(request.modulo.potencia_nominal_w)
        validate_consumption(request.consumo_anual_kwh)
        
        # Buscar dados meteorológicos com decomposição
        df = self.solar_service.pvgis.fetch_weather_data(request.lat, request.lon)
        
        # Filtrar anos completos
        df_filtered = df[df.index.year >= 2005]
        
        # Fazer decomposição GHI → DNI/DHI
        df_decomposed = self.solar_service._decompose_ghi(
            df_filtered, request.lat, request.lon, 'disc'
        )
        
        # Executar ModelChain
        annual_energy_per_module = self._run_modelchain_simulation(
            df_decomposed, request.lat, request.lon, 
            request.tilt, request.azimuth, request.modulo, request.inversor
        )
        
        # Calcular dimensionamento
        return self._calculate_system_sizing(
            annual_energy_per_module, request, len(df_decomposed)
        )
    
    def _run_modelchain_simulation(self, df: pd.DataFrame, lat: float, lon: float,
                                  tilt: float, azimuth: float, modulo, inversor) -> Dict[str, float]:
        """Executa simulação com ModelChain do pvlib"""
        
        try:
            # Configurar localização
            site = location.Location(latitude=lat, longitude=lon)
            
            # Parâmetros dinâmicos do módulo com fallbacks seguros
            module_parameters = {
                'alpha_sc': getattr(modulo, 'alpha_sc', None) or 0.0004,
                'beta_oc': getattr(modulo, 'beta_oc', None) or -0.0028,
                'gamma_r': getattr(modulo, 'gamma_r', None) or -0.0044,
                'a_ref': getattr(modulo, 'a_ref', None) or 1.8,
                'I_L_ref': modulo.isc or 13.91,  # Fallback para Canadian Solar CS3W-540MS
                'I_o_ref': getattr(modulo, 'i_o_ref', None) or 3.712e-12,
                'R_s': getattr(modulo, 'r_s', None) or 0.348,
                'R_sh_ref': getattr(modulo, 'r_sh_ref', None) or 381.68,
                'cells_in_series': getattr(modulo, 'numero_celulas', None) or 144,
                'STC': modulo.potencia_nominal_w or 540,
                'V_oc_ref': modulo.voc or 49.7,  # Fallback para Canadian Solar CS3W-540MS
                'I_sc_ref': modulo.isc or 13.91,  # Fallback para Canadian Solar CS3W-540MS
                'V_mp_ref': modulo.vmpp or 41.8,  # Fallback para Canadian Solar CS3W-540MS
                'I_mp_ref': modulo.impp or 13.16,  # Fallback para Canadian Solar CS3W-540MS
                'A0': getattr(modulo, 'a0', None) or -3.56, 
                'A1': getattr(modulo, 'a1', None) or -0.075, 
                'A2': getattr(modulo, 'a2', None) or 0.0, 
                'A3': getattr(modulo, 'a3', None) or 0.0, 
                'A4': getattr(modulo, 'a4', None) or 0.0,
                'B0': getattr(modulo, 'b0', None) or 0.0, 
                'B1': getattr(modulo, 'b1', None) or 0.0, 
                'B2': getattr(modulo, 'b2', None) or 0.0, 
                'B3': getattr(modulo, 'b3', None) or 0.0, 
                'B4': getattr(modulo, 'b4', None) or 0.0, 
                'B5': getattr(modulo, 'b5', None) or 0.0,
                'DTC': getattr(modulo, 'dtc', None) or 3.0
            }
            
            # Parâmetros dinâmicos do inversor (vindos do frontend)
            inverter_parameters = {
                'Paco': inversor.potencia_saida_ca_w,
                'Pdco': getattr(inversor, 'potencia_entrada_cc_max_w', None) or inversor.potencia_saida_ca_w * 1.1,
                'Vdco': getattr(inversor, 'vdco', None) or inversor.tensao_cc_max_v or 360,
                'Pso': getattr(inversor, 'pso', None) or 25,
                'C0': getattr(inversor, 'c0', None) or -0.000008,
                'C1': getattr(inversor, 'c1', None) or -0.000120,
                'C2': getattr(inversor, 'c2', None) or 0.001400,
                'C3': getattr(inversor, 'c3', None) or -0.020000,
                'Pnt': getattr(inversor, 'pnt', None) or 0.02
            }
            
            # Perdas do sistema
            losses_parameters = {
                'soiling': 2.0,
                'shading': 0,
                'mismatch': 2.5,
                'wiring': 2.0
            }
            
            # Criar sistema
            system = pvsystem.PVSystem(
                surface_tilt=tilt,
                surface_azimuth=azimuth,
                module_parameters=module_parameters,
                inverter_parameters=inverter_parameters,
                modules_per_string=1,
                strings_per_inverter=1,
                temperature_model_parameters=TEMPERATURE_MODEL_PARAMETERS['sapm']['open_rack_glass_glass'],
                losses_parameters=losses_parameters
                # racking_model='open_rack',      # Para inferência térmica
                # module_type='glass_polymer'     # Para inferência térmica
            )
            
            # Criar e executar ModelChain
            mc = modelchain.ModelChain(system, site)
            mc.run_model(df)
            
            if mc.results.ac is None or len(mc.results.ac) == 0:
                raise CalculationError("ModelChain não produziu resultados válidos")
            
            # Usar apenas valores positivos (geração real, não consumo noturno)
            ac_generation = mc.results.ac.clip(lower=0)
            
            # Calcular energia anual por ano (kWh) - apenas geração
            annual_energy_by_year = ac_generation.groupby(ac_generation.index.year).sum() / 1000
            
            # Calcular energia diária média (kWh/dia) - apenas geração
            daily_energy = ac_generation.resample('D').sum() / 1000
            daily_energy_mean = daily_energy.mean()
            daily_energy_std = daily_energy.std()
            
            return {
                'annual_mean': annual_energy_by_year.mean(),
                'annual_std': annual_energy_by_year.std(),
                'annual_by_year': annual_energy_by_year.to_dict(),
                'daily_mean': daily_energy_mean,
                'daily_std': daily_energy_std,
                'daily_min': daily_energy.min(),
                'daily_max': daily_energy.max()
            }
            
        except Exception as e:
            logger.error(f"Erro na simulação ModelChain: {e}")
            raise CalculationError(f"Falha na simulação do sistema: {str(e)}")
    
    def _calculate_system_sizing(self, annual_energy: Dict[str, float],
                                request: ModuleCalculationRequest,
                                records_processed: int) -> ModuleCalculationResponse:
        """Calcula dimensionamento final do sistema"""
        
        try:
            energy_per_module = annual_energy['annual_mean']
            energy_std = annual_energy['annual_std']
            
            # Validar se energia por módulo é válida
            if energy_per_module <= 0 or np.isnan(energy_per_module) or np.isinf(energy_per_module):
                raise CalculationError(f"Energia por módulo inválida: {energy_per_module} kWh/ano")
            
            # Aplicar perdas e fator de segurança
            energy_with_losses = energy_per_module * (1 - request.perdas_sistema / 100)
            
            # Validar energia com perdas
            if energy_with_losses <= 0 or np.isnan(energy_with_losses) or np.isinf(energy_with_losses):
                raise CalculationError(f"Energia com perdas inválida: {energy_with_losses} kWh/ano")
            
            # Usar número de módulos fornecido ou calcular automaticamente
            if request.num_modules is not None:
                num_modules = request.num_modules
                logger.info(f"Usando número de módulos fornecido: {num_modules}")
            else:
                # Número de módulos necessários (cálculo automático)
                modules_float = (request.consumo_anual_kwh * request.fator_seguranca) / energy_with_losses
                
                # Validar resultado da divisão
                if np.isnan(modules_float) or np.isinf(modules_float):
                    raise CalculationError(f"Cálculo de módulos resultou em valor inválido: {modules_float}")
                
                num_modules = int(np.ceil(modules_float))
                logger.info(f"Número de módulos calculado automaticamente: {num_modules}")
            
            # Cálculos do sistema
            total_power_kw = (num_modules * request.modulo.potencia_nominal_w) / 1000
            total_annual_energy = num_modules * energy_with_losses
            coverage_percentage = (total_annual_energy / request.consumo_anual_kwh) * 100
            
            # Métricas de performance
            capacity_factor = (energy_per_module / (request.modulo.potencia_nominal_w * 8760 / 1000)) * 100
            hsp_annual = energy_per_module / (request.modulo.potencia_nominal_w / 1000)
            hsp_daily = hsp_annual / 365
            
            # Performance Ratio (PR) - Energia real vs energia teórica ideal
            irradiacao_ref = 1000  # W/m² (condições STC)
            energia_teorica_ideal = (request.modulo.potencia_nominal_w / 1000) * hsp_annual * num_modules
            pr_medio = (total_annual_energy / energia_teorica_ideal) * 100 if energia_teorica_ideal > 0 else 0
            
            # Yield Específico - kWh por kWp instalado
            yield_especifico = total_annual_energy / total_power_kw if total_power_kw > 0 else 0
            
            # Variabilidade
            variability_percentage = (energy_std / energy_per_module) * 100
            
            # Análise de compatibilidade do sistema
            compatibility = self._analyze_system_compatibility(request.modulo, request.inversor, num_modules)
            
            # Cálculos de área e peso
            area_m2 = self._calculate_total_area(request.modulo, num_modules)
            peso_total = self._calculate_total_weight(request.modulo, num_modules)
            
            # Geração mensal estimada
            geracao_mensal = self._estimate_monthly_generation(total_annual_energy, request.lat)
            
            # Economia de CO2 (fator médio brasileiro: 0.5 kg CO2/kWh)
            economia_co2 = total_annual_energy * 0.5
            
            return ModuleCalculationResponse(
                num_modulos=num_modules,
                potencia_total_kw=round(total_power_kw, 2),
                energia_total_anual=round(total_annual_energy, 1),
                energia_por_modulo=round(energy_with_losses, 1),
                cobertura_percentual=round(coverage_percentage, 1),
                fator_capacidade=round(capacity_factor, 1),
                hsp_equivalente_dia=round(hsp_daily, 1),
                hsp_equivalente_anual=round(hsp_annual, 1),
                energia_anual_std=round(energy_std, 1),
                variabilidade_percentual=round(variability_percentage, 1),
                # Novos campos de performance
                pr_medio=round(pr_medio, 1),
                yield_especifico=round(yield_especifico, 1),
                energia_por_ano={str(year): round(energy * num_modules * (1 - request.perdas_sistema / 100), 1) 
                               for year, energy in annual_energy['annual_by_year'].items()},
                # Métricas diárias
                energia_diaria_media=round(annual_energy.get('daily_mean', 0) * num_modules * (1 - request.perdas_sistema / 100), 3),
                energia_diaria_std=round(annual_energy.get('daily_std', 0) * num_modules * (1 - request.perdas_sistema / 100), 3),
                energia_diaria_min=round(annual_energy.get('daily_min', 0) * num_modules * (1 - request.perdas_sistema / 100), 3),
                energia_diaria_max=round(annual_energy.get('daily_max', 0) * num_modules * (1 - request.perdas_sistema / 100), 3),
                # Geração mensal estimada
                geracao_mensal=[round(val, 1) for val in geracao_mensal],
                compatibilidade_sistema=compatibility,
                area_necessaria_m2=round(area_m2, 1),
                peso_total_kg=round(peso_total, 1),
                economia_anual_co2=round(economia_co2, 2),
                parametros_completos={
                    'consumo_anual_kwh': request.consumo_anual_kwh,
                    'localizacao': {'lat': request.lat, 'lon': request.lon},
                    'orientacao': {'tilt': request.tilt, 'azimuth': request.azimuth},
                    'modulo': request.modulo.dict(),
                    'inversor': request.inversor.dict(),
                    'perdas_sistema': request.perdas_sistema,
                    'fator_seguranca': request.fator_seguranca
                },
                dados_processados=records_processed,
                anos_analisados=len(annual_energy['annual_by_year']),
                periodo_dados=PeriodAnalysis(
                    inicio='2005-01-01',
                    fim='2020-12-31',
                    anos_completos=16
                )
            )
            
        except Exception as e:
            logger.error(f"Erro no dimensionamento: {e}")
            raise CalculationError(f"Falha no cálculo de dimensionamento: {str(e)}")
    
    def _analyze_system_compatibility(self, modulo, inversor, num_modules: int) -> SystemCompatibility:
        """Analisa compatibilidade entre módulo e inversor"""
        
        # Compatibilidade de tensão
        if modulo.vmpp and inversor.tensao_cc_max_v:
            compatibilidade_tensao = modulo.vmpp <= inversor.tensao_cc_max_v
        else:
            compatibilidade_tensao = True  # Assume compatível se dados não disponíveis
        
        # Cálculo de strings recomendadas
        strings_recomendadas = 1
        modulos_por_string = num_modules
        
        if inversor.numero_mppt and inversor.strings_por_mppt:
            max_strings = inversor.numero_mppt * inversor.strings_por_mppt
            if num_modules > max_strings:
                strings_recomendadas = min(max_strings, num_modules)
                modulos_por_string = int(np.ceil(num_modules / strings_recomendadas))
        
        # Utilização do inversor
        potencia_modulos_kw = (num_modules * modulo.potencia_nominal_w) / 1000
        potencia_inversor_kw = inversor.potencia_saida_ca_w / 1000
        utilizacao_inversor = (potencia_modulos_kw / potencia_inversor_kw) * 100
        margem_seguranca = max(0, 100 - utilizacao_inversor)
        
        return SystemCompatibility(
            compatibilidade_tensao=compatibilidade_tensao,
            strings_recomendadas=strings_recomendadas,
            modulos_por_string=modulos_por_string,
            utilizacao_inversor=round(utilizacao_inversor, 1),
            margem_seguranca=round(margem_seguranca, 1)
        )
    
    def _calculate_total_area(self, modulo, num_modules: int) -> float:
        """Calcula área total necessária em m²"""
        if modulo.largura_mm and modulo.altura_mm:
            area_por_modulo = (modulo.largura_mm * modulo.altura_mm) / 1_000_000  # Converter para m²
            return num_modules * area_por_modulo
        else:
            # Área estimada baseada na potência (aproximadamente 2.5 m²/kWp)
            potencia_total_kw = (num_modules * modulo.potencia_nominal_w) / 1000
            return potencia_total_kw * 2.5
    
    def _calculate_total_weight(self, modulo, num_modules: int) -> float:
        """Calcula peso total do sistema em kg"""
        if modulo.peso_kg:
            return num_modules * modulo.peso_kg
        else:
            # Peso estimado baseado na potência (aproximadamente 20 kg por módulo de 400W)
            return num_modules * 20
    
    def _estimate_monthly_generation(self, annual_energy: float, lat: float) -> list:
        """Estima geração mensal baseada na energia anual e sazonalidade"""
        
        # Padrões sazonais típicos do Brasil por região (aproximado)
        if lat > -15:  # Norte/Nordeste
            seasonal_factors = [1.15, 1.10, 1.05, 0.95, 0.85, 0.80, 0.85, 0.90, 0.95, 1.05, 1.15, 1.20]
        elif lat > -25:  # Centro-Oeste/Sudeste
            seasonal_factors = [1.25, 1.15, 1.05, 0.90, 0.75, 0.70, 0.75, 0.85, 0.95, 1.10, 1.20, 1.25]
        else:  # Sul
            seasonal_factors = [1.30, 1.20, 1.00, 0.85, 0.65, 0.60, 0.65, 0.75, 0.90, 1.10, 1.25, 1.35]
        
        # Normalizar para que a soma seja 12 (média = 1.0)
        avg_factor = sum(seasonal_factors) / 12
        normalized_factors = [f / avg_factor for f in seasonal_factors]
        
        # Calcular geração mensal
        monthly_avg = annual_energy / 12
        monthly_generation = [monthly_avg * factor for factor in normalized_factors]
        
        return monthly_generation

# Instância singleton
module_service = ModuleService()

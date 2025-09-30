import pandas as pd
import numpy as np
import logging
from typing import Dict, Any, Optional
from pvlib import pvsystem, modelchain, location

# Import math com fallback para compatibilidade
try:
    import math
except ImportError:
    # Fallback: usar numpy se math não disponível
    class MathFallback:
        @staticmethod
        def ceil(x):
            return int(np.ceil(x))
    math = MathFallback()
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
    
    def _calculate_optimal_string_configuration(self, num_modules: int, inversor, modulo) -> dict:
        """
        Determina configuração ótima de strings baseado em:
        - Número total de módulos
        - Limites de tensão do inversor
        - Número de MPPTs disponíveis
        
        Returns:
            dict: {
                'modules_per_string': int,
                'strings_per_inverter': int,
                'total_strings': int,
                'configuration_valid': bool,
                'warnings': list
            }
        """
        warnings = []
        
        # Obter parâmetros do inversor com fallbacks
        tensao_cc_max = getattr(inversor, 'tensaoCcMax', None) or getattr(inversor, 'tensao_cc_max_v', None) or 1500
        numero_mppt = getattr(inversor, 'numeroMppt', None) or getattr(inversor, 'numero_mppt', None) or 4
        strings_por_mppt = getattr(inversor, 'stringsPorMppt', None) or getattr(inversor, 'strings_por_mppt', None) or 2
        
        # Parâmetros do módulo
        voc_modulo = modulo.voc or 49.7
        vmpp_modulo = modulo.vmpp or 41.8
        
        # Calcular limites de tensão por string
        # Fator de segurança para baixas temperaturas (Voc pode aumentar ~20%)
        voc_max_seguranca = voc_modulo * 1.2
        max_modules_per_string_voc = int(tensao_cc_max / voc_max_seguranca)
        
        # Capacidade máxima do sistema (MPPT × strings/MPPT)
        max_total_strings = numero_mppt * strings_por_mppt
        
        # Estratégia 1: Tentar configuração simples (todos módulos em uma string)
        if num_modules <= max_modules_per_string_voc:
            modules_per_string = num_modules
            strings_per_inverter = 1
            total_strings = 1
            
            logger.info(f"📐 Configuração simples: {modules_per_string} módulos/string, {strings_per_inverter} string")
            
            return {
                'modules_per_string': modules_per_string,
                'strings_per_inverter': strings_per_inverter,
                'total_strings': total_strings,
                'configuration_valid': True,
                'warnings': warnings,
                'strategy_used': 'single_string'
            }
        
        # Estratégia 2: Dividir em múltiplas strings
        # Preferir strings com tamanho similar e dentro dos limites
        best_modules_per_string = min(max_modules_per_string_voc, 20)  # Limite prático
        strings_needed = math.ceil(num_modules / best_modules_per_string)
        
        if strings_needed <= max_total_strings:
            # Redistribuir módulos uniformemente
            modules_per_string = math.ceil(num_modules / strings_needed)
            strings_per_inverter = strings_needed
            total_strings = strings_needed
            
            # Verificar se ainda respeita limite de tensão
            if modules_per_string * voc_max_seguranca > tensao_cc_max:
                modules_per_string = max_modules_per_string_voc
                strings_per_inverter = math.ceil(num_modules / modules_per_string)
                total_strings = strings_per_inverter
                
                if strings_per_inverter > max_total_strings:
                    warnings.append(f"Sistema requer {strings_per_inverter} strings, mas inversor suporta apenas {max_total_strings}")
                    strings_per_inverter = max_total_strings
                    modules_per_string = math.ceil(num_modules / strings_per_inverter)
            
            logger.info(f"📐 Configuração multi-string: {modules_per_string} módulos/string, {strings_per_inverter} strings")
            
            return {
                'modules_per_string': modules_per_string,
                'strings_per_inverter': strings_per_inverter,
                'total_strings': total_strings,
                'configuration_valid': len(warnings) == 0,
                'warnings': warnings,
                'strategy_used': 'multi_string'
            }
        
        # Estratégia 3: Sistema excede capacidade do inversor
        warnings.append(f"Sistema com {num_modules} módulos excede capacidade do inversor")
        modules_per_string = max_modules_per_string_voc
        strings_per_inverter = max_total_strings
        total_strings = max_total_strings
        
        logger.warning(f"⚠️ Sistema oversized: usando configuração máxima do inversor")
        
        return {
            'modules_per_string': modules_per_string,
            'strings_per_inverter': strings_per_inverter,
            'total_strings': total_strings,
            'configuration_valid': False,
            'warnings': warnings,
            'strategy_used': 'oversized_system'
        }
    
    def calculate_required_modules(self, request: ModuleCalculationRequest) -> ModuleCalculationResponse:
        """
        Calcula energia gerada para número fixo de módulos
        
        Args:
            request: Parâmetros do sistema fotovoltaico (deve incluir num_modules)
            
        Returns:
            Resultado completo da geração de energia para o número especificado de módulos
        """
        logger.info(f"Calculando energia para sistema em {request.lat}, {request.lon}")
        
        # 1. VALIDAR PARÂMETROS
        validate_module_power(request.modulo.potencia_nominal_w)
        
        # 2. BUSCAR DADOS METEOROLÓGICOS (necessário para TODOS os caminhos)
        df = self.solar_service.pvgis.fetch_weather_data(request.lat, request.lon)
        df_filtered = df  # Dados já vêm filtrados do PVGIS para 2018-2020
        
        # Fazer decomposição GHI → DNI/DHI
        df_decomposed = self.solar_service._decompose_ghi(
            df_filtered, request.lat, request.lon, 'disc'
        )
        
        # 3. VERIFICAR TIPO DE SISTEMA (agora df_decomposed JÁ EXISTE)
        if hasattr(request, 'multi_inverter_data') and request.multi_inverter_data:
            multi_data = request.multi_inverter_data
            logger.info(f"🔄 PYTHON: Sistema multi-inversor detectado")
            logger.info(f"   - Configuração: {multi_data.get('system_configuration', 'unknown')}")
            logger.info(f"   - Total unidades: {multi_data.get('total_inverter_units', 0)}")
            logger.info(f"   - Potência total: {multi_data.get('total_ca_power_kw', 0)}kW")
            logger.info(f"   - Total MPPT: {multi_data.get('total_mppt_channels', 0)}")
            
            if multi_data.get('is_multi_inverter', False):
                logger.info(f"   - Modelos diferentes: {multi_data.get('inverter_models_count', 0)}")
                logger.info(f"   - Processando como multi-inversor")
                return self._calculate_multi_inverter_system(
                    df_decomposed, request, multi_data, len(df_decomposed)
                )
            else:
                logger.info(f"   - Sistema inversor único com múltiplas unidades detectado")
        
        # 4. SISTEMA INVERSOR ÚNICO (caminho padrão)
        logger.info("Processando como sistema inversor único")
        return self._calculate_single_inverter_system(
            df_decomposed, request, len(df_decomposed)
        )
    
    def _run_modelchain_simulation(self, df: pd.DataFrame, lat: float, lon: float,
                                  tilt: float, azimuth: float, modulo, inversor, 
                                  modelo_transposicao: str = 'perez', string_config: dict = None) -> Dict[str, float]:
        """Executa simulação com ModelChain do pvlib"""
        
        try:
            # Configurar localização
            site = location.Location(latitude=lat, longitude=lon)
            
            # Parâmetros dinâmicos do módulo com fallbacks seguros
            # CORREÇÃO: Mapeamento correto dos nomes frontend→python
            module_parameters = {
                'alpha_sc': getattr(modulo, 'alphaSc', None) or getattr(modulo, 'alpha_sc', None) or 0.0004,
                'beta_oc': getattr(modulo, 'betaOc', None) or getattr(modulo, 'beta_oc', None) or -0.0028,
                'gamma_r': getattr(modulo, 'gammaR', None) or getattr(modulo, 'gamma_r', None) or -0.0044,
                'a_ref': getattr(modulo, 'aRef', None) or getattr(modulo, 'a_ref', None) or 1.8,
                'I_L_ref': getattr(modulo, 'iLRef', None) or modulo.isc or 13.91,
                'I_o_ref': getattr(modulo, 'iORef', None) or getattr(modulo, 'i_o_ref', None) or 3.712e-12,
                'R_s': getattr(modulo, 'rS', None) or getattr(modulo, 'r_s', None) or 0.348,
                'R_sh_ref': getattr(modulo, 'rShRef', None) or getattr(modulo, 'r_sh_ref', None) or 381.68,
                'cells_in_series': getattr(modulo, 'numerocelulas', None) or getattr(modulo, 'numero_celulas', None) or 144,
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
            
            # Configuração elétrica do sistema
            if string_config:
                modules_per_string = string_config['modules_per_string']
                strings_per_inverter = string_config['strings_per_inverter']
                logger.info(f"🔌 Usando configuração calculada: {modules_per_string} módulos/string × {strings_per_inverter} strings")
            else:
                # Fallback para configuração legada (compatibilidade)
                modules_per_string = 1
                strings_per_inverter = 1
                logger.warning("⚠️ Usando configuração legada (1 módulo por simulação)")
            
            # CORREÇÃO 2: Calcular Pdco baseado na configuração real
            Paco = inversor.potencia_saida_ca_w
            
            # Para sistemas reais, Pdco deve considerar o oversizing planejado
            # O notebook mostra Pdco = Paco / 0.9811, mas isso é para eficiência máxima assumida
            if string_config and string_config.get('strategy_used') == 'single_string':
                # Sistema simples - usar cálculo direto do notebook
                Pdco_calc = Paco / 0.9811  
                logger.info(f"💡 Sistema simples: Pdco = {Pdco_calc:.0f}W (Paco/{0.9811})")
            else:
                # Sistema multi-string ou complexo - ajustar para configuração real
                total_modules_simulated = modules_per_string * strings_per_inverter
                dc_power_expected = total_modules_simulated * modulo.potencia_nominal_w
                
                # Usar o maior entre o cálculo padrão e a potência DC esperada
                Pdco_calc = max(Paco / 0.9811, dc_power_expected * 1.1)
                logger.info(f"💡 Sistema complexo: Pdco = {Pdco_calc:.0f}W (ajustado para {total_modules_simulated} módulos)")
            
            # Parâmetros dinâmicos do inversor (vindos do frontend)
            # CORREÇÃO: Mapeamento correto dos nomes do inversor
            inverter_parameters = {
                'Paco': Paco,
                'Pdco': Pdco_calc,  # Mudança: usando o cálculo corrigido
                'Vdco': getattr(inversor, 'vdco', None) or getattr(inversor, 'tensaoCcMax', None) or inversor.tensao_cc_max_v or 360,
                'Pso': getattr(inversor, 'pso', None) or 25,
                'C0': getattr(inversor, 'c0', None) or -0.000008,
                'C1': getattr(inversor, 'c1', None) or -0.000120,
                'C2': getattr(inversor, 'c2', None) or 0.001400,
                'C3': getattr(inversor, 'c3', None) or -0.020000,
                'Pnt': getattr(inversor, 'pnt', None) or 0.02
            }
            
            # CORREÇÃO 3: Eliminar perdas do sistema pvlib - aplicar apenas ao final (igual ao notebook)
            # Mudança: zerando todas as perdas aqui para aplicar apenas no final
            losses_parameters = {
                'soiling': 0.0,    # Mudança: era 2.0, agora 0.0
                'shading': 0.0,    # Mantido 0.0
                'mismatch': 0.0,   # Mudança: era 2.5, agora 0.0
                'wiring': 0.0      # Mudança: era 2.0, agora 0.0
            }
            
            # Criar sistema com configuração real
            system = pvsystem.PVSystem(
                surface_tilt=tilt,
                surface_azimuth=azimuth,
                module_parameters=module_parameters,
                inverter_parameters=inverter_parameters,
                # CORREÇÃO 1: Usar configuração real de strings (não mais 1 módulo)
                modules_per_string=modules_per_string,
                strings_per_inverter=strings_per_inverter,
                temperature_model_parameters=TEMPERATURE_MODEL_PARAMETERS['sapm']['open_rack_glass_glass'],
                losses_parameters=losses_parameters  # Perdas aplicadas apenas no final
            )
            
            logger.info(f"🏗️ Sistema criado: {modules_per_string}×{strings_per_inverter} = {modules_per_string * strings_per_inverter} módulos")
            logger.info(f"🔋 Potência DC: {(modules_per_string * strings_per_inverter * modulo.potencia_nominal_w)/1000:.2f} kWp")
            logger.info(f"⚡ Potência AC: {Paco/1000:.2f} kW (Pdco: {Pdco_calc/1000:.2f} kW)")
            
            # Criar e executar ModelChain com modelo de transposição específico
            mc = modelchain.ModelChain(
                system, 
                site, 
                transposition_model=modelo_transposicao
            )
            mc.run_model(df)
            
            if mc.results.ac is None or len(mc.results.ac) == 0:
                raise CalculationError("ModelChain não produziu resultados válidos")
            
            # CORREÇÃO 4: Clipping natural já aplicado pelo pvlib com configuração real
            # O ModelChain com configuração real já aplica clipping correto no inversor
            ac_power = mc.results.ac.fillna(0)  # Potência AC já com clipping aplicado
            ac_generation = ac_power.clip(lower=0)  # Remove valores negativos
            
            # Log de clipping para análise
            dc_power = mc.results.dc['p_mp'].fillna(0)
            clipped_hours = (dc_power > Paco).sum()
            total_hours = len(dc_power)
            clipping_percentage = (clipped_hours / total_hours) * 100 if total_hours > 0 else 0
            
            logger.info(f"📊 Análise de clipping: {clipped_hours}/{total_hours} horas ({clipping_percentage:.1f}%) com clipping")
            logger.info(f"🔄 DC máximo: {dc_power.max()/1000:.1f} kW | AC máximo: {ac_generation.max()/1000:.1f} kW")
            
            # Calcular energia anual por ano (kWh) - sistema completo
            annual_energy_by_year = ac_generation.groupby(ac_generation.index.year).sum() / 1000
            
            # Calcular energia diária média (kWh/dia) - sistema completo
            daily_energy = ac_generation.resample('D').sum() / 1000
            daily_energy_mean = daily_energy.mean()
            daily_energy_std = daily_energy.std()
            
            # Performance ratio para validação
            total_modules = modules_per_string * strings_per_inverter
            dc_rated_power = total_modules * modulo.potencia_nominal_w / 1000  # kW
            annual_energy_mean = annual_energy_by_year.mean()
            theoretical_annual = dc_rated_power * 8760  # kWh teórico máximo
            performance_ratio = (annual_energy_mean / theoretical_annual) * 100 if theoretical_annual > 0 else 0
            
            logger.info(f"📈 Performance Ratio calculado: {performance_ratio:.1f}%")
            logger.info(f"⚡ Energia anual média: {annual_energy_mean:,.0f} kWh ({total_modules} módulos)")
            
            # ===== VALIDAÇÕES DE SANIDADE =====
            # Validação de Performance Ratio
            if performance_ratio < 50 or performance_ratio > 95:
                logger.warning(f"⚠️ PR FORA DA FAIXA ESPERADA: {performance_ratio:.1f}% (esperado: 70-85%)")
                if performance_ratio < 50:
                    logger.warning(f"   - PR muito baixo pode indicar: sombreamento excessivo, perdas altas, ou erro nos dados")
                elif performance_ratio > 95:
                    logger.warning(f"   - PR muito alto pode indicar: perdas subestimadas ou erro na simulação")
            
            # Validação de clipping
            if clipping_percentage > 20:
                logger.warning(f"⚠️ CLIPPING EXCESSIVO: {clipping_percentage:.1f}% das horas")
                logger.warning(f"   - Considerar aumentar potência do inversor ou reduzir número de módulos")
                logger.warning(f"   - Sistema oversized pode estar perdendo energia significativa")
            elif clipping_percentage > 10:
                logger.info(f"📊 Clipping moderado: {clipping_percentage:.1f}% das horas (aceitável)")
            
            # Verificar se energia por módulo está em faixa realista
            energy_per_module_check = annual_energy_mean / total_modules if total_modules > 0 else 0
            if energy_per_module_check < 300 or energy_per_module_check > 2000:
                logger.warning(f"⚠️ ENERGIA POR MÓDULO SUSPEITA: {energy_per_module_check:.0f} kWh/ano/módulo")
                if energy_per_module_check < 300:
                    logger.warning(f"   - Muito baixa: verificar localização, orientação ou sombreamento")
                elif energy_per_module_check > 2000:
                    logger.warning(f"   - Muito alta: verificar potência do módulo ou dados meteorológicos")
            else:
                logger.info(f"✅ Energia por módulo em faixa normal: {energy_per_module_check:.0f} kWh/ano")
            
            # Validação de variabilidade
            daily_std_pct = (daily_energy_std / daily_energy_mean) * 100 if daily_energy_mean > 0 else 0
            if daily_std_pct > 80:
                logger.warning(f"⚠️ ALTA VARIABILIDADE DIÁRIA: {daily_std_pct:.1f}%")
                logger.warning(f"   - Pode indicar dados meteorológicos inconsistentes")
            
            logger.info(f"🔍 Validações concluídas - Sistema aparenta estar funcionando normalmente")
            
            return {
                'annual_mean': annual_energy_by_year.mean(),
                'annual_std': annual_energy_by_year.std(),
                'annual_by_year': annual_energy_by_year.to_dict(),
                'daily_mean': daily_energy_mean,
                'daily_std': daily_energy_std,
                'daily_min': daily_energy.min(),
                'daily_max': daily_energy.max(),
                # Dados adicionais para análise
                'total_modules_simulated': total_modules,
                'performance_ratio': performance_ratio,
                'clipping_percentage': clipping_percentage,
                'string_configuration': {
                    'modules_per_string': modules_per_string,
                    'strings_per_inverter': strings_per_inverter
                }
            }
            
        except Exception as e:
            logger.error(f"Erro na simulação ModelChain: {e}")
            raise CalculationError(f"Falha na simulação do sistema: {str(e)}")
    
    def _calculate_single_inverter_system(self, df_decomposed, request, records_processed):
        """Calcula sistema com inversor único (abordagem padrão)"""
        
        # Calcular configuração ótima de strings
        string_config = self._calculate_optimal_string_configuration(
            request.num_modules, request.inversor, request.modulo
        )
        
        # Log da configuração calculada
        logger.info(f"📊 Configuração de strings calculada:")
        logger.info(f"   - Módulos por string: {string_config['modules_per_string']}")
        logger.info(f"   - Strings por inversor: {string_config['strings_per_inverter']}")
        logger.info(f"   - Total de strings: {string_config['total_strings']}")
        logger.info(f"   - Estratégia usada: {string_config['strategy_used']}")
        
        if string_config['warnings']:
            for warning in string_config['warnings']:
                logger.warning(f"⚠️ {warning}")
        
        # Executar ModelChain com configuração real
        annual_energy_result = self._run_modelchain_simulation(
            df_decomposed, request.lat, request.lon, 
            request.tilt, request.azimuth, request.modulo, request.inversor,
            request.modelo_transposicao, string_config
        )
        
        # Calcular dimensionamento
        return self._calculate_system_sizing(
            annual_energy_result, request, records_processed, string_config
        )
    
    def _calculate_multi_inverter_system(self, df_decomposed, request, multi_data, records_processed):
        """Calcula sistema com múltiplos inversores diferentes"""
        
        logger.info("🔄 Iniciando cálculo multi-inversor com clipping por inversor")
        
        inverter_breakdown = multi_data.get('inverter_breakdown', [])
        total_annual_energy = 0
        total_modules_distributed = 0
        combined_results = {
            'annual_mean': 0,
            'annual_std': 0,
            'annual_by_year': {},
            'daily_mean': 0,
            'daily_std': 0,
            'daily_min': float('inf'),
            'daily_max': 0,
            'total_modules_simulated': 0,
            'performance_ratio': 0,
            'clipping_percentage': 0,
            'inverter_results': []
        }
        
        for i, inverter_info in enumerate(inverter_breakdown):
            logger.info(f"⚡ Processando inversor {i+1}/{len(inverter_breakdown)}: {inverter_info.get('fabricante')} {inverter_info.get('modelo')}")
            
            # Calcular módulos para este inversor baseado na participação
            percentual_sistema = inverter_info.get('percentual_potencia_sistema', 0) / 100
            modules_for_inverter = int(request.num_modules * percentual_sistema)
            
            if modules_for_inverter == 0:
                continue
                
            # Criar objeto inversor virtual baseado no inversor base do request
            base_inversor = request.inversor
            
            # Extrair especificações reais do breakdown ou usar do request.inversor como base
            tensao_cc = inverter_info.get('tensao_cc_max_v') or getattr(base_inversor, 'tensaoCcMax', None) or getattr(base_inversor, 'tensao_cc_max_v', 1500)
            num_mppt = inverter_info.get('numero_mppt') or getattr(base_inversor, 'numeroMppt', None) or getattr(base_inversor, 'numero_mppt', 4) 
            str_mppt = inverter_info.get('strings_por_mppt') or getattr(base_inversor, 'stringsPorMppt', None) or getattr(base_inversor, 'strings_por_mppt', 2)
            
            inversor_virtual = type('obj', (object,), {
                'potencia_saida_ca_w': inverter_info.get('potencia_unitaria_w', 0),
                'tensao_cc_max_v': tensao_cc,
                'numero_mppt': num_mppt,
                'strings_por_mppt': str_mppt,
                # Adicionar outros campos necessários do inversor base
                'vdco': getattr(base_inversor, 'vdco', None),
                'pso': getattr(base_inversor, 'pso', None),
                'c0': getattr(base_inversor, 'c0', None),
                'c1': getattr(base_inversor, 'c1', None),
                'c2': getattr(base_inversor, 'c2', None),
                'c3': getattr(base_inversor, 'c3', None),
                'pnt': getattr(base_inversor, 'pnt', None),
                # Mapeamentos adicionais
                'tensaoCcMax': tensao_cc,
                'numeroMppt': num_mppt, 
                'stringsPorMppt': str_mppt
            })()
            
            logger.info(f"   - Especificações: {tensao_cc}V, {num_mppt}x{str_mppt} MPPTs")
            
            # Calcular configuração para este inversor
            string_config = self._calculate_optimal_string_configuration(
                modules_for_inverter, inversor_virtual, request.modulo
            )
            
            logger.info(f"   - Módulos atribuídos: {modules_for_inverter} ({percentual_sistema*100:.1f}% do sistema)")
            logger.info(f"   - Configuração: {string_config['modules_per_string']} módulos/string × {string_config['strings_per_inverter']} strings")
            
            # Simular este inversor separadamente
            inverter_result = self._run_modelchain_simulation(
                df_decomposed, request.lat, request.lon,
                request.tilt, request.azimuth, request.modulo, inversor_virtual,
                request.modelo_transposicao, string_config
            )
            
            # Acumular resultados
            inverter_annual = inverter_result['annual_mean']
            total_annual_energy += inverter_annual
            total_modules_distributed += modules_for_inverter
            
            # Combinar dados anuais por ano
            for year, energy in inverter_result.get('annual_by_year', {}).items():
                if year not in combined_results['annual_by_year']:
                    combined_results['annual_by_year'][year] = 0
                combined_results['annual_by_year'][year] += energy
            
            # Atualizar métricas combinadas
            combined_results['daily_mean'] += inverter_result.get('daily_mean', 0)
            combined_results['daily_min'] = min(combined_results['daily_min'], inverter_result.get('daily_min', 0))
            combined_results['daily_max'] += inverter_result.get('daily_max', 0)
            
            # Armazenar resultado do inversor
            combined_results['inverter_results'].append({
                'inverter_index': i,
                'modules': modules_for_inverter,
                'annual_energy': inverter_annual,
                'string_config': string_config,
                'inverter_info': inverter_info
            })
            
            logger.info(f"   - Energia anual: {inverter_annual:,.1f} kWh")
        
        # Finalizar métricas combinadas
        combined_results['annual_mean'] = total_annual_energy
        combined_results['total_modules_simulated'] = total_modules_distributed
        
        # Calcular variância combinada (aproximação)
        if len(combined_results['inverter_results']) > 1:
            energies = [inv['annual_energy'] for inv in combined_results['inverter_results']]
            combined_results['annual_std'] = np.std(energies) if len(energies) > 1 else 0
        else:
            combined_results['annual_std'] = 0
        
        # Performance ratio médio
        total_dc_power = total_modules_distributed * request.modulo.potencia_nominal_w / 1000
        theoretical_energy = total_dc_power * 8760
        combined_results['performance_ratio'] = (total_annual_energy / theoretical_energy) * 100 if theoretical_energy > 0 else 0
        
        logger.info(f"📈 Resultado multi-inversor:")
        logger.info(f"   - Energia total: {total_annual_energy:,.1f} kWh/ano")
        logger.info(f"   - Módulos distribuídos: {total_modules_distributed}")
        logger.info(f"   - Performance Ratio: {combined_results['performance_ratio']:.1f}%")
        
        # Calcular dimensionamento final
        return self._calculate_system_sizing(
            combined_results, request, records_processed, {'multi_inverter': True}
        )
    
    def _calculate_system_sizing(self, annual_energy: Dict[str, float],
                                request: ModuleCalculationRequest,
                                records_processed: int, string_config: dict = None) -> ModuleCalculationResponse:
        """Calcula dimensionamento final do sistema"""
        
        try:
            # Com a nova abordagem, annual_energy já contém energia do sistema completo
            total_energy_simulated = annual_energy['annual_mean']
            energy_std = annual_energy['annual_std']
            
            # Calcular energia por módulo baseado na simulação real
            modules_simulated = annual_energy.get('total_modules_simulated', request.num_modules)
            energy_per_module = total_energy_simulated / modules_simulated if modules_simulated > 0 else 0
            
            logger.info(f"📈 Sistema simulado: {modules_simulated} módulos, {total_energy_simulated:,.1f} kWh/ano")
            logger.info(f"🔋 Energia por módulo calculada: {energy_per_module:.1f} kWh/ano")
            
            # Validar se energia é válida
            if energy_per_module <= 0 or np.isnan(energy_per_module) or np.isinf(energy_per_module):
                raise CalculationError(f"Energia por módulo inválida: {energy_per_module} kWh/ano")
            
            if total_energy_simulated <= 0 or np.isnan(total_energy_simulated):
                raise CalculationError(f"Energia total simulada inválida: {total_energy_simulated} kWh/ano")
            
            # Com o sistema real, não precisamos mais de ajustes temporários
            energy_with_losses = energy_per_module  # Energia já calculada corretamente
            
            # Usar sempre o número de módulos fornecido
            if request.num_modules is None or request.num_modules <= 0:
                raise CalculationError("Número de módulos deve ser fornecido e maior que zero")
            
            num_modules = request.num_modules
            logger.info(f"Calculando energia para {num_modules} módulos")
            
            # Cálculos do sistema
            total_power_kw = (num_modules * request.modulo.potencia_nominal_w) / 1000
            
            # NOVA ABORDAGEM: Sistema já foi simulado com configuração real
            # Verificar se é necessário escalamento
            if modules_simulated != request.num_modules:
                diff_pct = abs(modules_simulated - request.num_modules) / request.num_modules * 100
                
                if diff_pct > 10:
                    logger.warning(f"⚠️ DIFERENÇA SIGNIFICATIVA: Simulado {modules_simulated}, Solicitado {request.num_modules} ({diff_pct:.1f}%)")
                    logger.warning(f"⚠️ RECOMENDADO: Re-simular com número exato de módulos para maior precisão")
                
                # Escalamento linear (limitação conhecida)
                scaling_factor = request.num_modules / modules_simulated
                total_annual_energy_without_losses = total_energy_simulated * scaling_factor
                energy_per_module = total_annual_energy_without_losses / request.num_modules
                
                logger.info(f"🔄 Escalamento aplicado (linear): {modules_simulated} → {request.num_modules} módulos")
                logger.info(f"📊 Fator de escalamento: {scaling_factor:.3f}")
                if diff_pct > 5:
                    logger.warning(f"⚠️ AVISO: Escalamento linear pode introduzir erro de até {diff_pct:.1f}%")
            else:
                # Sistema foi simulado com o número exato de módulos
                total_annual_energy_without_losses = total_energy_simulated
                logger.info(f"✅ Número exato de módulos simulado: {request.num_modules}")
            
            # Aplicar perdas do sistema no final (igual ao notebook)
            perdas_totais_pct = request.perdas_sistema
            total_annual_energy = total_annual_energy_without_losses * (1.0 - perdas_totais_pct / 100.0)
            
            logger.info(f"🔋 ENERGIA SEM PERDAS: {total_annual_energy_without_losses:,.1f} kWh/ano")
            logger.info(f"📉 PERDAS APLICADAS: {perdas_totais_pct}% = {total_annual_energy_without_losses - total_annual_energy:,.1f} kWh/ano")
            logger.info(f"⚡ ENERGIA FINAL: {total_annual_energy:,.1f} kWh/ano")
            
            # Removido cálculo de cobertura - não aplicável para número fixo de módulos
            
            # Métricas de performance com dados reais
            capacity_factor = (energy_per_module / (request.modulo.potencia_nominal_w * 8760 / 1000)) * 100
            hsp_annual = energy_per_module / (request.modulo.potencia_nominal_w / 1000)
            hsp_daily = hsp_annual / 365
            
            # Performance Ratio - usar dados da simulação se disponíveis
            pr_medio = annual_energy.get('performance_ratio', 0)
            if pr_medio == 0:  # Fallback para cálculo manual
                energia_teorica_ideal = (request.modulo.potencia_nominal_w / 1000) * hsp_annual * num_modules
                pr_medio = (total_annual_energy / energia_teorica_ideal) * 100 if energia_teorica_ideal > 0 else 0
            
            # Yield Específico - kWh por kWp instalado
            yield_especifico = total_annual_energy / total_power_kw if total_power_kw > 0 else 0
            
            # Variabilidade
            variability_percentage = (energy_std * request.num_modules / total_annual_energy_without_losses) * 100 if total_annual_energy_without_losses > 0 else 0
            
            # Log das métricas calculadas
            logger.info(f"📊 Métricas: PR={pr_medio:.1f}%, CF={capacity_factor:.1f}%, Yield={yield_especifico:.1f} kWh/kWp")
            
            # Dados de clipping da simulação
            clipping_info = annual_energy.get('clipping_percentage', 0)
            
            # Análise de compatibilidade - agora com string_config real
            compatibility = self._analyze_system_compatibility(
                request.modulo, request.inversor, num_modules, string_config
            )
            
            # Cálculos de área e peso
            area_m2 = self._calculate_total_area(request.modulo, num_modules)
            peso_total = self._calculate_total_weight(request.modulo, num_modules)
            
            # Geração mensal estimada (com perdas aplicadas)
            geracao_mensal = self._estimate_monthly_generation(total_annual_energy, request.lat)
            
            # Economia de CO2 (fator médio brasileiro: 0.5 kg CO2/kWh)
            economia_co2 = total_annual_energy * 0.5
            
            # Calcular cobertura percentual do consumo
            cobertura_percentual = min(100.0, (total_annual_energy / request.consumo_anual_kwh) * 100.0) if request.consumo_anual_kwh > 0 else 0.0
            
            return ModuleCalculationResponse(
                num_modulos=num_modules,
                potencia_total_kw=round(total_power_kw, 2),
                energia_total_anual=round(total_annual_energy, 1),  # Mudança: agora com perdas aplicadas
                energia_por_modulo=round(energy_per_module * (1.0 - perdas_totais_pct / 100.0), 1),  # Mudança: aplicando perdas aqui também
                cobertura_percentual=round(cobertura_percentual, 1),
                fator_capacidade=round(capacity_factor, 1),
                hsp_equivalente_dia=round(hsp_daily, 1),
                hsp_equivalente_anual=round(hsp_annual, 1),
                energia_anual_std=round(energy_std, 1),
                variabilidade_percentual=round(variability_percentage, 1),
                # Novos campos de performance
                pr_medio=round(pr_medio, 1),
                yield_especifico=round(yield_especifico, 1),
                # Mudança: aplicando perdas na energia por ano também
                energia_por_ano={str(year): round(energy * num_modules * (1.0 - perdas_totais_pct / 100.0), 1) 
                               for year, energy in annual_energy['annual_by_year'].items()},
                # Métricas diárias (com perdas aplicadas)
                energia_diaria_media=round(annual_energy.get('daily_mean', 0) * num_modules * (1.0 - perdas_totais_pct / 100.0), 3),
                energia_diaria_std=round(annual_energy.get('daily_std', 0) * num_modules * (1.0 - perdas_totais_pct / 100.0), 3),
                energia_diaria_min=round(annual_energy.get('daily_min', 0) * num_modules * (1.0 - perdas_totais_pct / 100.0), 3),
                energia_diaria_max=round(annual_energy.get('daily_max', 0) * num_modules * (1.0 - perdas_totais_pct / 100.0), 3),
                # Geração mensal estimada
                geracao_mensal=[round(val, 1) for val in geracao_mensal],
                compatibilidade_sistema=compatibility,
                area_necessaria_m2=round(area_m2, 1),
                peso_total_kg=round(peso_total, 1),
                economia_anual_co2=round(economia_co2, 2),
                parametros_completos={
                    'num_modules': num_modules,
                    'localizacao': {'lat': request.lat, 'lon': request.lon},
                    'orientacao': {'tilt': request.tilt, 'azimuth': request.azimuth},
                    'modulo': request.modulo.dict(),
                    'inversor': request.inversor.dict(),
                    'perdas_sistema': request.perdas_sistema,
                    'fator_seguranca': request.fator_seguranca
                },
                # Perdas detalhadas calculadas a partir dos parâmetros do sistema
                perdas_detalhadas={
                    'temperatura': [5.0] * 12,  # Perdas de temperatura fixas (não configurável)
                    'sombreamento': [request.perda_sombreamento or 3.0] * 12,  # Perdas reais do frontend
                    'mismatch': [request.perda_mismatch or 2.0] * 12,          # Perdas reais do frontend
                    'cabeamento': [request.perda_cabeamento or 2.0] * 12,      # Perdas reais do frontend
                    'sujeira': [request.perda_sujeira or 5.0] * 12,            # Perdas reais do frontend
                    'inversor': [request.perda_inversor or 3.0] * 12,          # Perdas reais do frontend
                    'outras': [request.perda_outras or 0.0] * 12,              # Perdas reais do frontend
                    'total': [perdas_totais_pct] * 12  # Perdas totais reais aplicadas do frontend
                },
                dados_processados=records_processed,
                anos_analisados=len(annual_energy['annual_by_year']),
                periodo_dados=PeriodAnalysis(
                    inicio='2018-01-01',  # Mudança: período alinhado com notebook
                    fim='2020-12-31',     # Mudança: período alinhado com notebook
                    anos_completos=3      # Mudança: 3 anos (2018, 2019, 2020)
                )
            )
            
        except Exception as e:
            logger.error(f"Erro no dimensionamento: {e}")
            raise CalculationError(f"Falha no cálculo de dimensionamento: {str(e)}")
    
    def _analyze_system_compatibility(self, modulo, inversor, num_modules: int, string_config: dict = None) -> SystemCompatibility:
        """Analisa compatibilidade entre módulo e inversor"""
        
        # Compatibilidade de tensão - CORREÇÃO: mapeamento correto dos nomes
        tensao_cc_max = getattr(inversor, 'tensaoCcMax', None) or getattr(inversor, 'tensao_cc_max_v', None)
        if modulo.vmpp and tensao_cc_max:
            compatibilidade_tensao = modulo.vmpp <= tensao_cc_max
        else:
            compatibilidade_tensao = True  # Assume compatível se dados não disponíveis
        
        # Usar configuração real se fornecida, senão calcular
        if string_config:
            strings_recomendadas = string_config.get('strings_per_inverter', 1)
            modulos_por_string = string_config.get('modules_per_string', num_modules)
            logger.info(f"🔌 Usando configuração calculada: {modulos_por_string} módulos/string, {strings_recomendadas} strings")
        else:
            # Fallback para configuração simples
            strings_recomendadas = 1
            modulos_por_string = num_modules
            
            # Verificar limites do inversor
            numero_mppt = getattr(inversor, 'numeroMppt', None) or getattr(inversor, 'numero_mppt', None)
            strings_por_mppt = getattr(inversor, 'stringsPorMppt', None) or getattr(inversor, 'strings_por_mppt', None)
            
            if numero_mppt and strings_por_mppt:
                max_strings = numero_mppt * strings_por_mppt
                if num_modules > max_strings:
                    strings_recomendadas = min(max_strings, num_modules)
                    modulos_por_string = int(np.ceil(num_modules / strings_recomendadas))
                    
            logger.info(f"⚠️ Usando configuração calculada automaticamente (fallback)")
        
        # Cálculos de potência e compatibilidade
        potencia_nominal_modulos_kw = (num_modules * modulo.potencia_nominal_w) / 1000
        potencia_inversor_kw = inversor.potencia_saida_ca_w / 1000
        
        # Oversizing nominal (DC/AC ratio)
        oversizing_percentual = (potencia_nominal_modulos_kw / potencia_inversor_kw) * 100
        
        # Utilização esperada considerando perdas típicas do sistema (~20%)
        potencia_real_modulos_kw = potencia_nominal_modulos_kw * 0.8  
        utilizacao_inversor = (potencia_real_modulos_kw / potencia_inversor_kw) * 100
        
        # Margem de segurança
        margem_seguranca = max(0, 100 - utilizacao_inversor)
        
        logger.info(f"🔌 Compatibilidade: DC={potencia_nominal_modulos_kw:.1f}kW, AC={potencia_inversor_kw:.1f}kW, Oversizing={oversizing_percentual:.1f}%")
        
        return SystemCompatibility(
            compatibilidade_tensao=compatibilidade_tensao,
            strings_recomendadas=strings_recomendadas,
            modulos_por_string=modulos_por_string,  # Agora reflete configuração real calculada
            utilizacao_inversor=round(utilizacao_inversor, 1),
            oversizing_percentual=round(oversizing_percentual, 1),
            margem_seguranca=round(margem_seguranca, 1)
        )
    
    def _calculate_total_area(self, modulo, num_modules: int) -> float:
        """Calcula área total necessária em m²"""
        # Usar dimensões fornecidas ou fallback para Canadian Solar CS3W-540MS
        largura_mm = getattr(modulo, 'largura_mm', None) or 2261  # mm
        altura_mm = getattr(modulo, 'altura_mm', None) or 1134   # mm
        
        # Sempre usar dimensões físicas reais do módulo
        area_por_modulo = (largura_mm * altura_mm) / 1_000_000  # Converter para m²
        return num_modules * area_por_modulo
    
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
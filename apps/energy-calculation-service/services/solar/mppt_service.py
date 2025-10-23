import logging
import math
from typing import Dict, Any
from models.solar.mppt_models import MPPTCalculationRequest, MPPTCalculationResponse
from core.exceptions import CalculationError, ValidationError
from services.solar.pvgis_service import pvgis_service

logger = logging.getLogger(__name__)


class MPPTService:
    """Serviço para cálculo de módulos por MPPT"""
    
    def __init__(self):
        """Inicializa o serviço MPPT"""
        logger.info("Inicializando MPPTService")
    
    def calculate_modules_per_mppt(self, request: MPPTCalculationRequest) -> MPPTCalculationResponse:
        """
        Calcula quantos módulos podem ser conectados por MPPT

        Args:
            request: Dados do inversor para cálculo

        Returns:
            MPPTCalculationResponse com resultado do cálculo

        Raises:
            ValidationError: Parâmetros inválidos
            CalculationError: Erro no cálculo
        """

        try:
            # Validações básicas
            self._validate_inverter_parameters(request)

            # Usar potencia_fv_max_w (DC) se disponível, caso contrário usar potencia_saida_ca_w (AC)
            potencia_limitante = request.potencia_fv_max_w or request.potencia_saida_ca_w
            potencia_tipo = "DC (potencia_fv_max_w)" if request.potencia_fv_max_w else "AC (potencia_saida_ca_w - fallback)"
            num_modulos_por_potencia = math.floor(potencia_limitante / request.potencia_modulo_w)

            # REGRA 2: Limitação por tensão - obter temperatura mínima do PVGIS
            tmin = self._get_minimum_temperature(request.latitude, request.longitude)

            # Calcular VocCold
            STC = 25.0  # Condições padrão de teste
            b_voc = request.temp_coef_voc / 100  # Converter % para decimal
            voc_cold = request.voc_stc * (1 + b_voc * (tmin - STC))

            # Calcular módulos máximos por MPPT por limitação de tensão
            tensao_cc_max_v = request.tensao_cc_max_v or request.faixa_mppt_max_v
            num_modulos_por_tensao_mppt = math.floor(tensao_cc_max_v / voc_cold)
            num_modulos_por_tensao_total = num_modulos_por_tensao_mppt * request.numero_mppt
            
            # REGRA FINAL: Calcular limite por MPPT individual
            # Para limitação por potência: usar o valor total (já é por MPPT)
            modulos_por_mppt_potencia = num_modulos_por_potencia

            # Para limitação por tensão: já temos o valor por MPPT
            modulos_por_mppt_tensao = num_modulos_por_tensao_mppt

            #Limitar por quantidade de strings
            modulos_por_mppt_string = modulos_por_mppt_tensao // request.strings_por_mppt

            #ajuste por corrente 
            #Corrente Curto-Circuito (Isc) do modulo adicionar no request
            if not(request.strings_por_mppt * 1.25 * request.isc < request.corrente_mppt_max_a):
                logger.error(f"A corrente excede o valor máximo da MPPT, revise o projeto!")
                raise CalculationError(f"A corrente excede o valor máximo da MPPT, revise o projeto!")

            # Definir variáveis de limitação para resposta
            limitacao_potencia = {
                "modulos_maximos_total": num_modulos_por_potencia,
                "modulos_por_mppt": modulos_por_mppt_potencia,
                "descricao": f"Limitação por potência: {potencia_limitante}W ({potencia_tipo}) ÷ {request.potencia_modulo_w}W = {num_modulos_por_potencia} módulos no total"
            }

            limitacao_tensao = {
                "voc_cold": round(voc_cold, 2),
                "tensao_mppt_max": tensao_cc_max_v,
                "modulos_por_mppt": modulos_por_mppt_tensao,
                "descricao": f"Limitação por tensão: {tensao_cc_max_v}V ÷ {voc_cold:.2f}V = {modulos_por_mppt_tensao} módulos por MPPT"
            }

            # Usar o menor dos dois como limite real por MPPT
            modulos_por_mppt = min(modulos_por_mppt_potencia, modulos_por_mppt_tensao)
            print(f"   Decisão: min({modulos_por_mppt_potencia}, {modulos_por_mppt_tensao}) = {modulos_por_mppt} módulos por MPPT")

            if modulos_por_mppt_potencia <= modulos_por_mppt_tensao:
                limitacao_principal = f"Limitado por potência: {modulos_por_mppt} módulos por MPPT"
                print(f"✅ [MPPT SERVICE] Limitação CRÍTICA: POTÊNCIA ({modulos_por_mppt} módulos/MPPT)")
                logger.info("Limitação crítica: POTÊNCIA")
            else:
                limitacao_principal = f"Limitado por tensão: {modulos_por_mppt} módulos por MPPT"
                print(f"✅ [MPPT SERVICE] Limitação CRÍTICA: TENSÃO ({modulos_por_mppt} módulos/MPPT)")
                logger.info("Limitação crítica: TENSÃO")

            # Ajustar total baseado na distribuição real
            modulos_total = modulos_por_mppt * request.numero_mppt
            print(f"\n📊 [MPPT SERVICE] Etapa 7: Calculando TOTAL no sistema...")
            print(f"   Fórmula: Total = Módulos_por_MPPT × Número_de_MPPTs")
            print(f"   Cálculo: {modulos_por_mppt} × {request.numero_mppt} = {modulos_total} módulos")
            print(f"✅ [MPPT SERVICE] Total de módulos no sistema: {modulos_total}")
            logger.info(f"Resultado final: {modulos_por_mppt} módulos/MPPT × {request.numero_mppt} MPPTs = {modulos_total} módulos")

            # Análise básica (será expandida com regras de negócio)
            print(f"\n🔍 [MPPT SERVICE] Etapa 8: Gerando análise detalhada...")
            analise_detalhada = self._analyze_system_limits(request, modulos_por_mppt)
            print(f"✅ [MPPT SERVICE] Análise concluída")

            # Configuração recomendada
            print(f"\n⚙️  [MPPT SERVICE] Etapa 9: Gerando configuração recomendada...")
            configuracao = self._generate_recommended_configuration(request, modulos_por_mppt)
            print(f"✅ [MPPT SERVICE] Configuração gerada")

            logger.info(f"Cálculo concluído: {modulos_por_mppt} módulos por MPPT, {modulos_total} total")

            # Calcular total real baseado na limitação mais restritiva
            total_modulos_sistema = min(num_modulos_por_potencia, num_modulos_por_tensao_total)
            print(f"\n🏁 [MPPT SERVICE] RESULTADO FINAL:")
            print(f"   📊 Módulos por MPPT: {modulos_por_mppt}")
            print(f"   🔢 Total no sistema: {total_modulos_sistema}")
            print(f"   🎯 Limitação: {limitacao_principal}")
            print("=" * 100 + "\n")
            
            return MPPTCalculationResponse(
                modulos_por_mppt=modulos_por_mppt,
                modulos_total_sistema=total_modulos_sistema,
                limitacao_principal=limitacao_principal,
                analise_detalhada=analise_detalhada,
                configuracao_recomendada=configuracao,
                parametros_entrada={
                    "fabricante": request.fabricante,
                    "modelo": request.modelo,
                    "potencia_saida_ca_w": request.potencia_saida_ca_w,
                    "numero_mppt": request.numero_mppt,
                    "total_modulos": total_modulos_sistema
                }
            )
            
        except Exception as e:
            logger.error(f"Erro no cálculo de módulos por MPPT: {e}")
            raise CalculationError(f"Falha no cálculo MPPT: {str(e)}")
    
    def _validate_inverter_parameters(self, request: MPPTCalculationRequest) -> None:
        """Valida parâmetros básicos do inversor e módulo"""

        if request.potencia_saida_ca_w <= 0:
            raise ValidationError("Potência de saída CA deve ser maior que zero")

        if request.potencia_modulo_w <= 0:
            raise ValidationError("Potência do módulo deve ser maior que zero")

        # Validação de oversizing
        if request.potencia_fv_max_w and request.potencia_saida_ca_w:
            oversizing_ratio = request.potencia_fv_max_w / request.potencia_saida_ca_w

            if oversizing_ratio < 1.0:
                raise ValidationError(
                    f"Potência FV máxima ({request.potencia_fv_max_w}W) não pode ser menor "
                    f"que potência de saída CA ({request.potencia_saida_ca_w}W). "
                    f"Ratio atual: {oversizing_ratio:.2f}"
                )

            if oversizing_ratio > 2.0:
                logger.warning(
                    f"Oversizing muito alto detectado: {oversizing_ratio:.1%} "
                    f"({request.potencia_fv_max_w}W DC / {request.potencia_saida_ca_w}W AC). "
                    f"Típico: 120-150%"
                )

            logger.info(f"Oversizing ratio: {oversizing_ratio:.1%} (DC/AC)")
        
        if request.voc_stc <= 0:
            raise ValidationError("Tensão Voc STC deve ser maior que zero")
        
        if not (-1.0 <= request.temp_coef_voc <= 0):
            raise ValidationError("Coeficiente de temperatura Voc deve estar entre -1.0 e 0 %/°C")
        
        if request.numero_mppt <= 0:
            raise ValidationError("Número de MPPT deve ser maior que zero")
        
        if request.tensao_cc_max_v and request.tensao_cc_max_v <= 0:
            raise ValidationError("Tensão CC máxima deve ser maior que zero")
        
        if request.strings_por_mppt and request.strings_por_mppt <= 0:
            raise ValidationError("Strings por MPPT deve ser maior que zero")
            
        logger.debug("Parâmetros do inversor e módulo validados com sucesso")
    
    def _get_minimum_temperature(self, latitude: float, longitude: float) -> float:
        """Obtém temperatura mínima histórica do PVGIS"""
        
        try:
            # Buscar dados meteorológicos do PVGIS
            df = pvgis_service.fetch_weather_data(latitude, longitude)
            
            if df.empty:
                logger.warning("Dados PVGIS vazios, usando temperatura mínima padrão: 0°C")
                return 0.0
            
            # Calcular temperatura mínima
            temp_min = float(df['temp_air'].min())
            logger.info(f"Temperatura mínima obtida do PVGIS: {temp_min}°C")
            
            return temp_min
            
        except Exception as e:
            logger.error(f"Erro ao obter temperatura mínima do PVGIS: {e}")
            logger.warning("Usando temperatura mínima padrão: 0°C")
            return 0.0
    
    def _analyze_system_limits(self, request: MPPTCalculationRequest, modulos_por_mppt: int) -> Dict[str, Any]:
        """Analisa limitações técnicas do sistema"""
        
        # Análise básica - será expandida com regras reais
        analise = {
            "limite_tensao": "A ser calculado",
            "limite_corrente": "A ser calculado", 
            "limite_potencia": "A ser calculado",
            "limite_strings": "A ser calculado",
            "configuracao_otima": f"{modulos_por_mppt} módulos por MPPT é a configuração recomendada"
        }
        
        logger.debug(f"Análise de limites concluída: {analise}")
        return analise
    
    def _generate_recommended_configuration(self, request: MPPTCalculationRequest, modulos_por_mppt: int) -> Dict[str, Any]:
        """Gera configuração recomendada do sistema"""
        
        strings_por_mppt = request.strings_por_mppt or 2
        modulos_por_string = max(1, modulos_por_mppt // strings_por_mppt)
        
        configuracao = {
            "strings_por_mppt": strings_por_mppt,
            "modulos_por_string": modulos_por_string,
            "total_mppt_utilizados": request.numero_mppt,
            "total_strings_sistema": strings_por_mppt * request.numero_mppt,
            "distribuicao": f"{strings_por_mppt} strings × {modulos_por_string} módulos por MPPT"
        }
        
        logger.debug(f"Configuração recomendada: {configuracao}")
        return configuracao


# Instância singleton
mppt_service = MPPTService()
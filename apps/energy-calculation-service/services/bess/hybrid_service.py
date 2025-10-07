"""
Serviço orquestrador para cálculo de sistemas HÍBRIDOS (Solar + BESS)

Este serviço integra:
1. Cálculo de geração solar (reutiliza SolarCalculationService existente)
2. Geração de perfil de consumo horário
3. Simulação de operação do BESS
4. Análise financeira integrada

É o ponto de entrada principal para análise de sistemas híbridos.
"""

import logging
import numpy as np
from typing import Dict, Any
from datetime import datetime
from calendar import monthrange

# Importar serviços existentes
from services.solar.solar_service import SolarCalculationService
from services.bess.simulation_service import bess_simulation_service
from services.shared.hybrid_financial_service import hybrid_financial_service

# Importar modelos
from models.bess.hybrid_requests import HybridDimensioningRequest
from models.bess.hybrid_responses import HybridDimensioningResponse
from models.bess.requests import PerfilConsumo

logger = logging.getLogger(__name__)


class HybridDimensioningService:
    """
    Serviço orquestrador para análise de sistemas híbridos Solar + BESS

    Fluxo de execução:
    1. Calcula geração solar (PVLIB ModelChain)
    2. Gera perfil de consumo horário
    3. Simula operação do BESS
    4. Calcula análise financeira integrada
    5. Compara cenários (sem sistema, só solar, só BESS, híbrido)
    """

    def __init__(self):
        """Inicializa o serviço de dimensionamento híbrido"""
        self.solar_service = SolarCalculationService()
        logger.info("Inicializando HybridDimensioningService")

    def calculate_hybrid_system(
        self,
        request: HybridDimensioningRequest
    ) -> HybridDimensioningResponse:
        """
        Calcula sistema híbrido completo

        Este método orquestra todas as etapas:
        - Geração solar (código existente)
        - Simulação BESS
        - Análise financeira

        Args:
            request: Parâmetros do sistema híbrido

        Returns:
            HybridDimensioningResponse com resultados completos
        """

        logger.info("=" * 100)
        logger.info("🔋⚡ INÍCIO DO CÁLCULO DE SISTEMA HÍBRIDO SOLAR + BESS")
        logger.info("=" * 100)

        try:
            # =================================================================
            # ETAPA 1: CALCULAR SISTEMA SOLAR (REUTILIZAR CÓDIGO EXISTENTE)
            # =================================================================
            # Usa o SolarCalculationService que já implementa PVLIB ModelChain
            # Retorna: geração mensal, geração anual, performance ratio, etc.

            logger.info("\n🌞 ETAPA 1/5: Calculando geração solar com PVLIB...")
            logger.info(f"   Localização: ({request.sistema_solar.lat}, {request.sistema_solar.lon})")
            logger.info(f"   Módulos: {request.sistema_solar.modulo.fabricante} {request.sistema_solar.modulo.modelo}")

            # Chamar serviço solar existente
            solar_result = self.solar_service.calculate(request.sistema_solar)

            # Extrair dados importantes
            geracao_anual_kwh = solar_result["energia_anual_kwh"]
            geracao_mensal_kwh_dict = solar_result["geracao_mensal_kwh"]
            potencia_solar_kwp = solar_result["potencia_total_kwp"]

            # Converter geracao_mensal de dict para lista ordenada [Jan, Fev, ..., Dez]
            meses_ordem = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
                          "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
            geracao_mensal_kwh = [geracao_mensal_kwh_dict[mes] for mes in meses_ordem]

            logger.info(f"✅ Sistema solar calculado:")
            logger.info(f"   - Potência: {potencia_solar_kwp:.2f} kWp")
            logger.info(f"   - Geração anual: {geracao_anual_kwh:.0f} kWh/ano")
            logger.info(f"   - Performance Ratio: {solar_result.get('pr_total', 0):.1f}%")

            # =================================================================
            # ETAPA 2: GERAR PERFIL DE CONSUMO HORÁRIO (8760 HORAS)
            # =================================================================
            # Transformar consumo mensal em curva horária usando perfil típico

            logger.info("\n📊 ETAPA 2/5: Gerando perfil de consumo horário...")

            # Usar perfil fornecido ou padrão comercial
            perfil = request.perfil_consumo or PerfilConsumo(tipo="comercial")

            # Extrair consumo mensal do request solar
            consumo_mensal_kwh = request.sistema_solar.consumo_mensal_kwh

            # Gerar curva horária (8760 valores em W)
            curva_consumo_w = self._generate_hourly_consumption(
                consumo_mensal_kwh, perfil
            )

            consumo_anual_kwh = sum(consumo_mensal_kwh)
            logger.info(f"✅ Perfil de consumo gerado:")
            logger.info(f"   - Consumo anual: {consumo_anual_kwh:.0f} kWh")
            logger.info(f"   - Perfil: {perfil.tipo}")

            # =================================================================
            # ETAPA 3: GERAR CURVA DE GERAÇÃO SOLAR HORÁRIA
            # =================================================================
            # Distribuir geração mensal em curva horária usando perfil solar típico

            logger.info("\n☀️  ETAPA 3/5: Gerando curva solar horária...")

            curva_geracao_solar_w = self._generate_hourly_solar_generation(
                geracao_mensal_kwh
            )

            logger.info(f"✅ Curva solar horária gerada (8760 pontos)")

            # =================================================================
            # ETAPA 4: SIMULAR OPERAÇÃO DO BESS
            # =================================================================
            # Simula comportamento hora a hora do BESS considerando:
            # - Geração solar vs consumo
            # - Estratégia de operação
            # - Limites físicos da bateria

            logger.info("\n🔋 ETAPA 4/5: Simulando operação do BESS...")
            logger.info(f"   - Capacidade: {request.capacidade_kwh} kWh")
            logger.info(f"   - Potência: {request.potencia_kw} kW")
            logger.info(f"   - Estratégia: {request.estrategia}")

            # Montar parâmetros da bateria
            parametros_bateria = {
                "eficiencia_roundtrip": request.eficiencia_roundtrip,
                "soc_inicial": request.soc_inicial,
                "soc_min": request.soc_minimo,
                "soc_max": request.soc_maximo,
                "dod_max": request.profundidade_descarga_max,
            }

            # Chamar simulação BESS
            bess_result = bess_simulation_service.simulate_annual_operation(
                capacidade_kwh=request.capacidade_kwh,
                potencia_kw=request.potencia_kw,
                curva_geracao_solar_w=curva_geracao_solar_w,
                curva_consumo_w=curva_consumo_w,
                tarifa=request.tarifa,
                estrategia=request.estrategia,
                parametros_bateria=parametros_bateria,
                limite_demanda_kw=request.limite_demanda_kw
            )

            logger.info(f"✅ Simulação BESS concluída:")
            logger.info(f"   - Ciclos equivalentes: {bess_result['ciclos_equivalentes_ano']:.1f}")
            logger.info(f"   - Economia anual: R$ {bess_result['economia_total_anual_reais']:,.2f}")
            logger.info(f"   - SOC médio: {bess_result['soc_medio_percentual']:.1f}%")

            # =================================================================
            # ETAPA 5: ANÁLISE FINANCEIRA INTEGRADA
            # =================================================================
            # Calcula métricas econômicas e compara cenários

            logger.info("\n💰 ETAPA 5/5: Calculando análise financeira integrada...")

            # Calcular investimento solar (simplificado)
            # Custo típico: R$ 4.000-6.000/kWp (média R$ 5.000)
            investimento_solar = potencia_solar_kwp * 5000.0

            # Calcular investimento BESS
            # Fórmula: (Capacidade × Custo/kWh) + (Potência × Custo/kW) + Instalação
            investimento_bess = (
                request.capacidade_kwh * request.custo_kwh_bateria +
                request.potencia_kw * request.custo_kw_inversor_bess +
                request.custo_instalacao_bess
            )

            logger.info(f"   - Investimento solar: R$ {investimento_solar:,.2f}")
            logger.info(f"   - Investimento BESS: R$ {investimento_bess:,.2f}")
            logger.info(f"   - Investimento total: R$ {(investimento_solar + investimento_bess):,.2f}")

            # Calcular tarifa média ponderada
            tarifa_media_kwh = self._calcular_tarifa_media(request.tarifa)

            # Chamar análise financeira
            analise_hibrida = hybrid_financial_service.analyze_hybrid_system(
                solar_result=solar_result,
                bess_result=bess_result,
                investimento_solar=investimento_solar,
                investimento_bess=investimento_bess,
                consumo_mensal=consumo_mensal_kwh,
                tarifa_media_kwh=tarifa_media_kwh,
                taxa_desconto=request.taxa_desconto,
                vida_util_anos=request.vida_util_anos
            )

            logger.info(f"✅ Análise financeira concluída:")
            logger.info(f"   - VPL híbrido: R$ {analise_hibrida['retorno_financeiro']['npv_reais']:,.2f}")
            logger.info(f"   - TIR: {analise_hibrida['retorno_financeiro']['tir_percentual']:.1f}%")
            logger.info(f"   - Payback: {analise_hibrida['retorno_financeiro']['payback_simples_anos']:.1f} anos")
            logger.info(f"   - Autossuficiência: {analise_hibrida['autossuficiencia']['autossuficiencia_percentual']:.1f}%")

            # =================================================================
            # ETAPA 6: MONTAR RESPOSTA FINAL
            # =================================================================

            logger.info("\n" + "=" * 100)
            logger.info("✅ CÁLCULO HÍBRIDO CONCLUÍDO COM SUCESSO")
            logger.info("=" * 100 + "\n")

            return HybridDimensioningResponse(
                sistema_solar=solar_result,
                sistema_bess=bess_result,
                analise_hibrida=analise_hibrida,
                series_temporais=None  # Opcional: pode incluir séries temporais se necessário
            )

        except Exception as e:
            logger.error(f"❌ Erro no cálculo híbrido: {e}", exc_info=True)
            raise

    # =========================================================================
    # MÉTODOS AUXILIARES
    # =========================================================================

    def _generate_hourly_consumption(
        self,
        consumo_mensal_kwh: list,
        perfil: PerfilConsumo
    ) -> np.ndarray:
        """
        Gera curva de consumo horário (8760 valores) a partir do consumo mensal

        Args:
            consumo_mensal_kwh: Lista com consumo de cada mês [Jan, Fev, ..., Dez]
            perfil: Perfil de consumo (com curva horária típica)

        Returns:
            Array numpy com 8760 valores de consumo em Watts
        """

        # Obter curva horária típica do perfil
        # Se não fornecida, usar perfil comercial padrão
        if perfil.curva_horaria:
            # Curva fornecida: 24 valores em % do consumo diário
            curva_24h = np.array(perfil.curva_horaria) / 100.0  # Normalizar
        else:
            # Usar perfil padrão comercial (exemplo)
            # Horário comercial: picos 10h-12h e 14h-17h
            curva_24h = np.array([
                0.02, 0.015, 0.01, 0.01, 0.015, 0.025, 0.04, 0.055, 0.06, 0.055,
                0.05, 0.05, 0.055, 0.06, 0.065, 0.07, 0.075, 0.08, 0.07, 0.06,
                0.05, 0.04, 0.03, 0.025
            ])

        # Garantir que soma = 1.0
        curva_24h = curva_24h / curva_24h.sum()

        # Gerar consumo hora a hora para o ano
        curva_anual_w = []

        # Ano típico: 2023 (não bissexto)
        for mes_idx, consumo_mes_kwh in enumerate(consumo_mensal_kwh):
            # Número de dias no mês (mes_idx: 0=Jan, 1=Fev, ...)
            dias_no_mes = monthrange(2023, mes_idx + 1)[1]

            # Consumo médio diário do mês (kWh/dia)
            consumo_diario_kwh = consumo_mes_kwh / dias_no_mes

            # Para cada dia do mês
            for dia in range(dias_no_mes):
                # Aplicar curva horária
                # Consumo de cada hora = consumo_diario × % da hora
                consumo_dia_horario = consumo_diario_kwh * curva_24h  # Array 24 valores em kWh

                # Converter kWh para W (média da hora)
                # 1 kWh = 1000 W durante 1 hora
                consumo_dia_w = consumo_dia_horario * 1000.0  # Array 24 valores em W

                curva_anual_w.extend(consumo_dia_w)

        return np.array(curva_anual_w)

    def _generate_hourly_solar_generation(
        self,
        geracao_mensal_kwh: list
    ) -> np.ndarray:
        """
        Gera curva de geração solar horária (8760 valores) a partir da geração mensal

        Usa curva solar típica: geração concentrada das 7h às 17h

        Args:
            geracao_mensal_kwh: Lista com geração de cada mês [Jan, Fev, ..., Dez]

        Returns:
            Array numpy com 8760 valores de geração em Watts
        """

        # Curva solar típica (24 horas)
        # Geração concentrada no período diurno (7h-17h)
        # Formato: % da geração diária em cada hora
        curva_solar_24h = np.array([
            0.00, 0.00, 0.00, 0.00, 0.00, 0.00,  # 0h-5h: noite
            0.01, 0.03, 0.06, 0.09, 0.11, 0.12,  # 6h-11h: manhã crescente
            0.13, 0.12, 0.11, 0.09, 0.07, 0.04,  # 12h-17h: tarde decrescente
            0.02, 0.00, 0.00, 0.00, 0.00, 0.00   # 18h-23h: noite
        ])

        # Normalizar para somar 1.0
        curva_solar_24h = curva_solar_24h / curva_solar_24h.sum()

        # Gerar geração hora a hora para o ano
        curva_anual_w = []

        for mes_idx, geracao_mes_kwh in enumerate(geracao_mensal_kwh):
            # Número de dias no mês
            dias_no_mes = monthrange(2023, mes_idx + 1)[1]

            # Geração média diária do mês (kWh/dia)
            geracao_diaria_kwh = geracao_mes_kwh / dias_no_mes

            # Para cada dia do mês
            for dia in range(dias_no_mes):
                # Aplicar curva solar horária
                geracao_dia_horaria = geracao_diaria_kwh * curva_solar_24h  # kWh

                # Converter kWh para W
                geracao_dia_w = geracao_dia_horaria * 1000.0  # W

                curva_anual_w.extend(geracao_dia_w)

        return np.array(curva_anual_w)

    def _calcular_tarifa_media(self, tarifa) -> float:
        """
        Calcula tarifa média ponderada

        Args:
            tarifa: Estrutura TarifaEnergia

        Returns:
            Tarifa média em R$/kWh
        """

        if tarifa.tipo == "branca":
            # Tarifa branca: média ponderada (assumindo 3h ponta, 2h intermediária, 19h fora-ponta)
            ponta = tarifa.tarifa_ponta_kwh or 0
            intermediaria = tarifa.tarifa_intermediaria_kwh or 0
            fora_ponta = tarifa.tarifa_fora_ponta_kwh or 0

            media = (ponta * 3 + intermediaria * 2 + fora_ponta * 19) / 24
            return media

        else:
            # Convencional/Verde/Azul: usar fora-ponta como referência
            return tarifa.tarifa_fora_ponta_kwh or tarifa.tarifa_ponta_kwh or 0.75


# Instância singleton
hybrid_dimensioning_service = HybridDimensioningService()

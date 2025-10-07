"""
Serviço de análise financeira para sistemas HÍBRIDOS (Solar + BESS)

Este serviço calcula métricas econômicas integradas:
- VPL (Valor Presente Líquido)
- TIR (Taxa Interna de Retorno)
- Payback simples e descontado
- LCOE (Custo Nivelado de Energia)
- Comparação de cenários (sem sistema, só solar, só BESS, híbrido)

Baseado na lógica do notebook BESS_PRo_Funcionando_R16.ipynb
"""

import logging
import numpy as np
import numpy_financial as npf
from typing import Dict, Any, List

logger = logging.getLogger(__name__)


class HybridFinancialService:
    """
    Serviço para análise financeira de sistemas híbridos Solar + BESS

    Calcula métricas econômicas comparando diferentes cenários de investimento.
    """

    def __init__(self):
        """Inicializa o serviço de análise financeira híbrida"""
        logger.info("Inicializando HybridFinancialService")

    def analyze_hybrid_system(
        self,
        solar_result: Dict[str, Any],
        bess_result: Dict[str, Any],
        investimento_solar: float,
        investimento_bess: float,
        consumo_mensal: List[float],
        tarifa_media_kwh: float,
        taxa_desconto: float,
        vida_util_anos: int,
        inflacao_energia: float = 0.045  # 4.5% ao ano (média histórica)
    ) -> Dict[str, Any]:
        """
        Analisa o sistema híbrido e compara com cenários alternativos

        Args:
            solar_result: Resultado do cálculo solar (do SolarCalculationService)
            bess_result: Resultado da simulação BESS (do BessSimulationService)
            investimento_solar: Investimento total no sistema solar (R$)
            investimento_bess: Investimento total no sistema BESS (R$)
            consumo_mensal: Lista com consumo mensal em kWh [Jan, Fev, ..., Dez]
            tarifa_media_kwh: Tarifa média de energia em R$/kWh
            taxa_desconto: Taxa de desconto anual (ex: 0.08 para 8%)
            vida_util_anos: Vida útil do projeto (típico: 25 anos para solar, 10 para BESS)
            inflacao_energia: Taxa de inflação da energia (padrão 4.5% ao ano)

        Returns:
            Dict com análise financeira integrada
        """

        logger.info("💰 Iniciando análise financeira híbrida")

        # =====================================================================
        # ETAPA 1: EXTRAIR DADOS DOS RESULTADOS
        # =====================================================================

        # Dados solares
        energia_solar_anual_kwh = solar_result.get("energia_anual_kwh", 0)
        geracao_mensal_kwh = solar_result.get("geracao_mensal_kwh", {})

        # Dados BESS
        economia_bess_anual = bess_result.get("economia_total_anual_reais", 0)
        energia_bess_descarregada_kwh = bess_result.get("energia_descarregada_anual_kwh", 0)

        # Consumo total anual
        consumo_anual_kwh = sum(consumo_mensal)

        # Investimento total
        investimento_total = investimento_solar + investimento_bess

        logger.info(f"   Solar: {energia_solar_anual_kwh:.0f} kWh/ano, R$ {investimento_solar:,.2f}")
        logger.info(f"   BESS: Economia R$ {economia_bess_anual:,.2f}/ano, R$ {investimento_bess:,.2f}")
        logger.info(f"   Total: R$ {investimento_total:,.2f}")

        # =====================================================================
        # ETAPA 2: CALCULAR FLUXOS DE ENERGIA
        # =====================================================================

        # FLUXO 1: Energia solar → Consumo direto
        # Assume que parte da geração solar é consumida diretamente
        # Estimativa simplificada: 60% da geração vai para consumo direto
        energia_solar_para_consumo = energia_solar_anual_kwh * 0.60

        # FLUXO 2: Energia solar → BESS
        # Parte da geração solar carrega o BESS
        energia_solar_para_bess = bess_result.get("energia_armazenada_anual_kwh", 0) * 0.70

        # FLUXO 3: Energia solar → Rede (injeção)
        # Excedente que não foi usado nem armazenado
        energia_solar_para_rede = energia_solar_anual_kwh - energia_solar_para_consumo - energia_solar_para_bess
        energia_solar_para_rede = max(0, energia_solar_para_rede)

        # FLUXO 4: Energia BESS → Consumo
        # Toda energia descarregada do BESS vai para consumo
        energia_bess_para_consumo = energia_bess_descarregada_kwh

        # FLUXO 5: Energia Rede → Consumo
        # Diferença entre consumo e outras fontes
        energia_rede_para_consumo = consumo_anual_kwh - energia_solar_para_consumo - energia_bess_para_consumo
        energia_rede_para_consumo = max(0, energia_rede_para_consumo)

        # Autossuficiência: % do consumo atendido por fontes próprias
        # Fórmula: (Solar direto + BESS) / Consumo total
        autossuficiencia = ((energia_solar_para_consumo + energia_bess_para_consumo) / consumo_anual_kwh) * 100

        # Taxa de autoconsumo solar: % da geração solar que foi usada
        # Fórmula: (Solar direto + Solar→BESS) / Solar gerado
        if energia_solar_anual_kwh > 0:
            taxa_autoconsumo_solar = ((energia_solar_para_consumo + energia_solar_para_bess) / energia_solar_anual_kwh) * 100
        else:
            taxa_autoconsumo_solar = 0

        logger.info(f"   Autossuficiência: {autossuficiencia:.1f}%")
        logger.info(f"   Autoconsumo solar: {taxa_autoconsumo_solar:.1f}%")

        # =====================================================================
        # ETAPA 3: CALCULAR CENÁRIO BASELINE (SEM SISTEMA)
        # =====================================================================

        # Custo anual de energia SEM nenhum sistema
        # Fórmula: Consumo × Tarifa (com inflação ao longo dos anos)
        custo_energia_sem_sistema_ano1 = consumo_anual_kwh * tarifa_media_kwh

        # Fluxo de caixa: custo ao longo dos anos considerando inflação
        fluxo_sem_sistema = []
        for ano in range(1, vida_util_anos + 1):
            # Custo cresce com inflação da energia
            custo_ano = custo_energia_sem_sistema_ano1 * ((1 + inflacao_energia) ** (ano - 1))
            fluxo_sem_sistema.append(-custo_ano)  # Negativo = despesa

        # VPL do cenário sem sistema (quanto custaria em valor presente)
        custo_total_25_anos_sem_sistema = sum(fluxo_sem_sistema)
        vpn_sem_sistema = npf.npv(taxa_desconto, [0] + fluxo_sem_sistema)  # [0] = ano 0 (sem investimento)

        logger.info(f"   Cenário SEM sistema: Custo 25 anos = R$ {abs(custo_total_25_anos_sem_sistema):,.2f}")

        # =====================================================================
        # ETAPA 4: CALCULAR CENÁRIO SOMENTE SOLAR
        # =====================================================================

        # Economia anual com solar: Geração × Tarifa
        # Considera que toda geração substitui compra da rede
        economia_solar_anual = energia_solar_anual_kwh * tarifa_media_kwh

        # Fluxo de caixa SOMENTE SOLAR
        fluxo_somente_solar = [-investimento_solar]  # Ano 0: investimento inicial
        for ano in range(1, vida_util_anos + 1):
            # Economia cresce com inflação da energia
            # Mas geração solar degrada ~0.5% ao ano
            degradacao_solar = 0.995 ** ano  # 0.5% ao ano
            economia_ano = economia_solar_anual * degradacao_solar * ((1 + inflacao_energia) ** (ano - 1))
            fluxo_somente_solar.append(economia_ano)

        # Métricas financeiras
        vpn_somente_solar = npf.npv(taxa_desconto, fluxo_somente_solar)
        tir_somente_solar = self._calcular_tir(fluxo_somente_solar)
        payback_solar = self._calcular_payback_simples(investimento_solar, economia_solar_anual)
        payback_descontado_solar = self._calcular_payback_descontado(fluxo_somente_solar, taxa_desconto)

        logger.info(f"   Cenário SOMENTE SOLAR:")
        logger.info(f"      Investimento: R$ {investimento_solar:,.2f}")
        logger.info(f"      Economia anual: R$ {economia_solar_anual:,.2f}")
        logger.info(f"      VPL: R$ {vpn_somente_solar:,.2f}")
        logger.info(f"      Payback: {payback_solar:.1f} anos")

        # =====================================================================
        # ETAPA 5: CALCULAR CENÁRIO SOMENTE BESS
        # =====================================================================

        # Economia anual com BESS (já calculado pela simulação)
        # Vem do resultado da simulação: arbitragem + peak shaving

        # Fluxo de caixa SOMENTE BESS
        fluxo_somente_bess = [-investimento_bess]  # Ano 0: investimento inicial
        for ano in range(1, vida_util_anos + 1):
            # Economia cresce com inflação
            # Bateria degrada mais rápido (~2-3% ao ano)
            degradacao_bess = 0.975 ** ano  # 2.5% ao ano
            economia_ano = economia_bess_anual * degradacao_bess * ((1 + inflacao_energia) ** (ano - 1))

            # Após 10 anos, BESS precisa ser substituído (se vida útil > 10)
            if ano == 10 and vida_util_anos > 10:
                economia_ano -= investimento_bess * 0.70  # Reposição com custo 30% menor

            fluxo_somente_bess.append(economia_ano)

        # Métricas financeiras
        vpn_somente_bess = npf.npv(taxa_desconto, fluxo_somente_bess)
        tir_somente_bess = self._calcular_tir(fluxo_somente_bess)
        payback_bess = self._calcular_payback_simples(investimento_bess, economia_bess_anual)
        payback_descontado_bess = self._calcular_payback_descontado(fluxo_somente_bess, taxa_desconto)

        logger.info(f"   Cenário SOMENTE BESS:")
        logger.info(f"      Investimento: R$ {investimento_bess:,.2f}")
        logger.info(f"      Economia anual: R$ {economia_bess_anual:,.2f}")
        logger.info(f"      VPL: R$ {vpn_somente_bess:,.2f}")
        logger.info(f"      Payback: {payback_bess:.1f} anos")

        # =====================================================================
        # ETAPA 6: CALCULAR CENÁRIO HÍBRIDO (SOLAR + BESS)
        # =====================================================================

        # Economia total anual: Solar + BESS
        # A economia do BESS já considera a interação com o solar
        economia_hibrida_anual = economia_solar_anual + economia_bess_anual

        # Fluxo de caixa HÍBRIDO
        fluxo_hibrido = [-investimento_total]  # Ano 0: investimento total
        for ano in range(1, vida_util_anos + 1):
            # Economia solar com degradação
            degradacao_solar = 0.995 ** ano
            economia_solar_ano = energia_solar_anual_kwh * tarifa_media_kwh * degradacao_solar

            # Economia BESS com degradação
            degradacao_bess = 0.975 ** ano
            economia_bess_ano = economia_bess_anual * degradacao_bess

            # Inflação da energia aumenta o valor da economia
            fator_inflacao = (1 + inflacao_energia) ** (ano - 1)
            economia_ano_total = (economia_solar_ano + economia_bess_ano) * fator_inflacao

            # Reposição do BESS após 10 anos
            if ano == 10 and vida_util_anos > 10:
                economia_ano_total -= investimento_bess * 0.70

            fluxo_hibrido.append(economia_ano_total)

        # Métricas financeiras
        vpn_hibrido = npf.npv(taxa_desconto, fluxo_hibrido)
        tir_hibrido = self._calcular_tir(fluxo_hibrido)
        payback_hibrido = self._calcular_payback_simples(investimento_total, economia_hibrida_anual)
        payback_descontado_hibrido = self._calcular_payback_descontado(fluxo_hibrido, taxa_desconto)

        # LCOE (Custo Nivelado de Energia) do sistema híbrido
        # Fórmula: VPL dos custos / VPL da energia gerada
        energia_total_gerada = energia_solar_anual_kwh + energia_bess_descarregada_kwh
        lcoe_hibrido = abs(investimento_total) / (energia_total_gerada * vida_util_anos) if energia_total_gerada > 0 else 0

        logger.info(f"   Cenário HÍBRIDO:")
        logger.info(f"      Investimento: R$ {investimento_total:,.2f}")
        logger.info(f"      Economia anual: R$ {economia_hibrida_anual:,.2f}")
        logger.info(f"      VPL: R$ {vpn_hibrido:,.2f}")
        logger.info(f"      Payback: {payback_hibrido:.1f} anos")
        logger.info(f"      TIR: {tir_hibrido:.1f}%")

        # =====================================================================
        # ETAPA 7: COMPARAR CENÁRIOS
        # =====================================================================

        # Vantagem do híbrido sobre cada cenário individual
        vantagem_vs_solar_vpn = vpn_hibrido - vpn_somente_solar
        vantagem_vs_bess_vpn = vpn_hibrido - vpn_somente_bess

        vantagem_vs_solar_pct = (vantagem_vs_solar_vpn / abs(vpn_somente_solar)) * 100 if vpn_somente_solar != 0 else 0
        vantagem_vs_bess_pct = (vantagem_vs_bess_vpn / abs(vpn_somente_bess)) * 100 if vpn_somente_bess != 0 else 0

        logger.info(f"   Vantagem híbrido vs solar: R$ {vantagem_vs_solar_vpn:,.2f} ({vantagem_vs_solar_pct:+.1f}%)")
        logger.info(f"   Vantagem híbrido vs BESS: R$ {vantagem_vs_bess_vpn:,.2f} ({vantagem_vs_bess_pct:+.1f}%)")

        # =====================================================================
        # ETAPA 8: GERAR RECOMENDAÇÕES E ALERTAS
        # =====================================================================

        recomendacoes = []
        alertas = []

        # Recomendação baseada em VPL
        if vpn_hibrido > vpn_somente_solar and vpn_hibrido > vpn_somente_bess:
            recomendacoes.append(f"Sistema híbrido oferece melhor retorno (VPL R$ {vpn_hibrido:,.0f})")
        elif vpn_somente_solar > vpn_hibrido:
            alertas.append("Sistema somente solar pode ser mais vantajoso neste caso")

        # Recomendação baseada em autossuficiência
        if autossuficiencia > 80:
            recomendacoes.append(f"Alta autossuficiência ({autossuficiencia:.0f}%) reduz dependência da rede")
        elif autossuficiencia < 50:
            alertas.append("Autossuficiência baixa - considerar aumentar capacidade do BESS")

        # Alerta sobre payback
        if payback_hibrido > 10:
            alertas.append(f"Payback elevado ({payback_hibrido:.1f} anos) pode afetar viabilidade")

        # Alerta sobre taxa de desconto
        if taxa_desconto > 0.10:
            alertas.append(f"Taxa de desconto alta ({taxa_desconto:.1%}) reduz atratividade do projeto")

        logger.info("✅ Análise financeira híbrida concluída")

        # =====================================================================
        # ETAPA 9: MONTAR RESPOSTA COMPLETA
        # =====================================================================

        return {
            # Fluxos de energia
            "fluxos_energia": {
                "energia_solar_gerada_kwh": round(energia_solar_anual_kwh, 2),
                "energia_consumida_total_kwh": round(consumo_anual_kwh, 2),
                "energia_solar_para_consumo_kwh": round(energia_solar_para_consumo, 2),
                "energia_solar_para_bess_kwh": round(energia_solar_para_bess, 2),
                "energia_solar_para_rede_kwh": round(energia_solar_para_rede, 2),
                "energia_consumo_de_solar_kwh": round(energia_solar_para_consumo, 2),
                "energia_consumo_de_bess_kwh": round(energia_bess_para_consumo, 2),
                "energia_consumo_de_rede_kwh": round(energia_rede_para_consumo, 2),
            },

            # Autossuficiência
            "autossuficiencia": {
                "autossuficiencia_percentual": round(autossuficiencia, 2),
                "taxa_autoconsumo_solar": round(taxa_autoconsumo_solar, 2),
                "dependencia_rede_percentual": round(100 - autossuficiencia, 2),
            },

            # Análise econômica
            "analise_economica": {
                "custo_energia_sem_sistema_reais": round(custo_energia_sem_sistema_ano1, 2),
                "custo_energia_com_hibrido_reais": round(custo_energia_sem_sistema_ano1 - economia_hibrida_anual, 2),
                "economia_anual_total_reais": round(economia_hibrida_anual, 2),
                "economia_solar_reais": round(economia_solar_anual, 2),
                "economia_bess_reais": round(economia_bess_anual, 2),
                "receita_injecao_reais": round(energia_solar_para_rede * tarifa_media_kwh * 0.7, 2),
            },

            # Investimento
            "investimento": {
                "investimento_solar_reais": round(investimento_solar, 2),
                "investimento_bess_reais": round(investimento_bess, 2),
                "investimento_total_reais": round(investimento_total, 2),
            },

            # Retorno financeiro
            "retorno_financeiro": {
                "payback_simples_anos": round(payback_hibrido, 2),
                "payback_descontado_anos": round(payback_descontado_hibrido, 2),
                "npv_reais": round(vpn_hibrido, 2),
                "tir_percentual": round(tir_hibrido, 2),
                "lcoe_hibrido_reais_kwh": round(lcoe_hibrido, 4),
            },

            # Comparação de cenários
            "comparacao_cenarios": {
                "sem_sistema": {
                    "investimento": 0,
                    "economia_anual": 0,
                    "custo_25_anos": round(abs(custo_total_25_anos_sem_sistema), 2),
                    "npv": 0,
                },
                "somente_solar": {
                    "investimento": round(investimento_solar, 2),
                    "economia_anual": round(economia_solar_anual, 2),
                    "payback_anos": round(payback_solar, 2),
                    "npv": round(vpn_somente_solar, 2),
                    "tir_percentual": round(tir_somente_solar, 2),
                },
                "somente_bess": {
                    "investimento": round(investimento_bess, 2),
                    "economia_anual": round(economia_bess_anual, 2),
                    "payback_anos": round(payback_bess, 2),
                    "npv": round(vpn_somente_bess, 2),
                    "tir_percentual": round(tir_somente_bess, 2),
                },
                "hibrido": {
                    "investimento": round(investimento_total, 2),
                    "economia_anual": round(economia_hibrida_anual, 2),
                    "payback_anos": round(payback_hibrido, 2),
                    "npv": round(vpn_hibrido, 2),
                    "tir_percentual": round(tir_hibrido, 2),
                    "vantagem_vs_solar_npv": round(vantagem_vs_solar_vpn, 2),
                    "vantagem_vs_bess_npv": round(vantagem_vs_bess_vpn, 2),
                    "vantagem_vs_solar_percentual": round(vantagem_vs_solar_pct, 2),
                    "vantagem_vs_bess_percentual": round(vantagem_vs_bess_pct, 2),
                }
            },

            # Recomendações e alertas
            "recomendacoes": recomendacoes,
            "alertas": alertas,
        }

    # =========================================================================
    # MÉTODOS AUXILIARES DE CÁLCULO
    # =========================================================================

    def _calcular_tir(self, fluxo_caixa: List[float]) -> float:
        """
        Calcula Taxa Interna de Retorno (TIR)

        Returns:
            TIR em % (ex: 15.3 para 15.3%)
        """
        try:
            tir = npf.irr(fluxo_caixa)
            return tir * 100 if not np.isnan(tir) else 0.0
        except:
            return 0.0

    def _calcular_payback_simples(self, investimento: float, economia_anual: float) -> float:
        """
        Calcula Payback simples (sem desconto)

        Fórmula: Investimento / Economia anual
        """
        if economia_anual > 0:
            return investimento / economia_anual
        return 999.0  # Infinito

    def _calcular_payback_descontado(self, fluxo_caixa: List[float], taxa_desconto: float) -> float:
        """
        Calcula Payback descontado (considerando valor do dinheiro no tempo)

        Retorna o ano em que o VPL acumulado fica positivo
        """
        vpn_acumulado = 0
        for ano, valor in enumerate(fluxo_caixa):
            vpn_acumulado += valor / ((1 + taxa_desconto) ** ano)
            if vpn_acumulado > 0:
                return float(ano)
        return 999.0  # Não paga


# Instância singleton
hybrid_financial_service = HybridFinancialService()

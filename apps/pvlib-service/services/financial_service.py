"""
Serviço de cálculos financeiros para sistemas fotovoltaicos
"""

import numpy as np
from typing import List, Dict, Tuple
from models.financial_models import (
    FinancialInput, 
    AdvancedFinancialResults,
    CashFlowDetails,
    FinancialIndicators,
    SensitivityAnalysis,
    SensitivityPoint,
    ScenarioAnalysis
)

class FinancialCalculationService:
    """Serviço para cálculos financeiros avançados"""
    
    @staticmethod
    def calculate_advanced_financials(input_data: FinancialInput) -> AdvancedFinancialResults:
        """
        Calcula análise financeira completa do sistema fotovoltaico
        """
        
        # 1. Calcular fluxo de caixa detalhado
        cash_flow = FinancialCalculationService._calculate_detailed_cash_flow(input_data)
        
        # 2. Calcular indicadores financeiros principais
        vpl = FinancialCalculationService._calculate_npv(cash_flow, input_data.taxa_desconto) - input_data.investimento_inicial
        tir = FinancialCalculationService._calculate_irr(cash_flow, input_data.investimento_inicial)
        payback_simples = FinancialCalculationService._calculate_simple_payback(cash_flow)
        payback_descontado = FinancialCalculationService._calculate_discounted_payback(cash_flow, input_data.taxa_desconto)
        
        # 3. Calcular métricas adicionais
        geracao_anual_inicial = sum(input_data.geracao_mensal)
        economia_total_25_anos = sum(year.economia_energia for year in cash_flow)
        economia_anual_media = economia_total_25_anos / input_data.vida_util
        lucratividade_index = (vpl + input_data.investimento_inicial) / input_data.investimento_inicial
        
        # 4. Indicadores de performance
        indicadores = FinancialCalculationService._calculate_performance_indicators(
            input_data, cash_flow, geracao_anual_inicial
        )
        
        # 5. Análise de sensibilidade
        sensibilidade = FinancialCalculationService._calculate_sensitivity_analysis(input_data)
        
        # 6. Análise de cenários
        cenarios = FinancialCalculationService._calculate_scenario_analysis(input_data)
        
        return AdvancedFinancialResults(
            vpl=round(vpl, 2),
            tir=round(tir, 2),
            payback_simples=round(payback_simples, 2),
            payback_descontado=round(payback_descontado, 2),
            economia_total_25_anos=round(economia_total_25_anos, 2),
            economia_anual_media=round(economia_anual_media, 2),
            lucratividade_index=round(lucratividade_index, 3),
            cash_flow=cash_flow,
            indicadores=indicadores,
            sensibilidade=sensibilidade,
            cenarios=cenarios
        )
    
    @staticmethod
    def _calculate_detailed_cash_flow(input_data: FinancialInput) -> List[CashFlowDetails]:
        """Calcula fluxo de caixa detalhado ano a ano"""
        
        cash_flow = []
        geracao_anual_inicial = sum(input_data.geracao_mensal)
        fluxo_acumulado = -input_data.investimento_inicial  # Investimento inicial negativo
        
        for ano in range(1, input_data.vida_util + 1):
            # Geração com degradação
            fator_degradacao = (1 - input_data.degradacao_modulos / 100) ** (ano - 1)
            geracao_anual = geracao_anual_inicial * fator_degradacao
            
            # Economia com energia (inflação da tarifa)
            fator_inflacao_energia = (1 + input_data.inflacao_energia / 100) ** (ano - 1)
            tarifa_ajustada = input_data.tarifa_energia * fator_inflacao_energia
            custo_fio_ajustado = input_data.custo_fio_b * fator_inflacao_energia
            
            # Calcular economia considerando sistema de compensação
            economia_energia = FinancialCalculationService._calculate_energy_savings(
                geracao_anual, 
                sum(input_data.consumo_mensal), 
                tarifa_ajustada, 
                custo_fio_ajustado
            )
            
            # Custos de O&M
            fator_inflacao_om = (1 + input_data.inflacao_om / 100) ** (ano - 1)
            custos_om = input_data.custo_om * fator_inflacao_om
            
            # Fluxo líquido
            fluxo_liquido = economia_energia - custos_om
            fluxo_acumulado += fluxo_liquido
            
            # Valor presente
            valor_presente = fluxo_liquido / ((1 + input_data.taxa_desconto / 100) ** ano)
            
            cash_flow.append(CashFlowDetails(
                ano=ano,
                geracao_anual=round(geracao_anual, 1),
                economia_energia=round(economia_energia, 2),
                custos_om=round(custos_om, 2),
                fluxo_liquido=round(fluxo_liquido, 2),
                fluxo_acumulado=round(fluxo_acumulado, 2),
                valor_presente=round(valor_presente, 2)
            ))
        
        return cash_flow
    
    @staticmethod
    def _calculate_energy_savings(geracao: float, consumo: float, tarifa: float, custo_fio: float) -> float:
        """
        Calcula economia com energia considerando sistema de compensação
        """
        if geracao >= consumo:
            # Geração maior que consumo - injeta energia na rede
            energia_injetada = geracao - consumo
            # Economia = consumo evitado + créditos de energia injetada (descontando custo do fio)
            economia = consumo * tarifa + energia_injetada * (tarifa - custo_fio)
        else:
            # Geração menor que consumo - reduz conta de energia
            economia = geracao * tarifa
        
        return economia
    
    @staticmethod
    def _calculate_npv(cash_flow: List[CashFlowDetails], taxa_desconto: float) -> float:
        """Calcula Valor Presente Líquido"""
        return sum(year.valor_presente for year in cash_flow)
    
    @staticmethod
    def _calculate_irr(cash_flow: List[CashFlowDetails], investimento_inicial: float) -> float:
        """Calcula Taxa Interna de Retorno usando método de Newton-Raphson"""
        
        # Fluxos de caixa incluindo investimento inicial
        fluxos = [-investimento_inicial] + [year.fluxo_liquido for year in cash_flow]
        
        # Estimativa inicial
        taxa = 0.1
        
        for _ in range(100):  # Máximo 100 iterações
            # Calcular VPL e derivada
            vpl = sum(fluxo / ((1 + taxa) ** i) for i, fluxo in enumerate(fluxos))
            dvpl = sum(-i * fluxo / ((1 + taxa) ** (i + 1)) for i, fluxo in enumerate(fluxos))
            
            if abs(vpl) < 1e-6:  # Precisão suficiente
                break
            
            if abs(dvpl) < 1e-10:  # Evitar divisão por zero
                break
            
            taxa_nova = taxa - vpl / dvpl
            
            if abs(taxa_nova - taxa) < 1e-6:
                break
            
            taxa = taxa_nova
        
        return taxa * 100  # Retornar em percentual
    
    @staticmethod
    def _calculate_simple_payback(cash_flow: List[CashFlowDetails]) -> float:
        """Calcula payback simples"""
        
        for year in cash_flow:
            if year.fluxo_acumulado >= 0:
                # Interpolação para encontrar o ponto exato
                year_anterior = cash_flow[year.ano - 2] if year.ano > 1 else None
                if year_anterior:
                    fator = abs(year_anterior.fluxo_acumulado) / year.fluxo_liquido
                    return year.ano - 1 + fator
                else:
                    return float(year.ano)
        
        return float('inf')  # Nunca se paga
    
    @staticmethod
    def _calculate_discounted_payback(cash_flow: List[CashFlowDetails], taxa_desconto: float) -> float:
        """Calcula payback descontado"""
        
        vpl_acumulado = 0
        
        for year in cash_flow:
            vpl_acumulado += year.valor_presente
            
            if vpl_acumulado >= 0:
                # Interpolação para encontrar o ponto exato
                if year.ano > 1:
                    vpl_anterior = vpl_acumulado - year.valor_presente
                    fator = abs(vpl_anterior) / year.valor_presente
                    return year.ano - 1 + fator
                else:
                    return float(year.ano)
        
        return float('inf')  # Nunca se paga
    
    @staticmethod
    def _calculate_performance_indicators(
        input_data: FinancialInput, 
        cash_flow: List[CashFlowDetails], 
        geracao_anual_inicial: float
    ) -> FinancialIndicators:
        """Calcula indicadores de performance"""
        
        # Yield específico
        yield_especifico = geracao_anual_inicial / (input_data.investimento_inicial / 1000)
        
        # LCOE - Levelized Cost of Energy
        custo_nivelado_energia = FinancialCalculationService._calculate_lcoe(
            input_data.investimento_inicial, cash_flow, input_data.taxa_desconto
        )
        
        # Eficiência do investimento
        economia_anual_media = sum(year.economia_energia for year in cash_flow) / input_data.vida_util
        eficiencia_investimento = (economia_anual_media / input_data.investimento_inicial) * 100
        
        # ROI
        economia_total = sum(year.economia_energia for year in cash_flow)
        retorno_sobre_investimento = ((economia_total - input_data.investimento_inicial) / input_data.investimento_inicial) * 100
        
        return FinancialIndicators(
            yield_especifico=round(yield_especifico, 1),
            custo_nivelado_energia=round(custo_nivelado_energia, 4),
            eficiencia_investimento=round(eficiencia_investimento, 1),
            retorno_sobre_investimento=round(retorno_sobre_investimento, 1)
        )
    
    @staticmethod
    def _calculate_lcoe(investimento: float, cash_flow: List[CashFlowDetails], taxa_desconto: float) -> float:
        """Calcula Levelized Cost of Energy"""
        
        # Somar energia gerada descontada
        energia_descontada = sum(
            year.geracao_anual / ((1 + taxa_desconto / 100) ** year.ano)
            for year in cash_flow
        )
        
        if energia_descontada == 0:
            return 0
        
        return investimento / energia_descontada
    
    @staticmethod
    def _calculate_sensitivity_analysis(input_data: FinancialInput) -> SensitivityAnalysis:
        """Calcula análise de sensibilidade"""
        
        # Variação da tarifa (-20% a +20%)
        vpl_tarifa = []
        for variacao in np.arange(-20, 25, 5):
            input_variado = input_data.copy()
            input_variado.tarifa_energia = input_data.tarifa_energia * (1 + variacao / 100)
            
            cash_flow_variado = FinancialCalculationService._calculate_detailed_cash_flow(input_variado)
            vpl_variado = FinancialCalculationService._calculate_npv(cash_flow_variado, input_data.taxa_desconto) - input_data.investimento_inicial
            
            vpl_tarifa.append(SensitivityPoint(
                parametro=input_variado.tarifa_energia,
                vpl=round(vpl_variado, 2)
            ))
        
        # Variação da inflação (-2% a +2%)
        vpl_inflacao = []
        for variacao in np.arange(-2, 2.5, 0.5):
            input_variado = input_data.copy()
            input_variado.inflacao_energia = input_data.inflacao_energia + variacao
            
            cash_flow_variado = FinancialCalculationService._calculate_detailed_cash_flow(input_variado)
            vpl_variado = FinancialCalculationService._calculate_npv(cash_flow_variado, input_data.taxa_desconto) - input_data.investimento_inicial
            
            vpl_inflacao.append(SensitivityPoint(
                parametro=input_variado.inflacao_energia,
                vpl=round(vpl_variado, 2)
            ))
        
        # Variação da taxa de desconto (-2% a +2%)
        vpl_desconto = []
        for variacao in np.arange(-2, 2.5, 0.5):
            input_variado = input_data.copy()
            input_variado.taxa_desconto = input_data.taxa_desconto + variacao
            
            cash_flow_variado = FinancialCalculationService._calculate_detailed_cash_flow(input_variado)
            vpl_variado = FinancialCalculationService._calculate_npv(cash_flow_variado, input_variado.taxa_desconto) - input_data.investimento_inicial
            
            vpl_desconto.append(SensitivityPoint(
                parametro=input_variado.taxa_desconto,
                vpl=round(vpl_variado, 2)
            ))
        
        return SensitivityAnalysis(
            vpl_variacao_tarifa=vpl_tarifa,
            vpl_variacao_inflacao=vpl_inflacao,
            vpl_variacao_desconto=vpl_desconto
        )
    
    @staticmethod
    def _calculate_scenario_analysis(input_data: FinancialInput) -> ScenarioAnalysis:
        """Calcula análise de cenários"""
        
        # Cenário base
        base_results = FinancialCalculationService.calculate_advanced_financials(input_data)
        
        # Cenário otimista (+10% tarifa, -1% taxa desconto, -20% investimento)
        input_otimista = input_data.copy()
        input_otimista.tarifa_energia *= 1.10
        input_otimista.taxa_desconto -= 1.0
        input_otimista.investimento_inicial *= 0.80
        otimista_results = FinancialCalculationService.calculate_advanced_financials(input_otimista)
        
        # Cenário conservador (-5% tarifa, +1% taxa desconto)
        input_conservador = input_data.copy()
        input_conservador.tarifa_energia *= 0.95
        input_conservador.taxa_desconto += 1.0
        conservador_results = FinancialCalculationService.calculate_advanced_financials(input_conservador)
        
        # Cenário pessimista (-10% tarifa, +2% taxa desconto, +20% investimento)
        input_pessimista = input_data.copy()
        input_pessimista.tarifa_energia *= 0.90
        input_pessimista.taxa_desconto += 2.0
        input_pessimista.investimento_inicial *= 1.20
        pessimista_results = FinancialCalculationService.calculate_advanced_financials(input_pessimista)
        
        return ScenarioAnalysis(
            base={"vpl": base_results.vpl, "tir": base_results.tir, "payback": base_results.payback_simples},
            otimista={"vpl": otimista_results.vpl, "tir": otimista_results.tir, "payback": otimista_results.payback_simples},
            conservador={"vpl": conservador_results.vpl, "tir": conservador_results.tir, "payback": conservador_results.payback_simples},
            pessimista={"vpl": pessimista_results.vpl, "tir": pessimista_results.tir, "payback": pessimista_results.payback_simples}
        )
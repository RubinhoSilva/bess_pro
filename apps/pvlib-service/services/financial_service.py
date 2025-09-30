# -*- coding: utf-8 -*-
"""
Servico de calculos financeiros para sistemas fotovoltaicos
"""

import numpy as np
import numpy_financial as npf
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
    """Servico para calculos financeiros avancados"""
    
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
        
        # Sanitizar todos os valores para evitar infinitos e NaN
        def sanitize_value(value: float, max_value: float = 999999.99) -> float:
            if not np.isfinite(value):
                return max_value
            return min(abs(value), max_value) if value >= 0 else max(-max_value, value)
        
        return AdvancedFinancialResults(
            vpl=round(sanitize_value(vpl), 2),
            tir=round(sanitize_value(tir, 999999.99), 2),
            payback_simples=round(sanitize_value(payback_simples, 99.0), 2),
            payback_descontado=round(sanitize_value(payback_descontado, 99.0), 2),
            economia_total_25_anos=round(sanitize_value(economia_total_25_anos), 2),
            economia_anual_media=round(sanitize_value(economia_anual_media), 2),
            lucratividade_index=round(sanitize_value(lucratividade_index, 999.999), 3),
            cash_flow=cash_flow,
            indicadores=indicadores,
            sensibilidade=sensibilidade,
            cenarios=cenarios
        )
    
    @staticmethod
    def _calculate_detailed_cash_flow(input_data: FinancialInput) -> List[CashFlowDetails]:
        """Calcula fluxo de caixa detalhado com processamento mensal"""
        
        cash_flow = []
        fluxo_acumulado = -input_data.investimento_inicial

        # Banco de creditos (persiste entre meses)
        banco_local = 0.0
        
        for ano in range(1, input_data.vida_util + 1):
            economia_anual = 0.0
            geracao_anual = 0.0
            
            for mes in range(12):
                # Degradacao
                fator_degradacao = (1 - input_data.degradacao_modulos / 100) ** (ano - 1)
                gen_mes = input_data.geracao_mensal[mes] * fator_degradacao
                geracao_anual += gen_mes
                
                # Inflacao
                fator_inflacao = (1 + input_data.inflacao_energia / 100) ** (ano - 1)
                tarifa_mes = input_data.tarifa_energia * fator_inflacao
                fio_b_mes = input_data.custo_fio_b * fator_inflacao
                
                # Calcular economia local
                economia_mes, banco_local = FinancialCalculationService._calculate_monthly_local_savings(
                    gen_mes,
                    input_data.consumo_mensal[mes],
                    tarifa_mes,
                    fio_b_mes,
                    input_data.fator_simultaneidade,
                    banco_local,
                    ano,
                    input_data.fio_b_schedule,
                    input_data.base_year
                )
                
                # GUARDAR BANCO INICIAL DO MES
                banco_inicial_mes = banco_local
                creditos_consumidos_total = 0.0
                
                # Autoconsumo remoto Grupo B
                if input_data.autoconsumo_remoto_b:
                    creditos_para_b = banco_inicial_mes * input_data.perc_creditos_b
                    economia_b, sobra_b = FinancialCalculationService._calculate_remote_b_savings_v2(
                        creditos_para_b,
                        input_data.consumo_remoto_b_mensal[mes],
                        input_data.tarifa_energia * fator_inflacao,
                        input_data.tarifa_remoto_b * fator_inflacao,
                        input_data.fio_b_remoto_b * fator_inflacao,
                        ano,
                        input_data.fio_b_schedule,
                        input_data.base_year
                    )
                    economia_mes += economia_b
                    creditos_consumidos_total += (creditos_para_b - sobra_b)
                
                # Autoconsumo remoto Grupo A Verde
                if input_data.autoconsumo_remoto_a_verde:
                    creditos_para_verde = banco_inicial_mes * input_data.perc_creditos_a_verde
                    economia_verde, sobra_verde = FinancialCalculationService._calculate_remote_a_verde_savings_v2(
                        creditos_para_verde,
                        input_data.consumo_remoto_a_verde_fp_mensal[mes],
                        input_data.consumo_remoto_a_verde_p_mensal[mes],
                        input_data.tarifa_remoto_a_verde_fp * fator_inflacao,
                        input_data.tarifa_remoto_a_verde_p * fator_inflacao,
                        input_data.tusd_remoto_a_verde_fp * fator_inflacao,
                        input_data.tusd_remoto_a_verde_p * fator_inflacao,
                        input_data.te_ponta_a_verde,
                        input_data.te_fora_ponta_a_verde
                    )
                    economia_mes += economia_verde
                    creditos_consumidos_total += (creditos_para_verde - sobra_verde)
                
                # Autoconsumo remoto Grupo A Azul
                if input_data.autoconsumo_remoto_a_azul:
                    creditos_para_azul = banco_inicial_mes * input_data.perc_creditos_a_azul
                    economia_azul, sobra_azul = FinancialCalculationService._calculate_remote_a_azul_savings_v2(
                        creditos_para_azul,
                        input_data.consumo_remoto_a_azul_fp_mensal[mes],
                        input_data.consumo_remoto_a_azul_p_mensal[mes],
                        input_data.tarifa_remoto_a_azul_fp * fator_inflacao,
                        input_data.tarifa_remoto_a_azul_p * fator_inflacao,
                        input_data.tusd_remoto_a_azul_fp * fator_inflacao,
                        input_data.tusd_remoto_a_azul_p * fator_inflacao,
                        input_data.te_ponta_a_azul,
                        input_data.te_fora_ponta_a_azul
                    )
                    economia_mes += economia_azul
                    creditos_consumidos_total += (creditos_para_azul - sobra_azul)
                
                # ATUALIZAR BANCO UMA VEZ SO NO FINAL
                banco_local = banco_local - creditos_consumidos_total
                
                economia_anual += economia_mes
            
            # Custos O&M
            fator_inflacao_om = (1 + input_data.inflacao_om / 100) ** (ano - 1)
            custos_om = input_data.custo_om * fator_inflacao_om
            
            # Fluxo do ano
            fluxo_liquido = economia_anual - custos_om
            fluxo_acumulado += fluxo_liquido
            valor_presente = fluxo_liquido / ((1 + input_data.taxa_desconto / 100) ** ano)
            
            cash_flow.append(CashFlowDetails(
                ano=ano,
                geracao_anual=round(geracao_anual, 1),
                economia_energia=round(economia_anual, 2),
                custos_om=round(custos_om, 2),
                fluxo_liquido=round(fluxo_liquido, 2),
                fluxo_acumulado=round(fluxo_acumulado, 2),
                valor_presente=round(valor_presente, 2)
            ))
        
        return cash_flow
    
    @staticmethod
    def _calculate_monthly_local_savings(
        geracao: float,
        consumo: float,
        tarifa: float,
        fio_b: float,
        fator_simultaneidade: float,
        banco_creditos: float,
        ano: int,
        fio_b_schedule: Dict[int, float],
        base_year: int
    ) -> Tuple[float, float]:
        """
        Calcula economia do mes e atualiza banco de creditos local.
        
        Retorna: (economia_mes, novo_saldo_banco)
        """
        # 1. Autoconsumo instantaneo (nao paga Fio B)
        autoconsumo_imediato = min(geracao * fator_simultaneidade, consumo)
        economia_imediata = autoconsumo_imediato * tarifa
        
        # 2. Energia que vira credito
        credito_novo = geracao - autoconsumo_imediato
        consumo_restante = consumo - autoconsumo_imediato
        
        # 3. Abater consumo com credito novo
        abatido_novo = min(credito_novo, consumo_restante)
        consumo_ainda_restante = consumo_restante - abatido_novo
        
        # 4. Abater com banco de creditos
        abatido_banco = min(banco_creditos, consumo_ainda_restante)
        
        # 5. Atualizar banco
        excedente = credito_novo - abatido_novo
        novo_saldo_banco = banco_creditos - abatido_banco + excedente
        
        # 6. Calcular economia com Fio B
        calendario_ano = base_year + (ano - 1)
        perc_fio_b = fio_b_schedule.get(calendario_ano, 1.0)
        custo_fio_b_total = (abatido_novo + abatido_banco) * fio_b * perc_fio_b
        
        economia_credito = (abatido_novo + abatido_banco) * tarifa - custo_fio_b_total
        economia_total = economia_imediata + economia_credito
        
        return economia_total, novo_saldo_banco




    
    @staticmethod
    def _calculate_npv(cash_flow: List[CashFlowDetails], taxa_desconto: float) -> float:
        """Calcula Valor Presente Líquido"""
        return sum(year.valor_presente for year in cash_flow)
    
    @staticmethod
    def _calculate_irr(cash_flow: List[CashFlowDetails], investimento_inicial: float) -> float:
        """Calcula TIR usando numpy_financial"""
        fluxos = [-investimento_inicial] + [year.fluxo_liquido for year in cash_flow]
        
        try:
            tir = npf.irr(fluxos)
            
            # Validar resultado
            if not np.isfinite(tir):
                return 5.0  # Fallback conservador em %
            
            # Limitar valores extremos
            if tir < -0.99:
                return -99.0
            if tir > 5.0:
                return 500.0
            
            return tir * 100  # Retornar em percentual
            
        except Exception as e:
            print(f"Erro no calculo de TIR: {e}")
            return 5.0  # Fallback conservador em %
    
    @staticmethod
    def _calculate_simple_payback(cash_flow: List[CashFlowDetails]) -> float:
        """Calcula payback simples"""
        
        for year in cash_flow:
            if year.fluxo_acumulado >= 0:
                # Interpolação para encontrar o ponto exato
                year_anterior = cash_flow[year.ano - 2] if year.ano > 1 else None
                if year_anterior and year.fluxo_liquido > 0:
                    fator = abs(year_anterior.fluxo_acumulado) / year.fluxo_liquido
                    payback = year.ano - 1 + fator
                    # Limitar payback máximo a 99 anos
                    return min(payback, 99.0)
                else:
                    return min(float(year.ano), 99.0)
        
        return 99.0  # Retornar 99 anos ao invés de infinito
    
    @staticmethod
    def _calculate_discounted_payback(cash_flow: List[CashFlowDetails], taxa_desconto: float) -> float:
        """Calcula payback descontado"""
        
        vpl_acumulado = 0
        
        for year in cash_flow:
            vpl_acumulado += year.valor_presente
            
            if vpl_acumulado >= 0:
                # Interpolação para encontrar o ponto exato
                if year.ano > 1 and year.valor_presente > 0:
                    vpl_anterior = vpl_acumulado - year.valor_presente
                    fator = abs(vpl_anterior) / year.valor_presente
                    payback = year.ano - 1 + fator
                    # Limitar payback máximo a 99 anos
                    return min(payback, 99.0)
                else:
                    return min(float(year.ano), 99.0)
        
        return 99.0  # Retornar 99 anos ao invés de infinito
    
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
        
        # Helper para calcular apenas os indicadores principais sem recursão
        def calculate_basic_indicators(data: FinancialInput):
            cash_flow = FinancialCalculationService._calculate_detailed_cash_flow(data)
            vpl = FinancialCalculationService._calculate_npv(cash_flow, data.taxa_desconto) - data.investimento_inicial
            tir = FinancialCalculationService._calculate_irr(cash_flow, data.investimento_inicial)
            payback = FinancialCalculationService._calculate_simple_payback(cash_flow)
            
            # Sanitizar valores para evitar infinitos
            def sanitize_basic(value: float, max_val: float = 999999.99) -> float:
                return max_val if not np.isfinite(value) else min(abs(value), max_val) if value >= 0 else max(-max_val, value)
            
            return {
                "vpl": round(sanitize_basic(vpl), 2), 
                "tir": round(sanitize_basic(tir), 2), 
                "payback": round(sanitize_basic(payback, 99.0), 2)
            }
        
        # Cenário base
        base_results = calculate_basic_indicators(input_data)
        
        # Cenário otimista (+10% tarifa, -1% taxa desconto, -20% investimento)
        input_otimista = input_data.copy()
        input_otimista.tarifa_energia *= 1.10
        input_otimista.taxa_desconto = max(1.0, input_otimista.taxa_desconto - 1.0)  # Evitar taxa negativa
        input_otimista.investimento_inicial *= 0.80
        otimista_results = calculate_basic_indicators(input_otimista)
        
        # Cenário conservador (-5% tarifa, +1% taxa desconto)
        input_conservador = input_data.copy()
        input_conservador.tarifa_energia *= 0.95
        input_conservador.taxa_desconto += 1.0
        conservador_results = calculate_basic_indicators(input_conservador)
        
        # Cenário pessimista (-10% tarifa, +2% taxa desconto, +20% investimento)
        input_pessimista = input_data.copy()
        input_pessimista.tarifa_energia *= 0.90
        input_pessimista.taxa_desconto += 2.0
        input_pessimista.investimento_inicial *= 1.20
        pessimista_results = calculate_basic_indicators(input_pessimista)
        
        return ScenarioAnalysis(
            base=base_results,
            otimista=otimista_results,
            conservador=conservador_results,
            pessimista=pessimista_results
        )

    @staticmethod
    def _calculate_remote_b_savings_v2(
        creditos_disponiveis: float,
        consumo_remoto_b: float,
        tarifa_geradora: float,
        tarifa_remoto_b: float,
        fio_b_remoto: float,
        ano: int,
        fio_b_schedule: Dict[int, float],
        base_year: int
    ) -> Tuple[float, float]:
        """
        NOVA VERSAO: Recebe creditos ja separados
        Retorna: (economia_remoto_b, sobra_creditos)
        """
        # Fator de equivalencia
        fator_equiv = tarifa_geradora / tarifa_remoto_b
        
        # Converter creditos para kWh equivalente do Grupo B
        creditos_eq = creditos_disponiveis / fator_equiv
        abatido_eq = min(creditos_eq, consumo_remoto_b)
        
        # Creditos usados
        creditos_usados = abatido_eq * fator_equiv
        sobra = creditos_disponiveis - creditos_usados
        
        # Calcular economia
        calendario_ano = base_year + (ano - 1)
        perc_fio_b = fio_b_schedule.get(calendario_ano, 1.0)
        custo_fio = abatido_eq * fio_b_remoto * perc_fio_b
        
        economia = abatido_eq * tarifa_remoto_b - custo_fio
        
        return economia, sobra

    @staticmethod
    def _calculate_remote_a_verde_savings_v2(
        creditos_disponiveis: float,
        consumo_fp: float,
        consumo_p: float,
        tarifa_fp: float,
        tarifa_p: float,
        tusd_fp: float,
        tusd_p: float,
        te_ponta: float,
        te_fora_ponta: float
    ) -> Tuple[float, float]:
        """
        NOVA VERSAO: Recebe creditos ja separados
        Retorna: (economia_remoto_verde, sobra_creditos)
        """
        # Fator de ajuste ponta/fora ponta
        fator_ajuste = te_ponta / te_fora_ponta
        
        # Prioridade: abater FORA PONTA primeiro
        abatido_fp = min(creditos_disponiveis, consumo_fp)
        sobra_apos_fp = creditos_disponiveis - abatido_fp
        
        # Abater PONTA com sobra
        abatido_p = min(sobra_apos_fp / fator_ajuste, consumo_p)
        creditos_usados_p = abatido_p * fator_ajuste
        
        # Sobra final
        sobra = sobra_apos_fp - creditos_usados_p
        
        # Calcular economia
        economia_fp = abatido_fp * tarifa_fp - (abatido_fp * tusd_fp)
        economia_p = abatido_p * tarifa_p - (abatido_p * tusd_p)
        economia_total = economia_fp + economia_p
        
        return economia_total, sobra

    @staticmethod
    def _calculate_remote_a_azul_savings_v2(
        creditos_disponiveis: float,
        consumo_fp: float,
        consumo_p: float,
        tarifa_fp: float,
        tarifa_p: float,
        tusd_fp: float,
        tusd_p: float,
        te_ponta: float,
        te_fora_ponta: float
    ) -> Tuple[float, float]:
        """
        NOVA VERSAO: Identica ao Verde
        Retorna: (economia_remoto_azul, sobra_creditos)
        """
        # Copiar logica identica de _calculate_remote_a_verde_savings_v2
        fator_ajuste = te_ponta / te_fora_ponta
        abatido_fp = min(creditos_disponiveis, consumo_fp)
        sobra_apos_fp = creditos_disponiveis - abatido_fp
        abatido_p = min(sobra_apos_fp / fator_ajuste, consumo_p)
        creditos_usados_p = abatido_p * fator_ajuste
        sobra = sobra_apos_fp - creditos_usados_p
        economia_fp = abatido_fp * tarifa_fp - (abatido_fp * tusd_fp)
        economia_p = abatido_p * tarifa_p - (abatido_p * tusd_p)
        economia_total = economia_fp + economia_p
        return economia_total, sobra
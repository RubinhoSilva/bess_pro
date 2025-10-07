# -*- coding: utf-8 -*-
"""
Servico de calculos financeiros para sistemas fotovoltaicos
"""

import logging
import numpy as np
import numpy_financial as npf
from typing import List, Dict, Tuple, Optional
from models.shared.financial_models import (
    FinancialInput, 
    AdvancedFinancialResults,
    CashFlowDetails,
    FinancialIndicators,
    SensitivityAnalysis,
    SensitivityPoint,
    ScenarioAnalysis
)

# Constants for IRR calculation
class IRRConstants:
    """Constants for Internal Rate of Return calculations"""
    DEFAULT_FALLBACK_RATE = 5.0  # Default fallback rate in percentage
    MINIMUM_IRR_RATE = -99.0     # Minimum acceptable IRR rate in percentage
    MAXIMUM_IRR_RATE = 500.0     # Maximum acceptable IRR rate in percentage
    MINIMUM_DECIMAL_RATE = -0.99 # Minimum IRR rate in decimal form
    MAXIMUM_DECIMAL_RATE = 5.0   # Maximum IRR rate in decimal form
    DECIMAL_TO_PERCENTAGE = 100.0  # Conversion factor from decimal to percentage

# Configure logger
logger = logging.getLogger(__name__)

class FinancialCalculationService:
    """Servico para calculos financeiros avancados"""
    
    @staticmethod
    def calculate_advanced_financials(input_data: FinancialInput) -> AdvancedFinancialResults:
        """
        Calcula análise financeira completa do sistema fotovoltaico
        """
        
        print(f"🐍 [PYTHON] ===== INÍCIO CÁLCULO FINANCEIRO AVANÇADO =====")
        print(f"🐍 [PYTHON] Função: calculate_advanced_financials()")
        
        # Log para debug
        geracao_anual = sum(input_data.geracao_mensal)
        consumo_anual = sum(input_data.consumo_mensal)
        print(f"🐍 [PYTHON] Valores recebidos para cálculo financeiro:")
        print(f"   - Geração anual: {geracao_anual:.2f} kWh")
        print(f"   - Consumo anual: {consumo_anual:.2f} kWh") 
        print(f"   - Tarifa energia: R$ {input_data.tarifa_energia:.4f}/kWh")
        print(f"   - Custo fio B: R$ {input_data.custo_fio_b:.4f}/kWh")
        print(f"   - Investimento: R$ {input_data.investimento_inicial:.2f}")
        print(f"   - Taxa desconto: {input_data.taxa_desconto:.2f}%")
        print(f"   - Inflação energia: {input_data.inflacao_energia:.2f}%")
        print(f"   - Vida útil: {input_data.vida_util} anos")
        print(f"   - Degradação módulos: {input_data.degradacao_modulos:.2f}%/ano")
        print(f"   - Fator simultaneidade: {input_data.fator_simultaneidade:.2f}")
        
        # 1. Calcular fluxo de caixa detalhado
        print(f"🐍 [PYTHON] Etapa 1: Calculando fluxo de caixa detalhado...")
        cash_flow = FinancialCalculationService._calculate_detailed_cash_flow(input_data)
        print(f"🐍 [PYTHON] Fluxo de caixa calculado com {len(cash_flow)} anos")
        
        # 2. Calcular indicadores financeiros principais
        print(f"🐍 [PYTHON] Etapa 2: Calculando indicadores financeiros principais...")
        vpl = FinancialCalculationService._calculate_npv(cash_flow, input_data.taxa_desconto) - input_data.investimento_inicial
        print(f"🐍 [PYTHON] VPL calculado: R$ {vpl:.2f}")
        
        tir = FinancialCalculationService._calculate_irr(cash_flow, input_data.investimento_inicial)
        print(f"🐍 [PYTHON] TIR calculada: {tir:.4f}%")
        
        payback_simples = FinancialCalculationService._calculate_simple_payback(cash_flow)
        print(f"🐍 [PYTHON] Payback simples calculado: {payback_simples:.2f} anos")
        
        payback_descontado = FinancialCalculationService._calculate_discounted_payback(cash_flow, input_data.taxa_desconto)
        print(f"🐍 [PYTHON] Payback descontado calculado: {payback_descontado:.2f} anos")
        
        # 3. Calcular métricas adicionais
        print(f"🐍 [PYTHON] Etapa 3: Calculando métricas adicionais...")
        geracao_anual_inicial = sum(input_data.geracao_mensal)
        economia_total_25_anos = sum(year.economia_energia for year in cash_flow)
        economia_anual_media = economia_total_25_anos / input_data.vida_util
        lucratividade_index = (vpl + input_data.investimento_inicial) / input_data.investimento_inicial
        
        print(f"🐍 [PYTHON] Resultados do cálculo financeiro:")
        print(f"   - Economia total 25 anos: R$ {economia_total_25_anos:.2f}")
        print(f"   - Economia anual média: R$ {economia_anual_media:.2f}")
        print(f"   - VPL: R$ {vpl:.2f}")
        print(f"   - TIR: {tir:.4f}%")
        print(f"   - Lucratividade index: {lucratividade_index:.3f}")
        
        # 4. Indicadores de performance
        print(f"🐍 [PYTHON] Etapa 4: Calculando indicadores de performance...")
        indicadores = FinancialCalculationService._calculate_performance_indicators(
            input_data, cash_flow, geracao_anual_inicial
        )
        print(f"🐍 [PYTHON] Indicadores calculados: Yield={indicadores.yield_especifico}, LCOE={indicadores.custo_nivelado_energia}")
        
        # 5. Análise de sensibilidade
        print(f"🐍 [PYTHON] Etapa 5: Calculando análise de sensibilidade...")
        sensibilidade = FinancialCalculationService._calculate_sensitivity_analysis(input_data)
        print(f"🐍 [PYTHON] Análise de sensibilidade calculada com {len(sensibilidade.vpl_variacao_tarifa)} pontos de tarifa")
        
        # 6. Análise de cenários
        print(f"🐍 [PYTHON] Etapa 6: Calculando análise de cenários...")
        cenarios = FinancialCalculationService._calculate_scenario_analysis(input_data)
        print(f"🐍 [PYTHON] Análise de cenários calculada")
        
        # Sanitizar todos os valores para evitar infinitos e NaN
        def sanitize_value(value: float, max_value: float = 999999.99) -> float:
            if not np.isfinite(value):
                return max_value
            return min(abs(value), max_value) if value >= 0 else max(-max_value, value)
        
        resultado = AdvancedFinancialResults(
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
        
        print(f"🐍 [PYTHON] ===== FIM CÁLCULO FINANCEIRO AVANÇADO =====")
        print(f"🐍 [PYTHON] Resultado final: VPL=R${resultado.vpl}, TIR={resultado.tir}%, Payback={resultado.payback_simples}anos")
        
        return resultado
    
    @staticmethod
    def _calculate_detailed_cash_flow(input_data: FinancialInput) -> List[CashFlowDetails]:
        """Calcula fluxo de caixa detalhado com processamento mensal"""
        
        print(f"🐍 [PYTHON] --- INÍCIO FLUXO DE CAIXA DETALHADO ---")
        print(f"🐍 [PYTHON] Função: _calculate_detailed_cash_flow()")
        print(f"🐍 [PYTHON] Investimento inicial: R$ {input_data.investimento_inicial:.2f}")
        
        cash_flow = []
        fluxo_acumulado = -input_data.investimento_inicial

        # Banco de creditos (persiste entre meses)
        banco_local = 0.0
        print(f"🐍 [PYTHON] Banco de créditos inicial: {banco_local:.2f} kWh")
        
        for ano in range(1, input_data.vida_util + 1):
            economia_anual = 0.0
            geracao_anual = 0.0
            
            print(f"🐍 [PYTHON] Processando Ano {ano}/{input_data.vida_util}:")
            
            for mes in range(12):
                # Degradacao
                fator_degradacao = (1 - input_data.degradacao_modulos / 100) ** (ano - 1)
                gen_mes = input_data.geracao_mensal[mes] * fator_degradacao
                geracao_anual += gen_mes
                
                # Inflacao
                fator_inflacao = (1 + input_data.inflacao_energia / 100) ** (ano - 1)
                tarifa_mes = input_data.tarifa_energia * fator_inflacao
                fio_b_mes = input_data.custo_fio_b * fator_inflacao
                
                if ano == 1 and mes < 3:  # Log apenas primeiros meses do primeiro ano
                    print(f"🐍 [PYTHON]   Mês {mes+1}: Geração={gen_mes:.2f}kWh, Tarifa=R${tarifa_mes:.4f}, Fio B=R${fio_b_mes:.4f}")
                
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
                
                if ano == 1 and mes < 3:  # Log apenas primeiros meses do primeiro ano
                    print(f"🐍 [PYTHON]   Mês {mes+1}: Economia local=R${economia_mes:.2f}, Banco após={banco_local:.2f}kWh")
                
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
            
            print(f"🐍 [PYTHON] Ano {ano}: Geração={geracao_anual:.1f}kWh, Economia=R${economia_anual:.2f}, O&M=R${custos_om:.2f}")
            print(f"🐍 [PYTHON] Ano {ano}: Fluxo líquido=R${fluxo_liquido:.2f}, Fluxo acumulado=R${fluxo_acumulado:.2f}")
            
            cash_flow.append(CashFlowDetails(
                ano=ano,
                geracao_anual=round(geracao_anual, 1),
                economia_energia=round(economia_anual, 2),
                custos_om=round(custos_om, 2),
                fluxo_liquido=round(fluxo_liquido, 2),
                fluxo_acumulado=round(fluxo_acumulado, 2),
                valor_presente=round(valor_presente, 2)
            ))
        
        print(f"🐍 [PYTHON] --- FIM FLUXO DE CAIXA DETALHADO ---")
        print(f"🐍 [PYTHON] Retornando {len(cash_flow)} anos de fluxo de caixa")
        
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
        if ano == 1:  # Log apenas primeiro ano para não poluir
            print(f"🐍 [PYTHON]     _calculate_monthly_local_savings():")
            print(f"🐍 [PYTHON]       Entrada: Geração={geracao:.2f}kWh, Consumo={consumo:.2f}kWh, Banco={banco_creditos:.2f}kWh")
            print(f"🐍 [PYTHON]       Tarifa=R${tarifa:.4f}, Fio B=R${fio_b:.4f}, Simultaneidade={fator_simultaneidade:.2f}")
        
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
        
        if ano == 1:  # Log apenas primeiro ano
            print(f"🐍 [PYTHON]       Autoconsumo imediato: {autoconsumo_imediato:.2f}kWh = R${economia_imediata:.2f}")
            print(f"🐍 [PYTHON]       Crédito novo: {credito_novo:.2f}kWh, Abatido novo: {abatido_novo:.2f}kWh")
            print(f"🐍 [PYTHON]       Abatido banco: {abatido_banco:.2f}kWh, Excedente: {excedente:.2f}kWh")
            print(f"🐍 [PYTHON]       Custo Fio B: R${custo_fio_b_total:.4f} (perc_fio_b={perc_fio_b:.2f})")
            print(f"🐍 [PYTHON]       Economia crédito: R${economia_credito:.2f}, Economia total: R${economia_total:.2f}")
            print(f"🐍 [PYTHON]       Novo saldo banco: {novo_saldo_banco:.2f}kWh")
        
        return economia_total, novo_saldo_banco




    
    @staticmethod
    def _calculate_npv(cash_flow: List[CashFlowDetails], taxa_desconto: float) -> float:
        """Calcula Valor Presente Líquido"""
        print(f"🐍 [PYTHON] _calculate_npv(): Taxa desconto={taxa_desconto:.2f}%")
        vpl = sum(year.valor_presente for year in cash_flow)
        print(f"🐍 [PYTHON] _calculate_npv(): Somando {len(cash_flow)} anos de valor presente = R${vpl:.2f}")
        return vpl
    
    @staticmethod
    def _calculate_irr(cash_flow: List[CashFlowDetails], investimento_inicial: float) -> float:
        """
        Calcula a Taxa Interna de Retorno (TIR) para um fluxo de caixa.
        
        A TIR é a taxa de desconto que torna o Valor Presente Líquido (VPL) igual a zero.
        Utiliza o algoritmo do numpy_financial para cálculo preciso.
        
        Args:
            cash_flow: Lista de detalhes do fluxo de caixa anual
            investimento_inicial: Valor do investimento inicial (positivo)
            
        Returns:
            float: TIR em percentual (ex: 15.5 para 15.5%)
            
        Raises:
            ValueError: Se os parâmetros de entrada forem inválidos
            
        Note:
            - Valores extremos são limitados entre -99% e 500%
            - Em caso de erro, retorna taxa fallback conservadora de 5%
            - Valores não finitos (NaN, infinito) são tratados como erro
        """
        
        # Validar entrada
        if not cash_flow:
            logger.error("Cash flow vazio fornecido para cálculo de TIR")
            return IRRConstants.DEFAULT_FALLBACK_RATE
            
        if investimento_inicial <= 0:
            logger.error(f"Investimento inicial inválido: R${investimento_inicial:.2f}")
            return IRRConstants.DEFAULT_FALLBACK_RATE
        
        # Construir array de fluxos de caixa
        try:
            cash_flows = FinancialCalculationService._build_cash_flow_array(cash_flow, investimento_inicial)
        except ValueError as e:
            logger.error(f"Erro ao construir array de fluxos: {e}")
            return IRRConstants.DEFAULT_FALLBACK_RATE
        
        # Log detalhado para debug (apenas em nível DEBUG)
        logger.debug(f"Calculando TIR: investimento=R${investimento_inicial:.2f}, {len(cash_flows)} períodos")
        logger.debug(f"Fluxos: [{cash_flows[0]:.2f}] + {[f'{f:.2f}' for f in cash_flows[1:6]]}...")
        
        # Calcular TIR usando numpy_financial
        try:
            irr_decimal = FinancialCalculationService._compute_irr_safely(cash_flows)
            irr_percentage = FinancialCalculationService._validate_and_normalize_irr(irr_decimal)
            
            logger.info(f"TIR calculada com sucesso: {irr_percentage:.4f}%")
            return irr_percentage
            
        except Exception as e:
            logger.error(f"Erro no cálculo de TIR: {type(e).__name__}: {e}")
            logger.info(f"Usando taxa fallback: {IRRConstants.DEFAULT_FALLBACK_RATE}%")
            return IRRConstants.DEFAULT_FALLBACK_RATE
    
    @staticmethod
    def _build_cash_flow_array(cash_flow: List[CashFlowDetails], investimento_inicial: float) -> List[float]:
        """
        Constrói o array de fluxos de caixa para cálculo da TIR.
        
        Args:
            cash_flow: Lista de detalhes do fluxo de caixa anual
            investimento_inicial: Valor do investimento inicial
            
        Returns:
            List[float]: Array com investimento negativo seguido dos fluxos positivos
            
        Raises:
            ValueError: Se algum fluxo for inválido
        """
        # Incluir investimento inicial como fluxo negativo
        cash_flows = [-investimento_inicial]
        
        # Adicionar fluxos anuais
        for year in cash_flow:
            if not np.isfinite(year.fluxo_liquido):
                raise ValueError(f"Fluxo líquido inválido no ano {year.ano}: {year.fluxo_liquido}")
            cash_flows.append(year.fluxo_liquido)
        
        return cash_flows
    
    @staticmethod
    def _compute_irr_safely(cash_flows: List[float]) -> float:
        """
        Computa a TIR de forma segura com tratamento de erros específicos.
        
        Args:
            cash_flows: Array de fluxos de caixa
            
        Returns:
            float: TIR em formato decimal
            
        Raises:
            RuntimeError: Se o numpy_financial não conseguir calcular a TIR
        """
        try:
            irr_result = npf.irr(cash_flows)
            logger.debug(f"TIR bruta do numpy: {irr_result:.8f}")
            return irr_result
            
        except (ValueError, RuntimeWarning) as e:
            # Erros comuns do numpy_financial
            if "multiple IRRs" in str(e):
                logger.warning("Múltiplas TIRs encontradas, usando primeira solução")
            elif "could not find a solution" in str(e):
                logger.warning("Não foi possível encontrar solução para TIR")
            else:
                logger.warning(f"Aviso do numpy_financial: {e}")
            raise RuntimeError(f"Erro no cálculo numérico: {e}")
            
        except Exception as e:
            logger.error(f"Erro inesperado no numpy_financial: {type(e).__name__}: {e}")
            raise RuntimeError(f"Falha no cálculo da TIR: {e}")
    
    @staticmethod
    def _validate_and_normalize_irr(irr_decimal: float) -> float:
        """
        Valida e normaliza o valor da TIR para o formato esperado.
        
        Args:
            irr_decimal: TIR em formato decimal (ex: 0.155 para 15.5%)
            
        Returns:
            float: TIR em percentual, dentro dos limites aceitáveis
        """
        # Verificar se o valor é finito
        if not np.isfinite(irr_decimal):
            logger.warning(f"TIR não é finita: {irr_decimal}")
            return IRRConstants.DEFAULT_FALLBACK_RATE
        
        # Limitar valores extremos
        if irr_decimal < IRRConstants.MINIMUM_DECIMAL_RATE:
            logger.warning(f"TIR muito baixa: {irr_decimal:.6f}, limitando a {IRRConstants.MINIMUM_IRR_RATE}%")
            return IRRConstants.MINIMUM_IRR_RATE
            
        if irr_decimal > IRRConstants.MAXIMUM_DECIMAL_RATE:
            logger.warning(f"TIR muito alta: {irr_decimal:.6f}, limitando a {IRRConstants.MAXIMUM_IRR_RATE}%")
            return IRRConstants.MAXIMUM_IRR_RATE
        
        # Converter para percentual
        irr_percentage = irr_decimal * IRRConstants.DECIMAL_TO_PERCENTAGE
        return irr_percentage
    
    @staticmethod
    def _calculate_simple_payback(cash_flow: List[CashFlowDetails]) -> float:
        """Calcula payback simples"""
        print(f"🐍 [PYTHON] _calculate_simple_payback(): Analisando {len(cash_flow)} anos de fluxo acumulado")
        
        for year in cash_flow:
            print(f"🐍 [PYTHON]   Ano {year.ano}: Fluxo acumulado=R${year.fluxo_acumulado:.2f}")
            if year.fluxo_acumulado >= 0:
                # Interpolação para encontrar o ponto exato
                year_anterior = cash_flow[year.ano - 2] if year.ano > 1 else None
                if year_anterior and year.fluxo_liquido > 0:
                    fator = abs(year_anterior.fluxo_acumulado) / year.fluxo_liquido
                    payback = year.ano - 1 + fator
                    print(f"🐍 [PYTHON] _calculate_simple_payback(): Payback interpolado = {payback:.2f} anos")
                    # Limitar payback máximo a 99 anos
                    return min(payback, 99.0)
                else:
                    print(f"🐍 [PYTHON] _calculate_simple_payback(): Payback simples = {year.ano} anos")
                    return min(float(year.ano), 99.0)
        
        print(f"🐍 [PYTHON] _calculate_simple_payback(): Payback não encontrado em {len(cash_flow)} anos, retornando 99 anos")
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

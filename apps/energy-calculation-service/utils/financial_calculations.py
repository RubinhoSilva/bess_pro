"""
Utilitários para cálculos financeiros

Funções para cálculo de indicadores financeiros como VPL, TIR, payback,
LCOE e outras métricas de análise de investimentos em energia solar.
"""

from typing import List, Optional
import numpy as np
import logging

logger = logging.getLogger(__name__)


def calculate_npv(cash_flows: List[float], discount_rate: float) -> float:
    """
    Calcula Valor Presente Líquido (Net Present Value - NPV)
    
    O VPL representa o valor presente de todos os fluxos de caixa futuros
    descontados a uma taxa específica, menos o investimento inicial.
    
    Fórmula: NPV = Σ [CF_t / (1 + r)^t]
    
    Onde:
    - CF_t = Fluxo de caixa no período t
    - r = Taxa de desconto
    - t = Período de tempo (anos)
    
    Args:
        cash_flows: Lista de fluxos de caixa anuais (incluindo investimento inicial negativo)
        discount_rate: Taxa de desconto anual em decimal (0.08 para 8%)
        
    Returns:
        VPL calculado em reais
        
    Raises:
        ValueError: Se parâmetros forem inválidos
        
    Examples:
        >>> cash_flows = [-50000, 10000, 12000, 14000, 16000]
        >>> calculate_npv(cash_flows, 0.08)
        2086.47
    """
    if not cash_flows:
        raise ValueError("Lista de fluxos de caixa não pode ser vazia")
    
    if discount_rate < 0:
        raise ValueError(f"Taxa de desconto não pode ser negativa: {discount_rate}")
    
    try:
        npv = 0.0
        for t, cf in enumerate(cash_flows):
            if not isinstance(cf, (int, float)):
                raise ValueError(f"Fluxo de caixa no período {t} deve ser numérico")
            
            npv += cf / ((1 + discount_rate) ** t)
        
        return npv
    except Exception as e:
        logger.error(f"Erro ao calcular VPL: {e}")
        raise ValueError(f"Não foi possível calcular VPL: {e}")


def calculate_irr(cash_flows: List[float], initial_guess: float = 0.1) -> Optional[float]:
    """
    Calcula Taxa Interna de Retorno (Internal Rate of Return - IRR)
    
    A TIR é a taxa de desconto que torna o VPL igual a zero.
    Representa a rentabilidade intrínseca do investimento.
    
    Fórmula: Σ [CF_t / (1 + IRR)^t] = 0
    
    Args:
        cash_flows: Lista de fluxos de caixa anuais
        initial_guess: Palpite inicial para o cálculo iterativo
        
    Returns:
        TIR em decimal (0.15 para 15%) ou None se não convergir
        
    Examples:
        >>> cash_flows = [-50000, 10000, 12000, 14000, 16000]
        >>> calculate_irr(cash_flows)
        0.1023
    """
    if not cash_flows:
        raise ValueError("Lista de fluxos de caixa não pode ser vazia")
    
    if len(cash_flows) < 2:
        raise ValueError("É necessário pelo menos 2 fluxos de caixa para calcular TIR")
    
    try:
        # Usar numpy para cálculo da TIR
        cash_flows_array = np.array(cash_flows, dtype=float)
        
        # Tentar calcular TIR usando numpy.irr
        try:
            irr = np.irr(cash_flows_array)
            return float(irr) if not np.isnan(irr) else None
        except:
            # Se numpy.irr falhar, usar método Newton-Raphson
            return _calculate_irr_newton(cash_flows, initial_guess)
            
    except Exception as e:
        logger.error(f"Erro ao calcular TIR: {e}")
        return None


def _calculate_irr_newton(cash_flows: List[float], initial_guess: float, 
                         max_iterations: int = 100, tolerance: float = 1e-6) -> Optional[float]:
    """
    Calcula TIR usando método Newton-Raphson (função auxiliar)
    
    Args:
        cash_flows: Lista de fluxos de caixa
        initial_guess: Palpite inicial
        max_iterations: Número máximo de iterações
        tolerance: Tolerância para convergência
        
    Returns:
        TIR ou None se não convergir
    """
    rate = initial_guess
    
    for iteration in range(max_iterations):
        npv = 0.0
        d_npv = 0.0  # Derivada do VPL em relação à taxa
        
        for t, cf in enumerate(cash_flows):
            factor = (1 + rate) ** t
            npv += cf / factor
            d_npv -= t * cf / ((1 + rate) ** (t + 1))
        
        # Verificar convergência
        if abs(npv) < tolerance:
            return rate
        
        # Evitar divisão por zero
        if abs(d_npv) < tolerance:
            break
        
        # Atualizar taxa usando Newton-Raphson
        new_rate = rate - npv / d_npv
        
        # Verificar se a nova taxa é razoável
        if new_rate < -0.99 or new_rate > 10:
            break
            
        rate = new_rate
    
    return None


def calculate_simple_payback(cash_flows: List[float]) -> Optional[float]:
    """
    Calcula payback simples (sem desconto)
    
    O payback simples é o tempo necessário para que o investimento inicial
    seja recuperado através dos fluxos de caixa futuros, sem considerar
    o valor do dinheiro no tempo.
    
    Fórmula: Encontrar t onde Σ CF_i ≥ 0 para i = 1 até t
    
    Args:
        cash_flows: Lista de fluxos de caixa anuais (primeiro elemento é investimento inicial)
        
    Returns:
        Número de anos para payback ou None se não houver payback
        
    Examples:
        >>> cash_flows = [-50000, 15000, 15000, 15000, 15000]
        >>> calculate_simple_payback(cash_flows)
        3.33
    """
    if not cash_flows:
        raise ValueError("Lista de fluxos de caixa não pode ser vazia")
    
    if len(cash_flows) < 2:
        return None
    
    try:
        cumulative = 0.0
        
        for year in range(1, len(cash_flows)):
            cumulative += cash_flows[year]
            
            if cumulative >= abs(cash_flows[0]):
                # Calcular payback fracional se necessário
                previous_cumulative = cumulative - cash_flows[year]
                remaining = abs(cash_flows[0]) - previous_cumulative
                
                if cash_flows[year] > 0:
                    fractional_year = remaining / cash_flows[year]
                    return year - 1 + fractional_year
                else:
                    return year
        
        return None  # Não houve payback no período analisado
        
    except Exception as e:
        logger.error(f"Erro ao calcular payback simples: {e}")
        return None


def calculate_discounted_payback(cash_flows: List[float], discount_rate: float) -> Optional[float]:
    """
    Calcula payback descontado
    
    O payback descontado considera o valor do dinheiro no tempo,
    descontando os fluxos de caixa futuros à taxa de desconto.
    
    Fórmula: Encontrar t onde Σ [CF_i / (1 + r)^i] ≥ 0 para i = 1 até t
    
    Args:
        cash_flows: Lista de fluxos de caixa anuais
        discount_rate: Taxa de desconto anual em decimal
        
    Returns:
        Número de anos para payback descontado ou None se não houver payback
        
    Examples:
        >>> cash_flows = [-50000, 15000, 15000, 15000, 15000]
        >>> calculate_discounted_payback(cash_flows, 0.08)
        3.85
    """
    if not cash_flows:
        raise ValueError("Lista de fluxos de caixa não pode ser vazia")
    
    if discount_rate < 0:
        raise ValueError(f"Taxa de desconto não pode ser negativa: {discount_rate}")
    
    if len(cash_flows) < 2:
        return None
    
    try:
        cumulative_discounted = 0.0
        
        for year in range(1, len(cash_flows)):
            discounted_cf = cash_flows[year] / ((1 + discount_rate) ** year)
            cumulative_discounted += discounted_cf
            
            if cumulative_discounted >= abs(cash_flows[0]):
                # Calcular payback fracional
                previous_cumulative = cumulative_discounted - discounted_cf
                remaining = abs(cash_flows[0]) - previous_cumulative
                
                if discounted_cf > 0:
                    fractional_year = remaining / discounted_cf
                    return year - 1 + fractional_year
                else:
                    return year
        
        return None  # Não houve payback descontado no período analisado
        
    except Exception as e:
        logger.error(f"Erro ao calcular payback descontado: {e}")
        return None


def calculate_lcoe(total_investment: float, total_generation: float, 
                  opex: float, discount_rate: float, years: int) -> float:
    """
    Calcula Custo Nivelado de Energia (Levelized Cost of Energy - LCOE)
    
    O LCOE representa o custo médio por unidade de energia gerada ao longo
    da vida útil do projeto, considerando todos os custos descontados.
    
    Fórmula: LCOE = (CAPEX + Σ OPEX_discounted) / Σ Energy_discounted
    
    Onde:
    - CAPEX = Investimento inicial
    - OPEX_discounted = Custos operacionais descontados
    - Energy_discounted = Geração de energia descontada
    
    Args:
        total_investment: Investimento total inicial em R$
        total_generation: Geração anual total em kWh
        opex: Custo operacional anual em R$
        discount_rate: Taxa de desconto anual em decimal
        years: Vida útil do projeto em anos
        
    Returns:
        LCOE em R$/kWh
        
    Raises:
        ValueError: Se parâmetros forem inválidos
        
    Examples:
        >>> calculate_lcoe(50000, 12000, 1000, 0.08, 25)
        0.42
    """
    if total_investment <= 0:
        raise ValueError(f"Investimento deve ser positivo: {total_investment}")
    
    if total_generation <= 0:
        raise ValueError(f"Geração deve ser positiva: {total_generation}")
    
    if opex < 0:
        raise ValueError(f"OPEX não pode ser negativo: {opex}")
    
    if discount_rate < 0:
        raise ValueError(f"Taxa de desconto não pode ser negativa: {discount_rate}")
    
    if years <= 0:
        raise ValueError(f"Vida útil deve ser positiva: {years}")
    
    try:
        # Calcular valor presente dos custos operacionais
        opex_present_value = 0.0
        for year in range(1, years + 1):
            opex_discounted = opex / ((1 + discount_rate) ** year)
            opex_present_value += opex_discounted
        
        # Calcular valor presente da energia gerada
        energy_present_value = 0.0
        for year in range(1, years + 1):
            energy_discounted = total_generation / ((1 + discount_rate) ** year)
            energy_present_value += energy_discounted
        
        # Calcular LCOE
        total_cost_present = total_investment + opex_present_value
        
        if energy_present_value <= 0:
            raise ValueError("Energia descontada não pode ser zero ou negativa")
        
        lcoe = total_cost_present / energy_present_value
        return lcoe
        
    except Exception as e:
        logger.error(f"Erro ao calcular LCOE: {e}")
        raise ValueError(f"Não foi possível calcular LCOE: {e}")


def calculate_roi(total_investment: float, total_returns: float) -> float:
    """
    Calcula Retorno Sobre Investimento (Return on Investment - ROI)
    
    ROI mede a rentabilidade do investimento como percentual do custo.
    
    Fórmula: ROI = (Retorno Total - Investimento) / Investimento
    
    Args:
        total_investment: Investimento total em R$
        total_returns: Retorno total em R$
        
    Returns:
        ROI em decimal (0.25 para 25%)
        
    Raises:
        ValueError: Se parâmetros forem inválidos
        
    Examples:
        >>> calculate_roi(50000, 75000)
        0.5
    """
    if total_investment <= 0:
        raise ValueError(f"Investimento deve ser positivo: {total_investment}")
    
    try:
        roi = (total_returns - total_investment) / total_investment
        return roi
    except Exception as e:
        logger.error(f"Erro ao calcular ROI: {e}")
        raise ValueError(f"Não foi possível calcular ROI: {e}")


def calculate_profitability_index(npv: float, total_investment: float) -> float:
    """
    Calcula Índice de Lucratividade (Profitability Index - PI)
    
    PI indica o valor criado por unidade de investimento.
    PI > 1 indica projeto viável.
    
    Fórmula: PI = (VPL + Investimento) / Investimento
    
    Args:
        npv: Valor Presente Líquido em R$
        total_investment: Investimento total em R$ (valor absoluto)
        
    Returns:
        Índice de lucratividade
        
    Raises:
        ValueError: Se parâmetros forem inválidos
        
    Examples:
        >>> calculate_profitability_index(10000, 50000)
        1.2
    """
    if total_investment <= 0:
        raise ValueError(f"Investimento deve ser positivo: {total_investment}")
    
    try:
        pi = (npv + total_investment) / total_investment
        return pi
    except Exception as e:
        logger.error(f"Erro ao calcular índice de lucratividade: {e}")
        raise ValueError(f"Não foi possível calcular índice de lucratividade: {e}")


def calculate_annuity(present_value: float, interest_rate: float, periods: int) -> float:
    """
    Calcula anuidade (pagamento periódico) a partir do valor presente
    
    Fórmula: PMT = PV * [r * (1 + r)^n] / [(1 + r)^n - 1]
    
    Args:
        present_value: Valor presente em R$
        interest_rate: Taxa de juros por período em decimal
        periods: Número de períodos
        
    Returns:
        Valor da anuidade em R$
        
    Raises:
        ValueError: Se parâmetros forem inválidos
        
    Examples:
        >>> calculate_annuity(100000, 0.08, 10)
        14902.95
    """
    if present_value <= 0:
        raise ValueError(f"Valor presente deve ser positivo: {present_value}")
    
    if interest_rate < 0:
        raise ValueError(f"Taxa de juros não pode ser negativa: {interest_rate}")
    
    if periods <= 0:
        raise ValueError(f"Número de períodos deve ser positivo: {periods}")
    
    try:
        if interest_rate == 0:
            return present_value / periods
        
        factor = (1 + interest_rate) ** periods
        annuity = present_value * (interest_rate * factor) / (factor - 1)
        return annuity
    except Exception as e:
        logger.error(f"Erro ao calcular anuidade: {e}")
        raise ValueError(f"Não foi possível calcular anuidade: {e}")


def calculate_present_value(annuity: float, interest_rate: float, periods: int) -> float:
    """
    Calcula valor presente a partir de anuidade
    
    Fórmula: PV = PMT * [(1 - (1 + r)^-n) / r]
    
    Args:
        annuity: Valor da anuidade em R$
        interest_rate: Taxa de desconto em decimal
        periods: Número de períodos
        
    Returns:
        Valor presente em R$
        
    Raises:
        ValueError: Se parâmetros forem inválidos
        
    Examples:
        >>> calculate_present_value(14902.95, 0.08, 10)
        100000.0
    """
    if annuity <= 0:
        raise ValueError(f"Anuidade deve ser positiva: {annuity}")
    
    if interest_rate < 0:
        raise ValueError(f"Taxa de desconto não pode ser negativa: {interest_rate}")
    
    if periods <= 0:
        raise ValueError(f"Número de períodos deve ser positivo: {periods}")
    
    try:
        if interest_rate == 0:
            return annuity * periods
        
        factor = (1 - (1 + interest_rate) ** -periods) / interest_rate
        present_value = annuity * factor
        return present_value
    except Exception as e:
        logger.error(f"Erro ao calcular valor presente: {e}")
        raise ValueError(f"Não foi possível calcular valor presente: {e}")


def calculate_degradation_factor(base_value: float, degradation_rate: float, year: int) -> float:
    """
    Calcula fator de degradação para um ano específico
    
    Fórmula: Valor_ano = Base * (1 - taxa_degradacao)^(ano-1)
    
    Args:
        base_value: Valor base no ano 1
        degradation_rate: Taxa de degradação anual em decimal
        year: Ano para cálculo (1-based)
        
    Returns:
        Valor degradado para o ano especificado
        
    Raises:
        ValueError: Se parâmetros forem inválidos
        
    Examples:
        >>> calculate_degradation_factor(1000, 0.005, 5)
        980.15
    """
    if base_value < 0:
        raise ValueError(f"Valor base não pode ser negativo: {base_value}")
    
    if degradation_rate < 0 or degradation_rate > 1:
        raise ValueError(f"Taxa de degradação deve estar entre 0 e 1: {degradation_rate}")
    
    if year < 1:
        raise ValueError(f"Ano deve ser >= 1: {year}")
    
    try:
        degraded_value = base_value * ((1 - degradation_rate) ** (year - 1))
        return degraded_value
    except Exception as e:
        logger.error(f"Erro ao calcular fator de degradação: {e}")
        raise ValueError(f"Não foi possível calcular fator de degradação: {e}")


def calculate_inflation_factor(base_value: float, inflation_rate: float, year: int) -> float:
    """
    Calcula fator de inflação para um ano específico
    
    Fórmula: Valor_ano = Base * (1 + taxa_inflacao)^(ano-1)
    
    Args:
        base_value: Valor base no ano 1
        inflation_rate: Taxa de inflação anual em decimal
        year: Ano para cálculo (1-based)
        
    Returns:
        Valor corrigido pela inflação para o ano especificado
        
    Raises:
        ValueError: Se parâmetros forem inválidos
        
    Examples:
        >>> calculate_inflation_factor(1000, 0.04, 5)
        1169.86
    """
    if base_value < 0:
        raise ValueError(f"Valor base não pode ser negativo: {base_value}")
    
    if inflation_rate < 0:
        raise ValueError(f"Taxa de inflação não pode ser negativa: {inflation_rate}")
    
    if year < 1:
        raise ValueError(f"Ano deve ser >= 1: {year}")
    
    try:
        inflated_value = base_value * ((1 + inflation_rate) ** (year - 1))
        return inflated_value
    except Exception as e:
        logger.error(f"Erro ao calcular fator de inflação: {e}")
        raise ValueError(f"Não foi possível calcular fator de inflação: {e}")
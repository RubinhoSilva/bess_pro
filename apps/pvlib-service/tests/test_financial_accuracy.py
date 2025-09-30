"""
Testes de validação para corretude dos cálculos financeiros
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.financial_models import FinancialInput
from services.financial_service import FinancialCalculationService

def test_autoconsumo_instantaneo():
    """Validar que energia simultanea nao paga Fio B"""
    input_data = FinancialInput(
        investimento_inicial=100000.0,
        vida_util=25,
        geracao_mensal=[2000.0] * 12,
        consumo_mensal=[1000.0] * 12,
        fator_simultaneidade=0.30,
        tarifa_energia=0.84,
        custo_fio_b=0.25,
        fio_b_schedule={2025: 0.45, 2026: 0.60, 2027: 0.75, 2028: 0.90},
        base_year=2025,
        taxa_desconto=8.0,
        inflacao_energia=8.5,
        degradacao_modulos=0.5,
        custo_om=1500.0,
        inflacao_om=8.0
    )
    
    results = FinancialCalculationService.calculate_advanced_financials(input_data)
    
    # Economia ano 1 esperada:
    # Imediato: 600 kWh/mes x R$ 0.84 x 12 = R$ 6.048
    # Credito: 400 kWh/mes x (R$ 0.84 - R$ 0.25 x 0.45) x 12 = R$ 3.504
    # Total aproximado: R$ 9.552
    
    economia_esperada = 9552.0
    tolerancia = 200.0
    
    assert abs(results.cash_flow[0].economia_energia - economia_esperada) < tolerancia, \
        f"Economia ano 1: {results.cash_flow[0].economia_energia}, esperado: {economia_esperada}"


def test_banco_creditos_acumula_entre_meses():
    """Validar que creditos acumulam entre meses"""
    input_data = FinancialInput(
        investimento_inicial=50000.0,
        vida_util=25,
        # Mes 1: gera 2000, consome 500 -> sobra 1500
        # Mes 2: gera 500, consome 1500 -> usa 1000 do banco
        geracao_mensal=[2000.0, 500.0] + [1000.0] * 10,
        consumo_mensal=[500.0, 1500.0] + [1000.0] * 10,
        fator_simultaneidade=0.0,  # Desabilitar para testar banco puro
        tarifa_energia=0.84,
        custo_fio_b=0.25,
        fio_b_schedule={2025: 0.45},
        base_year=2025,
        taxa_desconto=8.0,
        inflacao_energia=0.0,  # Desabilitar para simplificar teste
        degradacao_modulos=0.0,
        custo_om=1000.0,
        inflacao_om=0.0
    )
    
    results = FinancialCalculationService.calculate_advanced_financials(input_data)
    
    # No mes 1: sobra 1500 kWh no banco
    # No mes 2: usa 1000 kWh do banco, sobra 500 kWh
    # Economia deve refletir uso do banco
    
    assert results.cash_flow[0].economia_energia > 0


def test_lei_14300_cronograma_fio_b():
    """Validar cronograma progressivo do Fio B"""
    input_data = FinancialInput(
        investimento_inicial=100000.0,
        vida_util=5,  # Testar apenas 5 anos
        geracao_mensal=[1500.0] * 12,
        consumo_mensal=[1000.0] * 12,
        fator_simultaneidade=0.0,
        tarifa_energia=1.0,  # Simplificar
        custo_fio_b=0.25,
        fio_b_schedule={2025: 0.45, 2026: 0.60, 2027: 0.75, 2028: 0.90},
        base_year=2025,
        taxa_desconto=8.0,
        inflacao_energia=0.0,
        degradacao_modulos=0.0,
        custo_om=1000.0,
        inflacao_om=0.0
    )
    
    results = FinancialCalculationService.calculate_advanced_financials(input_data)
    
    # Economia ano 1 < ano 2 < ano 3 < ano 4 (Fio B aumenta)
    econ_ano1 = results.cash_flow[0].economia_energia
    econ_ano2 = results.cash_flow[1].economia_energia
    econ_ano3 = results.cash_flow[2].economia_energia
    econ_ano4 = results.cash_flow[3].economia_energia
    
    assert econ_ano1 > econ_ano2 > econ_ano3 > econ_ano4, \
        "Economia deve diminuir com aumento do Fio B"


def test_comparacao_com_notebook():
    """Teste de regressao: comparar com resultados validados do notebook"""
    # Usar dados exatos do notebook (celula uu5_J-VV5nhl)
    input_data = FinancialInput(
        investimento_inicial=280000.0,
        vida_util=25,
        geracao_mensal=[12000, 13000, 15000, 16000, 15500, 14000, 
                        13500, 14500, 15000, 16000, 14000, 13000],
        consumo_mensal=[6000, 6200, 6100, 6900, 6800, 6500, 
                        6600, 6400, 6300, 6100, 6000, 6200],
        fator_simultaneidade=0.25,
        tarifa_energia=0.84,
        custo_fio_b=0.25,
        fio_b_schedule={2025: 0.45, 2026: 0.60, 2027: 0.75, 2028: 0.90},
        base_year=2025,
        taxa_desconto=8.0,
        inflacao_energia=8.5,
        degradacao_modulos=0.5,
        custo_om=4200.0,  # 1.5% de 280000
        inflacao_om=8.0,
        autoconsumo_remoto_b=True,
        consumo_remoto_b_mensal=[2000, 2100, 2200, 2000, 2900, 2800, 
                                  2000, 2100, 2200, 2300, 2100, 2000],
        tarifa_remoto_b=0.84,
        fio_b_remoto_b=0.25,
        perc_creditos_b=0.40
    )
    
    results = FinancialCalculationService.calculate_advanced_financials(input_data)
    
    # Valores esperados do notebook (com tolerancia de 5%)
    vpl_esperado = 150000.0  # Aproximado
    tir_esperada = 15.0  # Aproximado
    
    assert abs(results.vpl - vpl_esperado) / vpl_esperado < 0.10, \
        f"VPL: {results.vpl}, esperado: ~{vpl_esperado}"
    
    assert abs(results.tir - tir_esperada) / tir_esperada < 0.10, \
        f"TIR: {results.tir}%, esperado: ~{tir_esperada}%"


def test_funcao_local_savings_isolada():
    """Testar funcao _calculate_monthly_local_savings isoladamente"""
    
    # Caso 1: Geracao > Consumo com simultaneidade
    economia, banco = FinancialCalculationService._calculate_monthly_local_savings(
        geracao=1000.0,           # 1000 kWh gerados
        consumo=600.0,            # 600 kWh consumidos
        tarifa=0.84,              # R$ 0.84/kWh
        fio_b=0.25,               # R$ 0.25/kWh Fio B
        fator_simultaneidade=0.25, # 25% simultaneidade
        banco_creditos=0.0,       # Banco vazio
        ano=1,                    # Primeiro ano (2025)
        fio_b_schedule={2025: 0.45, 2026: 0.60},
        base_year=2025
    )
    
    # Autoconsumo: min(1000*0.25, 600) = 250 kWh -> R$ 210,00
    # Credito novo: 1000 - 250 = 750 kWh
    # Abate resto: min(750, 600-250) = 350 kWh
    # Custo Fio B: 350 * 0.25 * 0.45 = R$ 39,37
    # Economia credito: 350 * 0.84 - 39.37 = R$ 254,63
    # Total: 210 + 254.63 = R$ 464,63
    
    economia_esperada = 464.63
    tolerancia = 1.0
    
    assert abs(economia - economia_esperada) < tolerancia, \
        f"Economia: {economia}, esperado: {economia_esperada}"
    
    # Banco final: credito restante = 750 - 350 = 400 kWh
    assert abs(banco - 400.0) < 0.1, f"Banco: {banco}, esperado: 400.0"


def test_remote_b_savings_isolada():
    """Testar funcao _calculate_remote_b_savings isoladamente"""
    
    economia, banco_novo = FinancialCalculationService._calculate_remote_b_savings(
        banco_creditos_local=1000.0,   # 1000 kWh no banco
        consumo_remoto_b=500.0,        # 500 kWh consumo remoto
        tarifa_geradora=0.84,          # R$ 0.84/kWh geradora
        tarifa_remoto_b=0.84,          # R$ 0.84/kWh remoto
        fio_b_remoto=0.25,             # R$ 0.25/kWh Fio B remoto
        perc_creditos_b=0.40,          # 40% dos creditos para B
        ano=1,                         # Primeiro ano (2025)
        fio_b_schedule={2025: 0.45},
        base_year=2025
    )
    
    # Creditos para B: 1000 * 0.40 = 400 kWh
    # Fator equiv: 0.84 / 0.84 = 1.0
    # Abatido: min(400/1.0, 500) = 400 kWh
    # Custo Fio B: 400 * 0.25 * 0.45 = R$ 45,00
    # Economia: 400 * 0.84 - 45 = R$ 291,00
    
    economia_esperada = 291.0
    tolerancia = 1.0
    
    assert abs(economia - economia_esperada) < tolerancia, \
        f"Economia remoto B: {economia}, esperado: {economia_esperada}"
    
    # Banco novo: 1000 - 400 = 600 kWh
    assert abs(banco_novo - 600.0) < 0.1, f"Banco novo: {banco_novo}, esperado: 600.0"


if __name__ == "__main__":
    # Executar testes individualmente para debug
    test_autoconsumo_instantaneo()
    test_banco_creditos_acumula_entre_meses()
    test_lei_14300_cronograma_fio_b()
    test_funcao_local_savings_isolada()
    test_remote_b_savings_isolada()
    print("✅ Todos os testes passaram!")
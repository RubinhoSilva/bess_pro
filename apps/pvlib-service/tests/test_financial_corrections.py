# -*- coding: utf-8 -*-
"""
Testes para validar as correcoes do servico financeiro
"""

# import pytest
import sys
import os

# Adicionar o diretório raiz ao path para imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.financial_models import FinancialInput
from services.financial_service import FinancialCalculationService


def test_distribuicao_simultanea_creditos():
    """Validar que creditos sao distribuidos simultaneamente"""
    input_data = FinancialInput(
        investimento_inicial=100000.0,
        vida_util=1,  # Testar apenas 1 ano
        geracao_mensal=[3000.0] * 12,  # Gera muito
        consumo_mensal=[1000.0] * 12,  # Consome pouco (sobra muito)
        fator_simultaneidade=0.0,  # Desabilitar para testar banco puro
        tarifa_energia=0.84,
        custo_fio_b=0.25,
        fio_b_schedule={2025: 0.45},
        base_year=2025,
        taxa_desconto=8.0,
        inflacao_energia=0.0,
        degradacao_modulos=0.0,
        custo_om=1000.0,
        inflacao_om=0.0,
        # Habilitar todas as unidades remotas
        autoconsumo_remoto_b=True,
        consumo_remoto_b_mensal=[500.0] * 12,
        tarifa_remoto_b=0.84,
        fio_b_remoto_b=0.25,
        perc_creditos_b=0.40,
        autoconsumo_remoto_a_verde=True,
        consumo_remoto_a_verde_fp_mensal=[300.0] * 12,
        consumo_remoto_a_verde_p_mensal=[100.0] * 12,
        tarifa_remoto_a_verde_fp=0.48,
        tarifa_remoto_a_verde_p=2.20,
        tusd_remoto_a_verde_fp=0.16,
        tusd_remoto_a_verde_p=1.62,
        te_ponta_a_verde=0.55,
        te_fora_ponta_a_verde=0.34,
        perc_creditos_a_verde=0.30,
        autoconsumo_remoto_a_azul=True,
        consumo_remoto_a_azul_fp_mensal=[300.0] * 12,
        consumo_remoto_a_azul_p_mensal=[100.0] * 12,
        tarifa_remoto_a_azul_fp=0.48,
        tarifa_remoto_a_azul_p=2.20,
        tusd_remoto_a_azul_fp=0.16,
        tusd_remoto_a_azul_p=1.62,
        te_ponta_a_azul=0.55,
        te_fora_ponta_a_azul=0.34,
        perc_creditos_a_azul=0.30
    )
    
    results = FinancialCalculationService.calculate_advanced_financials(input_data)
    
    # Verificar que economia existe para todas as unidades
    # (Se distribuição fosse sequencial, últimas unidades teriam economia próxima de zero)
    assert results.cash_flow[0].economia_energia > 10000.0, \
        "Economia total deve ser significativa com todas unidades consumindo"


def test_percentuais_invalidos():
    """Validar que percentuais somando != 100% sao rejeitados"""
    try:
        FinancialInput(
            investimento_inicial=100000.0,
            vida_util=25,
            geracao_mensal=[2000.0] * 12,
            consumo_mensal=[1000.0] * 12,
            tarifa_energia=0.84,
            custo_fio_b=0.25,
            taxa_desconto=8.0,
            inflacao_energia=8.5,
            degradacao_modulos=0.5,
            custo_om=1500.0,
            inflacao_om=8.0,
            perc_creditos_b=0.50,  # 50%
            perc_creditos_a_verde=0.50,  # 50%
            perc_creditos_a_azul=0.50  # 50% = 150% total (INVALIDO)
        )
        raise AssertionError("Deveria ter levantado ValueError")
    except ValueError as e:
        if "Soma dos percentuais" not in str(e):
            raise AssertionError("Erro deve mencionar soma dos percentuais")


def test_funcao_obsoleta_nao_existe():
    """Validar que funcao antiga foi removida"""
    assert not hasattr(
        FinancialCalculationService, 
        '_calculate_energy_savings'
    ), "Funcao obsoleta _calculate_energy_savings ainda existe"


def test_distribuicao_creditos_correto_percentual():
    """Testar que cada unidade recebe exatamente seu percentual"""
    input_data = FinancialInput(
        investimento_inicial=100000.0,
        vida_util=1,
        geracao_mensal=[1000.0] * 12,  # Banco sempre 1000 kWh/mês
        consumo_mensal=[0.0] * 12,  # Sem consumo local para banco puro
        fator_simultaneidade=0.0,
        tarifa_energia=1.0,  # Simplificar cálculos
        custo_fio_b=0.0,  # Eliminar custos para test puro
        fio_b_schedule={2025: 0.0},  # Sem fio B
        base_year=2025,
        taxa_desconto=0.0,  # Sem desconto para test simples
        inflacao_energia=0.0,
        degradacao_modulos=0.0,
        custo_om=0.0,
        inflacao_om=0.0,
        # Test apenas Grupo B para verificar percentual
        autoconsumo_remoto_b=True,
        consumo_remoto_b_mensal=[1000.0] * 12,  # Consome todo o banco
        tarifa_remoto_b=1.0,
        fio_b_remoto_b=0.0,
        perc_creditos_b=0.40,  # 40% dos créditos
        autoconsumo_remoto_a_verde=False,
        autoconsumo_remoto_a_azul=False
    )
    
    # Calcular economia apenas com B
    results_b = FinancialCalculationService.calculate_advanced_financials(input_data)
    economia_b = results_b.cash_flow[0].economia_energia
    
    # Com 40% dos créditos e consumo total igual ao banco, 
    # B deve conseguir abater 40% do consumo = 400 kWh/mês = 4800 kWh/ano
    # Economia = 4800 * 1.0 = 4800
    expected_economia_b = 4800.0
    
    assert abs(economia_b - expected_economia_b) < 100.0, \
        "Grupo B deve ter economia proxima de {}, mas teve {}".format(expected_economia_b, economia_b)


def test_creditos_nao_duplos():
    """Verificar que creditos nao sao contados em duplicata"""
    
    # Teste 1: Apenas local
    input_local = FinancialInput(
        investimento_inicial=100000.0,
        vida_util=1,
        geracao_mensal=[500.0] * 12,
        consumo_mensal=[300.0] * 12,  # Sobra 200 kWh/mês
        fator_simultaneidade=0.0,
        tarifa_energia=1.0,
        custo_fio_b=0.0,
        fio_b_schedule={2025: 0.0},
        base_year=2025,
        taxa_desconto=0.0,
        inflacao_energia=0.0,
        degradacao_modulos=0.0,
        custo_om=0.0,
        autoconsumo_remoto_b=False,
        autoconsumo_remoto_a_verde=False,
        autoconsumo_remoto_a_azul=False
    )
    
    # Teste 2: Local + remoto
    input_remoto = input_local.copy()
    input_remoto.autoconsumo_remoto_b = True
    input_remoto.consumo_remoto_b_mensal = [100.0] * 12  # Consome 100 kWh/mês
    input_remoto.tarifa_remoto_b = 1.0
    input_remoto.fio_b_remoto_b = 0.0
    input_remoto.perc_creditos_b = 0.50  # 50% para remoto
    
    results_local = FinancialCalculationService.calculate_advanced_financials(input_local)
    results_remoto = FinancialCalculationService.calculate_advanced_financials(input_remoto)
    
    economia_local = results_local.cash_flow[0].economia_energia
    economia_remoto = results_remoto.cash_flow[0].economia_energia
    
    # Economia com remoto deve ser maior que apenas local,
    # mas não deve ser mais que economia_local + economia_adicional_possivel
    economia_adicional_maxima = 100.0 * 12 * 0.5  # Máximo que remoto pode usar
    
    assert economia_remoto > economia_local, \
        "Economia com remoto deve ser maior que apenas local"
    
    assert economia_remoto <= economia_local + economia_adicional_maxima + 100, \
        "Economia nao deve exceder limite teorico: {}".format(economia_local + economia_adicional_maxima)


def test_v2_functions_exist():
    """Verificar que as novas funcoes _v2 existem"""
    assert hasattr(FinancialCalculationService, '_calculate_remote_b_savings_v2'), \
        "Funcao _calculate_remote_b_savings_v2 deve existir"
    
    assert hasattr(FinancialCalculationService, '_calculate_remote_a_verde_savings_v2'), \
        "Funcao _calculate_remote_a_verde_savings_v2 deve existir"
    
    assert hasattr(FinancialCalculationService, '_calculate_remote_a_azul_savings_v2'), \
        "Funcao _calculate_remote_a_azul_savings_v2 deve existir"


def test_old_functions_removed():
    """Verificar que as funcoes antigas foram removidas"""
    assert not hasattr(FinancialCalculationService, '_calculate_remote_b_savings'), \
        "Funcao obsoleta _calculate_remote_b_savings ainda existe"
    
    assert not hasattr(FinancialCalculationService, '_calculate_remote_a_verde_savings'), \
        "Funcao obsoleta _calculate_remote_a_verde_savings ainda existe"
    
    assert not hasattr(FinancialCalculationService, '_calculate_remote_a_azul_savings'), \
        "Funcao obsoleta _calculate_remote_a_azul_savings ainda existe"


if __name__ == "__main__":
    # Executar testes diretamente
    print("Executando testes de correcoes financeiras...")
    
    try:
        test_percentuais_invalidos()
        print("✓ test_percentuais_invalidos passou")
    except Exception as e:
        print("✗ test_percentuais_invalidos falhou: {}".format(e))
    
    try:
        test_funcao_obsoleta_nao_existe()
        print("✓ test_funcao_obsoleta_nao_existe passou")
    except Exception as e:
        print("✗ test_funcao_obsoleta_nao_existe falhou: {}".format(e))
    
    try:
        test_v2_functions_exist()
        print("✓ test_v2_functions_exist passou")
    except Exception as e:
        print("✗ test_v2_functions_exist falhou: {}".format(e))
    
    try:
        test_old_functions_removed()
        print("✓ test_old_functions_removed passou")
    except Exception as e:
        print("✗ test_old_functions_removed falhou: {}".format(e))
    
    try:
        test_distribuicao_simultanea_creditos()
        print("✓ test_distribuicao_simultanea_creditos passou")
    except Exception as e:
        print("✗ test_distribuicao_simultanea_creditos falhou: {}".format(e))
    
    try:
        test_distribuicao_creditos_correto_percentual()
        print("✓ test_distribuicao_creditos_correto_percentual passou")
    except Exception as e:
        print("✗ test_distribuicao_creditos_correto_percentual falhou: {}".format(e))
    
    try:
        test_creditos_nao_duplos()
        print("✓ test_creditos_nao_duplos passou")
    except Exception as e:
        print("✗ test_creditos_nao_duplos falhou: {}".format(e))
    
    print("\nTodos os testes executados!")
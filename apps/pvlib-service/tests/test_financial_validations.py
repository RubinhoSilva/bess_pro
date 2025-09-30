# -*- coding: utf-8 -*-
"""
Testes para validacao de percentuais do servico financeiro
"""

import sys
import os

# Adicionar o diretorio raiz ao path para imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.financial_models import FinancialInput


def test_percentuais_validos_somando_100():
    """Testa que percentuais validos sao aceitos"""
    try:
        input_data = FinancialInput(
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
            perc_creditos_b=0.40,
            perc_creditos_a_verde=0.30,
            perc_creditos_a_azul=0.30
        )
        assert True, "Percentuais validos devem ser aceitos"
    except ValueError:
        raise AssertionError("Percentuais validos foram rejeitados incorretamente")


def test_percentuais_invalidos_somando_150():
    """Testa que percentuais somando mais de 100% sao rejeitados"""
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
            perc_creditos_b=0.50,
            perc_creditos_a_verde=0.50,
            perc_creditos_a_azul=0.50
        )
        raise AssertionError("Percentuais somando 150% deveriam ser rejeitados")
    except ValueError as e:
        if "Soma dos percentuais" not in str(e):
            raise AssertionError("Mensagem de erro incorreta: {}".format(str(e)))


def test_percentuais_invalidos_somando_80():
    """Testa que percentuais somando menos de 100% sao rejeitados"""
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
            perc_creditos_b=0.30,
            perc_creditos_a_verde=0.30,
            perc_creditos_a_azul=0.20
        )
        raise AssertionError("Percentuais somando 80% deveriam ser rejeitados")
    except ValueError as e:
        if "Soma dos percentuais" not in str(e):
            raise AssertionError("Mensagem de erro incorreta: {}".format(str(e)))


def test_percentuais_com_tolerancia():
    """Testa que pequenas diferencas de precisao float sao aceitas"""
    try:
        input_data = FinancialInput(
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
            perc_creditos_b=0.333333,
            perc_creditos_a_verde=0.333333,
            perc_creditos_a_azul=0.333334
        )
        assert True, "Tolerancia de 1% deve permitir imprecisoes float"
    except ValueError:
        raise AssertionError("Tolerancia de 1% nao funcionou corretamente")


if __name__ == "__main__":
    # Executar testes diretamente
    print("Executando testes de validacao de percentuais...")

    try:
        test_percentuais_validos_somando_100()
        print("✓ test_percentuais_validos_somando_100 passou")
    except Exception as e:
        print("✗ test_percentuais_validos_somando_100 falhou: {}".format(e))

    try:
        test_percentuais_invalidos_somando_150()
        print("✓ test_percentuais_invalidos_somando_150 passou")
    except Exception as e:
        print("✗ test_percentuais_invalidos_somando_150 falhou: {}".format(e))

    try:
        test_percentuais_invalidos_somando_80()
        print("✓ test_percentuais_invalidos_somando_80 passou")
    except Exception as e:
        print("✗ test_percentuais_invalidos_somando_80 falhou: {}".format(e))

    try:
        test_percentuais_com_tolerancia()
        print("✓ test_percentuais_com_tolerancia passou")
    except Exception as e:
        print("✗ test_percentuais_com_tolerancia falhou: {}".format(e))

    print("\nTodos os testes de validacao executados!")
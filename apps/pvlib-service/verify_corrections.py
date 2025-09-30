# -*- coding: utf-8 -*-
"""
Script simples para verificar as correcoes implementadas
"""

import ast
import os

def test_function_signatures():
    """Testa se as funcoes foram corretamente implementadas"""
    
    # Ler o arquivo da service
    with open('services/financial_service.py', 'r') as f:
        content = f.read()
    
    print("=== VERIFICACAO DAS CORRECOES ===\n")
    
    # Teste 1: Funcoes v2 existem
    print("1. Verificando se novas funcoes _v2 existem:")
    v2_functions = [
        '_calculate_remote_b_savings_v2',
        '_calculate_remote_a_verde_savings_v2', 
        '_calculate_remote_a_azul_savings_v2'
    ]
    
    for func in v2_functions:
        if "def {}(".format(func) in content:
            print("   ✓ {} - EXISTE".format(func))
        else:
            print("   ✗ {} - NAO ENCONTRADA".format(func))
    
    # Teste 2: Funcoes antigas removidas
    print("\n2. Verificando se funcoes antigas foram removidas:")
    old_functions = [
        '_calculate_remote_b_savings(',
        '_calculate_remote_a_verde_savings(',
        '_calculate_remote_a_azul_savings(',
        '_calculate_energy_savings('
    ]
    
    for func in old_functions:
        if "def {}".format(func) in content:
            print("   ✗ {} - AINDA EXISTE (deveria ter sido removida)".format(func[:-1]))
        else:
            print("   ✓ {} - REMOVIDA".format(func[:-1]))
    
    # Teste 3: Logica simultanea implementada
    print("\n3. Verificando implementacao da logica simultanea:")
    if "banco_inicial_mes = banco_local" in content:
        print("   ✓ Banco inicial do mes salvo")
    else:
        print("   ✗ Banco inicial do mes NAO salvo")
        
    if "creditos_consumidos_total = 0.0" in content:
        print("   ✓ Contador de creditos consumidos criado")
    else:
        print("   ✗ Contador de creditos consumidos NAO criado")
        
    if "banco_local = banco_local - creditos_consumidos_total" in content:
        print("   ✓ Banco atualizado uma vez so no final")
    else:
        print("   ✗ Banco NAO atualizado corretamente")

def test_model_validation():
    """Testa se a validacao de percentuais foi implementada"""
    
    with open('models/financial_models.py', 'r') as f:
        content = f.read()
    
    print("\n4. Verificando validacao de percentuais:")
    if "@validator('perc_creditos_a_azul')" in content:
        print("   ✓ Validator implementado")
    else:
        print("   ✗ Validator NAO implementado")
        
    if "Soma dos percentuais" in content:
        print("   ✓ Mensagem de erro adequada")
    else:
        print("   ✗ Mensagem de erro NAO encontrada")

def test_file_structure():
    """Testa se os arquivos de teste foram criados"""

    print("\n5. Verificando arquivos de teste:")
    if os.path.exists('tests/test_financial_corrections.py'):
        print("   ✓ Arquivo test_financial_corrections.py criado")
    else:
        print("   ✗ Arquivo test_financial_corrections.py NAO criado")

    if os.path.exists('tests/test_financial_validations.py'):
        print("   ✓ Arquivo test_financial_validations.py criado")
    else:
        print("   ✗ Arquivo test_financial_validations.py NAO criado")

def test_unused_variables():
    """Testa se variaveis nao usadas foram removidas"""

    with open('services/financial_service.py', 'r') as f:
        content = f.read()

    print("\n6. Verificando remocao de variaveis nao usadas:")
    if "banco_remoto_b = 0.0" in content:
        print("   ✗ banco_remoto_b ainda existe (deveria ter sido removida)")
    else:
        print("   ✓ banco_remoto_b removida")

    if "banco_remoto_a_verde = 0.0" in content:
        print("   ✗ banco_remoto_a_verde ainda existe (deveria ter sido removida)")
    else:
        print("   ✓ banco_remoto_a_verde removida")

    if "banco_remoto_a_azul = 0.0" in content:
        print("   ✗ banco_remoto_a_azul ainda existe (deveria ter sido removida)")
    else:
        print("   ✓ banco_remoto_a_azul removida")

if __name__ == "__main__":
    test_function_signatures()
    test_model_validation()
    test_file_structure()
    test_unused_variables()

    print("\n=== RESUMO ===")
    print("Se todos os itens acima estao marcados com ✓, as correcoes foram implementadas corretamente.")
    print("Se algum item esta marcado com ✗, verifique a implementacao correspondente.")
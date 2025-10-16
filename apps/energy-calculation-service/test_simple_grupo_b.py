#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Teste simples do serviço financeiro Grupo B
"""

import sys
import os

# Adicionar o diretório raiz ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Teste básico de importação
try:
    from services.financial_grupo_b_service import FinancialGrupoBService
    print("✅ Importação do serviço bem-sucedida")
    
    # Criar instância
    service = FinancialGrupoBService()
    print("✅ Instância do serviço criada com sucesso")
    
    # Testar método de autoconsumo instantâneo
    geracao = [1000, 1200, 800, 900, 1100, 950, 850, 1050, 1150, 1250, 1050, 950]
    consumo = [800, 1000, 700, 750, 900, 800, 700, 850, 950, 1000, 850, 750]
    fator_simultaneidade = 0.25
    
    resultado = service._calculate_autoconsumo_instantaneo(geracao, consumo, fator_simultaneidade)
    print(f"✅ Autoconsumo instantâneo calculado: {resultado[:3]}... (primeiros 3 meses)")
    
    # Testar método de créditos
    creditos = service._calculate_creditos_grupo_b(geracao, resultado)
    print(f"✅ Créditos calculados: {creditos[:3]}... (primeiros 3 meses)")
    
    print("\n🎉 Todos os testes básicos passaram!")
    
except ImportError as e:
    print(f"❌ Erro de importação: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Erro no teste: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
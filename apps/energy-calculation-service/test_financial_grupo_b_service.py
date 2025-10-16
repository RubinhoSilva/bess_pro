#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Teste do serviço financeiro Grupo B
"""

import asyncio
import sys
import os

# Adicionar o diretório raiz ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.financial_grupo_b_service import FinancialGrupoBService
from models.shared.financial_models import (
    GrupoBFinancialRequest,
    ProjectFinancialsModel,
    MonthlyDataModel,
    FioBParamsModel,
    RemoteConsumptionGrupoBModel,
    RemoteConsumptionGrupoAModel
)


async def test_financial_grupo_b():
    """Testa o serviço financeiro Grupo B com dados do notebook"""
    
    # Dados do notebook
    service = FinancialGrupoBService()
    
    # Criar request com dados do notebook
    request = GrupoBFinancialRequest(
        financeiros=ProjectFinancialsModel(
            capex=280000.00,
            anos=25,
            taxa_desconto=8.0,
            inflacao_energia=8.5,
            degradacao=0.5,
            salvage_pct=0.10,
            oma_first_pct=0.015,
            oma_inflacao=8.0
        ),
        geracao=MonthlyDataModel.from_list([
            12000, 13000, 15000, 16000, 15500, 14000,
            13500, 14500, 15000, 16000, 14000, 13000
        ]),
        consumo_local=MonthlyDataModel.from_list([
            6000, 6200, 6100, 6900, 6800, 6500,
            6600, 6400, 6300, 6100, 6000, 6200
        ]),
        tarifa_base=0.84,
        tipo_conexao="Trifasico",
        fator_simultaneidade=0.25,
        fio_b=FioBParamsModel(
            schedule={2025: 0.45, 2026: 0.60, 2027: 0.75, 2028: 0.90},
            base_year=2025
        ),
        remoto_b=RemoteConsumptionGrupoBModel(
            enabled=True,
            percentage=40.0,
            data=MonthlyDataModel.from_list([
                2000, 2100, 2200, 2000, 2900, 2800,
                2000, 2100, 2200, 2300, 2100, 2000
            ]),
            tarifa_total=0.84,
            fio_b_value=0.25
        ),
        remoto_a_verde=RemoteConsumptionGrupoAModel(
            enabled=True,
            percentage=60.0,
            data_off_peak=MonthlyDataModel.from_list([3000] * 12),
            data_peak=MonthlyDataModel.from_list([500] * 12),
            tarifas={"offPeak": 0.48, "peak": 2.20},
            tusd={"offPeak": 0.16121, "peak": 1.6208},
            te={"offPeak": 0.34334, "peak": 0.55158}
        ),
        remoto_a_azul=RemoteConsumptionGrupoAModel(
            enabled=False,
            percentage=20.0,
            data_off_peak=MonthlyDataModel.from_list([0] * 12),
            data_peak=MonthlyDataModel.from_list([0] * 12),
            tarifas={"offPeak": 0.80, "peak": 1.50},
            tusd={"offPeak": 0.60, "peak": 1.00},
            te={"offPeak": 0.34334, "peak": 0.55158}
        )
    )
    
    try:
        print("Iniciando teste do serviço financeiro Grupo B...")
        result = await service.calculate(request)
        
        print("\n=== RESULTADO DO CÁLCULO ===")
        print(f"Somas Iniciais: {result.somas_iniciais}")
        print(f"Comparativo Custo Abatimento: {result.comparativo_custo_abatimento}")
        print(f"Resumo Financeiro: {result.financeiro}")
        print(f"Consumo Ano 1: {result.consumo_ano1}")
        print(f"Tabela Resumo Anual: {len(result.tabela_resumo_anual)} anos")
        print(f"Tabela Fluxo Caixa: {len(result.tabela_fluxo_caixa)} anos")
        
        # Primeiro ano da tabela de fluxo de caixa
        if result.tabela_fluxo_caixa:
            print(f"\nPrimeiro ano fluxo de caixa: Ano {result.tabela_fluxo_caixa[0].ano}, "
                  f"Fluxo: R${result.tabela_fluxo_caixa[0].fluxo_nominal:,.2f}")
        
        print("\n✅ Teste concluído com sucesso!")
        return True
        
    except Exception as e:
        print(f"\n❌ Erro no teste: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = asyncio.run(test_financial_grupo_b())
    sys.exit(0 if success else 1)
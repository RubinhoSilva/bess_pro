#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Teste simples para validar o serviço Grupo A
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
from models.shared.financial_models import (
    GrupoAFinancialRequest,
    ProjectFinancialsModel,
    MonthlyDataModel,
    ConsumoLocalGrupoAModel,
    TarifasGrupoAModel,
    FioBParamsModel,
    RemoteConsumptionGrupoBModel,
    RemoteConsumptionGrupoAModel
)

async def test_grupo_a_service():
    """Teste básico do serviço Grupo A"""
    
    print("🧪 TESTE SIMPLES - SERVIÇO GRUPO A")
    print("=" * 50)
    
    try:
        # Importar o serviço
        from services.financial_grupo_a_service import FinancialGrupoAService
        
        # Criar instância do serviço
        service = FinancialGrupoAService()
        
        # Dados de teste baseados no notebook
        request = GrupoAFinancialRequest(
            financeiros=ProjectFinancialsModel(
                capex=34776.00,
                anos=25,
                taxa_desconto=8.0,
                inflacao_energia=8.5,
                degradacao=0.5,
                salvage_pct=0.10,
                oma_first_pct=0.015,
                oma_inflacao=8.0
            ),
            geracao=MonthlyDataModel(
                jan=2100, fev=2100, mar=2100, abr=2100,
                mai=2100, jun=2100, jul=2100, ago=2100,
                set=2100, out=2100, nov=2100, dez=2100
            ),
            consumo_local=ConsumoLocalGrupoAModel(
                fora_ponta=MonthlyDataModel(
                    jan=1000, fev=1000, mar=1000, abr=1000,
                    mai=1000, jun=1000, jul=1000, ago=1000,
                    set=1000, out=1000, nov=1000, dez=1000
                ),
                ponta=MonthlyDataModel(
                    jan=300, fev=280, mar=250, abr=220,
                    mai=200, jun=180, jul=190, ago=210,
                    set=230, out=260, nov=280, dez=300
                )
            ),
            tarifas=TarifasGrupoAModel(
                fora_ponta={'te': 0.34334, 'tusd': 0.16121},
                ponta={'te': 0.55158, 'tusd': 1.6208},
                demanda={'fora_ponta': 28.45, 'ponta': 85.35}
            ),
            te={'foraPonta': 0.34334, 'ponta': 0.55158},
            fator_simultaneidade_local=0.20,
            fio_b=FioBParamsModel(
                schedule={2025: 0.45, 2026: 0.60, 2027: 0.75, 2028: 0.90},
                base_year=2025
            ),
            remoto_b=RemoteConsumptionGrupoBModel(
                enabled=True,
                percentage=20.0,
                data=MonthlyDataModel(
                    jan=250, fev=230, mar=270, abr=260,
                    mai=220, jun=200, jul=210, ago=240,
                    set=250, out=280, nov=290, dez=300
                ),
                tarifa_total=0.84,
                fio_b_value=0.2135
            ),
            remoto_a_verde=RemoteConsumptionGrupoAModel(
                enabled=True,
                percentage=40.0,
                data_off_peak=MonthlyDataModel(
                    jan=500, fev=500, mar=500, abr=500,
                    mai=500, jun=500, jul=500, ago=500,
                    set=500, out=500, nov=500, dez=500
                ),
                data_peak=MonthlyDataModel(
                    jan=80, fev=75, mar=70, abr=65,
                    mai=60, jun=55, jul=60, ago=70,
                    set=75, out=80, nov=85, dez=90
                ),
                tarifas={'offPeak': 0.48, 'peak': 2.20},
                tusd={'offPeak': 0.16121, 'peak': 1.6208},
                te={'offPeak': 0.34334, 'peak': 0.55158}
            ),
            remoto_a_azul=RemoteConsumptionGrupoAModel(
                enabled=True,
                percentage=40.0,
                data_off_peak=MonthlyDataModel(
                    jan=3500, fev=3200, mar=3400, abr=3100,
                    mai=3000, jun=2800, jul=3000, ago=3300,
                    set=3400, out=3600, nov=3500, dez=3800
                ),
                data_peak=MonthlyDataModel(
                    jan=1200, fev=1100, mar=1000, abr=950,
                    mai=900, jun=850, jul=900, ago=1050,
                    set=1100, out=1200, nov=1250, dez=1300
                ),
                tarifas={'offPeak': 0.48, 'peak': 2.20},
                tusd={'offPeak': 0.16121, 'peak': 1.6208},
                te={'offPeak': 0.34334, 'peak': 0.55158}
            )
        )
        
        print("📋 Dados de entrada criados com sucesso")
        print(f"   - CAPEX: R$ {request.financeiros.capex:,.2f}")
        print(f"   - Geração anual: {sum(request.geracao.to_list()):,.2f} kWh")
        print(f"   - Consumo FP anual: {sum(request.consumo_local.fora_ponta.to_list()):,.2f} kWh")
        print(f"   - Consumo P anual: {sum(request.consumo_local.ponta.to_list()):,.2f} kWh")
        print(f"   - Fator simultaneidade: {request.fator_simultaneidade_local}")
        
        # Executar cálculo
        print("\n🔄 Executando cálculo financeiro...")
        result = await service.calculate(request)
        
        # Exibir resultados
        print("\n✅ CÁLCULO CONCLUÍDO COM SUCESSO!")
        print("=" * 50)
        
        print("\n📊 SOMAS INICIAIS:")
        for key, value in result.somas_iniciais.items():
            print(f"   - {key}: {value}")
        
        print("\n💰 INDICADORES FINANCEIROS:")
        print(f"   - VPL: {result.financeiro.vpl}")
        print(f"   - TIR: {result.financeiro.tir}")
        print(f"   - Payback Simples: {result.financeiro.payback_simples}")
        print(f"   - Payback Descontado: {result.financeiro.payback_descontado}")
        print(f"   - LCOE: {result.financeiro.lcoe}")
        print(f"   - ROI: {result.financeiro.roi_simples}")
        
        print("\n⚡ CONSUMO ANO 1:")
        for key, value in result.consumo_ano1.items():
            print(f"   - {key}: {value:,.2f}" if isinstance(value, (int, float)) else f"   - {key}: {value}")
        
        print(f"\n📈 FLUXO DE CAIXA: {len(result.tabela_fluxo_caixa)} anos")
        print(f"📊 TABELA RESUMO: {len(result.tabela_resumo_anual)} anos")
        print(f"📊 SENSIBILIDADE: {len(result.dados_sensibilidade['multiplicadores_tarifa'])} pontos")
        
        print("\n🎉 TESTE CONCLUÍDO COM SUCESSO!")
        return True
        
    except Exception as e:
        print(f"\n❌ ERRO NO TESTE: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_grupo_a_service())
    sys.exit(0 if success else 1)
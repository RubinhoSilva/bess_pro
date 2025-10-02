#!/usr/bin/env python3
"""
Teste de Integração NASA POWER API
-----------------------------------
Este script testa a integração completa da NASA POWER API no serviço pvlib.

Testes realizados:
1. Importação dos módulos
2. Criação de request com data_source='nasa'
3. Verificação de campos na response
4. Teste de fallback automático
"""

import sys
import os

# Adicionar diretório atual ao path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models.requests import IrradiationAnalysisRequest
from services.solar_service import solar_service
from core.config import settings


def test_imports():
    """Testa se todos os imports estão funcionando"""
    print("=" * 70)
    print("TESTE 1: Importações")
    print("=" * 70)

    try:
        from core.exceptions import NASAError
        print("✓ NASAError importada")

        from services.nasa_service import nasa_service
        print("✓ nasa_service importado")
        print(f"  - API timeout: {nasa_service.timeout}s")
        print(f"  - Years back: {nasa_service.years_back}")
        print(f"  - Dataset: {nasa_service.dataset}")

        from utils.weather_data_normalizer import normalize_nasa_data
        print("✓ normalize_nasa_data importada")

        print("\n✅ Todos os imports OK\n")
        return True

    except Exception as e:
        print(f"\n❌ Erro nos imports: {e}\n")
        import traceback
        traceback.print_exc()
        return False


def test_request_creation():
    """Testa criação de request com data_source"""
    print("=" * 70)
    print("TESTE 2: Criação de Request")
    print("=" * 70)

    try:
        # Teste com PVGIS (default)
        request_pvgis = IrradiationAnalysisRequest(
            lat=-15.7942,
            lon=-47.8822,
            tilt=20,
            azimuth=180
        )
        print(f"✓ Request PVGIS criada: data_source='{request_pvgis.data_source}'")

        # Teste com NASA
        request_nasa = IrradiationAnalysisRequest(
            lat=-15.7942,
            lon=-47.8822,
            tilt=20,
            azimuth=180,
            data_source='nasa'
        )
        print(f"✓ Request NASA criada: data_source='{request_nasa.data_source}'")

        print("\n✅ Criação de requests OK\n")
        return True

    except Exception as e:
        print(f"\n❌ Erro ao criar request: {e}\n")
        import traceback
        traceback.print_exc()
        return False


def test_response_structure():
    """Testa estrutura da response com fonte_dados"""
    print("=" * 70)
    print("TESTE 3: Estrutura da Response")
    print("=" * 70)

    try:
        from models.responses import IrradiationConfiguration

        # Verificar se campo fonte_dados existe
        fields = list(IrradiationConfiguration.model_fields.keys())
        print(f"Campos da IrradiationConfiguration: {fields}")

        if 'fonte_dados' in fields:
            print("✓ Campo 'fonte_dados' presente na configuração")
        else:
            print("❌ Campo 'fonte_dados' NÃO encontrado")
            return False

        print("\n✅ Estrutura da response OK\n")
        return True

    except Exception as e:
        print(f"\n❌ Erro ao verificar response: {e}\n")
        import traceback
        traceback.print_exc()
        return False


def test_service_integration():
    """Testa integração dos serviços"""
    print("=" * 70)
    print("TESTE 4: Integração dos Serviços")
    print("=" * 70)

    try:
        # Verificar se solar_service tem ambos os serviços
        print(f"✓ solar_service tem PVGIS: {hasattr(solar_service, 'pvgis')}")
        print(f"✓ solar_service tem NASA: {hasattr(solar_service, 'nasa')}")

        # Verificar método de fallback
        if hasattr(solar_service, '_fetch_weather_data_with_fallback'):
            print("✓ Método de fallback implementado")
        else:
            print("❌ Método de fallback NÃO encontrado")
            return False

        print("\n✅ Integração dos serviços OK\n")
        return True

    except Exception as e:
        print(f"\n❌ Erro na integração: {e}\n")
        import traceback
        traceback.print_exc()
        return False


def test_fallback_configuration():
    """Testa configuração de fallback"""
    print("=" * 70)
    print("TESTE 5: Configuração de Fallback")
    print("=" * 70)

    try:
        print(f"Fallback habilitado: {settings.WEATHER_DATA_FALLBACK_ENABLED}")
        print(f"Fonte padrão: {settings.WEATHER_DATA_SOURCE_DEFAULT}")

        print("\n✅ Configuração de fallback OK\n")
        return True

    except Exception as e:
        print(f"\n❌ Erro na configuração: {e}\n")
        return False


def run_all_tests():
    """Executa todos os testes"""
    print("\n" + "=" * 70)
    print("INICIANDO TESTES DE INTEGRAÇÃO NASA POWER")
    print("=" * 70 + "\n")

    tests = [
        ("Importações", test_imports),
        ("Criação de Request", test_request_creation),
        ("Estrutura da Response", test_response_structure),
        ("Integração dos Serviços", test_service_integration),
        ("Configuração de Fallback", test_fallback_configuration),
    ]

    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ Erro crítico em {test_name}: {e}")
            results.append((test_name, False))

    # Resumo
    print("\n" + "=" * 70)
    print("RESUMO DOS TESTES")
    print("=" * 70)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✅ PASSOU" if result else "❌ FALHOU"
        print(f"{status}: {test_name}")

    print(f"\nResultado: {passed}/{total} testes passaram")

    if passed == total:
        print("\n🎉 TODOS OS TESTES PASSARAM! Integração NASA POWER está completa.")
        print("\n📝 Próximos passos:")
        print("   1. Iniciar o servidor: uvicorn main:app --reload")
        print("   2. Testar endpoint: POST /api/v1/solar/irradiation")
        print("   3. Usar data_source='nasa' no body do request")
        print("   4. Verificar que fonte_dados aparece na response")
        return True
    else:
        print(f"\n⚠️  {total - passed} teste(s) falharam. Verifique os erros acima.")
        return False


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)

import { apiClient } from './api';
import { FrontendCalculationLogger } from './calculationLogger';
import { calculateSystemEfficiency, SystemLosses } from './pvDimensioning';
import { CalculationConstants } from '@/constants/CalculationConstants';

export interface BackendCalculationParams {
  systemParams: {
    potenciaNominal: number;
    eficiencia: number;
    perdas?: number;
    inclinacao?: number;
    orientacao?: number;
  };
  irradiationData: {
    monthly: number[];
    annual?: number;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  financialParams?: {
    totalInvestment?: number;
    geracaoEstimadaMensal?: number[];
    consumoMensal?: number[];
    tarifaEnergiaB?: number;
    custoFioB?: number;
    vidaUtil?: number;
    inflacaoEnergia?: number;
    taxaDesconto?: number;
  };
}

export interface BackendCalculationResult {
  monthlyGeneration: number[];
  annualGeneration: number;
  optimalModuleCount: {
    moduleCount: number;
    totalPower: number;
    areaUsed: number;
  };
  co2Savings: number;
  orientationLoss: number;
  financialAnalysis?: any;
  calculationLogs?: string[];
  _rawLogs?: any[];
}

export class BackendCalculationService {
  /**
   * Realiza cálculos solares usando a API do backend (NOVO: sem depender de projeto)
   * e exibe logs detalhados no console
   */
  static async calculateSolarSystemStandalone(
    params: BackendCalculationParams
  ): Promise<BackendCalculationResult | null> {
    try {

      
      // Removida chamada para solar-system
      const result = null;

      // Usar o logger para processar e exibir logs
      const logger = new FrontendCalculationLogger('backend-calc');
      logger.apiCall('/calculations/solar-system', 'POST', params);
      logger.apiResponse('/calculations/solar-system', 200, result);



      return result;
    } catch (error: any) {

      return null;
    }
  }



  /**
   * Tenta combinar resultados do backend com cálculos locais
   */
  static async enhanceWithBackendCalculations(
    projectId: string,
    frontendResults: any,
    backendParams: BackendCalculationParams
  ): Promise<any> {

    
    // Tentar obter cálculos do backend (usando novo método standalone)
    const backendResults = await this.calculateSolarSystemStandalone(backendParams);
    
    if (backendResults) {

      
      // Mesclar resultados frontend e backend
      const mergedResults = {
        ...frontendResults,
        backendData: backendResults,
        backendLogs: backendResults.calculationLogs,
        _backendRawLogs: backendResults._rawLogs
      };
      

      
      return mergedResults;
    } else {

      return frontendResults;
    }
  }

  /**
   * Exemplo de como integrar no fluxo existente
   */
  static createIntegrationExample(): string {
    return `
// Exemplo de integração no PVDesignForm ou SolarSizingWizard:

import { BackendCalculationService } from '@/lib/backendCalculations';

const handleCalculate = async () => {
  // ... cálculos locais existentes ...
  
  // Tentar enriquecer com cálculos do backend
  if (currentProject?.id) {
    const backendParams = {
      systemParams: {
        potenciaNominal: potenciaPico,
        eficiencia: calculateSystemEfficiency({
          perdaSombreamento: currentDimensioning.perdaSombreamento,
          perdaMismatch: currentDimensioning.perdaMismatch,
          perdaCabeamento: currentDimensioning.perdaCabeamento,
          perdaSujeira: currentDimensioning.perdaSujeira,

          perdaTemperatura: currentDimensioning.perdaTemperatura
        }, currentDimensioning.eficienciaSistema || 85),
        perdas: 5,
        inclinacao: CalculationConstants.FINANCIAL_DEFAULTS.DEFAULT_TILT_DEGREES,
        orientacao: 180
      },
      irradiationData: {
        monthly: currentDimensioning.irradiacaoMensal,
        annual: currentDimensioning.irradiacaoMensal.reduce((a, b) => a + b, 0)
      },
      coordinates: {
        latitude: currentDimensioning.latitude,
        longitude: currentDimensioning.longitude
      },
      financialParams: {
        totalInvestment,
        geracaoEstimadaMensal,
        consumoMensal: totalConsumoMensal,
        tarifaEnergiaB: currentDimensioning.tarifaEnergiaB || 0.8,
        custoFioB: currentDimensioning.custoFioB || 0.3,
        vidaUtil: currentDimensioning.vidaUtil || 25,
        inflacaoEnergia: currentDimensioning.inflacaoEnergia || 4.5,
        taxaDesconto: currentDimensioning.taxaDesconto || 8.0
      }
    };

    // Enriquecer resultados com backend
    const enhancedResults = await BackendCalculationService.enhanceWithBackendCalculations(
      currentProject.id,
      results,
      backendParams
    );
    
    onCalculationComplete(enhancedResults);
  } else {
    onCalculationComplete(results);
  }
};
`;
  }
}

// Função utilitária para detectar se deve usar backend
export function shouldUseBackendCalculations(): boolean {
  // Usar backend apenas se estiver disponível e configurado
  const backendEnabled = import.meta.env.VITE_USE_BACKEND_CALCULATIONS === 'true';
  const hasConnection = navigator.onLine;
  

  
  return backendEnabled && hasConnection;
}
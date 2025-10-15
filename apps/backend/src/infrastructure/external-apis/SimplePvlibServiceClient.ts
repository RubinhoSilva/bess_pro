/**
 * Cliente simplificado para comunicação com o serviço Python de cálculos financeiros (pvlib-service)
 * Usando tipos do pacote shared
 */

import axios, { AxiosInstance } from 'axios';
import {
  AdvancedFinancialResults,
  GrupoConfig,
  FinancialConfiguration,
  isGrupoBConfig,
  isGrupoAConfig
} from '@bess-pro/shared';

// Usar tipos do pacote shared
export type SimpleFinancialInput = FinancialConfiguration;
export type SimpleFinancialResult = AdvancedFinancialResults;

export class SimplePvlibServiceClient {
  private client: AxiosInstance;
  private readonly baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || process.env.PVLIB_SERVICE_URL || 'http://pvlib-service:8000';

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[SimplePvlibService] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[SimplePvlibService] Request error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        console.log(`[SimplePvlibService] ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('[SimplePvlibService] Response error:', error.message);
        return Promise.reject(error);
      }
    );
  }

  async calculateFinancials(input: SimpleFinancialInput): Promise<SimpleFinancialResult> {
    try {
      // Log baseado no tipo de configuração
      if (isGrupoBConfig(input)) {
        console.log('[SimplePvlibService] Enviando requisição para Python (Grupo B):', {
          investimento: input.financeiros.capex,
          geracao_anual: (Object.values(input.geracao) as number[]).reduce((a: number, b: number) => a + b, 0),
          consumo_anual: (Object.values(input.consumoLocal) as number[]).reduce((a: number, b: number) => a + b, 0),
        });
      } else if (isGrupoAConfig(input)) {
        console.log('[SimplePvlibService] Enviando requisição para Python (Grupo A):', {
          investimento: input.financeiros.capex,
          geracao_anual: (Object.values(input.geracao) as number[]).reduce((a: number, b: number) => a + b, 0),
          consumo_anual: (Object.values(input.consumoLocal.foraPonta) as number[]).reduce((a: number, b: number) => a + b, 0) + 
                        (Object.values(input.consumoLocal.ponta) as number[]).reduce((a: number, b: number) => a + b, 0),
        });
      } else {
        // Formato legado FinancialInput
        console.log('[SimplePvlibService] Enviando requisição para Python (Legado):', {
        // Salvar payload conforme o tipo
        payload: input,
        });
      }

      // 💾 SALVAR PAYLOAD EM ARQUIVO JSON para debug
      try {
        const fs = require('fs');
        const path = require('path');

        // Criar pasta para payloads se não existir
        const payloadsDir = path.join(process.cwd(), 'payloads');
        if (!fs.existsSync(payloadsDir)) {
          fs.mkdirSync(payloadsDir, { recursive: true });
        }

        // Nome do arquivo com timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `payload-financial-calculate-${timestamp}.json`;
        const filepath = path.join(payloadsDir, filename);

        // Salvar payload
        fs.writeFileSync(filepath, JSON.stringify(input, null, 2), 'utf8');
        console.log(`💾 [SimplePvlibService] Payload salvo em: ${filepath}`);
      } catch (error) {
        console.error('❌ [SimplePvlibService] Erro ao salvar payload:', error);
      }

      const response = await this.client.post('/api/v1/financial/calculate-advanced', input);
      
      if (response.data.success) {
        console.log('[SimplePvlibService] Cálculo concluído com sucesso:', {
          vpl: response.data.data.vpl,
          tir: response.data.data.tir,
          payback: response.data.data.payback_simples,
        });
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Erro no cálculo financeiro');
      }
    } catch (error: any) {
      console.error('[SimplePvlibService] Erro no cálculo:', error.message);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/api/v1/financial/calculate-advanced', {
        data: {
          investimento_inicial: 1000,
          geracao_mensal: Array(12).fill(100),
          consumo_mensal: Array(12).fill(80),
          tarifa_energia: 0.5,
          custo_fio_b: 0.05,
          vida_util: 25,
          taxa_desconto: 8,
          inflacao_energia: 5
        }
      });
      return response.status === 200;
    } catch (error) {
      console.error('[SimplePvlibService] Health check failed:', error);
      return false;
    }
  }
}
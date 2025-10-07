/**
 * Cliente simplificado para comunicação com o serviço Python de cálculos financeiros (pvlib-service)
 * Versão temporária sem dependência de @bess-pro/shared para testes
 */

import axios, { AxiosInstance } from 'axios';

// Interfaces temporárias para teste
export interface SimpleFinancialInput {
  investimento_inicial: number;
  geracao_mensal: number[];
  consumo_mensal: number[];
  tarifa_energia: number;
  custo_fio_b: number;
  vida_util: number;
  taxa_desconto: number;
  inflacao_energia: number;
}

export interface SimpleFinancialResult {
  vpl: number;
  tir: number;
  payback_simples: number;
  payback_descontado: number;
  economia_total_25_anos: number;
  economia_anual_media: number;
  cash_flow: Array<{
    ano: number;
    geracao_anual: number;
    economia_energia: number;
    fluxo_liquido: number;
    fluxo_acumulado: number;
    valor_presente: number;
  }>;
}

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
      console.log('[SimplePvlibService] Enviando requisição para Python:', {
        investimento: input.investimento_inicial,
        geracao_anual: input.geracao_mensal.reduce((a: number, b: number) => a + b, 0),
        consumo_anual: input.consumo_mensal.reduce((a: number, b: number) => a + b, 0),
      });

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
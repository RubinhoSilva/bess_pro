/**
 * Cliente simplificado para comunicação com o serviço Python de cálculos financeiros (pvlib-service)
 * Usando tipos do pacote shared
 */

import axios, { AxiosInstance } from 'axios';
import {
  AdvancedFinancialResults,
  GrupoConfig,
  FinancialConfiguration,
  GrupoBConfig,
  GrupoAConfig,
  isGrupoBConfig,
  isGrupoAConfig,
  objectCamelToSnake
} from '@bess-pro/shared';
import { GrupoBFinancialMapper } from '../../application/mappers/GrupoBFinancialMapper';
import { GrupoAFinancialMapper } from '../../application/mappers/GrupoAFinancialMapper';
import { ResultadosCodigoB, ResultadosCodigoA } from '@bess-pro/shared';

// Usar tipos do pacote shared
export type SimpleFinancialInput = FinancialConfiguration;
export type SimpleFinancialResult = AdvancedFinancialResults;

export class SimplePvlibServiceClient {
  private client: AxiosInstance;
  private readonly baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || process.env.ENERGY_SERVICE_URL || process.env.PVLIB_SERVICE_URL || 'http://localhost:8110';

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

  async calculateGrupoBFinancials(input: GrupoBConfig): Promise<ResultadosCodigoB> {
    try {
      // Validação de entrada para evitar erro "Cannot convert undefined or null to object"
      if (!input) {
        throw new Error('Dados de entrada são obrigatórios para cálculo do Grupo B');
      }

      if (!input.geracao || typeof input.geracao !== 'object') {
        throw new Error('Dados de geração mensal são obrigatórios e devem ser um objeto');
      }

      if (!input.consumoLocal || typeof input.consumoLocal !== 'object') {
        throw new Error('Dados de consumo mensal são obrigatórios e devem ser um objeto');
      }

      // Log da chamada com dados resumidos (com validação adicional)
      const geracaoAnual = Object.values(input.geracao || {}).reduce((a: number, b: number) => a + b, 0);
      const consumoAnual = Object.values(input.consumoLocal || {}).reduce((a: number, b: number) => a + b, 0);
      
      console.log('[SimplePvlibService DEBUG] Payload original Grupo B:', JSON.stringify(input, null, 2));
      
      console.log('[SimplePvlibService] Iniciando cálculo financeiro Grupo B:', {
        investimento: input.financeiros.capex,
        geracao_anual: geracaoAnual,
        consumo_anual: consumoAnual,
        tarifa_base: input.tarifaBase,
        tipo_conexao: input.tipoConexao
      });

      // Converter input para snake_case
      const snakeCaseInput = objectCamelToSnake(input);
      
      console.log('[SimplePvlibService DEBUG] Payload convertido para snake_case Grupo B:', JSON.stringify(snakeCaseInput, null, 2));

      // Salvar payload em disco para debug
      try {
        const fs = require('fs');
        const path = require('path');

        const payloadsDir = path.join(process.cwd(), 'payloads');
        if (!fs.existsSync(payloadsDir)) {
          fs.mkdirSync(payloadsDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `payload-grupo-b-financial-${timestamp}.json`;
        const filepath = path.join(payloadsDir, filename);

        fs.writeFileSync(filepath, JSON.stringify(snakeCaseInput, null, 2), 'utf8');
        console.log(`💾 [SimplePvlibService] Payload Grupo B salvo em: ${filepath}`);
      } catch (error) {
        console.error('❌ [SimplePvlibService] Erro ao salvar payload Grupo B:', error);
      }

      // Chamar endpoint específico do Grupo B com timeout de 60 segundos
      const response = await this.client.post('/api/v1/financial/calculate-grupo-b', snakeCaseInput, {
        timeout: 60000 // 60 segundos
      });

      // Extrair dados reais do wrapper SuccessResponse
      const actualData = response.data.data || response.data;

      // Validar resposta usando o mapper
      if (!GrupoBFinancialMapper.validatePythonResponse(actualData)) {
        throw new Error('Resposta do serviço Python não tem estrutura válida para Grupo B');
      }

      // Converter resposta usando o mapper
      const resultado = GrupoBFinancialMapper.fromPythonResponse(actualData);

      // Log de sucesso
      console.log('[SimplePvlibService] Cálculo Grupo B concluído com sucesso:', {
        vpl: resultado.financeiro.vpl,
        tir: resultado.financeiro.tir,
        payback_simples: resultado.financeiro.paybackSimples,
        economia_total: resultado.financeiro.economiaTotalNominal
      });

      return resultado;

    } catch (error: any) {
      // Tratamento específico de erros
      if (error.code === 'ECONNREFUSED') {
        console.error('❌ [SimplePvlibService] Serviço Python não está disponível (ECONNREFUSED)');
        throw new Error('Serviço de cálculo financeiro está temporariamente indisponível. Tente novamente em alguns minutos.');
      }

      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || error.response.data?.error || 'Erro desconhecido';

        switch (status) {
          case 422:
            console.error('❌ [SimplePvlibService] Erro de validação (422) - Grupo B:', message);
            throw new Error(`Dados inválidos para cálculo do Grupo B: ${message}`);
          
          case 500:
            console.error('❌ [SimplePvlibService] Erro interno do servidor (500) - Grupo B:', message);
            throw new Error(`Erro interno no serviço de cálculo do Grupo B: ${message}`);
          
          case 404:
            console.error('❌ [SimplePvlibService] Endpoint não encontrado (404) - Grupo B');
            throw new Error('Endpoint de cálculo do Grupo B não está disponível no serviço.');
          
          default:
            console.error(`❌ [SimplePvlibService] Erro HTTP ${status} - Grupo B:`, message);
            throw new Error(`Erro no serviço de cálculo do Grupo B (${status}): ${message}`);
        }
      }

      if (error.code === 'ECONNABORTED') {
        console.error('❌ [SimplePvlibService] Timeout excedido (60s) - Grupo B');
        throw new Error('O cálculo financeiro do Grupo B demorou mais que o esperado. Tente novamente com parâmetros mais simples.');
      }

      // Erro genérico
      console.error('❌ [SimplePvlibService] Erro no cálculo Grupo B:', error.message);
      throw new Error(`Falha no cálculo financeiro do Grupo B: ${error.message}`);
    }
  }

  async calculateGrupoAFinancials(input: GrupoAConfig): Promise<ResultadosCodigoA> {
    try {
      // Validação de entrada para evitar erro "Cannot convert undefined or null to object"
      if (!input) {
        throw new Error('Dados de entrada são obrigatórios para cálculo do Grupo A');
      }

      if (!input.geracao || typeof input.geracao !== 'object') {
        throw new Error('Dados de geração mensal são obrigatórios e devem ser um objeto');
      }

      if (!input.consumoLocal || typeof input.consumoLocal !== 'object') {
        throw new Error('Dados de consumo mensal são obrigatórios e devem ser um objeto');
      }

      if (!input.consumoLocal.foraPonta || !input.consumoLocal.ponta) {
        throw new Error('Dados de consumo devem conter "foraPonta" e "ponta"');
      }

      // Log da chamada com dados resumidos (com validação adicional)
      const geracaoAnual = Object.values(input.geracao || {}).reduce((a: number, b: number) => a + b, 0);
      const consumoForaPonta = Object.values(input.consumoLocal?.foraPonta || {}).reduce((a: number, b: number) => a + b, 0);
      const consumoPonta = Object.values(input.consumoLocal?.ponta || {}).reduce((a: number, b: number) => a + b, 0);
      const consumoTotal = consumoForaPonta + consumoPonta;
      
      console.log('[SimplePvlibService DEBUG] Payload original Grupo A:', JSON.stringify(input, null, 2));
      
      console.log('[SimplePvlibService] Iniciando cálculo financeiro Grupo A:', {
        investimento: input.financeiros.capex,
        geracao_anual: geracaoAnual,
        consumo_fora_ponta: consumoForaPonta,
        consumo_ponta: consumoPonta,
        consumo_total: consumoTotal,
        tarifa_ponta: input.tarifas.ponta,
        tarifa_fora_ponta: input.tarifas.foraPonta
      });

      // Converter input para snake_case (trata ponta/fora-ponta corretamente)
      const snakeCaseInput = objectCamelToSnake(input);
      
      console.log('[SimplePvlibService DEBUG] Payload convertido para snake_case Grupo A:', JSON.stringify(snakeCaseInput, null, 2));

      // Salvar payload em disco para debug
      try {
        const fs = require('fs');
        const path = require('path');

        const payloadsDir = path.join(process.cwd(), 'payloads');
        if (!fs.existsSync(payloadsDir)) {
          fs.mkdirSync(payloadsDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `payload-grupo-a-financial-${timestamp}.json`;
        const filepath = path.join(payloadsDir, filename);

        fs.writeFileSync(filepath, JSON.stringify(snakeCaseInput, null, 2), 'utf8');
        console.log(`💾 [SimplePvlibService] Payload Grupo A salvo em: ${filepath}`);
      } catch (error) {
        console.error('❌ [SimplePvlibService] Erro ao salvar payload Grupo A:', error);
      }

      // Chamar endpoint específico do Grupo A com timeout de 60 segundos
      const response = await this.client.post('/api/v1/financial/calculate-grupo-a', snakeCaseInput, {
        timeout: 60000 // 60 segundos
      });

      // Validar resposta usando o mapper
      if (!GrupoAFinancialMapper.validatePythonResponse(response.data)) {
        throw new Error('Resposta do serviço Python não tem estrutura válida para Grupo A');
      }

      // Converter resposta usando o mapper
      const resultado = GrupoAFinancialMapper.fromPythonResponse(response.data);

      // Log de sucesso
      console.log('[SimplePvlibService] Cálculo Grupo A concluído com sucesso:', {
        vpl: resultado.financeiro.vpl,
        tir: resultado.financeiro.tir,
        payback_simples: resultado.financeiro.paybackSimples,
        economia_total: resultado.financeiro.economiaTotalNominal,
        sensibilidade_pontos: resultado.dadosSensibilidade.multiplicadoresTarifa.length
      });

      return resultado;

    } catch (error: any) {
      // Tratamento específico de erros
      if (error.code === 'ECONNREFUSED') {
        console.error('❌ [SimplePvlibService] Serviço Python não está disponível (ECONNREFUSED)');
        throw new Error('Serviço de cálculo financeiro está temporariamente indisponível. Tente novamente em alguns minutos.');
      }

      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || error.response.data?.error || 'Erro desconhecido';

        switch (status) {
          case 422:
            console.error('❌ [SimplePvlibService] Erro de validação (422) - Grupo A:', message);
            throw new Error(`Dados inválidos para cálculo do Grupo A: ${message}`);
          
          case 500:
            console.error('❌ [SimplePvlibService] Erro interno do servidor (500) - Grupo A:', message);
            throw new Error(`Erro interno no serviço de cálculo do Grupo A: ${message}`);
          
          case 404:
            console.error('❌ [SimplePvlibService] Endpoint não encontrado (404) - Grupo A');
            throw new Error('Endpoint de cálculo do Grupo A não está disponível no serviço.');
          
          default:
            console.error(`❌ [SimplePvlibService] Erro HTTP ${status} - Grupo A:`, message);
            throw new Error(`Erro no serviço de cálculo do Grupo A (${status}): ${message}`);
        }
      }

      if (error.code === 'ECONNABORTED') {
        console.error('❌ [SimplePvlibService] Timeout excedido (60s) - Grupo A');
        throw new Error('O cálculo financeiro do Grupo A demorou mais que o esperado. Tente novamente com parâmetros mais simples.');
      }

      // Erro genérico
      console.error('❌ [SimplePvlibService] Erro no cálculo Grupo A:', error.message);
      throw new Error(`Falha no cálculo financeiro do Grupo A: ${error.message}`);
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
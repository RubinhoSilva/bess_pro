/**
 * @fileoverview Exports unificados dos tipos do pacote shared
 * @description Ponto central de exportação para todos os tipos compartilhados
 * @author BessPro Team
 * @version 1.0.0
 * @since 2025-10-15
 * 
 * ESTE ARQUIVO CONTÉM:
 * - Export de tipos existentes (manter compatibilidade)
 * - Export dos novos tipos (CommonTypes, GrupoBConfig, GrupoAConfig)
 * - Export de configurações e utilitários
 * - Ponto único de importação para toda a aplicação
 */

// =================================================================================
// EXPORTS EXISTENTES (COMPATIBILIDADE)
// =================================================================================

// Tipos financeiros existentes - MANTER PARA COMPATIBILIDADE
// Import com namespace para evitar conflitos de nomes
import * as FinancialTypes from './financial';
export { FinancialTypes };

// Exportar tipos individuais para facilitar importação
export type { 
  FinancialInput,
  CashFlowDetails,
  FinancialIndicators,
  SensitivityAnalysis,
  ScenarioAnalysis,
  AdvancedFinancialResults,
  FinancialCalculationResponse
} from './financial';

// Tipos de cálculo existentes
export * from './calculation/calculation.types';

// =================================================================================
// EXPORTS NOVOS (TIPOS AVANÇADOS)
// =================================================================================

// CommonTypes namespace - tipos base reutilizáveis
export * from './common-types';

// Configurações específicas dos grupos tarifários
export * from './grupo-configs';

// Tipos especializados para EnergyBill
export * from './energy-bill-types';

// Tipos de resultados financeiros especializados
export * from './financial-results';

// Exportar tipo união explicitamente
export type { GrupoConfig } from './grupo-configs';

// =================================================================================
// EXPORTS DE CONFIGURAÇÕES
// =================================================================================

// Configurações financeiras padrão
export * from '../config/financial';

// =================================================================================
// EXEMPLOS DE USO
// =================================================================================

/**
 * Exemplo de importação no frontend:
 * ```typescript
 * import { 
 *   CommonTypes, 
 *   GrupoBConfig, 
 *   GrupoAConfig,
 *   GrupoConfig,
 *   isGrupoBConfig,
 *   isGrupoAConfig 
 * } from '@bess-pro/shared';
 * 
 * // Criar configuração Grupo B
 * const configB: GrupoBConfig = {
 *   financeiros: {
 *     capex: 50000,
 *     anos: 25,
 *     taxaDesconto: 0.08,
 *     inflacaoEnergia: 0.045,
 *     degradacao: 0.005,
 *     salvagePct: 0.10,
 *     omaFirstPct: 0.015,
 *     omaInflacao: 0.04
 *   },
 *   geracao: CommonTypes.arrayToMonthlyData([450, 480, 520, 490, 510, 530, 540, 520, 480, 450, 420, 400]),
 *   consumoLocal: CommonTypes.arrayToMonthlyData([350, 370, 390, 410, 430, 450, 440, 420, 400, 380, 360, 340]),
 *   tarifaBase: 0.85,
 *   tipoConexao: 'Trifasico',
 *   fatorSimultaneidade: 0.8,
 *   fioB: {
 *     schedule: { 2025: 0.45, 2026: 0.60, 2027: 0.75, 2028: 0.90, 2029: 0.90 },
 *     baseYear: 2025
 *   },
 *   remotoB: {
 *     enabled: true,
 *     percentage: 0.40,
 *     data: CommonTypes.arrayToMonthlyData([200, 210, 220, 230, 240, 250, 245, 235, 225, 215, 205, 195]),
 *     tarifaTotal: 0.90,
 *     fioBValue: 0.30
 *   },
 *   remotoAVerde: {
 *     enabled: false,
 *     percentage: 0,
 *     dataOffPeak: CommonTypes.arrayToMonthlyData([]),
 *     dataPeak: CommonTypes.arrayToMonthlyData([]),
 *     tarifas: { offPeak: 0, peak: 0 },
 *     tusd: { offPeak: 0, peak: 0 },
 *     te: { offPeak: 0, peak: 0 }
 *   },
 *   remotoAAzul: {
 *     enabled: false,
 *     percentage: 0,
 *     dataOffPeak: CommonTypes.arrayToMonthlyData([]),
 *     dataPeak: CommonTypes.arrayToMonthlyData([]),
 *     tarifas: { offPeak: 0, peak: 0 },
 *     tusd: { offPeak: 0, peak: 0 },
 *     te: { offPeak: 0, peak: 0 }
 *   }
 * };
 * 
 * // Função genérica que aceita qualquer configuração
 * function processarConfiguracao(config: GrupoConfig) {
 *   if (isGrupoBConfig(config)) {
 *     console.log('Configuração Grupo B - Tarifa:', config.tarifaBase);
 *     console.log('Tipo de conexão:', config.tipoConexao);
 *   } else if (isGrupoAConfig(config)) {
 *     console.log('Configuração Grupo A - Tarifa ponta:', config.tarifas.ponta);

 *   }
 *   
 *   // Calcular totais anuais
 *   const geracaoAnual = CommonTypes.calculateAnnualTotal(config.geracao);
 *   console.log('Geração anual:', geracaoAnual, 'kWh');
 * }
 * 
 * // Usar a função
 * processarConfiguracao(configB);
 * ```
 */

/**
 * Exemplo de importação no backend:
 * ```typescript
 * import { 
 *   FinancialInput, // Tipo existente (compatibilidade)
 *   GrupoBConfig, 
 *   GrupoAConfig,
 *   validateGrupoBConfig,
 *   validateGrupoAConfig 
 * } from '@bess-pro/shared';
 * 
 * // API que aceita ambos os formatos
 * app.post('/api/calculate', (req, res) => {
 *   const { config } = req.body;
 *   
 *   // Validar conforme o tipo
 *   if (config.tarifaBase) {
 *     // É GrupoBConfig
 *     const validation = validateGrupoBConfig(config);
 *     if (!validation.isValid) {
 *       return res.status(400).json({ errors: validation.errors });
 *     }
 *   } else if (config.tarifas?.ponta) {
 *     // É GrupoAConfig
 *     const validation = validateGrupoAConfig(config);
 *     if (!validation.isValid) {
 *       return res.status(400).json({ errors: validation.errors });
 *     }
 *   } else {
 *     // É FinancialInput (formato antigo)
 *     // Manter compatibilidade com código existente
 *   }
 *   
 *   // Continuar com processamento...
 * });
 * ```
 */

/**
 * Migração gradual - estratégia recomendada:
 * 
 * 1. FASE 1: Adicionar novos tipos sem remover os antigos
 *    - Manter FinancialInput existente
 *    - Adicionar CommonTypes, GrupoBConfig, GrupoAConfig
 *    - Usar type guards para identificar o formato
 * 
 * 2. FASE 2: Criar funções que aceitam ambos os formatos
 *    - Usar tipo união: GrupoConfig | FinancialInput
 *    - Implementar lógica condicional baseada no tipo
 * 
 * 3. FASE 3: Migrar gradualmente para novos tipos
 *    - Novos recursos usam apenas novos tipos
 *    - Código existente continua funcionando
 *    - Conversão apenas quando necessário
 * 
 * 4. FASE 4: Depreciação antiga (opcional, futuro)
 *    - Marcar FinancialInput como @deprecated
 *    - Manter por período de transição
 *    - Remover apenas quando não houver mais uso
 */
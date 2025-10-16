import { Router } from 'express';
import { CalculationController } from '../controllers/CalculationController';
import { FinancialCalculationController } from '../controllers/FinancialCalculationController';
import { SolarAnalysisController } from '../controllers/SolarAnalysisController';

import { CalculateStandaloneSolarSystemUseCase } from '../../application/use-cases/calculation/CalculateStandaloneSolarSystemUseCase';
import { AnalyzeFinancialUseCase } from '../../application/use-cases/financial/AnalyzeFinancialUseCase';
import { Container } from '../../infrastructure/di/Container';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { ValidationMiddleware } from '../middleware/ValidationMiddleware';
import { ServiceTokens } from '../../infrastructure/di/ServiceTokens';

export class CalculationRoutes {
  static create(container: Container): Router {
    const router = Router();
    
    // Resolve dependencies
    const calculateStandaloneSolarSystemUseCase = container.resolve<CalculateStandaloneSolarSystemUseCase>(
      ServiceTokens.CALCULATE_STANDALONE_SOLAR_SYSTEM_USE_CASE
    );
    const analyzeFinancialUseCase = container.resolve<AnalyzeFinancialUseCase>(
      ServiceTokens.ANALYZE_FINANCIAL_USE_CASE
    );
    const calculationController = new CalculationController(
      calculateStandaloneSolarSystemUseCase,
      analyzeFinancialUseCase
    );
    const financialCalculationController = container.resolve<FinancialCalculationController>(
      ServiceTokens.FinancialCalculationController
    );
    const solarAnalysisController = container.resolve<SolarAnalysisController>('SolarAnalysisController');

    const authMiddleware = new AuthMiddleware(container);

    // All routes require authentication
    router.use(authMiddleware.authenticate());

    // ===== Cálculos Standalone (sem projeto) =====

    /**
     * POST /calculations/solar
     * Realiza cálculo solar standalone (não salva em projeto)
     * Body: SolarCalculationRequest
     * Response: SolarCalculationResult
     */
    router.post('/solar',
      ValidationMiddleware.handleValidationErrors(),
      calculationController.calculateSolarSystemStandalone.bind(calculationController)
    );

    /**
     * POST /calculations/solar/advanced
     * Realiza cálculo solar avançado com PVLIB + ModelChain
     * Body: AdvancedSolarCalculationRequest
     * Response: AdvancedSolarCalculationResult
     */
    router.post('/solar/advanced',
      ValidationMiddleware.handleValidationErrors(),
      solarAnalysisController.calculateCompleteSolarSystem.bind(solarAnalysisController)
    );

    /**
     * POST /calculations/solar/module-count
     * Calcula quantidade de módulos por MPPT
     * Body: ModuleCountRequest
     * Response: ModuleCountResult
     */
    router.post('/solar/module-count',
      ValidationMiddleware.handleValidationErrors(),
      solarAnalysisController.calculateMPPTLimits.bind(solarAnalysisController)
    );



    /**
     * POST /calculations/financial
 * Realiza análise financeira standalone
     * Body: FinancialAnalysisRequest
     * Response: FinancialAnalysisResult
     */
    router.post('/financial',
      ValidationMiddleware.handleValidationErrors(),
      calculationController.analyzeFinancial.bind(calculationController)
    );

    /**
     * POST /calculations/multi-system
     * Compara múltiplos sistemas de energia
     * Body: MultiSystemRequest
     * Response: MultiSystemResult
     */
    router.post('/multi-system',
      ValidationMiddleware.handleValidationErrors(),
      solarAnalysisController.calculateAdvancedFinancialAnalysis.bind(solarAnalysisController)
    );

    // ===== Cálculos associados a projeto =====

    /**
     * POST /calculations/projects/:projectId/solar
     * Realiza e salva cálculo solar no projeto
     * Params: projectId
     * Body: SolarCalculationRequest
     * Response: SavedSolarCalculation
     */
    router.post('/projects/:projectId/solar',
      ValidationMiddleware.validateProjectId(),
      ValidationMiddleware.handleValidationErrors(),
      calculationController.calculateSolarSystemStandalone.bind(calculationController)
    );



    /**
     * POST /calculations/projects/:projectId/financial
     * Realiza e salva análise financeira no projeto
     * Params: projectId
     * Body: FinancialAnalysisRequest
     * Response: SavedFinancialCalculation
     */
    router.post('/projects/:projectId/financial',
      ValidationMiddleware.validateProjectId(),
      ValidationMiddleware.handleValidationErrors(),
      financialCalculationController.calculateProjectFinancials.bind(financialCalculationController)
    );

    /**
     * GET /calculations/projects/:projectId/calculations
     * Lista todos os cálculos do projeto
     * Params: projectId
     * Query: type (solar, bess, financial), page, pageSize
     * Response: PaginatedCalculationsList
     */
    router.get('/projects/:projectId/calculations',
      ValidationMiddleware.validateProjectId(),
      ValidationMiddleware.handleValidationErrors(),
      financialCalculationController.getLastFinancialResults.bind(financialCalculationController)
    );

    // ===== Serviços auxiliares =====

    /**
     * POST /calculations/irradiation/correction
     * Aplica correção de irradiação
     * Body: IrradiationCorrectionRequest
     * Response: CorrectedIrradiationData
     */
    router.post('/irradiation/correction',
      ValidationMiddleware.handleValidationErrors(),
      solarAnalysisController.calculateIrradiationCorrection.bind(solarAnalysisController)
    );

    /**
     * GET /calculations/irradiation/data
     * Obtém dados de irradiação PVGIS
     * Query: lat, lon, peakpower, loss
     * Response: IrradiationData
     */
    router.get('/irradiation/data',
      ValidationMiddleware.handleValidationErrors(),
      solarAnalysisController.getEnhancedAnalysisData.bind(solarAnalysisController)
    );

    // ===== Integrações externas =====

    /**
     * POST /calculations/pvlib/mppt
     * Cálculo MPPT via PVLIB
     * Body: PvlibMpptRequest
     * Response: PvlibMpptResult
     */
    router.post('/pvlib/mppt',
      ValidationMiddleware.handleValidationErrors(),
      solarAnalysisController.calculateMPPTLimits.bind(solarAnalysisController)
    );

    /**
     * POST /calculations/solar-analysis
     * Análise via Google Solar API
     * Body: SolarAnalysisRequest
     * Response: SolarAnalysisResult
     */
    router.post('/solar-analysis',
      ValidationMiddleware.handleValidationErrors(),
      solarAnalysisController.analyzePotential.bind(solarAnalysisController)
    );

    return router;
  }
}
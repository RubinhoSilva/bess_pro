import { Router } from 'express';
import { Container } from '../../infrastructure/di/Container';
import { SolarAnalysisController } from '../controllers/SolarAnalysisController';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { RateLimitMiddleware } from '../middleware/RateLimitMiddleware';

const router = Router();

// Get controller instance from DI container - this will be injected
let solarAnalysisController: SolarAnalysisController;

// Export a function that takes container as parameter
export const createSolarAnalysisRoutes = (container: Container): Router => {

// Get controller instance
solarAnalysisController = container.resolve<SolarAnalysisController>('SolarAnalysisController');

// Create auth middleware instance
const authMiddleware = container.resolve<AuthMiddleware>('AuthMiddleware');

// Apply authentication to all solar routes
router.use(authMiddleware.authenticate());

// Rate limiting - more restrictive for solar API calls due to external API costs  
const solarRateLimit = RateLimitMiddleware.general(); // Use existing method for now

router.use(solarRateLimit);

/**
 * @swagger
 * /api/v1/solar/analyze:
 *   post:
 *     summary: Perform comprehensive solar potential analysis
 *     tags: [Solar Analysis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *                 example: -23.5505
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *                 example: -46.6333
 *               monthlyEnergyBill:
 *                 type: number
 *                 minimum: 0
 *                 example: 200
 *               panelWattage:
 *                 type: number
 *                 minimum: 100
 *                 maximum: 1000
 *                 example: 550
 *               systemEfficiency:
 *                 type: number
 *                 minimum: 0.1
 *                 maximum: 1.0
 *                 example: 0.85
 *               includeImageryData:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Solar analysis completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     buildingInsights:
 *                       type: object
 *                     analysis:
 *                       type: object
 *                       properties:
 *                         viabilityScore:
 *                           type: number
 *                         roofComplexity:
 *                           type: string
 *                         annualGeneration:
 *                           type: number
 *                         savings:
 *                           type: object
 *                         recommendations:
 *                           type: array
 *                           items:
 *                             type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/analyze', (req, res) => solarAnalysisController.analyzeSolarPotential(req, res));

/**
 * @swagger
 * /api/v1/solar/potential:
 *   get:
 *     summary: Quick solar potential lookup
 *     tags: [Solar Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *           minimum: -90
 *           maximum: 90
 *         example: -23.5505
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *           minimum: -180
 *           maximum: 180
 *         example: -46.6333
 *     responses:
 *       200:
 *         description: Solar potential data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     location:
 *                       type: object
 *                     solarPotential:
 *                       type: object
 *                     imageQuality:
 *                       type: string
 *                 message:
 *                   type: string
 */
router.get('/potential', (req, res) => solarAnalysisController.getSolarPotential(req, res));

/**
 * @swagger
 * /api/v1/solar/recommendations/{latitude}/{longitude}:
 *   get:
 *     summary: Get solar installation recommendations
 *     tags: [Solar Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *         example: -23.5505
 *       - in: path
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *         example: -46.6333
 *     responses:
 *       200:
 *         description: Solar recommendations generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     viabilityScore:
 *                       type: number
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 *                     optimalConfiguration:
 *                       type: object
 *                     financialProjection:
 *                       type: object
 *                     roofAnalysis:
 *                       type: object
 *                 message:
 *                   type: string
 */
router.get('/recommendations/:latitude/:longitude', (req, res) => 
  solarAnalysisController.getSolarRecommendations(req, res)
);

/**
 * @swagger
 * /api/v1/solar/bulk-analyze:
 *   post:
 *     summary: Analyze solar potential for multiple locations
 *     tags: [Solar Analysis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - locations
 *             properties:
 *               locations:
 *                 type: array
 *                 maxItems: 10
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - latitude
 *                     - longitude
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "location-1"
 *                     latitude:
 *                       type: number
 *                       example: -23.5505
 *                     longitude:
 *                       type: number
 *                       example: -46.6333
 *                     monthlyBill:
 *                       type: number
 *                       example: 200
 *     responses:
 *       200:
 *         description: Bulk analysis completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           success:
 *                             type: boolean
 *                           data:
 *                             type: object
 *                           error:
 *                             type: string
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         successful:
 *                           type: number
 *                         failed:
 *                           type: number
 *                 message:
 *                   type: string
 */
router.post('/bulk-analyze', (req, res) => solarAnalysisController.bulkAnalyzeSolar(req, res));

return router;
};

// For backward compatibility
export const solarAnalysisRoutes = (req: any, res: any, next: any) => {
  // This will need to be properly initialized with container
  throw new Error('Use createSolarAnalysisRoutes(container) instead');
};
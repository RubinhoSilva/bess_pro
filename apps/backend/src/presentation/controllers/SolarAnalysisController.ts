import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { AnalyzeSolarPotentialUseCase } from '../../application/use-cases/solar/AnalyzeSolarPotentialUseCase';

export class SolarAnalysisController extends BaseController {
  constructor(private analyzeSolarPotentialUseCase: AnalyzeSolarPotentialUseCase) {
    super();
  }

  async analyzePotential(req: Request, res: Response): Promise<Response> {
    try {
      const { latitude, longitude, systemSizeKw, tilt, azimuth } = req.body;

      if (!latitude || !longitude) {
        return this.badRequest(res, 'Latitude e longitude são obrigatórios');
      }

      const result = await this.analyzeSolarPotentialUseCase.execute({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        systemSizeKw: systemSizeKw ? parseFloat(systemSizeKw) : undefined,
        tilt: tilt ? parseFloat(tilt) : undefined,
        azimuth: azimuth ? parseFloat(azimuth) : undefined
      });

      if (result.isSuccess) {
        return this.ok(res, result.value);
      }

      return this.handleResult(res, result);
    } catch (error) {
      console.error('Solar analysis error:', error);
      return this.internalServerError(res, 'Erro interno na análise solar');
    }
  }
}
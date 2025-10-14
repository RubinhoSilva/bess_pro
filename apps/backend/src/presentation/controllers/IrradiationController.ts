import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { GetSolarIrradiationUseCase } from '@/application/use-cases/irradiation/GetSolarIrradiationUseCase';
import { GetPVGISIrradiationUseCase } from '@/application/use-cases/irradiation/GetPVGISIrradiationUseCase';
import { GetPVGISMRDataUseCase } from '@/application/use-cases/irradiation/GetPVGISMRDataUseCase';
import { GetPVGISMonthlyComponentsUseCase } from '@/application/use-cases/irradiation/GetPVGISMonthlyComponentsUseCase';
import { PvgisApiService } from '@/infrastructure/external-apis/PvgisApiService';

import { CalculationLogger } from '@/domain/services/CalculationLogger';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export class IrradiationController extends BaseController {
  private pvgisService: PvgisApiService;
  private logger: CalculationLogger;

  constructor(
    private getSolarIrradiationUseCase: GetSolarIrradiationUseCase,
    private getPVGISIrradiationUseCase: GetPVGISIrradiationUseCase,
    private getPVGISMRDataUseCase: GetPVGISMRDataUseCase,
    private getPVGISMonthlyComponentsUseCase: GetPVGISMonthlyComponentsUseCase
  ) {
    super();
    
    // Initialize services for Docker compatibility
    this.pvgisService = new PvgisApiService({
      baseUrl: process.env.PVGIS_API_URL || 'https://re.jrc.ec.europa.eu/api/v5_2',
      defaultParams: {
        outputformat: 'json',
        browser: 1
      }
    });



    this.logger = new CalculationLogger('IrradiationController');
  }

  async getSolarIrradiation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        this.unauthorized(res, 'Usuário não autenticado');
        return;
      }

      const { latitude, longitude, source, useCache } = req.query;

      // Validações
      if (!latitude || !longitude) {
        this.badRequest(res, 'Latitude e longitude são obrigatórias');
        return;
      }

      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);

      if (isNaN(lat) || isNaN(lng)) {
        this.badRequest(res, 'Latitude e longitude devem ser números válidos');
        return;
      }

      // Executar use case
      const result = await this.getSolarIrradiationUseCase.execute({
        latitude: lat,
        longitude: lng,
        preferredSource: source as 'PVGIS' | 'NASA' | 'AUTO',
        useCache: useCache !== 'false'
      });

      if (!result.isSuccess) {
        this.badRequest(res, result.error!);
        return;
      }

      this.ok(res, result.value);
    } catch (error: any) {
      this.logger.error('getSolarIrradiation', 'Erro ao buscar irradiação solar', {
        error: error.message,
        query: req.query
      });
      this.internalServerError(res, `Erro ao buscar dados de irradiação: ${error.message}`);
    }
  }

  async getPVGISData(req: Request, res: Response): Promise<void> {
    try {
      // Endpoint público para PVGIS - não requer autenticação
      const {
        lat,
        lon,
        angle,
        aspect,
        raddatabase,
        useCache
      } = req.query;

      // Validações básicas
      if (!lat || !lon) {
        this.badRequest(res, 'Latitude (lat) e longitude (lon) são obrigatórias');
        return;
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lon as string);

      if (isNaN(latitude) || isNaN(longitude)) {
        this.badRequest(res, 'Latitude e longitude devem ser números válidos');
        return;
      }

      // Execute use case for PVGIS irradiation data
      const result = await this.getPVGISIrradiationUseCase.execute({
        latitude,
        longitude,
        tilt: angle ? parseFloat(angle as string) : undefined,
        azimuth: aspect ? parseFloat(aspect as string) : undefined,
        dataSource: 'pvgis',
        useCache: useCache !== 'false' // Default to true
      });

      if (!result.isSuccess) {
        this.badRequest(res, result.error!);
        return;
      }

      this.ok(res, result.value);
    } catch (error: any) {
      this.logger.error('getPVGISData', 'Erro ao buscar dados PVGIS', {
        error: error.message,
        query: req.query
      });
      this.internalServerError(res, `Erro ao buscar dados do PVGIS: ${error.message}`);
    }
  }

  async getPVGISMRData(req: Request, res: Response): Promise<void> {
    try {
      const {
        lat,
        lon,
        raddatabase,
        angle,
        aspect,
        useCache
      } = req.query;

      // Validações básicas
      if (!lat || !lon) {
        this.badRequest(res, 'Latitude (lat) e longitude (lon) são obrigatórias');
        return;
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lon as string);

      if (isNaN(latitude) || isNaN(longitude)) {
        this.badRequest(res, 'Latitude e longitude devem ser números válidos');
        return;
      }

      // Execute use case for PVGIS MR data
      const result = await this.getPVGISMRDataUseCase.execute({
        latitude,
        longitude,
        tilt: angle ? parseFloat(angle as string) : undefined,
        azimuth: aspect ? parseFloat(aspect as string) : undefined,
        raddatabase: raddatabase as string,
        useCache: useCache !== 'false' // Default to true
      });

      if (!result.isSuccess) {
        this.badRequest(res, result.error!);
        return;
      }

      this.ok(res, result.value);
    } catch (error: any) {
      this.logger.error('getPVGISMRData', 'Erro ao buscar dados PVGIS MR', {
        error: error.message,
        query: req.query
      });
      this.internalServerError(res, `Erro ao buscar dados MRcalc do PVGIS: ${error.message}`);
    }
  }

  async getPVGISMonthlyComponents(req: Request, res: Response): Promise<void> {
    try {
      const {
        lat,
        lon,
        raddatabase,
        angle,
        aspect,
        useCache
      } = req.query;

      // Validações básicas
      if (!lat || !lon) {
        this.badRequest(res, 'Latitude (lat) e longitude (lon) são obrigatórias');
        return;
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lon as string);

      if (isNaN(latitude) || isNaN(longitude)) {
        this.badRequest(res, 'Latitude e longitude devem ser números válidos');
        return;
      }

      // Execute use case for PVGIS monthly components
      const result = await this.getPVGISMonthlyComponentsUseCase.execute({
        latitude,
        longitude,
        tilt: angle ? parseFloat(angle as string) : undefined,
        azimuth: aspect ? parseFloat(aspect as string) : undefined,
        raddatabase: raddatabase as string,
        useCache: useCache !== 'false' // Default to true
      });

      if (!result.isSuccess) {
        this.badRequest(res, result.error!);
        return;
      }

      this.ok(res, result.value);
    } catch (error: any) {
      this.logger.error('getPVGISMonthlyComponents', 'Erro ao buscar componentes mensais PVGIS', {
        error: error.message,
        query: req.query
      });
      this.internalServerError(res, `Erro ao buscar componentes mensais do PVGIS: ${error.message}`);
    }
  }
}
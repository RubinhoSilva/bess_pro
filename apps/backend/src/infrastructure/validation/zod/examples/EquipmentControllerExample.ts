import { Request, Response } from 'express';
import { validateWithZod, validateQueryWithZod } from '../ZodValidationMiddleware';
import { 
  CreateModuleRequest,
  UpdateModuleRequest,
  ModuleFilters,
  CreateInverterRequest,
  UpdateInverterRequest,
  InverterFilters,
  CreateManufacturerRequest,
  UpdateManufacturerRequest,
  ManufacturerFilters
} from '@bess-pro/shared';

/**
 * Exemplo de controller usando validação Zod
 * Este é um exemplo de como integrar os schemas nos controllers existentes
 */
export class EquipmentControllerExample {
  
  /**
   * POST /api/modules
   * Criar novo módulo solar com validação Zod
   */
  createSolarModule = [
    validateWithZod(CreateModuleRequest),
    async (req: Request, res: Response) => {
      try {
        // req.body já está validado e tipado pelo Zod
        const moduleData = req.body; // Tipo: SolarModuleOutput
        
        // Lógica de negócio existente...
        // const result = await this.createModuleUseCase.execute(moduleData);
        
        res.status(201).json({
          success: true,
          data: moduleData,
          message: 'Solar module created successfully'
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  ];

  /**
   * PUT /api/modules/:id
   * Atualizar módulo solar com validação Zod
   */
  updateSolarModule = [
    validateWithZod(UpdateModuleRequest),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const updateData = req.body; // Tipo: SolarModuleUpdateOutput
        
        // Lógica de negócio existente...
        // const result = await this.updateModuleUseCase.execute(id, updateData);
        
        res.json({
          success: true,
          data: { id, ...updateData },
          message: 'Solar module updated successfully'
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  ];

  /**
   * GET /api/modules
   * Listar módulos com validação de query params
   */
  getSolarModules = [
    validateQueryWithZod(ModuleFilters),
    async (req: Request, res: Response) => {
      try {
        const queryParams = req.query; // Tipo: SolarModuleQueryOutput
        
        // Lógica de negócio existente...
        // const result = await this.getModulesUseCase.execute(queryParams);
        
        res.json({
          success: true,
          data: [],
          pagination: {
            page: queryParams.page,
            pageSize: queryParams.pageSize,
            total: 0
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  ];

  /**
   * POST /api/inverters
   * Criar novo inversor com validação Zod
   */
  createInverter = [
    validateWithZod(CreateInverterRequest),
    async (req: Request, res: Response) => {
      try {
        const inverterData = req.body; // Tipo: InverterOutput
        
        // Lógica de negócio existente...
        // const result = await this.createInverterUseCase.execute(inverterData);
        
        res.status(201).json({
          success: true,
          data: inverterData,
          message: 'Inverter created successfully'
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  ];

  /**
   * POST /api/manufacturers
   * Criar novo fabricante com validação Zod
   */
  createManufacturer = [
    validateWithZod(CreateManufacturerRequest),
    async (req: Request, res: Response) => {
      try {
        const manufacturerData = req.body; // Tipo: ManufacturerOutput
        
        // Lógica de negócio existente...
        // const result = await this.createManufacturerUseCase.execute(manufacturerData);
        
        res.status(201).json({
          success: true,
          data: manufacturerData,
          message: 'Manufacturer created successfully'
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  ];
}

/**
 * Exemplo de como configurar as rotas com validação Zod
 */
export function setupEquipmentRoutes(app: any) {
  const controller = new EquipmentControllerExample();
  
  // Rotas de Módulos Solares
  app.post('/api/modules', ...controller.createSolarModule);
  app.put('/api/modules/:id', ...controller.updateSolarModule);
  app.get('/api/modules', ...controller.getSolarModules);
  
  // Rotas de Inversores
  app.post('/api/inverters', ...controller.createInverter);
  
  // Rotas de Fabricantes
  app.post('/api/manufacturers', ...controller.createManufacturer);
}
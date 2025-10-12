/**
 * Exemplos práticos de implementação da camada de validação
 * 
 * Este arquivo demonstra como usar a nova arquitetura de validação
 * em controladores, middlewares e casos de uso.
 */

import { Request, Response } from 'express';
import { validationMiddleware, schemaValidationMiddleware } from '../middleware/ValidationMiddleware';
import { ModuleValidator } from '../schemas/equipment/ModuleValidator';
import { InverterValidator } from '../schemas/equipment/InverterValidator';
import { ManufacturerValidator } from '../schemas/equipment/ManufacturerValidator';

// Exemplo 1: Controller com validação DTO + Business Rules
export class SolarModuleControllerV3 {
  private moduleValidator: ModuleValidator;

  constructor() {
    this.moduleValidator = new ModuleValidator();
  }

  /**
   * Criar novo módulo solar com validação completa
   * 
   * Pipeline de validação:
   * 1. class-validator decorators (DTO)
   * 2. Business rules customizadas
   * 3. Schema validation (regras técnicas)
   */
  async createModule(req: Request, res: Response) {
    try {
      // Validação DTO + Business Rules
      const { dto, result } = await this.moduleValidator.transformAndValidate(
        req.body,
        CreateSolarModuleCommand, // DTO existente
        {
          userRole: req.user?.role,
          equipment: req.body
        }
      );

      if (!result.isValid) {
        return res.status(400).json({
          success: false,
          message: result.message,
          errors: result.errors,
          warnings: (result as any).warnings
        });
      }

      // Schema validation adicional
      const schemaResult = await this.moduleValidator.validateSchema(dto, 'solar_module');
      if (!schemaResult.isValid) {
        return res.status(400).json({
          success: false,
          message: schemaResult.message,
          errors: schemaResult.errors,
          warnings: schemaResult.warnings
        });
      }

      // Processar criação do módulo...
      const createdModule = await this.createModuleInDatabase(dto);

      res.status(201).json({
        success: true,
        data: createdModule,
        message: 'Módulo solar criado com sucesso'
      });

    } catch (error) {
      console.error('Error creating solar module:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno ao criar módulo solar'
      });
    }
  }

  /**
   * Atualizar módulo existente com validação condicional
   */
  async updateModule(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Buscar módulo existente para validação contextual
      const existingModule = await this.findModuleById(id);
      if (!existingModule) {
        return res.status(404).json({
          success: false,
          message: 'Módulo não encontrado'
        });
      }

      // Validação com contexto do módulo existente
      const { dto, result } = await this.moduleValidator.transformAndValidate(
        { ...existingModule, ...req.body },
        UpdateSolarModuleCommand,
        {
          userRole: req.user?.role,
          equipment: existingModule
        }
      );

      if (!result.isValid) {
        return res.status(400).json({
          success: false,
          message: result.message,
          errors: result.errors,
          warnings: (result as any).warnings
        });
      }

      // Atualizar módulo...
      const updatedModule = await this.updateModuleInDatabase(id, dto);

      res.json({
        success: true,
        data: updatedModule,
        message: 'Módulo atualizado com sucesso'
      });

    } catch (error) {
      console.error('Error updating solar module:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno ao atualizar módulo'
      });
    }
  }

  private async createModuleInDatabase(dto: any) {
    // Implementação do banco de dados...
    return { id: 'new-id', ...dto };
  }

  private async updateModuleInDatabase(id: string, dto: any) {
    // Implementação do banco de dados...
    return { id, ...dto };
  }

  private async findModuleById(id: string) {
    // Implementação do banco de dados...
    return { id, model: 'Existing Module' };
  }
}

// Exemplo 2: Middleware de rota com validação
export const moduleRoutes = {
  // Usando middleware de validação tradicional (apenas DTO)
  'POST /modules': [
    validationMiddleware(CreateSolarModuleCommand, 'body'),
    (req: Request, res: Response) => {
      // Controller logic here...
    }
  ],

  // Usando middleware com validação customizada
  'POST /modules-with-custom-validation': [
    validationMiddleware(
      CreateSolarModuleCommand, 
      'body', 
      new ModuleValidator()
    ),
    (req: Request, res: Response) => {
      // Controller logic here...
    }
  ],

  // Usando schema validation middleware
  'POST /modules-schema-validation': [
    schemaValidationMiddleware(new ModuleValidator(), 'solar_module'),
    (req: Request, res: Response) => {
      // Controller logic here...
    }
  ],

  // Validação múltipla (body + query)
  'GET /modules/search': [
    validateMultiple(
      undefined, // sem body validation
      GetModulesQueryDTO, // query validation
      undefined, // sem body validator
      new ModuleValidator() // query validator
    ),
    (req: Request, res: Response) => {
      // Controller logic here...
    }
  ]
};

// Exemplo 3: Use Case com validação
export class CreateSolarModuleUseCase {
  private moduleValidator: ModuleValidator;

  constructor() {
    this.moduleValidator = new ModuleValidator();
  }

  async execute(command: CreateSolarModuleCommand, context?: any) {
    // Validação completa no use case
    const validationResult = await this.moduleValidator.validateDTO(command, {
      userRole: context?.userRole,
      equipment: context?.equipment
    });

    if (!validationResult.isValid) {
      throw new ValidationError(validationResult.message, validationResult.errors);
    }

    // Schema validation
    const schemaResult = await this.moduleValidator.validateSchema(command, 'solar_module');
    if (!schemaResult.isValid) {
      throw new ValidationError(schemaResult.message, schemaResult.errors);
    }

    // Lógica de negócio...
    return await this.createModule(command);
  }

  private async createModule(command: CreateSolarModuleCommand) {
    // Implementação...
  }
}

// Exemplo 4: Validação em lote
export class BatchEquipmentValidator {
  private moduleValidator: ModuleValidator;
  private inverterValidator: InverterValidator;
  private manufacturerValidator: ManufacturerValidator;

  constructor() {
    this.moduleValidator = new ModuleValidator();
    this.inverterValidator = new InverterValidator();
    this.manufacturerValidator = new ManufacturerValidator();
  }

  async validateBatch(equipmentList: any[]) {
    const results = [];
    const errors = [];

    for (const equipment of equipmentList) {
      try {
        let validator;
        
        switch (equipment.type) {
          case 'module':
            validator = this.moduleValidator;
            break;
          case 'inverter':
            validator = this.inverterValidator;
            break;
          case 'manufacturer':
            validator = this.manufacturerValidator;
            break;
          default:
            errors.push({
              equipment: equipment,
              error: 'Unknown equipment type'
            });
            continue;
        }

        const result = await validator.validateDTO(equipment);
        results.push({
          equipment: equipment,
          validation: result
        });

      } catch (error) {
        errors.push({
          equipment: equipment,
          error: error.message
        });
      }
    }

    return {
      total: equipmentList.length,
      valid: results.filter(r => r.validation.isValid).length,
      invalid: results.filter(r => !r.validation.isValid).length,
      errors,
      results
    };
  }
}

// Exemplo 5: Validação com regras customizadas
export class CustomValidationRules {
  static createModuleValidatorWithCustomRules() {
    const validator = new ModuleValidator();
    
    // Adicionar regra customizada
    validator.validationEngine.registerRules('solar_module', [
      {
        id: 'custom_efficiency_threshold',
        name: 'Custom Efficiency Threshold',
        description: 'Validate efficiency based on manufacturer reputation',
        type: 'custom',
        severity: 'warning',
        category: 'performance',
        validate: (data: any, context?: any) => {
          const efficiency = data.specifications?.efficiency;
          const manufacturerReputation = context?.equipment?.reputation || 0.5;
          
          if (efficiency > 22 && manufacturerReputation < 0.7) {
            return {
              isValid: false,
              message: 'High efficiency claim from less reputable manufacturer',
              code: 'EFFICIENCY_SUSPICIOUS',
              suggestions: ['Verify efficiency claims with independent testing']
            };
          }
          
          return { isValid: true, message: 'Efficiency validation passed' };
        }
      }
    ]);

    return validator;
  }
}

// Exemplo 6: Error handling personalizado
export class ValidationError extends Error {
  public readonly errors: any[];
  public readonly warnings?: any[];

  constructor(message: string, errors: any[], warnings?: any[]) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
    this.warnings = warnings;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      errors: this.errors,
      warnings: this.warnings
    };
  }
}

// DTOs de exemplo (compatíveis com estrutura existente)
class CreateSolarModuleCommand {
  // Propriedades existentes com decorators class-validator...
}

class UpdateSolarModuleCommand {
  // Propriedades existentes com decorators class-validator...
}

class GetModulesQueryDTO {
  // Propriedades existentes com decorators class-validator...
}
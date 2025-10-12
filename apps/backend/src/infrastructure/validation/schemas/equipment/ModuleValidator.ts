import { BaseValidator } from '../../core/BaseValidator';
import { ValidationResult, ValidationContext, ValidationRule } from '../../../shared/validation/types/ValidationTypes';

// Define SolarModule interface locally to avoid import issues
interface SolarModule {
  readonly manufacturer: any;
  readonly model: string;
  readonly nominalPower: number;
  readonly specifications: {
    readonly vmpp?: number;
    readonly impp?: number;
    readonly voc: number;
    readonly isc: number;
    readonly efficiency: number;
    readonly cellType: string;
    readonly numberOfCells?: number;
    readonly technology: string;
  };
  readonly parameters?: {
    readonly temperature?: {
      readonly tempCoeffPmax?: number;
      readonly tempCoeffVoc?: number;
      readonly tempCoeffIsc?: number;
    };
  };
  readonly dimensions?: {
    readonly widthMm?: number;
    readonly heightMm?: number;
    readonly thicknessMm?: number;
    readonly weightKg?: number;
    readonly areaM2?: number;
  };
  readonly metadata?: any;
  readonly status: string;
  readonly isPublic: boolean;
}

export class ModuleValidator extends BaseValidator<SolarModule> {
  constructor() {
    super('SolarModule');
  }

  protected initializeRules(): void {
    // Technical specifications rules
    this.validationEngine.registerRules('solar_module', [
      {
        id: 'module_power_required',
        name: 'Module Power Required',
        description: 'Solar module must have nominal power specified',
        type: 'required',
        severity: 'error',
        category: 'technical',
        field: 'nominalPower',
        validate: (data: any) => {
          if (!data.nominalPower || data.nominalPower <= 0) {
            return {
              isValid: false,
              message: 'Nominal power is required and must be greater than 0',
              code: 'MODULE_POWER_REQUIRED'
            };
          }
          return { isValid: true, message: 'Module power valid' };
        }
      },
      {
        id: 'module_power_range',
        name: 'Module Power Range',
        description: 'Solar module power must be within realistic range',
        type: 'range',
        severity: 'error',
        category: 'technical',
        field: 'nominalPower',
        min: 10,
        max: 1000,
        validate: (data: any) => {
          const power = data.nominalPower;
          if (power < 10 || power > 1000) {
            return {
              isValid: false,
              message: 'Module power must be between 10W and 1000W',
              code: 'MODULE_POWER_OUT_OF_RANGE',
              suggestions: ['Check the module datasheet for correct power rating']
            };
          }
          return { isValid: true, message: 'Module power within range' };
        }
      },
      {
        id: 'efficiency_required',
        name: 'Efficiency Required',
        description: 'Solar module must have efficiency specified',
        type: 'required',
        severity: 'error',
        category: 'technical',
        field: 'specifications.efficiency',
        validate: (data: any) => {
          if (!data.specifications?.efficiency || data.specifications.efficiency <= 0) {
            return {
              isValid: false,
              message: 'Efficiency is required and must be greater than 0',
              code: 'EFFICIENCY_REQUIRED'
            };
          }
          return { isValid: true, message: 'Efficiency valid' };
        }
      },
      {
        id: 'efficiency_range',
        name: 'Efficiency Range',
        description: 'Module efficiency must be within realistic range',
        type: 'range',
        severity: 'warning',
        category: 'performance',
        field: 'specifications.efficiency',
        min: 10,
        max: 30,
        validate: (data: any) => {
          const efficiency = data.specifications?.efficiency;
          if (efficiency < 10 || efficiency > 30) {
            return {
              isValid: false,
              message: 'Module efficiency should be between 10% and 30%',
              code: 'EFFICIENCY_OUT_OF_RANGE',
              suggestions: ['Verify efficiency value from module datasheet']
            };
          }
          return { isValid: true, message: 'Efficiency within range' };
        }
      },
      {
        id: 'voltage_range',
        name: 'Voltage Range Validation',
        description: 'Module voltages must be within realistic ranges',
        type: 'custom',
        severity: 'error',
        category: 'technical',
        validate: (data: any) => {
          const { voc, vmpp } = data.specifications || {};
          
          if (!voc || voc <= 0) {
            return {
              isValid: false,
              message: 'Open circuit voltage (Voc) is required and must be greater than 0',
              code: 'VOC_REQUIRED'
            };
          }

          if (voc < 10 || voc > 50) {
            return {
              isValid: false,
              message: 'Voc should be between 10V and 50V for typical modules',
              code: 'VOC_OUT_OF_RANGE',
              suggestions: ['Check if this is a module or string voltage']
            };
          }

          if (vmpp && vmpp >= voc) {
            return {
              isValid: false,
              message: 'Vmpp must be less than Voc',
              code: 'VMPP_GREATER_THAN_VOC'
            };
          }

          return { isValid: true, message: 'Voltage validation passed' };
        }
      },
      {
        id: 'current_range',
        name: 'Current Range Validation',
        description: 'Module currents must be within realistic ranges',
        type: 'custom',
        severity: 'error',
        category: 'technical',
        validate: (data: any) => {
          const { isc, impp } = data.specifications || {};
          
          if (!isc || isc <= 0) {
            return {
              isValid: false,
              message: 'Short circuit current (Isc) is required and must be greater than 0',
              code: 'ISC_REQUIRED'
            };
          }

          if (isc < 1 || isc > 15) {
            return {
              isValid: false,
              message: 'Isc should be between 1A and 15A for typical modules',
              code: 'ISC_OUT_OF_RANGE',
              suggestions: ['Check if this is a module or string current']
            };
          }

          if (impp && impp > isc) {
            return {
              isValid: false,
              message: 'Impp must be less than or equal to Isc',
              code: 'IMPP_GREATER_THAN_ISC'
            };
          }

          return { isValid: true, message: 'Current validation passed' };
        }
      },
      {
        id: 'temperature_coefficients',
        name: 'Temperature Coefficients',
        description: 'Temperature coefficients must be within realistic ranges',
        type: 'custom',
        severity: 'warning',
        category: 'performance',
        validate: (data: any) => {
          const tempCoeff = data.parameters?.temperature;
          
          if (!tempCoeff) {
            return {
              isValid: true,
              message: 'Temperature coefficients not provided (optional)',
              code: 'TEMP_COEFF_MISSING'
            };
          }

          const { tempCoeffPmax, tempCoeffVoc, tempCoeffIsc } = tempCoeff;

          if (tempCoeffPmax !== undefined) {
            if (tempCoeffPmax > 0 || tempCoeffPmax < -1) {
              return {
                isValid: false,
                message: 'Power temperature coefficient should be between -1%/°C and 0%/°C',
                code: 'TEMP_COEFF_PMAX_INVALID',
                suggestions: ['Typical values range from -0.3 to -0.5 %/°C']
              };
            }
          }

          if (tempCoeffVoc !== undefined) {
            if (tempCoeffVoc > 0 || tempCoeffVoc < -1) {
              return {
                isValid: false,
                message: 'Voc temperature coefficient should be between -1%/°C and 0%/°C',
                code: 'TEMP_COEFF_VOC_INVALID'
              };
            }
          }

          return { isValid: true, message: 'Temperature coefficients valid' };
        }
      },
      {
        id: 'dimensions_validation',
        name: 'Dimensions Validation',
        description: 'Module dimensions must be realistic',
        type: 'custom',
        severity: 'warning',
        category: 'technical',
        validate: (data: any) => {
          const dimensions = data.dimensions;
          
          if (!dimensions) {
            return {
              isValid: true,
              message: 'Dimensions not provided (optional)',
              code: 'DIMENSIONS_MISSING'
            };
          }

          const { widthMm, heightMm, thicknessMm, weightKg } = dimensions;

          if (widthMm && (widthMm < 500 || widthMm > 2500)) {
            return {
              isValid: false,
              message: 'Module width should be between 500mm and 2500mm',
              code: 'WIDTH_OUT_OF_RANGE'
            };
          }

          if (heightMm && (heightMm < 500 || heightMm > 2500)) {
            return {
              isValid: false,
              message: 'Module height should be between 500mm and 2500mm',
              code: 'HEIGHT_OUT_OF_RANGE'
            };
          }

          if (thicknessMm && (thicknessMm < 20 || thicknessMm > 100)) {
            return {
              isValid: false,
              message: 'Module thickness should be between 20mm and 100mm',
              code: 'THICKNESS_OUT_OF_RANGE'
            };
          }

          if (weightKg && (weightKg < 5 || weightKg > 50)) {
            return {
              isValid: false,
              message: 'Module weight should be between 5kg and 50kg',
              code: 'WEIGHT_OUT_OF_RANGE'
            };
          }

          // Calculate area if both dimensions are present
          if (widthMm && heightMm) {
            const calculatedArea = (widthMm * heightMm) / 1000000; // Convert to m²
            if (dimensions.areaM2 && Math.abs(calculatedArea - dimensions.areaM2) > 0.1) {
              return {
                isValid: false,
                message: 'Calculated area does not match provided area',
                code: 'AREA_MISMATCH',
                suggestions: [`Calculated: ${calculatedArea.toFixed(2)}m², Provided: ${dimensions.areaM2}m²`]
              };
            }
          }

          return { isValid: true, message: 'Dimensions validation passed' };
        }
      }
    ]);
  }

  protected async validateBusinessRules(data: SolarModule, context?: ValidationContext): Promise<ValidationResult> {
    // Check for duplicate model within manufacturer
    if (context?.equipment && context.userRole !== 'admin') {
      // This would typically involve a database check
      // For now, we'll just validate the model format
      if (!data.model || data.model.trim().length === 0) {
        return {
          isValid: false,
          message: 'Model name is required',
          code: 'MODEL_REQUIRED'
        };
      }

      if (data.model.length > 100) {
        return {
          isValid: false,
          message: 'Model name must be less than 100 characters',
          code: 'MODEL_TOO_LONG'
        };
      }
    }

    // Validate cell type and technology compatibility
    const { specifications } = data;
    if (specifications) {
      const { cellType, technology } = specifications;
      
      if (cellType && technology) {
        const compatibility = this.validateCellTechnologyCompatibility(cellType, technology);
        if (!compatibility.isValid) {
          return compatibility;
        }
      }
    }

    return {
      isValid: true,
      message: 'Business rules validation passed'
    };
  }

  private validateCellTechnologyCompatibility(cellType: string, technology: string): ValidationResult {
    const compatibleCombinations: Record<string, string[]> = {
      'monocrystalline': ['perc', 'hjt', 'topcon', 'ibc', 'shj', 'half-cut', 'multi-busbar'],
      'polycrystalline': ['perc', 'half-cut', 'multi-busbar'],
      'thin-film': ['tandem'],
      'bifacial': ['perc', 'hjt', 'topcon', 'half-cut'],
      'heterojunction': ['hjt', 'shj'],
      'perovskite': ['tandem'],
      'cdte': ['tandem'],
      'cis': ['tandem'],
      'cigs': ['tandem']
    };

    const allowedTechnologies = compatibleCombinations[cellType];
    if (!allowedTechnologies || !allowedTechnologies.includes(technology)) {
      return {
        isValid: false,
        message: `Cell type '${cellType}' is not compatible with technology '${technology}'`,
        code: 'CELL_TECHNOLOGY_INCOMPATIBLE',
        suggestions: [`Compatible technologies for ${cellType}: ${allowedTechnologies?.join(', ') || 'none'}`]
      };
    }

    return { isValid: true, message: 'Cell technology compatibility validated' };
  }
}
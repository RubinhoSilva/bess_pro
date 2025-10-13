import { BaseValidator } from '../../core/BaseValidator';
import { ValidationResult, ValidationContext, ValidationRule } from '../../../../shared/validation/types/ValidationTypes';

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
          return !!(data.nominalPower && data.nominalPower > 0);
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
          return power >= 10 && power <= 1000;
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
          return !!(data.specifications?.efficiency && data.specifications.efficiency > 0);
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
          return efficiency >= 10 && efficiency <= 30;
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
            return false;
          }

          if (voc < 10 || voc > 50) {
            return false;
          }

          if (vmpp && vmpp >= voc) {
            return false;
          }

          return true;
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
            return false;
          }

          if (isc < 1 || isc > 15) {
            return false;
          }

          if (impp && impp > isc) {
            return false;
          }

          return true;
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
            return true;
          }

          const { tempCoeffPmax, tempCoeffVoc, tempCoeffIsc } = tempCoeff;

          if (tempCoeffPmax !== undefined) {
            if (tempCoeffPmax > 0 || tempCoeffPmax < -1) {
              return false;
            }
          }

          if (tempCoeffVoc !== undefined) {
            if (tempCoeffVoc > 0 || tempCoeffVoc < -1) {
              return false;
            }
          }

          return true;
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
            return true;
          }

          const { widthMm, heightMm, thicknessMm, weightKg } = dimensions;

          if (widthMm && (widthMm < 500 || widthMm > 2500)) {
            return false;
          }

          if (heightMm && (heightMm < 500 || heightMm > 2500)) {
            return false;
          }

          if (thicknessMm && (thicknessMm < 20 || thicknessMm > 100)) {
            return false;
          }

          if (weightKg && (weightKg < 5 || weightKg > 50)) {
            return false;
          }

          // Calculate area if both dimensions are present
          if (widthMm && heightMm) {
            const calculatedArea = (widthMm * heightMm) / 1000000; // Convert to m²
            if (dimensions.areaM2 && Math.abs(calculatedArea - dimensions.areaM2) > 0.1) {
              return false;
            }
          }

          return true;
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
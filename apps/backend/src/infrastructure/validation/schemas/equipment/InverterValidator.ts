import { BaseValidator } from '../../core/BaseValidator';
import { ValidationResult, ValidationContext, ValidationRule } from '../../../shared/validation/types/ValidationTypes';

// Define Inverter interface locally to avoid import issues
interface Inverter {
  readonly manufacturer: any;
  readonly model: string;
  readonly nominalPower: number; // W
  readonly specifications: InverterSpecifications;
  readonly parameters?: InverterParameters;
  readonly dimensions?: InverterDimensions;
  readonly metadata?: any;
  readonly status: string;
  readonly isPublic: boolean;
}

interface InverterSpecifications {
  readonly maxDcInput: number; // W
  readonly maxDcVoltage: number; // V
  readonly maxDcCurrent: number; // A
  readonly nominalAcOutput: number; // W
  readonly maxAcOutput: number; // W
  readonly acVoltage: number; // V
  readonly efficiency: number; // %
  readonly mpptCount: number;
  readonly stringsPerMppt: number;
  readonly type: 'string' | 'micro' | 'hybrid' | 'battery';
}

interface InverterParameters {
  readonly protection?: {
    readonly overvoltageProtection: boolean;
    readonly undervoltageProtection: boolean;
    readonly overcurrentProtection: boolean;
    readonly shortCircuitProtection: boolean;
    readonly overtemperatureProtection: boolean;
    readonly islandingProtection: boolean;
  };
  readonly operating?: {
    readonly temperatureRange: {
      readonly min: number;
      readonly max: number;
    };
    readonly humidityRange: {
      readonly min: number;
      readonly max: number;
    };
    readonly altitudeRange: {
      readonly min: number;
      readonly max: number;
    };
  };
}

interface InverterDimensions {
  readonly widthMm?: number;
  readonly heightMm?: number;
  readonly depthMm?: number;
  readonly weightKg?: number;
}

export class InverterValidator extends BaseValidator<Inverter> {
  constructor() {
    super('Inverter');
  }

  protected initializeRules(): void {
    this.validationEngine.registerRules('inverter', [
      {
        id: 'inverter_power_required',
        name: 'Inverter Power Required',
        description: 'Inverter must have nominal power specified',
        type: 'required',
        severity: 'error',
        category: 'technical',
        field: 'nominalPower',
        validate: (data: any) => {
          if (!data.nominalPower || data.nominalPower <= 0) {
            return {
              isValid: false,
              message: 'Nominal power is required and must be greater than 0',
              code: 'INVERTER_POWER_REQUIRED'
            };
          }
          return { isValid: true, message: 'Inverter power valid' };
        }
      },
      {
        id: 'inverter_power_range',
        name: 'Inverter Power Range',
        description: 'Inverter power must be within realistic range',
        type: 'range',
        severity: 'error',
        category: 'technical',
        field: 'nominalPower',
        min: 500,
        max: 150000,
        validate: (data: any) => {
          const power = data.nominalPower;
          if (power < 500 || power > 150000) {
            return {
              isValid: false,
              message: 'Inverter power must be between 500W and 150kW',
              code: 'INVERTER_POWER_OUT_OF_RANGE',
              suggestions: ['Check the inverter datasheet for correct power rating']
            };
          }
          return { isValid: true, message: 'Inverter power within range' };
        }
      },
      {
        id: 'dc_input_validation',
        name: 'DC Input Validation',
        description: 'DC input specifications must be consistent',
        type: 'custom',
        severity: 'error',
        category: 'technical',
        validate: (data: any) => {
          const { maxDcInput, maxDcVoltage, maxDcCurrent } = data.specifications || {};
          
          if (!maxDcInput || maxDcInput <= 0) {
            return {
              isValid: false,
              message: 'Maximum DC input power is required and must be greater than 0',
              code: 'MAX_DC_INPUT_REQUIRED'
            };
          }

          if (!maxDcVoltage || maxDcVoltage <= 0) {
            return {
              isValid: false,
              message: 'Maximum DC voltage is required and must be greater than 0',
              code: 'MAX_DC_VOLTAGE_REQUIRED'
            };
          }

          if (!maxDcCurrent || maxDcCurrent <= 0) {
            return {
              isValid: false,
              message: 'Maximum DC current is required and must be greater than 0',
              code: 'MAX_DC_CURRENT_REQUIRED'
            };
          }

          // Check if DC input power is consistent with voltage and current
          const calculatedPower = maxDcVoltage * maxDcCurrent;
          if (Math.abs(calculatedPower - maxDcInput) > (maxDcInput * 0.1)) {
            return {
              isValid: false,
              message: 'DC input power is not consistent with voltage and current',
              code: 'DC_INPUT_INCONSISTENT',
              suggestions: [`Calculated power: ${calculatedPower}W, Specified: ${maxDcInput}W`]
            };
          }

          return { isValid: true, message: 'DC input validation passed' };
        }
      },
      {
        id: 'ac_output_validation',
        name: 'AC Output Validation',
        description: 'AC output specifications must be consistent',
        type: 'custom',
        severity: 'error',
        category: 'technical',
        validate: (data: any) => {
          const { nominalAcOutput, maxAcOutput, acVoltage } = data.specifications || {};
          
          if (!nominalAcOutput || nominalAcOutput <= 0) {
            return {
              isValid: false,
              message: 'Nominal AC output is required and must be greater than 0',
              code: 'NOMINAL_AC_OUTPUT_REQUIRED'
            };
          }

          if (!maxAcOutput || maxAcOutput <= 0) {
            return {
              isValid: false,
              message: 'Maximum AC output is required and must be greater than 0',
              code: 'MAX_AC_OUTPUT_REQUIRED'
            };
          }

          if (!acVoltage || acVoltage <= 0) {
            return {
              isValid: false,
              message: 'AC voltage is required and must be greater than 0',
              code: 'AC_VOLTAGE_REQUIRED'
            };
          }

          // Max AC output should be greater than or equal to nominal
          if (maxAcOutput < nominalAcOutput) {
            return {
              isValid: false,
              message: 'Maximum AC output must be greater than or equal to nominal AC output',
              code: 'AC_OUTPUT_INCONSISTENT'
            };
          }

          // Validate AC voltage (common values: 120, 208, 220, 230, 240, 277, 380, 400, 480)
          const commonVoltages = [120, 208, 220, 230, 240, 277, 380, 400, 480];
          if (!commonVoltages.includes(acVoltage)) {
            return {
              isValid: false,
              message: 'AC voltage should be a standard value',
              code: 'AC_VOLTAGE_NON_STANDARD',
              suggestions: [`Common values: ${commonVoltages.join(', ')}V`]
            };
          }

          return { isValid: true, message: 'AC output validation passed' };
        }
      },
      {
        id: 'efficiency_validation',
        name: 'Efficiency Validation',
        description: 'Inverter efficiency must be within realistic range',
        type: 'custom',
        severity: 'warning',
        category: 'performance',
        validate: (data: any) => {
          const { efficiency } = data.specifications || {};
          
          if (!efficiency || efficiency <= 0) {
            return {
              isValid: false,
              message: 'Efficiency is required and must be greater than 0',
              code: 'EFFICIENCY_REQUIRED'
            };
          }

          if (efficiency < 90 || efficiency > 99) {
            return {
              isValid: false,
              message: 'Inverter efficiency should be between 90% and 99%',
              code: 'EFFICIENCY_OUT_OF_RANGE',
              suggestions: ['Typical modern inverters have 95-98% efficiency']
            };
          }

          return { isValid: true, message: 'Efficiency validation passed' };
        }
      },
      {
        id: 'mppt_configuration',
        name: 'MPPT Configuration',
        description: 'MPPT configuration must be valid',
        type: 'custom',
        severity: 'error',
        category: 'technical',
        validate: (data: any) => {
          const { mpptCount, stringsPerMppt } = data.specifications || {};
          
          if (!mpptCount || mpptCount <= 0) {
            return {
              isValid: false,
              message: 'MPPT count is required and must be greater than 0',
              code: 'MPPT_COUNT_REQUIRED'
            };
          }

          if (!stringsPerMppt || stringsPerMppt <= 0) {
            return {
              isValid: false,
              message: 'Strings per MPPT is required and must be greater than 0',
              code: 'STRINGS_PER_MPPT_REQUIRED'
            };
          }

          if (mpptCount > 20) {
            return {
              isValid: false,
              message: 'MPPT count seems unusually high',
              code: 'MPPT_COUNT_HIGH',
              suggestions: ['Typical residential inverters have 1-4 MPPTs']
            };
          }

          if (stringsPerMppt > 20) {
            return {
              isValid: false,
              message: 'Strings per MPPT seems unusually high',
              code: 'STRINGS_PER_MPPT_HIGH',
              suggestions: ['Typical values range from 1-10 strings per MPPT']
            };
          }

          return { isValid: true, message: 'MPPT configuration valid' };
        }
      },
      {
        id: 'inverter_type_validation',
        name: 'Inverter Type Validation',
        description: 'Inverter type must be valid and consistent with specifications',
        type: 'custom',
        severity: 'warning',
        category: 'technical',
        validate: (data: any) => {
          const { type, mpptCount } = data.specifications || {};
          
          const validTypes = ['string', 'micro', 'hybrid', 'battery'];
          if (!validTypes.includes(type)) {
            return {
              isValid: false,
              message: `Inverter type must be one of: ${validTypes.join(', ')}`,
              code: 'INVALID_INVERTER_TYPE'
            };
          }

          // Type-specific validations
          if (type === 'micro' && mpptCount > 1) {
            return {
              isValid: false,
              message: 'Microinverters typically have 1 MPPT',
              code: 'MICROINVERTER_MPPT_COUNT',
              suggestions: ['Microinverters usually have one MPPT per unit']
            };
          }

          if (type === 'string' && mpptCount < 1) {
            return {
              isValid: false,
              message: 'String inverters must have at least 1 MPPT',
              code: 'STRING_INVERTER_MPPT_COUNT'
            };
          }

          return { isValid: true, message: 'Inverter type validation passed' };
        }
      },
      {
        id: 'power_matching',
        name: 'Power Matching',
        description: 'DC and AC power ratings should be reasonably matched',
        type: 'custom',
        severity: 'warning',
        category: 'performance',
        validate: (data: any) => {
          const { maxDcInput, nominalAcOutput } = data.specifications || {};
          const nominalPower = data.nominalPower;
          
          if (!maxDcInput || !nominalAcOutput || !nominalPower) {
            return { isValid: true, message: 'Power matching skipped (missing data)' };
          }

          // DC input should be slightly higher than AC output (oversizing)
          const dcAcRatio = maxDcInput / nominalAcOutput;
          if (dcAcRatio < 1.0 || dcAcRatio > 2.0) {
            return {
              isValid: false,
              message: 'DC/AC ratio should be between 1.0 and 2.0',
              code: 'DC_AC_RATIO_OUT_OF_RANGE',
              suggestions: [`Current ratio: ${dcAcRatio.toFixed(2)}, Typical range: 1.1-1.5`]
            };
          }

          // Nominal power should be close to AC output
          const acNominalRatio = nominalAcOutput / nominalPower;
          if (acNominalRatio < 0.8 || acNominalRatio > 1.2) {
            return {
              isValid: false,
              message: 'AC output should be close to nominal power',
              code: 'AC_NOMINAL_MISMATCH',
              suggestions: [`Current ratio: ${acNominalRatio.toFixed(2)}, Expected: ~1.0`]
            };
          }

          return { isValid: true, message: 'Power matching validation passed' };
        }
      },
      {
        id: 'protection_features',
        name: 'Protection Features',
        description: 'Essential protection features should be present',
        type: 'custom',
        severity: 'warning',
        category: 'safety',
        validate: (data: any) => {
          const protection = data.parameters?.protection;
          
          if (!protection) {
            return {
              isValid: true,
              message: 'Protection features not specified (optional)',
              code: 'PROTECTION_MISSING'
            };
          }

          const essentialProtections = [
            'overvoltageProtection',
            'undervoltageProtection',
            'overcurrentProtection',
            'shortCircuitProtection',
            'islandingProtection'
          ];

          const missingProtections = essentialProtections.filter(
            protectionName => !protection[protectionName]
          );

          if (missingProtections.length > 0) {
            return {
              isValid: false,
              message: `Missing essential protection features: ${missingProtections.join(', ')}`,
              code: 'MISSING_PROTECTION_FEATURES',
              suggestions: ['Ensure all essential protection features are enabled']
            };
          }

          return { isValid: true, message: 'Protection features validation passed' };
        }
      }
    ]);
  }

  protected async validateBusinessRules(data: Inverter, context?: ValidationContext): Promise<ValidationResult> {
    // Check for duplicate model within manufacturer
    if (context?.equipment && context.userRole !== 'admin') {
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

    // Validate inverter type compatibility with other specifications
    const { specifications } = data;
    if (specifications) {
      const compatibility = this.validateInverterTypeCompatibility(specifications);
      if (!compatibility.isValid) {
        return compatibility;
      }
    }

    return {
      isValid: true,
      message: 'Business rules validation passed'
    };
  }

  private validateInverterTypeCompatibility(specifications: InverterSpecifications): ValidationResult {
    const { type, maxDcVoltage, mpptCount } = specifications;

    // Type-specific compatibility checks
    switch (type) {
      case 'micro':
        if (maxDcVoltage > 60) {
          return {
            isValid: false,
            message: 'Microinverters typically operate at lower DC voltages',
            code: 'MICROINVERTER_VOLTAGE_HIGH',
            suggestions: ['Typical microinverter DC voltage: 20-60V']
          };
        }
        break;

      case 'string':
        if (maxDcVoltage < 150) {
          return {
            isValid: false,
            message: 'String inverters typically operate at higher DC voltages',
            code: 'STRING_INVERTER_VOLTAGE_LOW',
            suggestions: ['Typical string inverter DC voltage: 150-1000V']
          };
        }
        break;

      case 'hybrid':
        if (mpptCount < 2) {
          return {
            isValid: false,
            message: 'Hybrid inverters typically have multiple MPPTs for PV and battery',
            code: 'HYBRID_INVERTER_MPPT_LOW',
            suggestions: ['Hybrid inverters usually have 2+ MPPTs']
          };
        }
        break;
    }

    return { isValid: true, message: 'Inverter type compatibility validated' };
  }
}
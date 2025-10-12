import { BaseValidator } from '../../core/BaseValidator';
import { ValidationResult, ValidationContext } from '../../../shared/validation/types/ValidationTypes';

// Define Manufacturer interface locally to avoid import issues
interface Manufacturer {
  readonly name: string;
  readonly type: 'SOLAR_MODULE' | 'INVERTER' | 'BOTH';
  readonly country?: string;
  readonly website?: string;
  readonly email?: string;
  readonly foundedYear?: number;
  readonly description?: string;
  readonly logo?: string;
  readonly isActive: boolean;
  readonly metadata?: any;
}

export class ManufacturerValidator extends BaseValidator<Manufacturer> {
  constructor() {
    super('Manufacturer');
  }

  protected initializeRules(): void {
    this.validationEngine.registerRules('manufacturer', [
      {
        id: 'manufacturer_name_required',
        name: 'Manufacturer Name Required',
        description: 'Manufacturer must have a name specified',
        type: 'required',
        severity: 'error',
        category: 'technical',
        field: 'name',
        validate: (data: any) => {
          if (!data.name || data.name.trim().length === 0) {
            return {
              isValid: false,
              message: 'Manufacturer name is required',
              code: 'MANUFACTURER_NAME_REQUIRED'
            };
          }
          return { isValid: true, message: 'Manufacturer name valid' };
        }
      },
      {
        id: 'manufacturer_name_length',
        name: 'Manufacturer Name Length',
        description: 'Manufacturer name must be within reasonable length',
        type: 'custom',
        severity: 'error',
        category: 'technical',
        validate: (data: any) => {
          const name = data.name?.trim();
          if (!name) return { isValid: true, message: 'Name validation skipped' };
          
          if (name.length < 2) {
            return {
              isValid: false,
              message: 'Manufacturer name must be at least 2 characters long',
              code: 'MANUFACTURER_NAME_TOO_SHORT'
            };
          }

          if (name.length > 100) {
            return {
              isValid: false,
              message: 'Manufacturer name must be less than 100 characters',
              code: 'MANUFACTURER_NAME_TOO_LONG'
            };
          }

          return { isValid: true, message: 'Manufacturer name length valid' };
        }
      },
      {
        id: 'manufacturer_type_required',
        name: 'Manufacturer Type Required',
        description: 'Manufacturer must have a type specified',
        type: 'required',
        severity: 'error',
        category: 'technical',
        field: 'type',
        validate: (data: any) => {
          const validTypes = ['SOLAR_MODULE', 'INVERTER', 'BOTH'];
          if (!data.type || !validTypes.includes(data.type)) {
            return {
              isValid: false,
              message: `Manufacturer type must be one of: ${validTypes.join(', ')}`,
              code: 'MANUFACTURER_TYPE_INVALID'
            };
          }
          return { isValid: true, message: 'Manufacturer type valid' };
        }
      },
      {
        id: 'website_format',
        name: 'Website Format Validation',
        description: 'Website URL must be in valid format if provided',
        type: 'custom',
        severity: 'warning',
        category: 'technical',
        validate: (data: any) => {
          const website = data.website?.trim();
          if (!website) {
            return { isValid: true, message: 'Website not provided (optional)' };
          }

          try {
            const url = new URL(website);
            if (!['http:', 'https:'].includes(url.protocol)) {
              return {
                isValid: false,
                message: 'Website must use HTTP or HTTPS protocol',
                code: 'WEBSITE_PROTOCOL_INVALID'
              };
            }
            return { isValid: true, message: 'Website format valid' };
          } catch {
            return {
              isValid: false,
              message: 'Website URL format is invalid',
              code: 'WEBSITE_FORMAT_INVALID',
              suggestions: ['Use format: https://example.com']
            };
          }
        }
      },
      {
        id: 'email_format',
        name: 'Email Format Validation',
        description: 'Email must be in valid format if provided',
        type: 'custom',
        severity: 'warning',
        category: 'technical',
        validate: (data: any) => {
          const email = data.email?.trim();
          if (!email) {
            return { isValid: true, message: 'Email not provided (optional)' };
          }

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            return {
              isValid: false,
              message: 'Email format is invalid',
              code: 'EMAIL_FORMAT_INVALID',
              suggestions: ['Use format: contact@example.com']
            };
          }

          return { isValid: true, message: 'Email format valid' };
        }
      },
      {
        id: 'founded_year_range',
        name: 'Founded Year Range',
        description: 'Founded year must be within realistic range',
        type: 'custom',
        severity: 'warning',
        category: 'technical',
        validate: (data: any) => {
          const foundedYear = data.foundedYear;
          if (!foundedYear) {
            return { isValid: true, message: 'Founded year not provided (optional)' };
          }

          const currentYear = new Date().getFullYear();
          if (foundedYear < 1800 || foundedYear > currentYear) {
            return {
              isValid: false,
              message: `Founded year must be between 1800 and ${currentYear}`,
              code: 'FOUNDED_YEAR_OUT_OF_RANGE',
              suggestions: [`Current year: ${currentYear}`]
            };
          }

          return { isValid: true, message: 'Founded year valid' };
        }
      },
      {
        id: 'country_validation',
        name: 'Country Validation',
        description: 'Country must be a valid country name if provided',
        type: 'custom',
        severity: 'info',
        category: 'technical',
        validate: (data: any) => {
          const country = data.country?.trim();
          if (!country) {
            return { isValid: true, message: 'Country not provided (optional)' };
          }

          // Simple validation - check if country name is reasonable
          if (country.length < 2 || country.length > 50) {
            return {
              isValid: false,
              message: 'Country name must be between 2 and 50 characters',
              code: 'COUNTRY_NAME_INVALID'
            };
          }

          return { isValid: true, message: 'Country validation passed' };
        }
      }
    ]);
  }

  protected async validateBusinessRules(data: Manufacturer, context?: ValidationContext): Promise<ValidationResult> {
    // Check for duplicate manufacturer name
    if (context?.equipment && context.userRole !== 'admin') {
      // This would typically involve a database check
      // For now, we'll just validate the name format
      const name = data.name?.trim();
      if (!name) {
        return {
          isValid: false,
          message: 'Manufacturer name is required',
          code: 'NAME_REQUIRED'
        };
      }

      // Check for reasonable name format (no special characters except spaces, hyphens)
      const nameRegex = /^[a-zA-Z0-9\s\-&.]+$/;
      if (!nameRegex.test(name)) {
        return {
          isValid: false,
          message: 'Manufacturer name contains invalid characters',
          code: 'NAME_INVALID_CHARACTERS',
          suggestions: ['Use only letters, numbers, spaces, hyphens, and periods']
        };
      }
    }

    // Validate manufacturer type consistency with other data
    const typeValidation = this.validateManufacturerTypeConsistency(data);
    if (!typeValidation.isValid) {
      return typeValidation;
    }

    return {
      isValid: true,
      message: 'Business rules validation passed'
    };
  }

  private validateManufacturerTypeConsistency(data: Manufacturer): ValidationResult {
    const { type, website, description } = data;

    // Type-specific validations
    switch (type) {
      case 'SOLAR_MODULE':
        if (description && !description.toLowerCase().includes('module') && 
            !description.toLowerCase().includes('panel') && 
            !description.toLowerCase().includes('solar')) {
          return {
            isValid: false,
            message: 'Description for solar module manufacturer should mention modules, panels, or solar',
            code: 'DESCRIPTION_TYPE_MISMATCH',
            suggestions: ['Include terms like "solar modules", "PV panels", etc. in description']
          };
        }
        break;

      case 'INVERTER':
        if (description && !description.toLowerCase().includes('inverter') && 
            !description.toLowerCase().includes('power') && 
            !description.toLowerCase().includes('energy')) {
          return {
            isValid: false,
            message: 'Description for inverter manufacturer should mention inverters or power electronics',
            code: 'DESCRIPTION_TYPE_MISMATCH',
            suggestions: ['Include terms like "inverters", "power electronics", etc. in description']
          };
        }
        break;

      case 'BOTH':
        // No specific validation for BOTH type
        break;
    }

    return { isValid: true, message: 'Manufacturer type consistency validated' };
  }
}
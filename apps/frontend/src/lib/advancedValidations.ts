// Validações avançadas para sistemas fotovoltaicos

export interface ValidationRule {
  field: string;
  type: 'required' | 'min' | 'max' | 'range' | 'email' | 'phone' | 'cpf' | 'cnpj' | 'custom';
  value?: any;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  info: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  value?: any;
  suggestion?: string;
}

export class AdvancedValidator {
  
  // Validações específicas para sistemas fotovoltaicos
  static validatePVSystem(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const info: ValidationError[] = [];

    // Validação de dados do cliente
    const customerValidation = this.validateCustomerData(data.customer);
    errors.push(...customerValidation.errors);
    warnings.push(...customerValidation.warnings);

    // Validação do sistema
    const systemValidation = this.validateSystemParameters(data);
    errors.push(...systemValidation.errors);
    warnings.push(...systemValidation.warnings);
    info.push(...systemValidation.info);

    // Validação financeira
    const financialValidation = this.validateFinancialData(data);
    errors.push(...financialValidation.errors);
    warnings.push(...financialValidation.warnings);

    // Validação de localização
    const locationValidation = this.validateLocation(data);
    errors.push(...locationValidation.errors);
    warnings.push(...locationValidation.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      info
    };
  }

  private static validateCustomerData(customer: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (!customer) {
      errors.push({
        field: 'customer',
        message: 'Dados do cliente são obrigatórios',
        severity: 'error'
      });
      return { isValid: false, errors, warnings, info: [] };
    }

    // Nome obrigatório
    if (!customer.name || customer.name.trim().length < 2) {
      errors.push({
        field: 'customer.name',
        message: 'Nome do cliente deve ter pelo menos 2 caracteres',
        severity: 'error',
        suggestion: 'Digite o nome completo do cliente'
      });
    }

    // Validação de email
    if (customer.email && !this.isValidEmail(customer.email)) {
      errors.push({
        field: 'customer.email',
        message: 'Email inválido',
        severity: 'error',
        value: customer.email
      });
    }

    // Validação de telefone
    if (customer.phone && !this.isValidPhone(customer.phone)) {
      warnings.push({
        field: 'customer.phone',
        message: 'Formato de telefone pode estar incorreto',
        severity: 'warning',
        value: customer.phone,
        suggestion: 'Use formato: (11) 99999-9999'
      });
    }

    // Validação de CPF/CNPJ
    if (customer.document) {
      const cleanDoc = customer.document.replace(/\D/g, '');
      if (cleanDoc.length === 11 && !this.isValidCPF(cleanDoc)) {
        errors.push({
          field: 'customer.document',
          message: 'CPF inválido',
          severity: 'error',
          value: customer.document
        });
      } else if (cleanDoc.length === 14 && !this.isValidCNPJ(cleanDoc)) {
        errors.push({
          field: 'customer.document',
          message: 'CNPJ inválido',
          severity: 'error',
          value: customer.document
        });
      } else if (cleanDoc.length !== 11 && cleanDoc.length !== 14) {
        errors.push({
          field: 'customer.document',
          message: 'Documento deve ser um CPF (11 dígitos) ou CNPJ (14 dígitos)',
          severity: 'error',
          value: customer.document
        });
      }
    }

    return { isValid: errors.length === 0, errors, warnings, info: [] };
  }

  private static validateSystemParameters(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const info: ValidationError[] = [];

    // Validação de potência
    if (!data.potenciaModulo || data.potenciaModulo <= 0) {
      errors.push({
        field: 'potenciaModulo',
        message: 'Potência do módulo deve ser maior que zero',
        severity: 'error',
        suggestion: 'Valores típicos: 400W a 600W'
      });
    } else if (data.potenciaModulo < 300) {
      warnings.push({
        field: 'potenciaModulo',
        message: 'Potência do módulo muito baixa para padrões atuais',
        severity: 'warning',
        value: data.potenciaModulo,
        suggestion: 'Considere módulos de 400W ou superior'
      });
    } else if (data.potenciaModulo > 700) {
      warnings.push({
        field: 'potenciaModulo',
        message: 'Potência muito alta - verifique se está correta',
        severity: 'warning',
        value: data.potenciaModulo
      });
    }

    // Validação de número de módulos
    if (!data.numeroModulos || data.numeroModulos <= 0) {
      errors.push({
        field: 'numeroModulos',
        message: 'Número de módulos deve ser maior que zero',
        severity: 'error'
      });
    } else if (data.numeroModulos < 4) {
      warnings.push({
        field: 'numeroModulos',
        message: 'Sistema muito pequeno - verifique viabilidade',
        severity: 'warning',
        value: data.numeroModulos
      });
    } else if (data.numeroModulos > 100) {
      info.push({
        field: 'numeroModulos',
        message: 'Sistema de grande porte - considere regulamentações específicas',
        severity: 'info',
        value: data.numeroModulos
      });
    }

    // Validação de eficiência
    if (data.eficienciaSistema) {
      if (data.eficienciaSistema < 70) {
        warnings.push({
          field: 'eficienciaSistema',
          message: 'Eficiência muito baixa - verifique perdas do sistema',
          severity: 'warning',
          value: data.eficienciaSistema,
          suggestion: 'Eficiência típica: 80-90%'
        });
      } else if (data.eficienciaSistema > 95) {
        warnings.push({
          field: 'eficienciaSistema',
          message: 'Eficiência muito alta - verifique se está realista',
          severity: 'warning',
          value: data.eficienciaSistema
        });
      }
    }

    // Validação de inclinação e azimute
    if (data.inclinacao !== undefined) {
      if (data.inclinacao < 0 || data.inclinacao > 90) {
        errors.push({
          field: 'inclinacao',
          message: 'Inclinação deve estar entre 0° e 90°',
          severity: 'error',
          value: data.inclinacao
        });
      } else if (data.latitude && Math.abs(data.inclinacao - Math.abs(data.latitude)) > 15) {
        warnings.push({
          field: 'inclinacao',
          message: 'Inclinação pode não ser ótima para a latitude',
          severity: 'warning',
          value: data.inclinacao,
          suggestion: `Considere ${Math.abs(data.latitude).toFixed(0)}° (latitude local)`
        });
      }
    }

    if (data.azimute !== undefined) {
      if (data.azimute < 0 || data.azimute > 360) {
        errors.push({
          field: 'azimute',
          message: 'Azimute deve estar entre 0° e 360°',
          severity: 'error',
          value: data.azimute
        });
      } else if (Math.abs(data.azimute - 180) > 30) {
        warnings.push({
          field: 'azimute',
          message: 'Azimute distante do Sul (180°) pode reduzir eficiência',
          severity: 'warning',
          value: data.azimute,
          suggestion: 'Orientação Sul (180°) é ideal'
        });
      }
    }

    // Validação de sombreamento
    if (data.sombreamento && Array.isArray(data.sombreamento)) {
      const avgShading = data.sombreamento.reduce((a: number, b: number) => a + b, 0) / 12;
      if (avgShading > 20) {
        warnings.push({
          field: 'sombreamento',
          message: 'Alto nível de sombreamento pode impactar significativamente a geração',
          severity: 'warning',
          value: `${avgShading.toFixed(1)}%`,
          suggestion: 'Considere otimizadores ou microinversores'
        });
      }
    }

    return { isValid: errors.length === 0, errors, warnings, info };
  }

  private static validateFinancialData(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validação de custos
    if (data.custoEquipamento !== undefined && data.custoEquipamento < 0) {
      errors.push({
        field: 'custoEquipamento',
        message: 'Custo dos equipamentos não pode ser negativo',
        severity: 'error'
      });
    }

    if (data.custoMateriais !== undefined && data.custoMateriais < 0) {
      errors.push({
        field: 'custoMateriais',
        message: 'Custo dos materiais não pode ser negativo',
        severity: 'error'
      });
    }

    if (data.custoMaoDeObra !== undefined && data.custoMaoDeObra < 0) {
      errors.push({
        field: 'custoMaoDeObra',
        message: 'Custo da mão de obra não pode ser negativo',
        severity: 'error'
      });
    }

    // Validação de tarifa
    if (data.tarifaEnergiaB) {
      if (data.tarifaEnergiaB < 0.3 || data.tarifaEnergiaB > 2.0) {
        warnings.push({
          field: 'tarifaEnergiaB',
          message: 'Tarifa fora do range típico brasileiro',
          severity: 'warning',
          value: data.tarifaEnergiaB,
          suggestion: 'Verifique valores com a distribuidora local'
        });
      }
    }

    // Validação de BDI
    if (data.bdi !== undefined) {
      if (data.bdi < 0 || data.bdi > 50) {
        warnings.push({
          field: 'bdi',
          message: 'BDI fora do range típico (15-35%)',
          severity: 'warning',
          value: data.bdi,
          suggestion: 'BDI típico: 20-30%'
        });
      }
    }

    // Validação de taxa de desconto
    if (data.taxaDesconto !== undefined) {
      if (data.taxaDesconto < 3 || data.taxaDesconto > 20) {
        warnings.push({
          field: 'taxaDesconto',
          message: 'Taxa de desconto fora do range típico',
          severity: 'warning',
          value: data.taxaDesconto,
          suggestion: 'Taxa típica: 8-12% a.a.'
        });
      }
    }

    return { isValid: errors.length === 0, errors, warnings, info: [] };
  }

  private static validateLocation(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validação de coordenadas
    if (data.latitude !== undefined) {
      if (data.latitude < -34 || data.latitude > 6) {
        warnings.push({
          field: 'latitude',
          message: 'Latitude fora do território brasileiro',
          severity: 'warning',
          value: data.latitude,
          suggestion: 'Verifique se as coordenadas estão corretas'
        });
      }
    }

    if (data.longitude !== undefined) {
      if (data.longitude < -74 || data.longitude > -28) {
        warnings.push({
          field: 'longitude',
          message: 'Longitude fora do território brasileiro',
          severity: 'warning',
          value: data.longitude,
          suggestion: 'Verifique se as coordenadas estão corretas'
        });
      }
    }

    // Validação de irradiação
    if (data.irradiacaoMensal && Array.isArray(data.irradiacaoMensal)) {
      const avgIrradiation = data.irradiacaoMensal.reduce((a: number, b: number) => a + b, 0) / 12;
      if (avgIrradiation < 3.5) {
        warnings.push({
          field: 'irradiacaoMensal',
          message: 'Baixa irradiação solar - viabilidade pode ser questionável',
          severity: 'warning',
          value: `${avgIrradiation.toFixed(2)} kWh/m²/dia`,
          suggestion: 'Verifique dados de irradiação para a região'
        });
      } else if (avgIrradiation > 7.0) {
        warnings.push({
          field: 'irradiacaoMensal',
          message: 'Irradiação muito alta - verifique dados',
          severity: 'warning',
          value: `${avgIrradiation.toFixed(2)} kWh/m²/dia`
        });
      }
    }

    return { isValid: errors.length === 0, errors, warnings, info: [] };
  }

  // Utilities de validação
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static isValidPhone(phone: string): boolean {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
  }

  private static isValidCPF(cpf: string): boolean {
    // Implementação simplificada - em produção usar biblioteca específica
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
      return false;
    }

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    return remainder === parseInt(cpf.charAt(10));
  }

  private static isValidCNPJ(cnpj: string): boolean {
    // Implementação simplificada - em produção usar biblioteca específica
    if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) {
      return false;
    }

    let length = cnpj.length - 2;
    let numbers = cnpj.substring(0, length);
    const digits = cnpj.substring(length);
    let sum = 0;
    let pos = length - 7;

    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    length = length + 1;
    numbers = cnpj.substring(0, length);
    sum = 0;
    pos = length - 7;

    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return result === parseInt(digits.charAt(1));
  }

  // Validação de compatibilidade de equipamentos
  static validateEquipmentCompatibility(modules: any[], inverters: any[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const info: ValidationError[] = [];

    if (!modules.length || !inverters.length) {
      return { isValid: true, errors, warnings, info };
    }

    for (const inverter of inverters) {
      for (const module of modules) {
        // Verificar compatibilidade de tensão
        if (module.vmpp && inverter.faixaMppt) {
          const mpptRange = this.parseMpptRange(inverter.faixaMppt);
          if (mpptRange && (module.vmpp < mpptRange.min || module.vmpp > mpptRange.max)) {
            warnings.push({
              field: 'equipment',
              message: `Tensão de máxima potência (VmP) do módulo ${module.modelo} pode estar fora da faixa do inversor ${inverter.modelo}`,
              severity: 'warning',
              suggestion: 'Verifique configuração de strings'
            });
          }
        }

        // Verificar proporção AC/DC
        if (module.potenciaNominal && inverter.potenciaSaidaCA) {
          const dcPower = module.potenciaNominal * (module.quantity || 1);
          const acPower = inverter.potenciaSaidaCA;
          const ratio = dcPower / acPower;
          
          if (ratio < 1.1) {
            warnings.push({
              field: 'equipment',
              message: 'Razão DC/AC baixa - sistema pode estar superdimensionado',
              severity: 'warning',
              value: `${ratio.toFixed(2)}:1`,
              suggestion: 'Considere reduzir potência AC ou aumentar DC'
            });
          } else if (ratio > 1.4) {
            warnings.push({
              field: 'equipment',
              message: 'Razão DC/AC alta - possível limitação de potência',
              severity: 'warning',
              value: `${ratio.toFixed(2)}:1`,
              suggestion: 'Considere aumentar potência AC ou reduzir DC'
            });
          }
        }
      }
    }

    return { isValid: errors.length === 0, errors, warnings, info };
  }

  private static parseMpptRange(mpptRange: string): { min: number; max: number } | null {
    const match = mpptRange.match(/(\d+)-(\d+)V?/);
    if (match) {
      return {
        min: parseInt(match[1]),
        max: parseInt(match[2])
      };
    }
    return null;
  }

  // Validação de consumo vs geração
  static validateEnergyBalance(consumption: number[], generation: number[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const info: ValidationError[] = [];

    if (consumption.length !== 12 || generation.length !== 12) {
      errors.push({
        field: 'energyBalance',
        message: 'Dados mensais incompletos',
        severity: 'error'
      });
      return { isValid: false, errors, warnings, info };
    }

    const totalConsumption = consumption.reduce((a, b) => a + b, 0);
    const totalGeneration = generation.reduce((a, b) => a + b, 0);
    const ratio = totalGeneration / totalConsumption;

    if (ratio < 0.8) {
      warnings.push({
        field: 'energyBalance',
        message: 'Geração insuficiente - sistema não cobrirá todo o consumo',
        severity: 'warning',
        value: `${(ratio * 100).toFixed(1)}%`,
        suggestion: 'Considere aumentar a potência do sistema'
      });
    } else if (ratio > 1.3) {
      info.push({
        field: 'energyBalance',
        message: 'Sistema superdimensionado - excesso significativo de geração',
        severity: 'info',
        value: `${(ratio * 100).toFixed(1)}%`,
        suggestion: 'Avalie redução do sistema ou expansão do consumo'
      });
    }

    // Análise mensal
    let monthsWithDeficit = 0;
    let monthsWithSurplus = 0;

    for (let i = 0; i < 12; i++) {
      if (generation[i] < consumption[i] * 0.8) {
        monthsWithDeficit++;
      } else if (generation[i] > consumption[i] * 1.2) {
        monthsWithSurplus++;
      }
    }

    if (monthsWithDeficit > 3) {
      warnings.push({
        field: 'energyBalance',
        message: `Sistema com déficit em ${monthsWithDeficit} meses`,
        severity: 'warning',
        suggestion: 'Considere ajustar dimensionamento ou padrão de consumo'
      });
    }

    return { isValid: errors.length === 0, errors, warnings, info };
  }
}
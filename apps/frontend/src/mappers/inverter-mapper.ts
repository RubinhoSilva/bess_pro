import { Inverter, Manufacturer, Status } from '@bess-pro/shared';
import { InverterFormData } from '@/validations/equipment/inverter-validation';

/**
 * Converte dados do formulário de inversor para o tipo Inverter completo
 * Mantém type safety e estrutura aninhada esperada pela store
 */

export const createInverterFromFormData = (
  formData: InverterFormData,
  manufacturer: Manufacturer
): Omit<Inverter, 'id' | 'createdAt' | 'updatedAt'> => {
  return {
    manufacturer,
    model: formData.model,
    power: {
      ratedACPower: formData.ratedACPower,
      maxPVPower: formData.maxPVPower,
      ratedDCPower: formData.ratedDCPower,
      shortCircuitVoltageMax: formData.shortCircuitVoltageMax,
      maxInputCurrent: formData.maxInputCurrent,
      maxApparentPower: formData.maxApparentPower,
    },
    mppt: {
      numberOfMppts: formData.numberOfMppts,
      stringsPerMppt: formData.stringsPerMppt,
    },
    electrical: {
      maxEfficiency: formData.maxEfficiency,
      gridType: formData.gridType,
      ratedVoltage: formData.ratedVoltage,
      frequency: formData.frequency,
      powerFactor: formData.powerFactor,
    },
    metadata: {
      price: formData.price,
      currency: formData.currency,
      productCode: formData.productCode,
      datasheetUrl: formData.datasheetUrl,
      imageUrl: formData.imageUrl,
      certifications: formData.certifications,
      warranty: formData.warranty,
      connectionType: formData.connectionType,
      countryOfOrigin: formData.countryOfOrigin,
    },
    status: 'active' as Status,
    isPublic: formData.isPublic,
  };
};

/**
 * Converte dados do formulário para atualização parcial de inversor
 * Retorna um objeto com os campos que podem ser atualizados via API
 * Nota: Como os campos do Inverter são readonly, esta função é para API calls
 */
export const createInverterUpdateFromFormData = (
  formData: Partial<InverterFormData>
): Record<string, any> => {
  const update: Record<string, any> = {};

  // Campos principais
  if (formData.model !== undefined) update.model = formData.model;
  if (formData.isPublic !== undefined) update.isPublic = formData.isPublic;

  // Configuração de potência
  const power: Record<string, any> = {};
  if (formData.ratedACPower !== undefined) power.ratedACPower = formData.ratedACPower;
  if (formData.maxPVPower !== undefined) power.maxPVPower = formData.maxPVPower;
  if (formData.ratedDCPower !== undefined) power.ratedDCPower = formData.ratedDCPower;
  if (formData.shortCircuitVoltageMax !== undefined) power.shortCircuitVoltageMax = formData.shortCircuitVoltageMax;
  if (formData.maxInputCurrent !== undefined) power.maxInputCurrent = formData.maxInputCurrent;
  if (formData.maxApparentPower !== undefined) power.maxApparentPower = formData.maxApparentPower;
  if (Object.keys(power).length > 0) update.power = power;

  // Configuração MPPT
  const mppt: Record<string, any> = {};
  if (formData.numberOfMppts !== undefined) mppt.numberOfMppts = formData.numberOfMppts;
  if (formData.stringsPerMppt !== undefined) mppt.stringsPerMppt = formData.stringsPerMppt;
  if (Object.keys(mppt).length > 0) update.mppt = mppt;

  // Especificações elétricas
  const electrical: Record<string, any> = {};
  if (formData.maxEfficiency !== undefined) electrical.maxEfficiency = formData.maxEfficiency;
  if (formData.gridType !== undefined) electrical.gridType = formData.gridType;
  if (formData.ratedVoltage !== undefined) electrical.ratedVoltage = formData.ratedVoltage;
  if (formData.frequency !== undefined) electrical.frequency = formData.frequency;
  if (formData.powerFactor !== undefined) electrical.powerFactor = formData.powerFactor;
  if (Object.keys(electrical).length > 0) update.electrical = electrical;

  // Metadados
  const metadata: Record<string, any> = {};
  if (formData.price !== undefined) metadata.price = formData.price;
  if (formData.currency !== undefined) metadata.currency = formData.currency;
  if (formData.productCode !== undefined) metadata.productCode = formData.productCode;
  if (formData.datasheetUrl !== undefined) metadata.datasheetUrl = formData.datasheetUrl;
  if (formData.imageUrl !== undefined) metadata.imageUrl = formData.imageUrl;
  if (formData.certifications !== undefined) metadata.certifications = formData.certifications;
  if (formData.warranty !== undefined) metadata.warranty = formData.warranty;
  if (formData.connectionType !== undefined) metadata.connectionType = formData.connectionType;
  if (formData.countryOfOrigin !== undefined) metadata.countryOfOrigin = formData.countryOfOrigin;
  if (Object.keys(metadata).length > 0) update.metadata = metadata;

  return update;
};

/**
 * Valida se todos os campos obrigatórios estão presentes para criação
 */
export const validateInverterFormData = (formData: InverterFormData): string[] => {
  const errors: string[] = [];

  if (!formData.manufacturerId) errors.push('Fabricante é obrigatório');
  if (!formData.model) errors.push('Modelo é obrigatório');
  if (!formData.ratedACPower || formData.ratedACPower <= 0) errors.push('Potência AC nominal é obrigatória');
  if (!formData.maxPVPower || formData.maxPVPower <= 0) errors.push('Potência máxima PV é obrigatória');
  if (!formData.shortCircuitVoltageMax || formData.shortCircuitVoltageMax <= 0) errors.push('Tensão máxima de curto-circuito é obrigatória');
  if (!formData.maxInputCurrent || formData.maxInputCurrent <= 0) errors.push('Corrente máxima de entrada é obrigatória');
  if (!formData.maxApparentPower || formData.maxApparentPower <= 0) errors.push('Potência aparente máxima é obrigatória');
  if (!formData.numberOfMppts || formData.numberOfMppts <= 0) errors.push('Número de MPPTs é obrigatório');
  if (!formData.stringsPerMppt || formData.stringsPerMppt <= 0) errors.push('Strings por MPPT é obrigatório');
  if (!formData.maxEfficiency || formData.maxEfficiency <= 0 || formData.maxEfficiency > 100) {
    errors.push('Eficiência máxima deve estar entre 0 e 100');
  }
  if (!formData.gridType) errors.push('Tipo de rede é obrigatório');

  return errors;
};
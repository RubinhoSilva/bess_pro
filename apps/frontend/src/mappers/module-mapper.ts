import { SolarModule, Manufacturer, Status } from '@bess-pro/shared';
import { ModuleFormData } from '@/validations/equipment/module-validation';

/**
 * Converte dados do formulário de módulo para o tipo SolarModule completo
 * Mantém type safety e estrutura aninhada esperada pela store
 */

export const createModuleFromFormData = (
  formData: ModuleFormData,
  manufacturer: Manufacturer
): Omit<SolarModule, 'id' | 'createdAt' | 'updatedAt'> => {
  return {
    manufacturer,
    model: formData.model,
    nominalPower: formData.nominalPower,
    specifications: {
      vmpp: formData.vmpp,
      impp: formData.impp,
      voc: formData.voc,
      isc: formData.isc,
      efficiency: formData.efficiency,
      cellType: formData.cellType,
      numberOfCells: formData.numberOfCells,
      technology: formData.technology,
    },
    parameters: {
      temperature: {
        tempCoeffPmax: formData.tempCoeffPmax || 0,
        tempCoeffVoc: formData.tempCoeffVoc || 0,
        tempCoeffIsc: formData.tempCoeffIsc || 0,
      },
      diode: {
        aRef: formData.aRef || 0,
        iLRef: formData.iLRef || 0,
        iORef: formData.iORef || 0,
        rShRef: formData.rShRef || 0,
        rS: formData.rS || 0,
      },
      sapm: {
        a4: formData.a4,
        a3: formData.a3,
        a2: formData.a2,
        a1: formData.a1,
        a0: formData.a0,
        b4: formData.b4,
        b3: formData.b3,
        b2: formData.b2,
        b1: formData.b1,
        b0: formData.b0,
        fd: formData.fd,
      },
      spectral: {
        am: formData.am,
      },
      advanced: {
        alphaSc: formData.alphaSc || 0,
        betaOc: formData.betaOc || 0,
        gammaR: formData.gammaR || 0,
      },
    },
    dimensions: {
      widthMm: formData.widthMm,
      heightMm: formData.heightMm,
      thicknessMm: formData.thicknessMm || 0,
      weightKg: formData.weightKg,
      areaM2: formData.areaM2,
    },
    metadata: {
      price: formData.price,
      currency: formData.currency,
      productCode: formData.productCode,
      datasheetUrl: formData.datasheetUrl,
      imageUrl: formData.imageUrl,
      certifications: formData.certifications,
      warranty: formData.warranty,
      countryOfOrigin: formData.countryOfOrigin,
      assuranceYears: formData.assuranceYears,
    },
    status: 'active' as Status,
    isPublic: formData.isPublic,
  };
};

/**
 * Converte dados do formulário para atualização parcial de módulo
 * Retorna um objeto com os campos que podem ser atualizados via API
 * Nota: Como os campos do SolarModule são readonly, esta função é para API calls
 */
export const createModuleUpdateFromFormData = (
  formData: Partial<ModuleFormData>
): Record<string, any> => {
  const update: Record<string, any> = {};

  // Campos principais
  if (formData.model !== undefined) update.model = formData.model;
  if (formData.nominalPower !== undefined) update.nominalPower = formData.nominalPower;
  if (formData.isPublic !== undefined) update.isPublic = formData.isPublic;

  // Especificações
  const specs: Record<string, any> = {};
  if (formData.vmpp !== undefined) specs.vmpp = formData.vmpp;
  if (formData.impp !== undefined) specs.impp = formData.impp;
  if (formData.voc !== undefined) specs.voc = formData.voc;
  if (formData.isc !== undefined) specs.isc = formData.isc;
  if (formData.efficiency !== undefined) specs.efficiency = formData.efficiency;
  if (formData.cellType !== undefined) specs.cellType = formData.cellType;
  if (formData.numberOfCells !== undefined) specs.numberOfCells = formData.numberOfCells;
  if (formData.technology !== undefined) specs.technology = formData.technology;
  if (Object.keys(specs).length > 0) update.specifications = specs;

  // Parâmetros de temperatura
  const temp: Record<string, any> = {};
  if (formData.tempCoeffPmax !== undefined) temp.tempCoeffPmax = formData.tempCoeffPmax;
  if (formData.tempCoeffVoc !== undefined) temp.tempCoeffVoc = formData.tempCoeffVoc;
  if (formData.tempCoeffIsc !== undefined) temp.tempCoeffIsc = formData.tempCoeffIsc;
  if (Object.keys(temp).length > 0) {
    update.parameters = { ...update.parameters, temperature: temp };
  }

  // Parâmetros do diodo
  const diode: Record<string, any> = {};
  if (formData.aRef !== undefined) diode.aRef = formData.aRef;
  if (formData.iLRef !== undefined) diode.iLRef = formData.iLRef;
  if (formData.iORef !== undefined) diode.iORef = formData.iORef;
  if (formData.rShRef !== undefined) diode.rShRef = formData.rShRef;
  if (formData.rS !== undefined) diode.rS = formData.rS;
  if (Object.keys(diode).length > 0) {
    update.parameters = { ...update.parameters, diode };
  }

  // Dimensões
  const dimensions: Record<string, any> = {};
  if (formData.widthMm !== undefined) dimensions.widthMm = formData.widthMm;
  if (formData.heightMm !== undefined) dimensions.heightMm = formData.heightMm;
  if (formData.thicknessMm !== undefined) dimensions.thicknessMm = formData.thicknessMm;
  if (formData.weightKg !== undefined) dimensions.weightKg = formData.weightKg;
  if (formData.areaM2 !== undefined) dimensions.areaM2 = formData.areaM2;
  if (Object.keys(dimensions).length > 0) update.dimensions = dimensions;

  // Metadados
  const metadata: Record<string, any> = {};
  if (formData.price !== undefined) metadata.price = formData.price;
  if (formData.currency !== undefined) metadata.currency = formData.currency;
  if (formData.productCode !== undefined) metadata.productCode = formData.productCode;
  if (formData.datasheetUrl !== undefined) metadata.datasheetUrl = formData.datasheetUrl;
  if (formData.imageUrl !== undefined) metadata.imageUrl = formData.imageUrl;
  if (formData.certifications !== undefined) metadata.certifications = formData.certifications;
  if (formData.warranty !== undefined) metadata.warranty = formData.warranty;
  if (formData.countryOfOrigin !== undefined) metadata.countryOfOrigin = formData.countryOfOrigin;
  if (formData.assuranceYears !== undefined) metadata.assuranceYears = formData.assuranceYears;
  if (Object.keys(metadata).length > 0) update.metadata = metadata;

  return update;
};

/**
 * Valida se todos os campos obrigatórios estão presentes para criação
 */
export const validateModuleFormData = (formData: ModuleFormData): string[] => {
  const errors: string[] = [];

  if (!formData.manufacturerId) errors.push('Fabricante é obrigatório');
  if (!formData.model) errors.push('Modelo é obrigatório');
  if (!formData.nominalPower || formData.nominalPower <= 0) errors.push('Potência nominal é obrigatória');
  if (!formData.voc || formData.voc <= 0) errors.push('Tensão VOC é obrigatória');
  if (!formData.isc || formData.isc <= 0) errors.push('Corrente ISC é obrigatória');
  if (!formData.cellType) errors.push('Tipo de célula é obrigatório');
  if (!formData.technology) errors.push('Tecnologia é obrigatória');
  if (!formData.widthMm || formData.widthMm <= 0) errors.push('Largura é obrigatória');
  if (!formData.heightMm || formData.heightMm <= 0) errors.push('Altura é obrigatória');
  if (!formData.weightKg || formData.weightKg <= 0) errors.push('Peso é obrigatório');
  if (!formData.areaM2 || formData.areaM2 <= 0) errors.push('Área é obrigatória');

  return errors;
};
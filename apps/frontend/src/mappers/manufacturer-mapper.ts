import { Manufacturer, Status } from '@bess-pro/shared';
import { ManufacturerFormData } from '@/validations/equipment/manufacturer-validation';

/**
 * Converte dados do formulário de fabricante para o tipo Manufacturer completo
 * Mantém type safety e estrutura aninhada esperada pela store
 */

export const createManufacturerFromFormData = (
  formData: ManufacturerFormData
): Omit<Manufacturer, 'id' | 'createdAt' | 'updatedAt'> => {
  return {
    name: formData.name,
    type: (formData.type === 'solar_module' ? 'SOLAR_MODULE' : 
            formData.type === 'inverter' ? 'INVERTER' : 'BOTH') as any,
    description: formData.description,
    website: formData.website,
    contact: {
      email: formData.email,
      phone: formData.phone,
      address: formData.address || formData.street || formData.city ? {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postalCode: formData.postalCode,
      } : undefined,
      supportEmail: formData.supportEmail,
      supportPhone: formData.supportPhone,
    },
    business: {
      foundedYear: formData.foundedYear,
      headquarters: formData.headquarters,
      employeeCount: formData.employeeCount,
      revenue: formData.revenue,
      stockTicker: formData.stockTicker,
      parentCompany: formData.parentCompany,
    },
    certifications: formData.certifications,
    metadata: {
      logoUrl: formData.logoUrl,
      imageUrl: formData.imageUrl,
      brochureUrl: formData.brochureUrl,
      socialMedia: {
        linkedin: formData.linkedin,
        twitter: formData.twitter,
        facebook: formData.facebook,
        youtube: formData.youtube,
      },
      specialties: formData.specialties,
      markets: formData.markets,
      qualityStandards: formData.qualityStandards,
    },
    status: 'active' as Status,
  };
};

/**
 * Converte dados do formulário para atualização parcial de fabricante
 * Retorna um objeto com os campos que podem ser atualizados via API
 * Nota: Como os campos do Manufacturer são readonly, esta função é para API calls
 */
export const createManufacturerUpdateFromFormData = (
  formData: Partial<ManufacturerFormData>
): Record<string, any> => {
  const update: Record<string, any> = {};

  // Campos principais
  if (formData.name !== undefined) update.name = formData.name;
  if (formData.description !== undefined) update.description = formData.description;
  if (formData.website !== undefined) update.website = formData.website;

  // Contato
  const contact: Record<string, any> = {};
  if (formData.email !== undefined) contact.email = formData.email;
  if (formData.phone !== undefined) contact.phone = formData.phone;
  if (formData.supportEmail !== undefined) contact.supportEmail = formData.supportEmail;
  if (formData.supportPhone !== undefined) contact.supportPhone = formData.supportPhone;
  
  // Endereço
  const address: Record<string, any> = {};
  if (formData.street !== undefined) address.street = formData.street;
  if (formData.city !== undefined) address.city = formData.city;
  if (formData.state !== undefined) address.state = formData.state;
  if (formData.country !== undefined) address.country = formData.country;
  if (formData.postalCode !== undefined) address.postalCode = formData.postalCode;
  if (Object.keys(address).length > 0) contact.address = address;
  
  if (Object.keys(contact).length > 0) update.contact = contact;

  // Informações comerciais
  const business: Record<string, any> = {};
  if (formData.foundedYear !== undefined) business.foundedYear = formData.foundedYear;
  if (formData.headquarters !== undefined) business.headquarters = formData.headquarters;
  if (formData.employeeCount !== undefined) business.employeeCount = formData.employeeCount;
  if (formData.revenue !== undefined) business.revenue = formData.revenue;
  if (formData.stockTicker !== undefined) business.stockTicker = formData.stockTicker;
  if (formData.parentCompany !== undefined) business.parentCompany = formData.parentCompany;
  if (Object.keys(business).length > 0) update.business = business;

  // Certificações
  if (formData.certifications !== undefined) update.certifications = formData.certifications;

  // Metadados
  const metadata: Record<string, any> = {};
  if (formData.logoUrl !== undefined) metadata.logoUrl = formData.logoUrl;
  if (formData.imageUrl !== undefined) metadata.imageUrl = formData.imageUrl;
  if (formData.brochureUrl !== undefined) metadata.brochureUrl = formData.brochureUrl;
  
  // Redes sociais
  const socialMedia: Record<string, any> = {};
  if (formData.linkedin !== undefined) socialMedia.linkedin = formData.linkedin;
  if (formData.twitter !== undefined) socialMedia.twitter = formData.twitter;
  if (formData.facebook !== undefined) socialMedia.facebook = formData.facebook;
  if (formData.youtube !== undefined) socialMedia.youtube = formData.youtube;
  if (Object.keys(socialMedia).length > 0) metadata.socialMedia = socialMedia;
  
  if (formData.specialties !== undefined) metadata.specialties = formData.specialties;
  if (formData.markets !== undefined) metadata.markets = formData.markets;
  if (formData.qualityStandards !== undefined) metadata.qualityStandards = formData.qualityStandards;
  if (Object.keys(metadata).length > 0) update.metadata = metadata;

  return update;
};

/**
 * Valida se todos os campos obrigatórios estão presentes para criação
 */
export const validateManufacturerFormData = (formData: ManufacturerFormData): string[] => {
  const errors: string[] = [];

  if (!formData.name) errors.push('Nome do fabricante é obrigatório');
  if (!formData.type) errors.push('Tipo de fabricante é obrigatório');

  return errors;
};
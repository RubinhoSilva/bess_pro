import { ModuleSpecifications, ModuleParameters, ModuleDimensions, ModuleMetadata } from './module.types';

// ============= MODULE REQUEST TYPES =============

export interface CreateModuleRequest {
  manufacturer: string;
  model: string;
  nominalPower: number;
  specifications: Omit<ModuleSpecifications, 'efficiency'> & { efficiency?: number };
  parameters: ModuleParameters;
  dimensions: Omit<ModuleDimensions, 'areaM2'>;
  metadata: Omit<ModuleMetadata, 'manufacturerId'>;
}

export interface UpdateModuleRequest extends Partial<CreateModuleRequest> {
  id: string;
}

export interface DeleteModuleRequest {
  id: string;
}
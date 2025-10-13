import { ModuleSpecifications, ModuleParameters, ModuleDimensions, ModuleMetadata } from './module.types';

// ============= MODULE REQUEST TYPES =============

export interface CreateModuleRequest {
  manufacturer: string; // Agora é o manufacturerId
  model: string;
  nominalPower: number;
  specifications: Omit<ModuleSpecifications, 'efficiency'> & { efficiency?: number };
  parameters: ModuleParameters;
  dimensions: Omit<ModuleDimensions, 'areaM2'>;
  metadata: Omit<ModuleMetadata, 'manufacturerId'>;
  teamId: string; // Team ID for ownership
}

export interface UpdateModuleRequest extends Partial<CreateModuleRequest> {
  id: string;
}

export interface DeleteModuleRequest {
  id: string;
}
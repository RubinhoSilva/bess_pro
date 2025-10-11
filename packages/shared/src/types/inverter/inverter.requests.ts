import { InverterPower, MPPTConfiguration, ElectricalSpecifications, InverterMetadata } from './inverter.types';
import { Manufacturer } from '../manufacturer';

// ============= INVERTER REQUEST TYPES =============

export interface CreateInverterRequest {
  manufacturer: Manufacturer;
  model: string;
  power: InverterPower;
  mppt: MPPTConfiguration;
  electrical: ElectricalSpecifications;
  metadata: Omit<InverterMetadata, 'manufacturerId'>;
}

export interface UpdateInverterRequest extends Partial<CreateInverterRequest> {
  id: string;
}

export interface DeleteInverterRequest {
  id: string;
}
import { InverterPower, MPPTConfiguration, ElectricalSpecifications, InverterMetadata } from './inverter.types';
import { Manufacturer } from '../manufacturer';

// ============= INVERTER REQUEST TYPES =============

export interface CreateInverterRequest {
  manufacturerId: string;
  model: string;
  power: InverterPower;
  mppt: MPPTConfiguration;
  electrical: ElectricalSpecifications;
  metadata: Omit<InverterMetadata, 'manufacturerId'> & { manufacturerId?: string };
}

export interface UpdateInverterRequest extends Partial<CreateInverterRequest> {
  id: string;
}

export interface DeleteInverterRequest {
  id: string;
}
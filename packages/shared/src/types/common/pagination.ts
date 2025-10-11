import { PaginatedResponse } from '../common';
import { Inverter } from '../inverter';
import { SolarModule } from '../module';
import { Manufacturer } from '../manufacturer';

export interface PaginatedInverters extends PaginatedResponse<Inverter> {}
export interface PaginatedModules extends PaginatedResponse<SolarModule> {}
export interface PaginatedManufacturers extends PaginatedResponse<Manufacturer> {}
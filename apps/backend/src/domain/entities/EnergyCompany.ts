export interface EnergyCompany {
  id: string;
  name: string;
  acronym: string; // Ex: CPFL, Enel, Eletropaulo
  region: string; // Estado ou região de atuação
  states: string[]; // Estados onde atua
  tariffB1?: number; // Tarifa B1 residencial (R$/kWh)
  tariffB3?: number; // Tarifa B3 rural (R$/kWh)  
  tariffC?: number; // Tarifa Comercial (R$/kWh)
  wireB?: number; // Custo do fio B (R$/kWh)
  distributionCharge?: number; // Taxa de distribuição
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
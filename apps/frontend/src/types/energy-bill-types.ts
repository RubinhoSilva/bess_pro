// Tipos especializados para contas de energia por grupo tarifário

export interface EnergyBillB {
  id: string;
  name: string;
  consumoMensal: number[];
}

export interface EnergyBillA {
  id: string;
  name: string;
  consumoMensalPonta: number[];
  consumoMensalForaPonta: number[];
}

// Type guards para identificação segura
export function isEnergyBillA(bill: any): bill is EnergyBillA {
  return bill && 
         Array.isArray(bill.consumoMensalPonta) && 
         Array.isArray(bill.consumoMensalForaPonta);
}

export function isEnergyBillB(bill: any): bill is EnergyBillB {
  return bill && 
         Array.isArray(bill.consumoMensal) && 
         !isEnergyBillA(bill);
}

// Validações
export function validateEnergyBillA(bill: EnergyBillA): boolean {
  return bill.consumoMensalPonta.length === 12 && 
         bill.consumoMensalForaPonta.length === 12 &&
         bill.consumoMensalPonta.every(v => typeof v === 'number' && v >= 0) &&
         bill.consumoMensalForaPonta.every(v => typeof v === 'number' && v >= 0);
}

export function validateEnergyBillB(bill: EnergyBillB): boolean {
  return bill.consumoMensal.length === 12 &&
         bill.consumoMensal.every(v => typeof v === 'number' && v >= 0);
}

// Utilitários de criação
export function createEnergyBillA(data: Omit<EnergyBillA, 'id'>): EnergyBillA {
  return {
    id: crypto.randomUUID(),
    ...data
  };
}

export function createEnergyBillB(data: Omit<EnergyBillB, 'id'>): EnergyBillB {
  return {
    id: crypto.randomUUID(),
    ...data
  };
}
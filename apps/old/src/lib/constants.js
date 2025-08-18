export const initialFormData = {
  grupoTarifario: 'A',
  consumoPonta: 1000,
  consumoForaPonta: 0,
  horasPonta: 3,
  diasMes: 22,
  tarifaPonta: 0.85,
  tarifaForaPonta: 0.45,
  demandaPonta: 45.0,
  demandaContratada: 500,
  consumoMensal: Array(12).fill({ ponta: 1000, foraPonta: 5000 }),

  potenciaBateriaW: 250000,
  dod: 90,
  fatorPerdas: 90,
  tensaoBateria: 400,
  correnteBateria: 1250,
  custoImplantacaoBess: 2500000,

  potenciaGeradorKva: 250,
  fatorPotencia: 80,
  consumoCombustivel: 25,
  custoImplantacaoGerador: 150000,
  precoCombustivel: 5.5,

  estado: '',
  cidade: '',
  irradiacaoMensal: Array(12).fill(4.5),
  potenciaModulo: 550,
  numeroModulos: 0,
  eficienciaSistema: 80,
  inversorKw: 150,
  overloadInversor: 50,
  custoImplantacaoSolar: 1050000,

  vidaUtil: 25,
  taxaDesconto: 8,
  inflacaoEnergia: 4.5,
};

export const dodOptions = [70, 80, 90, 100];
export const fatorPerdasOptions = Array.from({ length: 21 }, (_, i) => 80 + i);
export const eficienciaSistemaOptions = Array.from({ length: 16 }, (_, i) => 75 + i);
export const overloadInversorOptions = Array.from({ length: 8 }, (_, i) => 30 + i * 10);
export const inversorOptions = [
  2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 75, 100, 125, 150, 200, 250
];
export const vidaUtilOptions = Array.from({ length: 26 }, (_, i) => 5 + i);

export const installationMethods = [
    { value: 'A1', label: 'A1 - Cabos isolados em conduto em parede termicamente isolante' },
    { value: 'A2', label: 'A2 - Cabo multipolar em conduto em parede termicamente isolante' },
    { value: 'B1', label: 'B1 - Cabos isolados em conduto aparente sobre parede' },
    { value: 'B2', label: 'B2 - Cabo multipolar em conduto aparente sobre parede' },
    { value: 'C', label: 'C - Cabo unipolar ou multipolar sobre parede de madeira' },
    { value: 'D', label: 'D - Cabo multipolar em conduto enterrado' },
];

export const installationMethodsCapacities = {
    A1: {
        pvc: { 1.5: 15.5, 2.5: 21, 4: 28, 6: 36, 10: 50, 16: 68, 25: 89, 35: 110, 50: 134 },
        epr: { 1.5: 20, 2.5: 27, 4: 36, 6: 46, 10: 63, 16: 85, 25: 112, 35: 138, 50: 168 }
    },
    A2: {
        pvc: { 1.5: 14, 2.5: 18.5, 4: 25, 6: 32, 10: 44, 16: 59, 25: 77, 35: 96, 50: 118 },
        epr: { 1.5: 18, 2.5: 24, 4: 32, 6: 41, 10: 56, 16: 75, 25: 98, 35: 121, 50: 148 }
    },
    B1: {
        pvc: { 1.5: 17.5, 2.5: 24, 4: 32, 6: 41, 10: 57, 16: 76, 25: 101, 35: 125, 50: 151 },
        epr: { 1.5: 22, 2.5: 30, 4: 40, 6: 52, 10: 72, 16: 96, 25: 125, 35: 155, 50: 188 }
    },
    B2: {
        pvc: { 1.5: 15.5, 2.5: 21, 4: 28, 6: 36, 10: 50, 16: 68, 25: 89, 35: 110, 50: 134 },
        epr: { 1.5: 20, 2.5: 27, 4: 36, 6: 46, 10: 63, 16: 85, 25: 112, 35: 138, 50: 168 }
    },
    C: {
        pvc: { 1.5: 19.5, 2.5: 27, 4: 36, 6: 46, 10: 63, 16: 85, 25: 112, 35: 138, 50: 168 },
        epr: { 1.5: 25, 2.5: 34, 4: 45, 6: 58, 10: 79, 16: 106, 25: 139, 35: 171, 50: 207 }
    },
    D: {
        pvc: { 1.5: 20, 2.5: 27, 4: 36, 6: 45, 10: 60, 16: 78, 25: 98, 35: 119, 50: 143 },
        epr: { 1.5: 25, 2.5: 34, 4: 45, 6: 56, 10: 75, 16: 98, 25: 123, 35: 149, 50: 178 }
    }
};
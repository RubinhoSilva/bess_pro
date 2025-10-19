import { SelectedInverter } from './inverter/inverter.selection';
import { SolarModule } from './module/module.types';

export interface AguaTelhado {
  id: string;
  nome: string;
  area: number;
  inclinacao: number;
  orientacao: number;
  perdas: number;
  sombreamento?: number;
  potenciaInstalada?: number;
  modulos?: number;
  // Propriedades adicionais usadas no componente
  numeroModulos?: number;
  inversorId?: string;
  mpptNumero?: number;
  sombreamentoParcial?: number;
  areaDisponivel?: number;
  areaCalculada?: number;
  geracaoAnual?: number;
  isCalculando?: boolean;
}

export interface IRoofData {
  aguasTelhado: AguaTelhado[];
  selectedInverters: SelectedInverter[];
  location: {
    latitude?: number;
    longitude?: number;
    fonteDados?: 'pvgis' | 'nasa' | 'manual';
  };
  system: {
    potenciaModulo?: number;
    perdaSombreamento?: number;
    perdaMismatch?: number;
    perdaCabeamento?: number;
    perdaSujeira?: number;
    perdaInversor?: number;
    perdaOutras?: number;
  };
  energy: {
    consumoAnualTotal?: number;
  };
  selectedModule?: SolarModule;
}

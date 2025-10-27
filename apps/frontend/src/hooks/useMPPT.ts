import { useQuery, useQueries } from '@tanstack/react-query';
import { SolarSystemService } from '@/lib/solarSystemService';
import type { MPPTCalculationRequest, MPPTCalculationResponse } from '@/lib/solarSystemService';

export interface MPPTCalculationParams {
  inversor: {
    fabricante: string;
    modelo: string;
    potenciaSaidaCA: number;
    potenciaFvMax?: number;
    tensaoCcMax?: number;
    numeroMppt?: number;
    stringsPorMppt?: number;
    correnteEntradaMax?: number;
    faixaMpptMin?: number;
    faixaMpptMax?: number;
    tipoRede?: string;
  };
  modulo: {
    potenciaNominal: number;
    vocStc: number;
    tempCoefVoc: number;
    isc?: number; // Corrente de curto-circuito do módulo STC (A)
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  enabled?: boolean;
}

export function useMPPTCalculation(params: MPPTCalculationParams) {
  return useQuery({
    queryKey: ['mppt-calculation', params],
    queryFn: async (): Promise<MPPTCalculationResponse> => {
      const request: MPPTCalculationRequest = {
        fabricante: params.inversor.fabricante,
        modelo: params.inversor.modelo,
        potencia_modulo_w: params.modulo.potenciaNominal,
        voc_stc: params.modulo.vocStc,
        temp_coef_voc: params.modulo.tempCoefVoc,
        isc: params.modulo.isc, // Adicionar campo ISC
        latitude: params.coordinates.latitude,
        longitude: params.coordinates.longitude,
        potencia_saida_ca_w: params.inversor.potenciaSaidaCA,
        potencia_fv_max_w: params.inversor.potenciaFvMax,
        tensao_cc_max_v: params.inversor.tensaoCcMax,
        numero_mppt: params.inversor.numeroMppt,
        strings_por_mppt: params.inversor.stringsPorMppt,
        corrente_entrada_max_a: params.inversor.correnteEntradaMax,
        faixa_mppt_min_v: params.inversor.faixaMpptMin,
        faixa_mppt_max_v: params.inversor.faixaMpptMax,
        tipo_rede: params.inversor.tipoRede
      };

      return SolarSystemService.calculateMPPTLimits(request);
    },
    enabled: params.enabled !== false && 
             Boolean(params.inversor.fabricante) &&
             Boolean(params.inversor.modelo) &&
             Boolean(params.modulo.potenciaNominal) &&
             Boolean(params.modulo.vocStc) &&
             Boolean(params.modulo.tempCoefVoc) &&
             Boolean(params.coordinates.latitude) &&
             Boolean(params.coordinates.longitude),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos 
    retry: 2
  });
}

export interface MPPTLimitsByInverter {
  [inverterId: string]: {
    modulosPorMppt: number;
    modulosPorString: number;
    isLoading: boolean;
    error: string | null;
  };
}

/**
 * Hook para calcular limites MPPT para múltiplos inversores
 * Usa um único query para todos os inversores para evitar violação das regras de hooks
 */
export function useMultipleMPPTCalculations(
  inverters: Array<{
    id: string;
    fabricante: string;
    modelo: string;
    potenciaSaidaCA: number;
    potenciaFvMax?: number;
    tensaoCcMax?: number;
    numeroMppt?: number;
    stringsPorMppt?: number;
    correnteEntradaMax?: number;
    faixaMpptMin?: number;
    faixaMpptMax?: number;
    tipoRede?: string;
  }>,
  modulo: {
    potenciaNominal: number;
    vocStc: number;
    tempCoefVoc: number;
    isc?: number; // Corrente de curto-circuito do módulo STC (A)
  },
  coordinates: {
    latitude: number;
    longitude: number;
  },
  enabled: boolean = true
): MPPTLimitsByInverter {
  // Usar um único query para todos os inversores
  const queries = useQueries({
    queries: inverters.map(inverter => ({
      queryKey: ['mppt-calculation', inverter.id, modulo, coordinates],
      queryFn: async (): Promise<MPPTCalculationResponse> => {
        const request: MPPTCalculationRequest = {
          fabricante: inverter.fabricante,
          modelo: inverter.modelo,
          potencia_modulo_w: modulo.potenciaNominal,
          voc_stc: modulo.vocStc,
          temp_coef_voc: modulo.tempCoefVoc,
          isc: modulo.isc, // Adicionar campo ISC
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          potencia_saida_ca_w: inverter.potenciaSaidaCA,
          potencia_fv_max_w: inverter.potenciaFvMax,
          tensao_cc_max_v: inverter.tensaoCcMax,
          numero_mppt: inverter.numeroMppt,
          strings_por_mppt: inverter.stringsPorMppt,
          corrente_entrada_max_a: inverter.correnteEntradaMax,
          faixa_mppt_min_v: inverter.faixaMpptMin,
          faixa_mppt_max_v: inverter.faixaMpptMax,
          tipo_rede: inverter.tipoRede
        };

        return SolarSystemService.calculateMPPTLimits(request);
      },
      enabled: enabled && Boolean(inverter.id) && Boolean(modulo.vocStc) && Boolean(modulo.tempCoefVoc),
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos
      retry: 2
    }))
  });

  // Converter results para o formato esperado
  const results: MPPTLimitsByInverter = {};

  inverters.forEach((inverter, index) => {
    const query = queries[index];
    results[inverter.id] = {
      modulosPorMppt: query.data?.modulos_por_mppt || 0,
      modulosPorString: query.data?.modulos_por_string || 0,
      isLoading: query.isLoading,
      error: query.error ? String(query.error) : null
    };
  });

  return results;
}
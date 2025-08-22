// Serviço de integração com PVGIS (Photovoltaic Geographical Information System)
// API pública da Comissão Europeia para dados de irradiação solar

export interface PVGISLocation {
  latitude: number;
  longitude: number;
  elevation?: number;
}

export interface PVGISMonthlyData {
  month: number;
  value: number; // kWh/m²/day
}

export interface PVGISResponse {
  inputs: {
    location: {
      latitude: number;
      longitude: number;
      elevation: number;
    };
  };
  outputs: {
    monthly_radiation: number[]; // 12 meses de dados kWh/m²/day
    yearly_radiation_sum: number;
  };
  meta: {
    timestamp: string;
  };
}

/**
 * Busca dados de irradiação solar no PVGIS
 * @param location Coordenadas da localização
 * @returns Dados mensais de irradiação
 */
export const fetchPVGISData = async (location: PVGISLocation): Promise<PVGISResponse> => {
  const { latitude, longitude } = location;
  
  // Detectar ambiente automaticamente
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const baseUrl = isDevelopment 
    ? 'http://localhost:8010/api/v1/irradiation/pvgis'
    : `/api/v1/irradiation/pvgis`;
  
  const params = new URLSearchParams({
    lat: latitude.toString(),
    lon: longitude.toString(),
    peakpower: '1', // 1kWp para obter dados de irradiação
    loss: '14', // Perdas padrão do sistema
    angle: '0', // Ângulo horizontal para obter irradiação global
    aspect: '0', // Orientação (não relevante para horizontal)
    mountingplace: 'free', // Instalação livre
  });

  const url = `${baseUrl}?${params.toString()}`;

  try {
    console.log('Buscando dados PVGIS para:', { latitude, longitude });
    console.log('URL da requisição:', url);

    // Endpoint PVGIS agora é público - não requer autenticação
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Aumentar timeout para 60 segundos
      signal: AbortSignal.timeout(60000),
    });
    
    console.log('Resposta recebida:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na resposta:', errorText);
      throw new Error(`Erro na API PVGIS: ${response.status} ${response.statusText}`);
    }

    const response_data = await response.json();
    console.log('Dados PVGIS recebidos:', response_data);
    
    // O backend retorna { success: true, data: {...} }
    const data = response_data.success ? response_data.data : response_data;
    
    if (!data.outputs || !data.outputs.monthly || !data.outputs.monthly.fixed) {
      throw new Error('Dados de irradiação não encontrados na resposta da API');
    }

    // Processar dados mensais do PVGIS (H(i)_d = irradiação diária)
    console.log('📊 Dados PVGIS monthly.fixed:', data.outputs.monthly.fixed);
    const monthlyRadiation = data.outputs.monthly.fixed.map((item: any) => item['H(i)_d']);
    console.log('📈 Monthly radiation values:', monthlyRadiation);
    
    // Calcular soma anual
    const yearlySum = monthlyRadiation.reduce((sum: number, value: number) => sum + value, 0) * 30.44; // Converter para kWh/m²/year
    console.log('📊 Yearly sum calculated:', yearlySum);

    return {
      inputs: {
        location: {
          latitude: data.inputs.location.latitude,
          longitude: data.inputs.location.longitude,
          elevation: data.inputs.location.elevation || 0,
        },
      },
      outputs: {
        monthly_radiation: monthlyRadiation,
        yearly_radiation_sum: yearlySum,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    
  } catch (error) {
    console.error('Erro ao buscar dados PVGIS:', error);
    
    if (error instanceof Error) {
      throw new Error(`Falha ao obter dados de irradiação: ${error.message}`);
    }
    
    throw new Error('Erro desconhecido ao buscar dados de irradiação solar');
  }
};

/**
 * Valida se as coordenadas estão dentro do território brasileiro
 * @param location Coordenadas para validar
 * @returns true se dentro do Brasil
 */
export const isLocationInBrazil = (location: PVGISLocation): boolean => {
  const { latitude, longitude } = location;
  
  // Limites aproximados do Brasil
  const brazilBounds = {
    north: 5.3,
    south: -33.8,
    east: -28.8,
    west: -73.9,
  };
  
  return (
    latitude >= brazilBounds.south &&
    latitude <= brazilBounds.north &&
    longitude >= brazilBounds.west &&
    longitude <= brazilBounds.east
  );
};

/**
 * Formata os dados mensais para exibição
 * @param monthlyData Array com 12 valores mensais
 * @returns Array formatado com nomes dos meses
 */
export const formatMonthlyData = (monthlyData: number[]): PVGISMonthlyData[] => {
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  return monthlyData.map((value, index) => ({
    month: index + 1,
    value: Math.round(value * 100) / 100, // 2 casas decimais
  }));
};

/**
 * Calcula a média anual de irradiação
 * @param monthlyData Array com 12 valores mensais
 * @returns Média anual em kWh/m²/day
 */
export const calculateYearlyAverage = (monthlyData: number[]): number => {
  const sum = monthlyData.reduce((acc, value) => acc + value, 0);
  return Math.round((sum / 12) * 100) / 100;
};

/**
 * Função auxiliar para geocodificar endereço (simulação)
 * Em produção, integraria com Google Geocoding ou similar
 */
export const geocodeAddress = async (address: string): Promise<PVGISLocation | null> => {
  // Simulação de geocoding - em produção usaria API real
  console.log('Geocoding address:', address);
  
  // Retorna coordenadas aproximadas do centro do Brasil como exemplo
  return {
    latitude: -14.2350,
    longitude: -51.9253,
  };
};

/**
 * Cache simples para evitar requisições desnecessárias
 */
const pvgisCache = new Map<string, { data: PVGISResponse; timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 60; // 1 hora

/**
 * Busca dados com cache
 */
export const fetchPVGISDataWithCache = async (location: PVGISLocation): Promise<PVGISResponse> => {
  const key = `${location.latitude.toFixed(4)},${location.longitude.toFixed(4)}`;
  const cached = pvgisCache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  const data = await fetchPVGISData(location);
  pvgisCache.set(key, { data, timestamp: Date.now() });
  
  return data;
};
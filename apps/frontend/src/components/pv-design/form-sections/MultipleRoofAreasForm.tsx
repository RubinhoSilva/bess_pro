import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Home, Plus, Trash2, ChevronDown, ChevronUp, Sun, Compass, Triangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SolarSystemService } from '@/lib/solarSystemService';
import { useMultipleMPPTCalculations } from '@/hooks/useMPPT';

export interface AguaTelhado {
  id: string;
  nome: string;
  orientacao: number; // 0-360° (0=Norte, 90=Leste, 180=Sul, 270=Oeste)
  inclinacao: number; // 0-90°
  numeroModulos: number;
  sombreamentoParcial?: number; // % específico desta área (removido para MVP)
  // Dados calculados da geração
  areaCalculada?: number; // m² calculado pela API
  geracaoAnual?: number; // kWh/ano calculado pela API
  isCalculando?: boolean; // Estado de carregamento
}

interface MultipleRoofAreasFormProps {
  aguasTelhado: AguaTelhado[];
  onAguasChange: (aguas: AguaTelhado[]) => void;
  potenciaModulo: number;
  numeroModulosCalculados?: number; // Total de módulos calculado pela API
  areaEstimada?: number; // Área total estimada pela API
  geracaoEstimadaAnual?: number; // Geração anual estimada pela API
  latitude?: number; // Para chamada da API
  longitude?: number; // Para chamada da API
  // Props para MPPT limits
  selectedInverters?: any[];
  selectedModule?: {
    potenciaNominal: number;
    vocStc?: number;
    tempCoefVoc?: number;
  };
  maxModulosPerMPPT?: number; // Limite máximo calculado
}

const orientacaoOptions = [
  { value: 0, label: 'Norte (0°)', icon: '⬆️', color: 'bg-blue-500' },
  { value: 45, label: 'Nordeste (45°)', icon: '↗️', color: 'bg-blue-400' },
  { value: 90, label: 'Leste (90°)', icon: '➡️', color: 'bg-yellow-500' },
  { value: 135, label: 'Sudeste (135°)', icon: '↘️', color: 'bg-orange-400' },
  { value: 180, label: 'Sul (180°)', icon: '⬇️', color: 'bg-orange-500' },
  { value: 225, label: 'Sudoeste (225°)', icon: '↙️', color: 'bg-orange-400' },
  { value: 270, label: 'Oeste (270°)', icon: '⬅️', color: 'bg-red-500' },
  { value: 315, label: 'Noroeste (315°)', icon: '↖️', color: 'bg-blue-400' },
];

const MultipleRoofAreasForm: React.FC<MultipleRoofAreasFormProps> = ({
  aguasTelhado,
  onAguasChange,
  potenciaModulo,
  numeroModulosCalculados,
  areaEstimada,
  geracaoEstimadaAnual,
  latitude,
  longitude,
  selectedInverters,
  selectedModule,
  maxModulosPerMPPT
}) => {
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());

  // Preparar dados para MPPT calculations
  const invertersForMPPT = selectedInverters?.map(inv => ({
    id: inv.id || inv.inverterId,
    fabricante: inv.fabricante,
    modelo: inv.modelo,
    potenciaSaidaCA: inv.potenciaSaidaCA,
    potenciaFvMax: inv.potenciaFvMax,
    tensaoCcMax: inv.tensaoCcMaxV,
    numeroMppt: inv.numeroMppt,
    stringsPorMppt: inv.stringsPorMppt,
    correnteEntradaMax: inv.correnteEntradaMaxA,
    faixaMpptMin: inv.faixaMpptMinV,
    faixaMpptMax: inv.faixaMpptMaxV,
    tipoRede: inv.tipoRede
  })) || [];

  const defaultModule = {
    potenciaNominal: 540,
    vocStc: 49.7,
    tempCoefVoc: -0.27
  };

  const defaultCoordinates = {
    latitude: latitude || -15.7942,
    longitude: longitude || -47.8822
  };

  // Hook para calcular limites MPPT
  const moduleToUse = selectedModule && 
                     typeof selectedModule.vocStc === 'number' && 
                     typeof selectedModule.tempCoefVoc === 'number' 
    ? selectedModule 
    : defaultModule;
    
  const mpptLimits = useMultipleMPPTCalculations(
    invertersForMPPT,
    moduleToUse as { potenciaNominal: number; vocStc: number; tempCoefVoc: number; },
    defaultCoordinates,
    Boolean(selectedModule?.vocStc && selectedModule?.tempCoefVoc && selectedInverters?.length)
  );

  // Calcular limite máximo de módulos baseado nos inversores
  const calculateMaxModules = () => {
    if (!selectedInverters?.length) return maxModulosPerMPPT || 50; // Fallback
    
    let totalMaxModules = 0;
    selectedInverters.forEach(inverter => {
      const inverterId = inverter.id || inverter.inverterId;
      const limit = mpptLimits[inverterId];
      if (limit && !limit.isLoading && !limit.error) {
        totalMaxModules += limit.modulosTotal * (inverter.quantity || 1);
      }
    });
    
    return totalMaxModules || maxModulosPerMPPT || 50;
  };

  const maxModules = calculateMaxModules();

  // Atualizar primeira orientação com dados da API quando disponível
  useEffect(() => {
    if (numeroModulosCalculados && areaEstimada && geracaoEstimadaAnual && aguasTelhado.length > 0) {
      const primeiraAgua = aguasTelhado[0];
      
      // Só atualizar se ainda não tiver dados calculados
      if (!primeiraAgua.areaCalculada && !primeiraAgua.geracaoAnual) {
        const aguasAtualizadas = [...aguasTelhado];
        aguasAtualizadas[0] = {
          ...primeiraAgua,
          numeroModulos: numeroModulosCalculados,
          areaCalculada: Math.round(areaEstimada),
          geracaoAnual: Math.round(geracaoEstimadaAnual)
        };
        
        onAguasChange(aguasAtualizadas);
      }
    }
  }, [numeroModulosCalculados, areaEstimada, geracaoEstimadaAnual, aguasTelhado, onAguasChange]);

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedAreas);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedAreas(newExpanded);
  };


  // Função para atualizar geração de TODAS as águas de telhado
  const handleAtualizarGeracao = async (areaId: string) => {
    if (!latitude || !longitude) {
      return;
    }

    // Marcar TODAS como calculando
    const updatedAreas = aguasTelhado.map(a => ({ ...a, isCalculando: true }));
    onAguasChange(updatedAreas);

    try {
      const requestData = {
        totalAguas: aguasTelhado.length,
        aguas: aguasTelhado.map(a => ({
          nome: a.nome,
          orientacao: a.orientacao,
          inclinacao: a.inclinacao,
          numeroModulos: a.numeroModulos
        })),
        latitude,
        longitude
      };

      // Preparar dados do inversor para incluir em cada água
      const inverterData = selectedInverters && selectedInverters.length > 0 ? {
        fabricante: selectedInverters[0].fabricante,
        modelo: selectedInverters[0].modelo,
        potencia_saida_ca_w: selectedInverters[0].potenciaSaidaCA,
        tipo_rede: (selectedInverters[0] as any).tipoRede || "Monofásico 220V",
        potencia_fv_max_w: (selectedInverters[0] as any).potenciaFvMax || undefined,
        tensao_cc_max_v: selectedInverters[0].tensaoCcMax || 1000,
        numero_mppt: selectedInverters[0].numeroMppt || 2,
        strings_por_mppt: selectedInverters[0].stringsPorMppt || 2,
        eficiencia_max: (selectedInverters[0] as any).eficienciaMax || undefined
      } : {
        fabricante: 'WEG',
        modelo: 'SIW500H-M',
        potencia_saida_ca_w: 5000,
        tipo_rede: "Monofásico 220V",
        tensao_cc_max_v: 600,
        numero_mppt: 2,
        strings_por_mppt: 2,
        eficiencia_max: 97.6
      };

      // Preparar dados para o cálculo com TODAS as águas
      const dimensioningData = {
        latitude,
        longitude,
        // ✅ Enviar TODAS as águas de telhado COM INVERSOR EMBUTIDO
        aguasTelhado: aguasTelhado.map(a => ({
          id: a.id,
          nome: a.nome,
          orientacao: a.orientacao,
          inclinacao: a.inclinacao,
          numeroModulos: a.numeroModulos,
          sombreamentoParcial: a.sombreamentoParcial || 0,
          // ✅ NOVO: Incluir dados do inversor dentro de cada água
          inversor: inverterData
        })),
        potenciaModulo,
        energyBills: [{ 
          consumoMensal: [500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500] // 6000 kWh/ano
        }],
        selectedModules: [{
          fabricante: 'Canadian Solar',
          modelo: 'CS3W-540MS',
          potenciaNominal: potenciaModulo
        }],
        // ✅ NOVOS CAMPOS AUSENTES
        modelo_decomposicao: 'louche',
        modelo_transposicao: 'perez',
        perdas_sistema: 14.0,
        fator_seguranca: 1.1
      };

      // Chamar API de cálculo avançado com múltiplas águas
      const dados = await SolarSystemService.calculateAdvancedFromDimensioning(dimensioningData);
        
      // ✅ Se a API retornou dados agregados, distribuir proporcionalmente
      if (dados.energia_total_anual_kwh && dados.area_necessaria_m2) {
        const totalModulos = aguasTelhado.reduce((sum, a) => sum + a.numeroModulos, 0);
        
        const finalAreas = aguasTelhado.map(a => {
          const proporcao = totalModulos > 0 ? a.numeroModulos / totalModulos : 1 / aguasTelhado.length;
          return {
            ...a,
            areaCalculada: dados.area_necessaria_m2 * proporcao,
            geracaoAnual: dados.energia_total_anual_kwh * proporcao,
            isCalculando: false
          };
        });
          
          const debugInfo = {
            areaTotal: dados.area_necessaria_m2,
            geracaoTotal: dados.energia_total_anual_kwh,
            distribuicao: finalAreas.map(a => ({
              nome: a.nome,
              area: a.areaCalculada?.toFixed(2),
              geracao: a.geracaoAnual?.toFixed(2)
            }))
          };
        
        onAguasChange(finalAreas);
      } else {
        // Se não retornou dados agregados, limpar estados de cálculo
        const finalAreas = aguasTelhado.map(a => ({ ...a, isCalculando: false }));
        onAguasChange(finalAreas);
      }
        
    } catch (error) {
      
      // Remover estado de carregamento de TODAS
      const finalAreas = aguasTelhado.map(a => ({ ...a, isCalculando: false }));
      onAguasChange(finalAreas);
    }
  };

  const addNewArea = () => {
    const newArea: AguaTelhado = {
      id: `area_${Date.now()}`,
      nome: `Água ${aguasTelhado.length + 1}`,
      orientacao: 0,
      inclinacao: 0,
      numeroModulos: 0
    };
    
    onAguasChange([...aguasTelhado, newArea]);
    setExpandedAreas(new Set([...Array.from(expandedAreas), newArea.id]));
  };

  const removeArea = (id: string) => {
    onAguasChange(aguasTelhado.filter(area => area.id !== id));
    const newExpanded = new Set(expandedAreas);
    newExpanded.delete(id);
    setExpandedAreas(newExpanded);
  };

  const updateArea = (id: string, field: keyof AguaTelhado, value: any) => {
    onAguasChange(aguasTelhado.map(area => 
      area.id === id ? { ...area, [field]: value } : area
    ));
  };

  const getOrientacaoInfo = (orientacao: number) => {
    return orientacaoOptions.find(opt => opt.value === orientacao) || orientacaoOptions[4]; // Sul como fallback
  };

  const getTotalModulos = () => {
    // Usar número calculado pela API se disponível, senão somar das águas
    return numeroModulosCalculados || aguasTelhado.reduce((total, area) => total + area.numeroModulos, 0);
  };

  const getTotalPotencia = () => {
    return (getTotalModulos() * potenciaModulo) / 1000; // kWp
  };

  const getTotalArea = () => {
    return aguasTelhado.reduce((total, area) => total + (area.areaCalculada || area.numeroModulos * 2.5), 0);
  };

  return (
    <TooltipProvider>
      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
            <Home className="w-5 h-5 text-blue-500" />
            Configuração de Orientações
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure diferentes orientações e inclinações para otimizar a geração solar
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Resumo Geral */}
          {aguasTelhado.length > 0 && (
            <div className={`bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border ${
              getTotalModulos() > maxModules ? 'border-red-300 bg-gradient-to-r from-red-50 to-orange-50' : 'border-blue-200'
            }`}>
              <h4 className="font-semibold text-blue-800 mb-3">Resumo do sistema multi orientações</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{aguasTelhado.length}</div>
                  <div className="text-blue-500">Orientações</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    getTotalModulos() > maxModules ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {getTotalModulos()}
                    {maxModules && ` / ${maxModules}`}
                  </div>
                  <div className={getTotalModulos() > maxModules ? 'text-red-500' : 'text-green-500'}>
                    Módulos {getTotalModulos() > maxModules && '(Excede Limite!)'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{getTotalPotencia().toFixed(2)} kWp</div>
                  <div className="text-orange-500">Potência</div>
                </div>
              </div>
              {getTotalModulos() > maxModules && (
                <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded-lg">
                  <p className="text-red-700 text-sm font-medium">
                    ⚠️ Total de módulos ({getTotalModulos()}) excede o limite máximo do sistema ({maxModules})
                  </p>
                  <p className="text-red-600 text-xs mt-1">
                    Baseado nos inversores selecionados e parâmetros dos módulos
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Lista de Orientações */}
          <div className="space-y-3">
            {aguasTelhado.map((area, index) => {
              const orientacaoInfo = getOrientacaoInfo(area.orientacao);
              const isExpanded = expandedAreas.has(area.id);
              
              return (
                <Collapsible key={area.id} open={isExpanded} onOpenChange={() => toggleExpanded(area.id)}>
                  <Card className="border border-gray-200 dark:border-gray-600">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${orientacaoInfo.color}`}></div>
                            <div>
                              <h4 className="font-medium text-foreground">{area.nome}</h4>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Compass className="w-3 h-3" />
                                  {orientacaoInfo.label}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Triangle className="w-3 h-3" />
                                  {area.inclinacao}°
                                </span>
                                <span className="flex items-center gap-1">
                                  <Sun className="w-3 h-3" />
                                  {area.numeroModulos} módulos
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {((area.numeroModulos * potenciaModulo) / 1000).toFixed(1)} kWp
                            </Badge>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <CardContent className="pt-0 space-y-4">
                        
                        {/* Nome da Orientação */}
                        <div className="space-y-2">
                          <Label htmlFor={`nome-${area.id}`}>Nome da Orientação</Label>
                          <Input
                            id={`nome-${area.id}`}
                            value={area.nome}
                            onChange={(e) => updateArea(area.id, 'nome', e.target.value)}
                            placeholder="Ex: Água Sul Principal"
                          />
                        </div>

                        {/* Orientação */}
                        <div className="space-y-2">
                          <Label htmlFor={`orientacao-${area.id}`}>Orientação</Label>
                          <div className="relative">
                            <Input
                              id={`orientacao-${area.id}`}
                              type="number"
                              min="0"
                              max="360"
                              value={area.orientacao}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                const clampedValue = Math.max(0, Math.min(360, value));
                                updateArea(area.id, 'orientacao', clampedValue);
                              }}
                              onBlur={(e) => {
                                // Validação adicional no blur para garantir range
                                const value = parseInt(e.target.value) || 0;
                                const clampedValue = Math.max(0, Math.min(360, value));
                                if (value !== clampedValue) {
                                  updateArea(area.id, 'orientacao', clampedValue);
                                }
                              }}
                              className="pr-8"
                              placeholder="0-360"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                              °
                            </span>
                          </div>
                        </div>

                        {/* Inclinação */}
                        <div className="space-y-2">
                          <Label htmlFor={`inclinacao-${area.id}`}>Inclinação</Label>
                          <div className="relative">
                            <Input
                              id={`inclinacao-${area.id}`}
                              type="number"
                              min="0"
                              max="90"
                              value={area.inclinacao}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                const clampedValue = Math.max(0, Math.min(90, value));
                                updateArea(area.id, 'inclinacao', clampedValue);
                              }}
                              onBlur={(e) => {
                                // Validação adicional no blur para garantir range
                                const value = parseInt(e.target.value) || 0;
                                const clampedValue = Math.max(0, Math.min(90, value));
                                if (value !== clampedValue) {
                                  updateArea(area.id, 'inclinacao', clampedValue);
                                }
                              }}
                              className="pr-8"
                              placeholder="0-90"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                              °
                            </span>
                          </div>
                        </div>

                        {/* Número de Módulos */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`modulos-${area.id}`}>Número de Módulos</Label>
                            {maxModules && (
                              <span className="text-xs text-muted-foreground">
                                Máx: {maxModules} módulos (sistema total)
                              </span>
                            )}
                          </div>
                          <Input
                            id={`modulos-${area.id}`}
                            type="number"
                            min="1"
                            max={maxModules || 100}
                            value={area.numeroModulos}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              const limitedValue = Math.min(value, maxModules || 100);
                              updateArea(area.id, 'numeroModulos', limitedValue);
                            }}
                            className={area.numeroModulos > maxModules ? 'border-red-500' : ''}
                          />
                          {area.numeroModulos > maxModules && (
                            <p className="text-xs text-red-500">
                              ⚠️ Número excede limite máximo do sistema ({maxModules} módulos)
                            </p>
                          )}
                        </div>

                        {/* Botão Atualizar Geração */}
                        <div className="pt-4">
                          <Button 
                            onClick={() => handleAtualizarGeracao(area.id)}
                            className="w-full bg-green-600 hover:bg-green-700"
                            size="sm"
                            disabled={area.isCalculando}
                          >
                            {area.isCalculando ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                Calculando...
                              </>
                            ) : (
                              <>
                                <Sun className="w-4 h-4 mr-2" />
                                Atualizar Geração
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Resumo da Geração - só aparece após calcular */}
                        {(area.areaCalculada || area.geracaoAnual) && (
                          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <h5 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2">
                              Geração Calculada
                            </h5>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-green-600 dark:text-green-400">Área:</span>
                                <div className="font-mono text-green-800 dark:text-green-200">
                                  {area.areaCalculada?.toFixed(1) || '—'} m²
                                </div>
                              </div>
                              <div>
                                <span className="text-green-600 dark:text-green-400">Geração Anual:</span>
                                <div className="font-mono text-green-800 dark:text-green-200">
                                  {area.geracaoAnual?.toFixed(0) || '—'} kWh/ano
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Resumo da Água */}
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          <div className="grid grid-cols-3 gap-3 text-sm">
                            <div className="text-center">
                              <div className="font-semibold text-blue-600">
                                {((area.numeroModulos * potenciaModulo) / 1000).toFixed(2)} kWp
                              </div>
                              <div className="text-xs text-muted-foreground">Potência</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-green-600">
                                {(area.areaCalculada || area.numeroModulos * 2.5).toFixed(1)} m²
                              </div>
                              <div className="text-xs text-muted-foreground">Área</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-orange-600">
                                {area.geracaoAnual ? `${(area.geracaoAnual / 1000).toFixed(1)} MWh/ano` : '—'}
                              </div>
                              <div className="text-xs text-muted-foreground">Geração</div>
                            </div>
                          </div>
                        </div>

                        {/* Remover Água */}
                        {aguasTelhado.length > 1 && (
                          <div className="pt-3 border-t border-border">
                            <Button
                              onClick={() => removeArea(area.id)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remover Água
                            </Button>
                          </div>
                        )}

                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>

          {/* Adicionar Nova Orientação */}
          <Button
            onClick={addNewArea}
            variant="outline"
            className="w-full border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-600 hover:text-blue-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Nova Orientação
          </Button>

          {/* Informações sobre otimização */}
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Sun className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 mb-1">Dicas de Orientação:</p>
                <ul className="text-amber-700 space-y-1">
                  <li>• <strong>Sul (180°):</strong> Máxima geração anual no Brasil</li>
                  <li>• <strong>Leste (90°):</strong> Melhor para consumo matinal</li>
                  <li>• <strong>Oeste (270°):</strong> Melhor para consumo vespertino</li>
                  <li>• <strong>Inclinação:</strong> Use ângulo igual à latitude local para otimizar</li>
                </ul>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default MultipleRoofAreasForm;

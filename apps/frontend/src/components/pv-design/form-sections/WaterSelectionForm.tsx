// React/Next.js imports
import React, { useState, useMemo, useEffect } from 'react';

// External libraries imports
import { Trash2, Plus, Home, Zap, AlertCircle, Compass, Triangle, Sun, Info, Settings } from 'lucide-react';

// Internal components imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Hooks imports
import { useMultipleMPPTCalculations } from '@/hooks/useMPPT';

// Utilities imports
import { SolarSystemService } from '@/lib/solarSystemService';

// Store imports
import { usePVDimensioningStore } from '@/store/pv-dimensioning-store';
import { selectInvertersForMPPT, selectDimensioningDataWithModule } from '@/store/selectors/pv-dimensioning-selectors';

// Types imports
import type { IRoofData, AguaTelhado } from '@bess-pro/shared';

interface WaterSelectionFormProps {
  roofData: IRoofData;
  onRoofChange: (field: string, value: any) => void;
}

export const WaterSelectionForm: React.FC<WaterSelectionFormProps> = ({
  roofData,
  onRoofChange
}) => {
  // Callback para atualizar águas do telhado
  const onAguasChange = (aguas: any[]) => {
    // Garantir que todas as águas tenham o campo numeroStrings
    const aguasComStrings = aguas.map(agua => ({
      ...agua,
      numeroStrings: agua.numeroStrings || 1
    }));
    
    onRoofChange('aguasTelhado', aguasComStrings);
  };
  const [errors, setErrors] = useState<string[]>([]);

  // Garantir que águas existentes tenham o campo numeroStrings inicializado
  useEffect(() => {
    if (roofData.aguasTelhado?.length > 0) {
      const aguasAtualizadas = roofData.aguasTelhado.map(agua => {
        if (!agua.numeroStrings) {
          return { ...agua, numeroStrings: 1 };
        }
        return agua;
      });
      
      // Verificar se alguma água foi atualizada
      const precisaaAtualizar = aguasAtualizadas.some((agua, index) =>
        agua.numeroStrings !== roofData.aguasTelhado[index].numeroStrings
      );
      
      if (precisaaAtualizar) {
        onAguasChange(aguasAtualizadas);
      }
    }
  }, [roofData.aguasTelhado?.length]); // Executar apenas quando a quantidade de águas mudar

  // Gerar lista de canais MPPT disponíveis baseado nos inversores selecionados
  const getAvailableMpptChannels = () => {
    const channels: Array<{
      value: string;
      label: string;
      inversorId: string;
      mpptNumero: number;
    }> = [];

    // Verificar se há inversores selecionados
    if (!roofData.selectedInverters?.length) {
      return channels;
    }


    roofData.selectedInverters.forEach(inverter => {
      const quantity = inverter.quantity || 1;
      const numberOfMppts = inverter.inverter.mppt.numberOfMppts || 1; // Acessar propriedade correta do tipo compartilhado
      const manufacturerName = inverter.inverter.manufacturer.name || 'Desconhecido';
      const modelName = inverter.inverter.model || 'Modelo';
      
      
      for (let unit = 1; unit <= quantity; unit++) {
        for (let mppt = 1; mppt <= numberOfMppts; mppt++) {
          const uniqueInversorId = `${inverter.inverter.id}_unit${unit}`;
          const value = `${uniqueInversorId}_mppt${mppt}`;
          
          channels.push({
            value,
            label: `${manufacturerName} ${modelName} #${unit} - MPPT ${mppt}`,
            inversorId: uniqueInversorId,
            mpptNumero: mppt
          });
        }
      }
    });

    return channels;
  };


  const handleAddAgua = () => {
    // Encontrar próximo número disponível
    const existingNumbers = roofData.aguasTelhado
      .map(agua => {
        const match = agua.nome.match(/Orientação #(\d+)/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(num => num > 0);
    
    let nextNumber = 1;
    while (existingNumbers.includes(nextNumber)) {
      nextNumber++;
    }

    const newAgua: AguaTelhado = {
      id: crypto.randomUUID(),
      nome: `Orientação #${nextNumber}`,
      area: 0,
      perdas: 0,
      orientacao: 180, // Norte no Brasil (azimute 180°)
      inclinacao: 20, // Inclinação padrão (~latitude média do Brasil)
      numeroModulos: 0, // Começar com 0 módulos
      numeroStrings: 1, // Padrão: 1 string por MPPT
      areaDisponivel: 25,
      sombreamentoParcial: 0
    };

    onAguasChange([...roofData.aguasTelhado, newAgua]);
  };

  const handleRemoveAgua = (id: string) => {
    if (roofData.aguasTelhado.length <= 1) return; // Manter pelo menos uma água
    onAguasChange(roofData.aguasTelhado.filter(agua => agua.id !== id));
  };

  const handleUpdateAgua = (id: string, updates: Partial<AguaTelhado>) => {
    const updatedAguas = roofData.aguasTelhado.map(agua =>
      agua.id === id ? { ...agua, ...updates } : agua
    );
    
    onAguasChange(updatedAguas);
  };

  const handleMpptChange = (aguaId: string, mpptValue: string) => {
    if (!mpptValue) {
      handleUpdateAgua(aguaId, { inversorId: undefined, mpptNumero: undefined });
      return;
    }

    // Parse do valor: "inversorId_mpptNumero"
    const [inversorId, mpptPart] = mpptValue.split('_mppt');
    const mpptNumero = parseInt(mpptPart);

    handleUpdateAgua(aguaId, { 
      inversorId, 
      mpptNumero 
    });
  };

  const getOrientacaoLabel = (orientacao: number): string => {
    if (orientacao >= 0 && orientacao <= 22.5) return 'Norte';
    if (orientacao > 22.5 && orientacao <= 67.5) return 'Nordeste';
    if (orientacao > 67.5 && orientacao <= 112.5) return 'Leste';
    if (orientacao > 112.5 && orientacao <= 157.5) return 'Sudeste';
    if (orientacao > 157.5 && orientacao <= 202.5) return 'Sul';
    if (orientacao > 202.5 && orientacao <= 247.5) return 'Sudoeste';
    if (orientacao > 247.5 && orientacao <= 292.5) return 'Oeste';
    if (orientacao > 292.5 && orientacao <= 337.5) return 'Noroeste';
    return 'Norte';
  };

  // Usar seletor para obter inversores formatados para MPPT
  const invertersForMPPT = useMemo(() => {
    const store = usePVDimensioningStore.getState();
    return selectInvertersForMPPT(store);
  }, [roofData.selectedInverters]);

  const defaultCoordinates = {
    latitude: roofData.location?.latitude || 0,
    longitude: roofData.location?.longitude || 0
  };

  // Hook para calcular limites MPPT - agora usa selectedModule completo com tipo compartilhado
  const moduleToUse = useMemo(() => {
    if (!roofData.selectedModule) return null;

    return {
      potenciaNominal: roofData.selectedModule.nominalPower,
      vocStc: roofData.selectedModule.specifications.voc,
      tempCoefVoc: roofData.selectedModule.parameters.temperature.tempCoeffVoc,
      isc: roofData.selectedModule.specifications.isc // Adicionar campo ISC
    };
  }, [roofData.selectedModule]);
    
  const mpptLimits = useMultipleMPPTCalculations(
    invertersForMPPT,
    moduleToUse || { potenciaNominal: 550, vocStc: 45, tempCoefVoc: -0.3 }, // Default values
    defaultCoordinates,
    Boolean(moduleToUse && roofData.selectedInverters?.length)
  );

  // Calcular limite máximo de módulos baseado nos inversores
  const calculateMaxModules = () => {
    // if (!roofData.selectedInverters?.length) return 50; // Fallback

    let totalMaxModules = 0;
    roofData.selectedInverters.forEach(inverter => {
      const inverterId = inverter.inverter.id;
      const limit = mpptLimits[inverterId];
      if (limit && !limit.isLoading && !limit.error) {
        totalMaxModules += limit.modulosPorMppt * (inverter.quantity || 1);
      }
    });
    
    return totalMaxModules;
  };

  const maxModules = calculateMaxModules();

  // Função auxiliar para calcular o total de módulos considerando strings
  const calculateTotalModules = useMemo(() => {
    return roofData.aguasTelhado.reduce((sum, agua) => {
      const modulosPorString = agua.numeroModulos || 0;
      const numeroStrings = agua.numeroStrings || 1;
      return sum + (modulosPorString * numeroStrings);
    }, 0);
  }, [roofData.aguasTelhado]);

  // Usar seletor para obter dimensioningData formatado
  const dimensioningData = useMemo(() => {
    const store = usePVDimensioningStore.getState();
    return selectDimensioningDataWithModule(roofData.selectedModule)(store);
  }, [roofData]);


  // Função para calcular geração do sistema completo (todas as águas juntas)
  const handleCalculateGeneration = async (aguaId: string) => {
    if (!roofData.location?.latitude || !roofData.location?.longitude) {
      return;
    }

    const agua = roofData.aguasTelhado.find(a => a.id === aguaId);
    if (!agua) {
      return;
    }

    // Verificar se existe pelo menos uma água com módulos
    const totalModulos = calculateTotalModules;
    if (totalModulos === 0) {
      return;
    }

    // Marcar TODAS as águas como calculando (já que o cálculo é do sistema completo)
    const updatedAguas = roofData.aguasTelhado.map(a => ({ ...a, isCalculando: true }));
    onAguasChange(updatedAguas);

    try {
      // Usar dimensioningData preparado com useMemo
      const dados = await SolarSystemService.calculateAdvancedFromDimensioning(dimensioningData);
            
      // Salvar geração mensal no store para uso posterior
      // A API retorna geracaoMensalKwh como objeto, precisamos converter para array
      let geracaoMensalArray: number[] = [];
      const dadosAny = dados as any; // Type assertion para evitar erros de TypeScript
      
      if (dadosAny.geracaoMensalKwh && typeof dadosAny.geracaoMensalKwh === 'object') {
        // Converter objeto {Jan: 74, Fev: 61, ...} para array [74, 61, ...]
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        geracaoMensalArray = meses.map(mes => dadosAny.geracaoMensalKwh[mes] || 0);
      } else if (dadosAny.geracao_mensal && Array.isArray(dadosAny.geracao_mensal)) {
        // Caso a API retorne como array (fallback)
        geracaoMensalArray = dadosAny.geracao_mensal;
      }
      
      // Salvar no store se tivermos dados válidos
      if (geracaoMensalArray.length > 0) {
        // Obter a store para atualizar os resultados
        const store = usePVDimensioningStore.getState();
        
        // Extrair dados adicionais da API
        const energiaAnual = (dados as any).energiaAnualKwh || 0;
        const energiaDcAnual = (dados as any).energiaDcAnualKwh || 0;
        const consumoAnual = (dados as any).consumoAnualKwh || 0;
        const potenciaTotalKwp = (dados as any).potenciaTotalKwp || 0;
        const perdaClippingKwh = (dados as any).perdaClippingKwh || 0;
        const perdaClippingPct = (dados as any).perdaClippingPct || 0;
        const yieldEspecifico = (dados as any).yieldEspecifico || 0;
        const fatorCapacidade = (dados as any).fatorCapacidade || 0;
        const prTotal = (dados as any).prTotal || 0;
        const anosAnalisados = (dados as any).anosAnalisados || 0;
        
        store.updateResultsData({
          calculationResults: {
            // Dados de geração
            geracaoEstimadaMensal: geracaoMensalArray,
            geracaoAnual: energiaAnual,
            geracaoDcAnual: energiaDcAnual,
            potenciaTotalKwp: potenciaTotalKwp,
            
            // Dados de consumo
            consumoAnual: consumoAnual,
            
            // Dados de performance
            perdaClippingKwh: perdaClippingKwh,
            perdaClippingPct: perdaClippingPct,
            yieldEspecifico: yieldEspecifico,
            fatorCapacidade: fatorCapacidade,
            prTotal: prTotal,
            anosAnalisados: anosAnalisados,
            
            // Dados por orientação
            geracaoPorOrientacao: (dados as any).geracaoPorOrientacao || {},
            
            // Dados dos inversores
            inversores: (dados as any).inversores || []
          }
        });
        
        // Verificar se foi salvo corretamente
        const updatedStore = usePVDimensioningStore.getState();
      }
      
      // Obter a energia total anual do cálculo
      const energiaTotal = (dados as any).energia_anual_kwh || (dados as any).energiaAnualKwh || 0;
      
      // Obter dados de geração por orientação da API
      const geracaoPorOrientacao = (dados as any).geracaoPorOrientacao || {};
      
      // Distribuir os resultados para cada água baseado nos dados da API
      const finalAguas = roofData.aguasTelhado.map(a => {
        const modulos = (a.numeroModulos || 0) * (a.numeroStrings || 1);
        if (modulos > 0) {
          // Procurar dados desta orientação na resposta da API
          const orientacaoData = geracaoPorOrientacao[a.nome] || geracaoPorOrientacao[a.id];
          
          if (orientacaoData) {
            // Usar dados da API para esta orientação
            return {
              ...a,
              areaCalculada: orientacaoData.area_utilizada_m2 || 0,
              geracaoAnual: orientacaoData.geracao_anual_kwh || 0,
              isCalculando: false
            };
          } else {
            // Fallback: calcular proporção se não encontrar dados específicos
            const proporcao = modulos / totalModulos;
            const geracaoProporcional = Math.round(energiaTotal * proporcao * 100) / 100;
            
            return {
              ...a,
              areaCalculada: Math.round(((dados as any).area_necessaria_m2 || 0) * proporcao * 100) / 100,
              geracaoAnual: geracaoProporcional,
              isCalculando: false
            };
          }
        } else {
          // Águas sem módulos apenas param de calcular
          return {
            ...a,
            isCalculando: false
          };
        }
      });

      onAguasChange(finalAguas);
    } catch (error) {
      
      // Remover estado de carregamento de TODAS as águas
      const finalAguas = roofData.aguasTelhado.map(a => ({ ...a, isCalculando: false }));
      onAguasChange(finalAguas);
    }
  };

  const availableChannels = getAvailableMpptChannels();
  const usedMppts = new Set(
    roofData.aguasTelhado
      .filter(agua => agua.inversorId && agua.mpptNumero)
      .map(agua => `${agua.inversorId}_mppt${agua.mpptNumero}`)
  );

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="w-5 h-5" />
            Configuração de Orientações
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Configure diferentes orientações, inclinações e associações MPPT para otimizar a geração solar.
            Cada orientação deve ser conectada a um canal MPPT específico do inversor.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
        {/* Validação de erros */}
        {errors.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Informações sobre canais MPPT disponíveis */}
        {roofData.selectedInverters.length > 0 && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Canais MPPT Disponíveis: {availableChannels.length}
            </h4>
            <p className="text-sm text-blue-700">
              Cada orientação deve ser associada a um canal MPPT específico.
              O número máximo de orientações é limitado pelo total de canais MPPT dos inversores selecionados.
            </p>
          </div>
        )}

        {/* Alerta quando não há módulo selecionado */}
        {!roofData.selectedModule && roofData.selectedInverters.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Selecione um módulo solar para calcular o limite máximo de módulos por string e otimizar a configuração do sistema.
            </AlertDescription>
          </Alert>
        )}

        {/* Lista de orientações */}
        <div className="space-y-4">
          {roofData.aguasTelhado.map((agua, index) => {
            const hasValidMppt = agua.inversorId && agua.mpptNumero;
            const orientacaoLabel = getOrientacaoLabel(agua.orientacao);
            
            return (
              <Card key={agua.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${hasValidMppt ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <CardTitle className="text-lg">
                        {agua.nome}
                      </CardTitle>
                      {hasValidMppt && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <Zap className="w-3 h-3 mr-1" />
                          MPPT {agua.mpptNumero}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                       <Badge variant="outline">
                         {((agua.numeroModulos || 0) * (agua.numeroStrings || 1))} módulos
                       </Badge>
                      <Badge variant="outline">
                        {orientacaoLabel}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Nome e MPPT */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome da Orientação</Label>
                      <Input
                        value={agua.nome}
                        onChange={(e) => handleUpdateAgua(agua.id, { nome: e.target.value })}
                        placeholder="Ex: Orientação #1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Canal MPPT *
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="w-4 h-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Cada água deve usar um MPPT diferente</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                      <Select
                        value={hasValidMppt ? `${agua.inversorId}_mppt${agua.mpptNumero}` : ''}
                        onValueChange={(value) => handleMpptChange(agua.id, value)}
                      >
                        <SelectTrigger className={!hasValidMppt ? "border-red-300 bg-red-50" : "border-green-300 bg-green-50"}>
                          <SelectValue placeholder="Selecione o MPPT" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableChannels.map(channel => {
                            const isUsed = usedMppts.has(channel.value);
                            const isCurrentSelection = `${agua.inversorId}_mppt${agua.mpptNumero}` === channel.value;
                            
                            return (
                              <SelectItem 
                                key={channel.value} 
                                value={channel.value}
                                disabled={isUsed && !isCurrentSelection}
                              >
                                <div className="flex items-center gap-2">
                                  <Zap className="w-3 h-3" />
                                  {channel.label} 
                                  {isUsed && !isCurrentSelection && (
                                    <Badge variant="destructive" className="ml-2 text-xs">Em uso</Badge>
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  {/* Configurações solares */}
                  <div>
                    <h4 className="flex items-center gap-2 font-medium text-gray-700 mb-4">
                      <Sun className="w-4 h-4" />
                      Configurações Solares
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Orientação */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Compass className="w-4 h-4" />
                          Orientação (°)
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            max="360"
                            step="1"
                            value={agua.orientacao}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              // Clamp value between 0 and 360
                              const clampedValue = Math.max(0, Math.min(360, value));
                              handleUpdateAgua(agua.id, { orientacao: clampedValue });
                            }}
                            placeholder="180"
                            className={`pr-12 ${agua.orientacao < 0 || agua.orientacao > 360 ? 'border-red-500 bg-red-50' : ''}`}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">°</span>
                        </div>
                        {(agua.orientacao < 0 || agua.orientacao > 360) && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Orientação deve estar entre 0° e 360°
                          </p>
                        )}
                      </div>

                      {/* Inclinação */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Triangle className="w-4 h-4" />
                          Inclinação (°)
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            max="90"
                            step="1"
                            value={agua.inclinacao}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              // Clamp value between 0 and 90
                              const clampedValue = Math.max(0, Math.min(90, value));
                              handleUpdateAgua(agua.id, { inclinacao: clampedValue });
                            }}
                            placeholder="20"
                            className={`pr-12 ${agua.inclinacao < 0 || agua.inclinacao > 90 ? 'border-red-500 bg-red-50' : ''}`}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">°</span>
                        </div>
                        {(agua.inclinacao < 0 || agua.inclinacao > 90) && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Inclinação deve estar entre 0° e 90°
                          </p>
                        )}
                      </div>

                      {/* Número de strings */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            Quantidade de Strings
                          </Label>
                          {hasValidMppt && (() => {
                            // Obter limite específico do MPPT selecionado
                            const inverterData = roofData.selectedInverters.find(inv =>
                              inv.inverter.id === agua.inversorId?.split('_unit')[0]
                            );
                            if (!inverterData) return null;
                            
                            const stringsPorMppt = inverterData.inverter.mppt.stringsPerMppt || 1;
                            return (
                              <span className="text-xs text-muted-foreground">
                                Máx: {stringsPorMppt} strings
                              </span>
                            );
                          })()}
                        </div>
                        <Input
                          type="number"
                          min="1"
                          max={hasValidMppt ? (() => {
                            const inverterData = roofData.selectedInverters.find(inv =>
                              inv.inverter.id === agua.inversorId?.split('_unit')[0]
                            );
                            if (!inverterData) return 1;
                            
                            return inverterData.inverter.mppt.stringsPerMppt || 1;
                          })() : 1}
                          value={agua.numeroStrings || 1}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 1;
                            
                            let maxLimit = 1; // Fallback
                            
                            if (hasValidMppt) {
                              const inverterData = roofData.selectedInverters.find(inv =>
                                inv.inverter.id === agua.inversorId?.split('_unit')[0]
                              );
                              if (inverterData) {
                                maxLimit = inverterData.inverter.mppt.stringsPerMppt || 1;
                              }
                            }
                            
                            const finalValue = Math.max(1, Math.min(value, maxLimit));
                            
                            handleUpdateAgua(agua.id, { numeroStrings: finalValue });
                          }}
                          placeholder="1"
                          className={hasValidMppt ? (() => {
                            const inverterData = roofData.selectedInverters.find(inv =>
                              inv.inverter.id === agua.inversorId?.split('_unit')[0]
                            );
                            if (!inverterData) return '';
                            
                            const stringsPorMppt = inverterData.inverter.mppt.stringsPerMppt || 1;
                            return (agua.numeroStrings || 1) > stringsPorMppt ? 'border-red-500' : '';
                          })() : ''}
                        />
                        {hasValidMppt && (() => {
                          const inverterData = roofData.selectedInverters.find(inv =>
                            inv.inverter.id === agua.inversorId?.split('_unit')[0]
                          );
                          if (!inverterData) return null;
                          
                          const stringsPorMppt = inverterData.inverter.mppt.stringsPerMppt || 1;
                          if ((agua.numeroStrings || 1) > stringsPorMppt) {
                            return (
                              <p className="text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Excede limite máximo ({stringsPorMppt} strings)
                              </p>
                            );
                          }
                          return null;
                        })()}
                      </div>

                      {/* Número de módulos */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Módulos por String
                          </Label>
                           {hasValidMppt && (() => {
                             // Obter limite específico do MPPT selecionado
                             const inverterData = roofData.selectedInverters.find(inv =>
                               inv.inverter.id === agua.inversorId?.split('_unit')[0]
                             );
                             if (!inverterData) return null;
                             
                             const inverterId = inverterData.inverter.id;
                             const limit = mpptLimits[inverterId];
                             const numeroStrings = agua.numeroStrings || 1;
                             
                             if (limit && !limit.isLoading && !limit.error) {
                               // Calcular limite baseado na quantidade de strings
                               const maxModulosPorString = Math.floor(limit.modulosPorMppt / numeroStrings);
                               return (
                                 <span className="text-xs text-muted-foreground">
                                   Máx: {maxModulosPorString} módulos/string
                                 </span>
                               );
                             }
                             return null;
                           })()}
                        </div>
                        <Input
                          type="number"
                          min="0"
                           max={hasValidMppt ? (() => {
                             const inverterData = roofData.selectedInverters.find(inv =>
                               inv.inverter.id === agua.inversorId?.split('_unit')[0]
                             );
                             if (!inverterData) return 100;
                             
                             const inverterId = inverterData.inverter.id;
                             const limit = mpptLimits[inverterId];
                             const numeroStrings = agua.numeroStrings || 1;

                             if (limit && !limit.isLoading && !limit.error) {
                               return Math.floor(limit.modulosPorMppt / numeroStrings);
                             }
                             return 100;
                           })() : 100}
                           value={agua.numeroModulos || 0}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;

                            let maxLimit = 100; // Fallback

                             if (hasValidMppt) {
                               const inverterData = roofData.selectedInverters.find(inv =>
                                 inv.inverter.id === agua.inversorId?.split('_unit')[0]
                               );
                               if (inverterData) {
                                 const inverterId = inverterData.inverter.id;
                                 const limit = mpptLimits[inverterId];
                                 const numeroStrings = agua.numeroStrings || 1;
                                 if (limit && !limit.isLoading && !limit.error) {
                                   maxLimit = Math.floor(limit.modulosPorMppt / numeroStrings);
                                 }
                               }
                             }

                            const finalValue = Math.min(value, maxLimit);

                            handleUpdateAgua(agua.id, { numeroModulos: finalValue });
                          }}
                          placeholder="0"
                           className={hasValidMppt ? (() => {
                             const inverterData = roofData.selectedInverters.find(inv =>
                               inv.inverter.id === agua.inversorId?.split('_unit')[0]
                             );
                             if (!inverterData) return '';
                             
                             const inverterId = inverterData.inverter.id;
                             const limit = mpptLimits[inverterId];
                             const numeroStrings = agua.numeroStrings || 1;

                             if (limit && !limit.isLoading && !limit.error) {
                                const maxModulosPorString = Math.floor(limit.modulosPorMppt / numeroStrings);
                                return (agua.numeroModulos || 0) > maxModulosPorString ? 'border-red-500' : '';
                             }
                             return '';
                           })() : ''}
                        />
                         {hasValidMppt && (() => {
                           const inverterData = roofData.selectedInverters.find(inv =>
                             inv.inverter.id === agua.inversorId?.split('_unit')[0]
                           );
                           if (!inverterData) return null;
                           
                           const inverterId = inverterData.inverter.id;
                           const limit = mpptLimits[inverterId];
                           const numeroStrings = agua.numeroStrings || 1;

                            if (limit && !limit.isLoading && !limit.error) {
                              const maxModulosPorString = Math.floor(limit.modulosPorMppt / numeroStrings);
                              if ((agua.numeroModulos || 0) > maxModulosPorString) {
                                return (
                                  <p className="text-xs text-red-500 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Excede limite máximo ({maxModulosPorString} módulos por string)
                                  </p>
                                );
                              }
                           }
                           return null;
                         })()}
                         
                         {/* Distribuição por strings */}
                          {hasValidMppt && (agua.numeroModulos || 0) > 0 && (() => {
                           const inverterData = roofData.selectedInverters.find(inv =>
                             inv.inverter.id === agua.inversorId?.split('_unit')[0]
                           );
                           if (!inverterData) return null;

                           const numeroStrings = agua.numeroStrings || 1;
                           const totalModulosNoMppt = (agua.numeroModulos || 0) * numeroStrings;

                           return (
                             <div className="mt-1">
                               <p className="text-xs text-blue-600 flex items-center gap-1">
                                 <Settings className="w-3 h-3" />
                                  {agua.numeroModulos || 0} módulos/string × {numeroStrings} strings = {totalModulosNoMppt} módulos no MPPT
                               </p>
                             </div>
                           );
                         })()}
                      </div>
                    </div>
                  </div>

                   {/* Botão Calcular Sistema Completo */}
                   {(agua.numeroModulos || 0) > 0 && hasValidMppt && roofData.location?.latitude && roofData.location?.longitude && (
                    <div className="flex justify-center">
                      <Button 
                        onClick={() => handleCalculateGeneration(agua.id)}
                        disabled={agua.isCalculando || roofData.aguasTelhado.some(a => a.isCalculando)}
                        variant="outline"
                        className="bg-green-50 hover:bg-green-100 border-green-300 text-green-700"
                      >
                        {agua.isCalculando || roofData.aguasTelhado.some(a => a.isCalculando) ? (
                          <>
                            <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin mr-2" />
                            Calculando Sistema...
                          </>
                        ) : (
                          <>
                            <Sun className="w-4 h-4 mr-2" />
                            Atualizar Geração
                          </>
                        )}
                      </Button>
                    </div>
                  )}



                  {/* Botão remover */}
                  {roofData.aguasTelhado.length > 1 && (
                    <div className="pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveAgua(agua.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remover Água
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Botão adicionar nova orientação */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Plus className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Adicionar Orientação</h3>
              <p className="text-sm text-gray-500 mt-1">
                {roofData.selectedInverters.length === 0
                  ? 'Selecione inversores primeiro para habilitar esta opção'
                  : `${availableChannels.length - roofData.aguasTelhado.length} canais MPPT disponíveis`
                }
              </p>
            </div>
            <Button
              onClick={handleAddAgua}
              disabled={roofData.aguasTelhado.length >= availableChannels.length || roofData.selectedInverters.length === 0}
              className="mt-2"
              variant={roofData.selectedInverters.length === 0 ? "secondary" : "default"}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Orientação
            </Button>
          </div>
        </div>

        {/* Resumo do Sistema */}
        {roofData.aguasTelhado.length > 0 && (
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Home className="w-5 h-5" />
                Resumo do sistema multi orientações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                    <Home className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">{roofData.aguasTelhado.length}</p>
                  <p className="text-sm text-gray-600">Orientações Configuradas</p>
                </div>
                
                <div className="text-center p-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                    calculateTotalModules > maxModules
                      ? 'bg-red-100'
                      : 'bg-blue-100'
                  }`}>
                    <Settings className={`w-6 h-6 ${
                      calculateTotalModules > maxModules
                        ? 'text-red-600'
                        : 'text-blue-600'
                    }`} />
                  </div>
                  <p className={`text-2xl font-bold ${
                    calculateTotalModules > maxModules
                      ? 'text-red-600'
                      : 'text-blue-600'
                  }`}>
                     {calculateTotalModules}
                    {maxModules && ` / ${maxModules}`}
                  </p>
                  <p className={`text-sm ${
                    calculateTotalModules > maxModules
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}>
                    Total de Módulos
                     {calculateTotalModules > maxModules && ' (Excede!)'}
                  </p>
                  <p className="text-xs text-gray-500">
                     {((calculateTotalModules * (roofData.selectedModule?.nominalPower || roofData.system?.potenciaModulo || 550)) / 1000).toFixed(1)} kWp
                  </p>
                </div>
                
                <div className="text-center p-3">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2">
                    <Zap className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-purple-600">
                    {availableChannels.length - roofData.aguasTelhado.filter(agua => agua.inversorId).length}
                  </p>
                  <p className="text-sm text-gray-600">MPPTs Disponíveis</p>
                  <p className="text-xs text-gray-500">
                    de {availableChannels.length} total
                  </p>
                </div>
                
                <div className="text-center p-3">
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-2">
                    <Zap className="w-6 h-6 text-orange-600" />
                  </div>
                  <p className="text-2xl font-bold text-orange-600">
                    {roofData.energy?.consumoAnualTotal ? Math.round(roofData.energy.consumoAnualTotal).toLocaleString() : '—'}
                  </p>
                  <p className="text-sm text-gray-600">Consumo Anual</p>
                  <p className="text-xs text-gray-500">kWh necessários</p>
                </div>
                
                <div className="text-center p-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                    <Sun className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {Math.round(roofData.aguasTelhado.reduce((sum, agua) => sum + (agua.geracaoAnual || 0), 0)).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Geração Total</p>
                  <p className="text-xs text-gray-500">kWh/ano calculados</p>
                </div>
                
              </div>
              
              {/* Balanço Energético */}
              {(roofData.energy?.consumoAnualTotal || 0) > 0 && roofData.aguasTelhado.some(agua => agua.geracaoAnual) && (
                <>
                  <Separator className="my-4" />
                  <div className="bg-white p-4 rounded-lg border-2">
                    <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Balanço Energético
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <p className="text-sm text-orange-600 mb-1">Necessário</p>
                        <p className="text-xl font-bold text-orange-700">
                          {Math.round(roofData.energy.consumoAnualTotal || 0).toLocaleString()} kWh/ano
                        </p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-600 mb-1">Geração Total</p>
                        <p className="text-xl font-bold text-green-700">
                          {Math.round(roofData.aguasTelhado.reduce((sum, agua) => sum + (agua.geracaoAnual || 0), 0)).toLocaleString()} kWh/ano
                        </p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-600 mb-1">Cobertura</p>
                        <p className="text-xl font-bold text-blue-700">
                          {(roofData.energy.consumoAnualTotal || 0) > 0 ?
                            Math.round((roofData.aguasTelhado.reduce((sum, agua) => sum + (agua.geracaoAnual || 0), 0) / (roofData.energy.consumoAnualTotal || 1)) * 100) : 0
                          }%
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              {/* Lista de orientações no resumo */}
              <Separator className="my-4" />
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700 mb-3">Orientações Configuradas:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {roofData.aguasTelhado.map((agua) => {
                    const hasValidMppt = agua.inversorId && agua.mpptNumero;
                    const orientacaoLabel = getOrientacaoLabel(agua.orientacao);
                    
                    return (
                      <div 
                        key={agua.id} 
                        className="flex items-center gap-3 p-3 bg-white rounded-lg border"
                      >
                        <div className={`w-3 h-3 rounded-full ${hasValidMppt ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{agua.nome}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{((agua.numeroModulos || 0) * (agua.numeroStrings || 1))} módulos</span>
                            <span>{orientacaoLabel}</span>
                            <span>{agua.inclinacao}°</span>
                            {hasValidMppt && (
                              <Badge variant="secondary" className="text-xs">
                                MPPT {agua.mpptNumero}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
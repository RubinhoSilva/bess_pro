import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, Home, Zap, AlertCircle, Compass, Triangle, Sun, Info, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AguaTelhado, SelectedInverter } from '@/contexts/DimensioningContext';
import { SolarSystemService } from '@/lib/solarSystemService';

interface WaterSelectionFormProps {
  aguasTelhado: AguaTelhado[];
  selectedInverters: SelectedInverter[];
  onAguasChange: (aguas: AguaTelhado[]) => void;
  // Dados para cálculo de geração
  latitude?: number;
  longitude?: number;
  potenciaModulo?: number;
  consumoAnualTotal?: number; // Para comparar com geração
  // Perdas do sistema
  perdaSombreamento?: number;
  perdaMismatch?: number;
  perdaCabeamento?: number;
  perdaSujeira?: number;
  perdaInversor?: number;
  perdaOutras?: number;
}

export const WaterSelectionForm: React.FC<WaterSelectionFormProps> = ({
  aguasTelhado,
  selectedInverters,
  onAguasChange,
  latitude,
  longitude,
  potenciaModulo = 550,
  consumoAnualTotal = 0,
  perdaSombreamento = 3,
  perdaMismatch = 2,
  perdaCabeamento = 2,
  perdaSujeira = 5,
  perdaInversor = 3,
  perdaOutras = 0
}) => {
  const [errors, setErrors] = useState<string[]>([]);

  // Gerar lista de canais MPPT disponíveis baseado nos inversores selecionados
  const getAvailableMpptChannels = () => {
    const channels: Array<{
      value: string;
      label: string;
      inversorId: string;
      mpptNumero: number;
    }> = [];

    selectedInverters.forEach(inverter => {
      for (let unit = 1; unit <= inverter.quantity; unit++) {
        for (let mppt = 1; mppt <= inverter.numeroMppt; mppt++) {
          const uniqueInversorId = `${inverter.id}_unit${unit}`;
          const value = `${uniqueInversorId}_mppt${mppt}`;
          
          channels.push({
            value,
            label: `${inverter.fabricante} ${inverter.modelo} #${unit} - MPPT ${mppt}`,
            inversorId: uniqueInversorId,
            mpptNumero: mppt
          });
        }
      }
    });

    return channels;
  };

  // Validar associações MPPT
  const validateMpptAssignments = () => {
    const newErrors: string[] = [];
    const usedMppts = new Set<string>();

    // Verificar se há inversores selecionados
    if (selectedInverters.length === 0) {
      newErrors.push('Selecione pelo menos um inversor antes de configurar as águas de telhado');
      setErrors(newErrors);
      return;
    }

    aguasTelhado.forEach((agua, index) => {
      // Verificar se tem MPPT associado
      if (!agua.inversorId || !agua.mpptNumero) {
        newErrors.push(`Água "${agua.nome}" precisa ter um MPPT associado`);
        return;
      }

      const mpptKey = `${agua.inversorId}_mppt${agua.mpptNumero}`;
      
      // Verificar duplicação
      if (usedMppts.has(mpptKey)) {
        newErrors.push(`MPPT já está sendo usado por outra água de telhado: ${agua.nome}`);
      } else {
        usedMppts.add(mpptKey);
      }
    });

    setErrors(newErrors);
  };

  // Executar validação sempre que águas ou inversores mudarem
  useEffect(() => {
    validateMpptAssignments();
  }, [aguasTelhado, selectedInverters]);

  // Recalcular geração quando perdas do sistema mudarem
  useEffect(() => {
    if (aguasTelhado.length === 0) return;
    
    console.log('🔄 Perdas do sistema atualizadas, recalculando águas de telhado...');
    
    // Recalcular todas as águas que têm módulos configurados
    aguasTelhado.forEach(agua => {
      if (agua.numeroModulos > 0 && latitude && longitude) {
        console.log(`🧮 Recalculando água ${agua.nome} com perdas atualizadas`);
        handleCalculateGeneration(agua.id);
      }
    });
  }, [perdaSombreamento, perdaMismatch, perdaCabeamento, perdaSujeira, perdaInversor, perdaOutras]);

  const handleAddAgua = () => {
    const newAgua: AguaTelhado = {
      id: crypto.randomUUID(),
      nome: `Água ${aguasTelhado.length + 1}`,
      orientacao: 0,
      inclinacao: 0,
      numeroModulos: 0, // Começar com 0 módulos
      areaDisponivel: 25,
      sombreamentoParcial: 0
    };

    onAguasChange([...aguasTelhado, newAgua]);
  };

  const handleRemoveAgua = (id: string) => {
    if (aguasTelhado.length <= 1) return; // Manter pelo menos uma água
    onAguasChange(aguasTelhado.filter(agua => agua.id !== id));
  };

  const handleUpdateAgua = (id: string, updates: Partial<AguaTelhado>) => {
    const updatedAguas = aguasTelhado.map(agua => 
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

  // Função para calcular geração de uma água específica via Python
  const handleCalculateGeneration = async (aguaId: string) => {
    if (!latitude || !longitude) {
      console.warn('Latitude/longitude não disponíveis para cálculo');
      return;
    }

    const agua = aguasTelhado.find(a => a.id === aguaId);
    if (!agua || agua.numeroModulos === 0) {
      console.warn('Água não encontrada ou sem módulos para calcular');
      return;
    }

    // Marcar como calculando
    const updatedAguas = aguasTelhado.map(a => 
      a.id === aguaId ? { ...a, isCalculando: true } : a
    );
    onAguasChange(updatedAguas);

    try {
      console.log('🌞 Calculando geração para água:', {
        nome: agua.nome,
        orientacao: agua.orientacao,
        inclinacao: agua.inclinacao,
        numeroModulos: agua.numeroModulos,
        latitude,
        longitude
      });

      // Preparar dados para o cálculo usando o mesmo formato do SystemSummary
      const dimensioningData = {
        latitude,
        longitude,
        orientacao: agua.orientacao,
        inclinacao: agua.inclinacao,
        numeroModulos: agua.numeroModulos,
        num_modules: agua.numeroModulos, // Campo específico para forçar uso deste número no Python
        potenciaModulo,
        energyBills: [{ 
          consumoMensal: [500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500] // 6000 kWh/ano padrão
        }],
        selectedModules: [{
          fabricante: 'Canadian Solar',
          modelo: 'CS3W-540MS',
          potenciaNominal: potenciaModulo
        }],
        inverters: selectedInverters.length > 0 ? [{
          fabricante: selectedInverters[0].fabricante,
          modelo: selectedInverters[0].modelo,
          potencia_saida_ca_w: selectedInverters[0].potenciaSaidaCA,
          tipo_rede: selectedInverters[0].tipoRede || "Monofásico 220V"
        }] : [{
          fabricante: 'WEG',
          modelo: 'SIW500H-M',
          potencia_saida_ca_w: 5000,
          tipo_rede: "Monofásico 220V"
        }],
        // Perdas do sistema
        perdaSombreamento,
        perdaMismatch,
        perdaCabeamento,
        perdaSujeira,
        perdaInversor,
        perdaOutras
      };

      // ===== DEBUG: PERDAS SENDO ENVIADAS PARA CÁLCULO =====
      console.log('🔧 [WaterSelectionForm] Perdas enviadas para cálculo:', {
        perdaSombreamento,
        perdaMismatch,
        perdaCabeamento,
        perdaSujeira,
        perdaInversor,
        perdaOutras,
        totalPerdas: (perdaSombreamento + perdaMismatch + perdaCabeamento + perdaSujeira + perdaInversor + perdaOutras)
      });
      console.log('📦 [WaterSelectionForm] Objeto completo enviado para API:', dimensioningData);

      // Chamar API de cálculo avançado
      const dados = await SolarSystemService.calculateAdvancedFromDimensioning(dimensioningData);
        
      // Atualizar água com dados calculados
      const finalAguas = aguasTelhado.map(a => 
        a.id === aguaId ? {
          ...a,
          areaCalculada: dados.area_necessaria_m2,
          geracaoAnual: dados.energia_total_anual_kwh,
          isCalculando: false
        } : a
      );
        
      console.log('✅ Geração calculada:', {
        area: dados.area_necessaria_m2,
        geracao: dados.energia_total_anual_kwh
      });
        
      onAguasChange(finalAguas);
    } catch (error) {
      console.error('❌ Erro ao calcular geração:', error);
      
      // Remover estado de carregamento
      const finalAguas = aguasTelhado.map(a => 
        a.id === aguaId ? { ...a, isCalculando: false } : a
      );
      onAguasChange(finalAguas);
    }
  };

  const availableChannels = getAvailableMpptChannels();
  const usedMppts = new Set(
    aguasTelhado
      .filter(agua => agua.inversorId && agua.mpptNumero)
      .map(agua => `${agua.inversorId}_mppt${agua.mpptNumero}`)
  );

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="w-5 h-5" />
            Configuração de Águas de Telhado
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Configure diferentes orientações, inclinações e associações MPPT para otimizar a geração solar.
            Cada água de telhado deve ser conectada a um canal MPPT específico do inversor.
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
        {selectedInverters.length > 0 && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Canais MPPT Disponíveis: {availableChannels.length}
            </h4>
            <p className="text-sm text-blue-700">
              Cada água de telhado deve ser associada a um canal MPPT específico. 
              O número máximo de águas é limitado pelo total de canais MPPT dos inversores selecionados.
            </p>
          </div>
        )}

        {/* Lista de águas de telhado */}
        <div className="space-y-4">
          {aguasTelhado.map((agua, index) => {
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
                        {agua.numeroModulos} módulos
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
                      <Label>Nome da Água</Label>
                      <Input
                        value={agua.nome}
                        onChange={(e) => handleUpdateAgua(agua.id, { nome: e.target.value })}
                        placeholder="Ex: Água Principal"
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
                            value={agua.orientacao}
                            onChange={(e) => handleUpdateAgua(agua.id, { orientacao: parseInt(e.target.value) || 0 })}
                            placeholder="180"
                            className="pr-12"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">°</span>
                        </div>
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
                            value={agua.inclinacao}
                            onChange={(e) => handleUpdateAgua(agua.id, { inclinacao: parseInt(e.target.value) || 0 })}
                            placeholder="20"
                            className="pr-12"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">°</span>
                        </div>
                      </div>

                      {/* Número de módulos */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          Módulos
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={agua.numeroModulos}
                          onChange={(e) => handleUpdateAgua(agua.id, { numeroModulos: parseInt(e.target.value) || 0 })}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Botão Atualizar Geração */}
                  {agua.numeroModulos > 0 && hasValidMppt && latitude && longitude && (
                    <div className="flex justify-center">
                      <Button 
                        onClick={() => handleCalculateGeneration(agua.id)}
                        disabled={agua.isCalculando}
                        variant="outline"
                        className="bg-green-50 hover:bg-green-100 border-green-300 text-green-700"
                      >
                        {agua.isCalculando ? (
                          <>
                            <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin mr-2" />
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
                  )}

                  {/* Geração Calculada */}
                  {agua.geracaoAnual && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h5 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
                        <Sun className="w-4 h-4" />
                        Geração Calculada
                      </h5>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-green-600">Área Necessária:</span>
                          <div className="font-mono text-green-800 font-medium">
                            {agua.areaCalculada?.toFixed(1) || '—'} m²
                          </div>
                        </div>
                        <div>
                          <span className="text-green-600">Geração Anual:</span>
                          <div className="font-mono text-green-800 font-medium">
                            {agua.geracaoAnual?.toFixed(0).toLocaleString() || '—'} kWh/ano
                          </div>
                        </div>
                      </div>
                    </div>
                  )}


                  {/* Botão remover */}
                  {aguasTelhado.length > 1 && (
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

        {/* Botão adicionar nova água */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Plus className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Adicionar Nova Água</h3>
              <p className="text-sm text-gray-500 mt-1">
                {selectedInverters.length === 0 
                  ? 'Selecione inversores primeiro para habilitar esta opção'
                  : `${availableChannels.length - aguasTelhado.length} canais MPPT disponíveis`
                }
              </p>
            </div>
            <Button
              onClick={handleAddAgua}
              disabled={aguasTelhado.length >= availableChannels.length || selectedInverters.length === 0}
              className="mt-2"
              variant={selectedInverters.length === 0 ? "secondary" : "default"}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Água de Telhado
            </Button>
          </div>
        </div>

        {/* Resumo do Sistema */}
        {aguasTelhado.length > 0 && (
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Home className="w-5 h-5" />
                Resumo do Sistema Multi-Água
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                    <Home className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">{aguasTelhado.length}</p>
                  <p className="text-sm text-gray-600">Águas Configuradas</p>
                </div>
                
                <div className="text-center p-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                    <Settings className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {aguasTelhado.reduce((sum, agua) => sum + agua.numeroModulos, 0)}
                  </p>
                  <p className="text-sm text-gray-600">Total de Módulos</p>
                  <p className="text-xs text-gray-500">
                    {((aguasTelhado.reduce((sum, agua) => sum + agua.numeroModulos, 0) * potenciaModulo) / 1000).toFixed(1)} kWp
                  </p>
                </div>
                
                <div className="text-center p-3">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2">
                    <Zap className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-purple-600">
                    {availableChannels.length - aguasTelhado.filter(agua => agua.inversorId).length}
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
                    {consumoAnualTotal ? Math.round(consumoAnualTotal).toLocaleString() : '—'}
                  </p>
                  <p className="text-sm text-gray-600">Consumo Anual</p>
                  <p className="text-xs text-gray-500">kWh necessários</p>
                </div>
                
                <div className="text-center p-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                    <Sun className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {Math.round(aguasTelhado.reduce((sum, agua) => sum + (agua.geracaoAnual || 0), 0)).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Geração Total</p>
                  <p className="text-xs text-gray-500">kWh/ano calculados</p>
                </div>
                
              </div>
              
              {/* Balanço Energético */}
              {consumoAnualTotal > 0 && aguasTelhado.some(agua => agua.geracaoAnual) && (
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
                          {Math.round(consumoAnualTotal).toLocaleString()} kWh/ano
                        </p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-600 mb-1">Geração Total</p>
                        <p className="text-xl font-bold text-green-700">
                          {Math.round(aguasTelhado.reduce((sum, agua) => sum + (agua.geracaoAnual || 0), 0)).toLocaleString()} kWh/ano
                        </p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-600 mb-1">Cobertura</p>
                        <p className="text-xl font-bold text-blue-700">
                          {consumoAnualTotal > 0 ? 
                            Math.round((aguasTelhado.reduce((sum, agua) => sum + (agua.geracaoAnual || 0), 0) / consumoAnualTotal) * 100) : 0
                          }%
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              {/* Lista de águas no resumo */}
              <Separator className="my-4" />
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700 mb-3">Águas Configuradas:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {aguasTelhado.map((agua) => {
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
                            <span>{agua.numeroModulos} módulos</span>
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
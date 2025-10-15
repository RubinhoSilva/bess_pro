import React, { useState, useEffect, useMemo } from 'react';
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
// import { AguaTelhado, SelectedInverter as LegacySelectedInverter } from '@/contexts/DimensioningContext';
import { SelectedInverter } from '@bess-pro/shared';
import { SolarSystemService } from '@/lib/solarSystemService';
import { useMultipleMPPTCalculations } from '@/hooks/useMPPT';
import { SolarModule } from '@bess-pro/shared';

interface AguaTelhado {
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

// Tipo local para resultado do cálculo
interface FrontendPvlibData {
  energiaAnualKwh: number;
  areaNecessariaM2?: number;
}

interface WaterSelectionFormProps {
  aguasTelhado: AguaTelhado[];
  selectedInverters: SelectedInverter[];
  onAguasChange: (aguas: AguaTelhado[]) => void;
  // Dados para cálculo de geração
  latitude?: number;
  longitude?: number;
  potenciaModulo?: number;
  consumoAnualTotal?: number; // Para comparar com geração
  fonteDados?: 'pvgis' | 'nasa'; // Fonte de dados para cálculo
  // Perdas do sistema
  perdaSombreamento?: number;
  perdaMismatch?: number;
  perdaCabeamento?: number;
  perdaSujeira?: number;
  perdaInversor?: number;
  perdaOutras?: number;
  // Props para MPPT calculations - agora usa SolarModule completo
  selectedModule?: SolarModule;
}

export const WaterSelectionForm: React.FC<WaterSelectionFormProps> = ({
  aguasTelhado,
  selectedInverters,
  onAguasChange,
  latitude,
  longitude,
  potenciaModulo = 550,
  consumoAnualTotal = 0,
  fonteDados = 'pvgis',
  perdaSombreamento = 3,
  perdaMismatch = 2,
  perdaCabeamento = 2,
  perdaSujeira = 5,
  perdaInversor = 3,
  perdaOutras = 0,
  selectedModule
}) => {
  const [errors, setErrors] = useState<string[]>([]);
  
  // Estado para toasts de auto-correção
  const [toasts, setToasts] = useState<Array<{
    id: string;
    aguaNome: string;
    original: number;
    corrigido: number;
    modulosPorString: number;
    stringsPorMppt: number;
    timestamp: number;
  }>>([]);

  // Gerar lista de canais MPPT disponíveis baseado nos inversores selecionados
  const getAvailableMpptChannels = () => {
    const channels: Array<{
      value: string;
      label: string;
      inversorId: string;
      mpptNumero: number;
    }> = [];

    // Verificar se há inversores selecionados
    if (!selectedInverters?.length) {
      console.log('🔍 [WaterSelectionForm] Nenhum inversor selecionado');
      return channels;
    }

    console.log('🔍 [WaterSelectionForm] Processando inversores:', selectedInverters);

    selectedInverters.forEach(inverter => {
      const quantity = inverter.quantity || 1;
      const numberOfMppts = inverter.inverter.mppt.numberOfMppts || 1; // Acessar propriedade correta do tipo compartilhado
      const manufacturerName = inverter.inverter.manufacturer.name || 'Desconhecido';
      const modelName = inverter.inverter.model || 'Modelo';
      
      console.log(`🔍 [WaterSelectionForm] Inversor: ${manufacturerName} ${modelName}, Quantity: ${quantity}, MPPTs: ${numberOfMppts}`);
      
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

    console.log('🔍 [WaterSelectionForm] Canais MPPT gerados:', channels);
    return channels;
  };

  // Validar associações MPPT
  const validateMpptAssignments = () => {
    const newErrors: string[] = [];
    const usedMppts = new Set<string>();

    // Verificar se há inversores selecionados
    if (!selectedInverters?.length) {
      newErrors.push('Selecione pelo menos um inversor antes de configurar as orientações');
      setErrors(newErrors);
      return;
    }

    aguasTelhado.forEach((agua, index) => {
      // Verificar se tem MPPT associado
      if (!agua.inversorId || !agua.mpptNumero) {
        newErrors.push(`Orientação "${agua.nome}" precisa ter um MPPT associado`);
        return;
      }

      const mpptKey = `${agua.inversorId}_mppt${agua.mpptNumero}`;
      
      // Verificar duplicação
      if (usedMppts.has(mpptKey)) {
        newErrors.push(`MPPT já está sendo usado por outra orientação: ${agua.nome}`);
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

  // Debug para verificar dados dos inversores
  useEffect(() => {
    console.log('🔍 [WaterSelectionForm] selectedInverters mudou:', selectedInverters);
    console.log('🔍 [WaterSelectionForm] availableChannels:', getAvailableMpptChannels());
  }, [selectedInverters]);

  // Recalcular geração quando perdas do sistema mudarem
  useEffect(() => {
    if (aguasTelhado.length === 0) return;
    
    // Verificar se há águas com módulos configurados
    const aguasComModulos = aguasTelhado.filter(agua => (agua.numeroModulos || 0) > 0);
    if (aguasComModulos.length === 0 || !latitude || !longitude) return;
    

    
    // Recalcular apenas uma vez (o sistema completo) usando a primeira água com módulos
    const primeiraAguaComModulos = aguasComModulos[0];
    if (primeiraAguaComModulos) {

      handleCalculateGeneration(primeiraAguaComModulos.id);
    }
  }, [perdaSombreamento, perdaMismatch, perdaCabeamento, perdaSujeira, perdaInversor, perdaOutras]);

  // Escutar eventos de auto-correção
  useEffect(() => {
    const handleAutoCorrection = (event: CustomEvent) => {
      const { detail } = event;
      const newToast = {
        id: Date.now().toString(),
        aguaNome: detail.aguaNome,
        original: detail.original,
        corrigido: detail.corrigido,
        modulosPorString: detail.modulosPorString,
        stringsPorMppt: detail.stringsPorMppt,
        timestamp: Date.now()
      };
      
      setToasts(prev => [...prev, newToast]);
      
      // Auto-remover toast após 4 segundos
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== newToast.id));
      }, 4000);
    };

    window.addEventListener('agua-balanceada', handleAutoCorrection as EventListener);
    
    return () => {
      window.removeEventListener('agua-balanceada', handleAutoCorrection as EventListener);
    };
  }, []);

  const handleAddAgua = () => {
    // Encontrar próximo número disponível
    const existingNumbers = aguasTelhado
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

  // Preparar dados para MPPT calculations
  const invertersForMPPT = selectedInverters?.map(inv => ({
    id: inv.inverter.id,
    fabricante: inv.inverter.manufacturer.name || 'Desconhecido',
    modelo: inv.inverter.model || 'Modelo',
    potenciaSaidaCA: inv.inverter.power.ratedACPower || 0,
    potenciaFvMax: inv.inverter.power.maxPVPower || 0,
    tensaoCcMax: inv.inverter.power.maxDCVoltage || 0,
    numeroMppt: inv.inverter.mppt.numberOfMppts || 1,
    stringsPorMppt: inv.inverter.mppt.stringsPerMppt || 1,
    correnteEntradaMax: inv.inverter.power.maxInputCurrent || 0,
    faixaMpptMin: inv.inverter.mppt.mpptRange ? parseInt(inv.inverter.mppt.mpptRange.split('-')[0]) : 0,
    faixaMpptMax: inv.inverter.mppt.mpptRange ? parseInt(inv.inverter.mppt.mpptRange.split('-')[1]) : 0,
    tipoRede: inv.inverter.electrical.gridType || 'Desconhecido'
  })) || [];

  const defaultCoordinates = {
    latitude: latitude || -15.7942,
    longitude: longitude || -47.8822
  };

  // Hook para calcular limites MPPT - agora usa selectedModule completo com tipo compartilhado
  const moduleToUse = useMemo(() => {
    if (!selectedModule) return null;

    return {
      potenciaNominal: selectedModule.nominalPower,
      vocStc: selectedModule.specifications.voc,
      tempCoefVoc: selectedModule.parameters.temperature.tempCoeffVoc
    };
  }, [selectedModule]);
    
  const mpptLimits = useMultipleMPPTCalculations(
    invertersForMPPT,
    moduleToUse || { potenciaNominal: 550, vocStc: 45, tempCoefVoc: -0.3 }, // Default values
    defaultCoordinates,
    Boolean(moduleToUse && selectedInverters?.length)
  );

  // Calcular limite máximo de módulos baseado nos inversores
  const calculateMaxModules = () => {
    if (!selectedInverters?.length) return 50; // Fallback
    
    let totalMaxModules = 0;
    selectedInverters.forEach(inverter => {
      const inverterId = inverter.inverter.id;
      const limit = mpptLimits[inverterId];
      if (limit && !limit.isLoading && !limit.error) {
        totalMaxModules += limit.modulosTotal * (inverter.quantity || 1);
      }
    });
    
    return totalMaxModules || 50;
  };

  const maxModules = calculateMaxModules();

  // Função para calcular geração do sistema completo (todas as águas juntas)
  const handleCalculateGeneration = async (aguaId: string) => {
    if (!latitude || !longitude) {
      return;
    }

    const agua = aguasTelhado.find(a => a.id === aguaId);
    if (!agua) {
      return;
    }

    // Verificar se existe pelo menos uma água com módulos
    const totalModulos = aguasTelhado.reduce((sum, a) => sum + (a.numeroModulos || 0), 0);
    if (totalModulos === 0) {
      return;
    }

    // Marcar TODAS as águas como calculando (já que o cálculo é do sistema completo)
    const updatedAguas = aguasTelhado.map(a => ({ ...a, isCalculando: true }));
    onAguasChange(updatedAguas);

    try {
      const dadosCalculo = {
        totalAguas: aguasTelhado.length,
        totalModulos,
        aguas: aguasTelhado.map(a => ({
          nome: a.nome,
          orientacao: a.orientacao,
          inclinacao: a.inclinacao,
          numeroModulos: a.numeroModulos || 0
        })),
        latitude,
        longitude
      };

      // Calcular orientação e inclinação médias ponderadas por número de módulos
      let orientacaoMedia = 0;
      let inclinacaoMedia = 0;

      if (totalModulos > 0) {
        let somaOrientacao = 0;
        let somaInclinacao = 0;

        aguasTelhado.forEach(a => {
          const modulos = a.numeroModulos || 0;
          if (modulos > 0) {
            // Validar e clampar valores antes de calcular média ponderada
            const orientacaoValida = Math.max(0, Math.min(360, a.orientacao));
            const inclinacaoValida = Math.max(0, Math.min(90, a.inclinacao));

            somaOrientacao += orientacaoValida * modulos;
            somaInclinacao += inclinacaoValida * modulos;
          }
        });

        orientacaoMedia = Math.round(somaOrientacao / totalModulos);
        inclinacaoMedia = Math.round(somaInclinacao / totalModulos);

        // Garantir que os valores médios também estejam dentro dos limites
        orientacaoMedia = Math.max(0, Math.min(360, orientacaoMedia));
        inclinacaoMedia = Math.max(0, Math.min(90, inclinacaoMedia));
      }

      // Adicionar parâmetros médios ao objeto de cálculo
      const parametrosMedios = {
        orientacaoMedia,
        inclinacaoMedia,
        totalModulos
      };

      // Preparar dados do inversor para incluir em cada água
      const inverterData = selectedInverters.length > 0 ? {
        fabricante: selectedInverters[0].inverter.manufacturer.name || 'Desconhecido',
        modelo: selectedInverters[0].inverter.model || 'Modelo',
        potencia_saida_ca_w: selectedInverters[0].inverter.power.ratedACPower || 0,
        tipo_rede: selectedInverters[0].inverter.electrical.gridType || 'Desconhecido',
        potencia_fv_max_w: selectedInverters[0].inverter.power.maxPVPower || 0,
        tensao_cc_max_v: selectedInverters[0].inverter.power.maxDCVoltage || 0,
        numero_mppt: selectedInverters[0].inverter.mppt.numberOfMppts || 1,
        strings_por_mppt: selectedInverters[0].inverter.mppt.stringsPerMppt || 1,
        eficiencia_max: selectedInverters[0].inverter.electrical.maxEfficiency || 0,
        efficiency_dc_ac: ((selectedInverters[0].inverter.electrical.maxEfficiency || 0) / 100),
        corrente_entrada_max_a: selectedInverters[0].inverter.power.maxInputCurrent || 0,
        potencia_aparente_max_va: selectedInverters[0].inverter.power.maxApparentPower || 0,
        // Parâmetros Sandia (se disponíveis no tipo compartilhado)
        vdco: undefined, // Não disponível no tipo compartilhado atualmente
        pso: undefined,
        c0: undefined,
        c1: undefined,
        c2: undefined,
        c3: undefined,
        pnt: undefined
      } : undefined;

      // Preparar dados para o cálculo usando TODAS as águas de telhado
      const dimensioningData = {
        latitude,
        longitude,
        fonteDados, // ✅ Adicionar fonte de dados
        // ✅ Enviar TODAS as águas COM INVERSOR EMBUTIDO
          aguasTelhado: aguasTelhado.map(a => ({
            id: a.id,
            nome: a.nome,
            orientacao: a.orientacao,
            inclinacao: a.inclinacao,
            numeroModulos: a.numeroModulos || 0,
            sombreamentoParcial: a.sombreamentoParcial || 0,
            inversorId: a.inversorId, // Manter para compatibilidade
            mpptNumero: a.mpptNumero, // Manter para compatibilidade
            // ✅ NOVO: Incluir dados do inversor dentro de cada água
            inversor: inverterData
          })),
        potenciaModulo: selectedModule ? selectedModule.nominalPower : potenciaModulo,
        energyBills: [{ 
          consumoMensal: [500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500] // 6000 kWh/ano padrão
        }],
        selectedModules: selectedModule ? (() => {
          return [{
            fabricante: selectedModule.manufacturer.name,
            modelo: selectedModule.model,
            potencia_nominal_w: selectedModule.nominalPower,
            largura_mm: selectedModule.dimensions.widthMm,
            altura_mm: selectedModule.dimensions.heightMm,
            peso_kg: selectedModule.dimensions.weightKg,
            vmpp: selectedModule.specifications.vmpp,
            impp: selectedModule.specifications.impp,
            voc_stc: selectedModule.specifications.voc,
            isc_stc: selectedModule.specifications.isc,
            eficiencia: selectedModule.specifications.efficiency,
            temp_coef_pmax: selectedModule.parameters.temperature.tempCoeffPmax,
            alpha_sc: selectedModule.parameters.temperature.tempCoeffPmax / 100,
            beta_oc: selectedModule.parameters.temperature.tempCoeffVoc / 100,
            gamma_r: selectedModule.parameters.temperature.tempCoeffIsc / 100,
            // Parâmetros do modelo de diodo único
            cells_in_series: selectedModule.specifications.numberOfCells,
            a_ref: selectedModule.parameters.diode.aRef,
            il_ref: selectedModule.parameters.diode.iLRef,
            io_ref: selectedModule.parameters.diode.iORef,
            rs: selectedModule.parameters.diode.rS,
            rsh_ref: selectedModule.parameters.diode.rShRef,
            // Outros parâmetros
            material: selectedModule.parameters.spectral.material,
            technology: selectedModule.specifications.technology
          }];
        })().map(m => {
          console.log('🔍 [WaterSelectionForm] selectedModule ENVIADO:', JSON.stringify({
            fabricante: m.fabricante,
            modelo: m.modelo,
            tempCoeffPmax: selectedModule?.parameters?.temperature?.tempCoeffPmax,
            tempCoeffVoc: selectedModule?.parameters?.temperature?.tempCoeffVoc,
            tempCoeffIsc: selectedModule?.parameters?.temperature?.tempCoeffIsc,
            alpha_sc: m.alpha_sc,
            beta_oc: m.beta_oc,
            gamma_r: m.gamma_r,
            temp_coef_pmax: m.temp_coef_pmax
          }, null, 2));
          return m;
        }) : [],
        // ✅ NOVOS CAMPOS AUSENTES
        modelo_decomposicao: 'louche',
        modelo_transposicao: 'perez',
        perdas_sistema: (perdaSombreamento + perdaMismatch + perdaCabeamento + perdaSujeira + perdaInversor + perdaOutras),
        fator_seguranca: 1.1,
        // Perdas individuais (mantidas para compatibilidade)
        perdaSombreamento,
        perdaMismatch,
        perdaCabeamento,
        perdaSujeira,
        perdaInversor,
        perdaOutras
      };



      // Chamar API de cálculo avançado
      const dados = await SolarSystemService.calculateAdvancedFromDimensioning(dimensioningData);
      
      // Debug: Verificar dados retornados pela API
      console.log('🔍 [WaterSelectionForm] Dados retornados pela API:', dados);
      console.log('🔍 [WaterSelectionForm] energiaAnualKwh:', (dados as any).energiaAnualKwh);
      console.log('🔍 [WaterSelectionForm] area_necessaria_m2:', (dados as any).area_necessaria_m2);
        
      // Distribuir os resultados proporcionalmente entre todas as águas que têm módulos
      const finalAguas = aguasTelhado.map(a => {
        const modulos = a.numeroModulos || 0;
        if (modulos > 0) {
          // Calcular proporção desta água no sistema total
          const proporcao = modulos / totalModulos;
          // Usar energiaAnualKwh (camelCase) - campo correto retornado pelo adapter
          const energiaTotal = (dados as any).energiaAnualKwh || 0;
          const geracaoProporcional = Math.round(energiaTotal * proporcao * 100) / 100;
          
          console.log('🔍 [WaterSelectionForm] Processando água:', a.nome);
          console.log('🔍 [WaterSelectionForm] - Módulos:', modulos, 'Total:', totalModulos, 'Proporção:', proporcao);
          console.log('🔍 [WaterSelectionForm] - Geração total API:', (dados as any).energiaAnualKwh);
          console.log('🔍 [WaterSelectionForm] - Geração proporcional:', geracaoProporcional);
          
          return {
            ...a,
            areaCalculada: Math.round(((dados as any).area_necessaria_m2 || 0) * proporcao * 100) / 100,
            geracaoAnual: geracaoProporcional,
            isCalculando: false
          };
        } else {
          // Águas sem módulos apenas param de calcular
          return {
            ...a,
            isCalculando: false
          };
        }
      });

      const energiaTotalSistema = (dados as any).energiaAnualKwh || 0;
      const resultadosSistema = {
        areaTotalSistema: (dados as any).area_necessaria_m2,
        geracaoTotalSistema: energiaTotalSistema,
        totalModulos,
        distribuicao: finalAguas
          .filter(a => a.numeroModulos > 0)
          .map(a => ({
            nome: a.nome,
            modulos: a.numeroModulos || 0,
            proporcao: Math.round(((a.numeroModulos || 0) / totalModulos) * 10000) / 100 + '%',
            area: a.areaCalculada,
            geracao: a.geracaoAnual
          }))
      };
      
      console.log('🔍 [WaterSelectionForm] Resultados do sistema:', resultadosSistema);
        
      
      console.log('🔍 [WaterSelectionForm] Águas finais:', finalAguas);
      console.log('🔍 [WaterSelectionForm] Geração total calculada:', aguasTelhado.reduce((sum, agua) => sum + (agua.geracaoAnual || 0), 0));
      
      onAguasChange(finalAguas);
    } catch (error) {
      
      // Remover estado de carregamento de TODAS as águas
      const finalAguas = aguasTelhado.map(a => ({ ...a, isCalculando: false }));
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
        {selectedInverters.length > 0 && (
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
{!selectedModule && selectedInverters.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Selecione um módulo solar para calcular o limite máximo de módulos por string e otimizar a configuração do sistema.
            </AlertDescription>
          </Alert>
        )}

        {/* Lista de orientações */}
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
                         {agua.numeroModulos || 0} módulos
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

                      {/* Número de módulos */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Módulos por String
                          </Label>
                           {hasValidMppt && (() => {
                             // Obter limite específico do MPPT selecionado
                             const inverterData = selectedInverters.find(inv => 
                               inv.inverter.id === agua.inversorId?.split('_unit')[0]
                             );
                             if (!inverterData) return null;
                             
                             const inverterId = inverterData.inverter.id;
                             const limit = mpptLimits[inverterId];
                             
                             if (limit && !limit.isLoading && !limit.error) {
                               return (
                                 <span className="text-xs text-muted-foreground">
                                   Máx: {limit.modulosPorString} módulos/string
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
                             const inverterData = selectedInverters.find(inv => 
                               inv.inverter.id === agua.inversorId?.split('_unit')[0]
                             );
                             if (!inverterData) return 100;
                             
                             const inverterId = inverterData.inverter.id;
                             const limit = mpptLimits[inverterId];

                             return limit && !limit.isLoading && !limit.error ? limit.modulosPorString : 100;
                           })() : 100}
                           value={agua.numeroModulos || 0}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;

                            let maxLimit = 100; // Fallback

                             if (hasValidMppt) {
                               const inverterData = selectedInverters.find(inv =>
                                 inv.inverter.id === agua.inversorId?.split('_unit')[0]
                               );
                               if (inverterData) {
                                 const inverterId = inverterData.inverter.id;
                                 const limit = mpptLimits[inverterId];
                                 if (limit && !limit.isLoading && !limit.error) {
                                   maxLimit = limit.modulosPorString;
                                 }
                               }
                             }

                            const finalValue = Math.min(value, maxLimit);

                            handleUpdateAgua(agua.id, { numeroModulos: finalValue });
                          }}
                          placeholder="0"
                           className={hasValidMppt ? (() => {
                             const inverterData = selectedInverters.find(inv => 
                               inv.inverter.id === agua.inversorId?.split('_unit')[0]
                             );
                             if (!inverterData) return '';
                             
                             const inverterId = inverterData.inverter.id;
                             const limit = mpptLimits[inverterId];

                             if (limit && !limit.isLoading && !limit.error) {
                               return agua.numeroModulos > limit.modulosPorString ? 'border-red-500' : '';
                             }
                             return '';
                           })() : ''}
                        />
                         {hasValidMppt && (() => {
                           const inverterData = selectedInverters.find(inv => 
                             inv.inverter.id === agua.inversorId?.split('_unit')[0]
                           );
                           if (!inverterData) return null;
                           
                           const inverterId = inverterData.inverter.id;
                           const limit = mpptLimits[inverterId];

                            if (limit && !limit.isLoading && !limit.error && (agua.numeroModulos || 0) > limit.modulosPorString) {
                             return (
                               <p className="text-xs text-red-500 flex items-center gap-1">
                                 <AlertCircle className="w-3 h-3" />
                                 Excede limite máximo ({limit.modulosPorString} módulos por string)
                               </p>
                             );
                           }
                           return null;
                         })()}
                        
                         {/* Distribuição por strings */}
                         {hasValidMppt && agua.numeroModulos > 0 && (() => {
                           const inverterData = selectedInverters.find(inv =>
                             inv.inverter.id === agua.inversorId?.split('_unit')[0]
                           );
                           if (!inverterData) return null;

                           const stringsPorMppt = inverterData.inverter.mppt.stringsPerMppt || 1;
                            const totalModulosNoMppt = (agua.numeroModulos || 0) * stringsPorMppt;

                           return (
                             <div className="mt-1">
                               <p className="text-xs text-blue-600 flex items-center gap-1">
                                 <Settings className="w-3 h-3" />
                                  {agua.numeroModulos || 0} módulos/string × {stringsPorMppt} strings = {totalModulosNoMppt} módulos no MPPT
                               </p>
                             </div>
                           );
                         })()}
                      </div>
                    </div>
                  </div>

                   {/* Botão Calcular Sistema Completo */}
                   {(agua.numeroModulos || 0) > 0 && hasValidMppt && latitude && longitude && (
                    <div className="flex justify-center">
                      <Button 
                        onClick={() => handleCalculateGeneration(agua.id)}
                        disabled={agua.isCalculando || aguasTelhado.some(a => a.isCalculando)}
                        variant="outline"
                        className="bg-green-50 hover:bg-green-100 border-green-300 text-green-700"
                      >
                        {agua.isCalculando || aguasTelhado.some(a => a.isCalculando) ? (
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

        {/* Botão adicionar nova orientação */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Plus className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Adicionar Orientação</h3>
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
              Adicionar Orientação
            </Button>
          </div>
        </div>

        {/* Resumo do Sistema */}
        {aguasTelhado.length > 0 && (
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
                  <p className="text-2xl font-bold text-green-600">{aguasTelhado.length}</p>
                  <p className="text-sm text-gray-600">Orientações Configuradas</p>
                </div>
                
                <div className="text-center p-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                    aguasTelhado.reduce((sum, agua) => sum + (agua.numeroModulos || 0), 0) > maxModules
                      ? 'bg-red-100' 
                      : 'bg-blue-100'
                  }`}>
                    <Settings className={`w-6 h-6 ${
                      aguasTelhado.reduce((sum, agua) => sum + (agua.numeroModulos || 0), 0) > maxModules
                        ? 'text-red-600'
                        : 'text-blue-600'
                    }`} />
                  </div>
                  <p className={`text-2xl font-bold ${
                    aguasTelhado.reduce((sum, agua) => sum + agua.numeroModulos, 0) > maxModules
                      ? 'text-red-600'
                      : 'text-blue-600'
                  }`}>
                     {aguasTelhado.reduce((sum, agua) => sum + (agua.numeroModulos || 0), 0)}
                    {maxModules && ` / ${maxModules}`}
                  </p>
                  <p className={`text-sm ${
                    aguasTelhado.reduce((sum, agua) => sum + agua.numeroModulos, 0) > maxModules
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}>
                    Total de Módulos
                     {aguasTelhado.reduce((sum, agua) => sum + (agua.numeroModulos || 0), 0) > maxModules && ' (Excede!)'}
                  </p>
                  <p className="text-xs text-gray-500">
                     {((aguasTelhado.reduce((sum, agua) => sum + (agua.numeroModulos || 0), 0) * (selectedModule ? selectedModule.nominalPower : potenciaModulo)) / 1000).toFixed(1)} kWp
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
                    {(() => {
                      const total = aguasTelhado.reduce((sum, agua) => sum + (agua.geracaoAnual || 0), 0);
                      console.log('🔍 [WaterSelectionForm] Valor exibido na UI (Geração Total):', total);
                      console.log('🔍 [WaterSelectionForm] aguasTelhado com geracaoAnual:', aguasTelhado.map(a => ({ nome: a.nome, geracaoAnual: a.geracaoAnual })));
                      return Math.round(total).toLocaleString();
                    })()}
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
              
              {/* Lista de orientações no resumo */}
              <Separator className="my-4" />
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700 mb-3">Orientações Configuradas:</h4>
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
                            <span>{agua.numeroModulos || 0} módulos</span>
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
      
      {/* Toasts de Auto-correção */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg max-w-sm animate-in slide-in-from-right-full duration-300"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <Settings className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-blue-900">
                  Auto-correção aplicada
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  <span className="font-medium">{toast.aguaNome}</span>: {toast.original} → {toast.corrigido} módulos
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {toast.modulosPorString} módulos/string × {toast.stringsPorMppt} strings
                </p>
              </div>
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="flex-shrink-0 text-blue-400 hover:text-blue-600 transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
      
    </TooltipProvider>
  );
};
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Sun, 
  Calculator, 
  Loader,
  Home
} from 'lucide-react';
import { FrontendCalculationLogger } from '@/lib/calculationLogger';
import { SystemCalculations, SystemCalculationResults } from '@/lib/systemCalculations';
import { useSolarSystemCalculation } from '@/hooks/useSolarSystemCalculation';

interface SystemSummaryProps {
  formData: any;
  className?: string;
  onDimensioningChange?: (newData: any) => void;
  aguasTelhado?: Array<{
    id: string;
    nome: string;
    numeroModulos: number;
    geracaoAnual?: number;
    areaCalculada?: number;
  }>;
  showDimensioningSlider?: boolean; // Nova prop para controlar se mostra o slider
}

const SystemSummary: React.FC<SystemSummaryProps> = ({ formData, className = '', onDimensioningChange, aguasTelhado = [], showDimensioningSlider = false }) => {
  console.log('🔄 [SystemSummary] Re-renderizando com props:', {
    aguasTelhado: aguasTelhado.map(agua => ({ id: agua.id, nome: agua.nome, numeroModulos: agua.numeroModulos })),
    formDataModulos: formData.numeroModulos,
    formDataModulosCalculado: formData.numeroModulosCalculado
  });
  // All hooks must be declared at the top level
  const [systemResults, setSystemResults] = useState<SystemCalculationResults | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [localAguasTelhado, setLocalAguasTelhado] = useState(aguasTelhado); // Estado local para águas de telhado
  
  // Hooks Python removidos - cálculos não são mais chamados automaticamente

  // Variables that depend on formData
  const hasConsumptionData = formData.energyBills && formData.energyBills.length > 0;
  const consumoTotalAnual = formData.energyBills?.reduce((acc: number, bill: any) => {
    return acc + bill.consumoMensal.reduce((sum: number, consumo: number) => sum + consumo, 0);
  }, 0) || 0;
  const logger = new FrontendCalculationLogger(`system-summary-${Date.now()}`);

  // Sincronizar estado local com prop quando ela mudar (de fora)
  useEffect(() => {
    setLocalAguasTelhado(aguasTelhado);
  }, [aguasTelhado]);

  // Calcular totais das águas de telhado usando estado local
  const getTotalModulosDimensionados = () => {
    const total = localAguasTelhado.reduce((total, agua) => total + agua.numeroModulos, 0);
    console.log('🔢 Total módulos dimensionados:', { 
      localAguasTelhado: localAguasTelhado.map(agua => ({ 
        id: agua.id, 
        nome: agua.nome, 
        numeroModulos: agua.numeroModulos 
      })), 
      total 
    });
    return total;
  };

  const getTotalGeracaoDimensionada = () => {
    return localAguasTelhado.reduce((total, agua) => total + (agua.geracaoAnual || 0), 0);
  };

  const getTotalAreaDimensionada = () => {
    return localAguasTelhado.reduce((total, agua) => total + (agua.areaCalculada || 0), 0);
  };

  const hasDimensionedSystem = () => {
    return localAguasTelhado.length > 0 && localAguasTelhado.some(agua => agua.geracaoAnual);
  };

  // useCallback hooks
  // Função de recálculo removida - não mais necessária sem chamadas Python automáticas

  // useEffect hooks simplificados - removidos dependencies do Python

  // Effect removido - não calcular automaticamente, apenas mostrar dados das águas configuradas
  useEffect(() => {
    // Criar resultados vazios por padrão
    setSystemResults({
      numeroModulos: 0,
      potenciaPico: 0,
      areaEstimada: 0,
      geracaoEstimadaAnual: 0,
      geracaoEstimadaMensal: Array(12).fill(0),
      irradiacaoMediaAnual: 0,
      coberturaConsumo: 0,
      usedPVLIB: false
    });
    setIsCalculating(false);
  }, []);

  // Se ainda está calculando ou não há resultados, mostrar loading ou valores padrão
  if (isCalculating || !systemResults) {
    return (
      <Card className={`glass border-orange-400/30 ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
            {isCalculating ? <Loader className="w-5 h-5 animate-spin" /> : <Calculator className="w-5 h-5" />}
            Sistema Configurado
            {isCalculating && <span className="text-sm font-normal">Calculando...</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-center text-muted-foreground">
              {isCalculating ? (
                <>
                  <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <p>Processando cálculos do sistema...</p>
                </>
              ) : (
                <p>Carregando dados do sistema...</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Usar apenas dados dos cálculos locais
  const { 
    potenciaPico,
    numeroModulos, 
    areaEstimada,
    geracaoEstimadaAnual,
    irradiacaoMediaAnual,
    coberturaConsumo,
    usedPVLIB
  } = systemResults;
  
  // Usar número de módulos dos cálculos locais
  const finalNumeroModulos = numeroModulos;
  const finalCoberturaConsumo = coberturaConsumo;
  
  // Inversor selecionado
  const inversorSelecionado = formData.inverters?.[0] || null;
  const potenciaInversor = inversorSelecionado?.power || formData.potenciaInversor;
  const modeloInversor = inversorSelecionado?.name || formData.modeloInversor;



  return (
    <Card className={`glass border-orange-400/30 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
          <Calculator className="w-5 h-5" />
          Sistema Configurado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Seções de especificações técnicas e localização removidas */}

        {/* Cobertura do Consumo */}
        {consumoTotalAnual > 0 && finalCoberturaConsumo > 0 && (
          <>
            <Separator className="bg-border/50" />
            <div className="bg-green-100/60 dark:bg-green-900/20 border border-green-300/60 dark:border-green-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-green-700 dark:text-green-300">Cobertura do Consumo</span>
                <Badge 
                  variant="secondary" 
                  className="bg-green-200/80 dark:bg-green-500/20 text-green-800 dark:text-green-300 border-green-400/60 dark:border-green-500/30"
                >
                  {Math.round(finalCoberturaConsumo || 0)}%
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-green-600 dark:text-green-400 mb-1">Consumo Anual</p>
                  <p className="text-green-800 dark:text-green-100 font-medium">{Math.round(consumoTotalAnual).toLocaleString()} kWh</p>
                </div>
                <div>
                  <p className="text-green-600 dark:text-green-400 mb-1">Geração Estimada</p>
                  <p className="text-green-800 dark:text-green-100 font-medium">{Math.round(geracaoEstimadaAnual || 0).toLocaleString()} kWh</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Slider de dimensionamento removido - não há mais integração Python automática */}

      </CardContent>
    </Card>
  );
};

export default SystemSummary;
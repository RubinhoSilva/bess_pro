import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Zap, TrendingUp, DollarSign, AlertTriangle, CheckCircle2, Settings, Sparkles } from 'lucide-react';
import { useSolarModules, useInverters } from '@/hooks/equipment-hooks';
import { PVDimensioningService, DimensioningInput, DimensioningResult } from '@/lib/pvDimensioning';
import { formatCurrency, formatPower, formatEnergy, formatPercentage, formatNumber } from '@/lib/formatters';

interface IntelligentSizingModalProps {
  formData: any;
  onApplyConfiguration: (config: any) => void;
}

const IntelligentSizingModal: React.FC<IntelligentSizingModalProps> = ({ 
  formData, 
  onApplyConfiguration 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState<DimensioningResult[]>([]);
  const [preferences, setPreferences] = useState({
    prioridadeEficiencia: true,
    prioridadeCusto: false,
    fabricantePreferido: 'qualquer',
    budgetMin: 0,
    budgetMax: 100000
  });

  const { data: modulesData, isLoading: loadingModules } = useSolarModules({ pageSize: 100 });
  const { data: invertersData, isLoading: loadingInverters } = useInverters({ pageSize: 100 });

  const modules = modulesData?.data?.modules || [];
  const inverters = invertersData?.data?.inverters || [];

  // Debug logs
  useEffect(() => {
    console.log('🔧 modulesData:', modulesData);
    console.log('🔧 invertersData:', invertersData);
    console.log('🔧 modules length:', modules.length);
    console.log('🔧 inverters length:', inverters.length);
  }, [modulesData, invertersData, modules.length, inverters.length]);

  const calculateConsumoAnual = () => {
    if (!formData.energyBills || formData.energyBills.length === 0) return 6000; // Default
    
    return formData.energyBills.reduce((total: number, bill: any) => {
      return total + (bill.consumoMensal?.reduce((a: number, b: number) => a + b, 0) || 0);
    }, 0);
  };

  const calculateIrradiacaoMedia = () => {
    if (!formData.irradiacaoMensal || formData.irradiacaoMensal.length !== 12) return 5.0; // Default
    return formData.irradiacaoMensal.reduce((a: number, b: number) => a + b, 0) / 12;
  };

  const handleCalculate = async () => {
    console.log('🔧 handleCalculate iniciado');
    console.log('🔧 loadingModules:', loadingModules);
    console.log('🔧 loadingInverters:', loadingInverters);
    console.log('🔧 modules.length:', modules.length);
    console.log('🔧 inverters.length:', inverters.length);
    
    if (loadingModules || loadingInverters || modules.length === 0 || inverters.length === 0) {
      console.log('🔧 Condição de parada atingida - retornando');
      return;
    }

    console.log('🔧 Iniciando cálculo...');
    setIsCalculating(true);
    
    try {
      const input: DimensioningInput = {
        consumoAnual: calculateConsumoAnual(),
        irradiacaoMedia: calculateIrradiacaoMedia(),
        eficienciaSistema: formData.eficienciaSistema || 85,
        location: {
          latitude: formData.customer?.address?.lat || -23.5505,
          longitude: formData.customer?.address?.lng || -46.6333,
          estado: formData.customer?.address?.state || 'SP'
        },
        budget: preferences.budgetMax > 0 ? {
          min: preferences.budgetMin,
          max: preferences.budgetMax
        } : undefined,
        preferences: {
          prioridadeEficiencia: preferences.prioridadeEficiencia,
          prioridadeCusto: preferences.prioridadeCusto,
          fabricantePreferido: preferences.fabricantePreferido === 'qualquer' ? '' : preferences.fabricantePreferido
        }
      };

      console.log('🔧 Input para cálculo:', input);
      console.log('🔧 Chamando PVDimensioningService...');
      const calculations = PVDimensioningService.calculateOptimalSystem(input, modules, inverters);
      console.log('🔧 Resultados recebidos:', calculations);
      setResults(calculations.slice(0, 5)); // Top 5 results
      console.log('🔧 Resultados definidos no estado');
    } catch (error) {
      console.error('🔧 Error calculating optimal systems:', error);
    } finally {
      console.log('🔧 Finalizando cálculo');
      setIsCalculating(false);
    }
  };

  const handleApplyResult = (result: DimensioningResult) => {
    const configuration = {
      selectedModules: result.modulos.map((mod, index) => ({
        id: `module-${index}`,
        moduleId: mod.module.id,
        quantity: mod.quantidade
      })),
      selectedInverters: result.inversores.map((inv, index) => ({
        id: `inverter-${index}`,
        inverterId: inv.inverter.id,
        quantity: inv.quantidade
      })),
      potenciaModulo: result.modulos[0]?.module.potenciaNominal,
      eficienciaModulo: result.modulos[0]?.module.eficiencia,
      tensaoModulo: result.modulos[0]?.module.vmpp,
      correnteModulo: result.modulos[0]?.module.impp,
      potenciaInversor: result.inversores[0]?.inverter.potenciaSaidaCA,
      eficienciaInversor: result.inversores[0]?.inverter.eficienciaMax,
      canaisMppt: result.inversores[0]?.inverter.numeroMppt,
      numeroModulos: result.modulos.reduce((total, mod) => total + mod.quantidade, 0)
    };

    onApplyConfiguration(configuration);
    setIsOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'acceptable': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'problematic': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle2 className="w-4 h-4" />;
      case 'good': return <CheckCircle2 className="w-4 h-4" />;
      case 'acceptable': return <AlertTriangle className="w-4 h-4" />;
      case 'problematic': return <AlertTriangle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="text-purple-600 border-purple-500 hover:bg-purple-50"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Dimensionamento Inteligente
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Dimensionamento Inteligente
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="preferences" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preferences">
              <Settings className="w-4 h-4 mr-2" />
              Preferências
            </TabsTrigger>
            <TabsTrigger value="results">
              <TrendingUp className="w-4 h-4 mr-2" />
              Resultados ({results.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preferences" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Prioridades</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="prioridadeEficiencia"
                      checked={preferences.prioridadeEficiencia}
                      onCheckedChange={(checked) => 
                        setPreferences(prev => ({ ...prev, prioridadeEficiencia: !!checked }))
                      }
                    />
                    <Label htmlFor="prioridadeEficiencia">
                      Priorizar eficiência
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="prioridadeCusto"
                      checked={preferences.prioridadeCusto}
                      onCheckedChange={(checked) => 
                        setPreferences(prev => ({ ...prev, prioridadeCusto: !!checked }))
                      }
                    />
                    <Label htmlFor="prioridadeCusto">
                      Priorizar custo
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label>Fabricante Preferido (opcional)</Label>
                    <Select 
                      value={preferences.fabricantePreferido} 
                      onValueChange={(value) => 
                        setPreferences(prev => ({ ...prev, fabricantePreferido: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um fabricante" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="qualquer">Qualquer fabricante</SelectItem>
                        {Array.from(new Set([
                          ...modules.map((m: any) => m.fabricante),
                          ...inverters.map((i: any) => i.fabricante)
                        ]))
                        .filter((fabricante: string) => fabricante && fabricante.trim() !== '')
                        .sort()
                        .map((fabricante: string) => (
                          <SelectItem key={fabricante} value={fabricante}>
                            {fabricante}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Orçamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Orçamento Mínimo: {formatCurrency(preferences.budgetMin)}</Label>
                    <Slider
                      value={[preferences.budgetMin]}
                      onValueChange={([value]) => setPreferences(prev => ({ ...prev, budgetMin: value }))}
                      max={200000}
                      min={0}
                      step={5000}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Orçamento Máximo: {formatCurrency(preferences.budgetMax)}</Label>
                    <Slider
                      value={[preferences.budgetMax]}
                      onValueChange={([value]) => setPreferences(prev => ({ ...prev, budgetMax: value }))}
                      max={200000}
                      min={10000}
                      step={5000}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center">
              <Button 
                onClick={handleCalculate}
                disabled={isCalculating || loadingModules || loadingInverters}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8"
              >
                {isCalculating ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Calculando...</>
                ) : (
                  <><Zap className="w-4 h-4 mr-2" /> Calcular Opções</>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {results.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Configure suas preferências e clique em "Calcular Opções" para ver os resultados.
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((result, index) => (
                  <Card key={index} className="border-2 hover:border-blue-300 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          Opção {index + 1} - {formatPower(result.potenciaSistemakWp, 'kW')}
                        </CardTitle>
                        <Badge className={getStatusColor(result.compatibilidade.status)}>
                          {getStatusIcon(result.compatibilidade.status)}
                          <span className="ml-1 capitalize">{result.compatibilidade.status}</span>
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Equipamentos */}
                        <div>
                          <h4 className="font-semibold mb-2">Equipamentos</h4>
                          <div className="text-sm space-y-1">
                            {result.modulos.map((mod, i) => (
                              <div key={i}>
                                <strong>{mod.quantidade}x</strong> {mod.module.fabricante} {mod.module.modelo}
                              </div>
                            ))}
                            {result.inversores.map((inv, i) => (
                              <div key={i}>
                                <strong>{inv.quantidade}x</strong> {inv.inverter.fabricante} {inv.inverter.modelo}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Performance */}
                        <div>
                          <h4 className="font-semibold mb-2">Performance</h4>
                          <div className="text-sm space-y-1">
                            <div>Geração: {formatEnergy(result.geracaoEstimadaAnual)}/ano</div>
                            <div>Fator Cap.: {formatPercentage(result.performance.fatorCapacidade)}</div>
                            <div>Ratio DC/AC: {result.compatibilidade.ratioDcAc.toFixed(2)}</div>
                            <div>Área: {formatNumber(result.modulos[0]?.areaTotal, 0)} m²</div>
                          </div>
                        </div>

                        {/* Configuração */}
                        <div>
                          <h4 className="font-semibold mb-2">Configuração</h4>
                          <div className="text-sm space-y-1">
                            {result.configuracoes.map((config, i) => (
                              <div key={i}>
                                <div>{config.modulosEmSerie} módulos/string</div>
                                <div>{config.stringsParalelo} strings</div>
                                <div>{config.totalStrings} strings total</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Warnings */}
                      {result.compatibilidade.warnings.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <div className="font-semibold text-yellow-800 mb-1">Avisos:</div>
                          {result.compatibilidade.warnings.map((warning, i) => (
                            <div key={i} className="text-sm text-yellow-700">• {warning}</div>
                          ))}
                        </div>
                      )}

                      <div className="flex justify-end">
                        <Button 
                          onClick={() => handleApplyResult(result)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Aplicar Configuração
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default IntelligentSizingModal;
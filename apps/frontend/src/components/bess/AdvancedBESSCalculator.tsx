import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { useToast } from '../ui/use-toast';
import { 
  useCalculateMultiSystem,
  useConfigurationTemplates,
  SystemType,
  LoadProfile,
  SolarSystemSpecs,
  MultiSystemConfiguration,
  getSystemTypeName,
  getSystemTypeColor,
  formatCurrency,
  formatEnergy,
  formatPercentage,
  getDefaultLoadProfile,
  getDefaultSolarSpecs,
  getDefaultPriorityFactors,
  getDefaultEconomicParameters
} from '../../hooks/multi-system-hooks';
import { 
  Zap, 
  Sun, 
  Battery, 
  Fuel, 
  TrendingUp, 
  Leaf, 
  Settings, 
  Calculator,
  BarChart3,
  Target,
  Lightbulb,
  Info,
  AlertTriangle
} from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

interface AdvancedBESSCalculatorProps {
  projectId?: string;
  onConfigurationSelected?: (configuration: MultiSystemConfiguration) => void;
}

export const AdvancedBESSCalculator: React.FC<AdvancedBESSCalculatorProps> = ({
  projectId,
  onConfigurationSelected
}) => {
  const [activeTab, setActiveTab] = useState('load-profile');
  const [loadProfile, setLoadProfile] = useState<LoadProfile>(getDefaultLoadProfile());
  const [solarSpecs, setSolarSpecs] = useState<SolarSystemSpecs>(getDefaultSolarSpecs());
  const [allowedSystems, setAllowedSystems] = useState<SystemType[]>([
    SystemType.SOLAR_BESS_DIESEL,
    SystemType.SOLAR_BESS,
    SystemType.BESS_DIESEL
  ]);
  const [priorityFactors, setPriorityFactors] = useState(getDefaultPriorityFactors());
  const [economicParams, setEconomicParams] = useState(getDefaultEconomicParameters());
  const [location, setLocation] = useState({
    latitude: -15.7942,
    longitude: -47.8822,
    city: 'Brasília',
    state: 'DF'
  });

  const { toast } = useToast();
  const calculateMultiSystemMutation = useCalculateMultiSystem();
  const { data: templatesData } = useConfigurationTemplates();

  const handleCalculate = async () => {
    try {
      const result = await calculateMultiSystemMutation.mutateAsync({
        loadProfile,
        allowedSystems,
        solarData: solarSpecs,
        priorityFactors,
        location,
        economicParameters: economicParams
      });

      toast({
        title: 'Cálculo concluído!',
        description: `Sistema recomendado: ${getSystemTypeName(result.analysis_result.recommended_configuration.system_type)}`,
      });

      // Trigger next step or callback
      if (onConfigurationSelected) {
        onConfigurationSelected(result.analysis_result.recommended_configuration);
      }
    } catch (error) {
      toast({
        title: 'Erro no cálculo',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  const handleLoadTemplate = (template: any) => {
    // Parse template configuration and apply to form
    const [minLoad, maxLoad] = template.load_range.split('_')[0].split('-').map((n: string) => parseInt(n));
    const avgLoad = (minLoad + maxLoad) / 2;
    
    const newLoadProfile: LoadProfile = {
      ...loadProfile,
      peak_power: avgLoad,
      daily_consumption: avgLoad * 8, // 8 hours average per day
      essential_loads: avgLoad * 0.6,
      backup_duration: parseInt(template.typical_configuration.backup_hours) || 12
    };
    
    setLoadProfile(newLoadProfile);
    
    // Set allowed systems based on template
    const systemTypeMap: { [key: string]: SystemType } = {
      'solar_bess': SystemType.SOLAR_BESS,
      'solar_bess_diesel': SystemType.SOLAR_BESS_DIESEL,
      'bess_diesel': SystemType.BESS_DIESEL,
      'solar_only': SystemType.SOLAR_ONLY,
      'bess_only': SystemType.BESS_ONLY,
      'diesel_only': SystemType.DIESEL_ONLY
    };
    
    const templateSystemType = systemTypeMap[template.system_type];
    if (templateSystemType) {
      setAllowedSystems([templateSystemType]);
    }

    toast({
      title: 'Template aplicado',
      description: `Configuração "${template.name}" carregada com sucesso`,
    });

    setActiveTab('load-profile');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Calculadora BESS Avançada</h2>
          <p className="text-muted-foreground">
            Sistema multi-energético inteligente para análise completa
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Calculator className="w-3 h-3" />
            Análise Avançada
          </Badge>
        </div>
      </div>

      {/* Quick Templates */}
      {templatesData && templatesData.templates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Templates Rápidos
            </CardTitle>
            <CardDescription>
              Configure rapidamente com base em casos típicos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {templatesData.templates.slice(0, 4).map((template) => (
                <motion.div
                  key={template.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleLoadTemplate(template)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{template.name}</h4>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getSystemTypeColor(template.system_type as SystemType)}`}
                          >
                            {template.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {template.description}
                        </p>
                        <div className="text-xs space-y-1">
                          <div>Backup: {template.typical_configuration.backup_hours}</div>
                          <div>Custo: {template.typical_configuration.estimated_cost}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Tabs */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="load-profile" className="text-xs">
                <Zap className="w-4 h-4 mr-1" />
                Perfil de Carga
              </TabsTrigger>
              <TabsTrigger value="solar-config" className="text-xs">
                <Sun className="w-4 h-4 mr-1" />
                Configuração Solar
              </TabsTrigger>
              <TabsTrigger value="system-types" className="text-xs">
                <Settings className="w-4 h-4 mr-1" />
                Tipos de Sistema
              </TabsTrigger>
              <TabsTrigger value="priorities" className="text-xs">
                <Target className="w-4 h-4 mr-1" />
                Prioridades
              </TabsTrigger>
              <TabsTrigger value="economic" className="text-xs">
                <TrendingUp className="w-4 h-4 mr-1" />
                Parâmetros Econômicos
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent>
            {/* Load Profile Tab */}
            <TabsContent value="load-profile" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Perfil de Carga Elétrica</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="daily-consumption">Consumo Diário (kWh)</Label>
                      <Input
                        id="daily-consumption"
                        type="number"
                        value={loadProfile.daily_consumption}
                        onChange={(e) => setLoadProfile(prev => ({
                          ...prev,
                          daily_consumption: Number(e.target.value)
                        }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="peak-power">Potência de Pico (kW)</Label>
                      <Input
                        id="peak-power"
                        type="number"
                        value={loadProfile.peak_power}
                        onChange={(e) => setLoadProfile(prev => ({
                          ...prev,
                          peak_power: Number(e.target.value)
                        }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="essential-loads">Cargas Essenciais (kW)</Label>
                      <Input
                        id="essential-loads"
                        type="number"
                        value={loadProfile.essential_loads}
                        onChange={(e) => setLoadProfile(prev => ({
                          ...prev,
                          essential_loads: Number(e.target.value)
                        }))}
                      />
                    </div>

                    <div>
                      <Label>Autonomia Desejada: {loadProfile.backup_duration}h</Label>
                      <Slider
                        value={[loadProfile.backup_duration]}
                        onValueChange={([value]) => setLoadProfile(prev => ({
                          ...prev,
                          backup_duration: value
                        }))}
                        max={48}
                        min={4}
                        step={2}
                        className="mt-2"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <span>4h</span>
                        <span>24h</span>
                        <span>48h</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Perfil Horário de Consumo</Label>
                    <div className="mt-2 p-4 border rounded-lg">
                      <div className="grid grid-cols-8 gap-2">
                        {loadProfile.hourly_consumption.map((consumption, hour) => (
                          <div key={hour} className="text-center">
                            <div className="text-xs text-muted-foreground mb-1">
                              {hour.toString().padStart(2, '0')}h
                            </div>
                            <Input
                              type="number"
                              value={consumption}
                              onChange={(e) => {
                                const newProfile = [...loadProfile.hourly_consumption];
                                newProfile[hour] = Number(e.target.value);
                                setLoadProfile(prev => ({
                                  ...prev,
                                  hourly_consumption: newProfile
                                }));
                              }}
                              className="w-16 h-8 text-xs"
                              min="0"
                              step="0.1"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 text-sm text-muted-foreground">
                        <Info className="w-4 h-4 inline mr-1" />
                        Valores em kWh por hora
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Solar Configuration Tab */}
            <TabsContent value="solar-config" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Configuração do Sistema Solar</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="solar-capacity">Capacidade Solar (kWp)</Label>
                      <Input
                        id="solar-capacity"
                        type="number"
                        value={solarSpecs.capacity}
                        onChange={(e) => setSolarSpecs(prev => ({
                          ...prev,
                          capacity: Number(e.target.value)
                        }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="panel-efficiency">Eficiência dos Painéis (%)</Label>
                      <Input
                        id="panel-efficiency"
                        type="number"
                        value={solarSpecs.panel_efficiency}
                        onChange={(e) => setSolarSpecs(prev => ({
                          ...prev,
                          panel_efficiency: Number(e.target.value)
                        }))}
                        step="0.1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="inverter-efficiency">Eficiência do Inversor (%)</Label>
                      <Input
                        id="inverter-efficiency"
                        type="number"
                        value={solarSpecs.inverter_efficiency}
                        onChange={(e) => setSolarSpecs(prev => ({
                          ...prev,
                          inverter_efficiency: Number(e.target.value)
                        }))}
                        step="0.1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="system-losses">Perdas do Sistema (%)</Label>
                      <Input
                        id="system-losses"
                        type="number"
                        value={solarSpecs.system_losses}
                        onChange={(e) => setSolarSpecs(prev => ({
                          ...prev,
                          system_losses: Number(e.target.value)
                        }))}
                        step="0.1"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="tilt-angle">Ângulo de Inclinação (°)</Label>
                      <Input
                        id="tilt-angle"
                        type="number"
                        value={solarSpecs.tilt_angle}
                        onChange={(e) => setSolarSpecs(prev => ({
                          ...prev,
                          tilt_angle: Number(e.target.value)
                        }))}
                        min="0"
                        max="90"
                      />
                    </div>

                    <div>
                      <Label htmlFor="azimuth">Azimute (°)</Label>
                      <Input
                        id="azimuth"
                        type="number"
                        value={solarSpecs.azimuth}
                        onChange={(e) => setSolarSpecs(prev => ({
                          ...prev,
                          azimuth: Number(e.target.value)
                        }))}
                        min="-180"
                        max="180"
                      />
                    </div>

                    <div>
                      <Label htmlFor="cost-per-kwp">Custo por kWp (R$)</Label>
                      <Input
                        id="cost-per-kwp"
                        type="number"
                        value={solarSpecs.cost_per_kwp}
                        onChange={(e) => setSolarSpecs(prev => ({
                          ...prev,
                          cost_per_kwp: Number(e.target.value)
                        }))}
                      />
                    </div>

                    <div>
                      <Label>Localização</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <Input
                          placeholder="Cidade"
                          value={location.city}
                          onChange={(e) => setLocation(prev => ({
                            ...prev,
                            city: e.target.value
                          }))}
                        />
                        <Input
                          placeholder="Estado"
                          value={location.state}
                          onChange={(e) => setLocation(prev => ({
                            ...prev,
                            state: e.target.value
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* System Types Tab */}
            <TabsContent value="system-types" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Tipos de Sistema Permitidos</h3>
                <p className="text-muted-foreground mb-6">
                  Selecione quais tipos de sistema devem ser considerados na análise
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.values(SystemType).map((systemType) => {
                    const isSelected = allowedSystems.includes(systemType);
                    return (
                      <div
                        key={systemType}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          isSelected 
                            ? 'border-primary bg-primary/5' 
                            : 'border-muted hover:border-primary/50'
                        }`}
                        onClick={() => {
                          if (isSelected) {
                            setAllowedSystems(prev => prev.filter(s => s !== systemType));
                          } else {
                            setAllowedSystems(prev => [...prev, systemType]);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{getSystemTypeName(systemType)}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {systemType === SystemType.SOLAR_ONLY && 'Sistema apenas solar fotovoltaico'}
                              {systemType === SystemType.BESS_ONLY && 'Sistema apenas com baterias'}
                              {systemType === SystemType.DIESEL_ONLY && 'Sistema apenas com gerador diesel'}
                              {systemType === SystemType.SOLAR_BESS && 'Sistema solar com armazenamento'}
                              {systemType === SystemType.SOLAR_DIESEL && 'Sistema solar com backup diesel'}
                              {systemType === SystemType.BESS_DIESEL && 'Sistema de baterias com backup diesel'}
                              {systemType === SystemType.SOLAR_BESS_DIESEL && 'Sistema híbrido completo'}
                            </p>
                          </div>
                          <div className={`w-4 h-4 rounded border-2 ${
                            isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
                          }`}>
                            {isSelected && <div className="w-full h-full bg-white rounded-sm scale-50" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {allowedSystems.length === 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Selecione pelo menos um tipo de sistema para continuar a análise.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>

            {/* Priorities Tab */}
            <TabsContent value="priorities" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Fatores de Priorização</h3>
                <p className="text-muted-foreground mb-6">
                  Ajuste a importância de cada fator na seleção da melhor configuração
                </p>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Custo
                      </Label>
                      <span className="text-sm text-muted-foreground">
                        {formatPercentage(priorityFactors.cost * 100)}
                      </span>
                    </div>
                    <Slider
                      value={[priorityFactors.cost]}
                      onValueChange={([value]) => setPriorityFactors(prev => ({
                        ...prev,
                        cost: value
                      }))}
                      max={1}
                      min={0}
                      step={0.05}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Prioriza soluções com menor custo total de investimento
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label className="flex items-center gap-2">
                        <Battery className="w-4 h-4" />
                        Confiabilidade
                      </Label>
                      <span className="text-sm text-muted-foreground">
                        {formatPercentage(priorityFactors.reliability * 100)}
                      </span>
                    </div>
                    <Slider
                      value={[priorityFactors.reliability]}
                      onValueChange={([value]) => setPriorityFactors(prev => ({
                        ...prev,
                        reliability: value
                      }))}
                      max={1}
                      min={0}
                      step={0.05}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Prioriza soluções com maior autonomia e backup
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label className="flex items-center gap-2">
                        <Leaf className="w-4 h-4" />
                        Sustentabilidade
                      </Label>
                      <span className="text-sm text-muted-foreground">
                        {formatPercentage(priorityFactors.environment * 100)}
                      </span>
                    </div>
                    <Slider
                      value={[priorityFactors.environment]}
                      onValueChange={([value]) => setPriorityFactors(prev => ({
                        ...prev,
                        environment: value
                      }))}
                      max={1}
                      min={0}
                      step={0.05}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Prioriza soluções com menor impacto ambiental
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Manutenção
                      </Label>
                      <span className="text-sm text-muted-foreground">
                        {formatPercentage(priorityFactors.maintenance * 100)}
                      </span>
                    </div>
                    <Slider
                      value={[priorityFactors.maintenance]}
                      onValueChange={([value]) => setPriorityFactors(prev => ({
                        ...prev,
                        maintenance: value
                      }))}
                      max={1}
                      min={0}
                      step={0.05}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Prioriza soluções com menor complexidade de manutenção
                    </p>
                  </div>

                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm">
                      <strong>Total: </strong>
                      {formatPercentage((priorityFactors.cost + priorityFactors.reliability + priorityFactors.environment + priorityFactors.maintenance) * 100)}
                    </div>
                    {Math.abs((priorityFactors.cost + priorityFactors.reliability + priorityFactors.environment + priorityFactors.maintenance) - 1) > 0.01 && (
                      <Alert className="mt-2">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          A soma dos fatores deve ser igual a 100%
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Economic Parameters Tab */}
            <TabsContent value="economic" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Parâmetros Econômicos</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="electricity-tariff">Tarifa de Energia (R$/kWh)</Label>
                      <Input
                        id="electricity-tariff"
                        type="number"
                        value={economicParams.electricity_tariff}
                        onChange={(e) => setEconomicParams(prev => ({
                          ...prev,
                          electricity_tariff: Number(e.target.value)
                        }))}
                        step="0.01"
                      />
                    </div>

                    <div>
                      <Label htmlFor="demand-tariff">Tarifa de Demanda (R$/kW)</Label>
                      <Input
                        id="demand-tariff"
                        type="number"
                        value={economicParams.demand_tariff}
                        onChange={(e) => setEconomicParams(prev => ({
                          ...prev,
                          demand_tariff: Number(e.target.value)
                        }))}
                        step="0.1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="discount-rate">Taxa de Desconto (%)</Label>
                      <Input
                        id="discount-rate"
                        type="number"
                        value={economicParams.discount_rate}
                        onChange={(e) => setEconomicParams(prev => ({
                          ...prev,
                          discount_rate: Number(e.target.value)
                        }))}
                        step="0.1"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="analysis-period">Período de Análise (anos)</Label>
                      <Input
                        id="analysis-period"
                        type="number"
                        value={economicParams.analysis_period}
                        onChange={(e) => setEconomicParams(prev => ({
                          ...prev,
                          analysis_period: Number(e.target.value)
                        }))}
                        min="1"
                        max="30"
                      />
                    </div>

                    <div>
                      <Label htmlFor="inflation-rate">Taxa de Inflação (%)</Label>
                      <Input
                        id="inflation-rate"
                        type="number"
                        value={economicParams.inflation_rate}
                        onChange={(e) => setEconomicParams(prev => ({
                          ...prev,
                          inflation_rate: Number(e.target.value)
                        }))}
                        step="0.1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Calculate Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleCalculate}
          disabled={calculateMultiSystemMutation.isPending || allowedSystems.length === 0}
          size="lg"
          className="min-w-32"
        >
          {calculateMultiSystemMutation.isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              Calculando...
            </>
          ) : (
            <>
              <BarChart3 className="w-4 h-4 mr-2" />
              Calcular Sistema Ótimo
            </>
          )}
        </Button>
      </div>

      {/* Results Preview */}
      {calculateMultiSystemMutation.data && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Resultado da Análise</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {getSystemTypeName(calculateMultiSystemMutation.data.analysis_result.recommended_configuration.system_type)}
                  </div>
                  <div className="text-sm text-muted-foreground">Sistema Recomendado</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {formatCurrency(calculateMultiSystemMutation.data.analysis_result.recommended_configuration.total_cost)}
                  </div>
                  <div className="text-sm text-muted-foreground">Investimento Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {formatPercentage(calculateMultiSystemMutation.data.analysis_result.recommended_configuration.reliability_index)}
                  </div>
                  <div className="text-sm text-muted-foreground">Confiabilidade</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};
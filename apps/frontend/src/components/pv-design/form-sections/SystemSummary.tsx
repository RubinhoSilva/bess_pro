import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Zap, 
  Sun, 
  Calculator, 
  Wrench, 
  DollarSign,
  TrendingUp,
  Info
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface SystemSummaryProps {
  formData: any;
  className?: string;
}

const SystemSummary: React.FC<SystemSummaryProps> = ({ formData, className = '' }) => {
  // Verificar se temos dados suficientes para mostrar o resumo
  const hasCalculationData = formData.numeroModulos || formData.potenciaPico;
  const hasConsumptionData = formData.energyBills && formData.energyBills.length > 0;
  
  if (!hasCalculationData && !hasConsumptionData) {
    return null; // Não mostrar se não há dados suficientes
  }

  // Cálculos do sistema
  const numeroModulos = formData.numeroModulos || 0;
  const potenciaModulo = formData.potenciaModulo || 550; // W
  const potenciaPico = formData.potenciaPico || (numeroModulos * potenciaModulo) / 1000; // kWp
  
  // Cálculo estimado de área (considerando ~2.5m² por módulo)
  const areaEstimada = numeroModulos * 2.5;
  
  // Consumo total anual
  const consumoTotalAnual = formData.energyBills?.reduce((acc: number, bill: any) => {
    return acc + bill.consumoMensal.reduce((sum: number, consumo: number) => sum + consumo, 0);
  }, 0) || 0;
  
  // Geração estimada anual (simplificada - pode ser melhorada com dados PVGIS)
  const irradiacaoMediaAnual = formData.irradiacaoMensal?.reduce((a: number, b: number) => a + b, 0) / 12 || 5;
  const eficienciaSistema = (formData.eficienciaSistema || 85) / 100;
  const geracaoEstimadaAnual = potenciaPico * irradiacaoMediaAnual * 365 * eficienciaSistema;
  
  // Inversor selecionado
  const inversorSelecionado = formData.inverters?.[0] || null;
  const potenciaInversor = inversorSelecionado?.power || formData.potenciaInversor;
  const modeloInversor = inversorSelecionado?.name || formData.modeloInversor;

  // Estimativas de custo baseadas na potência
  const custoEstimadoPorKw = 4000; // R$ por kWp (valor médio de mercado)
  const custoEquipamentoEstimado = potenciaPico * custoEstimadoPorKw;
  const custoMaoDeObraEstimado = custoEquipamentoEstimado * 0.25; // 25% do custo dos equipamentos
  const custoMateriaisEstimado = custoEquipamentoEstimado * 0.15; // 15% para materiais complementares

  return (
    <Card className={`glass border-orange-400/30 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-400">
          <Calculator className="w-5 h-5" />
          Resumo do Sistema Fotovoltaico
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Especificações Técnicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-4 rounded-lg border border-blue-400/30">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-300">Potência Pico</span>
            </div>
            <p className="text-2xl font-bold text-blue-100">{potenciaPico.toFixed(2)} kWp</p>
            <p className="text-xs text-blue-300 mt-1">{numeroModulos} módulos de {potenciaModulo}W</p>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 p-4 rounded-lg border border-green-400/30">
            <div className="flex items-center gap-2 mb-2">
              <Sun className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-green-300">Geração Anual</span>
            </div>
            <p className="text-2xl font-bold text-green-100">{Math.round(geracaoEstimadaAnual).toLocaleString()} kWh</p>
            <p className="text-xs text-green-300 mt-1">~{Math.round(geracaoEstimadaAnual/12)} kWh/mês</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 p-4 rounded-lg border border-purple-400/30">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-300">Área Necessária</span>
            </div>
            <p className="text-2xl font-bold text-purple-100">{areaEstimada.toFixed(0)} m²</p>
            <p className="text-xs text-purple-300 mt-1">Para instalação dos módulos</p>
          </div>

          <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/20 p-4 rounded-lg border border-amber-400/30">
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-300">Inversor</span>
            </div>
            {potenciaInversor ? (
              <>
                <p className="text-lg font-bold text-amber-100">{potenciaInversor} kW</p>
                <p className="text-xs text-amber-300 mt-1 truncate">{modeloInversor || 'A definir'}</p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-amber-100">A definir</p>
                <p className="text-xs text-amber-300 mt-1">Selecione o inversor</p>
              </>
            )}
          </div>
        </div>

        <Separator className="bg-border/50" />

        {/* Estimativas de Custo */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-orange-300 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Estimativas de Custo (Base para Orçamento)
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-muted/20 p-3 rounded-lg border border-border/50">
              <p className="text-sm text-muted-foreground mb-1">Equipamentos</p>
              <p className="text-lg font-semibold text-foreground">{formatCurrency(custoEquipamentoEstimado)}</p>
              <p className="text-xs text-muted-foreground">Módulos + Inversor + String Box</p>
            </div>
            
            <div className="bg-muted/20 p-3 rounded-lg border border-border/50">
              <p className="text-sm text-muted-foreground mb-1">Mão de Obra</p>
              <p className="text-lg font-semibold text-foreground">{formatCurrency(custoMaoDeObraEstimado)}</p>
              <p className="text-xs text-muted-foreground">Instalação + Comissionamento</p>
            </div>
            
            <div className="bg-muted/20 p-3 rounded-lg border border-border/50">
              <p className="text-sm text-muted-foreground mb-1">Materiais</p>
              <p className="text-lg font-semibold text-foreground">{formatCurrency(custoMateriaisEstimado)}</p>
              <p className="text-xs text-muted-foreground">Estruturas + Cabeamento + Misc</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 p-4 rounded-lg border border-orange-400/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-300 mb-1">Custo Total Estimado</p>
                <p className="text-2xl font-bold text-orange-100">
                  {formatCurrency(custoEquipamentoEstimado + custoMaoDeObraEstimado + custoMateriaisEstimado)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-orange-300">Por kWp</p>
                <p className="text-lg font-semibold text-orange-200">
                  {formatCurrency(custoEstimadoPorKw)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Informação sobre as estimativas */}
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-300">
              <p className="font-medium mb-1">Sobre as estimativas:</p>
              <ul className="space-y-1 text-blue-200">
                <li>• Os valores são estimativas baseadas no mercado atual</li>
                <li>• Ajuste os custos reais nos campos "Parâmetros Financeiros" abaixo</li>
                <li>• Considere variações regionais e especificidades do projeto</li>
                <li>• Inclua impostos, licenças e outros custos específicos</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Cobertura do Consumo */}
        {consumoTotalAnual > 0 && (
          <>
            <Separator className="bg-border/50" />
            <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-green-300">Cobertura do Consumo</span>
                <Badge 
                  variant="secondary" 
                  className="bg-green-500/20 text-green-300 border-green-500/30"
                >
                  {Math.round((geracaoEstimadaAnual / consumoTotalAnual) * 100)}%
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-green-400 mb-1">Consumo Anual</p>
                  <p className="text-green-100 font-medium">{Math.round(consumoTotalAnual).toLocaleString()} kWh</p>
                </div>
                <div>
                  <p className="text-green-400 mb-1">Geração Estimada</p>
                  <p className="text-green-100 font-medium">{Math.round(geracaoEstimadaAnual).toLocaleString()} kWh</p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemSummary;
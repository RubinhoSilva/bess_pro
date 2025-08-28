import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Zap, 
  Sun, 
  Calculator, 
  Wrench, 
  TrendingUp
} from 'lucide-react';
import { FrontendCalculationLogger } from '@/lib/calculationLogger';

interface SystemSummaryProps {
  formData: any;
  className?: string;
}

const SystemSummary: React.FC<SystemSummaryProps> = ({ formData, className = '' }) => {
  // Sempre mostrar o resumo se há dados de consumo (incluindo os dados padrão)
  const hasConsumptionData = formData.energyBills && formData.energyBills.length > 0;
  
  if (!hasConsumptionData) {
    return null; // Só esconder se realmente não há nenhum dado de consumo
  }

  // Inicializar logger para cálculos automáticos do resumo
  const logger = new FrontendCalculationLogger(`system-summary-${Date.now()}`);

  // Consumo total anual com logging
  const consumoTotalAnual = formData.energyBills?.reduce((acc: number, bill: any) => {
    return acc + bill.consumoMensal.reduce((sum: number, consumo: number) => sum + consumo, 0);
  }, 0) || 0;

  if (consumoTotalAnual > 0) {
    logger.startCalculationSection('RESUMO AUTOMÁTICO DO SISTEMA - EXIBIÇÃO PASSO 5');
    
    logger.context('Resumo', 'Calculando resumo automático do sistema fotovoltaico', {
      consumoTotalAnual,
      numeroContas: formData.energyBills?.length,
      temNumeroModulosDefinido: !!(formData.numeroModulos && formData.numeroModulos > 0)
    }, 'Cálculos automáticos executados quando o resumo do sistema é exibido no passo 5 do formulário');

    logger.formula('Consumo', 'Consumo Total Anual',
      'C_anual = Σ(contas) → Σ(meses)',
      {
        contas: formData.energyBills?.map((bill: any) => ({
          nome: bill.name,
          consumo_mensal: bill.consumoMensal,
          total_conta: bill.consumoMensal.reduce((sum: number, c: number) => sum + c, 0)
        }))
      },
      consumoTotalAnual,
      {
        description: 'Soma de todos os consumos mensais de todas as contas de energia registradas',
        units: 'kWh/ano',
        references: ['Dados inseridos pelo usuário no formulário']
      }
    );
  }

  // Cálculos do sistema
  const potenciaModulo = formData.potenciaModulo || 550; // W
  const somaIrradiacao = formData.irradiacaoMensal?.reduce((a: number, b: number) => a + b, 0) || 54;
  const irradiacaoMediaAnual = somaIrradiacao / 12;
  const eficienciaDecimal = (formData.eficienciaSistema || 85) / 100;

  if (consumoTotalAnual > 0) {
    logger.formula('Irradiação', 'Irradiação Solar Média Anual',
      'H_média = Σ(H_mensais) / 12',
      {
        valores_mensais: formData.irradiacaoMensal || Array(12).fill(4.5),
        soma_total: somaIrradiacao,
        divisor: 12
      },
      irradiacaoMediaAnual,
      {
        description: 'Média anual da irradiação solar baseada nos dados mensais inseridos ou valores padrão',
        units: 'kWh/m²/dia',
        references: ['PVGIS', 'Dados do usuário']
      }
    );
  }
  
  // Se não há número de módulos definido, calcular baseado no consumo
  let numeroModulos = formData.numeroModulos || 0;
  let potenciaPico = formData.potenciaPico || 0;
  
  if (numeroModulos === 0 && consumoTotalAnual > 0) {
    // Cálculo automático baseado no consumo com logging detalhado
    const consumoMedioDiario = consumoTotalAnual / 365;
    
    logger.formula('Consumo', 'Consumo Médio Diário',
      'C_diário = C_anual / 365',
      {
        C_anual: consumoTotalAnual,
        divisor: 365
      },
      consumoMedioDiario,
      {
        description: 'Consumo médio diário calculado para dimensionamento automático do sistema',
        units: 'kWh/dia'
      }
    );

    const irradiacaoEfetiva = irradiacaoMediaAnual * eficienciaDecimal;
    
    logger.formula('Sistema', 'Irradiação Solar Efetiva',
      'H_efetiva = H_média × η_sistema',
      {
        H_media: irradiacaoMediaAnual,
        η_sistema_decimal: eficienciaDecimal,
        η_sistema_percent: formData.eficienciaSistema || 85
      },
      irradiacaoEfetiva,
      {
        description: 'Irradiação solar efetiva considerando perdas do sistema',
        units: 'kWh/m²/dia'
      }
    );

    potenciaPico = consumoMedioDiario / irradiacaoEfetiva;
    
    logger.formula('Sistema', 'Potência Pico Necessária',
      'P_pico = C_diário / H_efetiva',
      {
        C_diario: consumoMedioDiario,
        H_efetiva: irradiacaoEfetiva
      },
      potenciaPico,
      {
        description: 'Potência pico necessária para atender o consumo médio diário',
        units: 'kWp'
      }
    );

    numeroModulos = Math.ceil((potenciaPico * 1000) / potenciaModulo);
    
    logger.formula('Sistema', 'Número de Módulos Necessários',
      'N_módulos = TETO(P_pico_W / P_módulo_W)',
      {
        P_pico_kWp: potenciaPico,
        P_pico_W: potenciaPico * 1000,
        P_modulo_W: potenciaModulo,
        divisao: (potenciaPico * 1000) / potenciaModulo
      },
      numeroModulos,
      {
        description: 'Número inteiro de módulos necessários (arredondado para cima)',
        units: 'unidades'
      }
    );

    potenciaPico = (numeroModulos * potenciaModulo) / 1000; // Ajustar com número real de módulos
    
    logger.formula('Sistema', 'Potência Pico Real',
      'P_pico_real = (N_módulos × P_módulo_W) / 1000',
      {
        N_modulos: numeroModulos,
        P_modulo_W: potenciaModulo
      },
      potenciaPico,
      {
        description: 'Potência pico real considerando número inteiro de módulos',
        units: 'kWp'
      }
    );
  } else if (numeroModulos > 0) {
    potenciaPico = (numeroModulos * potenciaModulo) / 1000;
    
    if (consumoTotalAnual > 0) {
      logger.info('Sistema', 'Usando número de módulos pré-definido', {
        numeroModulos,
        potenciaModulo,
        potenciaPico
      });
    }
  }
  
  // Cálculo estimado de área
  const areaModulo = 2.5; // m² por módulo (valor padrão usado no sistema)
  const areaEstimada = numeroModulos * areaModulo;
  
  if (consumoTotalAnual > 0 && numeroModulos > 0) {
    logger.formula('Area', 'Área Total Necessária',
      'A_total = N_módulos × A_módulo',
      {
        N_modulos: numeroModulos,
        A_modulo_m2: areaModulo
      },
      areaEstimada,
      {
        description: 'Área total necessária para instalação dos módulos (valor padrão de 2.5m² por módulo)',
        units: 'm²'
      }
    );
  }
  
  // Geração estimada anual
  const diasAno = 365;
  const geracaoEstimadaAnual = potenciaPico * irradiacaoMediaAnual * diasAno * eficienciaDecimal;
  
  if (consumoTotalAnual > 0 && potenciaPico > 0) {
    logger.formula('Geração', 'Geração Anual Estimada',
      'E_anual = P_pico × H_média × dias_ano × η_sistema',
      {
        P_pico_kWp: potenciaPico,
        H_media: irradiacaoMediaAnual,
        dias_ano: diasAno,
        η_sistema_decimal: eficienciaDecimal,
        η_sistema_percent: formData.eficienciaSistema || 85
      },
      geracaoEstimadaAnual,
      {
        description: 'Estimativa da energia total gerada pelo sistema durante um ano',
        units: 'kWh/ano'
      }
    );

    // Cobertura do consumo
    const coberturaConsumo = (geracaoEstimadaAnual / consumoTotalAnual) * 100;
    
    logger.formula('Análise', 'Cobertura do Consumo',
      'Cobertura_% = (E_gerada / E_consumida) × 100',
      {
        E_gerada: geracaoEstimadaAnual,
        E_consumida: consumoTotalAnual
      },
      coberturaConsumo,
      {
        description: 'Percentual do consumo anual coberto pela geração estimada do sistema',
        units: '%'
      }
    );

    logger.endCalculationSection('RESUMO AUTOMÁTICO DO SISTEMA - EXIBIÇÃO PASSO 5', {
      potenciaPico: `${potenciaPico.toFixed(2)} kWp`,
      numeroModulos: `${numeroModulos} × ${potenciaModulo}W`,
      areaEstimada: `${areaEstimada.toFixed(1)} m²`,
      geracaoAnual: `${Math.round(geracaoEstimadaAnual)} kWh/ano`,
      coberturaConsumo: `${Math.round(coberturaConsumo)}%`
    });
  }
  
  // Inversor selecionado
  const inversorSelecionado = formData.inverters?.[0] || null;
  const potenciaInversor = inversorSelecionado?.power || formData.potenciaInversor;
  const modeloInversor = inversorSelecionado?.name || formData.modeloInversor;


  return (
    <Card className={`glass border-orange-400/30 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
          <Calculator className="w-5 h-5" />
          Resumo do Sistema Fotovoltaico
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Especificações Técnicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-100/80 to-blue-200/80 dark:from-blue-500/20 dark:to-blue-600/20 p-4 rounded-lg border border-blue-300/50 dark:border-blue-400/30">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Potência Pico</span>
            </div>
            <p className="text-2xl font-bold text-blue-800 dark:text-blue-100">{potenciaPico.toFixed(2)} kWp</p>
            <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">{numeroModulos} módulos de {potenciaModulo}W</p>
          </div>

          <div className="bg-gradient-to-br from-green-100/80 to-green-200/80 dark:from-green-500/20 dark:to-green-600/20 p-4 rounded-lg border border-green-300/50 dark:border-green-400/30">
            <div className="flex items-center gap-2 mb-2">
              <Sun className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">Geração Anual</span>
            </div>
            <p className="text-2xl font-bold text-green-800 dark:text-green-100">{Math.round(geracaoEstimadaAnual).toLocaleString()} kWh</p>
            <p className="text-xs text-green-600 dark:text-green-300 mt-1">~{Math.round(geracaoEstimadaAnual/12)} kWh/mês</p>
          </div>

          <div className="bg-gradient-to-br from-purple-100/80 to-purple-200/80 dark:from-purple-500/20 dark:to-purple-600/20 p-4 rounded-lg border border-purple-300/50 dark:border-purple-400/30">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Área Necessária</span>
            </div>
            <p className="text-2xl font-bold text-purple-800 dark:text-purple-100">{areaEstimada.toFixed(0)} m²</p>
            <p className="text-xs text-purple-600 dark:text-purple-300 mt-1">Para instalação dos módulos</p>
          </div>

          <div className="bg-gradient-to-br from-amber-100/80 to-amber-200/80 dark:from-amber-500/20 dark:to-amber-600/20 p-4 rounded-lg border border-amber-300/50 dark:border-amber-400/30">
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Inversor</span>
            </div>
            {potenciaInversor ? (
              <>
                <p className="text-lg font-bold text-amber-800 dark:text-amber-100">{potenciaInversor} kW</p>
                <p className="text-xs text-amber-600 dark:text-amber-300 mt-1 truncate">{modeloInversor || 'A definir'}</p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-amber-800 dark:text-amber-100">A definir</p>
                <p className="text-xs text-amber-600 dark:text-amber-300 mt-1">Selecione o inversor</p>
              </>
            )}
          </div>
        </div>


        {/* Cobertura do Consumo */}
        {consumoTotalAnual > 0 && (
          <>
            <Separator className="bg-border/50" />
            <div className="bg-green-100/60 dark:bg-green-900/20 border border-green-300/60 dark:border-green-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-green-700 dark:text-green-300">Cobertura do Consumo</span>
                <Badge 
                  variant="secondary" 
                  className="bg-green-200/80 dark:bg-green-500/20 text-green-800 dark:text-green-300 border-green-400/60 dark:border-green-500/30"
                >
                  {Math.round((geracaoEstimadaAnual / consumoTotalAnual) * 100)}%
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-green-600 dark:text-green-400 mb-1">Consumo Anual</p>
                  <p className="text-green-800 dark:text-green-100 font-medium">{Math.round(consumoTotalAnual).toLocaleString()} kWh</p>
                </div>
                <div>
                  <p className="text-green-600 dark:text-green-400 mb-1">Geração Estimada</p>
                  <p className="text-green-800 dark:text-green-100 font-medium">{Math.round(geracaoEstimadaAnual).toLocaleString()} kWh</p>
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
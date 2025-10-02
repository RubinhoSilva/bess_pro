import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sun, Calendar, TrendingUp, BarChart } from 'lucide-react';

interface MonthlyIrradiationDisplayProps {
  irradiacaoMensal: number[];
  location?: {
    latitude: number;
    longitude: number;
    cidade?: string;
  };
  className?: string;
}

const MonthlyIrradiationDisplay: React.FC<MonthlyIrradiationDisplayProps> = ({
  irradiacaoMensal,
  location,
  className = ''
}) => {
  const monthNames = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];
  
  const fullMonthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Cálculos
  const yearlyAverage = irradiacaoMensal.reduce((sum, value) => sum + value, 0) / 12;
  const maxIrradiation = Math.max(...irradiacaoMensal);
  const minIrradiation = Math.min(...irradiacaoMensal);
  const maxMonth = irradiacaoMensal.indexOf(maxIrradiation);
  const minMonth = irradiacaoMensal.indexOf(minIrradiation);
  
  // Determinar cor baseada no valor (verde = alto, amarelo = médio, vermelho = baixo)
  const getIrradiationColor = (value: number) => {
    const percentage = (value / maxIrradiation) * 100;
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getIrradiationColorText = (value: number) => {
    const percentage = (value / maxIrradiation) * 100;
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 60) return 'text-yellow-400';
    if (percentage >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <Card className={`glass ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Sun className="w-5 h-5 text-yellow-400" />
          Dados de Irradiação Solar
        </CardTitle>
        {location && (
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4" />
              <span>Localização: {location.cidade || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}</span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estatísticas Resumidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium text-muted-foreground">Média Anual</span>
            </div>
            <p className="text-lg font-bold text-foreground">{yearlyAverage.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">kWh/m²/dia</p>
          </div>
          
          <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Sun className="w-4 h-4 text-green-400" />
              <span className="text-xs font-medium text-green-400">Máximo</span>
            </div>
            <p className="text-lg font-bold text-green-400">{maxIrradiation.toFixed(2)}</p>
            <p className="text-xs text-green-300">{fullMonthNames[maxMonth]}</p>
          </div>
          
          <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Sun className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium text-blue-400">Mínimo</span>
            </div>
            <p className="text-lg font-bold text-blue-400">{minIrradiation.toFixed(2)}</p>
            <p className="text-xs text-blue-300">{fullMonthNames[minMonth]}</p>
          </div>
          
          <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <div className="flex items-center gap-2 mb-1">
              <BarChart className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-medium text-purple-400">Variação</span>
            </div>
            <p className="text-lg font-bold text-purple-400">{((maxIrradiation - minIrradiation) / yearlyAverage * 100).toFixed(0)}%</p>
            <p className="text-xs text-purple-300">Sazonal</p>
          </div>
        </div>

        {/* Gráfico de Barras Mensal */}
        <div className="space-y-3 mt-6">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Irradiação Mensal (kWh/m²/dia)
          </h4>
          
          <div className="grid grid-cols-12 gap-1">
            {irradiacaoMensal.map((value, index) => (
              <div key={index} className="flex flex-col items-center space-y-2">
                {/* Barra */}
                <div className="w-full h-24 bg-muted/30 rounded-sm flex items-end relative">
                  <div 
                    className={`w-full rounded-sm transition-all duration-300 ${getIrradiationColor(value)}`}
                    style={{ 
                      height: `${(value / maxIrradiation) * 100}%`,
                      minHeight: '4px'
                    }}
                    title={`${fullMonthNames[index]}: ${value.toFixed(2)} kWh/m²/dia`}
                  />
                  {/* Valor no topo da barra */}
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                    <span className={`text-xs font-medium ${getIrradiationColorText(value)}`}>
                      {value.toFixed(1)}
                    </span>
                  </div>
                </div>
                
                {/* Mês */}
                <span className="text-xs text-muted-foreground font-medium">
                  {monthNames[index]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Dados Tabulares */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Valores Detalhados</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {irradiacaoMensal.map((value, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                <span className="text-muted-foreground font-medium">{monthNames[index]}</span>
                <Badge variant="secondary" className={getIrradiationColorText(value)}>
                  {value.toFixed(2)}
                </Badge>
              </div>
            ))}
          </div>
        </div>

      </CardContent>
    </Card>
  );
};

export default MonthlyIrradiationDisplay;
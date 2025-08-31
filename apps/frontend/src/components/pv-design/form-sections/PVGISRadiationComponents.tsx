import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { Sun, Zap, Activity } from 'lucide-react';

interface RadiationComponentsData {
  monthly: {
    direct: number[];      // Gb_d - Radiação direta mensal
    diffuse: number[];     // Gd_d - Radiação difusa mensal
    reflected: number[];   // Gr_d - Radiação refletida mensal
    total: number[];       // H_d - Radiação total mensal
  };
  annual: {
    direct: number;
    diffuse: number;
    reflected: number;
    total: number;
  };
  location: {
    latitude: number;
    longitude: number;
    cidade: string;
  };
  metadata?: {
    fonte: string;
    periodo: string;
    database: string;
  };
}

interface PVGISRadiationComponentsProps {
  data: RadiationComponentsData;
  isLoading?: boolean;
}

const MONTHS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

const COLORS = {
  direct: '#FF6B35',     // Laranja para radiação direta
  diffuse: '#4ECDC4',    // Turquesa para radiação difusa
  reflected: '#45B7D1',  // Azul para radiação refletida
  total: '#96CEB4'       // Verde claro para total
};

const PVGISRadiationComponents: React.FC<PVGISRadiationComponentsProps> = ({ 
  data, 
  isLoading = false 
}) => {
  // Preparar dados para gráficos
  const monthlyChartData = MONTHS.map((month, index) => ({
    month,
    direct: data.monthly.direct[index] || 0,
    diffuse: data.monthly.diffuse[index] || 0,
    reflected: data.monthly.reflected[index] || 0,
    total: data.monthly.total[index] || 0
  }));

  // Dados do gráfico de pizza anual
  const annualPieData = [
    { name: 'Direta', value: data.annual.direct, color: COLORS.direct },
    { name: 'Difusa', value: data.annual.diffuse, color: COLORS.diffuse },
    { name: 'Refletida', value: data.annual.reflected, color: COLORS.reflected }
  ];

  // Calcular percentuais
  const totalRadiation = data.annual.direct + data.annual.diffuse + data.annual.reflected;
  const percentages = {
    direct: ((data.annual.direct / totalRadiation) * 100).toFixed(1),
    diffuse: ((data.annual.diffuse / totalRadiation) * 100).toFixed(1),
    reflected: ((data.annual.reflected / totalRadiation) * 100).toFixed(1)
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-yellow-500" />
            Componentes de Radiação Solar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com informações gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-yellow-500" />
            Componentes de Radiação Solar - PVGIS
          </CardTitle>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              📍 {data.location.cidade}
            </Badge>
            {data.metadata?.fonte && (
              <Badge variant="outline" className="text-xs">
                🛰️ {data.metadata.fonte}
              </Badge>
            )}
            {data.metadata?.periodo && (
              <Badge variant="outline" className="text-xs">
                📅 {data.metadata.periodo}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Card Radiação Direta */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border-l-4 border-orange-500">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-orange-800">Radiação Direta</span>
              </div>
              <div className="text-2xl font-bold text-orange-700">
                {data.annual.direct.toFixed(0)} <span className="text-sm font-normal">kWh/m²</span>
              </div>
              <div className="text-sm text-orange-600 mt-1">
                {percentages.direct}% do total
              </div>
            </div>

            {/* Card Radiação Difusa */}
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-lg border-l-4 border-teal-500">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-teal-600" />
                <span className="font-medium text-teal-800">Radiação Difusa</span>
              </div>
              <div className="text-2xl font-bold text-teal-700">
                {data.annual.diffuse.toFixed(0)} <span className="text-sm font-normal">kWh/m²</span>
              </div>
              <div className="text-sm text-teal-600 mt-1">
                {percentages.diffuse}% do total
              </div>
            </div>

            {/* Card Radiação Refletida */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-center gap-2 mb-2">
                <Sun className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">Radiação Refletida</span>
              </div>
              <div className="text-2xl font-bold text-blue-700">
                {data.annual.reflected.toFixed(0)} <span className="text-sm font-normal">kWh/m²</span>
              </div>
              <div className="text-sm text-blue-600 mt-1">
                {percentages.reflected}% do total
              </div>
            </div>

            {/* Card Total */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border-l-4 border-green-500">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">Total</span>
              </div>
              <div className="text-2xl font-bold text-green-700">
                {data.annual.total.toFixed(0)} <span className="text-sm font-normal">kWh/m²</span>
              </div>
              <div className="text-sm text-green-600 mt-1">
                Radiação global anual
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de barras mensal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição Mensal dos Componentes</CardTitle>
            <p className="text-sm text-muted-foreground">
              Variação mensal de cada componente de radiação solar
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis 
                    label={{ value: 'kWh/m²/dia', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `${value.toFixed(2)} kWh/m²/dia`,
                      name === 'direct' ? 'Direta' : 
                      name === 'diffuse' ? 'Difusa' : 
                      name === 'reflected' ? 'Refletida' : 'Total'
                    ]}
                  />
                  <Legend 
                    formatter={(value) => 
                      value === 'direct' ? 'Direta' : 
                      value === 'diffuse' ? 'Difusa' : 
                      value === 'reflected' ? 'Refletida' : 'Total'
                    }
                  />
                  <Bar dataKey="direct" stackId="a" fill={COLORS.direct} />
                  <Bar dataKey="diffuse" stackId="a" fill={COLORS.diffuse} />
                  <Bar dataKey="reflected" stackId="a" fill={COLORS.reflected} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de pizza anual */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição Anual dos Componentes</CardTitle>
            <p className="text-sm text-muted-foreground">
              Proporção de cada componente na radiação total anual
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={annualPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {annualPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(0)} kWh/m²`, 'Radiação']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de linha comparativo mensal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comparativo Mensal - Linha do Tempo</CardTitle>
          <p className="text-sm text-muted-foreground">
            Evolução dos componentes de radiação ao longo do ano
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis label={{ value: 'kWh/m²/dia', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(2)} kWh/m²/dia`,
                    name === 'direct' ? 'Direta' : 
                    name === 'diffuse' ? 'Difusa' : 
                    name === 'reflected' ? 'Refletida' : 'Total'
                  ]}
                />
                <Legend 
                  formatter={(value) => 
                    value === 'direct' ? 'Direta' : 
                    value === 'diffuse' ? 'Difusa' : 
                    value === 'reflected' ? 'Refletida' : 'Total'
                  }
                />
                <Line 
                  type="monotone" 
                  dataKey="direct" 
                  stroke={COLORS.direct} 
                  strokeWidth={3}
                  dot={{ fill: COLORS.direct, strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="diffuse" 
                  stroke={COLORS.diffuse} 
                  strokeWidth={3}
                  dot={{ fill: COLORS.diffuse, strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="reflected" 
                  stroke={COLORS.reflected} 
                  strokeWidth={3}
                  dot={{ fill: COLORS.reflected, strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke={COLORS.total} 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: COLORS.total, strokeWidth: 2, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default PVGISRadiationComponents;
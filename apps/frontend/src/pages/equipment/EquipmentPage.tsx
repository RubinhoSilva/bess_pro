import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Package, Unplug, Settings, Plus, Upload, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EquipmentManager } from '@/components/equipment/EquipmentManager';
import { useSolarModules, useInverters } from '@/hooks/equipment-hooks';

export default function EquipmentPage() {
  const navigate = useNavigate();

  // Get equipment statistics
  const { data: solarModulesData, isLoading: loadingSolarModules } = useSolarModules({ pageSize: 1 });
  const { data: invertersData, isLoading: loadingInverters } = useInverters({ pageSize: 1 });

  const totalSolarModules = solarModulesData?.total || 0;
  const totalInverters = invertersData?.total || 0;

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={handleBackToDashboard}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Dashboard
              </Button>
              
              <div className="hidden sm:block h-6 w-px bg-gray-300 dark:bg-gray-600" />
              
              <div className="flex items-center">
                <Settings className="w-5 h-5 text-blue-600 mr-2" />
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Gerenciador de Equipamentos
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Módulos Solares</p>
                    <p className="text-3xl font-bold">{totalSolarModules}</p>
                  </div>
                  <Package className="w-10 h-10 text-blue-100" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Inversores</p>
                    <p className="text-3xl font-bold">{totalInverters}</p>
                  </div>
                  <Unplug className="w-10 h-10 text-purple-100" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Total Equipamentos</p>
                    <p className="text-3xl font-bold">{totalSolarModules + totalInverters}</p>
                  </div>
                  <Settings className="w-10 h-10 text-green-100" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8"
        >
          <Card className="bg-white dark:bg-gray-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Ações Rápidas</CardTitle>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Ferramentas para acelerar o gerenciamento de equipamentos
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button 
                  className="flex items-center gap-2" 
                  variant="outline"
                  onClick={() => {
                    const equipmentManager = document.querySelector('[data-testid="equipment-manager"]');
                    if (equipmentManager) {
                      equipmentManager.scrollIntoView({ behavior: 'smooth' });
                      // Trigger add module action
                      const addModuleBtn = equipmentManager.querySelector('[data-action="add-module"]') as HTMLButtonElement;
                      setTimeout(() => addModuleBtn?.click(), 500);
                    }
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Módulo
                </Button>
                <Button 
                  className="flex items-center gap-2" 
                  variant="outline"
                  onClick={() => {
                    const equipmentManager = document.querySelector('[data-testid="equipment-manager"]');
                    if (equipmentManager) {
                      equipmentManager.scrollIntoView({ behavior: 'smooth' });
                      // Trigger add inverter action
                      const addInverterBtn = equipmentManager.querySelector('[data-action="add-inverter"]') as HTMLButtonElement;
                      setTimeout(() => addInverterBtn?.click(), 500);
                    }
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Inversor
                </Button>
                <Button className="flex items-center gap-2" variant="outline" disabled>
                  <Upload className="w-4 h-4" />
                  Importar Catálogo
                </Button>
                <Button className="flex items-center gap-2" variant="outline" disabled>
                  <Download className="w-4 h-4" />
                  Exportar Dados
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="bg-white dark:bg-gray-800 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <Package className="w-6 h-6 text-white" />
                </div>
                Equipamentos Fotovoltaicos
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Gerencie sua biblioteca de módulos fotovoltaicos e inversores. 
                Adicione novos equipamentos ou importe dados de datasheets para facilitar o dimensionamento.
              </p>
            </CardHeader>
            
            <CardContent>
              <EquipmentManager onUpdate={() => {
                // Callback para quando equipamentos são atualizados
                console.log('Equipamentos atualizados');
              }} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Package className="w-5 h-5" />
                  Módulos Fotovoltaicos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-600 text-sm">
                  Adicione especificações técnicas completas dos módulos incluindo potência, dimensões, 
                  eficiência e coeficientes de temperatura. Use a função de extração automática 
                  de datasheets para acelerar o processo.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="bg-purple-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <Unplug className="w-5 h-5" />
                  Inversores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-purple-600 text-sm">
                  Configure inversores com dados de entrada CC, saída CA, número de MPPTs 
                  e eficiência. Essas informações são essenciais para o dimensionamento correto 
                  e cálculos de compatibilidade.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
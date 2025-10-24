import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Zap, PlusCircle, Trash2 } from 'lucide-react';
import { EnergyBillA, EnergyBillB, createEnergyBillA, createEnergyBillB } from '@/types/energy-bill-types';
import { EnergyBillComponentA } from './EnergyBillComponentA';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface GrupoATariffData {
  subgrupoTarifario: 'verde' | 'azul';
  tarifaEnergiaPontaA: number;
  tarifaEnergiaForaPontaA: number;
  tePontaA: number;
  teForaPontaA: number;
}

interface ConsumptionFormProps {
  energyData: any;
  customerData: any;
  onFormChange: (field: string, value: any) => void;
}

// Usando tipos importados: EnergyBillA e EnergyBillB

const EnergyBillComponent: React.FC<{
  bill: EnergyBillB;
  onBillChange: (id: string, field: string, value: any) => void;
  onRemoveBill: (id: string) => void;
}> = ({ bill, onBillChange, onRemoveBill }) => {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const [consumptionType, setConsumptionType] = useState<'monthly' | 'average'>('monthly');
  const [avgConsumption, setAvgConsumption] = useState(500);

  const handleMonthlyChange = (index: number, value: string) => {
    const newValues = [...bill.consumoMensal];
    newValues[index] = parseFloat(value) || 0;
    onBillChange(bill.id, 'consumoMensal', newValues);
  };

  const handleAvgChange = (value: string) => {
    const avg = parseFloat(value) || 0;
    setAvgConsumption(avg);
    onBillChange(bill.id, 'consumoMensal', Array(12).fill(avg));
  };


  return (
    <div className="p-4 border border-border rounded-lg bg-muted space-y-4">
      <div className="flex justify-between items-center">
        <Input 
          placeholder="Identificador da Conta (ex: Casa, Escritório)" 
          value={bill.name}
          onChange={(e) => onBillChange(bill.id, 'name', e.target.value)}
          className="flex-grow mr-2"
        />
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onRemoveBill(bill.id)} 
          className="text-red-500 hover:bg-red-500/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <Tabs value={consumptionType} onValueChange={(value) => setConsumptionType(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="monthly">Mensal</TabsTrigger>
          <TabsTrigger value="average">Média</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {months.map((month, index) => (
              <div key={index} className="space-y-1">
                <Label htmlFor={`${bill.id}-month-${index}`} className="text-xs">
                  {month}
                </Label>
                <Input
                  id={`${bill.id}-month-${index}`}
                  type="number"
                  placeholder="kWh"
                  value={bill.consumoMensal[index] || ''}
                  onChange={(e) => handleMonthlyChange(index, e.target.value)}
                  className="text-sm"
                />
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="average" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`${bill.id}-avg`}>Consumo Médio Mensal (kWh)</Label>
            <Input
              id={`${bill.id}-avg`}
              type="number"
              placeholder="500"
              value={avgConsumption}
              onChange={(e) => handleAvgChange(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Será aplicado o mesmo valor para todos os meses
            </p>
          </div>
        </TabsContent>

      </Tabs>

    </div>
  );
};

const ConsumptionForm: React.FC<ConsumptionFormProps> = ({ energyData, customerData, onFormChange }) => {
  
  // Garantir que energyData nunca seja nulo (proteção similar ao CustomerDataForm)
  const energyBills = energyData?.energyBills || [];
  const energyBillsA = energyData?.energyBillsA || [];
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);

  // Criar primeira conta automaticamente baseado no grupo selecionado na step 1
  useEffect(() => {
    const hasAnyAccount = energyBills.length > 0 || energyBillsA.length > 0;
    const hasCorrectAccountType = 
      (customerData?.grupoTarifario === 'A' && energyBillsA.length > 0) ||
      (customerData?.grupoTarifario === 'B' && energyBills.length > 0);
    
    if (!hasAnyAccount || !hasCorrectAccountType) {
      // Limpar contas existentes se houver tipo incorreto
      if (energyBills.length > 0) {
        onFormChange('energyBills', []);
      }
      if (energyBillsA.length > 0) {
        onFormChange('energyBillsA', []);
      }
      
      // Criar conta do tipo correto
      if (customerData?.grupoTarifario === 'A') {
        const newBill: EnergyBillA = createEnergyBillA({
          name: 'Unidade Geradora',
          consumoMensalPonta: Array(12).fill(500),
          consumoMensalForaPonta: Array(12).fill(500)
        });
        onFormChange('energyBillsA', [newBill]);
      } else if (customerData?.grupoTarifario === 'B') {
        const newBill: EnergyBillB = createEnergyBillB({
          name: 'Unidade Geradora',
          consumoMensal: Array(12).fill(500)
        });
        onFormChange('energyBills', [newBill]);
      }
    }
  }, [customerData?.grupoTarifario, energyBills.length, energyBillsA.length]); // Executar quando mudar grupo ou contas


  const needsGrupoATariffData = () => {
    const hasGrupoATariffData = customerData?.tarifaEnergiaPontaA || 
                               customerData?.tarifaEnergiaForaPontaA ||
                               customerData?.tePontaA || 
                               customerData?.teForaPontaA ||
                               customerData?.subgrupoTarifario;
    
    // Manter visível quando o grupo na Step 1 for B (diferente do grupo A)
    const isDifferentFromStep1 = customerData?.grupoTarifario === 'B';
    
    // Mostrar se não há dados OU se o grupo na Step 1 for diferente
    return !hasGrupoATariffData || (energyBillsA.length > 0 && isDifferentFromStep1);
  };

  const needsGrupoBTariffData = () => {
    const hasGrupoBTariffData = (customerData?.tarifaEnergiaB != null && customerData?.tarifaEnergiaB > 0) && 
                               (customerData?.custoFioB != null && customerData?.custoFioB > 0);
    const hasGrupoBAccounts = energyBills.length > 0;
    
    // Manter visível quando o grupo na Step 1 for A (diferente do grupo B)
    const isDifferentFromStep1 = customerData?.grupoTarifario === 'A';
    
    // Mostrar se há contas B E (não há dados OU o grupo na Step 1 for diferente)
    return hasGrupoBAccounts && (!hasGrupoBTariffData || isDifferentFromStep1);
  };

  const addNewBill = (tipo: 'A' | 'B') => {
    const totalAccounts = energyBillsA.length + energyBills.length;
    
    if (tipo === 'A') {
      const newBill: EnergyBillA = createEnergyBillA({
        name: totalAccounts === 0 ? 'Unidade Geradora' : `Conta ${totalAccounts + 1}`,
        consumoMensalPonta: Array(12).fill(500),
        consumoMensalForaPonta: Array(12).fill(500)
      });
      
      const updatedBills = [...energyBillsA, newBill];
      onFormChange('energyBillsA', updatedBills);
    } else {
      const newBill: EnergyBillB = createEnergyBillB({
        name: totalAccounts === 0 ? 'Unidade Geradora' : `Conta ${totalAccounts + 1}`,
        consumoMensal: Array(12).fill(500)
      });
      
      const updatedBills = [...energyBills, newBill];
      onFormChange('energyBills', updatedBills);
    }
    setShowAddAccountModal(false);
  };

  const handleGrupoATariffChange = (field: string, value: any) => {
    onFormChange(field, value);
  };

  const addFirstBill = () => {
    // Primeira conta segue o grupo escolhido em CustomerDataForm
    if (customerData?.grupoTarifario === 'A') {
      addNewBill('A');
    } else {
      addNewBill('B');
    }
  };

  const updateBillA = (updatedBill: EnergyBillA) => {
    const updatedBills = energyBillsA.map((bill: EnergyBillA) => 
      bill.id === updatedBill.id ? updatedBill : bill
    );
    onFormChange('energyBillsA', updatedBills);
  };

  const updateBillB = (id: string, field: string, value: any) => {
    const updatedBills = energyBills.map((bill: EnergyBillB) => 
      bill.id === id ? { ...bill, [field]: value } : bill
    );
    onFormChange('energyBills', updatedBills);
  };

  const removeBillA = (billId: string) => {
    const updatedBills = energyBillsA.filter((bill: EnergyBillA) => bill.id !== billId);
    onFormChange('energyBillsA', updatedBills);
  };

  const removeBillB = (id: string) => {
    const updatedBills = energyBills.filter((bill: EnergyBillB) => bill.id !== id);
    onFormChange('energyBills', updatedBills);
  };

  // Calcular totais
  let totalAnualConsumption = 0;
  const monthlyTotals = Array(12).fill(0);

  // Somar consumo do Grupo A
  energyBillsA.forEach((bill: EnergyBillA) => {
    bill.consumoMensalPonta.forEach((consumption: number, index: number) => {
      monthlyTotals[index] += consumption;
      totalAnualConsumption += consumption;
    });
    bill.consumoMensalForaPonta.forEach((consumption: number, index: number) => {
      monthlyTotals[index] += consumption;
      totalAnualConsumption += consumption;
    });
  });

  // Somar consumo do Grupo B
  energyBills.forEach((bill: EnergyBillB) => {
    bill.consumoMensal.forEach((consumption: number, index: number) => {
      monthlyTotals[index] += consumption;
      totalAnualConsumption += consumption;
    });
  });

  // Verificar se já existe alguma conta
  const hasAnyAccount = energyBillsA.length > 0 || energyBills.length > 0;

  return (
    <Card className="bg-card border border-border shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <Zap className="w-5 h-5 text-amber-500" /> 
          Consumo de Energia
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Configure uma ou mais contas de energia para dimensionar o sistema.
          </p>
          <Button 
            onClick={hasAnyAccount ? () => setShowAddAccountModal(true) : addFirstBill} 
            variant="outline" 
            size="sm"
            className="border-green-500 text-green-600 hover:bg-green-50"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            {hasAnyAccount ? 'Adicionar Outra Conta' : 'Adicionar Conta'}
          </Button>
        </div>

        {/* Seção do grupo selecionado na step 1 aparece primeiro */}
        {customerData?.grupoTarifario === 'A' ? (
          <>
            {/* Seção Grupo A - sem configuração quando já foi preenchida na step 1 */}
            {energyBillsA.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700">Contas Grupo A (Alta Tensão)</h3>
                
                {/* Lista de contas Grupo A */}
                {energyBillsA.map((bill: EnergyBillA) => (
                  <EnergyBillComponentA
                    key={bill.id}
                    bill={bill}
                    onUpdate={(updatedBill: EnergyBillA) => updateBillA(updatedBill)}
                    onRemove={() => removeBillA(bill.id)}
                  />
                ))}
              </div>
            )}

            {/* Seção Grupo B - aparece quando adiciona conta B em projeto A */}
            {energyBills.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700">Contas Grupo B (Residencial/Comercial)</h3>
                
                {/* Configuração de tarifas Grupo B */}
                {needsGrupoBTariffData() && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
                    <h4 className="font-medium text-green-800 dark:text-green-200 mb-4">Configurar Tarifas Grupo B</h4>
                    <p className="text-sm text-green-600 dark:text-green-400 mb-4">
                      Preencha os dados tarifários para contas do Grupo B (Residencial/Comercial)
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Tarifa de Energia (R$/kWh)</Label>
                        <Input 
                          type="number"
                          step="0.01"
                          value={customerData?.tarifaEnergiaB || ''}
                          onChange={(e) => handleGrupoATariffChange('tarifaEnergiaB', parseFloat(e.target.value) || null)}
                          placeholder="0.75"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Custo Fio B (R$/kWh)</Label>
                        <Input 
                          type="number"
                          step="0.01"
                          value={customerData?.custoFioB || ''}
                          onChange={(e) => handleGrupoATariffChange('custoFioB', parseFloat(e.target.value) || null)}
                          placeholder="0.05"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Lista de contas Grupo B */}
                <div className="space-y-4">
                  {energyBills.map((bill: EnergyBillB) => (
                    <EnergyBillComponent
                      key={bill.id}
                      bill={bill}
                      onBillChange={updateBillB}
                      onRemoveBill={removeBillB}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Seção Grupo B */}
            {energyBills.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700">Contas Grupo B (Residencial/Comercial)</h3>
                <div className="space-y-4">
                  {energyBills.map((bill: EnergyBillB) => (
                    <EnergyBillComponent
                      key={bill.id}
                      bill={bill}
                      onBillChange={updateBillB}
                      onRemoveBill={removeBillB}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Seção Grupo A */}
            {energyBillsA.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700">Contas Grupo A (Alta Tensão)</h3>
                
                {/* Configuração de tarifas Grupo A */}
                {needsGrupoATariffData() && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-4">Configurar Tarifas Grupo A</h4>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
                      Preencha os dados tarifários para contas do Grupo A (Alta Tensão)
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Subgrupo Tarifário */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Subgrupo Tarifário</Label>
                        <Select 
                          value={customerData?.subgrupoTarifario || 'verde'}
                          onValueChange={(value) => handleGrupoATariffChange('subgrupoTarifario', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="verde">Verde</SelectItem>
                            <SelectItem value="azul">Azul</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Tarifas de Energia */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Tarifa Ponta (R$/kWh)</Label>
                        <Input 
                          type="number"
                          step="0.01"
                          value={customerData?.tarifaEnergiaPontaA || 1.20}
                          onChange={(e) => handleGrupoATariffChange('tarifaEnergiaPontaA', parseFloat(e.target.value) || 0)}
                          placeholder="1.20"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Tarifa Fora Ponta (R$/kWh)</Label>
                        <Input 
                          type="number"
                          step="0.01"
                          value={customerData?.tarifaEnergiaForaPontaA || 0.60}
                          onChange={(e) => handleGrupoATariffChange('tarifaEnergiaForaPontaA', parseFloat(e.target.value) || 0)}
                          placeholder="0.60"
                        />
                      </div>

                      {/* TUSD - Tarifas de Demanda */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">TUSD Ponta (R$/kW)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={customerData?.tusdPontaA || 0.60}
                          onChange={(e) => handleGrupoATariffChange('tusdPontaA', parseFloat(e.target.value) || 0)}
                          placeholder="0.60"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">TUSD Fora Ponta (R$/kW)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={customerData?.tusdForaPontaA || 0.40}
                          onChange={(e) => handleGrupoATariffChange('tusdForaPontaA', parseFloat(e.target.value) || 0)}
                          placeholder="0.40"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Lista de contas Grupo A */}
                {energyBillsA.map((bill: EnergyBillA) => (
                  <EnergyBillComponentA
                    key={bill.id}
                    bill={bill}
                    onUpdate={(updatedBill: EnergyBillA) => updateBillA(updatedBill)}
                    onRemove={() => removeBillA(bill.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Estado vazio */}
        {!hasAnyAccount && (
          <div className="text-center py-8 text-gray-500">
            <Zap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhuma conta de energia adicionada.</p>
            <p className="text-sm">Clique em "Adicionar Conta" para começar.</p>
          </div>
        )}

        {/* Modal para selecionar tipo de conta adicional */}
        <Dialog open={showAddAccountModal} onOpenChange={setShowAddAccountModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">Adicionar Nova Conta</DialogTitle>
              <p className="text-sm text-gray-600 text-center mt-2">
                Selecione o tipo de conta de energia que deseja adicionar
              </p>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 mt-6">
              <Button 
                onClick={() => addNewBill('A')} 
                className="h-auto p-6 flex flex-col items-center space-y-3 hover:bg-blue-50 hover:border-blue-300 border-2"
                variant="outline"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-lg">Grupo A</div>
                  <div className="text-sm text-gray-600">Alta Tensão</div>
                  <div className="text-xs text-gray-500 mt-1">Consumo ponta e fora ponta</div>
                </div>
              </Button>
              <Button 
                onClick={() => addNewBill('B')} 
                className="h-auto p-6 flex flex-col items-center space-y-3 hover:bg-green-50 hover:border-green-300 border-2"
                variant="outline"
              >
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Zap className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-lg">Grupo B</div>
                  <div className="text-sm text-gray-600">Residencial/Comercial</div>
                  <div className="text-xs text-gray-500 mt-1">Consumo único</div>
                </div>
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Resumo Total */}
        {totalAnualConsumption > 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
            <h4 className="font-semibold text-green-800 dark:text-green-200 mb-3">Resumo Total do Consumo</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-green-600 dark:text-green-400 font-medium">Total Anual</div>
                <div className="text-xl font-bold text-green-800 dark:text-green-200">{totalAnualConsumption.toLocaleString('pt-BR')}</div>
                <div className="text-xs text-green-600 dark:text-green-400">kWh/ano</div>
              </div>
              <div className="text-center">
                <div className="text-green-600 dark:text-green-400 font-medium">Média Mensal</div>
                <div className="text-xl font-bold text-green-800 dark:text-green-200">{(totalAnualConsumption / 12).toFixed(0)}</div>
                <div className="text-xs text-green-600 dark:text-green-400">kWh/mês</div>
              </div>
              <div className="text-center">
                <div className="text-green-600 dark:text-green-400 font-medium">Média Diária</div>
                <div className="text-xl font-bold text-green-800 dark:text-green-200">{(totalAnualConsumption / 365).toFixed(0)}</div>
                <div className="text-xs text-green-600 dark:text-green-400">kWh/dia</div>
              </div>
              <div className="text-center">
                <div className="text-green-600 dark:text-green-400 font-medium">Pico Mensal</div>
                <div className="text-xl font-bold text-green-800 dark:text-green-200">{Math.max(...monthlyTotals).toFixed(0)}</div>
                <div className="text-xs text-green-600 dark:text-green-400">kWh/mês</div>
              </div>
            </div>
            
          </div>
        )}


      </CardContent>
    </Card>
  );
};

export default ConsumptionForm;
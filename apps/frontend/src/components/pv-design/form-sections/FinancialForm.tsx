import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Info, TrendingUp } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency } from '@/lib/formatters';
import { CustomCurrencyInput } from '@/components/ui/currency-input';
import { IBudgetData } from '@/store/pv-dimensioning-store';

interface FinancialFormProps {
  budgetData: IBudgetData | null;
  onFormChange: (field: string, value: any) => void;
  totalInvestment: number;
}

const FinancialForm: React.FC<FinancialFormProps> = ({ budgetData, onFormChange, totalInvestment }) => {
  // Garantir que budgetData nunca seja nulo, usando valores padrão da interface
  const safeBudgetData: IBudgetData = budgetData || {
    custoEquipamento: 0,
    custoMateriais: 0,
    custoMaoDeObra: 0,
    bdi: 0,
    paymentMethod: 'vista',
    cardInstallments: 12,
    cardInterest: 1.99,
    financingInstallments: 60,
    financingInterest: 1.49,
    inflacaoEnergia: 5.0,
    taxaDesconto: 8.0,
    custoOperacao: 1.0,
    valorResidual: 10.0,
    percentualFinanciado: 0,
    taxaJuros: 12.0,
    prazoFinanciamento: 5
  };

  return (
    <TooltipProvider>
      <Card className="bg-card border border-border shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <DollarSign className="w-5 h-5 text-green-500" /> 
            Parâmetros Financeiros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Custos do Projeto */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Custos do Projeto</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="custoEquipamento">Custo Equipamentos (R$)</Label>
                  <TooltipProvider>
                    <TooltipProvider><Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Módulos, inversores, estruturas, etc.</p>
                      </TooltipContent>
                    </Tooltip></TooltipProvider>
                  </TooltipProvider>
                </div>
                <CustomCurrencyInput
                  value={safeBudgetData.custoEquipamento}
                  onValueChange={(value) => onFormChange('custoEquipamento', value)}
                  placeholder="R$ 0,00"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="custoMateriais">Custo Materiais (R$)</Label>
                  <TooltipProvider><Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Cabos, proteções, aterramento, etc.</p>
                    </TooltipContent>
                  </Tooltip></TooltipProvider>
                </div>
                <CustomCurrencyInput
                  value={safeBudgetData.custoMateriais}
                  onValueChange={(value) => onFormChange('custoMateriais', value)}
                  placeholder="R$ 0,00"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="custoMaoDeObra">Mão de Obra (R$)</Label>
                  <TooltipProvider><Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Instalação, comissionamento, projeto</p>
                    </TooltipContent>
                  </Tooltip></TooltipProvider>
                </div>
                <CustomCurrencyInput
                  value={safeBudgetData.custoMaoDeObra}
                  onValueChange={(value) => onFormChange('custoMaoDeObra', value)}
                  placeholder="R$ 0,00"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>BDI: {safeBudgetData.bdi || 0}%</Label>
                  <TooltipProvider><Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Benefícios e Despesas Indiretas (margem)</p>
                    </TooltipContent>
                  </Tooltip></TooltipProvider>
                </div>
                <Slider
                  value={[safeBudgetData.bdi || 0]}
                  onValueChange={(values) => onFormChange('bdi', values[0])}
                  max={50}
                  min={0}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0%</span>
                  <span>50%</span>
                </div>
              </div>
            </div>

            {/* Resumo do Investimento */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Resumo do Investimento</h4>
              <div className="space-y-1 text-sm text-gray-800 dark:text-gray-200">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency((safeBudgetData.custoEquipamento || 0) + (safeBudgetData.custoMateriais || 0) + (safeBudgetData.custoMaoDeObra || 0))}</span>
                </div>
                <div className="flex justify-between">
                  <span>BDI ({safeBudgetData.bdi || 0}%):</span>
                  <span>{formatCurrency(((safeBudgetData.custoEquipamento || 0) + (safeBudgetData.custoMateriais || 0) + (safeBudgetData.custoMaoDeObra || 0)) * (safeBudgetData.bdi || 0) / 100)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t border-gray-300 dark:border-gray-600 pt-1">
                  <span>Total:</span>
                  <span className="text-blue-800 dark:text-blue-300">{formatCurrency(totalInvestment)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Parâmetros Econômicos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Parâmetros Econômicos
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="inflacaoEnergia">Inflação da Energia (%/ano)</Label>
                  <TooltipProvider><Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Reajuste anual esperado da tarifa de energia</p>
                    </TooltipContent>
                  </Tooltip></TooltipProvider>
                </div>
                <Input
                  id="inflacaoEnergia"
                  type="number"
                  step="0.1"
                  value={safeBudgetData.inflacaoEnergia || 5.0}
                  onChange={(e) => onFormChange('inflacaoEnergia', parseFloat(e.target.value) || 5.0)}
                  placeholder="5.0"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="taxaDesconto">Taxa de Desconto (%/ano)</Label>
                  <TooltipProvider><Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Taxa mínima de atratividade ou custo de capital</p>
                    </TooltipContent>
                  </Tooltip></TooltipProvider>
                </div>
                <Input
                  id="taxaDesconto"
                  type="number"
                  step="0.1"
                  value={safeBudgetData.taxaDesconto || 8.0}
                  onChange={(e) => onFormChange('taxaDesconto', parseFloat(e.target.value) || 8.0)}
                  placeholder="8.0"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="custoOperacao">Custo O&M (%/ano do investimento)</Label>
                  <TooltipProvider><Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Operação e Manutenção anual</p>
                    </TooltipContent>
                  </Tooltip></TooltipProvider>
                </div>
                <Input
                  id="custoOperacao"
                  type="number"
                  step="0.1"
                  value={safeBudgetData.custoOperacao || 1.0}
                  onChange={(e) => onFormChange('custoOperacao', parseFloat(e.target.value) || 1.0)}
                  placeholder="1.0"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="valorResidual">Valor Residual (%)</Label>
                  <TooltipProvider><Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Valor do sistema ao final da vida útil</p>
                    </TooltipContent>
                  </Tooltip></TooltipProvider>
                </div>
                <Input
                  id="valorResidual"
                  type="number"
                  step="0.1"
                  value={safeBudgetData.valorResidual || 10.0}
                  onChange={(e) => onFormChange('valorResidual', parseFloat(e.target.value) || 10.0)}
                  placeholder="10.0"
                />
              </div>
            </div>
          </div>

          {/* Financiamento */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Financiamento (Opcional)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="percentualFinanciado">% Financiado</Label>
                <Input
                  id="percentualFinanciado"
                  type="number"
                  step="1"
                  max="100"
                  min="0"
                  value={safeBudgetData.percentualFinanciado || 0}
                  onChange={(e) => onFormChange('percentualFinanciado', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="taxaJuros">Taxa de Juros (%/ano)</Label>
                  <TooltipProvider><Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Taxa de juros para financiamento do projeto</p>
                    </TooltipContent>
                  </Tooltip></TooltipProvider>
                </div>
                <Select 
                  value={safeBudgetData.taxaJuros?.toString() || "12"}
                  onValueChange={(value) => onFormChange('taxaJuros', parseFloat(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a taxa de juros" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8.5">8,5% (BNDES - Pessoa Física)</SelectItem>
                    <SelectItem value="9.5">9,5% (BNDES - Pessoa Jurídica)</SelectItem>
                    <SelectItem value="12">12,0% (Financ. Convencional)</SelectItem>
                    <SelectItem value="15">15,0% (Crediário Solar)</SelectItem>
                    <SelectItem value="18">18,0% (Cartão de Crédito)</SelectItem>
                    <SelectItem value="2.5">2,5% (Consórcio)</SelectItem>
                    <SelectItem value="0">0,0% (À vista)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prazoFinanciamento">Prazo (anos)</Label>
                <Input
                  id="prazoFinanciamento"
                  type="number"
                  step="1"
                  value={safeBudgetData.prazoFinanciamento || 5}
                  onChange={(e) => onFormChange('prazoFinanciamento', parseInt(e.target.value) || 5)}
                  placeholder="5"
                />
              </div>
            </div>

            {/* Cálculo do Financiamento */}
            {(safeBudgetData.percentualFinanciado || 0) > 0 && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-2">Resumo do Financiamento</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Valor Financiado:</span>
                    <span>{formatCurrency(totalInvestment * (safeBudgetData.percentualFinanciado || 0) / 100)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Entrada:</span>
                    <span>{formatCurrency(totalInvestment * (100 - (safeBudgetData.percentualFinanciado || 0)) / 100)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Parcela Mensal (aprox):</span>
                    <span>{formatCurrency(
                      (totalInvestment * (safeBudgetData.percentualFinanciado || 0) / 100) *
                      ((safeBudgetData.taxaJuros || 12) / 100 / 12) *
                      Math.pow(1 + (safeBudgetData.taxaJuros || 12) / 100 / 12, (safeBudgetData.prazoFinanciamento || 5) * 12) /
                      (Math.pow(1 + (safeBudgetData.taxaJuros || 12) / 100 / 12, (safeBudgetData.prazoFinanciamento || 5) * 12) - 1)
                    )}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default FinancialForm;
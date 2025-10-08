import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Loader2 } from 'lucide-react';
import { CustomCurrencyInput } from '@/components/ui/currency-input';
import { energyCompanyService, EnergyCompany } from '@/lib/energyCompanyService';
import toast from 'react-hot-toast';

interface EconomicParametersFormProps {
  formData: any;
  onFormChange: (field: string, value: any) => void;
}

export default function EconomicParametersForm({ formData, onFormChange }: EconomicParametersFormProps) {
  const [energyCompanies, setEnergyCompanies] = useState<EnergyCompany[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  useEffect(() => {
    const fetchEnergyCompanies = async () => {
      try {
        setLoadingCompanies(true);
        const companies = await energyCompanyService.getActiveCompanies();
        setEnergyCompanies(companies);
      } catch (error) {
        toast.error('Erro ao carregar concessionárias de energia');
      } finally {
        setLoadingCompanies(false);
      }
    };

    fetchEnergyCompanies();
  }, []);

  return (
    <Card className="bg-card/50 border-border backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <TrendingUp className="w-5 h-5 text-green-400" /> 
          Parâmetros Econômicos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="taxaDesconto">Taxa de Desconto (%)</Label>
            <Input 
              id="taxaDesconto" 
              type="number" 
              step="0.1" 
              value={formData.taxaDesconto || 8} 
              onChange={(e) => onFormChange('taxaDesconto', parseFloat(e.target.value) || 8)} 
              className="bg-background border-border text-foreground" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inflacaoEnergia">Inflação Energia (%)</Label>
            <Input 
              id="inflacaoEnergia" 
              type="number" 
              step="0.1" 
              value={formData.inflacaoEnergia || 4.5} 
              onChange={(e) => onFormChange('inflacaoEnergia', parseFloat(e.target.value) || 4.5)} 
              className="bg-background border-border text-foreground" 
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="custoFioB">Custo Fio B (R$/kWh)</Label>
            <CustomCurrencyInput
              value={formData.custoFioB || ((formData.tarifaEnergiaB || 0.8) * 0.3)}
              onValueChange={(value) => onFormChange('custoFioB', value)}
              placeholder="R$ 0,0000"
              className="bg-background border-border text-foreground"
              decimals={4}
            />
          </div>
        </div>

        {/* Novos campos de instalação */}
        <div className="mt-6 space-y-4 border-t border-border/50 pt-4">
          <h4 className="text-sm font-medium text-foreground/80">Dados da Instalação</h4>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="concessionaria">Concessionária de Energia</Label>
              <Select 
                value={formData.concessionaria || ''} 
                onValueChange={(value) => onFormChange('concessionaria', value)}
                disabled={loadingCompanies}
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder={loadingCompanies ? 'Carregando...' : 'Selecione a concessionária'} />
                </SelectTrigger>
                <SelectContent>
                  {loadingCompanies ? (
                    <SelectItem value="" disabled>
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Carregando concessionárias...</span>
                      </div>
                    </SelectItem>
                  ) : (
                    <>
                      {energyCompanies.map((company) => (
                        <SelectItem key={company.id} value={company.acronym}>
                          {company.acronym} - {company.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="OUTRO">Outra</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipoRede">Tipo de Rede</Label>
              <Select 
                value={formData.tipoRede || ''} 
                onValueChange={(value) => onFormChange('tipoRede', value)}
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monofasico">Monofásico</SelectItem>
                  <SelectItem value="bifasico">Bifásico</SelectItem>
                  <SelectItem value="trifasico">Trifásico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tensaoRede">Tensão de Rede (V)</Label>
              <Select 
                value={formData.tensaoRede || ''} 
                onValueChange={(value) => onFormChange('tensaoRede', value)}
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Selecione a tensão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="127">127V</SelectItem>
                  <SelectItem value="220">220V</SelectItem>
                  <SelectItem value="380">380V</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fatorSimultaneidade">Fator de Simultaneidade (%)</Label>
              <Input 
                id="fatorSimultaneidade" 
                type="number" 
                min="0" 
                max="100" 
                step="1" 
                value={formData.fatorSimultaneidade || 100} 
                onChange={(e) => onFormChange('fatorSimultaneidade', parseInt(e.target.value) || 100)} 
                className="bg-background border-border text-foreground"
                placeholder="0-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipoTelhado">Tipo de Telhado</Label>
              <Select 
                value={formData.tipoTelhado || ''} 
                onValueChange={(value) => onFormChange('tipoTelhado', value)}
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ceramico">Cerâmico</SelectItem>
                  <SelectItem value="fibrocimento-madeira">Fibrocimento / Madeira</SelectItem>
                  <SelectItem value="fibrocimento-metalica">Fibrocimento / Metálica</SelectItem>
                  <SelectItem value="telha-metalica">Telha Metálica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
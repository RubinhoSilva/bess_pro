import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Loader2, 
  Save, 
  Settings, 
  FileText, 
  BarChart, 
  DollarSign, 
  ArrowLeft, 
  ChevronRight 
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '../../components/ui/dialog';
import { 
  useProposalSettings, 
  useUpdateProposalSettings,
  ProposalSettings,
  ProposalSettingsInput 
} from '../../hooks/proposal-settings-hooks';

const ProposalSettingsPage = () => {
  const navigate = useNavigate();
  const { data: settings, isLoading } = useProposalSettings();
  const updateSettings = useUpdateProposalSettings();

  const [localSettings, setLocalSettings] = useState<ProposalSettingsInput>({
    showIntroduction: true,
    showTechnicalAnalysis: true,
    showFinancialAnalysis: true,
    showCoverPage: true,
    showSolarAdvantages: true,
    showTechnicalSummary: true,
    showEquipmentDetails: true,
    showGenerationProjection: true,
    showInvestmentDetails: true,
    showFinancialIndicators: true,
    showPaymentConditions: true,
  });

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        showIntroduction: settings.showIntroduction,
        showTechnicalAnalysis: settings.showTechnicalAnalysis,
        showFinancialAnalysis: settings.showFinancialAnalysis,
        showCoverPage: settings.showCoverPage,
        showSolarAdvantages: settings.showSolarAdvantages,
        showTechnicalSummary: settings.showTechnicalSummary,
        showEquipmentDetails: settings.showEquipmentDetails,
        showGenerationProjection: settings.showGenerationProjection,
        showInvestmentDetails: settings.showInvestmentDetails,
        showFinancialIndicators: settings.showFinancialIndicators,
        showPaymentConditions: settings.showPaymentConditions,
      });
    }
  }, [settings]);

  const handleToggle = (key: keyof ProposalSettingsInput, value: boolean) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(localSettings);
    } catch (error) {
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-900">
        <Loader2 className="w-12 h-12 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-900 pt-24 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto px-4"
      >
        <Card className="bg-slate-800/50 border-slate-700 text-white">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Settings className="w-8 h-8 text-blue-400" />
              <div>
                <CardTitle className="text-3xl">Configurar Proposta</CardTitle>
                <CardDescription>Escolha quais seções e subseções incluir nas suas propostas.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <SectionConfigurator
              title="Introdução e Vantagens"
              description="Capa, vantagens da energia solar, etc."
              icon={<FileText className="w-5 h-5 text-purple-400" />}
              modalTitle="Configurar Seção: Introdução"
              modalDescription="Habilite ou desabilite os componentes da introdução da proposta."
            >
              <SubSettingItem 
                id="show_cover_page" 
                label="Mostrar Página de Capa" 
                checked={localSettings.showCoverPage || false} 
                onToggle={(val) => handleToggle('showCoverPage', val)} 
              />
              <SubSettingItem 
                id="show_solar_advantages" 
                label="Mostrar Vantagens da Energia Solar" 
                checked={localSettings.showSolarAdvantages || false} 
                onToggle={(val) => handleToggle('showSolarAdvantages', val)} 
              />
            </SectionConfigurator>

            <SectionConfigurator
              title="Análise Técnica"
              description="Dimensionamento, equipamentos, geração."
              icon={<BarChart className="w-5 h-5 text-yellow-400" />}
              modalTitle="Configurar Seção: Análise Técnica"
              modalDescription="Habilite ou desabilite os componentes da análise técnica."
            >
              <SubSettingItem 
                id="show_technical_summary" 
                label="Mostrar Resumo Técnico" 
                checked={localSettings.showTechnicalSummary || false} 
                onToggle={(val) => handleToggle('showTechnicalSummary', val)} 
              />
              <SubSettingItem 
                id="show_equipment_details" 
                label="Mostrar Detalhes dos Equipamentos" 
                checked={localSettings.showEquipmentDetails || false} 
                onToggle={(val) => handleToggle('showEquipmentDetails', val)} 
              />
              <SubSettingItem 
                id="show_generation_projection" 
                label="Mostrar Projeção de Geração" 
                checked={localSettings.showGenerationProjection || false} 
                onToggle={(val) => handleToggle('showGenerationProjection', val)} 
              />
            </SectionConfigurator>

            <SectionConfigurator
              title="Análise Financeira"
              description="Investimento, indicadores, pagamentos."
              icon={<DollarSign className="w-5 h-5 text-green-400" />}
              modalTitle="Configurar Seção: Análise Financeira"
              modalDescription="Habilite ou desabilite os componentes da análise financeira."
            >
              <SubSettingItem 
                id="show_investment_details" 
                label="Mostrar Detalhes do Investimento" 
                checked={localSettings.showInvestmentDetails || false} 
                onToggle={(val) => handleToggle('showInvestmentDetails', val)} 
              />
              <SubSettingItem 
                id="show_financial_indicators" 
                label="Mostrar Indicadores Financeiros (VPL, TIR, Payback)" 
                checked={localSettings.showFinancialIndicators || false} 
                onToggle={(val) => handleToggle('showFinancialIndicators', val)} 
              />
              <SubSettingItem 
                id="show_payment_conditions" 
                label="Mostrar Condições de Pagamento" 
                checked={localSettings.showPaymentConditions || false} 
                onToggle={(val) => handleToggle('showPaymentConditions', val)} 
              />
            </SectionConfigurator>

            <div className="flex justify-end pt-4 gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate(-1)} 
                size="lg" 
                className="bg-transparent hover:bg-slate-700 border-slate-600 text-white"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Voltar
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={updateSettings.isPending} 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updateSettings.isPending ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Save className="w-5 h-5 mr-2" />
                )}
                Salvar Configurações
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

interface SectionConfiguratorProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  modalTitle: string;
  modalDescription: string;
  children: React.ReactNode;
}

const SectionConfigurator: React.FC<SectionConfiguratorProps> = ({ 
  icon, 
  title, 
  description, 
  modalTitle, 
  modalDescription, 
  children 
}) => (
  <Dialog>
    <DialogTrigger asChild>
      <button
        type="button"
        className="w-full flex items-center justify-between p-4 rounded-lg bg-slate-700/50 border border-slate-600 hover:bg-slate-700 transition-colors duration-200 text-left"
      >
        <div className="flex items-start gap-4">
          {icon}
          <div>
            <p className="text-lg font-semibold">{title}</p>
            <p className="text-sm text-slate-400">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <Settings className="w-4 h-4" />
          <ChevronRight className="w-5 h-5" />
        </div>
      </button>
    </DialogTrigger>
    <DialogContent className="bg-slate-800 border-slate-700 text-white">
      <DialogHeader>
        <DialogTitle>{modalTitle}</DialogTitle>
        <DialogDescription>{modalDescription}</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        {children}
      </div>
      <DialogFooter>
        <Button className="bg-blue-600 hover:bg-blue-700">Fechar</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

interface SubSettingItemProps {
  id: string;
  label: string;
  checked: boolean;
  onToggle: (value: boolean) => void;
}

const SubSettingItem: React.FC<SubSettingItemProps> = ({ id, label, checked, onToggle }) => (
  <div className="flex items-center justify-between p-3 rounded-md bg-slate-700/50">
    <Label htmlFor={id} className="cursor-pointer">{label}</Label>
    <Switch id={id} checked={checked} onCheckedChange={onToggle} />
  </div>
);

export default ProposalSettingsPage;
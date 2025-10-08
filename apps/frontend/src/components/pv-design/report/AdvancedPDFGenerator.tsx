import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Download, Loader2, Check, X } from 'lucide-react';
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/formatters';

interface AdvancedPDFGeneratorProps {
  results: {
    formData: any;
    potenciaPico: number;
    numeroModulos: number;
    totalInvestment: number;
    advancedSolar?: any;
    advancedFinancial?: any;
    geracaoEstimadaMensal: number[];
  };
  onGenerate?: () => void;
}

interface ReportSection {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  required?: boolean;
}

interface ReportOptions {
  format: 'standard' | 'executive' | 'technical';
  language: 'pt-BR' | 'en-US';
  includeCharts: boolean;
  includePhotos: boolean;
  brandingLevel: 'full' | 'minimal' | 'none';
}

const AdvancedPDFGenerator: React.FC<AdvancedPDFGeneratorProps> = ({ results, onGenerate }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [reportOptions, setReportOptions] = useState<ReportOptions>({
    format: 'standard',
    language: 'pt-BR',
    includeCharts: true,
    includePhotos: true,
    brandingLevel: 'full'
  });

  const [sections, setSections] = useState<ReportSection[]>([
    {
      id: 'cover',
      name: 'Capa',
      description: 'Página de capa com informações do cliente',
      enabled: true,
      required: true
    },
    {
      id: 'executive-summary',
      name: 'Resumo Executivo',
      description: 'Principais indicadores e benefícios',
      enabled: true,
      required: true
    },
    {
      id: 'customer-data',
      name: 'Dados do Cliente',
      description: 'Informações detalhadas do cliente',
      enabled: true
    },
    {
      id: 'technical-specs',
      name: 'Especificações Técnicas',
      description: 'Detalhes técnicos do sistema',
      enabled: true
    },
    {
      id: 'solar-analysis',
      name: 'Análise Solar Avançada',
      description: 'Irradiação, perdas e performance',
      enabled: results.advancedSolar ? true : false
    },
    {
      id: 'financial-analysis',
      name: 'Análise Financeira',
      description: 'VPL, TIR, payback e fluxo de caixa',
      enabled: true,
      required: true
    },
    {
      id: 'advanced-financial',
      name: 'Análise Financeira Avançada',
      description: 'Sensibilidade, cenários e indicadores',
      enabled: results.advancedFinancial ? true : false
    },
    {
      id: 'generation-charts',
      name: 'Gráficos de Geração',
      description: 'Gráficos mensais e anuais',
      enabled: true
    },
    {
      id: 'equipment-details',
      name: 'Detalhes dos Equipamentos',
      description: 'Especificações dos módulos e inversores',
      enabled: true
    },
    {
      id: 'installation-guide',
      name: 'Guia de Instalação',
      description: 'Orientações para instalação',
      enabled: false
    },
    {
      id: 'maintenance-plan',
      name: 'Plano de Manutenção',
      description: 'Cronograma e custos de manutenção',
      enabled: false
    },
    {
      id: 'warranties',
      name: 'Garantias',
      description: 'Detalhes de garantias dos equipamentos',
      enabled: true
    },
    {
      id: 'appendix',
      name: 'Anexos',
      description: 'Documentos complementares',
      enabled: false
    }
  ]);

  const toggleSection = (sectionId: string) => {
    setSections(sections.map(section => 
      section.id === sectionId && !section.required
        ? { ...section, enabled: !section.enabled }
        : section
    ));
  };

  const validateReportData = () => {
    const errors: string[] = [];
    
    // Validar dados básicos do sistema
    if (!results.potenciaPico || results.potenciaPico <= 0) {
      errors.push('Potência do sistema não definida');
    }
    
    if (!results.numeroModulos || results.numeroModulos <= 0) {
      errors.push('Número de módulos não definido');
    }
    
    if (!results.totalInvestment || results.totalInvestment <= 0) {
      errors.push('Investimento total não calculado');
    }
    
    // Validar dados do cliente se a seção está habilitada
    const customerSectionEnabled = sections.find(s => s.id === 'customer-data')?.enabled;
    if (customerSectionEnabled) {
      if (!results.formData?.customer?.name) {
        errors.push('Nome do cliente obrigatório');
      }
    }
    
    // Validar análise financeira se habilitada
    const financialSectionEnabled = sections.find(s => s.id === 'advanced-financial')?.enabled;
    if (financialSectionEnabled && !results.advancedFinancial) {
      errors.push('Análise financeira avançada não disponível');
    }
    
    // Validar análise solar se habilitada
    const solarSectionEnabled = sections.find(s => s.id === 'solar-analysis')?.enabled;
    if (solarSectionEnabled && !results.advancedSolar) {
      errors.push('Análise solar avançada não disponível');
    }
    
    return errors;
  };

  const generatePDF = async () => {
    // Validar dados antes de iniciar
    const validationErrors = validateReportData();
    if (validationErrors.length > 0) {
      alert(`❌ Dados Incompletos\n\nCorreja os seguintes problemas antes de gerar o relatório:\n\n• ${validationErrors.join('\n• ')}`);
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    
    try {
      // Simular processo de geração com progresso
      const enabledSections = sections.filter(s => s.enabled);
      const totalSteps = enabledSections.length;
      
      for (let i = 0; i < totalSteps; i++) {
        // Simular tempo de processamento para cada seção
        await new Promise(resolve => setTimeout(resolve, 800));
        setGenerationProgress(((i + 1) / totalSteps) * 100);
      }
      
      // Aqui seria a implementação real da geração do PDF
      const pdfData = await generateAdvancedPDFData();
      
      if (!pdfData) {
        throw new Error('Falha na geração dos dados do PDF');
      }
      
      // Download do arquivo
      const filename = `Proposta_PV_${results.formData.customer?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Cliente'}_${new Date().toISOString().split('T')[0]}.pdf`;
      downloadPDF(pdfData, filename);
      
      if (onGenerate) {
        onGenerate();
      }
      
    } catch (error) {
      
      let errorMessage = 'Erro desconhecido ao gerar o relatório.';
      
      if (error instanceof Error) {
        if (error.message.includes('customer')) {
          errorMessage = 'Dados do cliente incompletos. Verifique se todos os campos obrigatórios estão preenchidos.';
        } else if (error.message.includes('calculation')) {
          errorMessage = 'Erro nos cálculos. Execute novamente o dimensionamento antes de gerar o relatório.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
        } else if (error.message.includes('permission')) {
          errorMessage = 'Você não tem permissão para gerar relatórios. Contate o administrador.';
        } else {
          errorMessage = `Erro técnico: ${error.message}`;
        }
      }
      
      alert(`❌ Falha na Geração do Relatório\n\n${errorMessage}\n\nTente novamente ou contate o suporte se o problema persistir.`);
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const generateAdvancedPDFData = async () => {
    try {
      // Validar dados essenciais novamente
      if (!results.formData) {
        throw new Error('Dados do formulário não encontrados');
      }

      // Preparar dados de geração mensal
      const monthlyGeneration = results.geracaoEstimadaMensal || Array(12).fill(0);
      if (monthlyGeneration.every(g => g === 0)) {
        throw new Error('Dados de geração mensal inválidos');
      }

      // Implementação da geração do PDF
      const reportData = {
        metadata: {
          title: `Proposta de Sistema Fotovoltaico - ${results.formData.customer?.name || 'Cliente'}`,
          author: 'BESS Pro',
          subject: 'Dimensionamento de Sistema Solar Fotovoltaico',
          keywords: 'solar, fotovoltaico, energia renovável',
          creator: 'BESS Pro Advanced Solar Calculator',
          creationDate: new Date().toISOString(),
          format: reportOptions.format,
          language: reportOptions.language,
          version: '1.0'
        },
        sections: sections.filter(s => s.enabled),
        data: {
          customer: {
            name: results.formData.customer?.name || 'N/A',
            email: results.formData.customer?.email || '',
            phone: results.formData.customer?.phone || '',
            company: results.formData.customer?.company || '',
            type: results.formData.customer?.type || 'client'
          },
          system: {
            potenciaPico: results.potenciaPico,
            numeroModulos: results.numeroModulos,
            investment: results.totalInvestment,
            generation: monthlyGeneration,
            totalAnnualGeneration: monthlyGeneration.reduce((acc, month) => acc + month, 0)
          },
          solarAnalysis: results.advancedSolar || null,
          financialAnalysis: results.advancedFinancial || null,
          options: reportOptions,
          generatedAt: new Date().toLocaleString('pt-BR')
        }
      };

      // Simular geração de PDF (em implementação real usaria jsPDF ou similar)
      const pdfString = JSON.stringify(reportData, null, 2);
      
      if (pdfString.length < 100) {
        throw new Error('Dados insuficientes para gerar o relatório');
      }

      return pdfString; // Em implementação real, seria um buffer de PDF
    } catch (error) {
      throw new Error(`Falha na preparação dos dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const downloadPDF = (data: string, filename: string) => {
    try {
      if (!data || data.length === 0) {
        throw new Error('Dados de PDF vazios');
      }

      if (!filename || filename.length === 0) {
        throw new Error('Nome do arquivo inválido');
      }

      // Em implementação real, usaria uma biblioteca como jsPDF ou PDFKit
      // Por enquanto, salvamos como JSON para demonstrar funcionalidade
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename.replace('.pdf', '.json'); // Temporário para demonstração
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Cleanup
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      
    } catch (error) {
      throw new Error(`Falha no download: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const getSummaryStats = () => {
    const enabledCount = sections.filter(s => s.enabled).length;
    const totalCount = sections.length;
    
    return {
      sections: `${enabledCount}/${totalCount}`,
      estimatedPages: Math.ceil(enabledCount * 2.5),
      estimatedSize: `${Math.ceil(enabledCount * 0.8)} MB`
    };
  };

  const stats = getSummaryStats();

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Gerador de Relatórios Avançado
          </h3>
          <p className="text-sm text-gray-600 dark:text-slate-300">
            Configure e gere relatórios profissionais em PDF
          </p>
        </div>
      </div>

      {/* Report Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Formato do Relatório
          </label>
          <select
            value={reportOptions.format}
            onChange={(e) => setReportOptions({...reportOptions, format: e.target.value as any})}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          >
            <option value="standard">Padrão</option>
            <option value="executive">Executivo</option>
            <option value="technical">Técnico</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Idioma
          </label>
          <select
            value={reportOptions.language}
            onChange={(e) => setReportOptions({...reportOptions, language: e.target.value as any})}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          >
            <option value="pt-BR">Português (BR)</option>
            <option value="en-US">English (US)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Marca
          </label>
          <select
            value={reportOptions.brandingLevel}
            onChange={(e) => setReportOptions({...reportOptions, brandingLevel: e.target.value as any})}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          >
            <option value="full">Marca Completa</option>
            <option value="minimal">Marca Mínima</option>
            <option value="none">Sem Marca</option>
          </select>
        </div>
      </div>

      {/* Additional Options */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={reportOptions.includeCharts}
            onChange={(e) => setReportOptions({...reportOptions, includeCharts: e.target.checked})}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="text-sm text-gray-700 dark:text-slate-300">Incluir gráficos</span>
        </label>

        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={reportOptions.includePhotos}
            onChange={(e) => setReportOptions({...reportOptions, includePhotos: e.target.checked})}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="text-sm text-gray-700 dark:text-slate-300">Incluir fotos/imagens</span>
        </label>
      </div>

      {/* Section Selection */}
      <div className="mb-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
          Seções do Relatório
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sections.map((section) => (
            <div key={section.id} className="flex items-start space-x-3 p-3 border border-gray-200 dark:border-slate-600 rounded-lg">
              <div className="flex-shrink-0 pt-0.5">
                {section.required ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <input
                    type="checkbox"
                    checked={section.enabled}
                    onChange={() => toggleSection(section.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {section.name}
                  </p>
                  {section.required && (
                    <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-1.5 py-0.5 rounded">
                      Obrigatório
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  {section.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Report Summary */}
      <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          Resumo do Relatório
        </h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-slate-300">Seções:</span>
            <div className="font-medium text-gray-900 dark:text-white">{stats.sections}</div>
          </div>
          <div>
            <span className="text-gray-600 dark:text-slate-300">Est. páginas:</span>
            <div className="font-medium text-gray-900 dark:text-white">{stats.estimatedPages}</div>
          </div>
          <div>
            <span className="text-gray-600 dark:text-slate-300">Est. tamanho:</span>
            <div className="font-medium text-gray-900 dark:text-white">{stats.estimatedSize}</div>
          </div>
        </div>
      </div>

      {/* Generation Progress */}
      {isGenerating && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
              Gerando relatório...
            </span>
            <span className="text-sm text-gray-500 dark:text-slate-400">
              {Math.round(generationProgress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${generationProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        <Button
          variant="outline"
          onClick={() => {
            setSections(sections.map(s => ({ ...s, enabled: s.required || false })));
          }}
          disabled={isGenerating}
        >
          Limpar Seleção
        </Button>
        
        <Button
          onClick={generatePDF}
          disabled={isGenerating || sections.filter(s => s.enabled).length === 0}
          className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Gerar Relatório PDF
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AdvancedPDFGenerator;
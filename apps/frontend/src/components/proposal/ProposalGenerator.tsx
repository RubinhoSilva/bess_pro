import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { TemplateManager } from './TemplateManager';
import { ProposalPreview } from './ProposalPreview';
import { 
  ProposalTemplate, 
  TemplateVariable,
  GenerateProposalRequest
} from '../../types/proposal';
import { 
  useGenerateProposal,
  useProposalsByProject 
} from '../../hooks/proposal-template-hooks';
import { Project } from '../../types/project';
import { Client } from '../../types/client';
import { 
  FileText, 
  Download, 
  Eye,
  Settings,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { generateProposalPDF, downloadPDF } from '../../lib/pdf-generator';
import toast from 'react-hot-toast';

interface ProposalGeneratorProps {
  project: Project;
  client: Client;
  onClose: () => void;
}

export const ProposalGenerator: React.FC<ProposalGeneratorProps> = ({
  project,
  client,
  onClose
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ProposalTemplate | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, any>>({});
  const [showTemplateSelector, setShowTemplateSelector] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const generateProposal = useGenerateProposal();
  const { data: existingProposals = [] } = useProposalsByProject(project.id!);

  // Initialize variable values when template is selected
  useEffect(() => {
    if (selectedTemplate) {
      const initialValues: Record<string, any> = {};
      
      selectedTemplate.variables.forEach((variable) => {
        switch (variable.category) {
          case 'client':
            initialValues[variable.name] = getClientValue(variable.name);
            break;
          case 'project':
            initialValues[variable.name] = getProjectValue(variable.name);
            break;
          case 'company':
            initialValues[variable.name] = getCompanyValue(variable.name);
            break;
          case 'calculation':
            initialValues[variable.name] = getCalculatedValue(variable.name);
            break;
          default:
            initialValues[variable.name] = variable.defaultValue || '';
        }
      });
      
      setVariableValues(initialValues);
      setShowTemplateSelector(false);
    }
  }, [selectedTemplate, project, client]);

  const getClientValue = (variableName: string): any => {
    switch (variableName) {
      case 'client_name':
        return client.name;
      case 'client_email':
        return client.email;
      case 'client_phone':
        return client.phone;
      case 'client_address':
        return typeof client.address === 'string' ? client.address : 
               client.address && typeof client.address === 'object' ? 
               `${(client.address as any).street || ''}, ${(client.address as any).city || ''}` : '';
      default:
        return '';
    }
  };

  const getProjectValue = (variableName: string): any => {
    const projectData = (project as any).data;
    
    switch (variableName) {
      case 'system_size':
        return projectData?.systemParameters?.totalPower || 0;
      case 'modules_quantity':
        return projectData?.systemParameters?.modulesQuantity || 0;
      case 'module_power':
        return projectData?.equipment?.modules?.[0]?.power || 0;
      case 'module_brand':
        return projectData?.equipment?.modules?.[0]?.brand || '';
      case 'module_model':
        return projectData?.equipment?.modules?.[0]?.model || '';
      case 'inverter_brand':
        return projectData?.equipment?.inverters?.[0]?.brand || '';
      case 'inverter_model':
        return projectData?.equipment?.inverters?.[0]?.model || '';
      case 'inverter_power':
        return projectData?.equipment?.inverters?.[0]?.power || 0;
      case 'installation_area':
        return projectData?.location?.installationArea || 0;
      case 'orientation':
        return projectData?.location?.orientation || 'Sul';
      case 'tilt_angle':
        return projectData?.location?.tilt || 15;
      case 'proposal_date':
        return new Date().toISOString();
      case 'validity_date':
        const validityDate = new Date();
        validityDate.setMonth(validityDate.getMonth() + 1);
        return validityDate.toISOString();
      default:
        return '';
    }
  };

  const getCompanyValue = (variableName: string): any => {
    // These would come from company settings/profile
    switch (variableName) {
      case 'company_name':
        return 'BESS Pro';
      case 'company_email':
        return 'contato@besspro.com';
      case 'company_phone':
        return '(11) 99999-9999';
      case 'company_address':
        return 'São Paulo, SP';
      default:
        return '';
    }
  };

  const getCalculatedValue = (variableName: string): any => {
    const projectData = (project as any).data;
    
    switch (variableName) {
      case 'generation_estimate':
        return projectData?.results?.monthlyGeneration || 0;
      case 'annual_generation':
        return projectData?.results?.annualGeneration || 0;
      case 'total_investment':
        return projectData?.financialResults?.totalInvestment || 0;
      case 'annual_savings':
        return projectData?.financialResults?.annualSavings || 0;
      case 'monthly_savings':
        return projectData?.financialResults?.monthlySavings || 0;
      case 'payback_period':
        return projectData?.financialResults?.paybackPeriod || 0;
      case 'total_savings_25_years':
        return projectData?.financialResults?.totalSavings25Years || 0;
      case 'npv':
        return projectData?.financialResults?.npv || 0;
      case 'irr':
        return projectData?.financialResults?.irr || 0;
      case 'capacity_factor':
        return projectData?.results?.capacityFactor || 0;
      case 'performance_ratio':
        return projectData?.results?.performanceRatio || 0;
      case 'solar_irradiation':
        return projectData?.location?.solarIrradiation || 0;
      default:
        return 0;
    }
  };

  const handleVariableChange = (variableName: string, value: any) => {
    setVariableValues(prev => ({
      ...prev,
      [variableName]: value
    }));

    // Clear validation error for this field
    if (validationErrors[variableName]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[variableName];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    if (!selectedTemplate) return false;

    const errors: Record<string, string> = {};

    selectedTemplate.variables.forEach((variable) => {
      if (variable.isRequired) {
        const value = variableValues[variable.name];
        if (value === undefined || value === null || value === '') {
          errors[variable.name] = `${variable.displayName} é obrigatório`;
        }
      }

      // Validate specific types and rules
      if (variable.validations) {
        const value = variableValues[variable.name];
        
        variable.validations.forEach((validation) => {
          switch (validation.type) {
            case 'min':
              if (typeof value === 'number' && value < validation.value) {
                errors[variable.name] = validation.message;
              }
              break;
            case 'max':
              if (typeof value === 'number' && value > validation.value) {
                errors[variable.name] = validation.message;
              }
              break;
            case 'pattern':
              if (typeof value === 'string' && !new RegExp(validation.value).test(value)) {
                errors[variable.name] = validation.message;
              }
              break;
          }
        });
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGenerateProposal = async () => {
    if (!selectedTemplate || !validateForm()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const request: GenerateProposalRequest = {
      templateId: selectedTemplate.id!,
      projectId: project.id!,
      variableValues
    };

    try {
      await generateProposal.mutateAsync(request);
      onClose();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedTemplate || !validateForm()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      toast.loading('Gerando PDF...', { id: 'pdf-generation' });
      
      const proposalData = {
        templateId: selectedTemplate.id!,
        projectId: project.id!,
        clientId: client.id!,
        variableValues
      };

      const pdfBlob = await generateProposalPDF(selectedTemplate, proposalData);
      const filename = `proposta-${client.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`;
      
      downloadPDF(pdfBlob, filename);
      
      toast.success('PDF gerado com sucesso!', { id: 'pdf-generation' });
    } catch (error) {
      toast.error('Erro ao gerar PDF', { id: 'pdf-generation' });
    }
  };

  const renderVariableInput = (variable: TemplateVariable) => {
    const value = variableValues[variable.name];
    const hasError = validationErrors[variable.name];

    const baseInputProps = {
      id: variable.name,
      value: value || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => 
        handleVariableChange(variable.name, e.target.value),
      className: hasError ? 'border-red-500' : ''
    };

    switch (variable.type) {
      case 'number':
        return (
          <Input
            {...baseInputProps}
            type="number"
            step="0.01"
            onChange={(e) => handleVariableChange(variable.name, parseFloat(e.target.value) || 0)}
          />
        );
        
      case 'currency':
        return (
          <Input
            {...baseInputProps}
            type="number"
            step="0.01"
            onChange={(e) => handleVariableChange(variable.name, parseFloat(e.target.value) || 0)}
          />
        );
        
      case 'date':
        return (
          <Input
            {...baseInputProps}
            type="date"
            value={value ? new Date(value).toISOString().split('T')[0] : ''}
          />
        );
        
      case 'boolean':
        return (
          <select
            id={variable.name}
            value={value ? 'true' : 'false'}
            onChange={(e) => handleVariableChange(variable.name, e.target.value === 'true')}
            className={`w-full p-2 border rounded-md ${hasError ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </select>
        );
        
      case 'calculated':
        return (
          <div className="p-2 bg-gray-100 rounded-md text-gray-700">
            {variable.name.includes('investment') || variable.name.includes('savings') || variable.name.includes('cost')
              ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
              : value || 'Calculando...'
            }
          </div>
        );
        
      default:
        return <Input {...baseInputProps} />;
    }
  };

  if (showTemplateSelector) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Selecionar Template de Proposta</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto">
            <TemplateManager
              onCreateNew={() => {}}
              onEdit={() => {}}
              onSelect={(template) => setSelectedTemplate(template)}
              selectionMode={true}
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!selectedTemplate) {
    return null;
  }

  const categorizedVariables = {
    company: selectedTemplate.variables.filter(v => v.category === 'company'),
    client: selectedTemplate.variables.filter(v => v.category === 'client'),
    project: selectedTemplate.variables.filter(v => v.category === 'project'),
    calculation: selectedTemplate.variables.filter(v => v.category === 'calculation')
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Gerar Proposta - {selectedTemplate.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex h-full">
          {/* Left Side - Form */}
          <div className="w-1/2 pr-4 overflow-auto">
            <Tabs defaultValue="variables" className="h-full">
              <TabsList className="mb-4">
                <TabsTrigger value="variables">
                  <Settings className="w-4 h-4 mr-1" />
                  Variáveis
                </TabsTrigger>
                <TabsTrigger value="preview">
                  <Eye className="w-4 h-4 mr-1" />
                  Visualizar
                </TabsTrigger>
              </TabsList>

              <TabsContent value="variables" className="space-y-6">
                {Object.entries(categorizedVariables).map(([category, variables]) => {
                  if (variables.length === 0) return null;
                  
                  return (
                    <Card key={category}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">
                          {category === 'company' && 'Dados da Empresa'}
                          {category === 'client' && 'Dados do Cliente'}
                          {category === 'project' && 'Dados do Projeto'}
                          {category === 'calculation' && 'Valores Calculados'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {variables.map((variable) => (
                          <div key={variable.id}>
                            <div className="flex items-center gap-2 mb-1">
                              <Label htmlFor={variable.name}>
                                {variable.displayName}
                              </Label>
                              {variable.isRequired && (
                                <span className="text-red-500 text-sm">*</span>
                              )}
                              {variable.type === 'calculated' && (
                                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                  Auto
                                </span>
                              )}
                            </div>
                            
                            {renderVariableInput(variable)}
                            
                            {validationErrors[variable.name] && (
                              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {validationErrors[variable.name]}
                              </p>
                            )}
                            
                            {variable.description && (
                              <p className="text-gray-500 text-xs mt-1">
                                {variable.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  );
                })}
              </TabsContent>

              <TabsContent value="preview" className="h-full">
                <ProposalPreview
                  template={selectedTemplate}
                  data={variableValues}
                  className="h-full"
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Side - Preview */}
          <div className="w-1/2 pl-4 border-l">
            <ProposalPreview
              template={selectedTemplate}
              data={variableValues}
              className="h-full"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => setShowTemplateSelector(true)}>
            Trocar Template
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="w-4 h-4 mr-1" />
              Baixar PDF
            </Button>
            
            <Button 
              onClick={handleGenerateProposal}
              disabled={generateProposal.isPending}
            >
              {generateProposal.isPending ? (
                'Gerando...'
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Gerar Proposta
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
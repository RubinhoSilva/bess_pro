import React, { useState, useEffect } from 'react';
import { Download, FileText, Eye, Settings, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { AdvancedProposalTemplate, GenerateProposalRequest } from '../../types/advanced-templates';
import { useGenerateProposal } from '../../hooks/advanced-templates-hooks';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface ProposalGeneratorProps {
  template: AdvancedProposalTemplate;
  onClose?: () => void;
  initialData?: {
    projectId?: string;
    clientName?: string;
    projectName?: string;
  };
}

interface ValidationError {
  field: string;
  message: string;
}

export function ProposalGenerator({ template, onClose, initialData }: ProposalGeneratorProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [projectData, setProjectData] = useState<GenerateProposalRequest['projectData']>({
    projectId: initialData?.projectId || '',
    clientName: initialData?.clientName || '',
    clientEmail: '',
    projectName: initialData?.projectName || '',
    location: {
      address: '',
      city: '',
      state: '',
    },
    systemData: {
      type: 'PV',
    },
  });
  const [outputFormat, setOutputFormat] = useState<'html' | 'pdf'>('pdf');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  const generateProposalMutation = useGenerateProposal();

  // Inicializar variáveis com valores padrão
  useEffect(() => {
    const initialVariables: Record<string, any> = {};
    template.variables.forEach(variable => {
      if (variable.defaultValue !== undefined && variable.defaultValue !== '') {
        initialVariables[variable.key] = variable.defaultValue;
      }
    });
    
    // Adicionar dados iniciais se fornecidos
    if (initialData?.clientName) {
      initialVariables['cliente_nome'] = initialData.clientName;
    }
    if (initialData?.projectName) {
      initialVariables['projeto_nome'] = initialData.projectName;
    }
    
    setVariables(initialVariables);
  }, [template.variables, initialData]);

  const totalSteps = 3;
  const stepTitles = ['Dados do Cliente', 'Variáveis do Template', 'Revisar e Gerar'];

  const validateCurrentStep = (): ValidationError[] => {
    const errors: ValidationError[] = [];

    switch (currentStep) {
      case 1:
        if (!projectData?.clientName?.trim()) {
          errors.push({ field: 'clientName', message: 'Nome do cliente é obrigatório' });
        }
        if (!projectData?.projectName?.trim()) {
          errors.push({ field: 'projectName', message: 'Nome do projeto é obrigatório' });
        }
        if (!projectData?.location?.address?.trim()) {
          errors.push({ field: 'address', message: 'Endereço é obrigatório' });
        }
        break;

      case 2:
        template.variables.forEach(variable => {
          if (variable.required && (!variables[variable.key] || variables[variable.key] === '')) {
            errors.push({ 
              field: variable.key, 
              message: `${variable.label} é obrigatório` 
            });
          }
        });
        break;
    }

    return errors;
  };

  const handleNextStep = () => {
    const errors = validateCurrentStep();
    setValidationErrors(errors);

    if (errors.length === 0) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setValidationErrors([]);
  };

  const handleGenerate = async () => {
    const errors = validateCurrentStep();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    // Simular progresso
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const variableArray = Object.entries(variables).map(([key, value]) => ({
        key,
        value,
      }));

      await generateProposalMutation.mutateAsync({
        id: template.id,
        data: {
          variables: variableArray,
          projectData,
          outputFormat,
        },
      });

      setGenerationProgress(100);
      
      setTimeout(() => {
        setIsGenerating(false);
        onClose?.();
      }, 1000);

    } catch (error) {
      setIsGenerating(false);
      setGenerationProgress(0);
      clearInterval(progressInterval);
    }
  };

  const loadSampleData = () => {
    const sampleVariables = {
      cliente_nome: projectData?.clientName || 'João Silva',
      cliente_email: 'joao.silva@email.com',
      projeto_nome: projectData?.projectName || 'Sistema Solar Residencial',
      projeto_localizacao: 'São Paulo, SP',
      sistema_tipo: 'Fotovoltaico',
      potencia_total: 5.4,
      modulos_quantidade: 12,
      modulos_potencia: 450,
      modulos_marca: 'Canadian Solar',
      inversores_quantidade: 1,
      inversores_potencia: 5000,
      inversores_marca: 'Fronius',
      geracao_mensal: 650,
      geracao_anual: 7800,
      valor_total: 25000,
      economia_mensal: 580,
      economia_anual: 6960,
      payback_anos: 3.6,
      empresa_nome: 'Solar Tech',
      data_proposta: new Date().toISOString().split('T')[0],
      validade_proposta: 30,
    };

    setVariables(prev => ({ ...prev, ...sampleVariables }));

    setProjectData(prev => ({
      projectId: prev?.projectId || '',
      clientName: prev?.clientName || 'João Silva',
      clientEmail: 'joao.silva@email.com',
      projectName: prev?.projectName || 'Sistema Solar Residencial',
      location: {
        address: 'Rua das Flores, 123',
        city: 'São Paulo',
        state: 'SP',
        coordinates: {
          latitude: -23.5505,
          longitude: -46.6333,
        },
      },
      systemData: {
        type: 'PV' as const,
        modules: {
          count: 12,
          power: 450,
          brand: 'Canadian Solar',
          model: 'CS3U-450P',
        },
        inverters: {
          count: 1,
          power: 5000,
          brand: 'Fronius',
          model: 'Primo 5.0-1',
        },
      },
      calculations: {
        totalPower: 5.4,
        monthlyGeneration: 650,
        annualGeneration: 7800,
        savings: {
          monthly: 580,
          annual: 6960,
          paybackYears: 3.6,
        },
      },
    }));
  };

  const getFieldError = (fieldName: string): string | undefined => {
    return validationErrors.find(error => error.field === fieldName)?.message;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Cliente *
                </label>
                <Input
                  value={projectData?.clientName || ''}
                  onChange={(e) => setProjectData(prev => ({
                    ...prev!,
                    clientName: e.target.value
                  }))}
                  placeholder="Nome completo do cliente"
                  className={getFieldError('clientName') ? 'border-red-500' : ''}
                />
                {getFieldError('clientName') && (
                  <p className="text-red-500 text-xs mt-1">{getFieldError('clientName')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email do Cliente
                </label>
                <Input
                  type="email"
                  value={projectData?.clientEmail || ''}
                  onChange={(e) => setProjectData(prev => ({
                    ...prev!,
                    clientEmail: e.target.value
                  }))}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Projeto *
                </label>
                <Input
                  value={projectData?.projectName || ''}
                  onChange={(e) => setProjectData(prev => ({
                    ...prev!,
                    projectName: e.target.value
                  }))}
                  placeholder="Ex: Sistema Solar Residencial"
                  className={getFieldError('projectName') ? 'border-red-500' : ''}
                />
                {getFieldError('projectName') && (
                  <p className="text-red-500 text-xs mt-1">{getFieldError('projectName')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo do Sistema
                </label>
                <Select
                  value={projectData?.systemData?.type || 'PV'}
                  onValueChange={(value) => setProjectData(prev => ({
                    ...prev!,
                    systemData: {
                      ...prev!.systemData,
                      type: value as 'PV' | 'BESS' | 'HYBRID'
                    }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PV">Solar Fotovoltaico</SelectItem>
                    <SelectItem value="BESS">Armazenamento</SelectItem>
                    <SelectItem value="HYBRID">Sistema Híbrido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Endereço Completo *
              </label>
              <Textarea
                value={projectData?.location?.address || ''}
                onChange={(e) => setProjectData(prev => ({
                  ...prev!,
                  location: {
                    ...prev!.location,
                    address: e.target.value
                  }
                }))}
                placeholder="Rua, número, bairro"
                rows={2}
                className={getFieldError('address') ? 'border-red-500' : ''}
              />
              {getFieldError('address') && (
                <p className="text-red-500 text-xs mt-1">{getFieldError('address')}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cidade
                </label>
                <Input
                  value={projectData?.location?.city || ''}
                  onChange={(e) => setProjectData(prev => ({
                    ...prev!,
                    location: {
                      ...prev!.location,
                      city: e.target.value
                    }
                  }))}
                  placeholder="Nome da cidade"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <Input
                  value={projectData?.location?.state || ''}
                  onChange={(e) => setProjectData(prev => ({
                    ...prev!,
                    location: {
                      ...prev!.location,
                      state: e.target.value
                    }
                  }))}
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Variáveis do Template</h3>
              <Button variant="outline" onClick={loadSampleData}>
                <Zap className="h-4 w-4 mr-2" />
                Dados de Exemplo
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {template.variables.map(variable => {
                const hasError = getFieldError(variable.key);
                
                return (
                  <div key={variable.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">
                        {variable.label}
                        {variable.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <Badge variant="outline" className="text-xs">
                        {variable.type}
                      </Badge>
                    </div>

                    {variable.type === 'boolean' ? (
                      <Switch
                        checked={!!variables[variable.key]}
                        onCheckedChange={(checked) => setVariables(prev => ({
                          ...prev,
                          [variable.key]: checked
                        }))}
                      />
                    ) : variable.type === 'date' ? (
                      <Input
                        type="date"
                        value={variables[variable.key] || ''}
                        onChange={(e) => setVariables(prev => ({
                          ...prev,
                          [variable.key]: e.target.value
                        }))}
                        className={hasError ? 'border-red-500' : ''}
                      />
                    ) : ['number', 'currency', 'percentage'].includes(variable.type) ? (
                      <Input
                        type="number"
                        value={variables[variable.key] || ''}
                        onChange={(e) => setVariables(prev => ({
                          ...prev,
                          [variable.key]: Number(e.target.value)
                        }))}
                        placeholder={variable.defaultValue?.toString() || '0'}
                        min={variable.validation?.min}
                        max={variable.validation?.max}
                        className={hasError ? 'border-red-500' : ''}
                      />
                    ) : (
                      <Input
                        value={variables[variable.key] || ''}
                        onChange={(e) => setVariables(prev => ({
                          ...prev,
                          [variable.key]: e.target.value
                        }))}
                        placeholder={variable.defaultValue || `Digite ${variable.label.toLowerCase()}`}
                        className={hasError ? 'border-red-500' : ''}
                      />
                    )}

                    {variable.description && (
                      <p className="text-xs text-gray-500">{variable.description}</p>
                    )}

                    {hasError && (
                      <p className="text-red-500 text-xs">{hasError}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Revisar Informações</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Dados do Projeto</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div><strong>Cliente:</strong> {projectData?.clientName}</div>
                    <div><strong>Projeto:</strong> {projectData?.projectName}</div>
                    <div><strong>Localização:</strong> {projectData?.location?.address}</div>
                    <div><strong>Sistema:</strong> {projectData?.systemData?.type}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Variáveis Preenchidas</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <div className="space-y-1">
                      {Object.entries(variables).map(([key, value]) => {
                        const variable = template.variables.find(v => v.key === key);
                        if (!variable || !value) return null;
                        
                        return (
                          <div key={key} className="flex justify-between">
                            <span>{variable.label}:</span>
                            <span className="font-medium">
                              {variable.type === 'currency' 
                                ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
                                : variable.type === 'percentage'
                                ? `${value}%`
                                : String(value)
                              }
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Formato de Saída
              </label>
              <div className="flex space-x-4">
                <Button
                  variant={outputFormat === 'html' ? 'default' : 'outline'}
                  onClick={() => setOutputFormat('html')}
                  className="flex items-center space-x-2"
                >
                  <Eye className="h-4 w-4" />
                  <span>HTML (Visualizar)</span>
                </Button>
                <Button
                  variant={outputFormat === 'pdf' ? 'default' : 'outline'}
                  onClick={() => setOutputFormat('pdf')}
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>PDF (Download)</span>
                </Button>
              </div>
            </div>

            {isGenerating && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 animate-pulse" />
                  <span className="text-sm">Gerando proposta...</span>
                </div>
                <Progress value={generationProgress} className="w-full" />
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerar Proposta</h1>
          <p className="text-gray-600">Template: {template.name}</p>
        </div>
        <Badge variant="outline">{template.category}</Badge>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Passo {currentStep} de {totalSteps}</span>
          <span>{stepTitles[currentStep - 1]}</span>
        </div>
        <Progress value={(currentStep / totalSteps) * 100} className="w-full" />
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Corrija os seguintes erros:</span>
            </div>
            <ul className="list-disc list-inside text-sm text-red-600 mt-2">
              {validationErrors.map((error, index) => (
                <li key={index}>{error.message}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{stepTitles[currentStep - 1]}</CardTitle>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <div>
          {currentStep > 1 && (
            <Button variant="outline" onClick={handlePrevStep}>
              Anterior
            </Button>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          
          {currentStep < totalSteps ? (
            <Button onClick={handleNextStep}>
              Próximo
            </Button>
          ) : (
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating || generateProposalMutation.isPending}
            >
              {isGenerating ? (
                <>
                  <Settings className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Gerar Proposta
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
import React, { useState, useMemo } from 'react';
import { Eye, Download, Smartphone, Monitor, FileText, Settings, Zap, Variable as VariableIcon } from 'lucide-react';
import { AdvancedProposalTemplate, TemplateVariable, PageSection } from '../../types/advanced-templates';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

interface TemplatePreviewProps {
  template: Partial<AdvancedProposalTemplate>;
  variables?: Array<{ key: string; value: any }>;
  onGenerateProposal?: (variables: Array<{ key: string; value: any }>, format: 'html' | 'pdf') => void;
}

interface VariableInputProps {
  variable: TemplateVariable;
  value: any;
  onChange: (value: any) => void;
}

function VariableInput({ variable, value, onChange }: VariableInputProps) {
  const renderInput = () => {
    switch (variable.type) {
      case 'text':
        return (
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={variable.defaultValue || `Digite ${variable.label.toLowerCase()}`}
          />
        );
      
      case 'number':
      case 'currency':
      case 'percentage':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(Number(e.target.value))}
            placeholder={variable.defaultValue || '0'}
            min={variable.validation?.min}
            max={variable.validation?.max}
          />
        );
      
      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      
      case 'boolean':
        return (
          <Switch
            checked={!!value}
            onCheckedChange={onChange}
          />
        );
      
      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={variable.defaultValue || ''}
          />
        );
    }
  };

  const formatValue = (val: any) => {
    if (val === null || val === undefined || val === '') return '';
    
    switch (variable.type) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(Number(val) || 0);
      
      case 'percentage':
        return `${Number(val) || 0}%`;
      
      case 'number':
        return new Intl.NumberFormat('pt-BR').format(Number(val) || 0);
      
      case 'date':
        if (val) {
          const date = new Date(val);
          return date.toLocaleDateString('pt-BR');
        }
        return '';
      
      case 'boolean':
        return val ? 'Sim' : 'Não';
      
      default:
        return String(val);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          {variable.label}
          {variable.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <Badge variant="outline" className="text-xs">
          {variable.type}
        </Badge>
      </div>
      
      {renderInput()}
      
      {variable.description && (
        <p className="text-xs text-gray-500">{variable.description}</p>
      )}
      
      {value && (
        <div className="text-xs text-gray-600">
          <span className="font-medium">Preview:</span> {formatValue(value)}
        </div>
      )}
    </div>
  );
}

export function TemplatePreview({ template, variables, onGenerateProposal }: TemplatePreviewProps) {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [variableValues, setVariableValues] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    
    // Inicializar com valores padrão
    template.variables?.forEach(variable => {
      if (variable.defaultValue !== undefined && variable.defaultValue !== '') {
        initial[variable.key] = variable.defaultValue;
      }
    });
    
    // Sobrescrever com valores fornecidos
    variables?.forEach(variable => {
      initial[variable.key] = variable.value;
    });
    
    return initial;
  });

  const [showVariables, setShowVariables] = useState(false);
  const [mockData, setMockData] = useState(false);

  // Processar conteúdo com variáveis
  const processedSections = useMemo(() => {
    if (!template.sections) return [];

    return template.sections.map(section => {
      let processedContent = section.content;
      
      // Substituir variáveis
      template.variables?.forEach(variable => {
        const value = variableValues[variable.key];
        if (value !== undefined && value !== null && value !== '') {
          const formattedValue = formatVariableValue(value, variable.type);
          const regex = new RegExp(`\\{\\{\\s*${variable.key}\\s*\\}\\}`, 'g');
          processedContent = processedContent.replace(regex, formattedValue);
        }
      });

      // Processar seções condicionais simples
      processedContent = processConditionalContent(processedContent, variableValues);
      
      // Processar cálculos simples
      processedContent = processCalculatedContent(processedContent, variableValues);

      return {
        ...section,
        processedContent,
      };
    });
  }, [template.sections, template.variables, variableValues]);

  const formatVariableValue = (value: any, type: string): string => {
    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(Number(value) || 0);
        
      case 'percentage':
        return `${(Number(value) || 0).toFixed(1)}%`;
        
      case 'number':
        return new Intl.NumberFormat('pt-BR').format(Number(value) || 0);
        
      case 'date':
        if (value) {
          const date = new Date(value);
          return date.toLocaleDateString('pt-BR');
        }
        return '';
        
      case 'boolean':
        return value ? 'Sim' : 'Não';
        
      default:
        return String(value || '');
    }
  };

  const processConditionalContent = (content: string, values: Record<string, any>): string => {
    const ifRegex = /\{\{#if\s+(\w+)\}\}(.*?)\{\{\/if\}\}/g;
    
    return content.replace(ifRegex, (match, variableName, conditionalContent) => {
      const value = values[variableName];
      return value ? conditionalContent : '';
    });
  };

  const processCalculatedContent = (content: string, values: Record<string, any>): string => {
    const calcRegex = /\{\{calc:(.*?)\}\}/g;
    
    return content.replace(calcRegex, (match, expression) => {
      try {
        // Substituir variáveis na expressão
        const sanitizedExpression = expression.replace(/\w+/g, (varName: string) => {
          const value = values[varName] || 0;
          return String(Number(value));
        });
        
        // Validar expressão básica
        if (!/^[\d+\-*/().\s]+$/.test(sanitizedExpression)) {
          return match;
        }
        
        const result = Function(`"use strict"; return (${sanitizedExpression})`)();
        return new Intl.NumberFormat('pt-BR').format(result);
      } catch (error) {
        return match;
      }
    });
  };

  const loadMockData = () => {
    const mockValues: Record<string, any> = {
      cliente_nome: 'João Silva',
      cliente_email: 'joao.silva@email.com',
      projeto_nome: 'Sistema Solar Residencial',
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

    setVariableValues(prev => ({ ...prev, ...mockValues }));
    setMockData(true);
  };

  const generatePreviewStyles = (): React.CSSProperties => {
    if (!template.style) return {};

    return {
      fontFamily: template.style.fontFamily,
      color: '#333',
      lineHeight: 1.6,
      padding: `${template.style.margins?.top || 20}px ${template.style.margins?.right || 20}px ${template.style.margins?.bottom || 20}px ${template.style.margins?.left || 20}px`,
    };
  };

  const handleGenerateProposal = (format: 'html' | 'pdf') => {
    const variableArray = Object.entries(variableValues).map(([key, value]) => ({
      key,
      value,
    }));
    
    onGenerateProposal?.(variableArray, format);
  };

  if (!template) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-gray-500">
          <FileText className="mx-auto h-12 w-12 mb-2" />
          <p>Nenhum template para preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Preview Controls */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold">{template.name || 'Preview do Template'}</h2>
          <Badge>{template.category}</Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Device Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <Button
              variant={previewMode === 'desktop' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPreviewMode('desktop')}
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={previewMode === 'mobile' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPreviewMode('mobile')}
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>

          {/* Mock Data */}
          <Button variant="outline" size="sm" onClick={loadMockData}>
            <Zap className="h-4 w-4 mr-2" />
            Dados de Exemplo
          </Button>

          {/* Variables Panel */}
          <Dialog open={showVariables} onOpenChange={setShowVariables}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <VariableIcon className="h-4 w-4 mr-2" />
                Variáveis ({template.variables?.length || 0})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Preencher Variáveis do Template</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {template.variables?.map(variable => (
                  <VariableInput
                    key={variable.key}
                    variable={variable}
                    value={variableValues[variable.key]}
                    onChange={(value) => setVariableValues(prev => ({
                      ...prev,
                      [variable.key]: value
                    }))}
                  />
                ))}
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setVariableValues({})}>
                    Limpar Tudo
                  </Button>
                  <Button onClick={loadMockData}>
                    Carregar Exemplo
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Generate Actions */}
          {onGenerateProposal && (
            <div className="flex space-x-1">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleGenerateProposal('html')}
              >
                <Eye className="h-4 w-4 mr-2" />
                HTML
              </Button>
              <Button 
                size="sm"
                onClick={() => handleGenerateProposal('pdf')}
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        <div 
          className={`mx-auto bg-white shadow-lg ${
            previewMode === 'mobile' ? 'max-w-sm' : 'max-w-4xl'
          }`}
          style={{
            minHeight: '297mm', // A4 height
            ...generatePreviewStyles(),
          }}
        >
          {/* Watermark */}
          {template.style?.watermark?.enabled && template.style.watermark.text && (
            <div
              className="fixed inset-0 flex items-center justify-center pointer-events-none select-none"
              style={{
                fontSize: '72px',
                color: template.style.secondaryColor,
                opacity: template.style.watermark.opacity,
                transform: 'rotate(-45deg)',
                zIndex: 0,
              }}
            >
              {template.style.watermark.text}
            </div>
          )}

          {/* Content */}
          <div className="relative z-10">
            {processedSections.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <FileText className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-lg font-medium mb-2">Template vazio</h3>
                <p>Adicione seções ao template para ver o preview</p>
              </div>
            ) : (
              processedSections
                .sort((a, b) => a.order - b.order)
                .map((section) => (
                  <div 
                    key={section.id}
                    className={`${section.type === 'cover' ? 'min-h-screen flex flex-col justify-center text-center' : 'mb-8'}`}
                    style={{
                      columnCount: section.layout?.columns || 1,
                      columnGap: `${section.layout?.spacing || 16}px`,
                      textAlign: section.layout?.alignment || 'left',
                    }}
                  >
                    {/* Logo for cover page */}
                    {section.type === 'cover' && template.style?.logo?.url && (
                      <div 
                        className={`mb-8 ${
                          template.style.logo.position === 'center' ? 'text-center' :
                          template.style.logo.position === 'right' ? 'text-right' : 'text-left'
                        }`}
                      >
                        <img 
                          src={template.style.logo.url} 
                          alt="Logo"
                          className={`${
                            template.style.logo.size === 'small' ? 'h-16' :
                            template.style.logo.size === 'large' ? 'h-32' : 'h-24'
                          } inline-block`}
                        />
                      </div>
                    )}

                    {/* Section Title */}
                    <h1 
                      style={{
                        fontSize: template.style?.fontSize?.title || 32,
                        color: template.style?.primaryColor || '#3B82F6',
                        marginBottom: '1em',
                        fontWeight: 600,
                      }}
                    >
                      {section.title}
                    </h1>

                    {/* Section Content */}
                    <div 
                      style={{
                        fontSize: template.style?.fontSize?.body || 16,
                      }}
                      dangerouslySetInnerHTML={{
                        __html: section.processedContent
                          .replace(/\n/g, '<br>')
                          .replace(/#{3}\s*(.*)/g, `<h3 style="font-size: ${template.style?.fontSize?.heading || 24}px; color: ${template.style?.secondaryColor || '#6B7280'}; margin: 1.5em 0 0.8em 0; font-weight: 500;">$1</h3>`)
                          .replace(/#{2}\s*(.*)/g, `<h2 style="font-size: ${(template.style?.fontSize?.heading || 24) + 4}px; color: ${template.style?.secondaryColor || '#6B7280'}; margin: 1.5em 0 0.8em 0; font-weight: 500;">$1</h2>`)
                          .replace(/#{1}\s*(.*)/g, `<h1 style="font-size: ${template.style?.fontSize?.title || 32}px; color: ${template.style?.primaryColor || '#3B82F6'}; margin-bottom: 1em; font-weight: 600;">$1</h1>`)
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                          .replace(/^- (.*)/gm, '<li>$1</li>')
                          .replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>')
                      }}
                    />
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Preview Info */}
      <div className="border-t bg-white p-3">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span>Seções: {processedSections.length}</span>
            <span>Variáveis: {Object.keys(variableValues).length}/{template.variables?.length || 0}</span>
            {mockData && <Badge variant="secondary" className="text-xs">Dados de exemplo</Badge>}
          </div>
          <div className="flex items-center space-x-2">
            <span>Zoom: {previewMode === 'mobile' ? 'Mobile' : 'Desktop'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
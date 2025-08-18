import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Save, Eye, ArrowLeft, Settings, Palette, FileText, Variable } from 'lucide-react';
import { useTemplateEditor, useCreateAdvancedTemplate, useUpdateAdvancedTemplate } from '../../hooks/advanced-templates-hooks';
import { AdvancedProposalTemplate, PageSection, TemplateVariable } from '../../types/advanced-templates';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { toast } from 'react-hot-toast';
import { TemplateStyleEditor } from './TemplateStyleEditor';
import { SectionEditor } from './SectionEditor';
import { VariableEditor } from './VariableEditor';
import { TemplatePreview } from './TemplatePreview';

interface AdvancedTemplateEditorProps {
  template?: AdvancedProposalTemplate;
  onSave?: (template: AdvancedProposalTemplate) => void;
  onCancel?: () => void;
  mode?: 'create' | 'edit';
}

export function AdvancedTemplateEditor({
  template,
  onSave,
  onCancel,
  mode = 'create'
}: AdvancedTemplateEditorProps) {
  const {
    template: editorTemplate,
    isDirty,
    previewMode,
    setPreviewMode,
    updateTemplate,
    updateSection,
    addSection,
    removeSection,
    reorderSections,
    updateVariable,
    addVariable,
    removeVariable,
    markAsSaved,
  } = useTemplateEditor(template);

  const [activeTab, setActiveTab] = useState('basic');
  const [isSaving, setIsSaving] = useState(false);

  const createTemplateMutation = useCreateAdvancedTemplate();
  const updateTemplateMutation = useUpdateAdvancedTemplate();

  // Validation
  const isValid = editorTemplate.name && 
                  editorTemplate.description && 
                  editorTemplate.category &&
                  (editorTemplate.sections?.length || 0) > 0;

  const handleSave = async () => {
    if (!isValid) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setIsSaving(true);
    try {
      if (mode === 'create') {
        const result = await createTemplateMutation.mutateAsync({
          name: editorTemplate.name!,
          description: editorTemplate.description!,
          category: editorTemplate.category!,
          sections: editorTemplate.sections?.map(({ id, ...section }) => section) || [],
          variables: editorTemplate.variables || [],
          style: editorTemplate.style,
          isDefault: editorTemplate.isDefault,
          pdfSettings: editorTemplate.pdfSettings,
          features: editorTemplate.features,
        });
        markAsSaved();
        onSave?.(result);
      } else if (template) {
        const result = await updateTemplateMutation.mutateAsync({
          id: template.id,
          data: {
            name: editorTemplate.name,
            description: editorTemplate.description,
            category: editorTemplate.category,
            sections: editorTemplate.sections,
            variables: editorTemplate.variables,
            style: editorTemplate.style,
            isDefault: editorTemplate.isDefault,
            isActive: editorTemplate.isActive,
            pdfSettings: editorTemplate.pdfSettings,
            features: editorTemplate.features,
          },
        });
        markAsSaved();
        onSave?.(result);
      }
    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      const confirmed = window.confirm(
        'Você tem alterações não salvas. Deseja realmente sair?'
      );
      if (!confirmed) return;
    }
    onCancel?.();
  };

  // Auto-save draft (you could implement this with localStorage)
  useEffect(() => {
    if (isDirty && mode === 'create') {
      const draft = {
        ...editorTemplate,
        lastEdited: new Date().toISOString(),
      };
      localStorage.setItem('template-draft', JSON.stringify(draft));
    }
  }, [editorTemplate, isDirty, mode]);

  if (previewMode) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreviewMode(false)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Editor
            </Button>
            <h2 className="text-lg font-semibold">Preview - {editorTemplate.name}</h2>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!isValid || isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar Template'}
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <TemplatePreview template={editorTemplate} />
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-xl font-semibold">
                {mode === 'create' ? 'Novo Template' : 'Editar Template'}
              </h1>
              {isDirty && (
                <p className="text-sm text-orange-600">Alterações não salvas</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setPreviewMode(true)}
              disabled={!isValid}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handleSave} disabled={!isValid || isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Editor */}
          <div className="flex-1 overflow-auto">
            <div className="max-w-4xl mx-auto p-6 space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic" className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Básico</span>
                  </TabsTrigger>
                  <TabsTrigger value="sections" className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Seções</span>
                  </TabsTrigger>
                  <TabsTrigger value="variables" className="flex items-center space-x-2">
                    <Variable className="h-4 w-4" />
                    <span>Variáveis</span>
                  </TabsTrigger>
                  <TabsTrigger value="style" className="flex items-center space-x-2">
                    <Palette className="h-4 w-4" />
                    <span>Estilo</span>
                  </TabsTrigger>
                </TabsList>

                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Informações Básicas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nome do Template *
                          </label>
                          <Input
                            value={editorTemplate.name || ''}
                            onChange={(e) => updateTemplate({ name: e.target.value })}
                            placeholder="Ex: Proposta Solar Comercial"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Categoria *
                          </label>
                          <select
                            value={editorTemplate.category || 'CUSTOM'}
                            onChange={(e) => updateTemplate({ 
                              category: e.target.value as 'PV' | 'BESS' | 'HYBRID' | 'CUSTOM' 
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="PV">Solar Fotovoltaico</option>
                            <option value="BESS">Armazenamento</option>
                            <option value="HYBRID">Sistema Híbrido</option>
                            <option value="CUSTOM">Personalizado</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Descrição *
                        </label>
                        <Textarea
                          value={editorTemplate.description || ''}
                          onChange={(e) => updateTemplate({ description: e.target.value })}
                          placeholder="Descreva o propósito e uso deste template..."
                          rows={3}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={editorTemplate.isDefault || false}
                            onCheckedChange={(checked: boolean) => updateTemplate({ isDefault: checked })}
                          />
                          <label className="text-sm font-medium text-gray-700">
                            Template padrão para esta categoria
                          </label>
                        </div>
                        
                        {mode === 'edit' && (
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={editorTemplate.isActive !== false}
                              onCheckedChange={(checked) => updateTemplate({ isActive: checked })}
                            />
                            <label className="text-sm font-medium text-gray-700">
                              Template ativo
                            </label>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Features */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Funcionalidades</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={editorTemplate.features?.dynamicCharts || false}
                            onCheckedChange={(checked) => updateTemplate({
                              features: { 
                                dynamicCharts: checked,
                                calculatedFields: editorTemplate.features?.calculatedFields || false,
                                conditionalSections: editorTemplate.features?.conditionalSections || false,
                                multilanguage: editorTemplate.features?.multilanguage || false
                              }
                            })}
                          />
                          <label className="text-sm text-gray-700">Gráficos dinâmicos</label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={editorTemplate.features?.calculatedFields || false}
                            onCheckedChange={(checked) => updateTemplate({
                              features: { 
                                dynamicCharts: editorTemplate.features?.dynamicCharts || false,
                                calculatedFields: checked,
                                conditionalSections: editorTemplate.features?.conditionalSections || false,
                                multilanguage: editorTemplate.features?.multilanguage || false
                              }
                            })}
                          />
                          <label className="text-sm text-gray-700">Campos calculados</label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={editorTemplate.features?.conditionalSections || false}
                            onCheckedChange={(checked) => updateTemplate({
                              features: { 
                                dynamicCharts: editorTemplate.features?.dynamicCharts || false,
                                calculatedFields: editorTemplate.features?.calculatedFields || false,
                                conditionalSections: checked,
                                multilanguage: editorTemplate.features?.multilanguage || false
                              }
                            })}
                          />
                          <label className="text-sm text-gray-700">Seções condicionais</label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={editorTemplate.features?.multilanguage || false}
                            onCheckedChange={(checked) => updateTemplate({
                              features: { 
                                dynamicCharts: editorTemplate.features?.dynamicCharts || false,
                                calculatedFields: editorTemplate.features?.calculatedFields || false,
                                conditionalSections: editorTemplate.features?.conditionalSections || false,
                                multilanguage: checked
                              }
                            })}
                          />
                          <label className="text-sm text-gray-700">Multi-idioma</label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Sections Tab */}
                <TabsContent value="sections">
                  <SectionEditor
                    sections={editorTemplate.sections || []}
                    variables={editorTemplate.variables || []}
                    onUpdateSection={updateSection}
                    onAddSection={addSection}
                    onRemoveSection={removeSection}
                    onReorderSections={reorderSections}
                  />
                </TabsContent>

                {/* Variables Tab */}
                <TabsContent value="variables">
                  <VariableEditor
                    variables={editorTemplate.variables || []}
                    onUpdateVariable={updateVariable}
                    onAddVariable={addVariable}
                    onRemoveVariable={removeVariable}
                  />
                </TabsContent>

                {/* Style Tab */}
                <TabsContent value="style">
                  <TemplateStyleEditor
                    style={editorTemplate.style}
                    pdfSettings={editorTemplate.pdfSettings}
                    onUpdateStyle={(style) => updateTemplate({ style })}
                    onUpdatePdfSettings={(pdfSettings) => updateTemplate({ pdfSettings })}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Sidebar with info */}
          <div className="w-80 border-l bg-gray-50 p-4 space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Status do Template</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Seções:</span>
                  <Badge variant={editorTemplate.sections?.length ? 'default' : 'secondary'}>
                    {editorTemplate.sections?.length || 0}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Variáveis:</span>
                  <Badge variant={editorTemplate.variables?.length ? 'default' : 'secondary'}>
                    {editorTemplate.variables?.length || 0}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Válido:</span>
                  <Badge variant={isValid ? 'default' : 'destructive'}>
                    {isValid ? 'Sim' : 'Não'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Ações Rápidas</h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('sections')}
                  className="w-full justify-start"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Adicionar Seção
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('variables')}
                  className="w-full justify-start"
                >
                  <Variable className="h-4 w-4 mr-2" />
                  Adicionar Variável
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('style')}
                  className="w-full justify-start"
                >
                  <Palette className="h-4 w-4 mr-2" />
                  Personalizar Estilo
                </Button>
              </div>
            </div>

            {/* Help */}
            <div className="text-xs text-gray-500 space-y-2">
              <p><strong>Dica:</strong> Use variáveis para criar conteúdo dinâmico. Exemplo: {'{{cliente_nome}}'}</p>
              <p><strong>Seções condicionais:</strong> {'{{#if variavel}}'} conteúdo {'{{/if}}'}</p>
              <p><strong>Campos calculados:</strong> {'{{calc:preco * quantidade}}'}</p>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
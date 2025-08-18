import React, { useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { RichTextEditor } from './RichTextEditor';
import { VariableManager } from './VariableManager';
import { StyleEditor } from './StyleEditor';
import { ProposalPreview } from './ProposalPreview';
import { 
  ProposalTemplate, 
  ProposalSection, 
  TemplateVariable, 
  TemplateStyle 
} from '../../types/proposal';
import { 
  Plus, 
  Trash2, 
  Eye, 
  Save, 
  ArrowUp, 
  ArrowDown,
  FileText,
  Settings,
  Palette,
  Variable
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

interface TemplateEditorProps {
  template?: ProposalTemplate;
  onSave: (template: ProposalTemplate) => void;
  onCancel: () => void;
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  onSave,
  onCancel
}) => {
  const [editingTemplate, setEditingTemplate] = useState<ProposalTemplate>(() => 
    template || {
      name: '',
      description: '',
      category: 'PV',
      isDefault: false,
      structure: [],
      variables: [],
      styling: {
        primaryColor: '#2563eb',
        secondaryColor: '#1e40af',
        accentColor: '#3b82f6',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        fontSize: {
          title: 32,
          heading: 24,
          body: 14,
          small: 12
        },
        margins: {
          top: 20,
          right: 20,
          bottom: 20,
          left: 20
        }
      },
      createdBy: '',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  );

  const [selectedSectionId, setSelectedSectionId] = useState<string | undefined>();
  const [previewMode, setPreviewMode] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, any>>({});

  const selectedSection = editingTemplate.structure.find(s => s.id === selectedSectionId);

  const handleBasicInfoChange = useCallback((field: string, value: any) => {
    setEditingTemplate(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleAddSection = useCallback(() => {
    const newSection: ProposalSection = {
      id: uuidv4(),
      type: 'custom',
      title: 'Nova Seção',
      content: '<h2>Nova Seção</h2><p>Digite o conteúdo desta seção...</p>',
      order: editingTemplate.structure.length + 1,
      isRequired: false,
      showInPreview: true
    };

    setEditingTemplate(prev => ({
      ...prev,
      structure: [...prev.structure, newSection]
    }));

    setSelectedSectionId(newSection.id);
  }, [editingTemplate.structure.length]);

  const handleDeleteSection = useCallback((sectionId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta seção?')) {
      setEditingTemplate(prev => ({
        ...prev,
        structure: prev.structure.filter(s => s.id !== sectionId)
      }));
      
      if (selectedSectionId === sectionId) {
        setSelectedSectionId(undefined);
      }
    }
  }, [selectedSectionId]);

  const handleUpdateSection = useCallback((field: string, value: any) => {
    if (!selectedSectionId) return;

    setEditingTemplate(prev => ({
      ...prev,
      structure: prev.structure.map(section =>
        section.id === selectedSectionId
          ? { ...section, [field]: value }
          : section
      )
    }));
  }, [selectedSectionId]);

  const handleMoveSectionUp = useCallback((sectionId: string) => {
    setEditingTemplate(prev => {
      const sections = [...prev.structure];
      const index = sections.findIndex(s => s.id === sectionId);
      
      if (index > 0) {
        [sections[index], sections[index - 1]] = [sections[index - 1], sections[index]];
        // Update order numbers
        sections.forEach((section, idx) => {
          section.order = idx + 1;
        });
      }
      
      return { ...prev, structure: sections };
    });
  }, []);

  const handleMoveSectionDown = useCallback((sectionId: string) => {
    setEditingTemplate(prev => {
      const sections = [...prev.structure];
      const index = sections.findIndex(s => s.id === sectionId);
      
      if (index < sections.length - 1) {
        [sections[index], sections[index + 1]] = [sections[index + 1], sections[index]];
        // Update order numbers
        sections.forEach((section, idx) => {
          section.order = idx + 1;
        });
      }
      
      return { ...prev, structure: sections };
    });
  }, []);

  const handleUpdateVariables = useCallback((variables: TemplateVariable[]) => {
    setEditingTemplate(prev => ({
      ...prev,
      variables
    }));
  }, []);

  const handleUpdateStyling = useCallback((styling: TemplateStyle) => {
    setEditingTemplate(prev => ({
      ...prev,
      styling
    }));
  }, []);

  const handleSave = useCallback(() => {
    if (!editingTemplate.name.trim()) {
      toast.error('Nome do template é obrigatório');
      return;
    }

    if (editingTemplate.structure.length === 0) {
      toast.error('Template deve ter pelo menos uma seção');
      return;
    }

    onSave({
      ...editingTemplate,
      updatedAt: new Date()
    });
  }, [editingTemplate, onSave]);

  const generatePreviewData = useCallback(() => {
    const data: Record<string, any> = {};
    
    editingTemplate.variables.forEach(variable => {
      switch (variable.type) {
        case 'text':
          data[variable.name] = variable.defaultValue || `Exemplo ${variable.displayName}`;
          break;
        case 'number':
          data[variable.name] = variable.defaultValue || 100;
          break;
        case 'currency':
          data[variable.name] = variable.defaultValue || 50000;
          break;
        case 'date':
          data[variable.name] = variable.defaultValue || new Date().toISOString();
          break;
        case 'boolean':
          data[variable.name] = variable.defaultValue || true;
          break;
        default:
          data[variable.name] = variable.defaultValue || `Valor ${variable.displayName}`;
      }
    });

    setPreviewData(data);
  }, [editingTemplate.variables]);

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-hidden">
      {/* Left Sidebar - Section List */}
      <div className="w-80 min-w-80 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Editor de Template</h2>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="template-name">Nome do Template</Label>
              <Input
                id="template-name"
                value={editingTemplate.name}
                onChange={(e) => handleBasicInfoChange('name', e.target.value)}
                placeholder="Nome do template..."
              />
            </div>
            
            <div>
              <Label htmlFor="template-category">Categoria</Label>
              <Select 
                value={editingTemplate.category} 
                onValueChange={(value) => handleBasicInfoChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PV">Sistema Solar (PV)</SelectItem>
                  <SelectItem value="BESS">Sistema de Baterias (BESS)</SelectItem>
                  <SelectItem value="HYBRID">Sistema Híbrido</SelectItem>
                  <SelectItem value="GENERAL">Geral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="template-description">Descrição</Label>
              <Input
                id="template-description"
                value={editingTemplate.description || ''}
                onChange={(e) => handleBasicInfoChange('description', e.target.value)}
                placeholder="Descrição do template..."
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Seções do Template</h3>
            <Button 
              size="sm" 
              onClick={handleAddSection}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Adicionar
            </Button>
          </div>

          <div className="space-y-2">
            {editingTemplate.structure
              .sort((a, b) => a.order - b.order)
              .map((section) => (
              <div
                key={section.id}
                className={`group p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedSectionId === section.id
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedSectionId(section.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{section.title}</h4>
                    <p className="text-xs text-gray-500 capitalize">{section.type}</p>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-gray-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveSectionUp(section.id);
                      }}
                    >
                      <ArrowUp className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-gray-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveSectionDown(section.id);
                      }}
                    >
                      <ArrowDown className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-red-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSection(section.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onCancel} 
              className="flex-1 hover:bg-gray-100"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-1" />
              Salvar Template
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Toolbar */}
        <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold text-gray-900 truncate">
                {editingTemplate.name || 'Template sem nome'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {editingTemplate.description || 'Adicione uma descrição para o template'}
              </p>
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant={previewMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  if (!previewMode) {
                    generatePreviewData();
                  }
                  setPreviewMode(!previewMode);
                }}
                className={previewMode ? 'bg-green-600 hover:bg-green-700' : 'hover:bg-gray-100'}
              >
                <Eye className="w-4 h-4 mr-1" />
                {previewMode ? 'Sair da Prévia' : 'Visualizar Prévia'}
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {previewMode ? (
            <ProposalPreview 
              template={editingTemplate}
              data={previewData}
            />
          ) : (
            <Tabs defaultValue="content" className="h-full flex flex-col">
              <TabsList className="mx-4 mt-4 grid w-fit grid-cols-3">
                <TabsTrigger value="content" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Conteúdo
                </TabsTrigger>
                <TabsTrigger value="variables" className="flex items-center gap-2">
                  <Variable className="w-4 h-4" />
                  Variáveis
                </TabsTrigger>
                <TabsTrigger value="styling" className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Estilo
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-hidden">
                <TabsContent value="content" className="h-full m-0 p-4">
                  {selectedSection ? (
                    <Card className="h-full flex flex-col shadow-sm">
                      <CardHeader className="border-b bg-gray-50">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg text-gray-900">
                            Editando: {selectedSection.title}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Label className="text-sm font-medium text-gray-700">Tipo:</Label>
                            <Select
                              value={selectedSection.type}
                              onValueChange={(value) => handleUpdateSection('type', value)}
                            >
                              <SelectTrigger className="w-36">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cover">📄 Capa</SelectItem>
                                <SelectItem value="introduction">📋 Introdução</SelectItem>
                                <SelectItem value="technical">⚙️ Técnico</SelectItem>
                                <SelectItem value="financial">💰 Financeiro</SelectItem>
                                <SelectItem value="custom">✏️ Personalizado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <Label>Título da Seção</Label>
                            <Input
                              value={selectedSection.title}
                              onChange={(e) => handleUpdateSection('title', e.target.value)}
                            />
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="flex-1 overflow-hidden">
                        <div className="h-full">
                          <RichTextEditor
                            content={selectedSection.content}
                            onChange={(content) => handleUpdateSection('content', content)}
                            placeholder="Digite o conteúdo da seção..."
                            className="h-full"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center max-w-md">
                        <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                          <FileText className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Selecione uma seção para editar
                        </h3>
                        <p className="text-gray-500 mb-4">
                          Escolha uma seção na lista à esquerda para começar a editar o conteúdo, 
                          ou crie uma nova seção clicando no botão "Adicionar".
                        </p>
                        <Button 
                          onClick={handleAddSection}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Criar Nova Seção
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="variables" className="h-full m-0 p-4">
                  <VariableManager
                    variables={editingTemplate.variables}
                    onChange={handleUpdateVariables}
                  />
                </TabsContent>

                <TabsContent value="styling" className="h-full m-0 p-4">
                  <StyleEditor
                    styling={editingTemplate.styling}
                    onChange={handleUpdateStyling}
                  />
                </TabsContent>
              </div>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};
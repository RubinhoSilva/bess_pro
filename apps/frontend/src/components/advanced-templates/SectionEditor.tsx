import React, { useState } from 'react';
import { useDrop, useDrag } from 'react-dnd';
import { Plus, GripVertical, Edit3, Trash2, Eye, Settings } from 'lucide-react';
import { PageSection, TemplateVariable } from '../../types/advanced-templates';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface SectionEditorProps {
  sections: PageSection[];
  variables: TemplateVariable[];
  onUpdateSection: (sectionId: string, updates: Partial<PageSection>) => void;
  onAddSection: (section: Omit<PageSection, 'id' | 'order'>) => void;
  onRemoveSection: (sectionId: string) => void;
  onReorderSections: (fromIndex: number, toIndex: number) => void;
}

interface DraggableSectionProps {
  section: PageSection;
  index: number;
  variables: TemplateVariable[];
  onUpdate: (updates: Partial<PageSection>) => void;
  onRemove: () => void;
  onMove: (fromIndex: number, toIndex: number) => void;
}

const SECTION_TYPES = [
  { value: 'cover', label: 'Capa', description: 'Página de capa da proposta' },
  { value: 'introduction', label: 'Introdução', description: 'Apresentação da empresa e proposta' },
  { value: 'technical', label: 'Técnica', description: 'Detalhes técnicos do sistema' },
  { value: 'financial', label: 'Financeira', description: 'Análise financeira e investimento' },
  { value: 'legal', label: 'Legal', description: 'Termos e condições legais' },
  { value: 'custom', label: 'Personalizada', description: 'Seção personalizada' },
];

function DraggableSection({ section, index, variables, onUpdate, onRemove, onMove }: DraggableSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const [{ isDragging }, drag, preview] = useDrag({
    type: 'section',
    item: { index, id: section.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'section',
    hover: (item: { index: number; id: string }) => {
      if (item.index !== index) {
        onMove(item.index, index);
        item.index = index;
      }
    },
  });

  const sectionType = SECTION_TYPES.find(type => type.value === section.type);
  const usedVariables = variables.filter(v => section.variables.includes(v.key));

  const handleContentChange = (content: string) => {
    // Encontrar variáveis usadas no conteúdo
    const variableMatches = content.match(/\{\{([^}]+)\}\}/g) || [];
    const extractedVariables = variableMatches
      .map(match => match.replace(/[{}]/g, '').trim())
      .filter(key => variables.some(v => v.key === key));

    onUpdate({
      content,
      variables: Array.from(new Set(extractedVariables)), // Remove duplicatas
    });
  };

  return (
    <div ref={drop}>
      <Card 
        ref={preview}
        className={`transition-all duration-200 ${
          isDragging ? 'opacity-50 scale-95' : 'hover:shadow-md'
        } ${section.isRequired ? 'border-blue-200 bg-blue-50/30' : ''}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                ref={drag}
                className="cursor-move p-1 rounded hover:bg-gray-100"
              >
                <GripVertical className="h-4 w-4 text-gray-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium text-gray-900">{section.title}</h3>
                  <Badge variant="outline">{sectionType?.label}</Badge>
                  {section.isRequired && (
                    <Badge variant="secondary" className="text-xs">Obrigatória</Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    Ordem: {section.order}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mt-1">{sectionType?.description}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              {!section.isRequired && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRemove}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded text-sm">
                <h4 className="font-medium mb-2">Conteúdo da seção:</h4>
                <div className="text-gray-700 whitespace-pre-wrap">
                  {section.content || 'Nenhum conteúdo definido'}
                </div>
              </div>
              
              {usedVariables.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Variáveis utilizadas:</h4>
                  <div className="flex flex-wrap gap-1">
                    {usedVariables.map(variable => (
                      <Badge key={variable.key} variant="outline" className="text-xs">
                        {variable.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Layout: {section.layout?.columns || 1} coluna(s)</span>
                <span>Alinhamento: {section.layout?.alignment || 'left'}</span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Editar Seção - {section.title}</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content">Conteúdo</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título da Seção
                </label>
                <Input
                  value={section.title}
                  onChange={(e) => onUpdate({ title: e.target.value })}
                  placeholder="Título da seção"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conteúdo
                </label>
                <Textarea
                  value={section.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Conteúdo da seção... Use {{variavel}} para inserir variáveis dinâmicas"
                  rows={12}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Dica: Use {'{{variavel}}'} para inserir variáveis, {'{{#if variavel}}'} para condições, {'{{calc:expressao}}'} para cálculos
                </p>
              </div>

              {variables.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Variáveis Disponíveis
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-auto">
                    {variables.map(variable => (
                      <Button
                        key={variable.key}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newContent = section.content + ` {{${variable.key}}}`;
                          handleContentChange(newContent);
                        }}
                        className="justify-start text-xs"
                      >
                        {variable.label} ({variable.type})
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo da Seção
                </label>
                <Select
                  value={section.type}
                  onValueChange={(value) => onUpdate({ 
                    type: value as PageSection['type'] 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTION_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-gray-500">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Mostrar no Preview
                  </label>
                  <p className="text-xs text-gray-500">
                    Exibir esta seção no preview rápido
                  </p>
                </div>
                <Switch
                  checked={section.showInPreview}
                  onCheckedChange={(checked) => onUpdate({ showInPreview: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Seção Obrigatória
                  </label>
                  <p className="text-xs text-gray-500">
                    Esta seção não pode ser removida
                  </p>
                </div>
                <Switch
                  checked={section.isRequired}
                  onCheckedChange={(checked) => onUpdate({ isRequired: checked })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ordem de Exibição
                </label>
                <Input
                  type="number"
                  value={section.order}
                  onChange={(e) => onUpdate({ order: parseInt(e.target.value) || 1 })}
                  min={1}
                />
              </div>
            </TabsContent>

            <TabsContent value="layout" className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Colunas
                </label>
                <Select
                  value={section.layout?.columns?.toString() || '1'}
                  onValueChange={(value) => onUpdate({
                    layout: { 
                      columns: parseInt(value),
                      spacing: section.layout?.spacing || 16,
                      alignment: section.layout?.alignment || 'left'
                    }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Coluna</SelectItem>
                    <SelectItem value="2">2 Colunas</SelectItem>
                    <SelectItem value="3">3 Colunas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alinhamento
                </label>
                <Select
                  value={section.layout?.alignment || 'left'}
                  onValueChange={(value) => onUpdate({
                    layout: { 
                      columns: section.layout?.columns || 1,
                      spacing: section.layout?.spacing || 16,
                      alignment: value as 'left' | 'center' | 'right' | 'justify'
                    }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Esquerda</SelectItem>
                    <SelectItem value="center">Centro</SelectItem>
                    <SelectItem value="right">Direita</SelectItem>
                    <SelectItem value="justify">Justificado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Espaçamento (px)
                </label>
                <Input
                  type="number"
                  value={section.layout?.spacing || 16}
                  onChange={(e) => onUpdate({
                    layout: { 
                      columns: section.layout?.columns || 1,
                      spacing: parseInt(e.target.value) || 16,
                      alignment: section.layout?.alignment || 'left'
                    }
                  })}
                  min={0}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setIsEditing(false)}>
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function SectionEditor({
  sections,
  variables,
  onUpdateSection,
  onAddSection,
  onRemoveSection,
  onReorderSections,
}: SectionEditorProps) {
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSection, setNewSection] = useState<Omit<PageSection, 'id' | 'order'>>({
    type: 'custom',
    title: '',
    content: '',
    isRequired: false,
    showInPreview: true,
    variables: [],
    layout: {
      columns: 1,
      spacing: 16,
      alignment: 'left',
    },
  });

  const handleAddSection = () => {
    if (!newSection.title.trim()) return;
    
    onAddSection(newSection);
    setNewSection({
      type: 'custom',
      title: '',
      content: '',
      isRequired: false,
      showInPreview: true,
      variables: [],
      layout: {
        columns: 1,
        spacing: 16,
        alignment: 'left',
      },
    });
    setIsAddingSection(false);
  };

  const addPredefinedSection = (type: PageSection['type']) => {
    const sectionType = SECTION_TYPES.find(st => st.value === type);
    const templates = {
      cover: {
        title: 'Capa da Proposta',
        content: `# {{cliente_nome}}

## Proposta de Sistema {{sistema_tipo}}

**Preparado por:** {{empresa_nome}}
**Data:** {{data_proposta}}
**Localização:** {{projeto_localizacao}}

---

*Proposta técnica e comercial para instalação de sistema de energia renovável*`,
      },
      introduction: {
        title: 'Apresentação',
        content: `## Sobre Nossa Empresa

{{empresa_descricao}}

## Objetivo da Proposta

Esta proposta apresenta uma solução completa de energia renovável para {{cliente_nome}}, 
localizada em {{projeto_localizacao}}.

### Benefícios Principais:
- Redução de até {{economia_percentual}}% na conta de energia
- Retorno do investimento em {{payback_anos}} anos
- Sistema com garantia de {{garantia_anos}} anos`,
      },
      technical: {
        title: 'Especificações Técnicas',
        content: `## Configuração do Sistema

### Módulos Solares
- **Modelo:** {{modulos_modelo}}
- **Quantidade:** {{modulos_quantidade}} unidades
- **Potência unitária:** {{modulos_potencia}}W
- **Potência total:** {{potencia_total}}kWp

### Inversor
- **Modelo:** {{inversor_modelo}}
- **Quantidade:** {{inversores_quantidade}} unidades
- **Potência:** {{inversores_potencia}}W

## Geração Estimada
- **Mensal:** {{geracao_mensal}} kWh
- **Anual:** {{geracao_anual}} kWh`,
      },
      financial: {
        title: 'Análise Financeira',
        content: `## Investimento

**Valor total do projeto:** {{valor_total}}

### Economia Projetada
- **Economia mensal:** {{economia_mensal}}
- **Economia anual:** {{economia_anual}}
- **Payback:** {{payback_anos}} anos

### Fluxo de Caixa
{{#if tem_financiamento}}
**Financiamento disponível em até 120x**
{{/if}}

*Valores sujeitos a alteração conforme condições de mercado*`,
      },
      legal: {
        title: 'Termos e Condições',
        content: `## Condições Gerais

### Validade da Proposta
Esta proposta tem validade de {{validade_proposta}} dias.

### Garantias
- **Equipamentos:** Conforme fabricante
- **Instalação:** {{garantia_instalacao}} anos
- **Performance:** {{garantia_performance}} anos

### Documentação Necessária
- Conta de energia dos últimos 12 meses
- Documentos da propriedade
- Laudo estrutural (se necessário)

*Esta proposta está sujeita aos termos e condições gerais de contratação*`,
      },
      custom: {
        title: 'Seção Personalizada',
        content: 'Conteúdo da seção personalizada...',
      },
    };

    const template = templates[type];
    onAddSection({
      type,
      title: template.title,
      content: template.content,
      isRequired: type === 'cover',
      showInPreview: true,
      variables: [],
      layout: {
        columns: 1,
        spacing: 16,
        alignment: 'left',
      },
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Seções do Template</CardTitle>
            <div className="flex space-x-2">
              <Dialog open={isAddingSection} onOpenChange={setIsAddingSection}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Seção Personalizada
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova Seção Personalizada</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Título da Seção
                      </label>
                      <Input
                        value={newSection.title}
                        onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                        placeholder="Ex: Cronograma de Instalação"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo
                      </label>
                      <Select
                        value={newSection.type}
                        onValueChange={(value) => setNewSection({ 
                          ...newSection, 
                          type: value as PageSection['type'] 
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SECTION_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsAddingSection(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleAddSection} disabled={!newSection.title.trim()}>
                        Criar Seção
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-6">
            {SECTION_TYPES.map(type => (
              <Button
                key={type.value}
                variant="outline"
                size="sm"
                onClick={() => addPredefinedSection(type.value as PageSection['type'])}
                className="justify-start"
                disabled={sections.some(s => s.type === type.value && type.value === 'cover')}
              >
                <Plus className="h-3 w-3 mr-2" />
                {type.label}
              </Button>
            ))}
          </div>

          {sections.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Settings className="mx-auto h-8 w-8 mb-2" />
              <p>Nenhuma seção criada ainda</p>
              <p className="text-sm">Adicione seções para começar a construir seu template</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sections
                .sort((a, b) => a.order - b.order)
                .map((section, index) => (
                  <DraggableSection
                    key={section.id}
                    section={section}
                    index={index}
                    variables={variables}
                    onUpdate={(updates) => onUpdateSection(section.id, updates)}
                    onRemove={() => onRemoveSection(section.id)}
                    onMove={onReorderSections}
                  />
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Copy, Variable, Hash, Calendar, DollarSign, Percent, ToggleLeft, Image, Table } from 'lucide-react';
import { TemplateVariable } from '../../types/advanced-templates';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';

interface VariableEditorProps {
  variables: TemplateVariable[];
  onUpdateVariable: (variableKey: string, updates: Partial<TemplateVariable>) => void;
  onAddVariable: (variable: TemplateVariable) => void;
  onRemoveVariable: (variableKey: string) => void;
}

const VARIABLE_TYPES = [
  { 
    value: 'text', 
    label: 'Texto', 
    icon: Variable,
    description: 'Campo de texto simples',
    defaultValidation: { min: 1, max: 255 }
  },
  { 
    value: 'number', 
    label: 'Número', 
    icon: Hash,
    description: 'Valor numérico',
    defaultValidation: { min: 0 }
  },
  { 
    value: 'currency', 
    label: 'Moeda', 
    icon: DollarSign,
    description: 'Valor monetário em R$',
    defaultValidation: { min: 0 }
  },
  { 
    value: 'percentage', 
    label: 'Porcentagem', 
    icon: Percent,
    description: 'Valor percentual',
    defaultValidation: { min: 0, max: 100 }
  },
  { 
    value: 'date', 
    label: 'Data', 
    icon: Calendar,
    description: 'Campo de data'
  },
  { 
    value: 'boolean', 
    label: 'Sim/Não', 
    icon: ToggleLeft,
    description: 'Campo verdadeiro/falso'
  },
  { 
    value: 'image', 
    label: 'Imagem', 
    icon: Image,
    description: 'Upload de imagem'
  },
  { 
    value: 'table', 
    label: 'Tabela', 
    icon: Table,
    description: 'Dados tabulares'
  },
];

const PREDEFINED_VARIABLES = [
  // Cliente
  { key: 'cliente_nome', label: 'Nome do Cliente', type: 'text', required: true },
  { key: 'cliente_email', label: 'Email do Cliente', type: 'text', required: false },
  { key: 'cliente_telefone', label: 'Telefone do Cliente', type: 'text', required: false },
  { key: 'cliente_documento', label: 'CPF/CNPJ do Cliente', type: 'text', required: false },
  
  // Projeto
  { key: 'projeto_nome', label: 'Nome do Projeto', type: 'text', required: true },
  { key: 'projeto_localizacao', label: 'Localização do Projeto', type: 'text', required: true },
  { key: 'projeto_endereco', label: 'Endereço Completo', type: 'text', required: false },
  
  // Sistema
  { key: 'sistema_tipo', label: 'Tipo do Sistema', type: 'text', required: true },
  { key: 'potencia_total', label: 'Potência Total (kWp)', type: 'number', required: true },
  { key: 'modulos_quantidade', label: 'Quantidade de Módulos', type: 'number', required: false },
  { key: 'modulos_potencia', label: 'Potência por Módulo (W)', type: 'number', required: false },
  { key: 'modulos_marca', label: 'Marca dos Módulos', type: 'text', required: false },
  { key: 'modulos_modelo', label: 'Modelo dos Módulos', type: 'text', required: false },
  
  // Inversor
  { key: 'inversores_quantidade', label: 'Quantidade de Inversores', type: 'number', required: false },
  { key: 'inversores_potencia', label: 'Potência dos Inversores (W)', type: 'number', required: false },
  { key: 'inversores_marca', label: 'Marca dos Inversores', type: 'text', required: false },
  { key: 'inversores_modelo', label: 'Modelo dos Inversores', type: 'text', required: false },
  
  // Geração
  { key: 'geracao_mensal', label: 'Geração Mensal (kWh)', type: 'number', required: false },
  { key: 'geracao_anual', label: 'Geração Anual (kWh)', type: 'number', required: false },
  
  // Financeiro
  { key: 'valor_total', label: 'Valor Total do Projeto', type: 'currency', required: true },
  { key: 'economia_mensal', label: 'Economia Mensal', type: 'currency', required: false },
  { key: 'economia_anual', label: 'Economia Anual', type: 'currency', required: false },
  { key: 'payback_anos', label: 'Payback (anos)', type: 'number', required: false },
  { key: 'economia_percentual', label: 'Economia Percentual', type: 'percentage', required: false },
  
  // Empresa
  { key: 'empresa_nome', label: 'Nome da Empresa', type: 'text', required: false },
  { key: 'empresa_descricao', label: 'Descrição da Empresa', type: 'text', required: false },
  { key: 'empresa_logo', label: 'Logo da Empresa', type: 'image', required: false },
  
  // Datas e informações gerais
  { key: 'data_proposta', label: 'Data da Proposta', type: 'date', required: false },
  { key: 'validade_proposta', label: 'Validade da Proposta (dias)', type: 'number', required: false },
  { key: 'garantia_anos', label: 'Garantia (anos)', type: 'number', required: false },
];

interface VariableFormProps {
  variable?: TemplateVariable;
  onSave: (variable: TemplateVariable) => void;
  onCancel: () => void;
  existingKeys: string[];
}

function VariableForm({ variable, onSave, onCancel, existingKeys }: VariableFormProps) {
  const [formData, setFormData] = useState<TemplateVariable>(
    variable || {
      key: '',
      label: '',
      type: 'text',
      required: false,
      defaultValue: '',
      description: '',
      validation: {},
    }
  );

  const isEditing = !!variable;
  const variableType = VARIABLE_TYPES.find(type => type.value === formData.type);

  const handleSave = () => {
    if (!formData.key.trim() || !formData.label.trim()) return;
    
    // Verificar se a chave já existe (apenas para novos)
    if (!isEditing && existingKeys.includes(formData.key)) {
      alert('Já existe uma variável com esta chave');
      return;
    }

    // Normalizar chave (sem espaços, minúscula, underscores)
    const normalizedKey = formData.key
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    onSave({
      ...formData,
      key: normalizedKey,
      validation: {
        ...variableType?.defaultValidation,
        ...formData.validation,
      },
    });
  };

  const canAddOptions = ['text'].includes(formData.type);
  const canSetMinMax = ['text', 'number', 'currency', 'percentage'].includes(formData.type);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chave da Variável *
          </label>
          <Input
            value={formData.key}
            onChange={(e) => setFormData({ ...formData, key: e.target.value })}
            placeholder="Ex: cliente_nome"
            disabled={isEditing}
          />
          <p className="text-xs text-gray-500 mt-1">
            Será normalizada automaticamente (minúsculas, underscore)
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome de Exibição *
          </label>
          <Input
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            placeholder="Ex: Nome do Cliente"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de Variável *
        </label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ 
            ...formData, 
            type: value as TemplateVariable['type'],
            validation: VARIABLE_TYPES.find(t => t.value === value)?.defaultValidation || {}
          })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VARIABLE_TYPES.map(type => {
              const Icon = type.icon;
              return (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-gray-500">{type.description}</div>
                    </div>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descrição
        </label>
        <Textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descrição opcional para ajudar no preenchimento"
          rows={2}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Valor Padrão
        </label>
        {formData.type === 'boolean' ? (
          <Switch
            checked={!!formData.defaultValue}
            onCheckedChange={(checked) => setFormData({ ...formData, defaultValue: checked })}
          />
        ) : (
          <Input
            value={formData.defaultValue || ''}
            onChange={(e) => setFormData({ ...formData, defaultValue: e.target.value })}
            placeholder="Valor padrão opcional"
            type={['number', 'currency', 'percentage'].includes(formData.type) ? 'number' : 'text'}
          />
        )}
      </div>

      {/* Validações */}
      {canSetMinMax && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor Mínimo
            </label>
            <Input
              type="number"
              value={formData.validation?.min || ''}
              onChange={(e) => setFormData({
                ...formData,
                validation: {
                  ...formData.validation,
                  min: e.target.value ? Number(e.target.value) : undefined
                }
              })}
              placeholder="Opcional"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor Máximo
            </label>
            <Input
              type="number"
              value={formData.validation?.max || ''}
              onChange={(e) => setFormData({
                ...formData,
                validation: {
                  ...formData.validation,
                  max: e.target.value ? Number(e.target.value) : undefined
                }
              })}
              placeholder="Opcional"
            />
          </div>
        </div>
      )}

      {formData.type === 'text' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Padrão Regex (Validação)
          </label>
          <Input
            value={formData.validation?.pattern || ''}
            onChange={(e) => setFormData({
              ...formData,
              validation: {
                ...formData.validation,
                pattern: e.target.value || undefined
              }
            })}
            placeholder="Ex: ^[A-Za-z\\s]+$ (apenas letras e espaços)"
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.required}
            onCheckedChange={(checked) => setFormData({ ...formData, required: checked })}
          />
          <label className="text-sm font-medium text-gray-700">
            Campo obrigatório
          </label>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSave}
          disabled={!formData.key.trim() || !formData.label.trim()}
        >
          {isEditing ? 'Atualizar' : 'Criar'} Variável
        </Button>
      </div>
    </div>
  );
}

export function VariableEditor({
  variables,
  onUpdateVariable,
  onAddVariable,
  onRemoveVariable,
}: VariableEditorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingVariable, setEditingVariable] = useState<TemplateVariable | null>(null);
  const [deleteVariable, setDeleteVariable] = useState<TemplateVariable | null>(null);
  const [showPredefined, setShowPredefined] = useState(false);

  const existingKeys = variables.map(v => v.key);

  const handleAddPredefined = (predefined: typeof PREDEFINED_VARIABLES[0]) => {
    if (existingKeys.includes(predefined.key)) {
      alert('Esta variável já foi adicionada');
      return;
    }

    onAddVariable({
      key: predefined.key,
      label: predefined.label,
      type: predefined.type as TemplateVariable['type'],
      required: predefined.required,
      defaultValue: '',
      description: `Variável predefinida: ${predefined.label}`,
      validation: VARIABLE_TYPES.find(t => t.value === predefined.type)?.defaultValidation || {},
    });
  };

  const getVariableIcon = (type: string) => {
    const variableType = VARIABLE_TYPES.find(t => t.value === type);
    return variableType?.icon || Variable;
  };

  const getTypeLabel = (type: string) => {
    return VARIABLE_TYPES.find(t => t.value === type)?.label || type;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Variáveis do Template</CardTitle>
            <div className="flex space-x-2">
              <Dialog open={showPredefined} onOpenChange={setShowPredefined}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Variable className="h-4 w-4 mr-2" />
                    Variáveis Predefinidas
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                  <DialogHeader>
                    <DialogTitle>Variáveis Predefinidas</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {PREDEFINED_VARIABLES.map(variable => {
                      const Icon = getVariableIcon(variable.type);
                      const isAdded = existingKeys.includes(variable.key);
                      
                      return (
                        <Card key={variable.key} className={isAdded ? 'opacity-50' : ''}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Icon className="h-4 w-4" />
                                  <h4 className="font-medium">{variable.label}</h4>
                                  {variable.required && (
                                    <Badge variant="destructive" className="text-xs">Obrigatória</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  Chave: <code className="bg-gray-100 px-1 rounded">{variable.key}</code>
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  {getTypeLabel(variable.type)}
                                </Badge>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleAddPredefined(variable)}
                                disabled={isAdded}
                              >
                                {isAdded ? 'Adicionada' : 'Adicionar'}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog open={isCreating} onOpenChange={setIsCreating}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Variável
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Criar Nova Variável</DialogTitle>
                  </DialogHeader>
                  <VariableForm
                    onSave={(variable) => {
                      onAddVariable(variable);
                      setIsCreating(false);
                    }}
                    onCancel={() => setIsCreating(false)}
                    existingKeys={existingKeys}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {variables.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Variable className="mx-auto h-8 w-8 mb-2" />
              <p>Nenhuma variável criada ainda</p>
              <p className="text-sm">Adicione variáveis para tornar seu template dinâmico</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {variables.map(variable => {
                const Icon = getVariableIcon(variable.type);
                
                return (
                  <Card key={variable.key} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Icon className="h-4 w-4" />
                            <h4 className="font-medium">{variable.label}</h4>
                            {variable.required && (
                              <Badge variant="destructive" className="text-xs">Obrigatória</Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            <code className="bg-gray-100 px-1 rounded text-xs">
                              {'{{' + variable.key + '}}'}
                            </code>
                          </p>
                          
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {getTypeLabel(variable.type)}
                            </Badge>
                            {variable.defaultValue && (
                              <Badge variant="secondary" className="text-xs">
                                Padrão: {String(variable.defaultValue)}
                              </Badge>
                            )}
                          </div>
                          
                          {variable.description && (
                            <p className="text-xs text-gray-500 mt-2">
                              {variable.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex flex-col space-y-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingVariable(variable)}
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(`{{${variable.key}}}`);
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteVariable(variable)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingVariable} onOpenChange={() => setEditingVariable(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Variável</DialogTitle>
          </DialogHeader>
          {editingVariable && (
            <VariableForm
              variable={editingVariable}
              onSave={(variable) => {
                onUpdateVariable(editingVariable.key, variable);
                setEditingVariable(null);
              }}
              onCancel={() => setEditingVariable(null)}
              existingKeys={existingKeys.filter(key => key !== editingVariable.key)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteVariable} onOpenChange={() => setDeleteVariable(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a variável "{deleteVariable?.label}"? 
              Esta ação não pode ser desfeita e pode afetar as seções que usam esta variável.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteVariable) {
                  onRemoveVariable(deleteVariable.key);
                  setDeleteVariable(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
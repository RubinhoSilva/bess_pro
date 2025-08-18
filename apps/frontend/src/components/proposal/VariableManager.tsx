import React, { useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { TemplateVariable } from '../../types/proposal';
import { Plus, Trash2, Edit, Variable } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface VariableManagerProps {
  variables: TemplateVariable[];
  onChange: (variables: TemplateVariable[]) => void;
}

export const VariableManager: React.FC<VariableManagerProps> = ({
  variables,
  onChange
}) => {
  const [editingVariable, setEditingVariable] = useState<TemplateVariable | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Ensure all variables have unique IDs
  const safeVariables = variables.map((variable, index) => ({
    ...variable,
    id: variable.id || `var-${index}-${uuidv4().slice(0, 8)}`
  }));

  const handleAddVariable = useCallback(() => {
    const newVariable: TemplateVariable = {
      id: uuidv4(),
      name: '',
      displayName: '',
      type: 'text',
      isRequired: false,
      category: 'project',
      description: '',
      validations: []
    };
    
    setEditingVariable(newVariable);
    setIsDialogOpen(true);
  }, []);

  const handleEditVariable = useCallback((variable: TemplateVariable) => {
    setEditingVariable({ ...variable });
    setIsDialogOpen(true);
  }, []);

  const handleDeleteVariable = useCallback((id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta variável?')) {
      onChange(safeVariables.filter(v => v.id !== id));
    }
  }, [safeVariables, onChange]);

  const handleSaveVariable = useCallback((variable: TemplateVariable) => {
    if (!variable.name.trim() || !variable.displayName.trim()) {
      alert('Nome e nome de exibição são obrigatórios');
      return;
    }

    const existingIndex = safeVariables.findIndex(v => v.id === variable.id);
    
    if (existingIndex >= 0) {
      // Update existing
      const updated = [...safeVariables];
      updated[existingIndex] = variable;
      onChange(updated);
    } else {
      // Add new
      onChange([...safeVariables, variable]);
    }
    
    setIsDialogOpen(false);
    setEditingVariable(null);
  }, [safeVariables, onChange]);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setEditingVariable(null);
  }, []);

  const categorizedVariables = {
    company: safeVariables.filter(v => v.category === 'company'),
    client: safeVariables.filter(v => v.category === 'client'),
    project: safeVariables.filter(v => v.category === 'project'),
    calculation: safeVariables.filter(v => v.category === 'calculation')
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Gerenciar Variáveis</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddVariable}>
              <Plus className="w-4 h-4 mr-1" />
              Nova Variável
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingVariable?.id ? 'Editar Variável' : 'Nova Variável'}
              </DialogTitle>
            </DialogHeader>
            
            {editingVariable && (
              <VariableEditForm
                variable={editingVariable}
                onSave={handleSaveVariable}
                onCancel={handleCloseDialog}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(categorizedVariables).map(([category, categoryVariables]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-sm font-medium capitalize">
                {category === 'company' && 'Empresa'}
                {category === 'client' && 'Cliente'}
                {category === 'project' && 'Projeto'}
                {category === 'calculation' && 'Calculados'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categoryVariables.map((variable) => (
                  <div
                    key={variable.id}
                    className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Variable className="w-4 h-4 text-gray-400" />
                        <span className="font-mono text-sm text-blue-600">
                          {`{{${variable.name}}}`}
                        </span>
                        {variable.isRequired && (
                          <span className="text-xs text-red-500">*</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {variable.displayName}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {variable.type}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditVariable(variable)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteVariable(variable.id)}
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {categoryVariables.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Nenhuma variável nesta categoria
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {safeVariables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Referência Rápida</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm font-mono">
              {safeVariables.map((variable) => (
                <div
                  key={variable.id}
                  className="p-2 bg-gray-50 rounded text-blue-600 cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    navigator.clipboard.writeText(`{{${variable.name}}}`);
                  }}
                  title={`${variable.displayName} (clique para copiar)`}
                >
                  {`{{${variable.name}}}`}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Clique em uma variável para copiar para a área de transferência
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

interface VariableEditFormProps {
  variable: TemplateVariable;
  onSave: (variable: TemplateVariable) => void;
  onCancel: () => void;
}

const VariableEditForm: React.FC<VariableEditFormProps> = ({
  variable,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<TemplateVariable>(variable);

  const handleChange = useCallback((field: keyof TemplateVariable, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  }, [formData, onSave]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="variable-name">Nome da Variável *</Label>
          <Input
            id="variable-name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
            placeholder="nome_da_variavel"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Use apenas letras minúsculas, números e underscore
          </p>
        </div>
        
        <div>
          <Label htmlFor="variable-display-name">Nome de Exibição *</Label>
          <Input
            id="variable-display-name"
            value={formData.displayName}
            onChange={(e) => handleChange('displayName', e.target.value)}
            placeholder="Nome para Exibição"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="variable-type">Tipo da Variável</Label>
          <Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Texto</SelectItem>
              <SelectItem value="number">Número</SelectItem>
              <SelectItem value="currency">Moeda</SelectItem>
              <SelectItem value="date">Data</SelectItem>
              <SelectItem value="boolean">Sim/Não</SelectItem>
              <SelectItem value="image">Imagem</SelectItem>
              <SelectItem value="calculated">Calculado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="variable-category">Categoria</Label>
          <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="company">Empresa</SelectItem>
              <SelectItem value="client">Cliente</SelectItem>
              <SelectItem value="project">Projeto</SelectItem>
              <SelectItem value="calculation">Calculado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="variable-description">Descrição</Label>
        <Input
          id="variable-description"
          value={formData.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Descreva o propósito desta variável..."
        />
      </div>

      <div>
        <Label htmlFor="variable-default">Valor Padrão</Label>
        <Input
          id="variable-default"
          value={formData.defaultValue || ''}
          onChange={(e) => handleChange('defaultValue', e.target.value)}
          placeholder="Valor padrão (opcional)"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="variable-required"
          checked={formData.isRequired}
          onCheckedChange={(checked) => handleChange('isRequired', checked)}
        />
        <Label htmlFor="variable-required">Campo obrigatório</Label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          Salvar Variável
        </Button>
      </div>
    </form>
  );
};
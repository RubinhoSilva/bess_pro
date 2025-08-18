import React, { useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { TemplateManager } from '../../components/proposal/TemplateManager';
import { TemplateEditor } from '../../components/proposal/TemplateEditor';
import { useCreateTemplate, useUpdateTemplate } from '../../hooks/proposal-template-hooks';
import { ProposalTemplate, CreateTemplateRequest } from '../../types/proposal';
import { Button } from '../../components/ui/button';
import { ArrowLeft } from 'lucide-react';

type ViewMode = 'list' | 'edit' | 'create';

const ProposalTemplatesPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingTemplate, setEditingTemplate] = useState<ProposalTemplate | undefined>();

  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();

  const handleCreateNew = () => {
    setEditingTemplate(undefined);
    setViewMode('create');
  };

  const handleEdit = (template: ProposalTemplate) => {
    setEditingTemplate(template);
    setViewMode('edit');
  };

  const handleSave = async (template: ProposalTemplate) => {
    try {
      if (viewMode === 'create') {
        const createRequest: CreateTemplateRequest = {
          name: template.name,
          description: template.description,
          category: template.category,
          structure: template.structure,
          variables: template.variables,
          styling: template.styling
        };
        
        await createTemplate.mutateAsync(createRequest);
      } else if (viewMode === 'edit' && template.id) {
        await updateTemplate.mutateAsync({
          id: template.id,
          name: template.name,
          description: template.description,
          structure: template.structure,
          variables: template.variables,
          styling: template.styling
        });
      }
      
      setViewMode('list');
      setEditingTemplate(undefined);
    } catch (error) {
      // Error is handled by the hooks
    }
  };

  const handleCancel = () => {
    setViewMode('list');
    setEditingTemplate(undefined);
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'create':
      case 'edit':
        return (
          <div className="h-full">
            <div className="flex items-center gap-4 p-4 bg-white border-b">
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Voltar
              </Button>
              <h1 className="text-xl font-semibold">
                {viewMode === 'create' ? 'Novo Template' : 'Editar Template'}
              </h1>
            </div>
            
            <div className="h-[calc(100vh-200px)]">
              <TemplateEditor
                template={editingTemplate}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            </div>
          </div>
        );
        
      default:
        return (
          <div className="p-6">
            <TemplateManager
              onCreateNew={handleCreateNew}
              onEdit={handleEdit}
            />
          </div>
        );
    }
  };

  return (
    <div className="h-full">
      {renderContent()}
    </div>
  );
};

export default ProposalTemplatesPage;
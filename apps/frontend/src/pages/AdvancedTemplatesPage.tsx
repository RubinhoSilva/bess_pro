import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AdvancedProposalTemplate } from '../types/advanced-templates';
import { AdvancedTemplatesList } from '../components/advanced-templates/AdvancedTemplatesList';
import { AdvancedTemplateEditor } from '../components/advanced-templates/AdvancedTemplateEditor';
import { TemplatePreview } from '../components/advanced-templates/TemplatePreview';
import { useGenerateProposal } from '../hooks/advanced-templates-hooks';
import { toast } from 'react-hot-toast';

type ViewMode = 'list' | 'create' | 'edit' | 'preview' | 'generate';

export function AdvancedTemplatesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTemplate, setSelectedTemplate] = useState<AdvancedProposalTemplate | null>(null);
  
  const generateProposalMutation = useGenerateProposal();

  // Detectar modo inicial baseado na URL ou estado
  React.useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const mode = searchParams.get('mode') as ViewMode;
    const templateId = searchParams.get('template');
    
    if (mode && ['create', 'edit', 'preview'].includes(mode)) {
      setViewMode(mode);
    }
    
    // Se tiver um template no estado de navegação, usar ele
    if (location.state?.template) {
      setSelectedTemplate(location.state.template);
    }
  }, [location]);

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setViewMode('create');
    navigate('/advanced-templates?mode=create');
  };

  const handleEditTemplate = (template: AdvancedProposalTemplate) => {
    setSelectedTemplate(template);
    setViewMode('edit');
    navigate(`/advanced-templates?mode=edit&template=${template.id}`);
  };

  const handlePreviewTemplate = (template: AdvancedProposalTemplate) => {
    setSelectedTemplate(template);
    setViewMode('preview');
    navigate(`/advanced-templates?mode=preview&template=${template.id}`);
  };

  const handleGenerateProposal = (template: AdvancedProposalTemplate) => {
    setSelectedTemplate(template);
    setViewMode('generate');
    navigate(`/advanced-templates?mode=generate&template=${template.id}`);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedTemplate(null);
    navigate('/advanced-templates');
  };

  const handleTemplateSaved = (template: AdvancedProposalTemplate) => {
    toast.success('Template salvo com sucesso!');
    setSelectedTemplate(template);
    setViewMode('list');
    navigate('/advanced-templates');
  };

  const handleProposalGeneration = async (
    variables: Array<{ key: string; value: any }>,
    format: 'html' | 'pdf'
  ) => {
    if (!selectedTemplate) return;

    try {
      const result = await generateProposalMutation.mutateAsync({
        id: selectedTemplate.id,
        data: {
          variables,
          outputFormat: format,
        },
      });

      if (format === 'html' && typeof result === 'object' && 'content' in result) {
        // Abrir HTML em nova janela
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(result.content.html);
          newWindow.document.close();
        }
      }
      // PDF já é baixado automaticamente pela mutation
    } catch (error) {
      console.error('Erro ao gerar proposta:', error);
    }
  };

  // Render baseado no modo de visualização
  const renderContent = () => {
    switch (viewMode) {
      case 'create':
        return (
          <AdvancedTemplateEditor
            mode="create"
            onSave={handleTemplateSaved}
            onCancel={handleBackToList}
          />
        );

      case 'edit':
        return (
          <AdvancedTemplateEditor
            template={selectedTemplate!}
            mode="edit"
            onSave={handleTemplateSaved}
            onCancel={handleBackToList}
          />
        );

      case 'preview':
        return (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h1 className="text-xl font-semibold">
                Preview - {selectedTemplate?.name}
              </h1>
              <div className="flex space-x-2">
                <button
                  onClick={handleBackToList}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  Voltar à Lista
                </button>
                <button
                  onClick={() => handleEditTemplate(selectedTemplate!)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Editar Template
                </button>
              </div>
            </div>
            <div className="flex-1">
              <TemplatePreview
                template={selectedTemplate!}
                onGenerateProposal={handleProposalGeneration}
              />
            </div>
          </div>
        );

      case 'generate':
        return (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h1 className="text-xl font-semibold">
                  Gerar Proposta - {selectedTemplate?.name}
                </h1>
                <p className="text-gray-600">
                  Preencha as variáveis e gere sua proposta personalizada
                </p>
              </div>
              <button
                onClick={handleBackToList}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Voltar à Lista
              </button>
            </div>
            <div className="flex-1">
              <TemplatePreview
                template={selectedTemplate!}
                onGenerateProposal={handleProposalGeneration}
              />
            </div>
          </div>
        );

      default:
        return (
          <AdvancedTemplatesList
            onCreateTemplate={handleCreateTemplate}
            onEditTemplate={handleEditTemplate}
            onPreviewTemplate={handlePreviewTemplate}
            onGenerateProposal={handleGenerateProposal}
          />
        );
    }
  };

  return (
    <div className="h-full bg-gray-50">
      {renderContent()}
    </div>
  );
}
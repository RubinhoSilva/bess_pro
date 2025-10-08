import React, { useRef } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { ProposalTemplate } from '../../types/proposal';
import { Download, FileText } from 'lucide-react';
import { generateProposalPDF, downloadPDF } from '../../lib/pdf-generator';
import toast from 'react-hot-toast';

interface ProposalPreviewProps {
  template: ProposalTemplate;
  data: Record<string, any>;
  className?: string;
}

export const ProposalPreview: React.FC<ProposalPreviewProps> = ({
  template,
  data,
  className = ''
}) => {
  const previewRef = useRef<HTMLDivElement>(null);

  const processVariables = (content: string): string => {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    return content.replace(variableRegex, (match, variableName) => {
      const trimmedName = variableName.trim();
      const value = data[trimmedName];
      
      if (value !== undefined && value !== null) {
        const variable = template.variables.find(v => v.name === trimmedName);
        return formatVariableValue(value, variable?.type || 'text');
      }
      
      return `<span class="bg-yellow-100 px-1 rounded text-red-600">${match}</span>`;
    });
  };

  const formatVariableValue = (value: any, type: string): string => {
    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(Number(value) || 0);
        
      case 'number':
        return new Intl.NumberFormat('pt-BR').format(Number(value) || 0);
        
      case 'date':
        return new Date(value).toLocaleDateString('pt-BR');
        
      case 'boolean':
        return value ? 'Sim' : 'Não';
        
      default:
        return String(value);
    }
  };

  const shouldIncludeSection = (section: any): boolean => {
    if (section.conditions && section.conditions.length > 0) {
      return section.conditions.every((condition: any) => {
        const value = data[condition.variable];
        
        switch (condition.operator) {
          case 'equals':
            return value === condition.value;
          case 'not_equals':
            return value !== condition.value;
          case 'greater':
            return Number(value) > Number(condition.value);
          case 'less':
            return Number(value) < Number(condition.value);
          case 'contains':
            return String(value).includes(String(condition.value));
          default:
            return true;
        }
      });
    }
    
    return section.showInPreview !== false;
  };

  const handleGeneratePDF = async () => {
    try {
      toast.loading('Gerando PDF...', { id: 'pdf-generation' });
      
      const proposalData = {
        templateId: template.id || '',
        projectId: 'preview',
        clientId: 'preview',
        variableValues: data
      };

      const pdfBlob = await generateProposalPDF(template, proposalData);
      const filename = `proposta-${template.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`;
      
      downloadPDF(pdfBlob, filename);
      
      toast.success('PDF gerado com sucesso!', { id: 'pdf-generation' });
    } catch (error) {
      toast.error('Erro ao gerar PDF', { id: 'pdf-generation' });
    }
  };

  const sectionsToShow = template.structure
    .filter(shouldIncludeSection)
    .sort((a, b) => a.order - b.order);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Preview Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          <h3 className="font-medium">Preview da Proposta</h3>
        </div>
        
        <Button onClick={handleGeneratePDF} size="sm">
          <Download className="w-4 h-4 mr-1" />
          Baixar PDF
        </Button>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg">
            <CardContent className="p-0">
              <div
                ref={previewRef}
                className="proposal-preview"
                style={{
                  fontFamily: template.styling.fontFamily,
                  color: '#000000'
                }}
              >
                {/* Custom styles for preview */}
                <style>{`
                  .proposal-preview * {
                    font-family: ${template.styling.fontFamily};
                  }
                  
                  .proposal-preview h1 {
                    font-size: ${template.styling.fontSize.title}px;
                    color: ${template.styling.primaryColor};
                    margin: 0 0 16px 0;
                    font-weight: bold;
                  }
                  
                  .proposal-preview h2 {
                    font-size: ${template.styling.fontSize.heading}px;
                    color: ${template.styling.secondaryColor};
                    margin: 0 0 12px 0;
                    font-weight: bold;
                  }
                  
                  .proposal-preview h3 {
                    font-size: ${Math.round(template.styling.fontSize.heading * 0.85)}px;
                    color: ${template.styling.primaryColor};
                    margin: 0 0 8px 0;
                    font-weight: bold;
                  }
                  
                  .proposal-preview h4 {
                    font-size: ${template.styling.fontSize.body}px;
                    color: ${template.styling.secondaryColor};
                    margin: 0 0 6px 0;
                    font-weight: bold;
                  }
                  
                  .proposal-preview p {
                    font-size: ${template.styling.fontSize.body}px;
                    line-height: 1.6;
                    margin: 0 0 12px 0;
                  }
                  
                  .proposal-preview .specs-table,
                  .proposal-preview .performance-table,
                  .proposal-preview .financial-table,
                  .proposal-preview .comparison {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 16px 0;
                    font-size: ${template.styling.fontSize.body}px;
                  }
                  
                  .proposal-preview .specs-table td,
                  .proposal-preview .performance-table td,
                  .proposal-preview .financial-table td,
                  .proposal-preview .comparison td {
                    padding: 12px 8px;
                    border: 1px solid #e5e7eb;
                    vertical-align: top;
                  }
                  
                  .proposal-preview .specs-table th,
                  .proposal-preview .performance-table th,
                  .proposal-preview .financial-table th,
                  .proposal-preview .comparison th {
                    padding: 12px 8px;
                    border: 1px solid #e5e7eb;
                    background-color: ${template.styling.primaryColor};
                    color: white;
                    font-weight: bold;
                    text-align: left;
                  }
                  
                  .proposal-preview ul,
                  .proposal-preview ol {
                    margin: 12px 0;
                    padding-left: 24px;
                  }
                  
                  .proposal-preview li {
                    font-size: ${template.styling.fontSize.body}px;
                    margin-bottom: 6px;
                    line-height: 1.5;
                  }
                  
                  .proposal-preview .cover-page {
                    text-align: center;
                    padding: 60px 40px;
                    min-height: 600px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                  }
                  
                  .proposal-preview .company-info h1 {
                    color: ${template.styling.primaryColor};
                    margin-bottom: 12px;
                  }
                  
                  .proposal-preview .project-summary {
                    background-color: #f8fafc;
                    padding: 24px;
                    border-radius: 12px;
                    margin: 24px 0;
                    border: 1px solid #e2e8f0;
                  }
                  
                  .proposal-preview .summary-item {
                    margin: 12px 0;
                    font-size: ${template.styling.fontSize.body}px;
                    padding: 8px 0;
                  }
                  
                  .proposal-preview .summary-item strong {
                    color: ${template.styling.secondaryColor};
                  }
                  
                  .proposal-preview .highlight {
                    background-color: ${template.styling.accentColor}20;
                  }
                  
                  .proposal-preview .logo {
                    max-height: ${template.styling.logo?.size === 'small' ? '40px' : 
                                 template.styling.logo?.size === 'large' ? '80px' : '60px'};
                    margin-bottom: 16px;
                  }
                  
                  .proposal-preview .roi-item {
                    display: flex;
                    justify-content: space-between;
                    margin: 8px 0;
                    padding: 8px;
                    border-bottom: 1px solid #e5e7eb;
                  }
                  
                  .proposal-preview .roi-item:last-child {
                    border-bottom: none;
                  }
                  
                  .proposal-preview .payment-option {
                    background-color: #f8fafc;
                    padding: 16px;
                    border-radius: 8px;
                    margin: 12px 0;
                    border: 1px solid #e2e8f0;
                  }
                  
                  .proposal-preview .footer {
                    margin-top: auto;
                    padding-top: 40px;
                    font-size: ${template.styling.fontSize.small}px;
                    color: #6b7280;
                  }
                `}</style>

                {sectionsToShow.map((section, index) => (
                  <div key={section.id} className={index > 0 ? 'page-break' : ''}>
                    <div 
                      className="section-content p-8"
                      dangerouslySetInnerHTML={{
                        __html: processVariables(section.content)
                      }}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Missing Variables Warning */}
      {Object.keys(data).length === 0 && (
        <div className="p-4 bg-yellow-50 border-t border-yellow-200">
          <div className="flex items-center gap-2 text-yellow-700">
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            <span className="text-sm">
              Nenhum dado de preview disponível. Configure as variáveis no editor para ver uma prévia completa.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
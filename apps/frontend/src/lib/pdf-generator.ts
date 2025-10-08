import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ProposalTemplate, ProposalData, TemplateStyle } from '../types/proposal';

export class PDFGenerator {
  private pdf: jsPDF;
  private template: ProposalTemplate;
  private data: ProposalData;
  private currentY: number = 0;
  private pageHeight: number;
  private pageWidth: number;
  private margins: { top: number; right: number; bottom: number; left: number };

  constructor(template: ProposalTemplate, data: ProposalData) {
    this.template = template;
    this.data = data;
    this.margins = template.styling.margins;
    
    // Initialize PDF with A4 size
    this.pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
    this.currentY = this.margins.top;
  }

  async generatePDF(): Promise<Blob> {
    try {
      // Generate each section
      for (let i = 0; i < this.template.structure.length; i++) {
        const section = this.template.structure[i];
        
        // Check if section should be included
        if (!this.shouldIncludeSection(section)) {
          continue;
        }

        // Add new page for each section after the first
        if (i > 0) {
          this.addPage();
        }

        await this.generateSection(section);
      }

      // Add watermark if enabled
      if (this.template.styling.watermark?.enabled) {
        this.addWatermark();
      }

      return new Blob([this.pdf.output('blob')], { type: 'application/pdf' });
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Falha ao gerar PDF da proposta');
    }
  }

  private shouldIncludeSection(section: any): boolean {
    // Check conditions if any
    if (section.conditions && section.conditions.length > 0) {
      return section.conditions.every((condition: any) => 
        this.evaluateCondition(condition)
      );
    }
    
    return section.showInPreview !== false;
  }

  private evaluateCondition(condition: any): boolean {
    const value = this.data.variableValues[condition.variable];
    
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
  }

  private async generateSection(section: any): Promise<void> {
    // Process content with variables
    const processedContent = this.processVariables(section.content);
    
    // Create temporary DOM element to render HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = processedContent;
    tempDiv.style.width = `${this.pageWidth - this.margins.left - this.margins.right}mm`;
    tempDiv.style.padding = '20px';
    tempDiv.style.fontFamily = this.template.styling.fontFamily;
    tempDiv.style.fontSize = `${this.template.styling.fontSize.body}px`;
    tempDiv.style.color = '#000000';
    tempDiv.style.backgroundColor = '#ffffff';
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    
    // Apply custom styling
    this.applyStyling(tempDiv);
    
    document.body.appendChild(tempDiv);

    try {
      // Convert HTML to canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: tempDiv.scrollWidth,
        height: tempDiv.scrollHeight
      });

      // Calculate dimensions
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = this.pageWidth - this.margins.left - this.margins.right;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add image to PDF
      this.pdf.addImage(
        imgData,
        'PNG',
        this.margins.left,
        this.currentY,
        imgWidth,
        imgHeight
      );

      // Update current Y position
      this.currentY += imgHeight + 10;

      // Check if we need a new page
      if (this.currentY > this.pageHeight - this.margins.bottom) {
        this.addPage();
      }

    } finally {
      // Clean up
      document.body.removeChild(tempDiv);
    }
  }

  private processVariables(content: string): string {
    let processedContent = content;

    // Replace variables with actual values
    const variableRegex = /\{\{([^}]+)\}\}/g;
    processedContent = processedContent.replace(variableRegex, (match, variableName) => {
      const trimmedName = variableName.trim();
      const value = this.data.variableValues[trimmedName];
      
      if (value !== undefined && value !== null) {
        // Format based on variable type
        const variable = this.template.variables.find(v => v.name === trimmedName);
        return this.formatVariableValue(value, variable?.type || 'text');
      }
      
      return match; // Return original if not found
    });

    return processedContent;
  }

  private formatVariableValue(value: any, type: string): string {
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
  }

  private applyStyling(element: HTMLElement): void {
    const style = this.template.styling;
    
    // Apply global styles
    const css = `
      * {
        font-family: ${style.fontFamily};
        color: #000000;
      }
      
      h1 {
        font-size: ${style.fontSize.title}px;
        color: ${style.primaryColor};
        margin: 0 0 16px 0;
        font-weight: bold;
      }
      
      h2 {
        font-size: ${style.fontSize.heading}px;
        color: ${style.secondaryColor};
        margin: 0 0 12px 0;
        font-weight: bold;
      }
      
      h3 {
        font-size: ${Math.round(style.fontSize.heading * 0.85)}px;
        color: ${style.primaryColor};
        margin: 0 0 8px 0;
        font-weight: bold;
      }
      
      p {
        font-size: ${style.fontSize.body}px;
        line-height: 1.4;
        margin: 0 0 8px 0;
      }
      
      .specs-table, .performance-table, .financial-table, .comparison {
        width: 100%;
        border-collapse: collapse;
        margin: 16px 0;
      }
      
      .specs-table td, .performance-table td, .financial-table td, .comparison td {
        padding: 8px;
        border: 1px solid #e5e7eb;
        font-size: ${style.fontSize.body}px;
      }
      
      .specs-table th, .performance-table th, .financial-table th, .comparison th {
        padding: 8px;
        border: 1px solid #e5e7eb;
        background-color: ${style.primaryColor};
        color: white;
        font-weight: bold;
        font-size: ${style.fontSize.body}px;
      }
      
      ul, ol {
        margin: 8px 0;
        padding-left: 20px;
      }
      
      li {
        font-size: ${style.fontSize.body}px;
        margin-bottom: 4px;
      }
      
      .cover-page {
        text-align: center;
        padding: 40px 20px;
      }
      
      .company-info h1 {
        color: ${style.primaryColor};
        margin-bottom: 8px;
      }
      
      .project-summary {
        background-color: #f8fafc;
        padding: 20px;
        border-radius: 8px;
        margin: 20px 0;
      }
      
      .summary-item {
        margin: 8px 0;
        font-size: ${style.fontSize.body}px;
      }
      
      .highlight {
        background-color: ${style.accentColor}20;
      }
    `;

    const styleElement = document.createElement('style');
    styleElement.textContent = css;
    element.appendChild(styleElement);
  }

  private addPage(): void {
    this.pdf.addPage();
    this.currentY = this.margins.top;
  }

  private addWatermark(): void {
    if (!this.template.styling.watermark?.text) return;

    const pageCount = this.pdf.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.pdf.setPage(i);
      
      // Save the current graphics state
      this.pdf.saveGraphicsState();
      
      // Set watermark properties
      this.pdf.setGState({
        opacity: this.template.styling.watermark.opacity
      });
      
      this.pdf.setFontSize(60);
      this.pdf.setTextColor(128, 128, 128);
      
      // Rotate and position watermark
      this.pdf.text(
        this.template.styling.watermark.text,
        this.pageWidth / 2,
        this.pageHeight / 2,
        {
          angle: 45,
          align: 'center'
        }
      );
      
      // Restore the graphics state
      this.pdf.restoreGraphicsState();
    }
  }
}

// Utility function to generate PDF from template and data
export async function generateProposalPDF(
  template: ProposalTemplate,
  data: ProposalData
): Promise<Blob> {
  const generator = new PDFGenerator(template, data);
  return await generator.generatePDF();
}

// Function to download PDF
export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

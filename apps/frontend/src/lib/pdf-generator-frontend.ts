import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ProposalData {
  dimensioningId: string;
  customer: {
    name: string;
    document: string;
    address: string;
    phone?: string;
    email?: string;
    company?: string;
  };
  technical: {
    potenciaSistema: number;
    numeroModulos: number;
    numeroInversores: number;
    latitude: number;
    longitude: number;
    performanceRatio: number;
    yield: number;
    geracaoAnual: number;
    consumoAbatido: number;
    autoconsumo: number;
  };
  financial: {
    capex: number;
    vpl: number;
    tir: number;
    payback: number;
    roi: number;
    lcoe?: number;
    economiaProjetada: number;
    vidaUtil: number;
  };
  services: Array<{
    servico: string;
    descricao: string;
    valor: number;
  }>;
}

export const generatePDFProposal = async (data: ProposalData): Promise<Blob> => {
  // Cria um HTML temporário para a proposta
  const proposalHTML = createProposalHTML(data);
  
  // Cria um elemento temporário no DOM
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = proposalHTML;
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.width = '210mm';
  tempDiv.style.backgroundColor = 'white';
  tempDiv.style.color = 'black';
  tempDiv.style.padding = '20mm';
  tempDiv.style.fontFamily = 'Arial, sans-serif';
  
  document.body.appendChild(tempDiv);

  try {
    // Gera o canvas do conteúdo
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: 794, // A4 width in pixels at 96 DPI
      height: 1123, // A4 height in pixels at 96 DPI
      allowTaint: true,
      logging: false,
    });

    // Cria o PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png', 0.95);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgProps = pdf.getImageProperties(imgData);
    const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    // Adiciona a primeira página
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, Math.min(pdfHeight, imgHeight));
    heightLeft -= pdfHeight;

    // Adiciona páginas adicionais se necessário
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    // Retorna o blob
    const pdfBlob = pdf.output('blob');
    return pdfBlob;

  } finally {
    // Remove o elemento temporário
    document.body.removeChild(tempDiv);
  }
};

const createProposalHTML = (data: ProposalData): string => {
  const totalServices = data.services.reduce((sum, service) => sum + service.valor, 0);
  const totalInvestment = data.financial.capex + totalServices;

  return `
    <div style="font-family: Arial, sans-serif; color: black; background: white; padding: 20mm;">
      <!-- Cabeçalho -->
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
        <h1 style="margin: 0; color: #333; font-size: 28px;">Proposta Comercial Solar</h1>
        <p style="margin: 10px 0; color: #666; font-size: 14px;">Gerada em ${new Date().toLocaleDateString('pt-BR')}</p>
      </div>

      <!-- Dados do Cliente -->
      <div style="margin-bottom: 30px;">
        <h2 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Dados do Cliente</h2>
        <p><strong>Nome:</strong> ${data.customer.name}</p>
        <p><strong>Documento:</strong> ${data.customer.document}</p>
        <p><strong>Endereço:</strong> ${data.customer.address}</p>
        ${data.customer.phone ? `<p><strong>Telefone:</strong> ${data.customer.phone}</p>` : ''}
        ${data.customer.email ? `<p><strong>E-mail:</strong> ${data.customer.email}</p>` : ''}
        ${data.customer.company ? `<p><strong>Empresa:</strong> ${data.customer.company}</p>` : ''}
      </div>

      <!-- Especificações Técnicas -->
      <div style="margin-bottom: 30px;">
        <h2 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Especificações Técnicas</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <p><strong>Potência do Sistema:</strong> ${data.technical.potenciaSistema.toFixed(2)} kWp</p>
          <p><strong>Número de Módulos:</strong> ${data.technical.numeroModulos}</p>
          <p><strong>Número de Inversores:</strong> ${data.technical.numeroInversores}</p>
          <p><strong>Performance Ratio:</strong> ${(data.technical.performanceRatio * 100).toFixed(1)}%</p>
          <p><strong>Geração Anual:</strong> ${data.technical.geracaoAnual.toFixed(0)} kWh/ano</p>
          <p><strong>Yield:</strong> ${data.technical.yield.toFixed(1)} kWh/kWp</p>
          <p><strong>Consumo Abatido:</strong> ${data.technical.consumoAbatido.toFixed(0)} kWh/ano</p>
          <p><strong>Autoconsumo:</strong> ${(data.technical.autoconsumo * 100).toFixed(1)}%</p>
        </div>
      </div>

      <!-- Análise Financeira -->
      <div style="margin-bottom: 30px;">
        <h2 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Análise Financeira</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <p><strong>Investimento (CAPEX):</strong> R$ ${data.financial.capex.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p><strong>VPL:</strong> R$ ${data.financial.vpl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p><strong>TIR:</strong> ${(data.financial.tir * 100).toFixed(2)}%</p>
          <p><strong>Payback:</strong> ${data.financial.payback.toFixed(1)} anos</p>
          <p><strong>ROI:</strong> ${(data.financial.roi * 100).toFixed(1)}%</p>
          <p><strong>Economia Projetada:</strong> R$ ${data.financial.economiaProjetada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/ano</p>
          ${data.financial.lcoe ? `<p><strong>LCOE:</strong> R$ ${data.financial.lcoe.toFixed(4)}/kWh</p>` : ''}
          <p><strong>Vida Útil:</strong> ${data.financial.vidaUtil} anos</p>
        </div>
      </div>

      <!-- Serviços -->
      <div style="margin-bottom: 30px;">
        <h2 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Serviços Inclusos</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Serviço</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Descrição</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Valor (R$)</th>
            </tr>
          </thead>
          <tbody>
            ${data.services.map(service => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${service.servico}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${service.descricao}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${service.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              </tr>
            `).join('')}
            <tr style="background-color: #f5f5f5; font-weight: bold;">
              <td colspan="2" style="border: 1px solid #ddd; padding: 8px; text-align: right;">Total Serviços:</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${totalServices.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Resumo do Investimento -->
      <div style="margin-bottom: 30px;">
        <h2 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Resumo do Investimento</h2>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
          <p><strong>Equipamentos:</strong> R$ ${data.financial.capex.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p><strong>Serviços:</strong> R$ ${totalServices.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p style="font-size: 18px; font-weight: bold; color: #333; margin-top: 10px;">
            <strong>Total do Investimento:</strong> R$ ${totalInvestment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <!-- Observações -->
      <div style="margin-bottom: 30px;">
        <h2 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Observações</h2>
        <p style="color: #666; line-height: 1.5;">
          Esta proposta é válida por 30 dias. Os valores estão sujeitos a alteração conforme condições de pagamento e 
          disponibilidade de equipamentos. A instalação será realizada conforme normas técnicas brasileiras e 
          padrões de qualidade da empresa.
        </p>
      </div>

      <!-- Rodapé -->
      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; color: #666; font-size: 12px;">
        <p>Proposta gerada automaticamente • ID: ${data.dimensioningId}</p>
      </div>
    </div>
  `;
};
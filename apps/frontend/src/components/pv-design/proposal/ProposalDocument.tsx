import React from 'react';
import '../../../styles/proposal.css';
import { PageCover } from './PageCover';
import { PageIntroduction } from './PageIntroduction';
import { PageTechnical } from './PageTechnical';
import { PageTechnicalCharts1 } from './PageTechnicalCharts1';
import { PageTechnicalCharts2 } from './PageTechnicalCharts2';
import { PageFinancial } from './PageFinancial';
import { PageFinancialCharts } from './PageFinancialCharts';
import { PageServices } from './PageServices';
import { PagePayment } from './PagePayment';

import { PageConclusion } from './PageConclusion';

interface ProposalDocumentProps {
  results: any;
  profile?: {
    company?: string;
    logo_url?: string;
    phone?: string;
    email?: string;
    website?: string;
  };
  settings?: {
    show_introduction?: boolean;
    show_technical_analysis?: boolean;
    show_financial_analysis?: boolean;
    show_services?: boolean;
  };
}

export const ProposalDocument: React.FC<ProposalDocumentProps> = ({
  results,
  profile,
  settings
}) => {
  const showIntro = settings?.show_introduction ?? true;
  const showTech = settings?.show_technical_analysis ?? true;
  const showFinancial = settings?.show_financial_analysis ?? true;
  const showServices = settings?.show_services ?? true;

  // Log para verificar dados recebidos
  const debugResultsInfo = { results };

  // Log para verificar configurações das páginas
  const debugPagesInfo = {
    showIntro,
    showTech,
    showFinancial,
    showServices,
    totalPages: 1 + (showIntro ? 1 : 0) + (showTech ? 3 : 0) + (showFinancial ? 2 : 0) + (showServices ? 2 : 0) + 1
  };

  // Log para detectar quando o componente está montado
  React.useEffect(() => {
    const debugMountInfo = { mounted: true };
    
    const pages = document.querySelectorAll('.proposal-page');
    
    pages.forEach((page, index) => {
      const element = page as HTMLElement;
      const rect = element.getBoundingClientRect();
      const debugPageInfo = {
        width: rect.width,
        height: rect.height,
        scrollHeight: element.scrollHeight,
        offsetHeight: element.offsetHeight,
        clientHeight: element.clientHeight,
        overflow: window.getComputedStyle(element).overflow,
        pageBreakAfter: window.getComputedStyle(element).pageBreakAfter
      };
    });
  }, []);

  return (
    <div className="proposal-document">
      <PageCover results={results} profile={profile} />
      {showIntro && <PageIntroduction profile={profile} />}
      {showTech && (
        <>
          <PageTechnical results={results} />
          <PageTechnicalCharts1 
            results={{
              ...results,
              geracaoAnual: results.geracaoAnual || results.advancedSolar?.geracaoEstimada?.anual || 0,
              potencia: results.potenciaPico || results.potencia || 0,
              areaEstimada: (results.numeroModulos || 0) * 2.7,
              numeroModulos: results.numeroModulos || 0
            }} 
          />
          <PageTechnicalCharts2 results={results} />
        </>
      )}
      {showFinancial && (
        <>
          <PageFinancial results={results} />
          <PageFinancialCharts results={results} />
        </>
      )}
      {showServices && <PageServices results={results} profile={profile} />}
{showServices && <PagePayment results={results} profile={profile} />}
<PageConclusion results={results} profile={profile} />
    </div>
  );
};

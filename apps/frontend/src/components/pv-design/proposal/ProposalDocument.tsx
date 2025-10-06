import React from 'react';
import '../../../styles/proposal.css';
import { PageCover } from './PageCover';
import { PageIntroduction } from './PageIntroduction';
import { PageTechnical } from './PageTechnical';
import { PageTechnicalCharts } from './PageTechnicalCharts';
import { PageFinancial } from './PageFinancial';
import { PageFinancialCharts } from './PageFinancialCharts';
import { PageServices } from './PageServices';
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
  console.log('📄 ProposalDocument rendering with:', {
    potenciaSistema: results?.potenciaSistema,
    potenciaPico: results?.potenciaPico,
    geracaoAnual: results?.geracaoAnual,
    geracaoEstimadaMensalLength: results?.geracaoEstimadaMensal?.length,
    fluxoCaixaLength: results?.fluxoCaixa?.length,
    hasAdvancedSolar: !!results?.advancedSolar,
    hasAdvancedFinancial: !!results?.advancedFinancial,
    performanceRatio: results?.performanceRatio,
    yield: results?.yield,
    roi: results?.roi,
    lcoe: results?.lcoe,
    economiaProjetada: results?.economiaProjetada,
  });

  return (
    <div className="proposal-document">
      <PageCover results={results} profile={profile} />
      {showIntro && <PageIntroduction profile={profile} />}
      {showTech && (
        <>
          <PageTechnical results={results} />
          <PageTechnicalCharts results={results} />
        </>
      )}
      {showFinancial && (
        <>
          <PageFinancial results={results} />
          <PageFinancialCharts results={results} />
        </>
      )}
      {showServices && <PageServices results={results} profile={profile} />}
      <PageConclusion results={results} profile={profile} />
    </div>
  );
};
import React from 'react';
import { PageCover } from './PageCover';
import { PageIntroduction } from './PageIntroduction';
import { PageTechnical } from './PageTechnical';
import { PageFinancial } from './PageFinancial';

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

  return (
    <div className="proposal-document bg-slate-900 text-white">
      <PageCover results={results} profile={profile} />
      {showIntro && <PageIntroduction />}
      {showTech && <PageTechnical results={results} />}
      {showFinancial && <PageFinancial results={results} profile={profile} />}
    </div>
  );
};
import React from 'react';
import PageCover from './PageCover';
import PageIntroduction from './PageIntroduction';
import PageTechnical from './PageTechnical';
import PageFinancial from './PageFinancial';

const ProposalDocument = ({ results, profile, settings }) => {
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

export default ProposalDocument;
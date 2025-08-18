import React from 'react';
import { useLocation } from 'react-router-dom';
import BESSAnalysisTool from '@/components/bess/BESSAnalysisTool';

export default function BESSAnalysisPage() {
  const location = useLocation();
  
  const handleComplete = (results: any) => {
    console.log('BESS Analysis Results:', results);
  };

  // Passar o lead pré-selecionado para o componente
  return (
    <BESSAnalysisTool 
      onComplete={handleComplete} 
      preSelectedLead={location.state?.selectedLead}
    />
  );
}
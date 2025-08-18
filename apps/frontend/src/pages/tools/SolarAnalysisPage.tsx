import React from 'react';
import SolarLocationAnalyzer from '@/components/solar-analysis/SolarLocationAnalyzer';

export default function SolarAnalysisPage() {
  const handleAnalysisComplete = (data: any) => {
    console.log('Solar Analysis Complete:', data);
    
    // Aqui pode salvar os dados no contexto ou estado global
    // para uso em outros componentes do sistema
  };

  return (
    <div className="min-h-screen bg-background">
      <SolarLocationAnalyzer onAnalysisComplete={handleAnalysisComplete} />
    </div>
  );
}
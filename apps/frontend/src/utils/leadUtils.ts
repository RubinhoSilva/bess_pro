import { LeadStage, DefaultLeadStage } from '../types/lead';

export const getStageLabel = (stage: LeadStage): string => {
  switch (stage) {
    case DefaultLeadStage.LEAD_RECEBIDO:
      return 'Lead Recebido';
    case DefaultLeadStage.PRE_QUALIFICACAO:
      return 'Pré-qualificação';
    case DefaultLeadStage.PROPOSTA_ENVIADA:
      return 'Proposta Enviada';
    case DefaultLeadStage.DOCUMENTACAO_RECEBIDA:
      return 'Documentação Recebida';
    case DefaultLeadStage.PROJETO_APROVADO:
      return 'Projeto Aprovado';
    case DefaultLeadStage.INSTALACAO_AGENDADA:
      return 'Instalação Agendada';
    case DefaultLeadStage.SISTEMA_ENTREGUE:
      return 'Sistema Entregue';
    case DefaultLeadStage.CONVERTED:
      return 'Convertido em Cliente';
    default:
      return stage;
  }
};

export const getStageColor = (stage: LeadStage): string => {
  switch (stage) {
    case DefaultLeadStage.LEAD_RECEBIDO:
      return 'bg-gray-500';
    case DefaultLeadStage.PRE_QUALIFICACAO:
      return 'bg-blue-500';
    case DefaultLeadStage.PROPOSTA_ENVIADA:
      return 'bg-yellow-500';
    case DefaultLeadStage.DOCUMENTACAO_RECEBIDA:
      return 'bg-orange-500';
    case DefaultLeadStage.PROJETO_APROVADO:
      return 'bg-purple-500';
    case DefaultLeadStage.INSTALACAO_AGENDADA:
      return 'bg-indigo-500';
    case DefaultLeadStage.SISTEMA_ENTREGUE:
      return 'bg-green-500';
    case DefaultLeadStage.CONVERTED:
      return 'bg-emerald-500';
    default:
      return 'bg-gray-500';
  }
};

export const getNextStage = (currentStage: LeadStage): LeadStage | null => {
  const stages = [
    DefaultLeadStage.LEAD_RECEBIDO,
    DefaultLeadStage.PRE_QUALIFICACAO,
    DefaultLeadStage.PROPOSTA_ENVIADA,
    DefaultLeadStage.DOCUMENTACAO_RECEBIDA,
    DefaultLeadStage.PROJETO_APROVADO,
    DefaultLeadStage.INSTALACAO_AGENDADA,
    DefaultLeadStage.SISTEMA_ENTREGUE,
  ];
  
  const currentIndex = stages.indexOf(currentStage as DefaultLeadStage);
  return currentIndex < stages.length - 1 ? stages[currentIndex + 1] : null;
};

export const getPreviousStage = (currentStage: LeadStage): LeadStage | null => {
  const stages = [
    DefaultLeadStage.LEAD_RECEBIDO,
    DefaultLeadStage.PRE_QUALIFICACAO,
    DefaultLeadStage.PROPOSTA_ENVIADA,
    DefaultLeadStage.DOCUMENTACAO_RECEBIDA,
    DefaultLeadStage.PROJETO_APROVADO,
    DefaultLeadStage.INSTALACAO_AGENDADA,
    DefaultLeadStage.SISTEMA_ENTREGUE,
  ];
  
  const currentIndex = stages.indexOf(currentStage as DefaultLeadStage);
  return currentIndex > 0 ? stages[currentIndex - 1] : null;
};

export const getStageProgress = (stage: LeadStage): number => {
  const stages = [
    DefaultLeadStage.LEAD_RECEBIDO,
    DefaultLeadStage.PRE_QUALIFICACAO,
    DefaultLeadStage.PROPOSTA_ENVIADA,
    DefaultLeadStage.DOCUMENTACAO_RECEBIDA,
    DefaultLeadStage.PROJETO_APROVADO,
    DefaultLeadStage.INSTALACAO_AGENDADA,
    DefaultLeadStage.SISTEMA_ENTREGUE,
  ];
  
  const currentIndex = stages.indexOf(stage as DefaultLeadStage);
  return ((currentIndex + 1) / stages.length) * 100;
};
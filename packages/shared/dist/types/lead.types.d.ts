export interface Lead {
    id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    stage: LeadStage;
    priority: Priority;
    tags: string[];
    notes?: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum LeadStage {
    RECEIVED = "lead-recebido",
    QUALIFICATION = "pre-qualificacao",
    PROPOSAL_SENT = "proposta-enviada",
    DOCUMENTATION = "documentacao-recebida",
    APPROVED = "projeto-aprovado",
    INSTALLATION = "instalacao-agendada",
    DELIVERED = "sistema-entregue"
}
export declare enum Priority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high"
}
//# sourceMappingURL=lead.types.d.ts.map
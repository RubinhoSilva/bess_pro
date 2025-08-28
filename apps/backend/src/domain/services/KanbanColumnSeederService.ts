import { KanbanColumn } from '../entities/KanbanColumn';

export interface IKanbanColumnSeederService {
  createDefaultColumnsForTeam(teamId: string): Promise<KanbanColumn[]>;
}

export class KanbanColumnSeederService implements IKanbanColumnSeederService {
  
  async createDefaultColumnsForTeam(teamId: string): Promise<KanbanColumn[]> {
    // Colunas padrão baseadas no sistema antigo
    const defaultColumns: Omit<KanbanColumn, 'id' | 'createdAt' | 'updatedAt'>[] = [
      { teamId, name: 'Lead Recebido', key: 'LEAD_RECEBIDO', position: 0, isDefault: true, isActive: true },
      { teamId, name: 'Pré-qualificação', key: 'PRE_QUALIFICACAO', position: 1, isDefault: true, isActive: true },
      { teamId, name: 'Proposta Enviada', key: 'PROPOSTA_ENVIADA', position: 2, isDefault: true, isActive: true },
      { teamId, name: 'Documentação Recebida', key: 'DOCUMENTACAO_RECEBIDA', position: 3, isDefault: true, isActive: true },
      { teamId, name: 'Projeto Aprovado', key: 'PROJETO_APROVADO', position: 4, isDefault: true, isActive: true },
      { teamId, name: 'Instalação Agendada', key: 'INSTALACAO_AGENDADA', position: 5, isDefault: true, isActive: true },
      { teamId, name: 'Sistema Entregue', key: 'SISTEMA_ENTREGUE', position: 6, isDefault: true, isActive: true },
      { teamId, name: 'Quarentena', key: 'QUARENTENA', position: 7, isDefault: true, isActive: true },
    ];

    return defaultColumns.map(col => ({
      ...col,
      id: `temp-${Date.now()}-${Math.random()}`, // Será substituído pelo ID real do banco
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }
}
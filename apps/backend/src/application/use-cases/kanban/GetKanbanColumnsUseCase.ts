import { IKanbanColumnRepository } from '../../../domain/repositories/IKanbanColumnRepository';
import { KanbanColumn } from '../../../domain/entities/KanbanColumn';

export class GetKanbanColumnsUseCase {
  constructor(
    private kanbanColumnRepository: IKanbanColumnRepository
  ) {}

  async execute(teamId: string): Promise<KanbanColumn[]> {
    // Busca colunas existentes para o team
    const existingColumns = await this.kanbanColumnRepository.findByTeamId(teamId);
    
    // Se não houver colunas, cria as padrões
    if (existingColumns.length === 0) {
      return await this.kanbanColumnRepository.createDefaultColumns(teamId);
    }
    
    return existingColumns;
  }
}
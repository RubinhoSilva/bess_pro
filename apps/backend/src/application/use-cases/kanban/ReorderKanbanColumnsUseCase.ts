import { IKanbanColumnRepository } from '../../../domain/repositories/IKanbanColumnRepository';
import { ReorderColumnsRequest } from '../../../domain/entities/KanbanColumn';

export class ReorderKanbanColumnsUseCase {
  constructor(
    private kanbanColumnRepository: IKanbanColumnRepository
  ) {}

  async execute(teamId: string, data: ReorderColumnsRequest): Promise<boolean> {
    return await this.kanbanColumnRepository.reorder(teamId, data.columns);
  }
}
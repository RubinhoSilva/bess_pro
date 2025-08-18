import { IKanbanColumnRepository } from '../../../domain/repositories/IKanbanColumnRepository';
import { KanbanColumn, UpdateKanbanColumnRequest } from '../../../domain/entities/KanbanColumn';

export class UpdateKanbanColumnUseCase {
  constructor(
    private kanbanColumnRepository: IKanbanColumnRepository
  ) {}

  async execute(columnId: string, data: UpdateKanbanColumnRequest): Promise<KanbanColumn | null> {
    return await this.kanbanColumnRepository.update(columnId, data);
  }
}
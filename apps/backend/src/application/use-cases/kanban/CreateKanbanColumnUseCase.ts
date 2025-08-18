import { IKanbanColumnRepository } from '../../../domain/repositories/IKanbanColumnRepository';
import { KanbanColumn, CreateKanbanColumnRequest } from '../../../domain/entities/KanbanColumn';

export class CreateKanbanColumnUseCase {
  constructor(
    private kanbanColumnRepository: IKanbanColumnRepository
  ) {}

  async execute(teamId: string, data: CreateKanbanColumnRequest): Promise<KanbanColumn> {
    return await this.kanbanColumnRepository.create(teamId, data);
  }
}
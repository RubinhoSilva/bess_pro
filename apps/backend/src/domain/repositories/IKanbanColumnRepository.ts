import { KanbanColumn, CreateKanbanColumnRequest, UpdateKanbanColumnRequest } from '../entities/KanbanColumn';

export interface IKanbanColumnRepository {
  save(data: Omit<KanbanColumn, 'id' | 'createdAt' | 'updatedAt'>): Promise<KanbanColumn>;
  create(teamId: string, data: CreateKanbanColumnRequest): Promise<KanbanColumn>;
  findByTeamId(teamId: string, activeOnly?: boolean): Promise<KanbanColumn[]>;
  findById(id: string): Promise<KanbanColumn | null>;
  update(id: string, data: UpdateKanbanColumnRequest): Promise<KanbanColumn | null>;
  delete(id: string): Promise<boolean>;
  reorder(teamId: string, positions: Array<{ id: string; position: number }>): Promise<boolean>;
  getNextPosition(teamId: string): Promise<number>;
  createDefaultColumns(teamId: string): Promise<KanbanColumn[]>;
}
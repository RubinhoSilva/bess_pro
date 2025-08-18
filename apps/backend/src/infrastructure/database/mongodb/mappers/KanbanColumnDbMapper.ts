import { KanbanColumn } from '../../../../domain/entities/KanbanColumn';
import { KanbanColumnDocument } from '../schemas/KanbanColumnSchema';

export class KanbanColumnDbMapper {
  static toDomain(document: KanbanColumnDocument): KanbanColumn {
    return {
      id: document._id,
      teamId: document.teamId,
      name: document.name,
      key: document.key,
      position: document.position,
      color: document.color,
      isDefault: document.isDefault,
      isActive: document.isActive,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }
}
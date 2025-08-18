import { IKanbanColumnRepository } from '../../../../domain/repositories/IKanbanColumnRepository';
import { KanbanColumn, CreateKanbanColumnRequest, UpdateKanbanColumnRequest } from '../../../../domain/entities/KanbanColumn';
import { KanbanColumnModel, KanbanColumnDocument } from '../schemas/KanbanColumnSchema';
import { KanbanColumnDbMapper } from '../mappers/KanbanColumnDbMapper';

export class MongoKanbanColumnRepository implements IKanbanColumnRepository {
  async save(data: Omit<KanbanColumn, 'id' | 'createdAt' | 'updatedAt'>): Promise<KanbanColumn> {
    const document = new KanbanColumnModel({
      teamId: data.teamId,
      name: data.name,
      key: data.key,
      position: data.position,
      color: data.color,
      isDefault: data.isDefault,
      isActive: data.isActive,
    });

    const savedDocument = await document.save();
    return KanbanColumnDbMapper.toDomain(savedDocument);
  }

  async create(teamId: string, data: CreateKanbanColumnRequest): Promise<KanbanColumn> {
    const position = data.position ?? (await this.getNextPosition(teamId));
    
    const document = new KanbanColumnModel({
      teamId,
      name: data.name,
      key: data.key,
      position,
      color: data.color,
      isDefault: false,
      isActive: true,
    });

    const savedDocument = await document.save();
    return KanbanColumnDbMapper.toDomain(savedDocument);
  }

  async findByTeamId(teamId: string, activeOnly = true): Promise<KanbanColumn[]> {
    const query = activeOnly ? { teamId, isActive: true } : { teamId };
    const documents = await KanbanColumnModel.find(query).sort({ position: 1 });
    return documents.map(KanbanColumnDbMapper.toDomain);
  }

  async findById(id: string): Promise<KanbanColumn | null> {
    const document = await KanbanColumnModel.findById(id);
    return document ? KanbanColumnDbMapper.toDomain(document) : null;
  }

  async update(id: string, data: UpdateKanbanColumnRequest): Promise<KanbanColumn | null> {
    const document = await KanbanColumnModel.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true }
    );
    
    return document ? KanbanColumnDbMapper.toDomain(document) : null;
  }

  async delete(id: string): Promise<boolean> {
    // Soft delete - marca como inativo
    const result = await KanbanColumnModel.findByIdAndUpdate(
      id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );
    
    return result !== null;
  }

  async reorder(teamId: string, positions: Array<{ id: string; position: number }>): Promise<boolean> {
    const bulkOps = positions.map(({ id, position }) => ({
      updateOne: {
        filter: { _id: id, teamId },
        update: { position, updatedAt: new Date() }
      }
    }));

    const result = await KanbanColumnModel.bulkWrite(bulkOps);
    return result.modifiedCount === positions.length;
  }

  async getNextPosition(teamId: string): Promise<number> {
    const lastColumn = await KanbanColumnModel
      .findOne({ teamId, isActive: true })
      .sort({ position: -1 });
    
    return lastColumn ? lastColumn.position + 1 : 0;
  }

  async createDefaultColumns(teamId: string): Promise<KanbanColumn[]> {
    const defaultColumns = [
      { name: 'Lead Recebido', key: 'LEAD_RECEBIDO', position: 0 },
      { name: 'Pré-qualificação', key: 'PRE_QUALIFICACAO', position: 1 },
      { name: 'Proposta Enviada', key: 'PROPOSTA_ENVIADA', position: 2 },
      { name: 'Documentação Recebida', key: 'DOCUMENTACAO_RECEBIDA', position: 3 },
      { name: 'Projeto Aprovado', key: 'PROJETO_APROVADO', position: 4 },
      { name: 'Instalação Agendada', key: 'INSTALACAO_AGENDADA', position: 5 },
      { name: 'Sistema Entregue', key: 'SISTEMA_ENTREGUE', position: 6 },
    ];

    const documents = await KanbanColumnModel.insertMany(
      defaultColumns.map(col => ({
        teamId,
        ...col,
        isDefault: true,
      }))
    );

    return documents.map(KanbanColumnDbMapper.toDomain);
  }
}
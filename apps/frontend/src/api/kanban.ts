import api from '../lib/api';
import { 
  KanbanColumn, 
  CreateKanbanColumnRequest, 
  UpdateKanbanColumnRequest, 
  ReorderColumnsRequest,
  KanbanColumnsListResponse,
  KanbanColumnResponse
} from '../types/kanban';

export const kanbanApi = {
  // Get columns for team
  getColumns: async (): Promise<KanbanColumn[]> => {
    const response = await api.get<KanbanColumnsListResponse>('/kanban/columns');
    return response.data.data;
  },

  // Create new column
  createColumn: async (data: CreateKanbanColumnRequest): Promise<KanbanColumn> => {
    const response = await api.post<KanbanColumnResponse>('/kanban/columns', data);
    return response.data.data;
  },

  // Update column
  updateColumn: async (id: string, data: UpdateKanbanColumnRequest): Promise<KanbanColumn> => {
    const response = await api.put<KanbanColumnResponse>(`/kanban/columns/${id}`, data);
    return response.data.data;
  },

  // Delete column
  deleteColumn: async (id: string): Promise<void> => {
    await api.delete(`/kanban/columns/${id}`);
  },

  // Reorder columns
  reorderColumns: async (data: ReorderColumnsRequest): Promise<void> => {
    await api.post('/kanban/columns/reorder', data);
  },
};
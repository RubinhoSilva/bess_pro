export interface KanbanColumn {
  id: string;
  teamId: string;
  name: string;
  key: string;
  position: number;
  color?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKanbanColumnRequest {
  name: string;
  key: string;
  position?: number;
  color?: string;
}

export interface UpdateKanbanColumnRequest {
  name?: string;
  position?: number;
  color?: string;
  isActive?: boolean;
}

export interface ReorderColumnsRequest {
  columns: Array<{
    id: string;
    position: number;
  }>;
}

export interface KanbanColumnResponse {
  success: boolean;
  data: KanbanColumn;
  timestamp: string;
}

export interface KanbanColumnsListResponse {
  success: boolean;
  data: KanbanColumn[];
  timestamp: string;
}
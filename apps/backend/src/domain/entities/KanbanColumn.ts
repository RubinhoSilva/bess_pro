export interface KanbanColumn {
  id: string;
  teamId: string;
  name: string;
  key: string; // chave única para identificar a coluna
  position: number; // ordem das colunas
  color?: string;
  isDefault: boolean; // se é uma coluna padrão do sistema
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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
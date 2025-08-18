import React, { useState } from 'react';
import { Plus, Settings, Edit2, Trash2, GripVertical } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '../ui/alert-dialog';
import { KanbanColumn, CreateKanbanColumnRequest, UpdateKanbanColumnRequest } from '../../types/kanban';
import { 
  useKanbanColumns, 
  useCreateKanbanColumn, 
  useUpdateKanbanColumn, 
  useDeleteKanbanColumn,
  useReorderKanbanColumns 
} from '../../hooks/kanban-hooks';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

interface ColumnManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ColumnManager: React.FC<ColumnManagerProps> = ({ isOpen, onClose }) => {
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null);
  const [deletingColumn, setDeleteingColumn] = useState<KanbanColumn | null>(null);
  const [newColumn, setNewColumn] = useState({ name: '', key: '', color: '' });

  const { data: columns = [], isLoading } = useKanbanColumns();
  const createColumnMutation = useCreateKanbanColumn();
  const updateColumnMutation = useUpdateKanbanColumn();
  const deleteColumnMutation = useDeleteKanbanColumn();
  const reorderMutation = useReorderKanbanColumns();

  const handleCreateColumn = async () => {
    if (!newColumn.name.trim() || !newColumn.key.trim()) return;

    const createData: CreateKanbanColumnRequest = {
      name: newColumn.name.trim(),
      key: newColumn.key.trim().toUpperCase().replace(/\s+/g, '_'),
      color: newColumn.color || undefined,
    };

    try {
      await createColumnMutation.mutateAsync(createData);
      setNewColumn({ name: '', key: '', color: '' });
      setIsCreateFormOpen(false);
    } catch (error) {
      // Error handled in mutation
    }
  };

  const handleUpdateColumn = async () => {
    if (!editingColumn) return;

    const updateData: UpdateKanbanColumnRequest = {
      name: editingColumn.name.trim(),
      color: editingColumn.color || undefined,
    };

    try {
      await updateColumnMutation.mutateAsync({ id: editingColumn.id, data: updateData });
      setEditingColumn(null);
    } catch (error) {
      // Error handled in mutation
    }
  };

  const handleDeleteColumn = async () => {
    if (!deletingColumn) return;

    try {
      await deleteColumnMutation.mutateAsync(deletingColumn.id);
      setDeleteingColumn(null);
    } catch (error) {
      // Error handled in mutation
    }
  };

  const handleReorderColumns = async (newOrder: KanbanColumn[]) => {
    const reorderData = {
      columns: newOrder.map((col, index) => ({
        id: col.id,
        position: index,
      })),
    };

    try {
      await reorderMutation.mutateAsync(reorderData);
    } catch (error) {
      // Error handled in mutation
    }
  };

  const generateKeyFromName = (name: string) => {
    return name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_');
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Gerenciar Colunas do Kanban
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Create Button */}
            <Button
              onClick={() => setIsCreateFormOpen(true)}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Nova Coluna
            </Button>

            {/* Columns List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando colunas...
                </div>
              ) : columns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma coluna encontrada
                </div>
              ) : (
                columns.map((column) => (
                  <div
                    key={column.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                      <div>
                        <h4 className="font-medium">{column.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Chave: {column.key}
                        </p>
                      </div>
                      {column.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          Padrão
                        </Badge>
                      )}
                      {column.color && (
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: column.color }}
                        />
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingColumn(column)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      {!column.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteingColumn(column)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Column Dialog */}
      <Dialog open={isCreateFormOpen} onOpenChange={setIsCreateFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Coluna</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome da Coluna</Label>
              <Input
                id="name"
                value={newColumn.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setNewColumn(prev => ({
                    ...prev,
                    name,
                    key: generateKeyFromName(name),
                  }));
                }}
                placeholder="Ex: Em Análise"
              />
            </div>
            <div>
              <Label htmlFor="key">Chave (gerada automaticamente)</Label>
              <Input
                id="key"
                value={newColumn.key}
                onChange={(e) => setNewColumn(prev => ({ ...prev, key: e.target.value }))}
                placeholder="Ex: EM_ANALISE"
              />
            </div>
            <div>
              <Label htmlFor="color">Cor (opcional)</Label>
              <Input
                id="color"
                type="color"
                value={newColumn.color}
                onChange={(e) => setNewColumn(prev => ({ ...prev, color: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateFormOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateColumn} disabled={createColumnMutation.isPending}>
                {createColumnMutation.isPending ? 'Criando...' : 'Criar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Column Dialog */}
      <Dialog open={!!editingColumn} onOpenChange={() => setEditingColumn(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Coluna</DialogTitle>
          </DialogHeader>
          {editingColumn && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nome da Coluna</Label>
                <Input
                  id="edit-name"
                  value={editingColumn.name}
                  onChange={(e) => setEditingColumn(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="Ex: Em Análise"
                />
              </div>
              <div>
                <Label htmlFor="edit-key">Chave (não editável)</Label>
                <Input
                  id="edit-key"
                  value={editingColumn.key}
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="edit-color">Cor (opcional)</Label>
                <Input
                  id="edit-color"
                  type="color"
                  value={editingColumn.color || ''}
                  onChange={(e) => setEditingColumn(prev => prev ? { ...prev, color: e.target.value } : null)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingColumn(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdateColumn} disabled={updateColumnMutation.isPending}>
                  {updateColumnMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingColumn} onOpenChange={() => setDeleteingColumn(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a coluna "{deletingColumn?.name}"?
              Esta ação não pode ser desfeita e todos os leads nesta coluna precisarão ser movidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteColumn}>
              {deleteColumnMutation.isPending ? 'Removendo...' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
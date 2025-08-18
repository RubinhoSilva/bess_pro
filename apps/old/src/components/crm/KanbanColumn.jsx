import React from 'react';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import KanbanCard from '@/components/crm/KanbanCard';

const columnColors = {
    'lead-recebido': 'bg-sky-900/30 border-sky-500/50',
    'pre-qualificacao': 'bg-blue-900/30 border-blue-500/50',
    'proposta-enviada': 'bg-indigo-900/30 border-indigo-500/50',
    'documentacao-recebida': 'bg-violet-900/30 border-violet-500/50',
    'projeto-aprovado': 'bg-purple-900/30 border-purple-500/50',
    'instalacao-agendada': 'bg-fuchsia-900/30 border-fuchsia-500/50',
    'sistema-entregue': 'bg-pink-900/30 border-pink-500/50',
};

const KanbanColumn = ({ column, onEditLead, onDeleteLead, onOpenAlert, onColorChange }) => {
    const { setNodeRef } = useSortable({ id: column.id, data: { type: 'Column' } });
    
    return (
        <div className="w-80 flex-shrink-0">
             <SortableContext id={column.id} items={column.leads.map(lead => lead.id)}>
                <div ref={setNodeRef} className={cn("rounded-lg p-2 border-t-4", columnColors[column.id])}>
                    <h3 className="font-semibold text-white mb-3 p-2">{column.title} ({column.leads.length})</h3>
                    <div className="min-h-[200px] space-y-2">
                        {column.leads.map(lead => (
                            <KanbanCard 
                                key={lead.id} 
                                lead={lead} 
                                onEditLead={onEditLead} 
                                onDeleteLead={onDeleteLead} 
                                onOpenAlert={onOpenAlert} 
                                onColorChange={onColorChange} 
                            />
                        ))}
                    </div>
                </div>
            </SortableContext>
        </div>
    );
}

export default KanbanColumn;
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { FileText, Phone, Edit, Trash2, MessageSquare, BellRing, Palette, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useProject } from '@/contexts/ProjectContext';

const KanbanCard = ({ lead, onEditLead, onDeleteLead, onOpenAlert, onColorChange, isOverlay = false }) => {
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id: lead.id, data: {type: 'Lead'} });
    const { toast } = useToast();
    const navigate = useNavigate();
    const { loadProjectByLead } = useProject();
    const style = { 
        transform: CSS.Transform.toString(transform), 
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging || isOverlay ? 10 : 'auto'
    };

    const handleActionClick = (e, action) => { e.stopPropagation(); action(); };
    
    const handleWhatsAppClick = (e) => {
        e.stopPropagation();
        if (lead.phone) {
            const phoneNumber = lead.phone.replace(/\D/g, '');
            window.open(`https://wa.me/55${phoneNumber}`, '_blank', 'noopener,noreferrer');
        } else {
            toast({ variant: 'destructive', title: 'Telefone não encontrado' });
        }
    };

    const handleProposalClick = (e) => {
        e.stopPropagation();
        toast({ title: 'Funcionalidade em desenvolvimento', description: "🚧 A geração de proposta será conectada ao módulo de dimensionamento." });
    };

    const handleDimensioningClick = async (e) => {
        e.stopPropagation();
        await loadProjectByLead(lead);
        navigate('/pv-design');
    };

    const cardBgColor = {
        yellow: 'bg-yellow-500/30',
        red: 'bg-red-500/30',
    }[lead.color_highlight] || 'bg-slate-700/70';

    if (isOverlay) {
        return (
             <Card className={cn("border-purple-500 text-white shadow-2xl scale-105", cardBgColor)}>
                <div className="cursor-grabbing">
                    <CardHeader className="p-3">
                        <CardTitle className="text-base text-purple-300">{lead.name}</CardTitle>
                    </CardHeader>
                </div>
            </Card>
        )
    }

    return (
        <div ref={setNodeRef} style={style}>
            <Card className={cn("border-slate-600 text-white relative", cardBgColor)}>
                <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                    <CardHeader className="p-3">
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-base text-purple-300">{lead.name}</CardTitle>
                            <div className="flex items-center -mr-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => e.stopPropagation()}>
                                            <Palette className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent onClick={(e) => e.stopPropagation()} className="bg-slate-800 border-slate-700 text-white">
                                        <DropdownMenuItem onClick={() => onColorChange(lead.id, 'yellow')}>
                                            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div> Amarelo (Atenção)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onColorChange(lead.id, 'red')}>
                                            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div> Vermelho (Urgente)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onColorChange(lead.id, null)}>
                                            Remover Cor
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => handleActionClick(e, () => onEditLead(lead))}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-400" onClick={(e) => handleActionClick(e, () => onDeleteLead(lead))}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <CardDescription className="text-slate-400">{lead.company || 'Pessoa Física'}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-2">
                        {lead.phone && <p className="text-xs flex items-center gap-2"><Phone className="w-3 h-3" /> {lead.phone}</p>}
                        <div className="flex gap-2 flex-wrap">
                            <Badge variant="secondary">{lead.client_type === 'A' ? 'Grupo A' : 'Grupo B'}</Badge>
                            {Array.isArray(lead.tags) && lead.tags.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
                        </div>
                    </CardContent>
                </div>
                <div className="p-3 pt-0">
                     <div className="grid grid-cols-2 gap-2 pt-2">
                        <Button size="sm" variant="outline" className="w-full text-xs" onClick={handleDimensioningClick}>
                            <Sun className="w-3 h-3 mr-1" /> Dimensionar
                        </Button>
                        <Button size="sm" variant="outline" className="w-full text-xs" onClick={handleProposalClick}>
                            <FileText className="w-3 h-3 mr-1" /> Proposta
                        </Button>
                        <Button size="sm" variant="outline" className="w-full text-xs" onClick={handleWhatsAppClick}>
                           <MessageSquare className="w-3 h-3 mr-1" /> WhatsApp
                        </Button>
                         <Button size="sm" variant="outline" className="w-full text-xs" onClick={(e) => handleActionClick(e, () => onOpenAlert(lead))}>
                           <BellRing className="w-4 h-4 text-yellow-400" /> Alerta
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default KanbanCard;
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { 
  Calendar, 
  CalendarDays,
  Clock,
  MapPin,
  User,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search
} from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

interface CalendarEvent {
  id: string;
  title: string;
  type: 'meeting' | 'site_visit' | 'follow_up' | 'deadline' | 'presentation';
  date: string;
  time: string;
  duration: number; // minutes
  location?: string;
  client?: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
}

const CalendarPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [selectedEventType, setSelectedEventType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock events data
  const events: CalendarEvent[] = [
    {
      id: '1',
      title: 'Visita técnica - Residencial Silva',
      type: 'site_visit',
      date: '2025-08-08',
      time: '09:00',
      duration: 120,
      location: 'Rua das Flores, 123, São Paulo',
      client: 'João Silva',
      description: 'Avaliação do local para instalação de sistema fotovoltaico 5kWp',
      priority: 'high'
    },
    {
      id: '2',
      title: 'Apresentação de proposta',
      type: 'presentation',
      date: '2025-08-08',
      time: '14:00',
      duration: 60,
      location: 'Escritório',
      client: 'Maria Santos',
      description: 'Apresentação de proposta comercial para sistema BESS',
      priority: 'medium'
    },
    {
      id: '3',
      title: 'Follow-up - Projeto Industrial',
      type: 'follow_up',
      date: '2025-08-09',
      time: '10:30',
      duration: 30,
      client: 'Indústria XYZ',
      description: 'Acompanhamento do projeto de 100kWp',
      priority: 'medium'
    },
    {
      id: '4',
      title: 'Reunião de alinhamento',
      type: 'meeting',
      date: '2025-08-09',
      time: '16:00',
      duration: 60,
      location: 'Sala de reuniões',
      description: 'Revisão dos projetos da semana com equipe',
      priority: 'low'
    },
    {
      id: '5',
      title: 'Entrega de documentação',
      type: 'deadline',
      date: '2025-08-10',
      time: '17:00',
      duration: 0,
      client: 'Construtora ABC',
      description: 'Prazo final para entrega dos documentos técnicos',
      priority: 'high'
    }
  ];

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-500 text-white';
      case 'site_visit': return 'bg-green-500 text-white';
      case 'follow_up': return 'bg-yellow-500 text-white';
      case 'deadline': return 'bg-red-500 text-white';
      case 'presentation': return 'bg-purple-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'meeting': return 'Reunião';
      case 'site_visit': return 'Visita Técnica';
      case 'follow_up': return 'Follow-up';
      case 'deadline': return 'Prazo';
      case 'presentation': return 'Apresentação';
      default: return type;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-500';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const filteredEvents = events.filter(event => {
    const matchesType = selectedEventType === 'all' || event.type === selectedEventType;
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const upcomingEvents = filteredEvents
    .filter(event => new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const todayEvents = filteredEvents.filter(event => {
    const today = new Date().toISOString().split('T')[0];
    return event.date === today;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          <p className="text-gray-600">Gerencie seus compromissos e prazos</p>
        </div>
        <div className="flex gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Evento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Evento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="text-center text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4" />
                  <p>Funcionalidade em desenvolvimento</p>
                  <p className="text-sm">Em breve você poderá criar e gerenciar eventos diretamente aqui.</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Today's Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            Hoje - {formatDate(new Date().toISOString().split('T')[0])}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayEvents.length > 0 ? (
            <div className="space-y-3">
              {todayEvents.map((event) => (
                <div key={event.id} className={`p-3 border-l-4 bg-gray-50 rounded ${getPriorityColor(event.priority)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`text-xs ${getEventTypeColor(event.type)}`}>
                          {getEventTypeLabel(event.type)}
                        </Badge>
                        <span className="text-sm font-medium">{event.title}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {event.time}
                        </span>
                        {event.client && (
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {event.client}
                          </span>
                        )}
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Calendar className="w-12 h-12 mx-auto mb-4" />
              <p>Nenhum evento agendado para hoje</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar eventos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10"
            />
          </div>
        </div>
        <Select value={selectedEventType} onValueChange={setSelectedEventType}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="meeting">Reuniões</SelectItem>
            <SelectItem value="site_visit">Visitas Técnicas</SelectItem>
            <SelectItem value="follow_up">Follow-ups</SelectItem>
            <SelectItem value="deadline">Prazos</SelectItem>
            <SelectItem value="presentation">Apresentações</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos Eventos</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className={`p-4 border-l-4 bg-white border rounded-lg shadow-sm ${getPriorityColor(event.priority)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${getEventTypeColor(event.type)}`}>
                        {getEventTypeLabel(event.type)}
                      </Badge>
                      <h3 className="font-medium">{event.title}</h3>
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDate(event.date)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {event.time} ({event.duration > 0 ? `${event.duration}min` : 'Todo dia'})
                    </div>
                    {event.client && (
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {event.client}
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </div>
                    )}
                  </div>
                  
                  {event.description && (
                    <p className="text-sm text-gray-600 mt-2">{event.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Calendar className="w-12 h-12 mx-auto mb-4" />
              <p>Nenhum evento encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calendar View Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Visualização do Calendário
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm">
                Agosto 2025
              </Button>
              <Button variant="outline" size="sm">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Calendário Interativo</h3>
            <p className="max-w-md mx-auto">
              A visualização em calendário estará disponível em breve, com funcionalidades de arrastar e soltar, visualizações mensais, semanais e diárias.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarPage;
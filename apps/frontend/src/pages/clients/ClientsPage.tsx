import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, MoreHorizontal, Users, Building, MapPin, Phone, Mail, Bell, RotateCcw } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { useClients, useDeleteClient, useRevertClientToLead } from '../../hooks/client-hooks';
import { ClientForm } from '../../components/clients/ClientForm';
import { Client, ClientStatus, ClientType } from '../../types/client';
import { useDebounce } from '../../hooks/use-debounce';
import AddClientAlertModal from '../../components/client-alerts/AddClientAlertModal';

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [alertClientId, setAlertClientId] = useState<string | null>(null);
  const [alertClientName, setAlertClientName] = useState<string>('');

  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  const { data: clientsData, isLoading, error } = useClients({
    page: currentPage,
    pageSize: 10,
    searchTerm: debouncedSearchTerm || undefined
  });

  const deleteClientMutation = useDeleteClient();
  const revertClientToLeadMutation = useRevertClientToLead();

  const handleDeleteClient = async (clientId: string) => {
    try {
      await deleteClientMutation.mutateAsync(clientId);
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  const handleRevertToLead = async (clientId: string) => {
    try {
      await revertClientToLeadMutation.mutateAsync(clientId);
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  const getStatusBadge = (status: ClientStatus) => {
    if (!status) {
    }
    
    const statusConfig = {
      [ClientStatus.ACTIVE]: { label: 'Ativo', variant: 'default' as const },
      [ClientStatus.INACTIVE]: { label: 'Inativo', variant: 'secondary' as const },
      [ClientStatus.POTENTIAL]: { label: 'Potencial', variant: 'outline' as const },
      [ClientStatus.BLOCKED]: { label: 'Bloqueado', variant: 'destructive' as const },
    };

    const config = statusConfig[status] || { label: 'Desconhecido', variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getClientTypeLabel = (type: ClientType) => {
    const typeLabels = {
      [ClientType.RESIDENTIAL]: 'Residencial',
      [ClientType.COMMERCIAL]: 'Comercial',
      [ClientType.INDUSTRIAL]: 'Industrial',
    };
    return typeLabels[type] || 'Não definido';
  };

  const extractLeadConversionInfo = (client: Client) => {
    if (!client.tags?.includes('convertido-de-lead') || !client.notes) {
      return null;
    }
    
    const match = client.notes.match(/Cliente convertido do lead em (\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2})/);
    return match ? match[1] : null;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Intl.DateTimeFormat('pt-BR').format(new Date(dateString));
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Erro ao carregar clientes</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Clientes
          </h1>
          <p className="text-muted-foreground">
            Gerencie sua base de clientes
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Cliente</DialogTitle>
              <DialogDescription>
                Preencha as informações do cliente
              </DialogDescription>
            </DialogHeader>
            <ClientForm 
              onSuccess={() => setIsCreateDialogOpen(false)} 
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Stats */}
      {clientsData && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clientsData.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(clientsData?.clients || []).filter(c => c.status === ClientStatus.ACTIVE).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  (clientsData?.clients || []).reduce((sum, client) => sum + client.totalProjectsValue, 0)
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Página</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentPage} de {clientsData.totalPages || 1}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Clients List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : clientsData && (clientsData.clients || []).length > 0 ? (
          <>
            {(clientsData.clients || []).map((client) => (
              <Card key={client.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="text-lg font-semibold">{client.name}</h3>
                          {client.company && (
                            <p className="text-sm text-muted-foreground flex items-center">
                              <Building className="mr-1 h-3 w-3" />
                              {client.company}
                            </p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          {getStatusBadge(client.status)}
                          <Badge variant="secondary">
                            {getClientTypeLabel(client.clientType)}
                          </Badge>
                          {client.tags?.includes('convertido-de-lead') && (
                            <Badge variant="outline" className="text-xs">
                              Convertido de Lead
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Mail className="mr-2 h-3 w-3" />
                          {client.email}
                        </div>
                        {client.phone && (
                          <div className="flex items-center">
                            <Phone className="mr-2 h-3 w-3" />
                            {client.phone}
                          </div>
                        )}
                        {(client.city || client.state) && (
                          <div className="flex items-center">
                            <MapPin className="mr-2 h-3 w-3" />
                            {[client.city, client.state].filter(Boolean).join(', ')}
                          </div>
                        )}
                        <div>
                          <strong>Projetos: {formatCurrency(client.totalProjectsValue)}</strong>
                        </div>
                      </div>

                      {(client.lastContactDate || client.nextFollowUpDate || extractLeadConversionInfo(client)) && (
                        <div className="flex space-x-4 text-xs text-muted-foreground">
                          {client.lastContactDate && (
                            <span>Último contato: {formatDate(client.lastContactDate)}</span>
                          )}
                          {client.nextFollowUpDate && (
                            <span>Próximo follow-up: {formatDate(client.nextFollowUpDate)}</span>
                          )}
                          {extractLeadConversionInfo(client) && (
                            <span className="text-blue-600">
                              Convertido em: {extractLeadConversionInfo(client)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingClient(client)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setAlertClientId(client.id);
                          setAlertClientName(client.name);
                        }}>
                          <Bell className="mr-2 h-4 w-4" />
                          Criar Alerta
                        </DropdownMenuItem>
                        {client.tags?.includes('convertido-de-lead') && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Reverter para Lead
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Reverter Cliente para Lead</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja reverter "{client.name}" para lead? Esta ação irá:
                                  <br />• Excluir o cliente
                                  <br />• Criar um novo lead com os dados do cliente
                                  <br />• Esta ação não pode ser desfeita
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleRevertToLead(client.id)}
                                  className="bg-orange-600 hover:bg-orange-700"
                                >
                                  Reverter para Lead
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Cliente</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o cliente "{client.name}"? 
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteClient(client.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Pagination */}
            {(clientsData?.totalPages || 0) > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Mostrando {(clientsData?.clients || []).length} de {clientsData?.total || 0} clientes
                </p>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= (clientsData?.totalPages || 1)}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm 
                  ? "Tente ajustar sua busca ou criar um novo cliente."
                  : "Comece criando seu primeiro cliente."}
              </p>
              {!searchTerm && (
                <Button 
                  className="mt-4" 
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Cliente
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingClient} onOpenChange={() => setEditingClient(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Atualize as informações do cliente
            </DialogDescription>
          </DialogHeader>
          {editingClient && (
            <ClientForm 
              client={editingClient}
              onSuccess={() => setEditingClient(null)} 
              onCancel={() => setEditingClient(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Client Alert Modal */}
      {alertClientId && (
        <AddClientAlertModal
          isOpen={!!alertClientId}
          onClose={() => {
            setAlertClientId(null);
            setAlertClientName('');
          }}
          clientId={alertClientId}
          clientName={alertClientName}
        />
      )}
    </div>
  );
}
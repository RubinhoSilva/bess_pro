import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Building2, Plus, Edit, Trash2, MoreVertical, Globe, Shield, MapPin, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { manufacturerService } from '@/services/ManufacturerService';
import { 
  Manufacturer,
  ManufacturerFilters,
  CreateManufacturerRequest
} from '@bess-pro/shared';

// Local definition to avoid export issues
enum ManufacturerType {
  SOLAR_MODULE = 'SOLAR_MODULE',
  INVERTER = 'INVERTER',
  BOTH = 'BOTH'
}
import toast from 'react-hot-toast';

interface ManufacturerFormData {
  name: string;
  type: ManufacturerType;
  description: string;
  website: string;
  country: string;
  logoUrl: string;
  supportEmail: string;
  supportPhone: string;
  certifications: string[];
}

const initialFormData: ManufacturerFormData = {
  name: '',
  type: ManufacturerType.BOTH,
  description: '',
  website: '',
  country: '',
  logoUrl: '',
  supportEmail: '',
  supportPhone: '',
  certifications: []
};

export function ManufacturerManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingManufacturer, setEditingManufacturer] = useState<Manufacturer | null>(null);
  const [formData, setFormData] = useState<ManufacturerFormData>(initialFormData);
  const [certificationsInput, setCertificationsInput] = useState('');
  
  // Estados para paginação e filtros
  const [filters, setFilters] = useState<ManufacturerFilters & {
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }>({
    page: 1,
    limit: 10,
    sortBy: 'name',
    sortOrder: 'asc'
  });
  const [searchTerm, setSearchTerm] = useState('');

  const queryClient = useQueryClient();
  
  const { data: manufacturersData, isLoading } = useQuery({
    queryKey: ['manufacturers', filters],
    queryFn: () => manufacturerService.getManufacturers(filters),
    staleTime: 15 * 60 * 1000,
  });
  
  const createMutation = useMutation({
    mutationFn: (data: CreateManufacturerRequest) => manufacturerService.createManufacturer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturers'] });
      toast.success('Fabricante criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar fabricante');
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateManufacturerRequest> }) => 
      manufacturerService.updateManufacturer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturers'] });
      toast.success('Fabricante atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar fabricante');
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: (id: string) => manufacturerService.deleteManufacturer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturers'] });
      toast.success('Fabricante excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao excluir fabricante');
    },
  });
  
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      manufacturerService.toggleManufacturerStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturers'] });
      toast.success('Status do fabricante atualizado!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar status');
    },
  });

  const handleOpenDialog = (manufacturer?: Manufacturer) => {
    if (manufacturer) {
      if (manufacturer.isPublic) {
        toast.error('Fabricantes padrão não podem ser editados');
        return;
      }
      setEditingManufacturer(manufacturer);
      setFormData({
        name: manufacturer.name,
        type: manufacturer.type as any,
        description: manufacturer.description || '',
        website: manufacturer.website || '',
        country: manufacturer.contact.address?.country || '',
        logoUrl: manufacturer.metadata.logoUrl || '',
        supportEmail: manufacturer.contact.supportEmail || '',
        supportPhone: manufacturer.contact.supportPhone || '',
        certifications: manufacturer.certifications || []
      });
      setCertificationsInput((manufacturer.certifications || []).join(', '));
    } else {
      setEditingManufacturer(null);
      setFormData(initialFormData);
      setCertificationsInput('');
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingManufacturer(null);
    setFormData(initialFormData);
    setCertificationsInput('');
  };

  const handleFormChange = (field: keyof ManufacturerFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCertificationsChange = (value: string) => {
    setCertificationsInput(value);
    const certifications = value.split(',').map(cert => cert.trim()).filter(cert => cert.length > 0);
    setFormData(prev => ({ ...prev, certifications }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Nome do fabricante é obrigatório');
      return;
    }

    try {
      const submitData: any = {
        name: formData.name.trim(),
        type: formData.type,
        description: formData.description.trim() || undefined,
        website: formData.website.trim() || undefined,
        country: formData.country.trim() || undefined,
        logoUrl: formData.logoUrl.trim() || undefined,
        supportEmail: formData.supportEmail.trim() || undefined,
        supportPhone: formData.supportPhone.trim() || undefined,
        certifications: formData.certifications.length > 0 ? formData.certifications : undefined,
        isActive: true
      };

      if (editingManufacturer) {
        await updateMutation.mutateAsync({ id: editingManufacturer.id, data: submitData });
      } else {
        await createMutation.mutateAsync(submitData);
      }

      handleCloseDialog();
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  };

  const handleDelete = async (manufacturer: Manufacturer) => {
    if (manufacturer.isPublic) {
      toast.error('Fabricantes padrão não podem ser removidos');
      return;
    }

    if (confirm(`Tem certeza que deseja remover o fabricante "${manufacturer.name}"?`)) {
      try {
        await deleteMutation.mutateAsync(manufacturer.id);
        toast.success('Fabricante removido com sucesso!');
      } catch (error) {
        // Error handling is done in the mutation hook
      }
    }
  };

  // Funções para manipular filtros e paginação
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters((prev: any) => ({
      ...prev,
      search: value || undefined,
      page: 1 // Reset para primeira página ao buscar
    }));
  };

  const handleTypeFilter = (type: ManufacturerType | 'ALL') => {
    // Type filter não está disponível em ManufacturerFilters ainda
    // TODO: Adicionar type filter ao shared types
    setFilters((prev: any) => ({
      ...prev,
      page: 1
    }));
  };

  const handleSort = (sortBy: string) => {
    setFilters((prev: any) => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev: any) => ({
      ...prev,
      page
    }));
  };

  const handleLimitChange = (limit: number) => {
    setFilters((prev: any) => ({
      ...prev,
      limit,
      page: 1 // Reset para primeira página ao mudar limite
    }));
  };

  const getTypeLabel = (type: ManufacturerType) => {
    switch (type) {
      case ManufacturerType.SOLAR_MODULE:
        return 'Módulos Solares';
      case ManufacturerType.INVERTER:
        return 'Inversores';
      case ManufacturerType.BOTH:
        return 'Ambos';
      default:
        return type;
    }
  };

  const getTypeBadgeVariant = (type: ManufacturerType) => {
    switch (type) {
      case ManufacturerType.SOLAR_MODULE:
        return 'default';
      case ManufacturerType.INVERTER:
        return 'secondary';
      case ManufacturerType.BOTH:
        return 'outline';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return <div className="p-6">Carregando fabricantes...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Fabricantes
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Fabricante
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingManufacturer ? 'Editar Fabricante' : 'Novo Fabricante'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    placeholder="Ex: Canadian Solar"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Tipo *</Label>
                  <Select value={formData.type} onValueChange={(value) => handleFormChange('type', value as ManufacturerType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ManufacturerType.SOLAR_MODULE}>Módulos Solares</SelectItem>
                      <SelectItem value={ManufacturerType.INVERTER}>Inversores</SelectItem>
                      <SelectItem value={ManufacturerType.BOTH}>Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="Descrição do fabricante..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleFormChange('website', e.target.value)}
                    placeholder="https://www.exemplo.com"
                  />
                </div>
                <div>
                  <Label htmlFor="country">País</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleFormChange('country', e.target.value)}
                    placeholder="Ex: Canadá"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="logoUrl">URL do Logo</Label>
                <Input
                  id="logoUrl"
                  type="url"
                  value={formData.logoUrl}
                  onChange={(e) => handleFormChange('logoUrl', e.target.value)}
                  placeholder="https://www.exemplo.com/logo.png"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supportEmail">Email de Suporte</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={formData.supportEmail}
                    onChange={(e) => handleFormChange('supportEmail', e.target.value)}
                    placeholder="suporte@exemplo.com"
                  />
                </div>
                <div>
                  <Label htmlFor="supportPhone">Telefone de Suporte</Label>
                  <Input
                    id="supportPhone"
                    value={formData.supportPhone}
                    onChange={(e) => handleFormChange('supportPhone', e.target.value)}
                    placeholder="+55 11 99999-9999"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="certifications">Certificações (separadas por vírgula)</Label>
                <Input
                  id="certifications"
                  value={certificationsInput}
                  onChange={(e) => handleCertificationsChange(e.target.value)}
                  placeholder="IEC61215, IEC61730, UL1703"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingManufacturer ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {/* Filtros e Busca */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar fabricantes..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value="ALL" onValueChange={() => {}} disabled>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os tipos</SelectItem>
                <SelectItem value={ManufacturerType.SOLAR_MODULE}>Módulos Solares</SelectItem>
                <SelectItem value={ManufacturerType.INVERTER}>Inversores</SelectItem>
                <SelectItem value={ManufacturerType.BOTH}>Ambos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.limit?.toString() || '10'} onValueChange={(value) => handleLimitChange(parseInt(value))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('name')}
              >
                Nome
                {filters.sortBy === 'name' && (
                  <span className="ml-1">{filters.sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('type')}
              >
                Tipo
                {filters.sortBy === 'type' && (
                  <span className="ml-1">{filters.sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('country')}
              >
                País
                {filters.sortBy === 'country' && (
                  <span className="ml-1">{filters.sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {manufacturersData?.manufacturers?.map((manufacturer: any) => (
              <TableRow key={manufacturer.id}>
                 <TableCell>
                   <div className="flex items-center gap-2">
                     {manufacturer.metadata.logoUrl && (
                       <img 
                         src={manufacturer.metadata.logoUrl} 
                         alt={manufacturer.name}
                         className="w-6 h-6 object-contain"
                         onError={(e) => {
                           (e.target as HTMLImageElement).style.display = 'none';
                         }}
                       />
                     )}
                     <div>
                       <div className="font-medium">{manufacturer.name}</div>
                       {manufacturer.website && (
                         <div className="text-sm text-muted-foreground flex items-center gap-1">
                           <Globe className="w-3 h-3" />
                           <a 
                             href={manufacturer.website} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="hover:underline"
                           >
                             {manufacturer.website.replace(/^https?:\/\//, '')}
                           </a>
                         </div>
                       )}
                     </div>
                   </div>
                 </TableCell>
                <TableCell>
                  <Badge variant={getTypeBadgeVariant(manufacturer.type) as any}>
                    {getTypeLabel(manufacturer.type)}
                  </Badge>
                </TableCell>
                 <TableCell>
                   {manufacturer.contact.address?.country && (
                     <div className="flex items-center gap-1">
                       <MapPin className="w-3 h-3" />
                       {manufacturer.contact.address.country}
                     </div>
                   )}
                 </TableCell>
                <TableCell>
                  {manufacturer.isPublic && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Padrão
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!manufacturer.isPublic && (
                        <DropdownMenuItem onClick={() => handleOpenDialog(manufacturer)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                      )}
                      {!manufacturer.isPublic && (
                        <DropdownMenuItem 
                          onClick={() => handleDelete(manufacturer)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remover
                        </DropdownMenuItem>
                      )}
                      {manufacturer.isPublic && (
                        <DropdownMenuItem disabled>
                          <Shield className="w-4 h-4 mr-2" />
                          Fabricante Padrão
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* Controles de Paginação */}
        {manufacturersData?.pagination && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Mostrando {((manufacturersData.pagination.page - 1) * manufacturersData.pagination.limit) + 1} a{' '}
              {Math.min(manufacturersData.pagination.page * manufacturersData.pagination.limit, manufacturersData.pagination.total)} de{' '}
              {manufacturersData.pagination.total} fabricantes
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(manufacturersData.pagination.page - 1)}
                disabled={!manufacturersData.pagination.hasPrev}
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, manufacturersData.pagination.totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(
                    manufacturersData.pagination.totalPages - 4,
                    manufacturersData.pagination.page - 2
                  )) + i;
                  
                  if (pageNum > manufacturersData.pagination.totalPages) return null;
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === manufacturersData.pagination.page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(manufacturersData.pagination.page + 1)}
                disabled={!manufacturersData.pagination.hasNext}
              >
                Próximo
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
        
        {!manufacturersData?.manufacturers || manufacturersData.manufacturers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum fabricante encontrado</p>
            <p className="text-sm">Clique em "Novo Fabricante" para adicionar o primeiro</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
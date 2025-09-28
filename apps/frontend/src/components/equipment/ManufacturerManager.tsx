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
import { Building2, Plus, Edit, Trash2, MoreVertical, Globe, Shield, MapPin } from 'lucide-react';
import { 
  useManufacturers, 
  useCreateManufacturer, 
  useUpdateManufacturer, 
  useDeleteManufacturer,
  ManufacturerType,
  ManufacturerInput,
  Manufacturer 
} from '@/hooks/equipment-hooks';
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

  const { data: manufacturers, isLoading } = useManufacturers();
  const createMutation = useCreateManufacturer();
  const updateMutation = useUpdateManufacturer();
  const deleteMutation = useDeleteManufacturer();

  const handleOpenDialog = (manufacturer?: Manufacturer) => {
    if (manufacturer) {
      if (manufacturer.isDefault) {
        toast.error('Fabricantes padrão não podem ser editados');
        return;
      }
      setEditingManufacturer(manufacturer);
      setFormData({
        name: manufacturer.name,
        type: manufacturer.type,
        description: manufacturer.description || '',
        website: manufacturer.website || '',
        country: manufacturer.country || '',
        logoUrl: manufacturer.logoUrl || '',
        supportEmail: manufacturer.supportEmail || '',
        supportPhone: manufacturer.supportPhone || '',
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
      const submitData: ManufacturerInput = {
        name: formData.name.trim(),
        type: formData.type,
        description: formData.description.trim() || undefined,
        website: formData.website.trim() || undefined,
        country: formData.country.trim() || undefined,
        logoUrl: formData.logoUrl.trim() || undefined,
        supportEmail: formData.supportEmail.trim() || undefined,
        supportPhone: formData.supportPhone.trim() || undefined,
        certifications: formData.certifications.length > 0 ? formData.certifications : undefined
      };

      if (editingManufacturer) {
        await updateMutation.mutateAsync({ id: editingManufacturer.id, ...submitData });
      } else {
        await createMutation.mutateAsync(submitData);
      }

      handleCloseDialog();
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  };

  const handleDelete = async (manufacturer: Manufacturer) => {
    if (manufacturer.isDefault) {
      toast.error('Fabricantes padrão não podem ser removidos');
      return;
    }

    if (confirm(`Tem certeza que deseja remover o fabricante "${manufacturer.name}"?`)) {
      try {
        await deleteMutation.mutateAsync(manufacturer.id);
      } catch (error) {
        // Error handling is done in the mutation hook
      }
    }
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>País</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {manufacturers?.map((manufacturer) => (
              <TableRow key={manufacturer.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {manufacturer.logoUrl && (
                      <img 
                        src={manufacturer.logoUrl} 
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
                  {manufacturer.country && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {manufacturer.country}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {manufacturer.isDefault && (
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
                      {!manufacturer.isDefault && (
                        <DropdownMenuItem onClick={() => handleOpenDialog(manufacturer)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                      )}
                      {!manufacturer.isDefault && (
                        <DropdownMenuItem 
                          onClick={() => handleDelete(manufacturer)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remover
                        </DropdownMenuItem>
                      )}
                      {manufacturer.isDefault && (
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
        
        {!manufacturers || manufacturers.length === 0 && (
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
/**
 * Company Profile Management Page
 */

import React, { useState } from 'react';
import { CompanyProfileForm } from '../../components/company-profile/CompanyProfileForm';
import { useMyCompanyProfile, useCreateCompanyProfile, useUpdateMyCompanyProfile } from '../../hooks/company-profile-hooks';
import { CompanyProfile, CreateCompanyProfileRequest, UpdateCompanyProfileRequest } from '@bess-pro/shared';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Building2, Edit, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';

type ViewMode = 'view' | 'create' | 'edit';

function CompanyProfileManagementPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('view');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // NOVO: Buscar CompanyProfile do Team atual
  const { data: companyProfile, isLoading, error } = useMyCompanyProfile();
  
  // ATUALIZADO: Hooks multi-tenant
  const createMutation = useCreateCompanyProfile();
  const updateMutation = useUpdateMyCompanyProfile();

  // NOVO: Verificar se CompanyProfile existe
  const hasCompanyProfile = !!companyProfile;

  const handleCreate = () => {
    setViewMode('create');
    setIsDialogOpen(true);
  };

  const handleEdit = () => {
    setViewMode('edit');
    setIsDialogOpen(true);
  };


  const handleSubmit = async (data: CreateCompanyProfileRequest | UpdateCompanyProfileRequest) => {
    try {
      if (viewMode === 'create' || !hasCompanyProfile) {
        await createMutation.mutateAsync(data as CreateCompanyProfileRequest);
        toast.success('Empresa criada com sucesso!');
      } else {
        await updateMutation.mutateAsync(data as UpdateCompanyProfileRequest);
        toast.success('Empresa atualizada com sucesso!');
      }
      
      setIsDialogOpen(false);
      setViewMode('view');
    } catch (error) {
      toast.error(
        viewMode === 'create'
          ? 'Erro ao criar empresa. Tente novamente.'
          : 'Erro ao atualizar empresa. Tente novamente.'
      );
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setViewMode('view');
  };

  const isMutationLoading = createMutation.isPending || updateMutation.isPending;

  // NOVO: Renderização condicional baseada na existência do CompanyProfile
  if (isLoading) return <div>Carregando...</div>;
  
  if (error) return <div>Erro ao carregar dados da empresa</div>;

  return (
    <div className="container mx-auto py-6">
      {hasCompanyProfile ? (
        // View mode: mostrar dados da empresa + botões de ação
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Perfil da Empresa</h1>
            <div className="flex gap-2">
              <Button onClick={handleEdit} variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {companyProfile.companyName}
              </CardTitle>
              <div className="flex gap-2">
                <Badge variant={companyProfile.isActive ? 'default' : 'secondary'}>
                  {companyProfile.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Nome Fantasia</h3>
                  <p>{companyProfile.tradingName || 'Não informado'}</p>
                </div>
                <div>
                  <h3 className="font-semibold">CNPJ</h3>
                  <p>{companyProfile.taxId || 'Não informado'}</p>
                </div>
                <div>
                  <h3 className="font-semibold">E-mail</h3>
                  <p>{companyProfile.email || 'Não informado'}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Telefone</h3>
                  <p>{companyProfile.phone || 'Não informado'}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Website</h3>
                  <p>{companyProfile.website || 'Não informado'}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Endereço</h3>
                  <p>{companyProfile.address || 'Não informado'}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Cidade</h3>
                  <p>{companyProfile.city || 'Não informado'}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Estado</h3>
                  <p>{companyProfile.state || 'Não informado'}</p>
                </div>
                <div>
                  <h3 className="font-semibold">CEP</h3>
                  <p>{companyProfile.zipCode || 'Não informado'}</p>
                </div>
                <div>
                  <h3 className="font-semibold">País</h3>
                  <p>{companyProfile.country || 'Não informado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Create mode: mostrar formulário vazio
        <div className="space-y-6">
          <CompanyProfileForm
            onSubmit={handleSubmit}
            isLoading={isMutationLoading}
            mode="create"
          />
        </div>
      )}

      {/* Dialog para edição */}
      {hasCompanyProfile && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Empresa</DialogTitle>
            </DialogHeader>
            <CompanyProfileForm
              initialData={companyProfile}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={isMutationLoading}
              mode="edit"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default CompanyProfileManagementPage;
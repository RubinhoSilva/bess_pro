/**
 * Company Profile Form Component
 */

import React, { useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, UploadCloud, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Progress } from '../ui/progress';
import { Upload, X, Building2, Mail, Phone, Globe, MapPin, Calendar, Briefcase } from 'lucide-react';
import {
  CompanyProfile,
  CompanyProfileResponse,
  CreateCompanyProfileRequest,
  UpdateCompanyProfileRequest,
  CompanyProfileStatus
} from '@bess-pro/shared';
import { useCompanyProfileForm, useUploadMyCompanyLogo, useMyCompanyProfile, useDeleteMyCompanyLogo, useLogoUpload } from '../../hooks/company-profile-hooks';

// Schema de validação
const companyProfileSchema = z.object({
  companyName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  tradingName: z.string().optional(),
  taxId: z.string().min(14, 'CNPJ é obrigatório'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().optional(),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  address: z.string().min(1, 'Rua é obrigatória').optional(),
  city: z.string().min(1, 'Cidade é obrigatória').optional(),
  state: z.string().min(2, 'Estado é obrigatório').optional(),
  zipCode: z.string().min(8, 'CEP é obrigatório').optional(),
  country: z.string().optional(),
  sector: z.string().optional(),
  companySize: z.string().optional(),
  foundedYear: z.string().regex(/^\d{4}$/, 'Ano deve ter 4 dígitos').optional(),
  description: z.string().optional(),
  linkedin: z.string().url('URL inválida').optional().or(z.literal('')),
  facebook: z.string().url('URL inválida').optional().or(z.literal('')),
  instagram: z.string().url('URL inválida').optional().or(z.literal('')),
  twitter: z.string().url('URL inválida').optional().or(z.literal('')),
  // Novos campos para proposta
  mission: z.string().max(500, 'Máximo de 500 caracteres').optional(),
  completedProjectsCount: z.string().max(50, 'Máximo de 50 caracteres').optional(),
  totalInstalledPower: z.string().max(50, 'Máximo de 50 caracteres').optional(),
  satisfiedClientsCount: z.string().max(50, 'Máximo de 50 caracteres').optional(),
  companyNotes: z.string().max(500, 'Máximo de 500 caracteres').optional(),
});

type CompanyProfileFormData = z.infer<typeof companyProfileSchema>;

interface CompanyProfileFormProps {
  initialData?: Partial<CompanyProfile | CompanyProfileResponse>;
  onSubmit: (data: CreateCompanyProfileRequest | UpdateCompanyProfileRequest) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

const COMPANY_SECTORS = [
  'Tecnologia',
  'Energia',
  'Construção Civil',
  'Manufatura',
  'Serviços',
  'Comércio',
  'Agricultura',
  'Saúde',
  'Educação',
  'Outros'
];

const COMPANY_SIZES = [
  'Microempresa',
  'Pequena',
  'Média',
  'Grande'
];

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export function CompanyProfileForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  mode
}: CompanyProfileFormProps) {
  const { formData, updateField, updateNestedField, validate, errors } = useCompanyProfileForm(initialData);
  const uploadLogo = useUploadMyCompanyLogo();
  const deleteLogo = useDeleteMyCompanyLogo();
  const { data: currentProfile } = useMyCompanyProfile();
  
  // Hook personalizado para gerenciar upload com preview e progresso
  const {
    previewUrl,
    selectedFile,
    uploadProgress,
    isUploading,
    handleFileSelect,
    handleUpload,
    clearPreview,
    hasPreview,
  } = useLogoUpload();

  // Configuração do dropzone
  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxSize: 2 * 1024 * 1024, // 2MB
    maxFiles: 1,
    onDrop: useCallback((acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        handleFileSelect(acceptedFiles[0]);
      }
    }, [handleFileSelect]),
    disabled: isUploading,
  });

  const form = useForm<CompanyProfileFormData>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      companyName: initialData?.companyName || '',
      tradingName: initialData?.tradingName || '',
      taxId: initialData?.taxId || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      website: initialData?.website || '',
      address: initialData?.address || '',
      city: initialData?.city || '',
      state: initialData?.state || '',
      zipCode: initialData?.zipCode || '',
      country: initialData?.country || 'Brasil',
      sector: (initialData as any)?.sector || '',
      companySize: (initialData as any)?.companySize || '',
      foundedYear: (initialData as any)?.foundedYear || '',
      description: (initialData as any)?.description || '',
      linkedin: (initialData as any)?.linkedin || '',
      facebook: (initialData as any)?.facebook || '',
      instagram: (initialData as any)?.instagram || '',
      twitter: (initialData as any)?.twitter || '',
      // Novos campos para proposta
      mission: (initialData as any)?.mission || '',
      completedProjectsCount: (initialData as any)?.completedProjectsCount || '',
      totalInstalledPower: (initialData as any)?.totalInstalledPower || '',
      satisfiedClientsCount: (initialData as any)?.satisfiedClientsCount || '',
      companyNotes: (initialData as any)?.companyNotes || '',
    },
  });

  const handleSubmit = (data: CompanyProfileFormData) => {
    if (validate()) {
      // Mapear dados do formulário para o formato esperado pelo backend
      // teamId é adicionado automaticamente pelo backend a partir do token
      const mappedData = {
        companyName: data.companyName,
        tradingName: data.tradingName,
        taxId: data.taxId,
        email: data.email,
        phone: data.phone,
        website: data.website || undefined, // Enviar undefined se vazio
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country,
        sector: data.sector,
        companySize: data.companySize,
        foundedYear: data.foundedYear,
        description: data.description,
        linkedin: data.linkedin || undefined,
        facebook: data.facebook || undefined,
        instagram: data.instagram || undefined,
        twitter: data.twitter || undefined,
        // Novos campos para proposta
        mission: data.mission || undefined,
        completedProjectsCount: data.completedProjectsCount || undefined,
        totalInstalledPower: data.totalInstalledPower || undefined,
        satisfiedClientsCount: data.satisfiedClientsCount || undefined,
        companyNotes: data.companyNotes || undefined,
        // REMOVIDO: teamId (vem do token automaticamente)
      };
      onSubmit(mappedData);
    }
  };

  const handleConfirmUpload = async () => {
    await handleUpload();
  };

  const handleCancelUpload = () => {
    clearPreview();
  };

  const handleRemoveLogo = async () => {
    try {
      await deleteLogo.mutateAsync();
      toast.success('Logo removido com sucesso!');
    } catch (error) {
      console.error('Erro ao remover logo:', error);
    }
  };

  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
      .slice(0, 18);
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
      .slice(0, 15);
  };

  const formatCEP = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d{3})/, '$1-$2')
      .slice(0, 9);
  };

  // Memoizar o src do Avatar para evitar re-renders desnecessários
  const avatarSrc = useMemo(() => {
    if (hasPreview) {
      return previewUrl || undefined;
    }
    
    const logoUrl = currentProfile?.logoUrl || initialData?.logoUrl;
    return logoUrl?.startsWith('http') ? logoUrl : undefined;
  }, [hasPreview, previewUrl, currentProfile?.logoUrl, initialData?.logoUrl]);

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
              <TabsTrigger value="address">Endereço</TabsTrigger>
              <TabsTrigger value="business">Informações Comerciais</TabsTrigger>
              <TabsTrigger value="proposal">Informações para Proposta</TabsTrigger>
              <TabsTrigger value="social">Redes Sociais</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Informações Básicas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Empresa *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nome completo da empresa"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                updateField('companyName', e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tradingName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Fantasia</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nome fantasia (opcional)"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                updateField('tradingName', e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="taxId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CNPJ *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="00.000.000/0000-00"
                              value={formatCNPJ(field.value)}
                              onChange={(e) => {
                                const formatted = formatCNPJ(e.target.value);
                                field.onChange(formatted);
                                updateField('taxId', formatted);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail *</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="empresa@exemplo.com"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                updateField('email', e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="(00) 00000-0000"
                              value={formatPhone(field.value || '')}
                              onChange={(e) => {
                                const formatted = formatPhone(e.target.value);
                                field.onChange(formatted);
                                updateField('phone', formatted);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://www.exemplo.com"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                updateField('website', e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Logo Upload com Drag & Drop e Preview */}
                  <div className="space-y-2">
                    <FormLabel>Logo da Empresa</FormLabel>
                    
                    {/* Área de Drag & Drop */}
                    <div
                      {...getRootProps()}
                      className={`
                        relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                        ${isDragActive
                          ? isDragAccept
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                            : 'border-red-500 bg-red-50 dark:bg-red-950/20'
                          : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                        }
                        ${isUploading ? 'cursor-not-allowed opacity-60' : ''}
                      `}
                      tabIndex={0}
                      role="button"
                      aria-label="Arraste uma imagem aqui ou clique para selecionar"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          document.getElementById('logo-upload-input')?.click();
                        }
                      }}
                    >
                      <input {...getInputProps()} id="logo-upload-input" />
                      
                      <div className="flex flex-col items-center space-y-4">
                        {/* Avatar com Preview ou Logo Atual */}
                        <div className="relative">
                          <Avatar className="h-24 w-24">
                            <AvatarImage
                              src={avatarSrc}
                              alt="Logo da Empresa"
                            />
                            <AvatarFallback>
                              <Building2 className="h-12 w-12" />
                            </AvatarFallback>
                          </Avatar>
                          
                          {/* Overlay de Loading durante upload */}
                          {isUploading && (
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                              <Loader2 className="h-8 w-8 text-white animate-spin" />
                            </div>
                          )}
                        </div>
                        
                        {/* Texto de instrução */}
                        <div className="space-y-2">
                          {isDragActive ? (
                            <p className="text-sm font-medium">
                              {isDragAccept ? 'Solte a imagem aqui' : 'Arquivo não suportado'}
                            </p>
                          ) : (
                            <>
                              <div className="flex items-center justify-center space-x-2">
                                <UploadCloud className="h-5 w-5 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                  Arraste sua imagem ou clique para selecionar
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Formatos: JPG, PNG, GIF, WebP • Tamanho máximo: 2MB
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Barra de Progresso durante Upload */}
                    {isUploading && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Enviando...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                      </div>
                    )}

                    {/* Botões de Confirmação/Cancelamento quando há preview */}
                    {hasPreview && !isUploading && (
                      <div className="flex items-center gap-2 justify-center">
                        <Button
                          type="button"
                          onClick={handleConfirmUpload}
                          disabled={isUploading}
                          size="sm"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Confirmar Upload
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancelUpload}
                          disabled={isUploading}
                          size="sm"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancelar
                        </Button>
                      </div>
                    )}

                    {/* Botão para remover logo existente */}
                    {(currentProfile?.logoUrl || initialData?.logoUrl) && !hasPreview && (
                      <div className="flex justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveLogo}
                          disabled={deleteLogo.isPending || isUploading}
                        >
                          {deleteLogo.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Removendo...
                            </>
                          ) : (
                            <>
                              <X className="h-4 w-4 mr-2" />
                              Remover Logo Atual
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="address" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Endereço
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Endereço *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nome da rua, número, complemento, bairro"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                updateField('address', e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Campos de endereço removidos - agora usando campo único de address */}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Campos de endereço removidos - agora usando campo único de address */}

                    {/* Campos de endereço removidos - agora usando campo único de address */}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Cidade"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                updateField('city', e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado *</FormLabel>
                          <Select onValueChange={(value) => {
                            field.onChange(value);
                            updateField('state', value);
                          }} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o estado" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {BRAZILIAN_STATES.map((state) => (
                                <SelectItem key={state} value={state}>
                                  {state}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CEP *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="00000-000"
                              value={formatCEP(field.value || '')}
                              onChange={(e) => {
                                const formatted = formatCEP(e.target.value);
                                field.onChange(formatted);
                                updateField('zipCode', formatted);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>País</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="País"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                updateField('country', e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="business" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Informações Comerciais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sector"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Setor</FormLabel>
                          <Select onValueChange={(value) => {
                            field.onChange(value);
                            updateField('sector', value);
                          }} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o setor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {COMPANY_SECTORS.map((sector) => (
                                <SelectItem key={sector} value={sector}>
                                  {sector}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companySize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Porte</FormLabel>
                          <Select onValueChange={(value) => {
                            field.onChange(value);
                            updateField('companySize', value);
                          }} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o porte" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {COMPANY_SIZES.map((size) => (
                                <SelectItem key={size} value={size}>
                                  {size}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descreva as atividades da empresa..."
                            rows={4}
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              updateField('description', e.target.value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="proposal" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Informações para Proposta
                  </CardTitle>
                  <p className="text-sm text-gray-500">
                    Essas informações serão automaticamente incluídas nas propostas comerciais geradas pelo sistema.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="mission"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Missão da Empresa</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Ex: Fornecer soluções sustentáveis em energia solar com excelência técnica..."
                              rows={3}
                              maxLength={500}
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                updateField('mission', e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="foundedYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ano de Fundação</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Ex: 2015"
                              min="1800"
                              max={new Date().getFullYear()}
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || /^\d{0,4}$/.test(value)) {
                                  field.onChange(value);
                                  updateField('foundedYear', value);
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="completedProjectsCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Projetos Concluídos</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: 150 projetos ou Mais de 200"
                              maxLength={50}
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                updateField('completedProjectsCount', e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="totalInstalledPower"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Potência Total Instalada</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: 50 MWp ou 5.000 kWp"
                              maxLength={50}
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                updateField('totalInstalledPower', e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="satisfiedClientsCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Clientes Satisfeitos</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: 300 clientes ou Mais de 500"
                              maxLength={50}
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                updateField('satisfiedClientsCount', e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companyNotes"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Observações Adicionais</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Informações adicionais sobre a empresa que deseja incluir nas propostas..."
                              rows={3}
                              maxLength={500}
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                updateField('companyNotes', e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="social" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Redes Sociais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="linkedin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>LinkedIn</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://linkedin.com/company/..."
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                updateField('linkedin', e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="facebook"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Facebook</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://facebook.com/..."
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                updateField('facebook', e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="instagram"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instagram</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://instagram.com/..."
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                updateField('instagram', e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="twitter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Twitter</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://twitter.com/..."
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                updateField('twitter', e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
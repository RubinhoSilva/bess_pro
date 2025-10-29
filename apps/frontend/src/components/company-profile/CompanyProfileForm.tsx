/**
 * Company Profile Form Component
 */

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Upload, X, Building2, Mail, Phone, Globe, MapPin, Calendar, Briefcase } from 'lucide-react';
import {
  CompanyProfile,
  CompanyProfileResponse,
  CreateCompanyProfileRequest,
  UpdateCompanyProfileRequest,
  CompanyProfileStatus
} from '@bess-pro/shared';
import { useCompanyProfileForm } from '../../hooks/company-profile-hooks';

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
  foundedYear: z.number().min(1800).max(new Date().getFullYear()).optional(),
  description: z.string().optional(),
  linkedin: z.string().url('URL inválida').optional().or(z.literal('')),
  facebook: z.string().url('URL inválida').optional().or(z.literal('')),
  instagram: z.string().url('URL inválida').optional().or(z.literal('')),
  twitter: z.string().url('URL inválida').optional().or(z.literal('')),
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
      foundedYear: (initialData as any)?.foundedYear,
      description: (initialData as any)?.description || '',
      linkedin: (initialData as any)?.linkedin || '',
      facebook: (initialData as any)?.facebook || '',
      instagram: (initialData as any)?.instagram || '',
      twitter: (initialData as any)?.twitter || '',
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
        // REMOVIDO: teamId (vem do token automaticamente)
      };
      onSubmit(mappedData);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // TODO: Implementar upload do logo
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

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
              <TabsTrigger value="address">Endereço</TabsTrigger>
              <TabsTrigger value="business">Informações Comerciais</TabsTrigger>
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

                  {/* Logo Upload */}
                  <div className="space-y-2">
                    <FormLabel>Logo da Empresa</FormLabel>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={initialData?.logoUrl} alt="Logo" />
                        <AvatarFallback>
                          <Building2 className="h-8 w-8" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          id="logo-upload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('logo-upload')?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Logo
                        </Button>
                        <p className="text-sm text-muted-foreground mt-1">
                          Formatos: JPG, PNG. Tamanho máximo: 2MB
                        </p>
                      </div>
                    </div>
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
                    name="foundedYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ano de Fundação</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="YYYY"
                            min="1800"
                            max={new Date().getFullYear()}
                            {...field}
                            onChange={(e) => {
                              field.onChange(parseInt(e.target.value));
                              updateField('foundedYear', parseInt(e.target.value));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
              {isLoading ? 'Salvando...' : mode === 'create' ? 'Criar' : 'Atualizar'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
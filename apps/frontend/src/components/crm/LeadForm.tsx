import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { TagInput } from '../ui/tag-input';
import { CustomCurrencyInput } from '../ui/currency-input';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { 
  Lead, 
  LeadStage,
  DefaultLeadStage, 
  LeadSource, 
  ClientType,
  CreateLeadRequest, 
  UpdateLeadRequest,
  LEAD_STAGE_LABELS,
  LEAD_SOURCE_LABELS,
  CLIENT_TYPE_LABELS
} from '../../types/lead';
import { Loader2 } from 'lucide-react';

const leadSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  email: z.string().email('E-mail inválido').max(100, 'E-mail deve ter no máximo 100 caracteres'),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  stage: z.string().optional(),
  source: z.nativeEnum(LeadSource).optional(),
  notes: z.string().optional(),
  colorHighlight: z.string().optional(),
  estimatedValue: z.coerce.number().min(0, 'Valor deve ser positivo').optional(),
  expectedCloseDate: z.string().optional(),
  value: z.coerce.number().min(0, 'Valor do negócio deve ser positivo').optional(),
  powerKwp: z.coerce.number().min(0, 'Potência deve ser positiva').optional(),
  clientType: z.nativeEnum(ClientType).optional(),
  tags: z.array(z.string()).optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface LeadFormProps {
  lead?: Lead | null;
  onSubmit: (data: CreateLeadRequest | UpdateLeadRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  availableStages?: Array<{ value: string; label: string; }>;
  defaultStage?: string | null;
}


const sourceOptions = Object.entries(LEAD_SOURCE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const clientTypeOptions = Object.entries(CLIENT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const colorOptions = [
  { value: 'none', label: 'Sem destaque' },
  { value: '#ef4444', label: 'Vermelho - Urgente' },
  { value: '#f97316', label: 'Laranja - Importante' },
  { value: '#eab308', label: 'Amarelo - Atenção' },
  { value: '#22c55e', label: 'Verde - Bom' },
  { value: '#3b82f6', label: 'Azul - Informação' },
  { value: '#8b5cf6', label: 'Roxo - VIP' },
];

export const LeadForm: React.FC<LeadFormProps> = ({
  lead,
  onSubmit,
  onCancel,
  isLoading = false,
  availableStages,
  defaultStage,
}) => {
  // Usar stages disponíveis ou padrão como fallback
  const stageOptionsToUse = availableStages || Object.entries(LEAD_STAGE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));
  
  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      stage: defaultStage || DefaultLeadStage.LEAD_RECEBIDO,
      source: LeadSource.WEBSITE,
      notes: '',
      colorHighlight: 'none',
      estimatedValue: 0,
      expectedCloseDate: '',
      value: 0,
      powerKwp: 0,
      clientType: ClientType.B2C,
      tags: [],
    },
  });

  // Atualizar formulário quando lead for carregado
  useEffect(() => {
    if (lead) {
      console.log('🔄 Populando formulário com dados do lead:', {
        leadId: lead.id,
        value: lead.value,
        powerKwp: lead.powerKwp,
        clientType: lead.clientType,
        tags: lead.tags,
      });

      form.reset({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        company: lead.company || '',
        address: lead.address || '',
        stage: lead.stage || defaultStage || DefaultLeadStage.LEAD_RECEBIDO,
        source: lead.source || LeadSource.WEBSITE,
        notes: lead.notes || '',
        colorHighlight: lead.colorHighlight || 'none',
        estimatedValue: lead.estimatedValue || 0,
        expectedCloseDate: lead.expectedCloseDate ? 
          new Date(lead.expectedCloseDate).toISOString().split('T')[0] : '',
        value: lead.value || 0,
        powerKwp: lead.powerKwp || 0,
        clientType: lead.clientType || ClientType.B2C,
        tags: lead.tags || [],
      });
    }
  }, [lead, form, defaultStage]);

  const handleSubmit = async (data: LeadFormData) => {
    try {
      const formattedData = {
        ...data,
        expectedCloseDate: data.expectedCloseDate || null,
        estimatedValue: data.estimatedValue || 0,
        colorHighlight: data.colorHighlight === 'none' ? '' : data.colorHighlight,
      };

      await onSubmit(formattedData as CreateLeadRequest | UpdateLeadRequest);
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
    }
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto pr-2">
      <Form {...form}>
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit(handleSubmit)(e);
          }} 
          className="space-y-6"
        >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome *</FormLabel>
                <FormControl>
                  <Input placeholder="Nome completo" {...field} />
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
                  <Input type="email" placeholder="email@exemplo.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input placeholder="(11) 99999-9999" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Empresa</FormLabel>
                <FormControl>
                  <Input placeholder="Nome da empresa" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estágio</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estágio" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {stageOptionsToUse.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Origem</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a origem" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {sourceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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
            name="estimatedValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor Estimado</FormLabel>
                <FormControl>
                  <CustomCurrencyInput 
                    placeholder="R$ 0,00" 
                    value={field.value || ''}
                    onValueChange={(value) => {
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expectedCloseDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data Esperada de Fechamento</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor do Negócio</FormLabel>
                <FormControl>
                  <CustomCurrencyInput 
                    placeholder="R$ 0,00" 
                    value={field.value || ''}
                    onValueChange={(value) => {
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="powerKwp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Potência do Sistema (kWp)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    step="0.1"
                    placeholder="0.0" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="clientType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Cliente</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de cliente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clientTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <TagInput
                    value={field.value || []}
                    onChange={field.onChange}
                    placeholder="Adicionar tag..."
                    maxTags={10}
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="colorHighlight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cor de Destaque</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma cor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {colorOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          {option.value !== 'none' && (
                            <div 
                              className="w-4 h-4 rounded-full border" 
                              style={{ backgroundColor: option.value }}
                            />
                          )}
                          {option.label}
                        </div>
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
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço</FormLabel>
              <FormControl>
                <Input placeholder="Endereço completo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Notas sobre o lead..."
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCancel();
            }}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {lead ? 'Atualizar' : 'Criar'} Lead
          </Button>
        </div>
      </form>
    </Form>
    </div>
  );
};
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { ProjectType, CreateProjectData, ProjectSummary } from '@/types/project';
import { useCreateProject, useUpdateProject } from '@/hooks/project-hooks';
import { Loader2, Zap, Battery, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

const projectFormSchema = z.object({
  projectName: z.string().min(1, 'Nome do projeto é obrigatório'),
  projectType: z.nativeEnum(ProjectType),
  address: z.string().optional(),
  description: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

interface ProjectFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: Partial<CreateProjectData>;
  project?: ProjectSummary; // Para modo de edição
  isEdit?: boolean;
}

export default function ProjectForm({ onSuccess, onCancel, initialData, project, isEdit }: ProjectFormProps) {
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      projectName: project?.projectName || initialData?.projectName || '',
      projectType: project?.projectType || initialData?.projectType || ProjectType.PV,
      address: project?.address || initialData?.address || '',
      description: '',
    },
  });

  const onSubmit = async (data: ProjectFormData) => {
    try {
      if (isEdit && project) {
        // Modo de edição - só atualiza os campos básicos
        const updateData = {
          projectName: data.projectName,
          projectType: data.projectType,
          address: data.address || undefined,
        };

        await updateProjectMutation.mutateAsync({
          id: project.id,
          data: updateData
        });
        
        toast.success('Projeto atualizado com sucesso!');
        onSuccess?.();
        return;
      }

      // Modo de criação
      const projectData: CreateProjectData = {
        projectName: data.projectName,
        projectType: data.projectType,
        address: data.address || undefined,
        projectData: {
          // Initialize with basic project structure
          customer: undefined,
          location: data.address ? {
            latitude: 0,
            longitude: 0,
            address: data.address,
          } : undefined,
          energyBills: [{
            id: crypto.randomUUID(),
            name: 'Conta Principal',
            consumoMensal: Array(12).fill(500)
          }],
          potenciaModulo: 0,
          numeroModulos: 0,
          eficienciaSistema: 80,
          selectedModuleId: '',
          inverters: [{
            id: crypto.randomUUID(),
            selectedInverterId: '',
            quantity: 1
          }],
          totalInverterPower: 0,
          grupoTarifario: 'B',
          tarifaEnergiaB: 0.75,
          custoFioB: 0.05,
          tarifaEnergiaPontaA: 1.20,
          tarifaEnergiaForaPontaA: 0.60,
          demandaContratada: 100,
          tarifaDemanda: 30,
          custoEquipamento: 0,
          custoMateriais: 0,
          custoMaoDeObra: 0,
          bdi: 25,
          taxaDesconto: 8,
          inflacaoEnergia: 4.5,
          vidaUtil: 25,
          paymentMethod: 'vista',
          cardInstallments: 12,
          cardInterest: 1.99,
          financingInstallments: 60,
          financingInterest: 1.49,
          cableSizing: [],
          modelo3dUrl: '',
          googleSolarData: null,
          irradiacaoMensal: Array(12).fill(4.5),
        },
      };

      await createProjectMutation.mutateAsync(projectData);
      
      toast.success('Projeto criado com sucesso!');
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast.error(error.message || 'Erro ao criar projeto');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="projectName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Projeto</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ex: Sistema Residencial - João Silva"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="projectType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo do Projeto</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={ProjectType.PV}>
                    <div className="flex items-center">
                      <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                      Sistema Fotovoltaico (PV)
                    </div>
                  </SelectItem>
                  <SelectItem value={ProjectType.BESS}>
                    <div className="flex items-center">
                      <Battery className="w-4 h-4 mr-2 text-blue-500" />
                      Sistema de Armazenamento (BESS)
                    </div>
                  </SelectItem>
                  <SelectItem value={ProjectType.HYBRID}>
                    <div className="flex items-center">
                      <Layers className="w-4 h-4 mr-2 text-purple-500" />
                      Sistema Híbrido (PV + BESS)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço (Opcional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ex: Rua das Flores, 123, São Paulo - SP"
                  {...field} 
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
              <FormLabel>Descrição (Opcional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Adicione uma descrição para o projeto..."
                  className="resize-none"
                  rows={3}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={createProjectMutation.isPending || updateProjectMutation.isPending}
          >
            {(createProjectMutation.isPending || updateProjectMutation.isPending) && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            {isEdit ? 'Salvar Alterações' : 'Criar Projeto'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
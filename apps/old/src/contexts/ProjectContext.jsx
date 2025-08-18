import React, { createContext, useContext, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useNewAuth } from './NewAuthContext';
import { useToast } from '@/components/ui/use-toast';

const ProjectContext = createContext();

const getInitialFormData = () => ({
    id: null,
    lead_id: null,
    projectName: '',
    address: '',
    customer: null,
    energyBills: [{ id: uuidv4(), name: 'Conta Principal', consumoMensal: Array(12).fill(500) }],
    estado: '',
    cidade: '',
    irradiacaoMensal: Array(12).fill(4.5),
    potenciaModulo: 0,
    numeroModulos: null,
    eficienciaSistema: 80,
    inverters: [{ id: uuidv4(), selectedInverterId: '', quantity: 1 }],
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
    selectedModuleId: '',
    paymentMethod: 'vista',
    cardInstallments: 12,
    cardInterest: 1.99,
    financingInstallments: 60,
    financingInterest: 1.49,
    cableSizing: [],
    modelo3dUrl: '',
    googleSolarData: null,
});

export const ProjectProvider = ({ children }) => {
    const [currentProject, setCurrentProject] = useState(getInitialFormData());
    const [isProjectLoaded, setIsProjectLoaded] = useState(false);
    const [projectStateSource, setProjectStateSource] = useState(null);
    const { supabase, user } = useNewAuth();
    const { toast } = useToast();

    const loadProject = useCallback((projectData, source = null) => {
        const fullProjectData = { ...getInitialFormData(), ...projectData };
        setCurrentProject(fullProjectData);
        setIsProjectLoaded(true);
        setProjectStateSource(source);
    }, []);

    const isProjectSaved = useCallback(() => {
        return !!currentProject.id;
    }, [currentProject]);

    const loadProjectByLead = useCallback(async (lead) => {
        if (!supabase || !user) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Usuário não autenticado.' });
            return;
        }

        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('lead_id', lead.id)
            .eq('user_id', user.id)
            .order('saved_at', { ascending: false })
            .limit(1)
            .single();

        if (data) {
            const projectData = { ...data.project_data, id: data.id, lead_id: data.lead_id, projectName: data.project_name, address: data.address };
            loadProject(projectData, 'kanban');
            toast({ title: 'Projeto carregado', description: `Projeto para o lead "${lead.name}" foi carregado.` });
        } else {
            const newProject = {
                ...getInitialFormData(),
                lead_id: lead.id,
                projectName: `Projeto para ${lead.name}`,
                address: lead.address || '',
                customer: {
                    name: lead.name,
                    email: lead.email,
                    phone: lead.phone,
                    company: lead.company,
                }
            };
            loadProject(newProject, 'kanban');
            toast({ title: 'Novo projeto criado', description: `Um novo projeto foi iniciado para o lead "${lead.name}".` });
        }
    }, [supabase, user, loadProject, toast]);

    const updateProject = useCallback((updates) => {
        setCurrentProject(prev => ({ ...prev, ...updates }));
    }, []);

    const clearProject = useCallback(() => {
        setCurrentProject(getInitialFormData());
        setIsProjectLoaded(false);
        setProjectStateSource(null);
    }, []);

    return (
        <ProjectContext.Provider value={{ currentProject, loadProject, updateProject, clearProject, isProjectLoaded, loadProjectByLead, projectStateSource, isProjectSaved }}>
            {children}
        </ProjectContext.Provider>
    );
};

export const useProject = () => useContext(ProjectContext);
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Header from '@/components/layout/Header';
import PVDesignForm from '@/components/pv-design/PVDesignForm';
import PVDesignResults from '@/components/pv-design/PVDesignResults';
import PVAnalysisDashboard from '@/components/pv-design/PVAnalysisDashboard';
import ProjectLauncher from '@/components/pv-design/ProjectLauncher';
import { useProject } from '@/contexts/ProjectContext';

const PVDesignTool = () => {
    const { currentProject, updateProject, isProjectLoaded, clearProject, projectStateSource } = useProject();
    const [view, setView] = useState('form'); // 'form', 'dashboard', 'proposal'
    const [results, setResults] = useState(null);
    const [showLauncher, setShowLauncher] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (projectStateSource !== 'kanban') {
            clearProject();
        }
    }, []); 

    useEffect(() => {
        if (isProjectLoaded) {
            setShowLauncher(false);
        } else {
            setShowLauncher(true);
        }
    }, [isProjectLoaded]);

    const updateInverterPower = useCallback(() => {
        if (!currentProject.inverters) return;
        const allInverters = JSON.parse(localStorage.getItem('pvInverters') || '[]');
        if (allInverters.length === 0) return;

        const totalPower = currentProject.inverters.reduce((total, inv) => {
            const inverterDetails = allInverters.find(i => i.id === inv.selectedInverterId);
            if (inverterDetails) {
                return total + (Number(inverterDetails.potencia_saida_ca) * inv.quantity);
            }
            return total;
        }, 0);
        updateProject({ totalInverterPower: totalPower });
    }, [currentProject.inverters, updateProject]);

    useEffect(() => {
        updateInverterPower();
    }, [updateInverterPower]);

    const handleCalculationComplete = (data) => {
        const modules = JSON.parse(localStorage.getItem('pvModules') || '[]');
        const allInverters = JSON.parse(localStorage.getItem('pvInverters') || '[]');
        
        const selectedModule = modules.find(m => m.id === data.formData.selectedModuleId);
        const selectedInverters = data.formData.inverters.map(inv => ({
            ...inv,
            details: allInverters.find(i => i.id === inv.selectedInverterId)
        })).filter(inv => inv.details);

        setResults({
            ...data,
            selectedModule,
            selectedInverters
        });
        setView('dashboard');
    };

    const handleReset = () => {
        setView('form');
        setResults(null);
    };
    
    const handleNewProject = () => {
        clearProject();
        setView('form');
        setResults(null);
        setShowLauncher(true);
    };

    const handleGenerateProposal = () => {
        setView('proposal');
    };

    const handleBackToForm = () => {
        setView('form');
    }

    const handleProjectSelected = () => {
        setShowLauncher(false);
        setView('form');
        setResults(null);
    };

    const handleBackToSelection = () => {
        clearProject();
        navigate('/select-service');
    }

    const renderContent = () => {
        if (showLauncher) {
            return (
                <motion.div key="launcher" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <ProjectLauncher onProjectSelected={handleProjectSelected} onClose={handleBackToSelection} />
                </motion.div>
            );
        }

        if (view === 'dashboard' && results) {
            return (
                <motion.div
                   key="dashboard"
                   initial={{ opacity: 0, y: 50 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -50 }}
                   transition={{ duration: 0.5 }}
               >
                   <PVAnalysisDashboard 
                       results={results} 
                       onNewCalculation={handleReset} 
                       onGenerateProposal={handleGenerateProposal} 
                       onBackToForm={handleBackToForm}
                   />
               </motion.div>
            );
        }
        if (view === 'proposal' && results) {
            return (
                <motion.div
                    key="proposal"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.5 }}
                >
                    <PVDesignResults results={results} onNewCalculation={handleReset} onBackToForm={handleBackToForm} />
                </motion.div>
            );
        }
        return (
            <motion.div
                key="form"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.5 }}
                className="print:hidden"
            >
                <PVDesignForm 
                    onCalculationComplete={handleCalculationComplete} 
                    newProject={handleNewProject}
                />
            </motion.div>
        );
    };

    return (
        <div className="min-h-screen w-full bg-slate-900 print:bg-white">
            <Header />
            <main className="pt-20 print:pt-0">
                <div className="px-4 md:px-8 mb-4 print:hidden">
                    <Button variant="outline" onClick={handleBackToSelection}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para a Seleção de Serviços
                    </Button>
                </div>
                <AnimatePresence mode="wait">
                    {renderContent()}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default PVDesignTool;
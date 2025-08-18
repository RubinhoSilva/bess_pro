import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import SystemSelector from '@/components/simulation/SystemSelector';
import SimulationForm from '@/components/simulation/SimulationForm';
import Dashboard from '@/components/dashboard/Dashboard';
import Header from '@/components/layout/Header';

const BESSAnalysisTool = () => {
    const [appState, setAppState] = useState('selection'); // 'selection', 'form', 'dashboard'
    const [activeSystems, setActiveSystems] = useState(null);
    const [simulationData, setSimulationData] = useState(null);
    const navigate = useNavigate();

    const handleSelectionComplete = (systems) => {
        setActiveSystems(systems);
        setAppState('form');
    };

    const handleSimulationComplete = (data) => {
        setSimulationData(data);
        setAppState('dashboard');
    };

    const handleNewSimulation = () => {
        setSimulationData(null);
        setActiveSystems(null);
        setAppState('selection');
    }

    const renderContent = () => {
        if (appState === 'selection') {
            return (
                 <motion.div
                    key="selection"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, position: 'absolute', width: '100%' }}
                    transition={{ duration: 0.5 }}
                >
                    <SystemSelector onSelectionComplete={handleSelectionComplete} />
                </motion.div>
            );
        }

        if (appState === 'form') {
            return (
                <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, position: 'absolute', width: '100%' }}
                    transition={{ duration: 0.5 }}
                >
                    <SimulationForm 
                        onSimulationComplete={handleSimulationComplete} 
                        activeSystems={activeSystems}
                    />
                </motion.div>
            );
        }

        if (appState === 'dashboard') {
            return (
                <motion.div
                    key="dashboard"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, position: 'absolute', width: '100%' }}
                    transition={{ duration: 0.5 }}
                >
                    <Dashboard data={simulationData} onNewSimulation={handleNewSimulation} />
                </motion.div>
            );
        }
        
        return null;
    };

    return (
        <div className="relative min-h-screen">
            <Header />
            <div className="pt-20">
                 <div className="px-4 md:px-8 mb-4">
                    <Button 
                        variant="outline" 
                        onClick={() => appState === 'selection' ? navigate('/select-service') : handleNewSimulation()}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> 
                        {appState === 'selection' ? 'Voltar para a Seleção de Serviços' : 'Voltar para a Seleção de Sistema'}
                    </Button>
                </div>
                <AnimatePresence mode="wait">
                    {renderContent()}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default BESSAnalysisTool;
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Sun, BarChart, FilePlus } from 'lucide-react';
import CustomerDataForm from './form-sections/CustomerDataForm';
import ConsumptionForm from './form-sections/ConsumptionForm';
import LocationForm from './form-sections/LocationForm';
import SystemParametersForm from './form-sections/SystemParametersForm';
import FinancialForm from './form-sections/FinancialForm';
import ProjectManager from './ProjectManager';
import PaymentConditionsForm from './form-sections/PaymentConditionsForm';
import EconomicParametersForm from './form-sections/EconomicParametersForm';
import CableSizingForm from './form-sections/CableSizingForm';
import { calculateCableSizingForInverter } from '@/lib/cableSizing';
import { calculateFinancials } from '@/lib/calculations';
import { useProject } from '@/contexts/ProjectContext';

const PVDesignForm = ({ onCalculationComplete, newProject }) => {
    const { toast } = useToast();
    const { currentProject, updateProject } = useProject();
    const [isCalculating, setIsCalculating] = useState(false);

    const handleFormChange = (field, value) => {
        updateProject({ [field]: value });
    };

    const totalInvestment = useMemo(() => {
        const subtotal = (currentProject.custoEquipamento || 0) + (currentProject.custoMateriais || 0) + (currentProject.custoMaoDeObra || 0);
        return subtotal * (1 + (currentProject.bdi || 0) / 100);
    }, [currentProject.custoEquipamento, currentProject.custoMateriais, currentProject.custoMaoDeObra, currentProject.bdi]);

    const handleCalculate = () => {
        setIsCalculating(true);
        setTimeout(() => {
            try {
                const irradiacaoMediaAnual = currentProject.irradiacaoMensal.reduce((a, b) => a + b, 0) / 12;
                if (irradiacaoMediaAnual <= 0 || !currentProject.potenciaModulo || currentProject.potenciaModulo <= 0) {
                    toast({ variant: "destructive", title: "Valores inválidos", description: "Potência do módulo e irradiação devem ser maiores que zero." });
                    setIsCalculating(false);
                    return;
                }

                const totalConsumoMensal = currentProject.energyBills.reduce((acc, bill) => {
                    bill.consumoMensal.forEach((consumo, index) => {
                        acc[index] = (acc[index] || 0) + consumo;
                    });
                    return acc;
                }, Array(12).fill(0));

                let potenciaPico;
                let numeroModulos;
                const consumoTotalAnual = totalConsumoMensal.reduce((a, b) => a + b, 0);

                if (currentProject.numeroModulos && currentProject.numeroModulos > 0) {
                    numeroModulos = currentProject.numeroModulos;
                    potenciaPico = (numeroModulos * currentProject.potenciaModulo) / 1000;
                } else {
                    const consumoMedioDiario = consumoTotalAnual / 365;
                    potenciaPico = (consumoMedioDiario / (irradiacaoMediaAnual * (currentProject.eficienciaSistema / 100)));
                    numeroModulos = Math.ceil((potenciaPico * 1000) / currentProject.potenciaModulo);
                }

                const areaEstimada = numeroModulos * 2.5;
                const geracaoEstimadaMensal = currentProject.irradiacaoMensal.map(irr => potenciaPico * irr * 30 * (currentProject.eficienciaSistema / 100));
                const geracaoEstimadaAnual = geracaoEstimadaMensal.reduce((a, b) => a + b, 0);

                const financialResults = calculateFinancials({
                    ...currentProject,
                    totalInvestment,
                    geracaoEstimadaMensal,
                    consumoMensal: totalConsumoMensal,
                });

                const allInverters = JSON.parse(localStorage.getItem('pvInverters') || '[]');
                const cableSizingResults = currentProject.inverters.map(inverterConfig => {
                    const inverterDetails = allInverters.find(i => i.id === inverterConfig.selectedInverterId);
                    if (!inverterDetails) return null;

                    const cableParams = currentProject.cableSizing.find(cs => cs.inverterId === inverterConfig.id);
                    if (!cableParams) return null;

                    const result = calculateCableSizingForInverter({
                        ...cableParams,
                        inverterPower: inverterDetails.potencia_saida_ca,
                    });
                    
                    return {
                        inverterName: inverterDetails.nome,
                        ...result
                    };
                }).filter(Boolean);

                onCalculationComplete({
                    formData: currentProject,
                    potenciaPico,
                    numeroModulos,
                    areaEstimada,
                    geracaoEstimadaAnual,
                    geracaoEstimadaMensal,
                    consumoTotalAnual,
                    totalInvestment,
                    ...financialResults,
                    cableSizingResults
                });
            } catch (error) {
                console.error("Calculation Error:", error);
                toast({ variant: "destructive", title: "Erro no cálculo", description: "Ocorreu um erro inesperado. Verifique os dados e tente novamente." });
            } finally {
                setIsCalculating(false);
            }
        }, 1500);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-10"
                >
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="p-3 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl shadow-lg">
                            <Sun className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                            Dimensionamento Fotovoltaico
                        </h1>
                    </div>
                    <p className="text-lg text-slate-300 max-w-3xl mx-auto">
                        {currentProject.projectName || 'Insira os dados para dimensionar seu sistema solar e estimar a viabilidade.'}
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-8">
                        <CustomerDataForm formData={currentProject} onFormChange={handleFormChange} setFormData={updateProject} />
                        <LocationForm formData={currentProject} onFormChange={handleFormChange} setFormData={updateProject} />
                        <SystemParametersForm formData={currentProject} onFormChange={handleFormChange} />
                        <CableSizingForm formData={currentProject} onFormChange={handleFormChange} />
                    </div>

                    <div className="space-y-8">
                        <ConsumptionForm formData={currentProject} onFormChange={handleFormChange} />
                        <FinancialForm formData={currentProject} onFormChange={handleFormChange} totalInvestment={totalInvestment} />
                        <EconomicParametersForm formData={currentProject} onFormChange={handleFormChange} />
                        <PaymentConditionsForm formData={currentProject} onFormChange={handleFormChange} />
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex flex-wrap justify-center items-center gap-4 pt-10"
                >
                    <Button onClick={newProject} variant="outline" className="text-white border-green-500 hover:bg-green-500/20 hover:text-white">
                        <FilePlus className="w-4 h-4 mr-2" /> Novo Projeto
                    </Button>
                    <ProjectManager projectType="pv" />
                    
                    <Button onClick={handleCalculate} disabled={isCalculating} size="lg" className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-10 py-6 text-xl font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                        {isCalculating ? (
                            <div className="flex items-center gap-3"><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Calculando...</div>
                        ) : (
                            <div className="flex items-center gap-3"><BarChart className="w-6 h-6" /> Ver Resultados</div>
                        )}
                    </Button>
                </motion.div>
            </div>
        </div>
    );
};

export default PVDesignForm;
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { MapPin, Globe } from 'lucide-react';
import StandardAnalysisForm from './StandardAnalysisForm';
import Model3DAnalysisForm from './Model3DAnalysisForm';
import GoogleSolarAnalysis from './GoogleSolarAnalysis';
import { useNewAuth } from '@/contexts/NewAuthContext';

const LocationForm = ({ formData, onFormChange, setFormData }) => {
    const { user } = useNewAuth();
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const [analysisType, setAnalysisType] = useState('padrão');

    const isTestUser = user?.email === 'teste@teste.com.br';

    const handleMonthlyChange = (index, value) => {
        const newValues = [...formData.irradiacaoMensal];
        newValues[index] = parseFloat(value) || 0;
        onFormChange('irradiacaoMensal', newValues);
    };

    const handleProjectUpdate = (updatedProject) => {
        setFormData(prevData => ({
            ...prevData,
            ...updatedProject,
            projectName: updatedProject.project_name,
            address: updatedProject.address,
            ...updatedProject.project_data,
        }));
    };

    return (
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white"><MapPin className="w-5 h-5 text-green-400" /> Localização e Irradiação</CardTitle>
                <CardDescription>Escolha o tipo de análise e insira os dados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label>Tipo de Análise</Label>
                    <Select value={analysisType} onValueChange={(value) => {
                        setAnalysisType(value);
                        onFormChange('modelo3dUrl', '');
                        onFormChange('googleSolarData', null);
                    }}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue placeholder="Selecione o tipo de análise" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="padrão">Análise Padrão</SelectItem>
                            {isTestUser ? (
                                <SelectItem value="3d">Análise com Modelo 3D</SelectItem>
                            ) : (
                                <SelectItem value="3d" disabled>
                                    Análise com Modelo 3D (Em breve)
                                </SelectItem>
                            )}
                            <SelectItem value="google_solar">Busca Automática (PVGIS)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {analysisType === 'padrão' && (
                    <StandardAnalysisForm formData={formData} onFormChange={onFormChange} />
                )}
                
                {analysisType === 'google_solar' && (
                    <GoogleSolarAnalysis onFormChange={onFormChange} setFormData={setFormData} />
                )}

                {analysisType === '3d' && isTestUser && (
                    <Model3DAnalysisForm formData={formData} onFormChange={onFormChange} onProjectUpdate={handleProjectUpdate} />
                )}
                
                <div>
                    <Label className="text-white flex items-center gap-2 mb-2"><Globe className="w-4 h-4" /> Irradiação Solar Mensal (kWh/m²/dia)</Label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {months.map((month, index) => (
                            <div key={month} className="space-y-1">
                                <Label htmlFor={`irradiacao-${month}`} className="text-xs text-gray-400">{month}</Label>
                                <Input id={`irradiacao-${month}`} type="number" step="0.1" value={formData.irradiacaoMensal[index]} onChange={(e) => handleMonthlyChange(index, e.target.value)} className="bg-white/10 border-white/20 text-white h-8" disabled={analysisType === '3d' || analysisType === 'google_solar'} />
                            </div>
                        ))}
                    </div>
                    {analysisType === '3d' && (
                         <p className="text-xs text-slate-400 mt-2">Os dados de irradiação serão calculados automaticamente com base na localização e sombreamento do modelo 3D.</p>
                    )}
                    {analysisType === 'google_solar' && (
                         <p className="text-xs text-slate-400 mt-2">Os dados de irradiação serão preenchidos automaticamente pela API do Google após a análise.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default LocationForm;
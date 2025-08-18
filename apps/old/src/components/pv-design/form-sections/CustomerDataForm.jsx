import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { User, Search, Loader2 } from 'lucide-react';
import { useNewAuth } from '@/contexts/NewAuthContext';

const CustomerDataForm = ({ formData, onFormChange, setFormData }) => {
    const { user, supabase } = useNewAuth();
    const [leads, setLeads] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLoadingLeads, setIsLoadingLeads] = useState(false);

    const fetchLeads = useCallback(async () => {
        if (!user || !supabase || !searchTerm) {
            setLeads([]);
            return;
        }
        setIsLoadingLeads(true);
        const { data, error } = await supabase
            .from('leads')
            .select('id, name, email, phone, address, company, client_type')
            .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
            .limit(10);
        
        if (!error) {
            setLeads(data);
        }
        setIsLoadingLeads(false);
    }, [user, supabase, searchTerm]);

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchLeads();
        }, 300);
        return () => clearTimeout(debounce);
    }, [fetchLeads]);

    useEffect(() => {
        setSearchTerm(formData.projectName || '');
    }, [formData.projectName]);

    const handleSelectLead = (lead) => {
        setFormData(prev => ({
            ...prev,
            projectName: lead.name,
            address: lead.address,
            customer: { // Can be a lead object initially
                id: lead.id, // lead id
                name: lead.name,
                email: lead.email,
                phone: lead.phone,
                address: lead.address,
                company: lead.company,
            },
            grupoTarifario: lead.client_type,
        }));
        setSearchTerm(lead.name);
        setIsDropdownOpen(false);
    };

    return (
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white"><User className="w-5 h-5 text-cyan-400" /> Dados do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2 relative">
                    <Label htmlFor="customer-search">Buscar Lead / Nome do Projeto</Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                            id="customer-search"
                            type="text"
                            placeholder="Digite para buscar um lead ou insira um novo nome"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                onFormChange('projectName', e.target.value);
                                setIsDropdownOpen(true);
                            }}
                            onFocus={() => setIsDropdownOpen(true)}
                            onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                            className="bg-white/10 border-white/20 text-white pl-10"
                        />
                    </div>
                    {isDropdownOpen && (searchTerm || isLoadingLeads) && (
                        <div className="absolute z-10 w-full bg-slate-700 border border-slate-600 rounded-md mt-1 max-h-48 overflow-y-auto">
                            {isLoadingLeads ? (
                                <div className="p-2 flex items-center justify-center text-slate-400">
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Buscando...
                                </div>
                            ) : leads.length > 0 ? (
                                leads.map(lead => (
                                    <div
                                        key={lead.id}
                                        className="p-2 hover:bg-slate-600 cursor-pointer text-white"
                                        onMouseDown={() => handleSelectLead(lead)}
                                    >
                                        <p className="font-semibold">{lead.name}</p>
                                        <p className="text-xs text-slate-400">{lead.email}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="p-2 text-center text-slate-400">Nenhum lead encontrado.</div>
                            )}
                        </div>
                    )}
                </div>
                <div className="space-y-2">
                    <Label>Grupo Tarifário</Label>
                    <Select onValueChange={(v) => onFormChange('grupoTarifario', v)} value={formData.grupoTarifario}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="B">Grupo B</SelectItem>
                            <SelectItem value="A">Grupo A</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <AnimatePresence>
                    {formData.grupoTarifario === 'B' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                            <div className="space-y-2">
                                <Label htmlFor="tarifaEnergiaB">Tarifa de Energia (R$/kWh)</Label>
                                <Input id="tarifaEnergiaB" type="number" step="0.01" value={formData.tarifaEnergiaB} onChange={(e) => onFormChange('tarifaEnergiaB', parseFloat(e.target.value) || 0)} className="bg-white/10 border-white/20 text-white" />
                            </div>
                        </motion.div>
                    )}
                    {formData.grupoTarifario === 'A' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="tarifaEnergiaPontaA">Tarifa Ponta (R$/kWh)</Label>
                                    <Input id="tarifaEnergiaPontaA" type="number" step="0.01" value={formData.tarifaEnergiaPontaA} onChange={(e) => onFormChange('tarifaEnergiaPontaA', parseFloat(e.target.value) || 0)} className="bg-white/10 border-white/20 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tarifaEnergiaForaPontaA">Tarifa Fora Ponta (R$/kWh)</Label>
                                    <Input id="tarifaEnergiaForaPontaA" type="number" step="0.01" value={formData.tarifaEnergiaForaPontaA} onChange={(e) => onFormChange('tarifaEnergiaForaPontaA', parseFloat(e.target.value) || 0)} className="bg-white/10 border-white/20 text-white" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="demandaContratada">Demanda Contratada (kW)</Label>
                                    <Input id="demandaContratada" type="number" value={formData.demandaContratada} onChange={(e) => onFormChange('demandaContratada', parseFloat(e.target.value) || 0)} className="bg-white/10 border-white/20 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tarifaDemanda">Tarifa Demanda (R$/kW)</Label>
                                    <Input id="tarifaDemanda" type="number" step="0.01" value={formData.tarifaDemanda} onChange={(e) => onFormChange('tarifaDemanda', parseFloat(e.target.value) || 0)} className="bg-white/10 border-white/20 text-white" />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
};

export default CustomerDataForm;
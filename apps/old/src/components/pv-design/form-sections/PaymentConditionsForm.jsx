import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, Banknote, Landmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PaymentConditionsForm = ({ formData, onFormChange }) => {
    const handleNumberInputChange = (field, value) => {
        onFormChange(field, parseFloat(value) || 0);
    };

    return (
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white"><CreditCard className="w-5 h-5 text-blue-400" /> Condições de Pagamento</CardTitle>
                <CardDescription>Defina as opções de pagamento para a proposta.</CardDescription>
            </CardHeader>
            <CardContent>
                <RadioGroup value={formData.paymentMethod} onValueChange={(v) => onFormChange('paymentMethod', v)} className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="vista" id="vista" />
                        <Label htmlFor="vista">Somente à vista</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="parcelado" id="parcelado" />
                        <Label htmlFor="parcelado">À vista e Parcelado</Label>
                    </div>
                </RadioGroup>

                <AnimatePresence>
                    {formData.paymentMethod === 'parcelado' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-6 space-y-6 overflow-hidden"
                        >
                            <div className="space-y-3 p-4 rounded-lg bg-slate-900/50">
                                <h4 className="font-semibold flex items-center gap-2"><Banknote className="w-4 h-4 text-green-400" /> Boleto / Cartão</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="cardInstallments">Parcelas</Label>
                                        <Input id="cardInstallments" type="number" value={formData.cardInstallments} onChange={(e) => handleNumberInputChange('cardInstallments', e.target.value)} className="bg-white/10 border-white/20 text-white" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="cardInterest">Juros (% a.m.)</Label>
                                        <Input id="cardInterest" type="number" step="0.01" value={formData.cardInterest} onChange={(e) => handleNumberInputChange('cardInterest', e.target.value)} className="bg-white/10 border-white/20 text-white" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3 p-4 rounded-lg bg-slate-900/50">
                                <h4 className="font-semibold flex items-center gap-2"><Landmark className="w-4 h-4 text-purple-400" /> Financiamento</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="financingInstallments">Parcelas</Label>
                                        <Input id="financingInstallments" type="number" value={formData.financingInstallments} onChange={(e) => handleNumberInputChange('financingInstallments', e.target.value)} className="bg-white/10 border-white/20 text-white" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="financingInterest">Juros (% a.m.)</Label>
                                        <Input id="financingInterest" type="number" step="0.01" value={formData.financingInterest} onChange={(e) => handleNumberInputChange('financingInterest', e.target.value)} className="bg-white/10 border-white/20 text-white" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
};

export default PaymentConditionsForm;
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CreditCard } from 'lucide-react';

interface PaymentConditionsFormProps {
  formData: any;
  onFormChange: (field: string, value: any) => void;
}

export default function PaymentConditionsForm({ formData, onFormChange }: PaymentConditionsFormProps) {
  return (
    <Card className="bg-card/50 border-border backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <CreditCard className="w-5 h-5 text-blue-400" /> 
          Condições de Pagamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Método de Pagamento</Label>
          <Select onValueChange={(v) => onFormChange('paymentMethod', v)} value={formData.paymentMethod || 'vista'}>
            <SelectTrigger className="bg-background border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vista">À Vista</SelectItem>
              <SelectItem value="cartao">Cartão de Crédito</SelectItem>
              <SelectItem value="financiamento">Financiamento</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <AnimatePresence>
          {formData.paymentMethod === 'cartao' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }} 
              className="space-y-4 overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cardInstallments">Parcelas</Label>
                  <Input 
                    id="cardInstallments" 
                    type="number" 
                    value={formData.cardInstallments || 12} 
                    onChange={(e) => onFormChange('cardInstallments', parseInt(e.target.value) || 12)} 
                    className="bg-background border-border text-foreground" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardInterest">Juros (% a.m.)</Label>
                  <Input 
                    id="cardInterest" 
                    type="number" 
                    step="0.01" 
                    value={formData.cardInterest || 1.99} 
                    onChange={(e) => onFormChange('cardInterest', parseFloat(e.target.value) || 1.99)} 
                    className="bg-background border-border text-foreground" 
                  />
                </div>
              </div>
            </motion.div>
          )}

          {formData.paymentMethod === 'financiamento' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }} 
              className="space-y-4 overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="financingInstallments">Parcelas</Label>
                  <Input 
                    id="financingInstallments" 
                    type="number" 
                    value={formData.financingInstallments || 60} 
                    onChange={(e) => onFormChange('financingInstallments', parseInt(e.target.value) || 60)} 
                    className="bg-background border-border text-foreground" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="financingInterest">Juros (% a.m.)</Label>
                  <Input 
                    id="financingInterest" 
                    type="number" 
                    step="0.01" 
                    value={formData.financingInterest || 1.49} 
                    onChange={(e) => onFormChange('financingInterest', parseFloat(e.target.value) || 1.49)} 
                    className="bg-background border-border text-foreground" 
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
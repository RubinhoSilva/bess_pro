import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { UseInverterFormReturn } from '@/hooks/equipment/useInverterForm';

interface InverterFormProps {
  form: UseInverterFormReturn['form'];
  isSubmitting: boolean;
  manufacturers: Array<{ id: string; name: string }>;
  onCancel: () => void;
  onSubmit: () => void;
  isEdit?: boolean;
}

export const InverterForm: React.FC<InverterFormProps> = ({
  form,
  isSubmitting,
  manufacturers,
  onCancel,
  onSubmit,
  isEdit = false
}) => {
  return (
    <div className="grid grid-cols-2 gap-4 py-4">
      {/* Basic Info */}
      <div className="space-y-2">
        <Label htmlFor="manufacturerId">Fabricante</Label>
        <Select
          value={form.watch('manufacturerId')}
          onValueChange={(value) => form.setValue('manufacturerId', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o fabricante" />
          </SelectTrigger>
          <SelectContent>
            {manufacturers.map((manufacturer) => (
              <SelectItem key={manufacturer.id} value={manufacturer.id}>
                {manufacturer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="model">Modelo</Label>
        <Input
          id="model"
          {...form.register('model')}
          placeholder="Ex: SPR-M20-470-COM"
        />
        {form.formState.errors.model && (
          <p className="text-sm text-red-500">
            {form.formState.errors.model.message}
          </p>
        )}
      </div>

      {/* Power Configuration */}
      <div className="space-y-2">
        <Label htmlFor="ratedACPower">Potência Saída CA (W)</Label>
        <Input
          id="ratedACPower"
          type="number"
          {...form.register('ratedACPower', { valueAsNumber: true })}
          placeholder="Ex: 50000"
        />
        {form.formState.errors.ratedACPower && (
          <p className="text-sm text-red-600">{form.formState.errors.ratedACPower.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxPVPower">Potência FV Máxima (W)</Label>
        <Input
          id="maxPVPower"
          type="number"
          {...form.register('maxPVPower', { valueAsNumber: true })}
          placeholder="Ex: 65000"
        />
        {form.formState.errors.maxPVPower && (
          <p className="text-sm text-red-600">{form.formState.errors.maxPVPower.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="ratedDCPower">Potência Nominal DC (W)</Label>
        <Input
          id="ratedDCPower"
          type="number"
          {...form.register('ratedDCPower', { valueAsNumber: true })}
          placeholder="Ex: 52000"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxApparentPower">Potência Aparente Máxima (VA)</Label>
        <Input
          id="maxApparentPower"
          type="number"
          {...form.register('maxApparentPower', { valueAsNumber: true })}
          placeholder="Ex: 55000"
        />
      </div>

      {/* Electrical Specifications */}
      <div className="space-y-2">
        <Label htmlFor="shortCircuitVoltageMax">Tensão CC Máxima (V)</Label>
        <Input
          id="shortCircuitVoltageMax"
          type="number"
          {...form.register('shortCircuitVoltageMax', { valueAsNumber: true })}
          placeholder="Ex: 1100"
        />
        {form.formState.errors.shortCircuitVoltageMax && (
          <p className="text-sm text-red-600">{form.formState.errors.shortCircuitVoltageMax.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxInputCurrent">Corrente Entrada Máxima (A)</Label>
        <Input
          id="maxInputCurrent"
          type="number"
          step="0.1"
          {...form.register('maxInputCurrent', { valueAsNumber: true })}
          placeholder="Ex: 64"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="gridType">Tipo de Rede</Label>
        <Select
          value={form.watch('gridType')}
          onValueChange={(value) => form.setValue('gridType', value as 'monofasico' | 'bifasico' | 'trifasico')}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monofasico">Monofásico</SelectItem>
            <SelectItem value="bifasico">Bifásico</SelectItem>
            <SelectItem value="trifasico">Trifásico</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ratedVoltage">Tensão Nominal (V)</Label>
        <Input
          id="ratedVoltage"
          type="number"
          {...form.register('ratedVoltage', { valueAsNumber: true })}
          placeholder="Ex: 220"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="frequency">Frequência (Hz)</Label>
        <Input
          id="frequency"
          type="number"
          {...form.register('frequency', { valueAsNumber: true })}
          placeholder="Ex: 60"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="powerFactor">Fator de Potência</Label>
        <Input
          id="powerFactor"
          type="number"
          step="0.01"
          {...form.register('powerFactor', { valueAsNumber: true })}
          placeholder="Ex: 0.95"
        />
      </div>

      {/* MPPT Configuration */}
      <div className="space-y-2">
        <Label htmlFor="numberOfMppts">Número de MPPTs</Label>
        <Input
          id="numberOfMppts"
          type="number"
          {...form.register('numberOfMppts', { valueAsNumber: true })}
          placeholder="Ex: 8"
        />
        {form.formState.errors.numberOfMppts && (
          <p className="text-sm text-red-600">{form.formState.errors.numberOfMppts.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="stringsPerMppt">Strings por MPPT</Label>
        <Input
          id="stringsPerMppt"
          type="number"
          {...form.register('stringsPerMppt', { valueAsNumber: true })}
          placeholder="Ex: 2"
        />
        {form.formState.errors.stringsPerMppt && (
          <p className="text-sm text-red-600">{form.formState.errors.stringsPerMppt.message}</p>
        )}
      </div>

      {/* Efficiency */}
      <div className="space-y-2">
        <Label htmlFor="maxEfficiency">Eficiência Máxima (%)</Label>
        <Input
          id="maxEfficiency"
          type="number"
          step="0.1"
          {...form.register('maxEfficiency', { valueAsNumber: true })}
          placeholder="Ex: 98.6"
        />
        {form.formState.errors.maxEfficiency && (
          <p className="text-sm text-red-600">{form.formState.errors.maxEfficiency.message}</p>
        )}
      </div>

      {/* Connection Type */}
      <div className="space-y-2">
        <Label htmlFor="connectionType">Tipo de Conexão</Label>
        <Select
          value={form.watch('connectionType')}
          onValueChange={(value) => form.setValue('connectionType', value as any)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="on-grid">On-Grid</SelectItem>
            <SelectItem value="off-grid">Off-Grid</SelectItem>
            <SelectItem value="hybrid">Híbrido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Metadata */}
      <div className="space-y-2">
        <Label htmlFor="price">Preço (USD)</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          {...form.register('price', { valueAsNumber: true })}
          placeholder="Ex: 2500.00"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency">Moeda</Label>
        <Input
          id="currency"
          {...form.register('currency')}
          placeholder="Ex: USD"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="productCode">Código do Produto</Label>
        <Input
          id="productCode"
          {...form.register('productCode')}
          placeholder="Ex: INV-001"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="warranty">Garantia (anos)</Label>
        <Input
          id="warranty"
          type="number"
          {...form.register('warranty', { valueAsNumber: true })}
          placeholder="Ex: 10"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="datasheetUrl">URL do Datasheet</Label>
        <Input
          id="datasheetUrl"
          {...form.register('datasheetUrl')}
          placeholder="https://..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageUrl">URL da Imagem</Label>
        <Input
          id="imageUrl"
          {...form.register('imageUrl')}
          placeholder="https://..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="countryOfOrigin">País de Origem</Label>
        <Input
          id="countryOfOrigin"
          {...form.register('countryOfOrigin')}
          placeholder="Ex: Brasil"
        />
      </div>

      {/* Action buttons */}
      <div className="col-span-2 flex justify-end gap-4 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Atualizar' : 'Criar'} Inversor
        </Button>
      </div>
    </div>
  );
};

export default InverterForm;
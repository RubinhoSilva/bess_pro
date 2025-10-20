import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { UseModuleFormReturn } from '@/hooks/equipment/useModuleForm';
import { Manufacturer } from '@bess-pro/shared';

interface ModuleFormProps {
  form: UseModuleFormReturn['form'];
  isSubmitting: boolean;
  manufacturers: Array<{ id: string; name: string }>;
  onCancel: () => void;
  onSubmit: () => void;
  isEdit?: boolean;
}

export const ModuleForm: React.FC<ModuleFormProps> = ({
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
        <Label htmlFor="modelo">Modelo</Label>
        <Input
          id="model"
          {...form.register('model')}
          placeholder="Ex: JK300M-72"
        />
        {form.formState.errors.model && (
          <p className="text-sm text-red-600">{form.formState.errors.model.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="nominalPower">Potência Nominal (W)</Label>
        <Input
          id="nominalPower"
          type="number"
          {...form.register('nominalPower', { valueAsNumber: true })}
          placeholder="Ex: 550"
        />
        {form.formState.errors.nominalPower && (
          <p className="text-sm text-red-600">{form.formState.errors.nominalPower.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="efficiency">Eficiência (%)</Label>
        <Input
          id="efficiency"
          type="number"
          step="0.1"
          {...form.register('efficiency', { valueAsNumber: true })}
          placeholder="Ex: 21.5"
        />
        {form.formState.errors.efficiency && (
          <p className="text-sm text-red-600">{form.formState.errors.efficiency.message}</p>
        )}
      </div>

      {/* Electrical Specifications */}
      <div className="space-y-2">
        <Label htmlFor="vmpp">VmPP (V)</Label>
        <Input
          id="vmpp"
          type="number"
          step="0.1"
          {...form.register('vmpp', { valueAsNumber: true })}
          placeholder="Ex: 41.2"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="impp">ImPP (A)</Label>
        <Input
          id="impp"
          type="number"
          step="0.1"
          {...form.register('impp', { valueAsNumber: true })}
          placeholder="Ex: 13.35"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="voc">Voc (V)</Label>
        <Input
          id="voc"
          type="number"
          step="0.1"
          {...form.register('voc', { valueAsNumber: true })}
          placeholder="Ex: 49.8"
        />
        {form.formState.errors.voc && (
          <p className="text-sm text-red-600">{form.formState.errors.voc.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="isc">Isc (A)</Label>
        <Input
          id="isc"
          type="number"
          step="0.1"
          {...form.register('isc', { valueAsNumber: true })}
          placeholder="Ex: 14.23"
        />
      </div>

      {/* Cell Type */}
      <div className="space-y-2">
        <Label htmlFor="cellType">Tipo de Célula</Label>
        <Select
          value={form.watch('cellType')}
          onValueChange={(value) => form.setValue('cellType', value as any)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monocrystalline">Monocristalino</SelectItem>
            <SelectItem value="polycrystalline">Policristalino</SelectItem>
            <SelectItem value="thin-film">Filme Fino</SelectItem>
            <SelectItem value="bifacial">Bifacial</SelectItem>
            <SelectItem value="heterojunction">Heterojunção</SelectItem>
            <SelectItem value="perovskite">Perovskita</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="technology">Tecnologia</Label>
        <Select
          value={form.watch('technology')}
          onValueChange={(value) => form.setValue('technology', value as any)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione a tecnologia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="perc">PERC</SelectItem>
            <SelectItem value="hjt">HJT</SelectItem>
            <SelectItem value="topcon">TOPCon</SelectItem>
            <SelectItem value="ibc">IBC</SelectItem>
            <SelectItem value="shj">SHJ</SelectItem>
            <SelectItem value="half-cut">Half-Cut</SelectItem>
            <SelectItem value="multi-busbar">Multi-Busbar</SelectItem>
            <SelectItem value="tandem">Tandem</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Temperature Coefficients */}
      <div className="space-y-2">
        <Label htmlFor="tempCoeffPmax">Coef. Temp. Pmax (%/°C)</Label>
        <Input
          id="tempCoeffPmax"
          type="number"
          step="0.01"
          {...form.register('tempCoeffPmax', { valueAsNumber: true })}
          placeholder="Ex: -0.35"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tempCoeffVoc">Coef. Temp. Voc (%/°C)</Label>
        <Input
          id="tempCoeffVoc"
          type="number"
          step="0.01"
          {...form.register('tempCoeffVoc', { valueAsNumber: true })}
          placeholder="Ex: -0.28"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tempCoeffIsc">Coef. Temp. Isc (%/°C)</Label>
        <Input
          id="tempCoeffIsc"
          type="number"
          step="0.01"
          {...form.register('tempCoeffIsc', { valueAsNumber: true })}
          placeholder="Ex: 0.04"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="numberOfCells">Número de Células</Label>
        <Input
          id="numberOfCells"
          type="number"
          {...form.register('numberOfCells', { valueAsNumber: true })}
          placeholder="Ex: 60"
        />
      </div>

      {/* Physical Dimensions */}
      <div className="space-y-2">
        <Label htmlFor="widthMm">Largura (mm)</Label>
        <Input
          id="widthMm"
          type="number"
          {...form.register('widthMm', { valueAsNumber: true })}
          placeholder="Ex: 2279"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="heightMm">Altura (mm)</Label>
        <Input
          id="heightMm"
          type="number"
          {...form.register('heightMm', { valueAsNumber: true })}
          placeholder="Ex: 1134"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="thicknessMm">Espessura (mm)</Label>
        <Input
          id="thicknessMm"
          type="number"
          step="0.1"
          {...form.register('thicknessMm', { valueAsNumber: true })}
          placeholder="Ex: 35"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="weightKg">Peso (kg)</Label>
        <Input
          id="weightKg"
          type="number"
          step="0.1"
          {...form.register('weightKg', { valueAsNumber: true })}
          placeholder="Ex: 21.8"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="areaM2">Área (m²)</Label>
        <Input
          id="areaM2"
          type="number"
          step="0.01"
          {...form.register('areaM2', { valueAsNumber: true })}
          placeholder="Ex: 2.58"
        />
      </div>

      {/* Metadata */}
      <div className="space-y-2">
        <Label htmlFor="price">Preço (USD)</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          {...form.register('price', { valueAsNumber: true })}
          placeholder="Ex: 150.00"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="warranty">Garantia (anos)</Label>
        <Input
          id="warranty"
          type="number"
          {...form.register('warranty', { valueAsNumber: true })}
          placeholder="Ex: 25"
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
          {isEdit ? 'Atualizar' : 'Criar'} Módulo
        </Button>
      </div>
    </div>
  );
};

export default ModuleForm;
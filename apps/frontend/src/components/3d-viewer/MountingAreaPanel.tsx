import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  X, 
  Plus, 
  Edit, 
  Trash2, 
  Layers, 
  Grid3X3,
  RotateCw,
  Move,
  Eye,
  EyeOff
} from 'lucide-react';

export interface MountingArea {
  id: string;
  name: string;
  type: 'roof' | 'ground' | 'structure';
  area: number; // m²
  tilt: number; // degrees
  azimuth: number; // degrees
  moduleCount: number;
  modulePower: number; // Wp
  totalPower: number; // kWp
  position: [number, number, number];
  visible: boolean;
  color?: string;
}

interface MountingAreaPanelProps {
  isOpen: boolean;
  onClose: () => void;
  areas: MountingArea[];
  selectedAreaId?: string;
  onAreaSelect: (areaId: string) => void;
  onAreaUpdate: (area: MountingArea) => void;
  onAreaDelete: (areaId: string) => void;
  onCreateArea: () => void;
  onToggleAreaVisibility: (areaId: string) => void;
}

export default function MountingAreaPanel({
  isOpen,
  onClose,
  areas,
  selectedAreaId,
  onAreaSelect,
  onAreaUpdate,
  onAreaDelete,
  onCreateArea,
  onToggleAreaVisibility
}: MountingAreaPanelProps) {
  const [editingArea, setEditingArea] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<MountingArea>>({});

  const handleStartEdit = (area: MountingArea) => {
    setEditingArea(area.id);
    setEditForm(area);
  };

  const handleSaveEdit = () => {
    if (editingArea && editForm) {
      onAreaUpdate(editForm as MountingArea);
      setEditingArea(null);
      setEditForm({});
    }
  };

  const handleCancelEdit = () => {
    setEditingArea(null);
    setEditForm({});
  };

  const getTotalPower = () => {
    return areas.reduce((sum, area) => sum + area.totalPower, 0);
  };

  const getTotalArea = () => {
    return areas.reduce((sum, area) => sum + area.area, 0);
  };

  const getAreaTypeColor = (type: string) => {
    switch (type) {
      case 'roof': return 'bg-red-100 text-red-800';
      case 'ground': return 'bg-green-100 text-green-800';
      case 'structure': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAreaTypeLabel = (type: string) => {
    switch (type) {
      case 'roof': return 'Telhado';
      case 'ground': return 'Solo';
      case 'structure': return 'Estrutura';
      default: return 'Outro';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-4 right-4 z-20 w-96">
      <Card className="bg-white/95 backdrop-blur-sm shadow-xl max-h-[80vh] overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Layers className="w-5 h-5 text-blue-500" />
              Áreas de Montagem
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 overflow-y-auto max-h-[calc(80vh-120px)]">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm text-gray-600">Total de Áreas</div>
              <div className="text-xl font-semibold">{areas.length}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Potência Total</div>
              <div className="text-xl font-semibold">{getTotalPower().toFixed(1)} kWp</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Área Total</div>
              <div className="text-xl font-semibold">{getTotalArea().toFixed(1)} m²</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Módulos</div>
              <div className="text-xl font-semibold">
                {areas.reduce((sum, area) => sum + area.moduleCount, 0)}
              </div>
            </div>
          </div>

          {/* Create New Area */}
          <Button 
            onClick={onCreateArea}
            className="w-full"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Área de Montagem
          </Button>

          {/* Areas List */}
          <div className="space-y-3">
            {areas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Layers className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma área de montagem definida</p>
                <p className="text-sm">Clique em "Nova Área" para começar</p>
              </div>
            ) : (
              areas.map((area) => (
                <Card 
                  key={area.id}
                  className={`p-3 cursor-pointer transition-all ${
                    selectedAreaId === area.id 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => onAreaSelect(area.id)}
                >
                  {editingArea === area.id ? (
                    /* Edit Mode */
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Input
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="font-medium"
                          placeholder="Nome da área"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Tipo</Label>
                          <Select 
                            value={editForm.type} 
                            onValueChange={(value) => setEditForm({ ...editForm, type: value as any })}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="roof">Telhado</SelectItem>
                              <SelectItem value="ground">Solo</SelectItem>
                              <SelectItem value="structure">Estrutura</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-xs">Área (m²)</Label>
                          <Input
                            type="number"
                            value={editForm.area || ''}
                            onChange={(e) => setEditForm({ ...editForm, area: parseFloat(e.target.value) })}
                            className="h-8"
                          />
                        </div>

                        <div>
                          <Label className="text-xs">Inclinação (°)</Label>
                          <Input
                            type="number"
                            value={editForm.tilt || ''}
                            onChange={(e) => setEditForm({ ...editForm, tilt: parseFloat(e.target.value) })}
                            className="h-8"
                          />
                        </div>

                        <div>
                          <Label className="text-xs">Azimute (°)</Label>
                          <Input
                            type="number"
                            value={editForm.azimuth || ''}
                            onChange={(e) => setEditForm({ ...editForm, azimuth: parseFloat(e.target.value) })}
                            className="h-8"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveEdit}>
                          Salvar
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode */
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{area.name}</h4>
                          <Badge className={getAreaTypeColor(area.type)} variant="secondary">
                            {getAreaTypeLabel(area.type)}
                          </Badge>
                        </div>
                        
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleAreaVisibility(area.id);
                            }}
                          >
                            {area.visible ? 
                              <Eye className="w-3 h-3" /> : 
                              <EyeOff className="w-3 h-3" />
                            }
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEdit(area);
                            }}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAreaDelete(area.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Área:</span> {area.area.toFixed(1)} m²
                        </div>
                        <div>
                          <span className="text-gray-600">Potência:</span> {area.totalPower.toFixed(1)} kWp
                        </div>
                        <div>
                          <span className="text-gray-600">Inclinação:</span> {area.tilt}°
                        </div>
                        <div>
                          <span className="text-gray-600">Azimute:</span> {area.azimuth}°
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-600">Módulos:</span> {area.moduleCount} × {area.modulePower}Wp
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
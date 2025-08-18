import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Filter, 
  X, 
  Calendar,
  DollarSign,
  Zap,
  Users,
  Building,
  Search,
  RotateCcw
} from 'lucide-react';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { Calendar as CalendarComponent } from '../ui/calendar';
import { Slider } from '../ui/slider';
import { TagInput } from '../ui/tag-input';

import { 
  LeadStage, 
  DefaultLeadStage, 
  LeadSource,
  LEAD_STAGE_LABELS, 
  LEAD_SOURCE_LABELS 
} from '../../types/lead';

export interface CRMFilterState {
  searchTerm: string;
  stages: LeadStage[];
  sources: LeadSource[];
  clientTypes: ('B2B' | 'B2C')[];
  tags: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  valueRange: {
    min: number;
    max: number;
  };
  powerRange: {
    min: number;
    max: number;
  };
  hasNotes: boolean | null;
  hasDeadline: boolean | null;
  isActive: boolean;
}

interface CRMAdvancedFiltersProps {
  filters: CRMFilterState;
  onFiltersChange: (filters: CRMFilterState) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const initialFilters: CRMFilterState = {
  searchTerm: '',
  stages: [],
  sources: [],
  clientTypes: [],
  tags: [],
  dateRange: { start: null, end: null },
  valueRange: { min: 0, max: 1000000 },
  powerRange: { min: 0, max: 100 },
  hasNotes: null,
  hasDeadline: null,
  isActive: false
};

export const CRMAdvancedFilters: React.FC<CRMAdvancedFiltersProps> = ({
  filters,
  onFiltersChange,
  isOpen,
  onToggle
}) => {
  const [localFilters, setLocalFilters] = useState<CRMFilterState>(filters);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const applyFilters = () => {
    const isActive = !!(
      localFilters.searchTerm ||
      localFilters.stages.length > 0 ||
      localFilters.sources.length > 0 ||
      localFilters.clientTypes.length > 0 ||
      localFilters.tags.length > 0 ||
      localFilters.dateRange.start ||
      localFilters.dateRange.end ||
      localFilters.valueRange.min > 0 ||
      localFilters.valueRange.max < 1000000 ||
      localFilters.powerRange.min > 0 ||
      localFilters.powerRange.max < 100 ||
      localFilters.hasNotes !== null ||
      localFilters.hasDeadline !== null
    );

    onFiltersChange({
      ...localFilters,
      isActive
    });
  };

  const clearFilters = () => {
    const clearedFilters = { ...initialFilters };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const updateLocalFilters = (updates: Partial<CRMFilterState>) => {
    setLocalFilters(prev => ({ ...prev, ...updates }));
  };

  const toggleStage = (stage: LeadStage) => {
    const currentStages = localFilters.stages;
    const newStages = currentStages.includes(stage)
      ? currentStages.filter(s => s !== stage)
      : [...currentStages, stage];
    updateLocalFilters({ stages: newStages });
  };

  const toggleSource = (source: LeadSource) => {
    const currentSources = localFilters.sources;
    const newSources = currentSources.includes(source)
      ? currentSources.filter(s => s !== source)
      : [...currentSources, source];
    updateLocalFilters({ sources: newSources });
  };

  const toggleClientType = (type: 'B2B' | 'B2C') => {
    const currentTypes = localFilters.clientTypes;
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    updateLocalFilters({ clientTypes: newTypes });
  };

  const getActiveFilterCount = (): number => {
    let count = 0;
    if (localFilters.searchTerm) count++;
    if (localFilters.stages.length > 0) count++;
    if (localFilters.sources.length > 0) count++;
    if (localFilters.clientTypes.length > 0) count++;
    if (localFilters.dateRange.start || localFilters.dateRange.end) count++;
    if (localFilters.valueRange.min > 0 || localFilters.valueRange.max < 1000000) count++;
    if (localFilters.powerRange.min > 0 || localFilters.powerRange.max < 100) count++;
    if (localFilters.hasNotes !== null) count++;
    if (localFilters.hasDeadline !== null) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="space-y-4">
      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onToggle}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtros Avançados
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Limpar Filtros
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      <AnimatePresence>
        {activeFilterCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2"
          >
            {localFilters.searchTerm && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Search className="h-3 w-3" />
                {localFilters.searchTerm}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateLocalFilters({ searchTerm: '' })}
                />
              </Badge>
            )}
            
            {localFilters.stages.map(stage => (
              <Badge key={stage} variant="secondary" className="flex items-center gap-1">
                {LEAD_STAGE_LABELS[stage as DefaultLeadStage] || stage}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => toggleStage(stage)}
                />
              </Badge>
            ))}

            {localFilters.sources.map(source => (
              <Badge key={source} variant="secondary" className="flex items-center gap-1">
                {LEAD_SOURCE_LABELS[source] || source}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => toggleSource(source)}
                />
              </Badge>
            ))}

            {localFilters.clientTypes.map(type => (
              <Badge key={type} variant="secondary" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {type === 'B2B' ? 'Empresas' : 'Pessoa Física'}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => toggleClientType(type)}
                />
              </Badge>
            ))}

            {(localFilters.tags || []).map(tag => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                #{tag}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateLocalFilters({ 
                    tags: (localFilters.tags || []).filter(t => t !== tag) 
                  })}
                />
              </Badge>
            ))}

            {(localFilters.dateRange.start || localFilters.dateRange.end) && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Período
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateLocalFilters({ dateRange: { start: null, end: null } })}
                />
              </Badge>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filtros Avançados
                  </span>
                  <Button variant="ghost" size="sm" onClick={onToggle}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Search */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Busca por Texto</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Nome, email, empresa, notas..."
                      value={localFilters.searchTerm}
                      onChange={(e) => updateLocalFilters({ searchTerm: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Stages */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Estágios</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(LEAD_STAGE_LABELS).map(([stage, label]) => (
                      <Button
                        key={stage}
                        variant={localFilters.stages.includes(stage as LeadStage) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleStage(stage as LeadStage)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Sources */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fontes</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(LEAD_SOURCE_LABELS).map(([source, label]) => (
                      <Button
                        key={source}
                        variant={localFilters.sources.includes(source as LeadSource) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleSource(source as LeadSource)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Client Types */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de Cliente</label>
                  <div className="flex gap-2">
                    <Button
                      variant={localFilters.clientTypes.includes('B2B') ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleClientType('B2B')}
                      className="flex items-center gap-2"
                    >
                      <Building className="h-4 w-4" />
                      Empresas (B2B)
                    </Button>
                    <Button
                      variant={localFilters.clientTypes.includes('B2C') ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleClientType('B2C')}
                      className="flex items-center gap-2"
                    >
                      <Users className="h-4 w-4" />
                      Pessoa Física (B2C)
                    </Button>
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tags</label>
                  <TagInput
                    value={localFilters.tags || []}
                    onChange={(tags) => updateLocalFilters({ tags })}
                    placeholder="Adicionar tag para filtrar..."
                    className="w-full"
                  />
                </div>

                {/* Date Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Período de Criação
                  </label>
                  <div className="flex gap-2">
                    <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="flex-1">
                          {localFilters.dateRange.start 
                            ? localFilters.dateRange.start.toLocaleDateString('pt-BR')
                            : 'Data início'
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={localFilters.dateRange.start || undefined}
                          onSelect={(date) => {
                            updateLocalFilters({ 
                              dateRange: { ...localFilters.dateRange, start: date || null }
                            });
                            setStartDateOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="flex-1">
                          {localFilters.dateRange.end 
                            ? localFilters.dateRange.end.toLocaleDateString('pt-BR')
                            : 'Data fim'
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={localFilters.dateRange.end || undefined}
                          onSelect={(date) => {
                            updateLocalFilters({ 
                              dateRange: { ...localFilters.dateRange, end: date || null }
                            });
                            setEndDateOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Value Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Faixa de Valor Estimado
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500 w-20">
                        R$ {localFilters.valueRange.min.toLocaleString('pt-BR')}
                      </span>
                      <Slider
                        value={[localFilters.valueRange.min, localFilters.valueRange.max]}
                        onValueChange={([min, max]) => 
                          updateLocalFilters({ valueRange: { min, max } })
                        }
                        max={1000000}
                        step={5000}
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-500 w-20">
                        R$ {localFilters.valueRange.max.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Power Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Faixa de Potência (kWp)
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500 w-16">
                        {localFilters.powerRange.min} kWp
                      </span>
                      <Slider
                        value={[localFilters.powerRange.min, localFilters.powerRange.max]}
                        onValueChange={([min, max]) => 
                          updateLocalFilters({ powerRange: { min, max } })
                        }
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-500 w-16">
                        {localFilters.powerRange.max} kWp
                      </span>
                    </div>
                  </div>
                </div>

                {/* Additional Filters */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Filtros Adicionais</label>
                  <div className="flex gap-2">
                    <Select 
                      value={localFilters.hasNotes === null ? 'any' : localFilters.hasNotes.toString()}
                      onValueChange={(value) => 
                        updateLocalFilters({ 
                          hasNotes: value === 'any' ? null : value === 'true' 
                        })
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Com/sem notas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Qualquer</SelectItem>
                        <SelectItem value="true">Com notas</SelectItem>
                        <SelectItem value="false">Sem notas</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select 
                      value={localFilters.hasDeadline === null ? 'any' : localFilters.hasDeadline.toString()}
                      onValueChange={(value) => 
                        updateLocalFilters({ 
                          hasDeadline: value === 'any' ? null : value === 'true' 
                        })
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Com/sem prazo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Qualquer</SelectItem>
                        <SelectItem value="true">Com prazo</SelectItem>
                        <SelectItem value="false">Sem prazo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button onClick={applyFilters} className="flex-1">
                    Aplicar Filtros
                  </Button>
                  <Button variant="outline" onClick={clearFilters}>
                    Limpar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
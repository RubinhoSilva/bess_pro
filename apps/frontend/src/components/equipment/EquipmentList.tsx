import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Edit, Trash2, Package, Unplug, Search, Lock, ChevronLeft, ChevronRight
} from 'lucide-react';
import { SolarModule, Inverter } from '@bess-pro/shared';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface EquipmentListProps {
  modules: SolarModule[];
  inverters: Inverter[];
  onEditModule: (module: SolarModule) => void;
  onEditInverter: (inverter: Inverter) => void;
  onDeleteModule: (module: SolarModule) => void;
  onDeleteInverter: (inverter: Inverter) => void;
  onAddModule: () => void;
  onAddInverter: () => void;
}

type ActiveTab = 'modules' | 'inverters';
type SortField = 'model' | 'manufacturer' | 'power' | 'efficiency';
type SortOrder = 'asc' | 'desc';

const ITEMS_PER_PAGE = 10;

export const EquipmentList: React.FC<EquipmentListProps> = ({
  modules,
  inverters,
  onEditModule,
  onEditInverter,
  onDeleteModule,
  onDeleteInverter,
  onAddModule,
  onAddInverter
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('modules');
  const [moduleSearchTerm, setModuleSearchTerm] = useState('');
  const [inverterSearchTerm, setInverterSearchTerm] = useState('');
  const [moduleSortField, setModuleSortField] = useState<SortField>('model');
  const [moduleSortOrder, setModuleSortOrder] = useState<SortOrder>('asc');
  const [inverterSortField, setInverterSortField] = useState<SortField>('model');
  const [inverterSortOrder, setInverterSortOrder] = useState<SortOrder>('asc');
  const [moduleCurrentPage, setModuleCurrentPage] = useState(1);
  const [inverterCurrentPage, setInverterCurrentPage] = useState(1);

  // Configuração das abas
  const tabs = [
    {
      id: 'modules' as const,
      label: 'Módulos Solares',
      icon: <Package className="w-4 h-4" />,
      count: modules.length
    },
    {
      id: 'inverters' as const,
      label: 'Inversores',
      icon: <Unplug className="w-4 h-4" />,
      count: inverters.length
    }
  ];

  // Filtrar e ordenar módulos
  const filteredModules = useMemo(() => {
    let filtered = modules;

    // Filtrar por termo de busca
    if (moduleSearchTerm) {
      filtered = filtered.filter(module =>
        module.model.toLowerCase().includes(moduleSearchTerm.toLowerCase()) ||
        module.manufacturer.name.toLowerCase().includes(moduleSearchTerm.toLowerCase())
      );
    }

    // Ordenar
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (moduleSortField) {
        case 'model':
          aValue = a.model;
          bValue = b.model;
          break;
        case 'manufacturer':
          aValue = a.manufacturer.name;
          bValue = b.manufacturer.name;
          break;
        case 'power':
          aValue = a.nominalPower;
          bValue = b.nominalPower;
          break;
        case 'efficiency':
          aValue = a.specifications.efficiency || 0;
          bValue = b.specifications.efficiency || 0;
          break;
        default:
          aValue = a.model;
          bValue = b.model;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return moduleSortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return moduleSortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return filtered;
  }, [modules, moduleSearchTerm, moduleSortField, moduleSortOrder]);

  // Filtrar e ordenar inversores
  const filteredInverters = useMemo(() => {
    let filtered = inverters;

    // Filtrar por termo de busca
    if (inverterSearchTerm) {
      filtered = filtered.filter(inverter =>
        inverter.model.toLowerCase().includes(inverterSearchTerm.toLowerCase()) ||
        inverter.manufacturer.name.toLowerCase().includes(inverterSearchTerm.toLowerCase())
      );
    }

    // Ordenar
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (inverterSortField) {
        case 'model':
          aValue = a.model;
          bValue = b.model;
          break;
        case 'manufacturer':
          aValue = a.manufacturer.name;
          bValue = b.manufacturer.name;
          break;
        case 'power':
          aValue = a.power?.ratedACPower || 0;
          bValue = b.power?.ratedACPower || 0;
          break;
        case 'efficiency':
          aValue = a.electrical?.maxEfficiency || 0;
          bValue = b.electrical?.maxEfficiency || 0;
          break;
        default:
          aValue = a.model;
          bValue = b.model;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return inverterSortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return inverterSortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return filtered;
  }, [inverters, inverterSearchTerm, inverterSortField, inverterSortOrder]);

  // Paginação
  const moduleTotalPages = Math.ceil(filteredModules.length / ITEMS_PER_PAGE);
  const inverterTotalPages = Math.ceil(filteredInverters.length / ITEMS_PER_PAGE);
  
  const paginatedModules = useMemo(() => {
    const startIndex = (moduleCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredModules.slice(startIndex, endIndex);
  }, [filteredModules, moduleCurrentPage]);

  const paginatedInverters = useMemo(() => {
    const startIndex = (inverterCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredInverters.slice(startIndex, endIndex);
  }, [filteredInverters, inverterCurrentPage]);

  // Resetar página quando os filtros mudam
  React.useEffect(() => {
    setModuleCurrentPage(1);
  }, [moduleSearchTerm, moduleSortField, moduleSortOrder]);

  React.useEffect(() => {
    setInverterCurrentPage(1);
  }, [inverterSearchTerm, inverterSortField, inverterSortOrder]);

  const handleSort = (field: SortField, type: 'modules' | 'inverters') => {
    if (type === 'modules') {
      if (moduleSortField === field) {
        setModuleSortOrder(moduleSortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        setModuleSortField(field);
        setModuleSortOrder('asc');
      }
    } else {
      if (inverterSortField === field) {
        setInverterSortOrder(inverterSortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        setInverterSortField(field);
        setInverterSortOrder('asc');
      }
    }
  };

  // Componente de ações para módulos
  const ModuleActions: React.FC<{ module: SolarModule }> = ({ module }) => {
    const isPublic = (module as any).isPublic === true;
    
    return (
      <div className="flex gap-2">
        {isPublic ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" disabled>
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Equipamento público não pode ser editado</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => onEditModule(module)}>
            <Edit className="h-4 w-4" />
          </Button>
        )}
        
        {isPublic ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" disabled>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Equipamento público não pode ser removido</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => onDeleteModule(module)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };

  // Componente de ações para inversores
  const InverterActions: React.FC<{ inverter: Inverter }> = ({ inverter }) => {
    const isPublic = (inverter as any).isPublic === true;
    
    return (
      <div className="flex gap-2">
        {isPublic ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" disabled>
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Equipamento público não pode ser editado</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => onEditInverter(inverter)}>
            <Edit className="h-4 w-4" />
          </Button>
        )}
        
        {isPublic ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" disabled>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Equipamento público não pode ser removido</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => onDeleteInverter(inverter)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };

  // Componente de paginação
  const Pagination: React.FC<{
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    itemName: string;
    totalItems: number;
  }> = ({ currentPage, totalPages, onPageChange, itemName, totalItems }) => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-600">
          Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a{' '}
          {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} de{' '}
          {totalItems} {itemName}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <span className="text-sm">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Próxima
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho com Abas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            {/* Abas */}
            <div className="flex space-x-1 bg-muted p-1 rounded-lg">
              {tabs.map(tab => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2"
                >
                  {tab.icon}
                  {tab.label}
                  <Badge variant="secondary">{tab.count}</Badge>
                </Button>
              ))}
            </div>
            
            {/* Botão de adicionar específico da aba */}
            {activeTab === 'modules' && (
              <Button onClick={onAddModule} size="sm">
                <Package className="w-4 h-4 mr-2" />
                Novo Módulo
              </Button>
            )}
            {activeTab === 'inverters' && (
              <Button onClick={onAddInverter} size="sm">
                <Unplug className="w-4 h-4 mr-2" />
                Novo Inversor
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Conteúdo da Aba Ativa */}
      {activeTab === 'modules' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Módulos Solares ({filteredModules.length})
            </CardTitle>
            
            {/* Filtros específicos para módulos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar módulos..."
                  value={moduleSearchTerm}
                  onChange={(e) => setModuleSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select
                value={moduleSortField}
                onValueChange={(value: SortField) => handleSort(value, 'modules')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="model">Modelo</SelectItem>
                  <SelectItem value="manufacturer">Fabricante</SelectItem>
                  <SelectItem value="power">Potência</SelectItem>
                  <SelectItem value="efficiency">Eficiência</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={moduleSortOrder}
                onValueChange={(value: SortOrder) => setModuleSortOrder(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ordem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Crescente</SelectItem>
                  <SelectItem value="desc">Decrescente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          
          <CardContent>
            {paginatedModules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum módulo encontrado.
              </div>
            ) : (
              <div className="space-y-2">
                {paginatedModules.map((module) => (
                  <div
                    key={module.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="font-medium">{module.model}</div>
                        <div className="text-sm text-gray-600">
                          {module.manufacturer.name} • {module.nominalPower}W • {module.specifications.efficiency}%
                        </div>
                        {module.specifications.cellType && (
                          <div className="text-xs text-gray-500">{module.specifications.cellType}</div>
                        )}
                        {(module as any).isPublic === true && (
                          <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                            <Lock className="h-3 w-3" />
                            Equipamento público
                          </div>
                        )}
                      </div>
                    </div>
                    <ModuleActions module={module} />
                  </div>
                ))}
              </div>
            )}
            
            <Pagination
              currentPage={moduleCurrentPage}
              totalPages={moduleTotalPages}
              onPageChange={setModuleCurrentPage}
              itemName="módulos"
              totalItems={filteredModules.length}
            />
          </CardContent>
        </Card>
      )}

      {activeTab === 'inverters' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Unplug className="w-5 h-5 text-purple-600" />
              Inversores ({filteredInverters.length})
            </CardTitle>
            
            {/* Filtros específicos para inversores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar inversores..."
                  value={inverterSearchTerm}
                  onChange={(e) => setInverterSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select
                value={inverterSortField}
                onValueChange={(value: SortField) => handleSort(value, 'inverters')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="model">Modelo</SelectItem>
                  <SelectItem value="manufacturer">Fabricante</SelectItem>
                  <SelectItem value="power">Potência</SelectItem>
                  <SelectItem value="efficiency">Eficiência</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={inverterSortOrder}
                onValueChange={(value: SortOrder) => setInverterSortOrder(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ordem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Crescente</SelectItem>
                  <SelectItem value="desc">Decrescente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          
          <CardContent>
            {paginatedInverters.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum inversor encontrado.
              </div>
            ) : (
              <div className="space-y-2">
                {paginatedInverters.map((inverter) => (
                  <div
                    key={inverter.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-purple-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Unplug className="w-5 h-5 text-purple-600" />
                      <div>
                        <div className="font-medium">{inverter.model}</div>
                        <div className="text-sm text-gray-600">
                          {inverter.manufacturer.name} • {inverter.power?.ratedACPower}W • {inverter.electrical?.maxEfficiency}%
                        </div>
                        {inverter.electrical?.gridType && (
                          <div className="text-xs text-gray-500">{inverter.electrical.gridType}</div>
                        )}
                        {(inverter as any).isPublic === true && (
                          <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                            <Lock className="h-3 w-3" />
                            Equipamento público
                          </div>
                        )}
                      </div>
                    </div>
                    <InverterActions inverter={inverter} />
                  </div>
                ))}
              </div>
            )}
            
            <Pagination
              currentPage={inverterCurrentPage}
              totalPages={inverterTotalPages}
              onPageChange={setInverterCurrentPage}
              itemName="inversores"
              totalItems={filteredInverters.length}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EquipmentList;
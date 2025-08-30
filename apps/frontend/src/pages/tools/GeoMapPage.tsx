import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Satellite, Layers, Search, Download, Share2, Settings, ExternalLink, Zap, Battery, Lightbulb } from 'lucide-react';
import MapSelector from '../../components/pv-design/form-sections/MapSelector';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import toast from 'react-hot-toast';
import { useProjects } from '../../hooks/project-hooks';
import type { Project } from '../../types/project';

interface LocationData {
  lat: number;
  lng: number;
  address?: string;
  timestamp: Date;
  notes?: string;
}

// Mapeamento de tipos para apresentação
const projectTypeLabels: Record<string, string> = {
  'pv': 'Solar',
  'bess': 'BESS',
  'hybrid': 'Híbrido'
};

const projectTypeIcons: Record<string, React.ComponentType<any>> = {
  'pv': Zap,
  'bess': Battery,
  'hybrid': Lightbulb
};

const GeoMapPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [savedLocations, setSavedLocations] = useState<LocationData[]>([]);
  const [mapType, setMapType] = useState<'street' | 'satellite' | 'hybrid'>('street');
  const [activeTab, setActiveTab] = useState('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  
  // Load projects from API with location data
  const { data: projectsData, isLoading: loadingProjects } = useProjects({
    hasLocation: true, // Only projects with location data
    pageSize: 100, // Maximum allowed by backend validation
  });

  // Handle location selection from map
  const handleLocationSelect = useCallback((location: { lat: number; lng: number; address?: string }) => {
    const locationData: LocationData = {
      lat: location.lat,
      lng: location.lng,
      address: location.address,
      timestamp: new Date(),
    };
    
    setSelectedLocation(locationData);
    toast.success('Localização selecionada!');
  }, []);

  // Save current location
  const handleSaveLocation = useCallback(() => {
    if (!selectedLocation) return;
    
    setSavedLocations(prev => [...prev, { ...selectedLocation, timestamp: new Date() }]);
    toast.success('Localização salva!');
  }, [selectedLocation]);

  // Navigate to project details
  const handleNavigateToProject = useCallback((project: any) => {
    navigate(`/projects/${project.id}`);
  }, [navigate]);

  // Create new project at location (navigate to create page with location data)
  const handleCreateProject = useCallback((location: LocationData) => {
    // Navigate to create project page with location data in state
    navigate('/projects/new', {
      state: {
        location: {
          latitude: location.lat,
          longitude: location.lng,
          address: location.address
        }
      }
    });
  }, [navigate]);

  // Export location data
  const handleExportLocation = useCallback(() => {
    if (!selectedLocation) return;

    const data = {
      location: selectedLocation,
      exportedAt: new Date().toISOString(),
      coordinates: `${selectedLocation.lat}, ${selectedLocation.lng}`,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `location_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Dados exportados!');
  }, [selectedLocation]);

  // Share location
  const handleShareLocation = useCallback(() => {
    if (!selectedLocation) return;

    const shareUrl = `https://maps.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copiado para área de transferência!');
  }, [selectedLocation]);

  // Extract projects with location from API data
  const projectsWithLocation = useMemo(() => {
    if (!projectsData?.projects) return [];
    
    return projectsData.projects.filter(project => {
      // Check if project has location in either root or projectData
      const hasRootLocation = (project as any).location?.latitude && (project as any).location?.longitude;
      const hasProjectDataLocation = (project as any).projectData?.location?.latitude && (project as any).projectData?.location?.longitude;
      return hasRootLocation || hasProjectDataLocation;
    });
  }, [projectsData]);

  // Filter projects
  const filteredProjects = useMemo(() => {
    return projectsWithLocation.filter(project => {
      const matchesFilter = projectFilter === 'all' || project.projectType === projectFilter;
      const matchesSearch = project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           project.address?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [projectsWithLocation, projectFilter, searchQuery]);

  // Convert projects to map pins
  const projectPins = useMemo(() => {
    return projectsWithLocation.map(project => {
      const location = (project as any).location || (project as any).projectData?.location;
      if (!location?.latitude || !location?.longitude) return null;
      
      return {
        id: project.id,
        name: project.projectName,
        lat: location.latitude,
        lng: location.longitude,
        type: project.projectType as 'pv' | 'bess' | 'hybrid',
        onClick: (pin: any) => {
          // When clicking a pin, select it on the map and navigate to project
          setSelectedLocation({
            lat: pin.lat,
            lng: pin.lng,
            address: project.address || location.address,
            timestamp: new Date()
          });
          handleNavigateToProject(project);
        }
      };
    }).filter(Boolean) as Array<{
      id: string;
      name: string;
      lat: number;
      lng: number;
      type: 'pv' | 'bess' | 'hybrid';
      onClick: (pin: any) => void;
    }>;
  }, [projectsWithLocation, handleNavigateToProject]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 h-full"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <MapPin className="w-8 h-8 text-blue-600" />
              Geolocalização e Mapas
              {projectsWithLocation.length > 0 && (
                <Badge variant="secondary" className="text-sm">
                  {projectsWithLocation.length} projeto{projectsWithLocation.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Visualize, selecione e gerencie localizações geográficas para seus projetos
              {projectsWithLocation.length > 0 && (
                <span className="block mt-1 text-sm text-blue-600">
                  🎯 Clique nos pins do mapa para navegar diretamente aos projetos
                </span>
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={mapType} onValueChange={(value: any) => setMapType(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="street">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4" />
                    Ruas
                  </div>
                </SelectItem>
                <SelectItem value="satellite">
                  <div className="flex items-center gap-2">
                    <Satellite className="w-4 h-4" />
                    Satélite
                  </div>
                </SelectItem>
                <SelectItem value="hybrid">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Híbrido
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Map Container */}
        <div className="lg:col-span-2">
          <Card className="h-[calc(100vh-200px)]">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Mapa Interativo
                </span>
                
                {selectedLocation && (
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleSaveLocation}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Salvar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleExportLocation}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Exportar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleShareLocation}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Compartilhar
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-full">
              <div className="h-full pb-6 px-6">
                <MapSelector
                  onSelect={handleLocationSelect}
                  height="calc(100vh - 320px)"
                  projectPins={projectPins}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Location Info */}
          {selectedLocation && (
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-green-600" />
                    Localização Atual
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Coordenadas</p>
                    <p className="font-mono text-sm">
                      {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                    </p>
                  </div>
                  
                  {selectedLocation.address && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Endereço</p>
                      <p className="text-sm">{selectedLocation.address}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Selecionado em</p>
                    <p className="text-sm">{selectedLocation.timestamp.toLocaleString()}</p>
                  </div>
                  
                  <Button 
                    onClick={() => handleCreateProject(selectedLocation)} 
                    className="w-full"
                  >
                    Criar Projeto Aqui
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Tabs for saved locations and projects */}
          <motion.div variants={itemVariants}>
            <Card className="h-96">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                <CardHeader className="pb-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="saved">Locais Salvos</TabsTrigger>
                    <TabsTrigger value="projects">Projetos</TabsTrigger>
                  </TabsList>
                </CardHeader>

                <CardContent className="h-full overflow-hidden">
                  <TabsContent value="saved" className="h-full">
                    <div className="space-y-3 h-full overflow-y-auto">
                      {savedLocations.length === 0 ? (
                        <p className="text-center text-gray-500 dark:text-gray-400 mt-8">
                          Nenhum local salvo ainda
                        </p>
                      ) : (
                        savedLocations.map((location, index) => (
                          <div 
                            key={index} 
                            className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                            onClick={() => setSelectedLocation(location)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-sm">
                                  {location.address || 'Localização sem nome'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {location.timestamp.toLocaleDateString()}
                                </p>
                              </div>
                              <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="projects" className="h-full">
                    <div className="space-y-3 h-full">
                      {/* Search and filter */}
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            placeholder="Buscar projetos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-8 text-sm"
                          />
                        </div>
                        <Select value={projectFilter} onValueChange={(value: any) => setProjectFilter(value)}>
                          <SelectTrigger className="w-24 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="pv">Solar</SelectItem>
                            <SelectItem value="bess">BESS</SelectItem>
                            <SelectItem value="hybrid">Híbrido</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Projects list */}
                      <div className="space-y-2 h-full overflow-y-auto">
                        {loadingProjects ? (
                          <p className="text-center text-gray-500 dark:text-gray-400 mt-8">
                            Carregando projetos...
                          </p>
                        ) : filteredProjects.length === 0 ? (
                          <p className="text-center text-gray-500 dark:text-gray-400 mt-8">
                            {projectsWithLocation.length === 0 ? 'Nenhum projeto com localização encontrado' : 'Nenhum projeto encontrado'}
                          </p>
                        ) : (
                          filteredProjects.map((project) => {
                            // Get location data (prioritize root location over projectData location)
                            const location = (project as any).location || (project as any).projectData?.location;
                            const ProjectIcon = projectTypeIcons[project.projectType];
                            
                            return (
                              <div 
                                key={project.id} 
                                className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer group"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2 flex-1">
                                    <ProjectIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                    <h4 className="font-medium text-sm truncate">{project.projectName}</h4>
                                  </div>
                                  <div className="flex gap-1">
                                    <Badge variant="secondary" className="text-xs">
                                      {projectTypeLabels[project.projectType]}
                                    </Badge>
                                  </div>
                                </div>
                                
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 truncate">
                                  {project.address || location?.address || 'Sem endereço'}
                                </p>
                                
                                {location && (
                                  <p className="text-xs text-gray-400 font-mono mb-2">
                                    {location.latitude?.toFixed(4)}, {location.longitude?.toFixed(4)}
                                  </p>
                                )}
                                
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-xs h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (location) {
                                        setSelectedLocation({
                                          lat: location.latitude!,
                                          lng: location.longitude!,
                                          address: project.address || location.address,
                                          timestamp: new Date()
                                        });
                                      }
                                    }}
                                  >
                                    <MapPin className="w-3 h-3 mr-1" />
                                    Ver no Mapa
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-xs h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleNavigateToProject(project);
                                    }}
                                  >
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    Abrir
                                  </Button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GeoMapPage;
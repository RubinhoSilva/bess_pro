import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Satellite, Layers, Search, Download, Share2, Settings } from 'lucide-react';
import MapSelector from '../../components/pv-design/form-sections/MapSelector';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import toast from 'react-hot-toast';

interface LocationData {
  lat: number;
  lng: number;
  address?: string;
  timestamp: Date;
  notes?: string;
}

interface Project {
  id: string;
  name: string;
  location: LocationData;
  type: 'solar' | 'bess' | 'hybrid';
  status: 'active' | 'completed' | 'planned';
}

const GeoMapPage: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [savedLocations, setSavedLocations] = useState<LocationData[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [mapType, setMapType] = useState<'street' | 'satellite' | 'hybrid'>('street');
  const [activeTab, setActiveTab] = useState('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState<'all' | 'solar' | 'bess' | 'hybrid'>('all');

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

  // Create project from location
  const handleCreateProject = useCallback((location: LocationData) => {
    const projectName = prompt('Nome do projeto:');
    if (!projectName) return;

    const newProject: Project = {
      id: Date.now().toString(),
      name: projectName,
      location,
      type: 'solar',
      status: 'planned',
    };

    setProjects(prev => [...prev, newProject]);
    toast.success(`Projeto "${projectName}" criado!`);
  }, []);

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

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const matchesFilter = projectFilter === 'all' || project.type === projectFilter;
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.location.address?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Visualize, selecione e gerencie localizações geográficas para seus projetos
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
                            <SelectItem value="solar">Solar</SelectItem>
                            <SelectItem value="bess">BESS</SelectItem>
                            <SelectItem value="hybrid">Híbrido</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Projects list */}
                      <div className="space-y-2 h-full overflow-y-auto">
                        {filteredProjects.length === 0 ? (
                          <p className="text-center text-gray-500 dark:text-gray-400 mt-8">
                            {projects.length === 0 ? 'Nenhum projeto criado ainda' : 'Nenhum projeto encontrado'}
                          </p>
                        ) : (
                          filteredProjects.map((project) => (
                            <div 
                              key={project.id} 
                              className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                              onClick={() => setSelectedLocation(project.location)}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-sm">{project.name}</h4>
                                <div className="flex gap-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {project.type}
                                  </Badge>
                                  <Badge 
                                    variant={project.status === 'active' ? 'default' : 'outline'}
                                    className="text-xs"
                                  >
                                    {project.status}
                                  </Badge>
                                </div>
                              </div>
                              
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {project.location.address || 'Sem endereço'}
                              </p>
                              <p className="text-xs text-gray-400 font-mono mt-1">
                                {project.location.lat.toFixed(4)}, {project.location.lng.toFixed(4)}
                              </p>
                            </div>
                          ))
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
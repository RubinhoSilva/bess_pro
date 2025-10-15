import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings, Save, Share2, Download } from 'lucide-react';
import { Viewer3D } from '@/components/viewer-3d/Viewer3D';
import { useDimensioningOperations } from '@/hooks/dimensioning';
import toast from 'react-hot-toast';

// Componente interno que tem acesso ao DimensioningContext
function Model3DViewerPageContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [dimensioningId, setDimensioningId] = useState<string | null>(null);
  const [currentDimensioning, setCurrentDimensioning] = useState<any>({});
  const { saveAsync: saveDimensioning } = useDimensioningOperations(dimensioningId);
  
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string>();

  // Get initial model URL from query params
  const initialModelUrl = searchParams.get('model') || currentDimensioning.modelo3dUrl;
  
  // Get location from dimensioning data
  const latitude = currentDimensioning.latitude || -23.5505;
  const longitude = currentDimensioning.longitude || -46.6333;

  useEffect(() => {
    // Load existing areas from dimensioning context if available
    if (currentDimensioning.mountingAreas) {
      setAreas(currentDimensioning.mountingAreas);
    }
  }, [currentDimensioning.mountingAreas]);

  const handleMeasurement = (measurement: any) => {
    const newMeasurement = {
      id: `measurement-${Date.now()}`,
      ...measurement,
      timestamp: new Date().toISOString()
    };
    
    setMeasurements(prev => [...prev, newMeasurement]);
    toast.success(`Distância medida: ${measurement.distance.toFixed(2)}m`);
  };

  const handleAreaCreate = (area: any) => {
    setAreas(prev => [...prev, area]);
    toast.success('Nova área de montagem criada');
  };

  const handleAreaSelect = (areaId: string) => {
    setSelectedAreaId(areaId);
    const area = areas.find(a => a.id === areaId);
    if (area) {
      toast.success(`Área selecionada: ${area.name}`);
    }
  };

  const handleSaveProject = () => {
    // Update dimensioning data with 3D data
    setCurrentDimensioning((prev: any) => ({ ...prev,
      mountingAreas: areas,
      measurements: measurements,
      modelo3dUrl: initialModelUrl
    }));
    
    toast.success('Dados 3D salvos no projeto');
  };

  const handleExportData = () => {
    const exportData = {
      model: initialModelUrl,
      areas: areas,
      measurements: measurements,
      location: { latitude, longitude },
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `projeto-3d-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Dados exportados com sucesso');
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          
          <div>
            <h1 className="text-xl font-semibold text-white">
              Visualizador 3D
            </h1>
            <p className="text-sm text-slate-400">
              Análise e dimensionamento em ambiente 3D
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-slate-300 mr-4">
            <span>Medições: {measurements.length}</span>
            <span>Áreas: {areas.length}</span>
          </div>

          {/* Actions */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveProject}
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.share?.({
                title: 'Projeto 3D - BESS Pro',
                text: 'Visualize este projeto em 3D',
                url: window.location.href
              }).catch(() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success('Link copiado!');
              });
            }}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>
        </div>
      </div>

      {/* Main 3D Viewer */}
      <div className="flex-1 relative">
        <Viewer3D
          latitude={latitude}
          longitude={longitude}
          initialModelUrl={initialModelUrl}
          onMeasurement={handleMeasurement}
          onAreaCreate={handleAreaCreate}
          onAreaSelect={handleAreaSelect}
          className="w-full h-full"
        />
      </div>

      {/* Side Panel (optional) */}
      <div className="absolute top-20 right-4 w-80 max-h-[calc(100vh-8rem)] overflow-y-auto">
        {/* Measurements Panel */}
        {measurements.length > 0 && (
          <div className="bg-slate-800/90 border border-slate-600 rounded-lg p-4 backdrop-blur-sm mb-4">
            <h3 className="text-white font-medium mb-2">Medições</h3>
            <div className="space-y-2">
              {measurements.map((measurement) => (
                <div key={measurement.id} className="text-sm text-slate-300 p-2 bg-slate-700/50 rounded">
                  <div className="font-medium">{measurement.distance.toFixed(2)}m</div>
                  <div className="text-xs text-slate-400">
                    {new Date(measurement.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Areas Panel */}
        {areas.length > 0 && (
          <div className="bg-slate-800/90 border border-slate-600 rounded-lg p-4 backdrop-blur-sm">
            <h3 className="text-white font-medium mb-2">Áreas de Montagem</h3>
            <div className="space-y-2">
              {areas.map((area) => (
                <div 
                  key={area.id} 
                  className={`text-sm p-2 rounded cursor-pointer transition-colors ${
                    selectedAreaId === area.id 
                      ? 'bg-blue-600/50 text-blue-200' 
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}
                  onClick={() => handleAreaSelect(area.id)}
                >
                  <div className="font-medium">{area.name}</div>
                  <div className="text-xs opacity-75">
                    {area.geometria?.length || 0} pontos
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente principal - Provider removido (agora usa Zustand)
export default function Model3DViewerPage() {
  return <Model3DViewerPageContent />;
}
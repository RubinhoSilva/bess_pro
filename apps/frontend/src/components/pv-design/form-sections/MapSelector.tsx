import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { LatLng } from 'leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Search, Locate } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix para ícones do Leaflet no Vite
import L from 'leaflet';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

// Custom icons for different project types
const createProjectIcon = (type: 'pv' | 'bess' | 'hybrid') => {
  const colors = {
    pv: '#3b82f6', // blue
    bess: '#10b981', // green  
    hybrid: '#f59e0b' // orange
  };
  
  const svgIcon = `
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 21.9 12.5 41 12.5 41S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0Z" fill="${colors[type]}"/>
      <circle cx="12.5" cy="12.5" r="8" fill="white"/>
      <text x="12.5" y="17" text-anchor="middle" font-size="10" font-weight="bold" fill="${colors[type]}">
        ${type === 'pv' ? '⚡' : type === 'bess' ? '🔋' : '💡'}
      </text>
    </svg>
  `;
  
  return new L.DivIcon({
    html: svgIcon,
    className: 'custom-project-marker',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
};

interface ProjectPin {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'pv' | 'bess' | 'hybrid';
  onClick?: (project: ProjectPin) => void;
}

interface MapSelectorProps {
  onSelect: (location: { lat: number; lng: number; address?: string }) => void;
  initialPosition?: { lat: number; lng: number };
  className?: string;
  height?: string;
  projectPins?: ProjectPin[]; // Add support for project pins
}

interface Position {
  lat: number;
  lng: number;
  address?: string;
}

// Componente interno para capturar cliques no mapa
const MapClickHandler: React.FC<{
  onLocationSelect: (coordinates: { lat: number; lng: number }) => void;
  setMarkerPosition: (pos: LatLng | null) => void;
}> = ({ onLocationSelect, setMarkerPosition }) => {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      setMarkerPosition(e.latlng);
      onLocationSelect({ lat, lng });
    },
  });

  return null;
};

const MapSelector: React.FC<MapSelectorProps> = ({
  onSelect,
  initialPosition = { lat: -14.235004, lng: -51.92528 }, // Centro do Brasil
  className = '',
  height = '400px',
  projectPins = [],
}) => {
  const [markerPosition, setMarkerPosition] = useState<LatLng | null>(
    initialPosition ? new LatLng(initialPosition.lat, initialPosition.lng) : null
  );
  const [position, setPosition] = useState<Position | null>(
    initialPosition ? { lat: initialPosition.lat, lng: initialPosition.lng } : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [currentMapCenter, setCurrentMapCenter] = useState(initialPosition);
  const mapRef = useRef<any>(null);

  // Função para obter localização atual do usuário
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      return;
    }

    setIsLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const newPosition = new LatLng(latitude, longitude);
        
        // Atualizar posições
        setMarkerPosition(newPosition);
        setCurrentMapCenter({ lat: latitude, lng: longitude });
        
        // Obter endereço da localização atual
        const address = await getAddressFromCoordinates(latitude, longitude);
        const coordinatesText = `Latitude: ${latitude.toFixed(4)}, Longitude: ${longitude.toFixed(4)}`;
        
        setPosition({ lat: latitude, lng: longitude, address });
        setSearchQuery(coordinatesText);
        setSearchResults([]);
        
        // Centralizar mapa na nova posição
        if (mapRef.current) {
          mapRef.current.setView(newPosition, 15);
        }
        
        setIsLocatingUser(false);
      },
      (error) => {
        setIsLocatingUser(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutos
      }
    );
  };

  // Detectar localização automaticamente quando o componente for montado
  useEffect(() => {
    // Só detectar se não tem posição inicial definida
    if (!initialPosition || (initialPosition.lat === -14.235004 && initialPosition.lng === -51.92528)) {
      getCurrentLocation();
    }
  }, []);

  // Função para buscar endereços
  const searchLocation = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=br`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      searchLocation(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Função para obter endereço via geocoding reverso
  const getAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
      );
      const data = await response.json();
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  // Handler para clique no mapa
  const handleLocationSelect = async (coordinates: { lat: number; lng: number }) => {
    const address = await getAddressFromCoordinates(coordinates.lat, coordinates.lng);
    const coordinatesText = `Latitude: ${coordinates.lat.toFixed(4)}, Longitude: ${coordinates.lng.toFixed(4)}`;
    const newPosition = { ...coordinates, address };
    setPosition(newPosition);
    setSearchQuery(coordinatesText);
    setSearchResults([]);
  };

  // Selecionar resultado da busca
  const selectSearchResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const leafletPosition = new LatLng(lat, lng);
    const coordinatesText = `Latitude: ${lat.toFixed(4)}, Longitude: ${lng.toFixed(4)}`;
    const newPosition = { lat, lng, address: result.display_name };
    
    setMarkerPosition(leafletPosition);
    setPosition(newPosition);
    setSearchQuery(coordinatesText);
    setSearchResults([]);
    
    // Centralizar mapa na nova posição
    if (mapRef.current) {
      mapRef.current.setView(leafletPosition, 15);
    }
  };

  // Confirmar seleção
  const handleConfirm = () => {
    if (position) {
      onSelect(position);
    }
  };

  return (
    <div className={`w-full flex flex-col ${className}`}>
      {/* Barra de Busca */}
      <div className="mb-4 relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar endereço, cidade ou CEP..."
              className="pl-10 pr-10"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>
          
          <Button
            onClick={getCurrentLocation}
            disabled={isLocatingUser}
            variant="outline"
            size="sm"
            className="border-green-400 text-green-400 hover:bg-green-400/10 min-w-[44px]"
            title="Usar minha localização atual"
          >
            {isLocatingUser ? (
              <div className="animate-spin h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full"></div>
            ) : (
              <Locate className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        {/* Resultados da Busca */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl z-[9999] max-h-60 overflow-y-auto">
            {searchResults.map((result, index) => (
              <button
                key={index}
                onClick={() => selectSearchResult(result)}
                className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-600 last:border-b-0 flex items-start gap-3"
              >
                <MapPin className="w-4 h-4 mt-1 text-gray-400 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                    {result.display_name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {parseFloat(result.lat).toFixed(6)}, {parseFloat(result.lon).toFixed(6)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mapa */}
      <div 
        className="flex-grow border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden" 
        style={{ height: height, minHeight: '300px' }}
      >
        <MapContainer
          center={[currentMapCenter.lat, currentMapCenter.lng]}
          zoom={position ? 15 : 6}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {markerPosition && (
            <Marker position={markerPosition} />
          )}
          
          {/* Project pins */}
          {projectPins.map((pin) => (
            <Marker
              key={pin.id}
              position={[pin.lat, pin.lng]}
              icon={createProjectIcon(pin.type)}
              eventHandlers={{
                click: () => pin.onClick?.(pin),
              }}
            >
              {/* Optional: Add popup with project info */}
              {/* <Popup>
                <div>
                  <h4 className="font-medium">{pin.name}</h4>
                  <p className="text-sm text-gray-500">Tipo: {pin.type}</p>
                </div>
              </Popup> */}
            </Marker>
          ))}
          
          <MapClickHandler 
            onLocationSelect={handleLocationSelect}
            setMarkerPosition={setMarkerPosition}
          />
        </MapContainer>
      </div>

      {/* Informações e Controles */}
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {position ? (
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Localização Selecionada
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  {position.address}
                </div>
                <div className="text-xs font-mono text-gray-500 dark:text-gray-500">
                  {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Clique no mapa ou busque um endereço para selecionar a localização
              </div>
            )}
          </div>
          
          <Button 
            onClick={handleConfirm} 
            disabled={!position}
            className="ml-4"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Confirmar Localização
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MapSelector;
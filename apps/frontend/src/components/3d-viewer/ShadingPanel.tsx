import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Sun, Clock, Calendar, X, Play, Pause } from 'lucide-react';

interface ShadingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onRunAnalysis: (params: ShadingAnalysisParams) => void;
  project?: {
    project_data?: {
      location?: {
        latitude: number;
        longitude: number;
      };
    };
  };
}

export interface ShadingAnalysisParams {
  date: string;
  time: number;
  latitude?: number;
  longitude?: number;
  animationMode?: boolean;
  timeRange?: [number, number];
}

export default function ShadingPanel({ 
  isOpen, 
  onClose, 
  onRunAnalysis, 
  project 
}: ShadingPanelProps) {
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  
  const [time, setTime] = useState([12]); // noon
  const [animationMode, setAnimationMode] = useState(false);
  const [timeRange, setTimeRange] = useState([6, 18]); // 6am to 6pm
  const [isAnimating, setIsAnimating] = useState(false);

  const location = project?.project_data?.location;

  const handleRunAnalysis = () => {
    const params: ShadingAnalysisParams = {
      date,
      time: time[0],
      latitude: location?.latitude,
      longitude: location?.longitude,
      animationMode,
      timeRange: animationMode ? [timeRange[0], timeRange[1]] : undefined
    };
    
    onRunAnalysis(params);
  };

  const formatTime = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  const getSunPosition = () => {
    if (!location) return null;
    
    // Simple sun position calculation for display
    const hour = time[0];
    const elevation = Math.max(0, 90 - Math.abs(hour - 12) * 7.5);
    const azimuth = (hour - 12) * 15; // 15 degrees per hour
    
    return { elevation: Math.round(elevation), azimuth: Math.round(azimuth) };
  };

  const sunPos = getSunPosition();

  if (!isOpen) return null;

  return (
    <div className="absolute top-4 right-4 z-20 w-80">
      <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sun className="w-5 h-5 text-orange-500" />
              Análise de Sombreamento
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!location && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Localização do projeto não definida. 
                Use coordenadas padrão ou defina a localização do projeto.
              </p>
            </div>
          )}

          {/* Date Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Data da Análise
            </Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Time Selection */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Horário: {formatTime(time[0])}
            </Label>
            <Slider
              value={time}
              onValueChange={setTime}
              min={6}
              max={18}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
            </div>
          </div>

          {/* Sun Position Display */}
          {sunPos && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Posição Solar:</span>
                <div className="flex gap-2">
                  <Badge variant="outline">
                    Elevação: {sunPos.elevation}°
                  </Badge>
                  <Badge variant="outline">
                    Azimute: {sunPos.azimuth}°
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Animation Mode */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Modo Animação</Label>
              <Button
                variant={animationMode ? "default" : "outline"}
                size="sm"
                onClick={() => setAnimationMode(!animationMode)}
              >
                {animationMode ? "Ativado" : "Desativado"}
              </Button>
            </div>
            
            {animationMode && (
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">
                  Intervalo: {formatTime(timeRange[0])} - {formatTime(timeRange[1])}
                </Label>
                <Slider
                  value={timeRange}
                  onValueChange={setTimeRange}
                  min={6}
                  max={18}
                  step={1}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* Location Info */}
          {location && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-xs text-green-800">
                <div>Lat: {location.latitude.toFixed(4)}°</div>
                <div>Lng: {location.longitude.toFixed(4)}°</div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button 
              onClick={handleRunAnalysis}
              className="flex-1"
              disabled={!date}
            >
              <Sun className="w-4 h-4 mr-2" />
              {animationMode ? 'Iniciar Animação' : 'Analisar Sombra'}
            </Button>
            
            {animationMode && isAnimating && (
              <Button 
                variant="outline"
                onClick={() => setIsAnimating(false)}
              >
                <Pause className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Info */}
          <div className="text-xs text-gray-500 mt-4">
            <p>
              A análise de sombreamento mostra como as sombras afetam 
              a área de instalação em diferentes horários do dia.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
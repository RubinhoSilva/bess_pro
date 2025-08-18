import React, { useMemo, useState } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Play, Pause, RotateCcw, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import * as SunCalc from 'suncalc';

interface ShadowAnalyzerProps {
  latitude: number;
  longitude: number;
  onTimeChange?: (time: Date) => void;
}

export const ShadowAnalyzer: React.FC<ShadowAnalyzerProps> = ({
  latitude,
  longitude,
  onTimeChange
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeSpeed, setTimeSpeed] = useState(60); // minutes per second

  // Calculate sun position for current time
  const sunPosition = useMemo(() => {
    const sunPos = SunCalc.getPosition(currentTime, latitude, longitude);
    return {
      azimuth: (sunPos.azimuth * 180 / Math.PI) + 180,
      elevation: Math.max(0, sunPos.altitude * 180 / Math.PI),
      visible: sunPos.altitude > 0
    };
  }, [currentTime, latitude, longitude]);

  // Animation loop for time progression
  React.useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentTime(prev => {
        const newTime = new Date(prev.getTime() + timeSpeed * 60 * 1000);
        if (onTimeChange) onTimeChange(newTime);
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, timeSpeed, onTimeChange]);

  const handleTimeSliderChange = (value: number[]) => {
    const hoursInDay = value[0];
    const newTime = new Date(currentTime);
    newTime.setHours(Math.floor(hoursInDay));
    newTime.setMinutes((hoursInDay % 1) * 60);
    setCurrentTime(newTime);
    if (onTimeChange) onTimeChange(newTime);
  };

  const resetToNow = () => {
    const now = new Date();
    setCurrentTime(now);
    if (onTimeChange) onTimeChange(now);
    setIsPlaying(false);
  };

  const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60;

  return (
    <>
      {/* Shadow Analysis UI */}
      <Html position={[0, 15, 0]} portal={{ current: document.body }}>
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
          <div className="bg-slate-800/90 border border-slate-600 rounded-lg p-4 backdrop-blur-sm min-w-96">
            <div className="flex items-center gap-2 mb-3">
              <Sun className="w-5 h-5 text-yellow-400" />
              <span className="text-white font-medium">Análise de Sombreamento</span>
            </div>
            
            {/* Time Display */}
            <div className="text-center mb-4">
              <div className="text-2xl font-mono text-white">
                {currentTime.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
              <div className="text-sm text-slate-300">
                {currentTime.toLocaleDateString()}
              </div>
              <div className="text-xs text-slate-400">
                Sol: {sunPosition.elevation.toFixed(1)}° | {sunPosition.azimuth.toFixed(1)}°
                {!sunPosition.visible && " (Abaixo do horizonte)"}
              </div>
            </div>

            {/* Time Controls */}
            <div className="space-y-4">
              {/* Time Slider */}
              <div>
                <label className="block text-xs text-slate-300 mb-2">
                  Hora do dia: {Math.floor(currentHour)}:{String(Math.floor((currentHour % 1) * 60)).padStart(2, '0')}
                </label>
                <Slider
                  value={[currentHour]}
                  onValueChange={handleTimeSliderChange}
                  max={24}
                  min={0}
                  step={0.25}
                  className="w-full"
                />
              </div>

              {/* Speed Control */}
              <div>
                <label className="block text-xs text-slate-300 mb-2">
                  Velocidade: {timeSpeed} min/s
                </label>
                <Slider
                  value={[timeSpeed]}
                  onValueChange={(value) => setTimeSpeed(value[0])}
                  max={720}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setIsPlaying(!isPlaying)}
                  variant={isPlaying ? "secondary" : "default"}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 mr-1" />
                      Pausar
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-1" />
                      Executar
                    </>
                  )}
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={resetToNow}
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Agora
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Html>

      {/* Dynamic Shadow Visualization */}
      {sunPosition.visible && (
        <>
          {/* Shadow rays for visualization */}
          <group>
            {/* Create shadow rays from sun to ground objects */}
            {Array.from({ length: 5 }).map((_, i) => {
              const angle = (i / 5) * Math.PI * 2;
              const x = Math.cos(angle) * 10;
              const z = Math.sin(angle) * 10;
              
              const sunVector = new THREE.Vector3(
                Math.cos(sunPosition.elevation * Math.PI / 180) * Math.sin(sunPosition.azimuth * Math.PI / 180),
                Math.sin(sunPosition.elevation * Math.PI / 180),
                Math.cos(sunPosition.elevation * Math.PI / 180) * Math.cos(sunPosition.azimuth * Math.PI / 180)
              ).normalize().multiplyScalar(-50);

              return (
                <line key={i}>
                  <bufferGeometry>
                    <bufferAttribute
                      attach="attributes-position"
                      count={2}
                      array={new Float32Array([
                        x, 2, z,
                        x + sunVector.x, 0, z + sunVector.z
                      ])}
                      itemSize={3}
                    />
                  </bufferGeometry>
                  <lineBasicMaterial 
                    color="#ffaa00" 
                    transparent 
                    opacity={0.3} 
                  />
                </line>
              );
            })}
          </group>
        </>
      )}
    </>
  );
};
import React, { useMemo, useState } from 'react';
import { Html, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import { Compass, Navigation, Sun, Wind } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

interface AzimuthGridProps {
  showGrid?: boolean;
  showCardinals?: boolean;
  showSunPath?: boolean;
  gridSize?: number;
  sunPosition?: { azimuth: number; elevation: number };
  onAzimuthClick?: (azimuth: number) => void;
}

export const AzimuthGrid: React.FC<AzimuthGridProps> = ({
  showGrid = true,
  showCardinals = true,
  showSunPath = false,
  gridSize = 50,
  sunPosition = { azimuth: 180, elevation: 45 },
  onAzimuthClick
}) => {
  const [gridOpacity, setGridOpacity] = useState(0.3);
  const [showDegrees, setShowDegrees] = useState(true);
  const [highlightOptimalRange, setHighlightOptimalRange] = useState(false);

  // Generate azimuth grid lines
  const azimuthLines = useMemo(() => {
    const lines: any[] = [];
    const radius = gridSize;
    const centerY = 0.1; // Slightly above ground
    
    // Major azimuth lines (every 30 degrees)
    for (let azimuth = 0; azimuth < 360; azimuth += 30) {
      const radians = (azimuth * Math.PI) / 180;
      const x1 = 0;
      const z1 = 0;
      const x2 = Math.sin(radians) * radius;
      const z2 = Math.cos(radians) * radius;
      
      lines.push({
        id: `major-${azimuth}`,
        points: [
          [x1, centerY, z1],
          [x2, centerY, z2]
        ],
        color: azimuth % 90 === 0 ? '#ff6b6b' : '#4a90e2', // Cardinal directions in red
        lineWidth: azimuth % 90 === 0 ? 3 : 2,
        azimuth,
        type: 'major'
      });
    }
    
    // Minor azimuth lines (every 10 degrees)
    for (let azimuth = 0; azimuth < 360; azimuth += 10) {
      if (azimuth % 30 !== 0) { // Skip major lines
        const radians = (azimuth * Math.PI) / 180;
        const x1 = 0;
        const z1 = 0;
        const x2 = Math.sin(radians) * radius * 0.7; // Shorter lines
        const z2 = Math.cos(radians) * radius * 0.7;
        
        lines.push({
          id: `minor-${azimuth}`,
          points: [
            [x1, centerY, z1],
            [x2, centerY, z2]
          ],
          color: '#888888',
          lineWidth: 1,
          azimuth,
          type: 'minor'
        });
      }
    }
    
    return lines;
  }, [gridSize]);

  // Generate concentric circles for distance reference
  const concentricCircles = useMemo(() => {
    const circles: any[] = [];
    const numCircles = 5;
    const centerY = 0.1;
    
    for (let i = 1; i <= numCircles; i++) {
      const radius = (gridSize / numCircles) * i;
      const points: number[][] = [];
      const segments = 64;
      
      for (let j = 0; j <= segments; j++) {
        const angle = (j / segments) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        points.push([x, centerY, z]);
      }
      
      circles.push({
        id: `circle-${i}`,
        points,
        color: i === numCircles ? '#4a90e2' : '#666666',
        lineWidth: i === numCircles ? 2 : 1,
        radius,
        distance: radius
      });
    }
    
    return circles;
  }, [gridSize]);

  // Cardinal direction labels
  const cardinalLabels = useMemo(() => {
    const radius = gridSize * 1.1;
    const centerY = 2;
    
    return [
      { direction: 'N', azimuth: 0, position: [0, centerY, radius], color: '#ff6b6b' },
      { direction: 'NE', azimuth: 45, position: [radius * 0.707, centerY, radius * 0.707], color: '#4a90e2' },
      { direction: 'E', azimuth: 90, position: [radius, centerY, 0], color: '#ff6b6b' },
      { direction: 'SE', azimuth: 135, position: [radius * 0.707, centerY, -radius * 0.707], color: '#4a90e2' },
      { direction: 'S', azimuth: 180, position: [0, centerY, -radius], color: '#ff6b6b' },
      { direction: 'SW', azimuth: 225, position: [-radius * 0.707, centerY, -radius * 0.707], color: '#4a90e2' },
      { direction: 'W', azimuth: 270, position: [-radius, centerY, 0], color: '#ff6b6b' },
      { direction: 'NW', azimuth: 315, position: [-radius * 0.707, centerY, radius * 0.707], color: '#4a90e2' }
    ];
  }, [gridSize]);

  // Optimal solar orientation range (South ±30° for northern hemisphere)
  const optimalRange = useMemo(() => {
    if (!highlightOptimalRange) return null;
    
    const startAngle = 150; // 180 - 30
    const endAngle = 210;   // 180 + 30
    const radius = gridSize * 0.9;
    const centerY = 0.2;
    
    const points: number[][] = [[0, centerY, 0]]; // Start from center
    
    // Generate arc points
    for (let angle = startAngle; angle <= endAngle; angle += 2) {
      const radians = (angle * Math.PI) / 180;
      const x = Math.sin(radians) * radius;
      const z = Math.cos(radians) * radius;
      points.push([x, centerY, z]);
    }
    
    points.push([0, centerY, 0]); // Back to center
    
    return points;
  }, [gridSize, highlightOptimalRange]);

  // Sun path visualization
  const sunPath = useMemo(() => {
    if (!showSunPath) return null;
    
    const paths: any[] = [];
    const radius = gridSize * 0.8;
    
    // Daily sun path (simplified arc)
    const dailyPath: number[][] = [];
    const hours = 12; // 6 AM to 6 PM
    
    for (let hour = 0; hour <= hours; hour++) {
      const timeRatio = hour / hours;
      const elevation = Math.sin(timeRatio * Math.PI) * 60; // Max 60° elevation
      const azimuth = 90 + (timeRatio * 180); // East to West
      
      const elevationRad = (elevation * Math.PI) / 180;
      const azimuthRad = (azimuth * Math.PI) / 180;
      
      const distance = radius * Math.cos(elevationRad);
      const x = Math.sin(azimuthRad) * distance;
      const y = Math.sin(elevationRad) * 20; // Height component
      const z = Math.cos(azimuthRad) * distance;
      
      dailyPath.push([x, y, z]);
    }
    
    paths.push({
      id: 'daily-sun-path',
      points: dailyPath,
      color: '#ffd700',
      lineWidth: 3
    });
    
    return paths;
  }, [showSunPath, gridSize]);

  // Current sun position indicator
  const currentSunIndicator = useMemo(() => {
    const azimuthRad = (sunPosition.azimuth * Math.PI) / 180;
    const elevationRad = (sunPosition.elevation * Math.PI) / 180;
    
    const distance = gridSize * 0.8 * Math.cos(elevationRad);
    const x = Math.sin(azimuthRad) * distance;
    const y = Math.sin(elevationRad) * 20;
    const z = Math.cos(azimuthRad) * distance;
    
    return { x, y, z };
  }, [sunPosition, gridSize]);

  // Handle azimuth line click
  const handleAzimuthClick = (azimuth: number) => {
    if (onAzimuthClick) {
      onAzimuthClick(azimuth);
    }
  };

  return (
    <>
      {/* Control Panel */}
      <Html position={[gridSize * 1.2, 5, 0]} portal={{ current: document.body }}>
        <div className="absolute top-4 right-4 z-20">
          <div className="bg-slate-800/90 border border-slate-600 rounded-lg p-4 backdrop-blur-sm w-64">
            <div className="flex items-center gap-2 mb-4">
              <Compass className="w-5 h-5 text-blue-400" />
              <span className="text-white font-medium">Grid de Azimute</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300 text-xs">Mostrar grid</Label>
                <Switch checked={showGrid} onCheckedChange={() => {}} />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-slate-300 text-xs">Pontos cardeais</Label>
                <Switch checked={showCardinals} onCheckedChange={() => {}} />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-slate-300 text-xs">Trajetória solar</Label>
                <Switch 
                  checked={showSunPath} 
                  onCheckedChange={setHighlightOptimalRange} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-slate-300 text-xs">Faixa ótima</Label>
                <Switch 
                  checked={highlightOptimalRange} 
                  onCheckedChange={setHighlightOptimalRange} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-slate-300 text-xs">Mostrar graus</Label>
                <Switch 
                  checked={showDegrees} 
                  onCheckedChange={setShowDegrees} 
                />
              </div>
              
              <div>
                <Label className="text-slate-300 text-xs mb-2 block">
                  Opacidade: {Math.round(gridOpacity * 100)}%
                </Label>
                <Slider
                  value={[gridOpacity]}
                  onValueChange={(value) => setGridOpacity(value[0])}
                  max={1}
                  min={0.1}
                  step={0.1}
                />
              </div>
            </div>
            
            {/* Quick orientation buttons */}
            <div className="mt-4 pt-3 border-t border-slate-600">
              <Label className="text-slate-300 text-xs mb-2 block">Orientação rápida</Label>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { label: 'Norte', azimuth: 0 },
                  { label: 'Sul', azimuth: 180 },
                  { label: 'Leste', azimuth: 90 },
                  { label: 'Oeste', azimuth: 270 }
                ].map(({ label, azimuth }) => (
                  <Button
                    key={label}
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAzimuthClick(azimuth)}
                    className="text-xs h-7"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Sun position info */}
            <div className="mt-4 pt-3 border-t border-slate-600">
              <div className="flex items-center gap-2 mb-2">
                <Sun className="w-4 h-4 text-yellow-400" />
                <span className="text-slate-300 text-xs">Posição Solar</span>
              </div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Azimute:</span>
                  <span className="text-white">{sunPosition.azimuth.toFixed(1)}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Elevação:</span>
                  <span className="text-white">{sunPosition.elevation.toFixed(1)}°</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Html>

      {showGrid && (
        <group>
          {/* Azimuth lines */}
          {azimuthLines.map((line) => (
            <Line
              key={line.id}
              points={line.points}
              color={line.color}
              lineWidth={line.lineWidth}
              transparent
              opacity={gridOpacity}
              onClick={() => handleAzimuthClick(line.azimuth)}
            />
          ))}

          {/* Concentric circles */}
          {concentricCircles.map((circle) => (
            <Line
              key={circle.id}
              points={circle.points}
              color={circle.color}
              lineWidth={circle.lineWidth}
              transparent
              opacity={gridOpacity * 0.7}
            />
          ))}

          {/* Distance labels on circles */}
          {concentricCircles.map((circle, index) => (
            <Html
              key={`circle-label-${circle.id}`}
              position={[0, 0.5, circle.radius]}
            >
              <div className="bg-slate-800/60 text-white text-xs px-1 py-0.5 rounded pointer-events-none">
                {circle.distance.toFixed(0)}m
              </div>
            </Html>
          ))}
        </group>
      )}

      {/* Cardinal direction labels */}
      {showCardinals && (
        <group>
          {cardinalLabels.map((label) => (
            <group key={`cardinal-${label.direction}`}>
              <Text
                position={label.position as [number, number, number]}
                fontSize={2}
                color={label.color}
                anchorX="center"
                anchorY="middle"
                font="/fonts/inter.woff"
              >
                {label.direction}
              </Text>
              
              {showDegrees && (
                <Html position={[label.position[0], label.position[1] - 1, label.position[2]]}>
                  <div className="text-slate-300 text-xs text-center pointer-events-none">
                    {label.azimuth}°
                  </div>
                </Html>
              )}
            </group>
          ))}
        </group>
      )}

      {/* Optimal solar range highlight */}
      {optimalRange && (
        <mesh position={[0, 0, 0]}>
          <shapeGeometry args={[createOptimalRangeShape(optimalRange)]} />
          <meshBasicMaterial
            color="#10b981"
            transparent
            opacity={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Sun path visualization */}
      {sunPath && (
        <group>
          {sunPath.map((path) => (
            <Line
              key={path.id}
              points={path.points}
              color={path.color}
              lineWidth={path.lineWidth}
              transparent
              opacity={0.8}
            />
          ))}
        </group>
      )}

      {/* Current sun position indicator */}
      <group>
        {/* Sun position marker */}
        <mesh position={[currentSunIndicator.x, currentSunIndicator.y, currentSunIndicator.z]}>
          <sphereGeometry args={[0.3]} />
          <meshBasicMaterial color="#ffd700" />
        </mesh>
        
        {/* Sun ray to center */}
        <Line
          points={[
            [0, 0.1, 0],
            [currentSunIndicator.x, currentSunIndicator.y, currentSunIndicator.z]
          ]}
          color="#ffd700"
          lineWidth={2}
          transparent
          opacity={0.6}
        />
        
        {/* Shadow direction indicator */}
        <Line
          points={[
            [0, 0.1, 0],
            [-currentSunIndicator.x * 0.5, 0.1, -currentSunIndicator.z * 0.5]
          ]}
          color="#666666"
          lineWidth={3}
          transparent
          opacity={0.8}
        />
      </group>

      {/* Center marker */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.4]} />
        <meshBasicMaterial color="#4a90e2" />
      </mesh>

      {/* Azimuth degree markers */}
      {showDegrees && showGrid && (
        <group>
          {azimuthLines.filter(line => line.type === 'major').map((line) => {
            const radians = (line.azimuth * Math.PI) / 180;
            const distance = gridSize * 0.85;
            const x = Math.sin(radians) * distance;
            const z = Math.cos(radians) * distance;
            
            return (
              <Html key={`degree-${line.azimuth}`} position={[x, 1, z]}>
                <div className="bg-slate-700/80 text-white text-xs px-1 py-0.5 rounded pointer-events-none">
                  {line.azimuth}°
                </div>
              </Html>
            );
          })}
        </group>
      )}
    </>
  );
};

// Helper function to create optimal range shape
const createOptimalRangeShape = (points: number[][]) => {
  const shape = new THREE.Shape();
  if (points.length > 0) {
    shape.moveTo(points[0][0], points[0][2]);
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i][0], points[i][2]);
    }
    shape.closePath();
  }
  return shape;
};
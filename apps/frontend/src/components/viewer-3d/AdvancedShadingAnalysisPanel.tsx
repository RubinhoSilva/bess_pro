import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Html, Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { 
  Sun, Play, Pause, RotateCcw, Calendar, Clock, 
  BarChart3, TrendingDown, AlertTriangle, CheckCircle,
  Settings, Eye, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import * as SunCalc from 'suncalc';

interface ShadingAnalysisData {
  hourlyShading: { hour: number; shadingFactor: number }[];
  monthlyAverage: { month: number; shadingFactor: number }[];
  annualEnergy: number;
  peakSunHours: number;
  shadingLosses: number;
  criticalPeriods: { start: Date; end: Date; severity: number }[];
}

interface AdvancedShadingAnalysisPanelProps {
  modules: any[];
  latitude: number;
  longitude: number;
  onTimeChange?: (time: Date) => void;
  onAnalysisUpdate?: (analysis: ShadingAnalysisData) => void;
}

export const AdvancedShadingAnalysisPanel: React.FC<AdvancedShadingAnalysisPanelProps> = ({
  modules,
  latitude = -23.5505, // São Paulo default
  longitude = -46.6333,
  onTimeChange,
  onAnalysisUpdate
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeSpeed, setTimeSpeed] = useState(60); // minutes per second
  const [analysisDate, setAnalysisDate] = useState(new Date());
  const [showShadowPaths, setShowShadowPaths] = useState(true);
  const [showEnergyLoss, setShowEnergyLoss] = useState(true);
  const [analysisMode, setAnalysisMode] = useState<'current' | 'daily' | 'monthly' | 'annual'>('current');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // Advanced sun calculation
  const sunPosition = useMemo(() => {
    const sunPos = SunCalc.getPosition(currentTime, latitude, longitude);
    const times = SunCalc.getTimes(currentTime, latitude, longitude);
    
    return {
      azimuth: (sunPos.azimuth * 180 / Math.PI) + 180,
      elevation: Math.max(0, sunPos.altitude * 180 / Math.PI),
      visible: sunPos.altitude > 0,
      sunrise: times.sunrise,
      sunset: times.sunset,
      solarNoon: times.solarNoon,
      intensity: Math.max(0, Math.sin(sunPos.altitude)) // Solar intensity factor
    };
  }, [currentTime, latitude, longitude]);

  // Calculate precise shadow geometry
  const calculatePreciseShadows = useCallback((time: Date, modulePositions: any[]) => {
    const sunPos = SunCalc.getPosition(time, latitude, longitude);
    
    if (sunPos.altitude <= 0) return []; // No shadows at night
    
    // Sun direction vector
    const sunDir = new THREE.Vector3(
      Math.cos(sunPos.altitude) * Math.sin(sunPos.azimuth),
      Math.sin(sunPos.altitude),
      Math.cos(sunPos.altitude) * Math.cos(sunPos.azimuth)
    ).normalize();
    
    const shadows: any[] = [];
    
    modulePositions.forEach((module, index) => {
      const modulePos = new THREE.Vector3(...module.position);
      const moduleSize = module.size;
      
      // Calculate shadow vertices based on module corners
      const corners = [
        new THREE.Vector3(-moduleSize.width/2, 0, -moduleSize.height/2),
        new THREE.Vector3(moduleSize.width/2, 0, -moduleSize.height/2),
        new THREE.Vector3(moduleSize.width/2, 0, moduleSize.height/2),
        new THREE.Vector3(-moduleSize.width/2, 0, moduleSize.height/2)
      ];
      
      // Transform corners to world space
      const worldCorners = corners.map(corner => {
        const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(
          new THREE.Euler(...module.rotation)
        );
        return corner.clone()
          .applyMatrix4(rotationMatrix)
          .add(modulePos);
      });
      
      // Project shadows to ground (y = 0)
      const shadowVertices = worldCorners.map(corner => {
        if (sunDir.y === 0) return corner; // No shadow if sun at horizon
        
        const t = -corner.y / sunDir.y; // Intersection parameter with ground plane
        return corner.clone().add(sunDir.clone().multiplyScalar(t));
      });
      
      shadows.push({
        moduleId: module.id,
        vertices: shadowVertices,
        area: calculatePolygonArea(shadowVertices),
        intensity: sunPos.altitude > 0 ? Math.sin(sunPos.altitude) : 0
      });
    });
    
    return shadows;
  }, [latitude, longitude]);

  // Helper function to calculate polygon area
  const calculatePolygonArea = (vertices: THREE.Vector3[]) => {
    let area = 0;
    for (let i = 0; i < vertices.length; i++) {
      const j = (i + 1) % vertices.length;
      area += vertices[i].x * vertices[j].z - vertices[j].x * vertices[i].z;
    }
    return Math.abs(area) / 2;
  };

  // Calculate shading factor between modules
  const calculateInterModuleShading = useCallback((targetModule: any, otherModules: any[], time: Date) => {
    const sunPos = SunCalc.getPosition(time, latitude, longitude);
    
    if (sunPos.altitude <= 0) return 0; // No shading at night
    
    const sunDir = new THREE.Vector3(
      Math.cos(sunPos.altitude) * Math.sin(sunPos.azimuth),
      Math.sin(sunPos.altitude),
      Math.cos(sunPos.altitude) * Math.cos(sunPos.azimuth)
    ).normalize();
    
    const targetPos = new THREE.Vector3(...targetModule.position);
    let totalShading = 0;
    
    otherModules.forEach(otherModule => {
      if (otherModule.id === targetModule.id) return;
      
      const otherPos = new THREE.Vector3(...otherModule.position);
      const distance = targetPos.distanceTo(otherPos);
      
      // Check if other module is in the shadow path
      const dirToOther = otherPos.clone().sub(targetPos).normalize();
      const shadowAlignment = dirToOther.dot(sunDir.clone().negate());
      
      if (shadowAlignment > 0.5 && distance < 20) { // Within shadow casting range
        // Calculate shadow coverage
        const moduleHeight = Math.max(otherModule.size.depth * Math.sin(Math.abs(otherModule.rotation[0])), 0.1);
        const shadowLength = moduleHeight / Math.tan(sunPos.altitude);
        
        if (distance < shadowLength) {
          const coverage = Math.max(0, 1 - distance / shadowLength);
          totalShading += coverage * 0.8; // Max 80% shading per module
        }
      }
    });
    
    return Math.min(totalShading, 0.9); // Max 90% total shading
  }, [latitude, longitude]);

  // Run comprehensive shading analysis
  const runShadingAnalysis = useCallback(async () => {
    if (modules.length === 0) return;
    
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    
    const analysis: ShadingAnalysisData = {
      hourlyShading: [],
      monthlyAverage: [],
      annualEnergy: 0,
      peakSunHours: 0,
      shadingLosses: 0,
      criticalPeriods: []
    };
    
    try {
      switch (analysisMode) {
        case 'daily':
          await analyzeDailyShading(analysisDate, analysis);
          break;
        case 'monthly':
          await analyzeMonthlyShading(analysisDate, analysis);
          break;
        case 'annual':
          await analyzeAnnualShading(analysisDate.getFullYear(), analysis);
          break;
        default:
          analyzeCurrentShading(currentTime, analysis);
      }
      
      if (onAnalysisUpdate) {
        onAnalysisUpdate(analysis);
      }
    } catch (error) {
      console.error('Shading analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(100);
    }
  }, [modules, analysisMode, analysisDate, currentTime, calculateInterModuleShading]);

  // Daily shading analysis
  const analyzeDailyShading = async (date: Date, analysis: ShadingAnalysisData) => {
    const hourlyData: { hour: number; shadingFactor: number }[] = [];
    const sunTimes = SunCalc.getTimes(date, latitude, longitude);
    
    const startHour = sunTimes.sunrise.getHours();
    const endHour = sunTimes.sunset.getHours() + 1;
    
    for (let hour = startHour; hour <= endHour; hour++) {
      const timePoint = new Date(date);
      timePoint.setHours(hour, 0, 0, 0);
      
      let totalShading = 0;
      modules.forEach(module => {
        const shading = calculateInterModuleShading(module, modules, timePoint);
        totalShading += shading;
      });
      
      const averageShading = totalShading / modules.length;
      hourlyData.push({ hour, shadingFactor: averageShading });
      
      setAnalysisProgress((hour - startHour) / (endHour - startHour) * 100);
      await new Promise(resolve => setTimeout(resolve, 10)); // Allow UI updates
    }
    
    analysis.hourlyShading = hourlyData;
    analysis.peakSunHours = hourlyData.filter(h => h.shadingFactor < 0.1).length;
    analysis.shadingLosses = hourlyData.reduce((sum, h) => sum + h.shadingFactor, 0) / hourlyData.length;
  };

  // Monthly shading analysis
  const analyzeMonthlyShading = async (baseDate: Date, analysis: ShadingAnalysisData) => {
    const monthlyData: { month: number; shadingFactor: number }[] = [];
    
    for (let month = 0; month < 12; month++) {
      const monthDate = new Date(baseDate.getFullYear(), month, 15); // Mid-month
      
      let monthlyShading = 0;
      const sampleDays = 3; // Sample 3 days per month
      
      for (let day = 0; day < sampleDays; day++) {
        const testDate = new Date(monthDate);
        testDate.setDate(testDate.getDate() + day * 10); // Spread samples across month
        
        const sunTimes = SunCalc.getTimes(testDate, latitude, longitude);
        const dayDuration = (sunTimes.sunset.getTime() - sunTimes.sunrise.getTime()) / (1000 * 60 * 60);
        
        // Sample every 2 hours during daylight
        for (let h = 0; h < dayDuration; h += 2) {
          const timePoint = new Date(sunTimes.sunrise.getTime() + h * 60 * 60 * 1000);
          
          let hourlyShading = 0;
          modules.forEach(module => {
            const shading = calculateInterModuleShading(module, modules, timePoint);
            hourlyShading += shading;
          });
          
          monthlyShading += hourlyShading / modules.length;
        }
      }
      
      const avgMonthlyShading = monthlyShading / (sampleDays * Math.ceil(12)); // Approximate
      monthlyData.push({ month: month + 1, shadingFactor: avgMonthlyShading });
      
      setAnalysisProgress((month + 1) / 12 * 100);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    analysis.monthlyAverage = monthlyData;
    analysis.annualEnergy = monthlyData.reduce((sum, m) => sum + (1 - m.shadingFactor), 0) / 12;
  };

  // Annual shading analysis
  const analyzeAnnualShading = async (year: number, analysis: ShadingAnalysisData) => {
    // This would be a more comprehensive analysis sampling throughout the year
    // For now, we'll simulate with monthly data
    await analyzeMonthlyShading(new Date(year, 0, 1), analysis);
    
    // Calculate critical periods (winter months with high shading)
    const criticalPeriods: any[] = [];
    analysis.monthlyAverage.forEach(month => {
      if (month.shadingFactor > 0.3) { // More than 30% shading
        criticalPeriods.push({
          start: new Date(year, month.month - 1, 1),
          end: new Date(year, month.month - 1 + 1, 0),
          severity: month.shadingFactor
        });
      }
    });
    
    analysis.criticalPeriods = criticalPeriods;
  };

  // Current shading analysis
  const analyzeCurrentShading = (time: Date, analysis: ShadingAnalysisData) => {
    let totalShading = 0;
    modules.forEach(module => {
      const shading = calculateInterModuleShading(module, modules, time);
      totalShading += shading;
    });
    
    const currentShading = totalShading / modules.length;
    analysis.hourlyShading = [{ hour: time.getHours(), shadingFactor: currentShading }];
    analysis.shadingLosses = currentShading;
  };

  // Auto-run analysis when parameters change
  useEffect(() => {
    if (modules.length > 0 && analysisMode !== 'current') {
      runShadingAnalysis();
    }
  }, [analysisMode, analysisDate, modules.length]);

  // Animation loop for time progression
  useFrame(() => {
    if (isPlaying) {
      setCurrentTime(prev => {
        const newTime = new Date(prev.getTime() + timeSpeed * 60 * 1000);
        if (onTimeChange) onTimeChange(newTime);
        return newTime;
      });
    }
  });

  // Generate shadow path visualization
  const shadowPaths = useMemo(() => {
    if (!showShadowPaths || modules.length === 0) return [];
    
    const paths: any[] = [];
    const sampleTimes = 12; // Sample every 2 hours
    
    for (let i = 0; i < sampleTimes; i++) {
      const timeOffset = (i / sampleTimes) * 24 * 60 * 60 * 1000;
      const sampleTime = new Date(currentTime.getTime() - 12 * 60 * 60 * 1000 + timeOffset);
      
      const shadows = calculatePreciseShadows(sampleTime, modules);
      paths.push(...shadows);
    }
    
    return paths;
  }, [modules, currentTime, showShadowPaths, calculatePreciseShadows]);

  const resetToNow = () => {
    const now = new Date();
    setCurrentTime(now);
    setAnalysisDate(now);
    if (onTimeChange) onTimeChange(now);
    setIsPlaying(false);
  };

  const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60;

  return (
    <>
      {/* Advanced Shading Analysis UI */}
      <Html position={[0, 20, 0]} portal={{ current: document.body }}>
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
          <div className="bg-slate-800/95 border border-slate-600 rounded-lg backdrop-blur-sm w-[500px] max-h-[70vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-800 p-4 border-b border-slate-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sun className="w-5 h-5 text-yellow-400" />
                  <span className="text-white font-medium">Análise de Sombreamento Avançada</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={sunPosition.visible ? "default" : "secondary"}>
                    {sunPosition.visible ? "Dia" : "Noite"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="p-4">
              <Tabs value={analysisMode} onValueChange={(value: any) => setAnalysisMode(value)}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="current">Atual</TabsTrigger>
                  <TabsTrigger value="daily">Diário</TabsTrigger>
                  <TabsTrigger value="monthly">Mensal</TabsTrigger>
                  <TabsTrigger value="annual">Anual</TabsTrigger>
                </TabsList>

                {/* Current Analysis */}
                <TabsContent value="current" className="space-y-4">
                  {/* Time Display */}
                  <div className="text-center">
                    <div className="text-3xl font-mono text-white">
                      {currentTime.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                    <div className="text-sm text-slate-300">
                      {currentTime.toLocaleDateString('pt-BR')}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Sol: {sunPosition.elevation.toFixed(1)}° | Az: {sunPosition.azimuth.toFixed(1)}°
                      {!sunPosition.visible && " (Abaixo do horizonte)"}
                    </div>
                  </div>

                  {/* Current Sun Path */}
                  {sunPosition.visible && (
                    <div className="bg-slate-700/50 p-3 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-300">Intensidade Solar</span>
                        <span className="text-white font-mono">{(sunPosition.intensity * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={sunPosition.intensity * 100} className="mt-2 h-2" />
                      
                      <div className="grid grid-cols-2 gap-4 mt-3 text-xs">
                        <div>
                          <span className="text-slate-400">Nascer:</span>
                          <span className="text-white ml-2">
                            {sunPosition.sunrise.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Pôr:</span>
                          <span className="text-white ml-2">
                            {sunPosition.sunset.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Time Controls */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-slate-300 mb-2">
                        Hora: {Math.floor(currentHour)}:{String(Math.floor((currentHour % 1) * 60)).padStart(2, '0')}
                      </label>
                      <Slider
                        value={[currentHour]}
                        onValueChange={(value) => {
                          const newTime = new Date(currentTime);
                          newTime.setHours(Math.floor(value[0]));
                          newTime.setMinutes((value[0] % 1) * 60);
                          setCurrentTime(newTime);
                          if (onTimeChange) onTimeChange(newTime);
                        }}
                        max={24}
                        min={0}
                        step={0.25}
                      />
                    </div>

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
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => setIsPlaying(!isPlaying)}
                        variant={isPlaying ? "secondary" : "default"}
                      >
                        {isPlaying ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                        {isPlaying ? 'Pausar' : 'Executar'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={resetToNow}>
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Agora
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Daily Analysis */}
                <TabsContent value="daily" className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Data da Análise</label>
                    <input
                      type="date"
                      value={analysisDate.toISOString().split('T')[0]}
                      onChange={(e) => setAnalysisDate(new Date(e.target.value))}
                      className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                    />
                  </div>
                  
                  <Button onClick={runShadingAnalysis} disabled={isAnalyzing} className="w-full">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    {isAnalyzing ? 'Analisando...' : 'Analisar Dia'}
                  </Button>
                  
                  {isAnalyzing && (
                    <div className="space-y-2">
                      <Progress value={analysisProgress} />
                      <div className="text-xs text-slate-400 text-center">
                        {analysisProgress.toFixed(0)}% concluído
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Monthly Analysis */}
                <TabsContent value="monthly" className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Mês/Ano</label>
                    <input
                      type="month"
                      value={`${analysisDate.getFullYear()}-${String(analysisDate.getMonth() + 1).padStart(2, '0')}`}
                      onChange={(e) => {
                        const [year, month] = e.target.value.split('-');
                        setAnalysisDate(new Date(parseInt(year), parseInt(month) - 1, 1));
                      }}
                      className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                    />
                  </div>
                  
                  <Button onClick={runShadingAnalysis} disabled={isAnalyzing} className="w-full">
                    <Calendar className="w-4 h-4 mr-2" />
                    {isAnalyzing ? 'Analisando...' : 'Analisar Mês'}
                  </Button>
                </TabsContent>

                {/* Annual Analysis */}
                <TabsContent value="annual" className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Ano</label>
                    <input
                      type="number"
                      value={analysisDate.getFullYear()}
                      onChange={(e) => setAnalysisDate(new Date(parseInt(e.target.value), 0, 1))}
                      className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                      min="2020"
                      max="2030"
                    />
                  </div>
                  
                  <Button onClick={runShadingAnalysis} disabled={isAnalyzing} className="w-full">
                    <TrendingDown className="w-4 h-4 mr-2" />
                    {isAnalyzing ? 'Analisando...' : 'Analisar Ano'}
                  </Button>
                  
                  <div className="text-xs text-slate-400">
                    ⚠️ Análise anual pode levar alguns minutos
                  </div>
                </TabsContent>
              </Tabs>

              {/* Visualization Options */}
              <div className="mt-6 pt-4 border-t border-slate-600">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-slate-300">Opções de Visualização</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-slate-300">Mostrar trajetórias de sombra</Label>
                    <Switch
                      checked={showShadowPaths}
                      onCheckedChange={setShowShadowPaths}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-slate-300">Mostrar perdas de energia</Label>
                    <Switch
                      checked={showEnergyLoss}
                      onCheckedChange={setShowEnergyLoss}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Html>

      {/* 3D Shadow Visualization */}
      {showShadowPaths && shadowPaths.map((shadow, index) => (
        <group key={`shadow-${index}`}>
          {/* Shadow polygon on ground */}
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI/2, 0, 0]}>
            <shapeGeometry args={[createShadowShape(shadow.vertices)]} />
            <meshBasicMaterial
              color="#000000"
              transparent
              opacity={0.3 * shadow.intensity}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}

      {/* Dynamic shadow rays */}
      {sunPosition.visible && modules.slice(0, 5).map((module, index) => {
        const modulePos = new THREE.Vector3(...module.position);
        
        // Calculate shadow direction
        const sunDir = new THREE.Vector3(
          Math.cos(sunPosition.elevation * Math.PI / 180) * Math.sin(sunPosition.azimuth * Math.PI / 180),
          Math.sin(sunPosition.elevation * Math.PI / 180),
          Math.cos(sunPosition.elevation * Math.PI / 180) * Math.cos(sunPosition.azimuth * Math.PI / 180)
        ).normalize().multiplyScalar(-20);

        const shadowEnd = modulePos.clone().add(sunDir);
        shadowEnd.y = 0; // Project to ground

        return (
          <Line
            key={`shadow-ray-${index}`}
            points={[modulePos.toArray(), shadowEnd.toArray()]}
            color="#ffaa00"
            lineWidth={2}
            transparent
            opacity={0.4}
          />
        );
      })}
    </>
  );
};

// Helper function to create shadow shape
const createShadowShape = (vertices: THREE.Vector3[]) => {
  const shape = new THREE.Shape();
  if (vertices.length > 0) {
    shape.moveTo(vertices[0].x, vertices[0].z);
    for (let i = 1; i < vertices.length; i++) {
      shape.lineTo(vertices[i].x, vertices[i].z);
    }
    shape.closePath();
  }
  return shape;
};
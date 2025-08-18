import React from 'react';

interface Scene3DProps {
  modelUrl?: string;
  showGrid?: boolean;
  showAxes?: boolean;
  shadows?: boolean;
  onModelLoad?: (model: any) => void;
  children?: React.ReactNode;
}

export default function Scene3D({
  modelUrl,
  showGrid = true,
  showAxes = false,
  shadows = true,
  onModelLoad,
  children
}: Scene3DProps) {
  // Temporariamente desabilitado - dependências 3D em resolução
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center p-8">
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Viewer 3D</h3>
        <p className="text-gray-500">Visualizador 3D temporariamente indisponível</p>
        <p className="text-sm text-gray-400 mt-2">Resolvendo dependências...</p>
      </div>
    </div>
  );
}
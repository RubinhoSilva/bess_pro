import React from 'react';
import { Html } from '@react-three/drei';
import { Loader2 } from 'lucide-react';

export const LoadingFallback: React.FC = () => {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center p-6 bg-slate-800/80 rounded-lg backdrop-blur-sm">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400 mb-2" />
        <p className="text-white text-sm">Carregando cena 3D...</p>
      </div>
    </Html>
  );
};
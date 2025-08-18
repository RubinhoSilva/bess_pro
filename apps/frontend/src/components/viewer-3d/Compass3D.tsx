import React from 'react';
import { Navigation } from 'lucide-react';
import { motion } from 'framer-motion';

interface Compass3DProps {
  className?: string;
  rotation?: number; // Rotation in radians
  onResetToNorth?: () => void;
}

export const Compass3D: React.FC<Compass3DProps> = ({ 
  className = "", 
  rotation = 0,
  onResetToNorth 
}) => {
  return (
    <div 
      className={`w-20 h-20 cursor-pointer group ${className}`}
      onDoubleClick={onResetToNorth}
      title="Duplo clique para visão Norte"
    >
      <div className="w-full h-full bg-slate-800/80 border border-slate-600 rounded-full flex items-center justify-center backdrop-blur-sm transition-all group-hover:scale-105 group-hover:bg-slate-700/80">
        <div className="absolute w-full h-full">
          <motion.div 
            className="absolute w-full h-full"
            style={{ transform: `rotate(${rotation}rad)` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Cardinal Points */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 text-sm font-bold text-red-400">N</div>
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-slate-300">S</div>
            <div className="absolute left-1 top-1/2 -translate-y-1/2 text-xs text-slate-300">O</div>
            <div className="absolute right-1 top-1/2 -translate-y-1/2 text-xs text-slate-300">L</div>
            
            {/* Navigation Arrow */}
            <div className="absolute w-full h-full flex items-center justify-center">
              <Navigation 
                className="w-6 h-6 text-red-500 transition-all group-hover:scale-110"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
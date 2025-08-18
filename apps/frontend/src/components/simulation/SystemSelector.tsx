import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Sun, Fuel, Battery, ArrowRight, Network, Home } from 'lucide-react';

interface SystemSelectorProps {
  onSelectionComplete: (systems: {
    bess: boolean;
    solar: boolean;
    diesel: boolean;
  }) => void;
}

interface SystemNodeProps {
  id: string;
  label: string;
  icon: React.ReactElement;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  position: { top: string; left: string };
  nodeSize?: number;
  iconSize?: number;
  isSelectable?: boolean;
}

const SystemNode: React.FC<SystemNodeProps> = ({ 
  id, 
  label, 
  icon, 
  checked, 
  onCheckedChange, 
  position, 
  nodeSize = 64, 
  iconSize = 32, 
  isSelectable = true 
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.5 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, delay: 0.2 }}
    className="absolute flex flex-col items-center gap-2"
    style={{ ...position, transform: 'translate(-50%, -50%)' }}
  >
    <div
      className={`relative flex items-center justify-center bg-slate-800 rounded-lg border-2 transition-colors duration-300 ${
        checked ? 'border-cyan-400 shadow-[0_0_15px_rgba(0,255,255,0.4)]' : 'border-slate-600'
      }`}
      style={{ width: nodeSize, height: nodeSize }}
    >
      {React.cloneElement(icon, { 
        className: `transition-colors duration-300 ${checked ? 'text-cyan-300' : 'text-slate-500'}`,
        size: iconSize 
      })}
    </div>
    <div className="flex items-center gap-2 rounded-md bg-slate-900/70 px-3 py-1">
      {isSelectable ? (
        <>
          <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} />
          <Label htmlFor={id} className="text-sm font-medium text-slate-200 cursor-pointer whitespace-nowrap">
            {label}
          </Label>
        </>
      ) : (
        <span className="text-sm font-medium text-slate-200 whitespace-nowrap">{label}</span>
      )}
    </div>
  </motion.div>
);

interface ConnectionLineProps {
  from: { x: string; y: string };
  to: { x: string; y: string };
  active: boolean;
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({ from, to, active }) => {
  const lineVariant = {
    hidden: { pathLength: 0 },
    visible: { pathLength: 1, transition: { duration: 1, ease: 'easeInOut', delay: 0.5 } }
  };

  return (
    <motion.line
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      strokeWidth="2"
      className={`transition-all duration-300 ${active ? 'stroke-cyan-400' : 'stroke-slate-600'}`}
      variants={lineVariant}
    />
  );
};

export const SystemSelector: React.FC<SystemSelectorProps> = ({ onSelectionComplete }) => {
  const [activeSystems, setActiveSystems] = useState({
    bess: true,
    solar: true,
    diesel: true,
  });

  const handleCheckboxChange = (system: keyof typeof activeSystems) => {
    setActiveSystems(prev => ({ ...prev, [system]: !prev[system] }));
  };

  const nodes = {
    grid: { x: '15%', y: '25%' },
    solar: { x: '38.33%', y: '25%' },
    diesel: { x: '61.67%', y: '25%' },
    bess: { x: '85%', y: '25%' },
    bus: { x1: '15%', y1: '50%', x2: '85%', y2: '50%' },
    load: { x: '50%', y: '75%' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-900 flex flex-col items-center justify-center p-4 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Selecione o Cenário de Simulação
        </h1>
        <p className="text-lg text-slate-300 mt-2">
          Escolha os sistemas que farão parte da sua análise de viabilidade.
        </p>
      </motion.div>

      <div className="w-full max-w-4xl h-96 bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-4 sm:p-6 shadow-2xl relative">
        <motion.svg
          width="100%"
          height="100%"
          initial="hidden"
          animate="visible"
          className="absolute top-0 left-0"
        >
          {/* Busbar */}
          <motion.line 
            x1={nodes.bus.x1} 
            y1={nodes.bus.y1} 
            x2={nodes.bus.x2} 
            y2={nodes.bus.y2} 
            strokeWidth="4" 
            className="stroke-slate-500" 
            variants={{ 
              hidden: { pathLength: 0 }, 
              visible: { pathLength: 1, transition: { duration: 1, ease: 'easeInOut' } } 
            }} 
          />

          {/* Connections to Bus */}
          <ConnectionLine 
            from={{ x: nodes.grid.x, y: nodes.grid.y }} 
            to={{ x: nodes.grid.x, y: nodes.bus.y1 }} 
            active={true} 
          />
          <ConnectionLine 
            from={{ x: nodes.solar.x, y: nodes.solar.y }} 
            to={{ x: nodes.solar.x, y: nodes.bus.y1 }} 
            active={activeSystems.solar} 
          />
          <ConnectionLine 
            from={{ x: nodes.diesel.x, y: nodes.diesel.y }} 
            to={{ x: nodes.diesel.x, y: nodes.bus.y1 }} 
            active={activeSystems.diesel} 
          />
          <ConnectionLine 
            from={{ x: nodes.bess.x, y: nodes.bess.y }} 
            to={{ x: nodes.bess.x, y: nodes.bus.y1 }} 
            active={activeSystems.bess} 
          />
          <ConnectionLine 
            from={{ x: nodes.load.x, y: nodes.bus.y1 }} 
            to={{ x: nodes.load.x, y: nodes.load.y }} 
            active={true} 
          />
        </motion.svg>

        {/* Nodes */}
        <SystemNode 
          id="grid" 
          label="Rede Elétrica" 
          icon={<Network />} 
          checked={true} 
          onCheckedChange={() => {}} 
          position={{ top: nodes.grid.y, left: nodes.grid.x }} 
          isSelectable={false} 
        />
        <SystemNode 
          id="solar" 
          label="Fotovoltaico" 
          icon={<Sun />} 
          checked={activeSystems.solar} 
          onCheckedChange={() => handleCheckboxChange('solar')} 
          position={{ top: nodes.solar.y, left: nodes.solar.x }} 
        />
        <SystemNode 
          id="diesel" 
          label="Gerador Diesel" 
          icon={<Fuel />} 
          checked={activeSystems.diesel} 
          onCheckedChange={() => handleCheckboxChange('diesel')} 
          position={{ top: nodes.diesel.y, left: nodes.diesel.x }} 
        />
        <SystemNode 
          id="bess" 
          label="Sistema BESS" 
          icon={<Battery />} 
          checked={activeSystems.bess} 
          onCheckedChange={() => handleCheckboxChange('bess')} 
          position={{ top: nodes.bess.y, left: nodes.bess.x }} 
        />
        <SystemNode 
          id="load" 
          label="Carga" 
          icon={<Home />} 
          checked={true} 
          onCheckedChange={() => {}} 
          position={{ top: nodes.load.y, left: nodes.load.x }} 
          isSelectable={false} 
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1 }}
        className="text-center mt-10"
      >
        <Button
          onClick={() => onSelectionComplete(activeSystems)}
          size="lg"
          className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-10 py-6 text-xl font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
        >
          Continuar para Simulação
          <ArrowRight className="ml-3 w-6 h-6" />
        </Button>
      </motion.div>
    </div>
  );
};
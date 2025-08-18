import React from 'react';
import { Html, useProgress } from '@react-three/drei';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const Loader = () => {
    const { progress, item } = useProgress();
    return (
        <Html center>
            <div className="text-center text-white bg-slate-900/60 backdrop-blur-md p-8 rounded-xl shadow-lg flex flex-col items-center w-72">
                <Loader2 className="w-12 h-12 animate-spin mb-4 text-blue-400" />
                <p className="font-bold text-lg mb-2">Carregando Modelo 3D</p>
                <div className="w-full bg-slate-700 rounded-full h-2.5 mb-2">
                    <motion.div 
                        className="bg-blue-500 h-2.5 rounded-full" 
                        style={{ width: `${progress}%` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
                <p className="font-semibold text-xl">{Math.round(progress)}%</p>
                {item && <p className="text-xs text-slate-400 mt-2 truncate w-full">Carregando: {item}</p>}
            </div>
        </Html>
    );
};

export default Loader;
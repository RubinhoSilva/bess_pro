import React, { useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Navigation } from 'lucide-react';
import * as THREE from 'three';
import { motion } from 'framer-motion';

const Compass = ({ onDoubleClick }) => {
    const { camera } = useThree();
    const [rotation, setRotation] = useState(0);

    useFrame(() => {
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        const angle = Math.atan2(direction.x, direction.z);
        setRotation(-angle);
    });

    return (
        <Html as="div" wrapperClass="compass-wrapper" portal={{ current: document.body }}>
            <div 
                className="absolute top-20 right-8 w-24 h-24 cursor-pointer group z-50"
                onDoubleClick={onDoubleClick}
                title="Duplo clique para visão de topo (Norte para cima)"
            >
                <div className="w-full h-full bg-slate-800/50 border border-slate-600 rounded-full flex items-center justify-center backdrop-blur-sm transition-transform group-hover:scale-105">
                    <motion.div 
                        className="absolute w-full h-full"
                        style={{ transform: `rotate(${rotation}rad)` }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                        <div className="absolute top-1 left-1/2 -translate-x-1/2 text-lg font-bold text-red-400">N</div>
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-sm text-slate-300">S</div>
                        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 text-sm text-slate-300">O</div>
                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 text-sm text-slate-300">E</div>
                        <div className="absolute w-full h-full top-0 left-0 flex items-center justify-center">
                            <Navigation 
                                className="w-8 h-8 text-red-500 transition-transform group-hover:scale-110"
                                style={{ transform: 'rotate(0rad)' }} 
                            />
                        </div>
                    </motion.div>
                </div>
            </div>
        </Html>
    );
};

export default Compass;
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ModelRotationTool = ({ isOpen, position, onRotate, onReset, onClose }) => {
  if (!isOpen) return null;

  const menuItems = [
    { label: "Inclinar para Frente (X+)", action: () => onRotate('x', 90) },
    { label: "Inclinar para Trás (X-)", action: () => onRotate('x', -90) },
    { label: "Girar à Direita (Y+)", action: () => onRotate('y', 90) },
    { label: "Girar à Esquerda (Y-)", action: () => onRotate('y', -90) },
    { label: "Inclinar à Direita (Z+)", action: () => onRotate('z', 90) },
    { label: "Inclinar à Esquerda (Z-)", action: () => onRotate('z', -90) },
    { label: "Resetar Rotação", action: onReset, isSeparator: true },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
          <motion.div
            className="fixed z-50 bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-lg shadow-2xl py-2 w-56"
            style={{ top: position.y, left: position.x }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <p className="px-4 pt-1 pb-2 text-xs font-semibold text-slate-400 border-b border-slate-700">Ajustar Orientação</p>
            <ul className="mt-2">
              {menuItems.map((item, index) => (
                <React.Fragment key={index}>
                    {item.isSeparator && <div className="h-px bg-slate-700 my-2" />}
                    <li
                    className="px-4 py-2 text-sm text-slate-200 hover:bg-blue-600/50 cursor-pointer transition-colors duration-150"
                    onClick={() => {
                        item.action();
                        onClose();
                    }}
                    >
                    {item.label}
                    </li>
                </React.Fragment>
              ))}
            </ul>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ModelRotationTool;
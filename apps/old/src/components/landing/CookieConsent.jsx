import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Cookie } from 'lucide-react';

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'true');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 30 }}
          className="fixed bottom-4 right-4 z-50 w-full max-w-md p-4 bg-slate-800/80 backdrop-blur-lg border border-slate-700 rounded-lg shadow-2xl"
        >
          <div className="flex items-start gap-4">
            <Cookie className="w-8 h-8 text-blue-400 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-white">Nós usamos cookies</h4>
              <p className="text-sm text-slate-300 mt-1">
                Este site utiliza cookies para garantir que você tenha a melhor experiência. Ao continuar, você concorda com nosso uso de cookies.
              </p>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleAccept} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              Entendi
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
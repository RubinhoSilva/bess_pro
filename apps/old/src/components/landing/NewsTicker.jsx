import React from 'react';
import { motion } from 'framer-motion';
import { Newspaper } from 'lucide-react';

const newsItems = [
  {
    source: "BloombergNEF",
    title: "Instalações globais de armazenamento de bateria devem crescer 25 vezes até 2030, mostra nova previsão.",
  },
  {
    source: "PV Magazine",
    title: "Células solares de perovskita de última geração atingem eficiência recorde, aproximando-se da viabilidade comercial.",
  },
  {
    source: "Reuters",
    title: "EUA anunciam investimento de US$ 3,5 bilhões para impulsionar a rede doméstica e a fabricação de armazenamento de energia.",
  },
  {
    source: "Canary Media",
    title: "Projetos piloto de tecnologia Vehicle-to-grid (V2G) demonstram potencial significativo para estabilização da rede.",
  },
  {
    source: "Greentech Media",
    title: "Software é a chave: IA e aprendizado de máquina estão otimizando o desempenho e o ROI do armazenamento de energia.",
  }
];

const NewsTicker = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <motion.div 
      className="mt-8 p-6 bg-slate-800/40 border border-slate-700 rounded-lg max-w-3xl mx-auto lg:mx-0"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Newspaper className="w-5 h-5 mr-2 text-blue-400" />
        Últimas Notícias do Setor
      </h3>
      <ul className="space-y-3">
        {newsItems.map((item, index) => (
          <motion.li key={index} variants={itemVariants} className="flex items-start gap-3 text-sm text-slate-300">
            <span className="font-semibold text-slate-500 w-28 flex-shrink-0">[{item.source}]</span>
            <span className="flex-grow">{item.title}</span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
};

export default NewsTicker;
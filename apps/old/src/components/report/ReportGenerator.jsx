import React from 'react';
import { motion } from 'framer-motion';
import ReportHeader from './ReportHeader';
import ExecutiveSummary from './ExecutiveSummary';
import TechnicalSpecifications from './TechnicalSpecifications';
import EconomicAnalysis from './EconomicAnalysis';
import TariffParameters from './TariffParameters';
import Recommendations from './Recommendations';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const ReportGenerator = ({ data }) => {
  const { profile } = useAuth();

  return (
    <div className="bg-white text-slate-800 p-4 sm:p-8 rounded-lg shadow-2xl print:shadow-none print:p-0" id="report-content">
      <ReportHeader profile={profile} />
      <main className="mt-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <ExecutiveSummary data={data} />
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 print:grid-cols-5">
          <div className="lg:col-span-3 space-y-8 flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex-grow"
            >
              <EconomicAnalysis data={data} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex-grow"
            >
              <Recommendations data={data} />
            </motion.div>
          </div>
          <div className="lg:col-span-2 space-y-8 flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <TechnicalSpecifications data={data} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <TariffParameters data={data} />
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportGenerator;
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ResultCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  unit?: string;
  delay?: number;
  isPositive?: boolean;
}

const ResultCard: React.FC<ResultCardProps> = ({ 
  icon, 
  title, 
  value, 
  unit, 
  delay = 0, 
  isPositive 
}) => {
  const getValueColor = () => {
    if (isPositive === true) return 'text-green-600 dark:text-green-400';
    if (isPositive === false) return 'text-red-600 dark:text-red-400';
    return 'text-gray-800 dark:text-gray-100';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.1 }}
      className="h-full"
    >
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-center h-full flex flex-col justify-center shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="pb-2 pt-4">
          <div className="mx-auto bg-gray-100 dark:bg-gray-700 p-3 rounded-full w-fit mb-2">
            {icon}
          </div>
          <CardTitle className="text-sm sm:text-base text-gray-600 dark:text-gray-300 font-medium">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <p className={`text-xl sm:text-2xl font-bold ${getValueColor()}`}>
            {value} 
            {unit && (
              <span className="text-lg text-gray-500 dark:text-gray-400 ml-1">{unit}</span>
            )}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ResultCard;
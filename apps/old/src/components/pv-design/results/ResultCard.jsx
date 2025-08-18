import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ResultCard = ({ icon, title, value, unit, delay, isPositive }) => {
    const valueColor = isPositive === true ? 'text-green-400' : isPositive === false ? 'text-red-400' : 'text-white';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: delay * 0.1 }}
            className="h-full"
        >
            <Card className="bg-slate-900/50 border-slate-700 text-center h-full flex flex-col justify-center print:border-gray-200 print:shadow-none">
                <CardHeader className="pb-2 pt-4">
                    <div className="mx-auto bg-slate-700 p-3 rounded-full w-fit mb-2 print:bg-gray-200">
                        {icon}
                    </div>
                    <CardTitle className="text-sm sm:text-base text-slate-300 font-medium print:text-gray-600">{title}</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                    <p className={`text-xl sm:text-2xl font-bold ${valueColor} print:text-black`}>{value} <span className="text-lg text-slate-400 print:text-gray-500">{unit}</span></p>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default ResultCard;
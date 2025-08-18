import React, { useState } from 'react';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import ResultsCharts from '@/components/ResultsCharts';
import ReportGenerator from '@/components/report/ReportGenerator';
import { LayoutDashboard, BarChart3, FileText } from 'lucide-react';

const Dashboard = ({ data, onNewSimulation }) => {
  const [activeView, setActiveView] = useState('dashboard');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'charts', label: 'Gráficos', icon: BarChart3 },
    { id: 'report', label: 'Relatório', icon: FileText },
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <MainContent data={data} />;
      case 'charts':
        return <ResultsCharts data={data} />;
      case 'report':
        return <ReportGenerator data={data} />;
      default:
        return <MainContent data={data} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-50">
      <Sidebar
        navItems={navItems}
        activeView={activeView}
        setActiveView={setActiveView}
        onNewSimulation={onNewSimulation}
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
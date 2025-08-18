import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import WelcomePage from '@/pages/WelcomePage';
import ServiceSelectionPage from '@/pages/ServiceSelectionPage';
import BESSAnalysisTool from '@/pages/BESSAnalysisTool';
import PVDesignTool from '@/pages/PVDesignTool';
import CRMKanbanPage from '@/pages/CRMKanbanPage';
import CRMAnalyticsDashboard from '@/components/crm/CRMAnalyticsDashboard';
import CRMLeadsPage from '@/pages/CRMLeadsPage';
import CustomerManager from '@/pages/CustomerManager';
import UserManagementPage from '@/pages/UserManagementPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useNewAuth } from '@/contexts/NewAuthContext';
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage';
import GeoMapPage from '@/pages/GeoMapPage';
import Model3DViewerPage from '@/pages/Model3DViewerPage';
import UserProfilePage from '@/pages/UserProfilePage';
import ProposalSettingsPage from '@/pages/ProposalSettingsPage';
import SubscriptionPage from '@/pages/SubscriptionPage';
import IntegrationsPage from '@/pages/IntegrationsPage';
import { useToast } from '@/components/ui/use-toast';
import { isAfter } from 'date-fns';
import 'leaflet/dist/leaflet.css';
import { ProjectProvider } from '@/contexts/ProjectContext';

const AppRoutes = () => {
    const { session, loading, profile, supabase } = useNewAuth();
    const { toast } = useToast();
    const location = useLocation();

    useEffect(() => {
        const handleFirstLogin = async () => {
            if (session && profile && profile.is_first_login) {
                toast({
                    title: `Bem-vindo, ${profile.name || 'usuário'}!`,
                    description: "É ótimo ter você aqui. Explore a plataforma!",
                });
                await supabase
                    .from('profiles')
                    .update({ is_first_login: false })
                    .eq('id', session.user.id);
            }
        };
        handleFirstLogin();
    }, [session, profile, toast, supabase]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-slate-900">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (session) {
        const isTestUser = session.user.email === 'teste@teste.com.br';

        if (!isTestUser) {
            const isTrialExpired = profile && profile.subscription_status === 'trialing' && profile.trial_ends_at && isAfter(new Date(), new Date(profile.trial_ends_at));
            const isSubscriptionInactive = profile && !['trialing', 'active'].includes(profile.subscription_status);
            const needsSubscription = isTrialExpired || isSubscriptionInactive;
            
            if (needsSubscription && location.pathname !== '/subscription') {
                return <Navigate to="/subscription" replace />;
            }
        }
    }
    
    return (
        <Routes>
            <Route 
                path="/" 
                element={
                    session ? <Navigate to="/select-service" replace /> : <Navigate to="/bem-vindo" replace />
                } 
            />
            
            <Route path="/bem-vindo" element={<WelcomePage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

            <Route element={<ProtectedRoute />}>
                <Route path="/select-service" element={<ServiceSelectionPage />} />
                <Route path="/bess-analysis" element={<BESSAnalysisTool />} />
                <Route path="/pv-design" element={<PVDesignTool />} />
                <Route path="/crm" element={<CRMAnalyticsDashboard />} />
                <Route path="/crm/kanban" element={<CRMKanbanPage />} />
                <Route path="/crm/leads" element={<CRMLeadsPage />} />
                <Route path="/clients" element={<CustomerManager />} />
                <Route path="/user-management" element={<UserManagementPage />} />
                <Route path="/geomap" element={<GeoMapPage />} />
                <Route path="/viewer-3d" element={<Model3DViewerPage />} />
                <Route path="/profile" element={<UserProfilePage />} />
                <Route path="/proposal-settings" element={<ProposalSettingsPage />} />
                <Route path="/subscription" element={<SubscriptionPage />} />
                <Route path="/integrations" element={<IntegrationsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

function App() {
    return (
        <>
            <Helmet>
                <title>BESS Pro - Software de Análise de Viabilidade e CRM</title>
                <meta name="description" content="Software profissional para análise de viabilidade, dimensionamento de sistemas de energia e gestão de vendas." />
            </Helmet>
            
            <div className="min-h-screen w-full bg-slate-900 text-slate-50 print:bg-white relative">
                <div className="absolute inset-0 -z-10 h-full w-full bg-slate-900 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] print:hidden"></div>
                <div className="absolute top-0 left-0 -z-10 h-full w-full bg-gradient-to-br from-slate-900/95 via-transparent to-slate-900 print:hidden"></div>
                <ProjectProvider>
                    <AppRoutes />
                </ProjectProvider>
                <Toaster />
            </div>
        </>
    );
}

export default App;
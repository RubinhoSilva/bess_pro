import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useNewAuth } from '@/contexts/NewAuthContext';

const ProtectedRoute = () => {
    const { session, loading } = useNewAuth();

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-slate-900">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/bem-vindo" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
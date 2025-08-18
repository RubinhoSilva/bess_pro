import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth-store'
import { ThemeProvider } from './contexts/ThemeContext'
import './styles/proposal.css'

// Pages
import LoginPage from './pages/auth/LoginPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import SetupPasswordPage from './pages/auth/SetupPasswordPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import DashboardHomePage from './pages/dashboard/DashboardHomePage'
import DashboardLayout from './layouts/DashboardLayout'
import LeadsPage from './pages/crm/LeadsPage'
import KanbanPage from './pages/crm/KanbanPagePragmatic'
import LeadDetailPage from './pages/crm/LeadDetailPage'
import CRMDashboardPage from './pages/crm/CRMDashboardPage'
import ClientsPage from './pages/clients/ClientsPage'
import ProjectsDashboard from './pages/projects/ProjectsDashboard'
import PVDesignPage from './pages/tools/PVDesignPage'
import EquipmentPage from './pages/equipment/EquipmentPage'
import BESSAnalysisPage from './pages/tools/BESSAnalysisPage'
import SolarAnalysisPage from './pages/tools/SolarAnalysisPage'
import Model3DViewerPage from './pages/tools/Model3DViewerPage'
import GeoMapPage from './pages/tools/GeoMapPage'
import ProposalTemplatesPage from './pages/tools/ProposalTemplatesPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import TeamManagementPage from './pages/team/TeamManagementPage'
import ReportsPage from './pages/reports/ReportsPage'
import CalendarPage from './pages/calendar/CalendarPage'

// Components
import { ProtectedRoute } from './components/providers/protected-route'
import { ProjectProvider } from './contexts/ProjectContext'

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <ThemeProvider>
      <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/dashboard/services" replace /> : <LoginPage />} 
      />
      <Route 
        path="/forgot-password" 
        element={isAuthenticated ? <Navigate to="/dashboard/services" replace /> : <ForgotPasswordPage />} 
      />
      <Route 
        path="/reset-password" 
        element={isAuthenticated ? <Navigate to="/dashboard/services" replace /> : <ResetPasswordPage />} 
      />
      
      <Route 
        path="/invite/setup-password" 
        element={isAuthenticated ? <Navigate to="/dashboard/services" replace /> : <SetupPasswordPage />} 
      />
      
      {/* Admin Route */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requiredRole="admin">
            <Navigate to="/dashboard/admin" replace />
          </ProtectedRoute>
        } 
      />
      
      {/* Protected Routes */}
      <Route 
        path="/dashboard/*" 
        element={
          <ProtectedRoute>
            <ProjectProvider>
              <DashboardLayout>
                <Routes>
                  <Route index element={<Navigate to="services" replace />} />
                  <Route path="services" element={<DashboardHomePage />} />
                  <Route path="overview" element={<DashboardPage />} />
                  <Route path="projects" element={<ProjectsDashboard />} />
                  <Route path="pv-design" element={<PVDesignPage />} />
                  <Route path="bess-analysis" element={<BESSAnalysisPage />} />
                  <Route path="solar-analysis" element={<SolarAnalysisPage />} />
                  <Route path="model3d-viewer" element={<Model3DViewerPage />} />
                  <Route path="geo-map" element={<GeoMapPage />} />
                  <Route path="crm" element={<CRMDashboardPage />} />
                  <Route path="crm/dashboard" element={<CRMDashboardPage />} />
                  <Route path="crm/leads" element={<LeadsPage />} />
                  <Route path="crm/leads/:id" element={<LeadDetailPage />} />
                  <Route path="crm/kanban" element={<KanbanPage />} />
                  <Route path="clients" element={<ClientsPage />} />
                  <Route path="equipment" element={<EquipmentPage />} />
                  <Route path="proposal-templates" element={<ProposalTemplatesPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="calendar" element={<CalendarPage />} />
                  <Route 
                    path="admin" 
                    element={
                      <ProtectedRoute requiredRole="super_admin">
                        <AdminDashboardPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="team" 
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <TeamManagementPage />
                      </ProtectedRoute>
                    } 
                  />
                  {/* Add more dashboard routes here */}
                </Routes>
              </DashboardLayout>
            </ProjectProvider>
          </ProtectedRoute>
        } 
      />
      
      {/* Default redirect */}
      <Route 
        path="/" 
        element={<Navigate to={isAuthenticated ? "/dashboard/services" : "/login"} replace />} 
      />
      
      {/* Catch all route */}
      <Route 
        path="*" 
        element={<Navigate to={isAuthenticated ? "/dashboard/services" : "/login"} replace />} 
      />
      </Routes>
    </ThemeProvider>
  )
}

export default App

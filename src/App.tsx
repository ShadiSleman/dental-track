import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { usePolling } from './hooks/usePolling'
import AppLayout from './components/AppLayout'

import LoginPage from './pages/LoginPage'
import DoctorDashboard from './pages/DoctorDashboard'
import LabDashboard from './pages/LabDashboard'
import TechnicianView from './pages/TechnicianView'
import CourierView from './pages/CourierView'
import WorkOrderDetail from './pages/WorkOrderDetail'
import NewWorkOrder from './pages/NewWorkOrder'
import LabStats from './pages/LabStats'

import TeamManagement from './pages/TeamManagement'

import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminLabs from './pages/admin/AdminLabs'
import AdminSubscriptions from './pages/admin/AdminSubscriptions'
import AdminLogs from './pages/admin/AdminLogs'
import AdminHealth from './pages/admin/AdminHealth'
import AdminSupport from './pages/admin/AdminSupport'

function ProtectedApp() {
  usePolling()
  const user = useAuthStore((s) => s.user)

  const dashboardRoute = () => {
    switch (user?.role) {
      case 'doctor':      return <DoctorDashboard />
      case 'lab_manager': return <LabDashboard />
      case 'technician':  return <TechnicianView />
      case 'courier':     return <CourierView />
      default:            return <Navigate to="/login" replace />
    }
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/dashboard" element={dashboardRoute()} />
        <Route path="/lab/stats" element={<LabStats />} />
        <Route path="/lab/team" element={<TeamManagement />} />
        <Route path="/orders/new" element={<NewWorkOrder />} />
        <Route path="/orders/:id" element={<WorkOrderDetail />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  const hydrated = useAuthStore((s) => s._hasHydrated)
  // Wait for zustand to load from localStorage before deciding to redirect
  // (fixes mobile Chrome/PWA redirect-to-login loop)
  if (!hydrated) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const hydrated = useAuthStore((s) => s._hasHydrated)
  if (!hydrated) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'super_admin') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="labs" element={<AdminLabs />} />
          <Route path="subscriptions" element={<AdminSubscriptions />} />
          <Route path="logs" element={<AdminLogs />} />
          <Route path="health" element={<AdminHealth />} />
          <Route path="support" element={<AdminSupport />} />
        </Route>

        {/* App routes */}
        <Route
          path="/*"
          element={
            <RequireAuth>
              <ProtectedApp />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

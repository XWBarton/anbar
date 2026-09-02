import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AdminRoute from './components/layout/AdminRoute'
import SetupGuard from './components/layout/SetupGuard'
import AppShell from './components/layout/AppShell'
import LoginPage from './pages/LoginPage'
import SetupPage from './pages/SetupPage'
import DashboardPage from './pages/DashboardPage'
import FindPage from './pages/FindPage'
import PrimersPage from './pages/PrimersPage'
import PrimerDetailPage from './pages/PrimerDetailPage'
import ReagentsPage from './pages/ReagentsPage'
import ReagentDetailPage from './pages/ReagentDetailPage'
import ExtractsPage from './pages/ExtractsPage'
import ExtractDetailPage from './pages/ExtractDetailPage'
import FreezersPage from './pages/FreezersPage'
import FreezerDetailPage from './pages/FreezerDetailPage'
import BoxDetailPage from './pages/BoxDetailPage'
import ExportPage from './pages/ExportPage'
import AdminPage from './pages/AdminPage'
import HelpPage from './pages/HelpPage'

function App() {
  return (
    <AuthProvider>
      <SetupGuard>
        <Routes>
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="find" element={<FindPage />} />
            <Route path="primers" element={<PrimersPage />} />
            <Route path="primers/:id" element={<PrimerDetailPage />} />
            <Route path="reagents" element={<ReagentsPage />} />
            <Route path="reagents/:id" element={<ReagentDetailPage />} />
            <Route path="extracts" element={<ExtractsPage />} />
            <Route path="extracts/:id" element={<ExtractDetailPage />} />
            <Route path="freezers" element={<FreezersPage />} />
            <Route path="freezers/:id" element={<FreezerDetailPage />} />
            <Route path="boxes/:id" element={<BoxDetailPage />} />
            <Route path="export" element={<ExportPage />} />
            <Route path="help" element={<HelpPage />} />
            <Route
              path="admin"
              element={
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              }
            />
          </Route>
        </Routes>
      </SetupGuard>
    </AuthProvider>
  )
}

export default App

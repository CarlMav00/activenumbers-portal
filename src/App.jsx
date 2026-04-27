import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import UploadPage from './pages/UploadPage'
import JobResultsPage from './pages/JobResultsPage'

function PlaceholderPage({ title }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="card p-8 text-center">
        <h1 className="font-serif text-xl text-navy font-semibold mb-2">{title}</h1>
        <p className="text-sm text-slate-400">Coming in Portal Phase 3</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
          <Route path="/jobs/:jobId" element={<ProtectedRoute><JobResultsPage /></ProtectedRoute>} />
          <Route path="/plans" element={<ProtectedRoute><PlaceholderPage title="Plans — Phase 3" /></ProtectedRoute>} />
          <Route path="/billing" element={<ProtectedRoute><PlaceholderPage title="Billing — Phase 3" /></ProtectedRoute>} />
          <Route path="/billing/card" element={<ProtectedRoute><PlaceholderPage title="Add Card — Phase 3" /></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><PlaceholderPage title="Account — Phase 4" /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

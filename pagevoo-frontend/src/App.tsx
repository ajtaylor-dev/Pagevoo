import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import Register from '@/pages/Register'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import UserDashboard from '@/pages/UserDashboard'
import TemplateBuilder from '@/pages/TemplateBuilder'
import WebsiteBuilder from '@/pages/WebsiteBuilder'
import AdminRoute from '@/components/guards/AdminRoute'
import ActiveCustomerRoute from '@/components/guards/ActiveCustomerRoute'
import { API_BASE_URL } from '@/config/constants'

// Redirect component for unknown routes
function RedirectToHome() {
  useEffect(() => {
    window.location.href = API_BASE_URL + '/'
  }, [])
  return null
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth routes - no header/footer */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Dashboard routes - no header/footer */}
          <Route path="/dashboard" element={
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
          } />
          <Route path="/my-dashboard" element={<UserDashboard />} />

          {/* Builder routes - no header/footer, protected */}
          <Route path="/template-builder" element={
            <AdminRoute>
              <TemplateBuilder />
            </AdminRoute>
          } />
          <Route path="/website-builder" element={
            <ActiveCustomerRoute>
              <WebsiteBuilder />
            </ActiveCustomerRoute>
          } />

          {/* Redirect all other routes to Laravel's home page */}
          <Route path="*" element={<RedirectToHome />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

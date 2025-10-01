import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Home from '@/pages/Home'
import Solutions from '@/pages/Solutions'
import WhatsIncluded from '@/pages/WhatsIncluded'
import Pricing from '@/pages/Pricing'
import Support from '@/pages/Support'
import Register from '@/pages/Register'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Dashboard route - no header/footer */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Public routes - with header/footer */}
          <Route path="*" element={
            <div className="min-h-screen bg-white">
              <Header />
              <div className="pt-[72px]">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/solutions" element={<Solutions />} />
                  <Route path="/whats-included" element={<WhatsIncluded />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/support" element={<Support />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/login" element={<Login />} />
                </Routes>
              </div>
              <Footer />
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

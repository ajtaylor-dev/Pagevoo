import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Home from '@/pages/Home'
import Solutions from '@/pages/Solutions'
import WhatsIncluded from '@/pages/WhatsIncluded'
import Pricing from '@/pages/Pricing'
import Support from '@/pages/Support'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white">
        <Header />
        <div className="pt-[72px]">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/solutions" element={<Solutions />} />
            <Route path="/whats-included" element={<WhatsIncluded />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/support" element={<Support />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

export default function Header() {
  const [showAccountButton, setShowAccountButton] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isLoggedIn = false // TODO: Replace with actual auth state

  useEffect(() => {
    const handleScroll = () => {
      const accountBox = document.getElementById('account-box')
      if (accountBox) {
        const rect = accountBox.getBoundingClientRect()
        // Show button when account box is scrolled past (top of box is above viewport)
        setShowAccountButton(rect.bottom < 0)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-6 py-4 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <img src="/Pagevoo_logo_500x200.png" alt="Pagevoo" className="h-10" />
        </div>

        {/* Navigation Links and User Menu - All aligned to the right */}
        <div className="flex items-center space-x-8">
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-600 hover:text-gray-900 transition">
              Features
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition">
              Templates
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition">
              Pricing
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition">
              About
            </a>
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* User Icon - Shows when scrolled past account box */}
            {showAccountButton && (
              <button className="w-9 h-9 bg-[#98b290] rounded-full flex items-center justify-center hover:bg-[#88a280] transition">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            )}
            {isLoggedIn && (
              <Button className="hidden md:flex bg-[#98b290] hover:bg-[#88a280] text-white">
                Create New
              </Button>
            )}

            {/* Mobile Menu Icon */}
            <button
              className="md:hidden w-9 h-9 bg-[#98b290] rounded-full flex items-center justify-center hover:bg-[#88a280] transition"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
          <nav className="flex flex-col py-4 px-6 space-y-4">
            <a href="#" className="text-gray-600 hover:text-gray-900 transition">
              Features
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition">
              Templates
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition">
              Pricing
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition">
              About
            </a>
            {isLoggedIn && (
              <Button className="bg-[#98b290] hover:bg-[#88a280] text-white w-full">
                Create New
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}

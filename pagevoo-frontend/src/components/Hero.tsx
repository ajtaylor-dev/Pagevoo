import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function Hero() {
  const [isLoginExpanded, setIsLoginExpanded] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { user, isAuthenticated, login, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password)
      // Redirect based on user role - need to get fresh user data
      const response = await fetch('http://localhost:8000/api/v1/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      const data = await response.json()
      if (data.success && data.data) {
        navigate(data.data.role === 'admin' ? '/dashboard' : '/my-dashboard')
      }
    } catch (err: any) {
      setError('Invalid credentials')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    setIsLoginExpanded(false)
  }

  return (
    <section className="bg-gradient-to-b from-[#4b4b4b] to-[#3a3a3a] py-6 md:py-24 px-6 relative">
      <div className="max-w-7xl mx-auto">
        {/* Account Box - Positioned at top on mobile, top-right on desktop */}
        <div
          id="account-box"
          className={`mx-auto md:absolute md:top-6 md:right-6 bg-white rounded-lg shadow-lg p-4 mb-12 md:mb-0 transition-all duration-300 ease-in-out ${
            isLoginExpanded
              ? 'w-full md:w-80'
              : 'w-48'
          }`}
        >
          <div className="flex flex-col items-center space-y-3">
            <div className="w-12 h-12 bg-[#98b290] rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>

            {/* Logged In State */}
            {isAuthenticated && !isLoginExpanded && (
              <>
                <p className="text-sm font-medium text-[#4b4b4b]">{user?.name}</p>
                <button
                  onClick={() => navigate(user?.role === 'admin' ? '/dashboard' : '/my-dashboard')}
                  className="w-full bg-[#98b290] hover:bg-[#88a280] text-white px-4 py-2 rounded-md text-sm font-medium transition"
                >
                  Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md text-sm font-medium transition"
                >
                  Logout
                </button>
              </>
            )}

            {/* Login Form - Shows when expanded */}
            {!isAuthenticated && isLoginExpanded && (
              <form onSubmit={handleLogin} className="w-full space-y-3 animate-in fade-in duration-300">
                {error && (
                  <p className="text-red-600 text-xs text-center">{error}</p>
                )}
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#98b290] hover:bg-[#88a280] text-white px-4 py-2 rounded-md text-sm font-medium transition disabled:opacity-50"
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </button>
                <div className="flex justify-between items-center text-xs">
                  <button type="button" className="text-[#98b290] hover:text-[#88a280] transition">
                    Forgot?
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoginExpanded(false)
                      setError('')
                    }}
                    className="text-gray-600 hover:text-gray-900 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Initial Buttons - Shows when not expanded and not logged in */}
            {!isAuthenticated && !isLoginExpanded && (
              <>
                <button
                  onClick={() => setIsLoginExpanded(true)}
                  className="w-full bg-[#98b290] hover:bg-[#88a280] text-white px-4 py-2 rounded-md text-sm font-medium transition"
                >
                  Login
                </button>
                <Link
                  to="/register"
                  className="w-full border border-[#98b290] text-[#98b290] hover:bg-[#98b290] hover:text-white px-4 py-2 rounded-md text-sm font-medium transition text-center block"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Hero Content */}
        <div className="text-center">
          <img
            src="/Pagevoo_logo_wide.png"
            alt="Pagevoo"
            className="mx-auto mb-6 max-w-md md:max-w-2xl w-full"
          />
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-4">
            Your complete business solution, ready to launch
          </p>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Industry-specific websites with booking, ordering, CMS, and everything your business needs — ready to go.
          </p>
        </div>
      </div>
    </section>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { API_BASE_URL } from '@/config/constants'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password)
      // Redirect based on user role
      const response = await fetch(`${API_BASE_URL}/api/v1/me`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      const data = await response.json()
      if (data.success && data.data) {
        navigate(data.data.role === 'admin' ? '/dashboard' : '/my-dashboard')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#4b4b4b] to-[#3a3a3a] flex items-center justify-center py-12 px-6">
      <div className="w-full max-w-md">
        {/* Account Box - Same style as Hero */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-[#98b290] rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-[#4b4b4b]">Welcome Back</h1>

            {/* Error Message */}
            {error && (
              <div className="w-full bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="w-full space-y-3">
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
                <Link to="/" className="text-gray-600 hover:text-gray-900 transition">
                  Back to Home
                </Link>
              </div>
            </form>

            {/* Sign Up Link */}
            <div className="text-center text-sm text-gray-600 pt-4 border-t w-full">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#98b290] hover:text-[#88a280] font-medium">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

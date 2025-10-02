import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface ActiveCustomerRouteProps {
  children: React.ReactNode
}

export default function ActiveCustomerRoute({ children }: ActiveCustomerRouteProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#98b290]"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.account_status !== 'active' && user.account_status !== 'trial') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg mb-4">
            <h2 className="text-xl font-bold mb-2">Active Package Required</h2>
            <p>You need an active package to access the Website Builder. Please purchase a package to continue.</p>
          </div>
          <a href="/pricing" className="inline-block bg-[#98b290] hover:bg-[#88a280] text-white px-6 py-3 rounded-md font-medium transition mr-2">
            View Packages
          </a>
          <a href="/dashboard" className="inline-block text-[#98b290] hover:underline">
            Return to Dashboard
          </a>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

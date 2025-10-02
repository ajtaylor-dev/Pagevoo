import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface AdminRouteProps {
  children: React.ReactNode
}

export default function AdminRoute({ children }: AdminRouteProps) {
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

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p>You do not have permission to access this page. Admin access required.</p>
          </div>
          <a href="/dashboard" className="text-[#98b290] hover:underline">
            Return to Dashboard
          </a>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

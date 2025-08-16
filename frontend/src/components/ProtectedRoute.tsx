import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/auth'
export default function ProtectedRoute({ children, requireAdmin = false }: { children: JSX.Element, requireAdmin?: boolean }) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" />
  if (requireAdmin && user.role !== 'admin') return <Navigate to="/dashboard" />
  return children
}

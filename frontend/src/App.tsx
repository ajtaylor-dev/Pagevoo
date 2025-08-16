import { Routes, Route, Navigate, Link } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import Editor from './pages/Editor'
import ProtectedRoute from './components/ProtectedRoute'
import useAuthStore from './store/auth'
import './styles/tokens.css'
import './styles/utilities.css'

export default function App() {
  const { user, logout } = useAuthStore()
  return (
    <div>
      <nav className="nav">
        <div className="container nav-inner">
          <Link to="/" className="badge">Pagevoo</Link>
          <div className="stack">
            {user ? (
              <>
                <Link to="/dashboard" className="small">Dashboard</Link>
                {user.role === 'admin' && <Link to="/admin" className="small">Admin</Link>}
                <button onClick={logout} className="button small">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="button small">Login</Link>
                <Link to="/register" className="button small">Register</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main>
        <div className="container">
          <Routes>
            <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
            <Route path="/editor" element={<ProtectedRoute><Editor /></ProtectedRoute>} />
            <Route path="*" element={<div className="page"><div className="card">Not Found</div></div>} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

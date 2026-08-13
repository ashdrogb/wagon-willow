import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="page"><div className="container"><p className="state-msg">Loading…</p></div></div>
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

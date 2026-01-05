import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/Auth'
import './ProtectedRoute.css'

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <div className="protected-route__loading">Cargando sesión...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export default ProtectedRoute

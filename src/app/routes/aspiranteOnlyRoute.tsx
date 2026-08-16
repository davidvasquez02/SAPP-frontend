import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/Auth'

export const AspiranteOnlyRoute = () => {
  const { isAuthenticated, session } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (session?.kind !== 'ASPIRANTE') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

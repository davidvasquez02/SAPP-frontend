import { Outlet } from 'react-router-dom'
import { useAuth } from '../../context/Auth'

export const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <main aria-live="polite">No hay una sesión institucional activa.</main>
  }

  return <Outlet />
}

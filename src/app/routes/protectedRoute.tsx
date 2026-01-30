import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/Auth'

export const ProtectedRoute = () => {
  const { isAuthenticated, session, logout } = useAuth()
  const isExpired =
    session?.kind === 'SAPP' && session.expiresAt
      ? Math.floor(Date.now() / 1000) >= session.expiresAt
      : false

  useEffect(() => {
    if (isExpired) {
      logout()
    }
  }, [isExpired, logout])

  if (!isAuthenticated || isExpired) {
    return <Navigate to="/login" replace />
  }

  if (session?.kind === 'ASPIRANTE') {
    return <Navigate to="/aspirante/documentos" replace />
  }

  return <Outlet />
}

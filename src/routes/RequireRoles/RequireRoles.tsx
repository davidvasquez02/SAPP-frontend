import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/Auth'
import { hasAnyRole } from '../../auth/roleGuards'

type RequireRolesProps = {
  allowedRoles: string[]
  children: ReactNode
}

const RequireRoles = ({ allowedRoles, children }: RequireRolesProps) => {
  const { session } = useAuth()

  if (!session || session.kind !== 'SAPP') {
    return <Navigate to="/login" replace />
  }

  if (!hasAnyRole(session.user.roles, allowedRoles)) {
    return <Navigate to="/" replace />
  }

  return children
}

export default RequireRoles

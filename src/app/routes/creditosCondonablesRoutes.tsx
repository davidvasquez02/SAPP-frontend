import { Route } from 'react-router-dom'
import type { ReactNode } from 'react'
import { ROLES } from '../../auth/roleGuards'
import { CreditosCondonablesCoordinacionPage, SolicitudDetallePage } from '../../pages'
import RequireRoles from '../../routes/RequireRoles/RequireRoles'

const coordinatorOnly = (page: ReactNode) => (
  <RequireRoles allowedRoles={[ROLES.COORDINACION]}>{page}</RequireRoles>
)

export const creditosCondonablesRoutes = (
  <>
    <Route path="/creditos-condonables" element={coordinatorOnly(<CreditosCondonablesCoordinacionPage />)} />
    <Route path="/creditos-condonables/:solicitudId" element={coordinatorOnly(<SolicitudDetallePage />)} />
  </>
)

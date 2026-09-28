import { Route } from 'react-router-dom'
import type { ReactNode } from 'react'
import { ROLES_GESTION_POSGRADOS } from '../../auth/roleGuards'
import { CreditosCondonablesCoordinacionPage, SolicitudDetallePage } from '../../pages'
import RequireRoles from '../../routes/RequireRoles/RequireRoles'

const posgradosManagementOnly = (page: ReactNode) => (
  <RequireRoles allowedRoles={ROLES_GESTION_POSGRADOS}>{page}</RequireRoles>
)

export const creditosCondonablesRoutes = (
  <>
    <Route path="/creditos-condonables" element={posgradosManagementOnly(<CreditosCondonablesCoordinacionPage />)} />
    <Route path="/creditos-condonables/:solicitudId" element={posgradosManagementOnly(<SolicitudDetallePage />)} />
  </>
)

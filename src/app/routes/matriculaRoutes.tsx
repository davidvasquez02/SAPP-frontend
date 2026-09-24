import { Navigate, Route } from 'react-router-dom'
import { MatriculaDetalleCoordinacionPage, MatriculaFinancieraPage, MatriculaHomePage, MatriculaPage, ProcesoLiquidacionPage } from '../../pages'
import RequireRoles from '../../routes/RequireRoles/RequireRoles'
import { ROLES_GESTION_POSGRADOS } from '../../auth/roleGuards'

export const matriculaRoutes = (
  <>
    <Route path="/matricula" element={<MatriculaHomePage />} />
    <Route path="/matricula/academica" element={<MatriculaPage />} />
    <Route path="/matricula/academica/:matriculaId" element={<MatriculaDetalleCoordinacionPage />} />
    <Route path="/matricula/financiera" element={<MatriculaFinancieraPage />} />
    <Route path="/matricula/financiera/procesos/:procesoId" element={<RequireRoles allowedRoles={ROLES_GESTION_POSGRADOS}><ProcesoLiquidacionPage /></RequireRoles>} />
    <Route path="/matricula/:matriculaId" element={<Navigate to="/matricula/academica" replace />} />
  </>
)

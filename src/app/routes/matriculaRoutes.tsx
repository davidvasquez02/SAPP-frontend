import { Route } from 'react-router-dom'
import { LiquidacionDetallePage } from '../../pages/MatriculaFinanciera/LiquidacionDetallePage'
import { TarifasMatriculaPage } from '../../pages/MatriculaFinanciera/TarifasMatriculaPage'
import { MatriculaDetalleCoordinacionPage, MatriculaFinancieraPage, MatriculaHomePage, MatriculaPage, ProcesoLiquidacionPage } from '../../pages'
import RequireRoles from '../../routes/RequireRoles/RequireRoles'
import { ROLES_GESTION_POSGRADOS } from '../../auth/roleGuards'
import LegacyMatriculaDetailRedirect from './LegacyMatriculaDetailRedirect'

export const matriculaRoutes = (
  <>
    <Route path="/matricula" element={<MatriculaHomePage />} />
    <Route path="/matricula/academica" element={<MatriculaPage />} />
    <Route path="/matricula/academica/:matriculaId" element={<MatriculaDetalleCoordinacionPage />} />
    <Route path="/matricula/financiera" element={<MatriculaFinancieraPage />} />
    <Route path="/matricula/financiera/procesos/:procesoId" element={<RequireRoles allowedRoles={ROLES_GESTION_POSGRADOS}><ProcesoLiquidacionPage /></RequireRoles>} />
    <Route path="/matricula/financiera/tarifas" element={<RequireRoles allowedRoles={ROLES_GESTION_POSGRADOS}><TarifasMatriculaPage /></RequireRoles>} />
    <Route path="/matricula/financiera/procesos/:procesoId/liquidaciones/:liquidacionId" element={<RequireRoles allowedRoles={ROLES_GESTION_POSGRADOS}><LiquidacionDetallePage /></RequireRoles>} />
    <Route path="/matricula/:matriculaId" element={<LegacyMatriculaDetailRedirect />} />
  </>
)

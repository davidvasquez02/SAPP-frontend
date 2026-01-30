import { Navigate, Route, Routes } from 'react-router-dom'
import { AspiranteLayout, Layout } from '../../components'
import { useAuth } from '../../context/Auth'
import {
  AdmisionesHomePage,
  AspiranteLoginPage,
  ConvocatoriaDetallePage,
  HomePage,
  InscripcionAdmisionDetallePage,
  LoginPage,
} from '../../pages'
import RequireRoles from '../../routes/RequireRoles/RequireRoles'
import { ROLES } from '../../auth/roleGuards'
import { aspiranteRoutes } from './aspiranteRoutes'
import { AspiranteOnlyRoute } from './aspiranteOnlyRoute'
import { creditosRoutes } from './creditosRoutes'
import { matriculaRoutes } from './matriculaRoutes'
import { ProtectedRoute } from './protectedRoute'
import { solicitudesRoutes } from './solicitudesRoutes'

export const AppRoutes = () => {
  const { isAuthenticated, session } = useAuth()
  const loginRedirect = session?.kind === 'ASPIRANTE' ? '/aspirante/documentos' : '/'

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to={loginRedirect} replace /> : <LoginPage />
        }
      />
      <Route path="/login/aspirante" element={<AspiranteLoginPage />} />
      <Route element={<AspiranteOnlyRoute />}>
        <Route element={<AspiranteLayout />} path="/aspirante">
          {aspiranteRoutes}
        </Route>
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/admisiones"
            element={
              <RequireRoles allowedRoles={[ROLES.COORDINACION, ROLES.SECRETARIA]}>
                <AdmisionesHomePage />
              </RequireRoles>
            }
          />
          <Route
            path="/admisiones/convocatoria/:convocatoriaId"
            element={
              <RequireRoles allowedRoles={[ROLES.COORDINACION, ROLES.SECRETARIA]}>
                <ConvocatoriaDetallePage />
              </RequireRoles>
            }
          />
          <Route
            path="/admisiones/convocatoria/:convocatoriaId/inscripcion/:inscripcionId"
            element={
              <RequireRoles allowedRoles={[ROLES.COORDINACION, ROLES.SECRETARIA]}>
                <InscripcionAdmisionDetallePage />
              </RequireRoles>
            }
          />
          {solicitudesRoutes}
          {matriculaRoutes}
          {creditosRoutes}
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

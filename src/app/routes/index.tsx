import { Navigate, Route, Routes } from 'react-router-dom'
import { AspiranteLayout, Layout } from '../../components'
import { useAuth } from '../../context/Auth'
import {
  AdmisionesHomePage,
  AdmisionesProfesorPage,
  AspiranteLoginPage,
  ConvocatoriaDetallePage,
  ConvocatoriasAdmisionConfigPage,
  EstudianteDetalleCoordinacionPage,
  EstudiantesCoordinacionPage,
  HomePage,
  InscripcionAdmisionDetallePage,
  InscripcionDocumentosPage,
  InscripcionEntrevistasPage,
  InscripcionExamenPage,
  InscripcionHojaVidaPage,
  LoginPage,
} from '../../pages'
import RequireRoles from '../../routes/RequireRoles/RequireRoles'
import { hasAnyRole, isProfesor, ROLES } from '../../auth/roleGuards'
import RequireEvaluacionEnabled from '../../modules/admisiones/routes/RequireEvaluacionEnabled'
import { aspiranteRoutes } from './aspiranteRoutes'
import { AspiranteOnlyRoute } from './aspiranteOnlyRoute'
import { creditosRoutes } from './creditosRoutes'
import { matriculaRoutes } from './matriculaRoutes'
import { ProtectedRoute } from './protectedRoute'
import { solicitudesRoutes } from './solicitudesRoutes'

export const AppRoutes = () => {
  const { isAuthenticated, session } = useAuth()
  const loginRedirect = session?.kind === 'ASPIRANTE' ? '/aspirante/documentos' : '/'
  const sappRoles = session?.kind === 'SAPP' ? session.user.roles : []
  const isProfesorOnly = isProfesor(sappRoles)
  const canManageAdmisiones =
    session?.kind === 'SAPP' && hasAnyRole(sappRoles, [ROLES.ADMIN, ROLES.COORDINACION, ROLES.SECRETARIA])

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
              <RequireRoles allowedRoles={[ROLES.ADMIN, ROLES.COORDINACION, ROLES.SECRETARIA, ROLES.PROFESOR, ROLES.DOCENTE]}>
                {isProfesorOnly && !canManageAdmisiones ? (
                  <AdmisionesProfesorPage />
                ) : (
                  <AdmisionesHomePage />
                )}
              </RequireRoles>
            }
          />
          <Route
            path="/admisiones/convocatorias"
            element={
              <RequireRoles allowedRoles={[ROLES.ADMIN, ROLES.COORDINACION]}>
                <ConvocatoriasAdmisionConfigPage />
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
              <RequireRoles allowedRoles={[ROLES.COORDINACION, ROLES.SECRETARIA, ROLES.ADMIN, ROLES.PROFESOR, ROLES.DOCENTE]}>
                <InscripcionAdmisionDetallePage />
              </RequireRoles>
            }
          >
            <Route path="documentos" element={<InscripcionDocumentosPage />} />
            <Route
              path="hoja-vida"
              element={
                <RequireEvaluacionEnabled etapa="HOJA_DE_VIDA">
                  <InscripcionHojaVidaPage />
                </RequireEvaluacionEnabled>
              }
            />
            <Route
              path="examen"
              element={
                <RequireEvaluacionEnabled etapa="EXAMEN_DE_CONOCIMIENTOS">
                  <InscripcionExamenPage />
                </RequireEvaluacionEnabled>
              }
            />
            <Route
              path="entrevistas"
              element={
                <RequireEvaluacionEnabled etapa="ENTREVISTA">
                  <InscripcionEntrevistasPage />
                </RequireEvaluacionEnabled>
              }
            />
          </Route>
          <Route
            path="/coordinacion/estudiantes"
            element={
              <RequireRoles allowedRoles={[ROLES.ADMIN, ROLES.COORDINACION]}>
                <EstudiantesCoordinacionPage />
              </RequireRoles>
            }
          />
          <Route
            path="/coordinacion/estudiantes/:estudianteId"
            element={
              <RequireRoles allowedRoles={[ROLES.ADMIN, ROLES.COORDINACION]}>
                <EstudianteDetalleCoordinacionPage />
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

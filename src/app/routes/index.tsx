import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "../../components";
import { useAuth } from "../../context/Auth";
import {
  AdmisionesHomePage,
  ActasPage,
  AdmisionesProfesorPage,
  ConvocatoriaDetallePage,
  ConvocatoriasAdmisionConfigPage,
  ConfigFechasAdmisionesPage,
  FechasModulePage,
  EstudianteDetalleCoordinacionPage,
  EstudiantesCoordinacionPage,
  GestionProfesoresPage,
  HomePage,
  PerfilPage,
  ReportesPage,
  InscripcionAdmisionDetallePage,
  InscripcionDocumentosPage,
  InscripcionEntrevistasPage,
  InscripcionExamenPage,
  InscripcionHojaVidaPage,
} from "../../pages";
import RequireRoles from "../../routes/RequireRoles/RequireRoles";
import { canManagePosgrados, isEvaluadorAdmision, ROLES, ROLES_GESTION_POSGRADOS } from "../../auth/roleGuards";
import RequireEvaluacionEnabled from "../../modules/admisiones/routes/RequireEvaluacionEnabled";
import { creditosRoutes } from "./creditosRoutes";
import { creditosCondonablesRoutes } from "./creditosCondonablesRoutes";
import { matriculaRoutes } from "./matriculaRoutes";
import { ProtectedRoute } from "./protectedRoute";
import { solicitudesRoutes } from "./solicitudesRoutes";

export const AppRoutes = () => {
  const { session } = useAuth();
  const sappRoles = session?.kind === "SAPP" ? session.user.roles : [];
  const isEvaluadorAdmisionOnly = isEvaluadorAdmision(sappRoles);
  const canManageAdmisiones =
    session?.kind === "SAPP" &&
    canManagePosgrados(sappRoles);

  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/perfil" element={<PerfilPage />} />
          <Route
            path="/admisiones"
            element={
              <RequireRoles
                allowedRoles={[
                  ROLES.ADMIN,
                  ROLES.COORDINACION,
                  ROLES.SECRETARIA,
                  ROLES.PROFESOR,
                  ROLES.DOCENTE,
                  ROLES.DIRECTOR,
                ]}
              >
                {isEvaluadorAdmisionOnly && !canManageAdmisiones ? (
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
              <RequireRoles allowedRoles={ROLES_GESTION_POSGRADOS}>
                <ConvocatoriasAdmisionConfigPage />
              </RequireRoles>
            }
          />
          <Route
            path="/fechas/periodos"
            element={
              <RequireRoles allowedRoles={ROLES_GESTION_POSGRADOS}>
                <ConfigFechasAdmisionesPage />
              </RequireRoles>
            }
          />
          <Route
            path="/admisiones/convocatoria/:convocatoriaId"
            element={
              <RequireRoles allowedRoles={ROLES_GESTION_POSGRADOS}>
                <ConvocatoriaDetallePage />
              </RequireRoles>
            }
          />
          <Route
            path="/admisiones/convocatoria/:convocatoriaId/inscripcion/:inscripcionId"
            element={
              <RequireRoles
                allowedRoles={[
                  ROLES.COORDINACION,
                  ROLES.SECRETARIA,
                  ROLES.ADMIN,
                  ROLES.PROFESOR,
                  ROLES.DOCENTE,
                  ROLES.DIRECTOR,
                ]}
              >
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
            path="/actas"
            element={
              <RequireRoles allowedRoles={ROLES_GESTION_POSGRADOS}>
                <ActasPage />
              </RequireRoles>
            }
          />
          <Route
            path="/fechas"
            element={
              <RequireRoles allowedRoles={ROLES_GESTION_POSGRADOS}>
                <FechasModulePage />
              </RequireRoles>
            }
          />
          <Route
            path="/coordinacion/reportes"
            element={
              <RequireRoles allowedRoles={ROLES_GESTION_POSGRADOS}>
                <ReportesPage />
              </RequireRoles>
            }
          />
          <Route
            path="/coordinacion/estudiantes"
            element={
              <RequireRoles allowedRoles={ROLES_GESTION_POSGRADOS}>
                <EstudiantesCoordinacionPage />
              </RequireRoles>
            }
          />
          <Route
            path="/coordinacion/estudiantes/:estudianteId"
            element={
              <RequireRoles allowedRoles={ROLES_GESTION_POSGRADOS}>
                <EstudianteDetalleCoordinacionPage />
              </RequireRoles>
            }
          />
          <Route
            path="/coordinacion/profesores"
            element={
              <RequireRoles allowedRoles={ROLES_GESTION_POSGRADOS}>
                <GestionProfesoresPage />
              </RequireRoles>
            }
          />
          {solicitudesRoutes}
          {matriculaRoutes}
          {creditosRoutes}
          {creditosCondonablesRoutes}
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

import { Route } from 'react-router-dom'
import AdministracionRedirect from './AdministracionRedirect'
import RequireRoles from '../../routes/RequireRoles/RequireRoles'
import { ROLES_GESTION_POSGRADOS } from '../../auth/roleGuards'
import AdministracionAcademicaLayout from '../../pages/AdministracionAcademica/AdministracionAcademicaLayout'
import FechasModulePage from '../../pages/FechasModule/FechasModulePage'
import ConfigFechasAdmisionesPage from '../../pages/ConfigFechasAdmisiones/ConfigFechasAdmisionesPage'
import GestionProfesoresPage from '../../pages/GestionProfesores/GestionProfesoresPage'
import GestionGruposInvestigacionPage from '../../pages/GestionGruposInvestigacion/GestionGruposInvestigacionPage'
import GrupoInvestigacionFormPage from '../../pages/GestionGruposInvestigacion/GrupoInvestigacionFormPage'
import InstitucionesGrupoPage from '../../pages/GestionGruposInvestigacion/InstitucionesGrupoPage'
import InstitucionFormPage from '../../pages/GestionGruposInvestigacion/InstitucionFormPage'
import ProfesoresGrupoPage from '../../pages/GestionGruposInvestigacion/ProfesoresGrupoPage'
import PlantillasCorreoPage from '../../pages/PlantillasCorreo/PlantillasCorreoPage'
import PlantillaCorreoFormPage from '../../pages/PlantillasCorreo/PlantillaCorreoFormPage'
import {
  RUTA_ADMINISTRACION,
  RUTAS_ANTERIORES_ADMINISTRACION,
} from '../../modules/administracionAcademica/rutas'

export const administracionAcademicaRoutes = (
  <>
    <Route path={RUTA_ADMINISTRACION} element={
      <RequireRoles allowedRoles={ROLES_GESTION_POSGRADOS}>
        <AdministracionAcademicaLayout />
      </RequireRoles>
    }>
      <Route index element={<AdministracionRedirect />} />
      <Route path="calendario" element={<FechasModulePage />} />
      <Route path="calendario/periodos" element={<ConfigFechasAdmisionesPage />} />
      <Route path="profesores" element={<GestionProfesoresPage />} />
      <Route path="grupos-investigacion" element={<GestionGruposInvestigacionPage />} />
      <Route path="grupos-investigacion/nuevo" element={<GrupoInvestigacionFormPage />} />
      <Route path="grupos-investigacion/:grupoId/editar" element={<GrupoInvestigacionFormPage />} />
      <Route path="grupos-investigacion/profesores" element={<ProfesoresGrupoPage />} />
      <Route path="grupos-investigacion/instituciones" element={<InstitucionesGrupoPage />} />
      <Route path="grupos-investigacion/instituciones/escuelas/nueva" element={<InstitucionFormPage tipo="ESCUELA" />} />
      <Route path="grupos-investigacion/instituciones/facultades/nueva" element={<InstitucionFormPage tipo="FACULTAD" />} />
      <Route path="plantillas-correo" element={<PlantillasCorreoPage />} />
      <Route path="plantillas-correo/:plantillaId/editar" element={<PlantillaCorreoFormPage />} />
    </Route>
    {RUTAS_ANTERIORES_ADMINISTRACION.map(({ anterior }) => (
      <Route key={anterior} path={`${anterior}/*`} element={
        <RequireRoles allowedRoles={ROLES_GESTION_POSGRADOS}>
          <AdministracionRedirect />
        </RequireRoles>
      } />
    ))}
  </>
)

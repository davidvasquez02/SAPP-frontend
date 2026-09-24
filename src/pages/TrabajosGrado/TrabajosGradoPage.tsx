import { useMemo } from 'react'
import { Navigate, NavLink, useParams } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import { canManagePosgrados, hasAnyRole, ROLES } from '../../auth/roleGuards'
import { useAuth } from '../../context/Auth'
import SolicitudesCoordinadorView from '../../modules/solicitudes/components/SolicitudesCoordinadorView/SolicitudesCoordinadorView'
import SolicitudesEstudianteView from '../../modules/solicitudes/components/SolicitudesEstudianteView/SolicitudesEstudianteView'
import {
  getNivelTrabajoGrado,
  correspondeSolicitudANivel,
  TIPOS_TRABAJO_GRADO_POR_NIVEL,
  type NivelTrabajoGrado,
} from '../../modules/trabajos-grado/constants'
import './TrabajosGradoPage.css'

const isNivel = (value: string | undefined): value is NivelTrabajoGrado =>
  value === 'maestria' || value === 'doctorado'

const TrabajosGradoPage = () => {
  const { nivel } = useParams<{ nivel?: string }>()
  const { session } = useAuth()
  const roles = useMemo(() => (session?.kind === 'SAPP' ? session.user.roles : []), [session])
  const isEstudiante = hasAnyRole(roles, ['ESTUDIANTE'])
  const isCoordinacion = canManagePosgrados(roles)
  const isCoordinador = hasAnyRole(roles, [ROLES.COORDINACION])
  const programa = session?.kind === 'SAPP' ? session.user.estudiante?.programaCodigoNombre ?? session.user.programa : undefined
  const nivelEstudiante = getNivelTrabajoGrado(programa)
  const nivelSeleccionado = isNivel(nivel) ? nivel : nivelEstudiante
  const filterSolicitud = useMemo(
    () => (solicitud: Parameters<typeof correspondeSolicitudANivel>[0]) =>
      correspondeSolicitudANivel(solicitud, nivelSeleccionado),
    [nivelSeleccionado],
  )

  if (!nivel) {
    return <Navigate to={`/trabajos-grado/${isEstudiante ? nivelEstudiante : 'maestria'}`} replace />
  }

  if (!isNivel(nivel) || (isEstudiante && nivel !== nivelEstudiante)) {
    return <Navigate to={`/trabajos-grado/${nivelEstudiante}`} replace />
  }

  const tipos = TIPOS_TRABAJO_GRADO_POR_NIVEL[nivel]
  const titulo = nivel === 'doctorado' ? 'Tesis doctoral' : 'Trabajo de investigación de maestría'
  const detailPath = (solicitudId: number) => `/trabajos-grado/${nivel}/solicitudes/${solicitudId}`
  const usuarioSappId = session?.kind === 'SAPP' ? session.user.id : null

  return (
    <ModuleLayout title="Proyectos de grado">
      <section className="trabajos-grado-page">
        {isCoordinacion ? (
          <nav className="trabajos-grado-page__levels" aria-label="Nivel del proyecto">
            <NavLink to="/trabajos-grado/maestria">Trabajo de investigación de maestría</NavLink>
            <NavLink to="/trabajos-grado/doctorado">Tesis doctoral</NavLink>
          </nav>
        ) : null}
        <header className="trabajos-grado-page__header">
          <p className="trabajos-grado-page__eyebrow">{isCoordinacion ? 'Gestión de coordinación' : 'Mi proyecto de grado'}</p>
          <h3>{titulo}</h3>
        </header>

        {isEstudiante ? (
          <SolicitudesEstudianteView
            includeTipoSolicitudIds={tipos}
            detailPath={detailPath}
            filterSolicitud={filterSolicitud}
            showAllEstadoOptions
          />
        ) : isCoordinacion && usuarioSappId !== null ? (
          <SolicitudesCoordinadorView
            usuarioSappId={usuarioSappId}
            hideAssignedList={isCoordinador}
            includeTipoSolicitudIds={tipos}
            detailPath={detailPath}
            filterSolicitud={filterSolicitud}
            showAllEstadoOptions
          />
        ) : (
          <p className="trabajos-grado-page__status">No tienes permisos para consultar este módulo.</p>
        )}
      </section>
    </ModuleLayout>
  )
}

export default TrabajosGradoPage

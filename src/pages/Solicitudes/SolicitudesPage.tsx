import { useEffect, useMemo } from 'react'
import { ModuleLayout } from '../../components'
import { canManagePosgrados, hasAnyRole, isProfesor, ROLES } from '../../auth/roleGuards'
import { useAuth } from '../../context/Auth'
import SolicitudesCoordinadorView from '../../modules/solicitudes/components/SolicitudesCoordinadorView/SolicitudesCoordinadorView'
import SolicitudesEstudianteView from '../../modules/solicitudes/components/SolicitudesEstudianteView/SolicitudesEstudianteView'
import { getEstadosSolicitudCatalog } from '../../modules/solicitudes/api/estadoSolicitudService'
import './SolicitudesPage.css'
import { TIPOS_TRABAJO_GRADO_IDS } from '../../modules/trabajos-grado/constants'
import { TIPOS_SOLICITUD_GENERAL_IDS } from '../../modules/solicitudes/constants'

const SolicitudesPage = () => {
  const { session } = useAuth()
  const roles = useMemo(() => (session?.kind === 'SAPP' ? session.user.roles : []), [session])
  const isCoord = canManagePosgrados(roles)
  const isCoordinador = hasAnyRole(roles, [ROLES.COORDINACION])
  const isCoordinadorCreditos = canManagePosgrados(roles)
  const isProfesorRole = isProfesor(roles)
  const isDirector = hasAnyRole(roles, [ROLES.DIRECTOR])
  const isEstudiante = hasAnyRole(roles, [ROLES.ESTUDIANTE])
  const canUseCoordinadorList = isCoord || isProfesorRole || isDirector
  const isProfesorOnly = hasAnyRole(roles, ['PROFESOR']) && !isCoord && !isDirector
  const usuarioSappId = session?.kind === 'SAPP' ? session.user.id : null


  useEffect(() => {
    getEstadosSolicitudCatalog().catch(() => {
      // fallback al catálogo local
    })
  }, [])

  return (
    <ModuleLayout title="Solicitudes">
      {isEstudiante ? (
        <SolicitudesEstudianteView excludeTipoSolicitudIds={TIPOS_TRABAJO_GRADO_IDS} />
      ) : canUseCoordinadorList ? (
        usuarioSappId === null ? (
          <p className="solicitudes-page__status">No fue posible identificar el usuario.</p>
        ) : (
          <SolicitudesCoordinadorView
            usuarioSappId={usuarioSappId}
            readOnly={!isCoord}
            assignedOnly={isProfesorOnly || isDirector}
            hideAssignedList={isCoordinador}
            excludeCreditosCondonables={isCoordinadorCreditos}
            includeTipoSolicitudIds={
              isProfesorOnly || isDirector ? undefined : TIPOS_SOLICITUD_GENERAL_IDS
            }
            excludeTipoSolicitudIds={TIPOS_TRABAJO_GRADO_IDS}
          />
        )
      ) : (
        <p className="solicitudes-page__status">No tienes permisos.</p>
      )}
    </ModuleLayout>
  )
}

export default SolicitudesPage

import { useEffect, useMemo } from 'react'
import { ModuleLayout } from '../../components'
import { hasAnyRole, isProfesor } from '../../auth/roleGuards'
import { useAuth } from '../../context/Auth'
import SolicitudesCoordinadorView from '../../modules/solicitudes/components/SolicitudesCoordinadorView/SolicitudesCoordinadorView'
import SolicitudesEstudianteView from '../../modules/solicitudes/components/SolicitudesEstudianteView/SolicitudesEstudianteView'
import { getEstadosSolicitudCatalog } from '../../modules/solicitudes/api/estadoSolicitudService'
import './SolicitudesPage.css'

const SolicitudesPage = () => {
  const { session } = useAuth()
  const roles = useMemo(() => (session?.kind === 'SAPP' ? session.user.roles : []), [session])
  const isCoord = hasAnyRole(roles, ['COORDINADOR', 'ADMIN'])
  const isProfesorRole = isProfesor(roles)
  const isDirector = hasAnyRole(roles, ['DIRECTOR'])
  const isEstudiante = hasAnyRole(roles, ['ESTUDIANTE'])
  const canUseCoordinadorList = isCoord || isProfesorRole || isDirector
  const usuarioSappId = session?.kind === 'SAPP' ? session.user.id : null


  useEffect(() => {
    getEstadosSolicitudCatalog().catch(() => {
      // fallback al catálogo local
    })
  }, [])

  return (
    <ModuleLayout title="Solicitudes">
      {isEstudiante ? (
        <SolicitudesEstudianteView />
      ) : canUseCoordinadorList ? (
        usuarioSappId === null ? (
          <p className="solicitudes-page__status">No fue posible identificar el usuario.</p>
        ) : (
          <SolicitudesCoordinadorView usuarioSappId={usuarioSappId} readOnly={!isCoord} />
        )
      ) : (
        <p className="solicitudes-page__status">No tienes permisos.</p>
      )}
    </ModuleLayout>
  )
}

export default SolicitudesPage

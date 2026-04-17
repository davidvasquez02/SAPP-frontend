import { useMemo } from 'react'
import { ModuleLayout } from '../../components'
import { hasAnyRole, isProfesor } from '../../auth/roleGuards'
import { useAuth } from '../../context/Auth'
import SolicitudesCoordinadorView from '../../modules/solicitudes/components/SolicitudesCoordinadorView/SolicitudesCoordinadorView'
import SolicitudesEstudianteView from '../../modules/solicitudes/components/SolicitudesEstudianteView/SolicitudesEstudianteView'
import './SolicitudesPage.css'

const SolicitudesPage = () => {
  const { session } = useAuth()
  const roles = useMemo(() => (session?.kind === 'SAPP' ? session.user.roles : []), [session])
  const isCoord = hasAnyRole(roles, ['COORDINADOR', 'ADMIN'])
  const isProfesorRole = isProfesor(roles)
  const isEstudiante = hasAnyRole(roles, ['ESTUDIANTE'])
  const canUseCoordinadorList = isCoord || isProfesorRole

  return (
    <ModuleLayout title="Solicitudes">
      {isEstudiante ? (
        <SolicitudesEstudianteView />
      ) : canUseCoordinadorList ? (
        <SolicitudesCoordinadorView readOnly={!isCoord} />
      ) : (
        <p className="solicitudes-page__status">No tienes permisos.</p>
      )}
    </ModuleLayout>
  )
}

export default SolicitudesPage

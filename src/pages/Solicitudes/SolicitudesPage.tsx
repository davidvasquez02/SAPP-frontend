import { useMemo } from 'react'
import { ModuleLayout } from '../../components'
import { hasAnyRole } from '../../auth/roleGuards'
import { useAuth } from '../../context/Auth'
import SolicitudesCoordinadorView from '../../modules/solicitudes/components/SolicitudesCoordinadorView/SolicitudesCoordinadorView'
import SolicitudesEstudianteView from '../../modules/solicitudes/components/SolicitudesEstudianteView/SolicitudesEstudianteView'
import './SolicitudesPage.css'

const SolicitudesPage = () => {
  const { session } = useAuth()
  const roles = useMemo(() => (session?.kind === 'SAPP' ? session.user.roles : []), [session])
  const isCoord = hasAnyRole(roles, ['COORDINADOR', 'ADMIN'])
  const isEstudiante = hasAnyRole(roles, ['ESTUDIANTE'])

  return (
    <ModuleLayout title="Solicitudes">
      {isCoord ? (
        <SolicitudesCoordinadorView />
      ) : isEstudiante ? (
        <SolicitudesEstudianteView />
      ) : (
        <p className="solicitudes-page__status">No tienes permisos.</p>
      )}
    </ModuleLayout>
  )
}

export default SolicitudesPage

import { useEffect, useMemo, useState } from 'react'
import { ModuleLayout } from '../../components'
import { hasAnyRole } from '../../auth/roleGuards'
import { useAuth } from '../../context/Auth'
import SolicitudEstudianteForm from '../../modules/solicitudes/components/SolicitudEstudianteForm/SolicitudEstudianteForm'
import SolicitudesCoordinadorGrid from '../../modules/solicitudes/components/SolicitudesCoordinadorGrid/SolicitudesCoordinadorGrid'
import { fetchSolicitudesCoordinador, fetchTiposSolicitud } from '../../modules/solicitudes/services/solicitudesMockService'
import type { SolicitudCoordinadorDto, TipoSolicitudDto } from '../../modules/solicitudes/types'
import './SolicitudesPage.css'

const SolicitudesPage = () => {
  const { session } = useAuth()
  const [tiposSolicitud, setTiposSolicitud] = useState<TipoSolicitudDto[]>([])
  const [solicitudesCoord, setSolicitudesCoord] = useState<SolicitudCoordinadorDto[]>([])
  const [loadingTipos, setLoadingTipos] = useState(false)
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(false)
  const [tiposError, setTiposError] = useState<string | null>(null)
  const [solicitudesError, setSolicitudesError] = useState<string | null>(null)

  const roles = useMemo(() => (session?.kind === 'SAPP' ? session.user.roles : []), [session])
  const isCoord = hasAnyRole(roles, ['COORDINADOR', 'ADMIN'])
  const isEstudiante = hasAnyRole(roles, ['ESTUDIANTE'])

  useEffect(() => {
    if (!isEstudiante || isCoord) {
      return
    }

    let mounted = true
    setLoadingTipos(true)
    setTiposError(null)

    fetchTiposSolicitud()
      .then((tipos) => {
        if (!mounted) {
          return
        }
        setTiposSolicitud(tipos)
      })
      .catch(() => {
        if (!mounted) {
          return
        }
        setTiposError('No fue posible cargar los tipos de solicitud (mock).')
      })
      .finally(() => {
        if (mounted) {
          setLoadingTipos(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [isCoord, isEstudiante])

  useEffect(() => {
    if (!isCoord) {
      return
    }

    let mounted = true
    setLoadingSolicitudes(true)
    setSolicitudesError(null)

    fetchSolicitudesCoordinador()
      .then((solicitudes) => {
        if (!mounted) {
          return
        }
        setSolicitudesCoord(solicitudes)
      })
      .catch(() => {
        if (!mounted) {
          return
        }
        setSolicitudesError('No fue posible cargar el listado de solicitudes (mock).')
      })
      .finally(() => {
        if (mounted) {
          setLoadingSolicitudes(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [isCoord])

  return (
    <ModuleLayout title="Solicitudes">
      {isCoord ? (
        <div className="solicitudes-page__section">
          <h3>Solicitudes registradas</h3>
          <p className="solicitudes-page__description">Vista de coordinación para revisión y trazabilidad.</p>
          <SolicitudesCoordinadorGrid
            solicitudes={solicitudesCoord}
            loading={loadingSolicitudes}
            error={solicitudesError}
          />
        </div>
      ) : isEstudiante ? (
        <div className="solicitudes-page__section">
          {loadingTipos ? (
            <p className="solicitudes-page__status">Cargando tipos de trámite...</p>
          ) : tiposError ? (
            <p className="solicitudes-page__status solicitudes-page__status--error">{tiposError}</p>
          ) : (
            <SolicitudEstudianteForm tipos={tiposSolicitud} />
          )}
        </div>
      ) : (
        <p className="solicitudes-page__status">No tienes permisos para ver este módulo.</p>
      )}
    </ModuleLayout>
  )
}

export default SolicitudesPage

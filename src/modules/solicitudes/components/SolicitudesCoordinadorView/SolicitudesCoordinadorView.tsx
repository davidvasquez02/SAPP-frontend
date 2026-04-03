import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import SolicitudesTable from '../SolicitudesTable/SolicitudesTable'
import type { SolicitudCoordinadorDto, TipoSolicitudDto } from '../../types'
import { getSolicitudesAcademicasFiltered } from '../../api/solicitudesAcademicasService'
import { getTiposSolicitud } from '../../api/tipoSolicitudService'
import SolicitudesFiltersBar from '../SolicitudesFiltersBar/SolicitudesFiltersBar'
import './SolicitudesCoordinadorView.css'

const SolicitudesCoordinadorView = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [estadoId, setEstadoId] = useState<number | null>(null)
  const [tipoSolicitudId, setTipoSolicitudId] = useState<number | null>(null)
  const [tiposSolicitud, setTiposSolicitud] = useState<TipoSolicitudDto[]>([])
  const [rows, setRows] = useState<SolicitudCoordinadorDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tiposError, setTiposError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    setTiposError(null)

    getTiposSolicitud()
      .then((tipos) => {
        if (!mounted) {
          return
        }

        setTiposSolicitud(tipos)
      })
      .catch((fetchError) => {
        if (!mounted) {
          return
        }

        setTiposError(fetchError instanceof Error ? fetchError.message : 'No fue posible cargar los tipos de solicitud.')
      })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true

    setLoading(true)
    setError(null)

    getSolicitudesAcademicasFiltered({
      estadoId: estadoId ?? undefined,
      tipoSolicitudId: tipoSolicitudId ?? undefined,
    })
      .then((solicitudes) => {
        if (!mounted) {
          return
        }
        setRows(solicitudes)
      })
      .catch((fetchError) => {
        if (!mounted) {
          return
        }
        setError(fetchError instanceof Error ? fetchError.message : 'No fue posible cargar el listado de solicitudes.')
      })
      .finally(() => {
        if (mounted) {
          setLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [estadoId, tipoSolicitudId, location.key, location.state])

  return (
    <section className="solicitudes-coordinador-view">
      <h3>Solicitudes</h3>
      <SolicitudesFiltersBar
        estadoId={estadoId}
        tipoSolicitudId={tipoSolicitudId}
        tiposSolicitud={tiposSolicitud}
        disabled={loading}
        onChange={({ estadoId: nextEstadoId, tipoSolicitudId: nextTipoSolicitudId }) => {
          setEstadoId(nextEstadoId)
          setTipoSolicitudId(nextTipoSolicitudId)
        }}
      />
      {tiposError ? (
        <p className="solicitudes-coordinador-view__status solicitudes-coordinador-view__status--warning">{tiposError}</p>
      ) : null}
      {loading ? (
        <p className="solicitudes-coordinador-view__status">Cargando solicitudes...</p>
      ) : error ? (
        <p className="solicitudes-coordinador-view__status solicitudes-coordinador-view__status--error">{error}</p>
      ) : rows.length === 0 ? (
        <p className="solicitudes-coordinador-view__status">No hay resultados con los filtros seleccionados.</p>
      ) : (
        <SolicitudesTable mode="COORDINADOR" rows={rows} onRowClick={(solicitudId) => navigate(`/solicitudes/${solicitudId}`)} />
      )}
    </section>
  )
}

export default SolicitudesCoordinadorView

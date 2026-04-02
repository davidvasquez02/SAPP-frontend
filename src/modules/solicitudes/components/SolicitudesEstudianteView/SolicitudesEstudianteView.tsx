import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../../context/Auth'
import SolicitudEstudianteForm, {
  type SolicitudEstudiantePayload,
} from '../SolicitudEstudianteForm/SolicitudEstudianteForm'
import SolicitudesTable from '../SolicitudesTable/SolicitudesTable'
import { fetchSolicitudesEstudiante, fetchTiposSolicitud } from '../../services/solicitudesMockService'
import type { SolicitudEstudianteRowDto, TipoSolicitudDto } from '../../types'
import './SolicitudesEstudianteView.css'

const parseTipo = (codigoNombre: string): { codigo: string; nombre: string } => {
  const [codigo = '', nombre = codigoNombre] = codigoNombre.split(' - ')
  return { codigo, nombre }
}

const getTodayDate = () => new Date().toISOString().slice(0, 10)

const SolicitudesEstudianteView = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { session } = useAuth()
  const estudianteId = session?.kind === 'SAPP' ? session.user.id : 0
  const codigoEstudianteUis = '20260001'
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST')
  const [tiposSolicitud, setTiposSolicitud] = useState<TipoSolicitudDto[]>([])
  const [rows, setRows] = useState<SolicitudEstudianteRowDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    Promise.all([fetchTiposSolicitud(), fetchSolicitudesEstudiante(estudianteId)])
      .then(([tipos, solicitudes]) => {
        if (!mounted) {
          return
        }

        setTiposSolicitud(tipos)
        setRows(solicitudes)
      })
      .catch(() => {
        if (!mounted) {
          return
        }
        setError('No fue posible cargar tus solicitudes (mock).')
      })
      .finally(() => {
        if (mounted) {
          setLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [estudianteId, location.key])

  const handleRegisterSolicitud = async (payload: SolicitudEstudiantePayload) => {
    const selectedTipo = tiposSolicitud.find((tipo) => tipo.id === payload.tipoSolicitudId)
    const parsedTipo = parseTipo(selectedTipo?.codigoNombre ?? 'NUEVA - Nueva solicitud')

    const newRow: SolicitudEstudianteRowDto = {
      id: rows.length > 0 ? Math.max(...rows.map((row) => row.id)) + 1 : 1,
      tipoSolicitudCodigo: parsedTipo.codigo,
      tipoSolicitud: parsedTipo.nombre,
      estadoSigla: 'REGISTRADA',
      estado: 'REGISTRADA',
      fechaRegistro: getTodayDate(),
      fechaResolucion: null,
      observaciones: payload.observaciones || 'Solicitud registrada desde formulario.',
      programaAcademico: '61412 - MISI',
      codigoEstudianteUis,
    }

    setRows((current) => [newRow, ...current])
    setViewMode('LIST')
  }

  return (
    <section className="solicitudes-estudiante-view">
      <header className="solicitudes-estudiante-view__header">
        <h3>{viewMode === 'LIST' ? 'Mis solicitudes' : 'Nueva solicitud'}</h3>
        {viewMode === 'LIST' ? (
          <button className="solicitudes-estudiante-view__primary" onClick={() => setViewMode('FORM')} type="button">
            Agregar solicitud
          </button>
        ) : (
          <button className="solicitudes-estudiante-view__secondary" onClick={() => setViewMode('LIST')} type="button">
            Volver al listado
          </button>
        )}
      </header>

      {loading ? (
        <p className="solicitudes-estudiante-view__status">Cargando información...</p>
      ) : error ? (
        <p className="solicitudes-estudiante-view__status solicitudes-estudiante-view__status--error">{error}</p>
      ) : viewMode === 'LIST' ? (
        rows.length === 0 ? (
          <p className="solicitudes-estudiante-view__status">Aún no tienes solicitudes registradas.</p>
        ) : (
          <SolicitudesTable mode="ESTUDIANTE" rows={rows} onRowClick={(row) => navigate(`/solicitudes/${row.id}`)} />
        )
      ) : (
        <SolicitudEstudianteForm tipos={tiposSolicitud} onSubmit={handleRegisterSolicitud} />
      )}
    </section>
  )
}

export default SolicitudesEstudianteView

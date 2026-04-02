import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../../context/Auth'
import SolicitudEstudianteForm, {
  type SolicitudEstudiantePayload,
} from '../SolicitudEstudianteForm/SolicitudEstudianteForm'
import SolicitudesTable from '../SolicitudesTable/SolicitudesTable'
import { createSolicitudAcademica, getSolicitudesAcademicasByEstudiante } from '../../api/solicitudesAcademicasService'
import { getTiposSolicitud } from '../../api/tipoSolicitudService'
import type { SolicitudEstudianteRowDto, TipoSolicitudDto } from '../../types'
import './SolicitudesEstudianteView.css'

const SolicitudesEstudianteView = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { session } = useAuth()
  const estudianteId =
    session && session.kind === 'SAPP' && 'estudiante' in session.user
      ? session.user.estudiante?.id ?? null
      : null
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST')
  const [tiposSolicitud, setTiposSolicitud] = useState<TipoSolicitudDto[]>([])
  const [rows, setRows] = useState<SolicitudEstudianteRowDto[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingTipos, setLoadingTipos] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  const loadSolicitudes = async (targetEstudianteId: number) => {
    const solicitudes = await getSolicitudesAcademicasByEstudiante(targetEstudianteId)
    setRows(solicitudes)
  }

  useEffect(() => {
    let mounted = true

    if (estudianteId === null) {
      setLoading(false)
      setError('No hay estudianteId en sesión')
      return () => {
        mounted = false
      }
    }

    setLoading(true)
    setError(null)

    loadSolicitudes(estudianteId).catch((fetchError) => {
      if (!mounted) {
        return
      }
      setError(fetchError instanceof Error ? fetchError.message : 'No fue posible cargar tus solicitudes.')
    })
      .finally(() => {
        if (!mounted) {
          return
        }
        setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [estudianteId, location.key])

  useEffect(() => {
    if (viewMode !== 'FORM') {
      return
    }

    let mounted = true
    setLoadingTipos(true)
    setFormError(null)

    getTiposSolicitud()
      .then((tipos) => {
        if (mounted) {
          setTiposSolicitud(tipos)
        }
      })
      .catch((fetchError) => {
        if (mounted) {
          setFormError(fetchError instanceof Error ? fetchError.message : 'No fue posible cargar tipos de solicitud.')
        }
      })
      .finally(() => {
        if (mounted) {
          setLoadingTipos(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [viewMode])

  const handleRegisterSolicitud = async (payload: SolicitudEstudiantePayload) => {
    if (estudianteId === null) {
      setFormError('No hay estudianteId en sesión')
      return
    }

    try {
      setSaving(true)
      setFormError(null)
      setFormSuccess(null)

      await createSolicitudAcademica({
        estudianteId,
        tipoSolicitudId: payload.tipoSolicitudId,
        fechaResolucion: null,
        observaciones: payload.observaciones || '',
      })

      await loadSolicitudes(estudianteId)
      setFormSuccess('Solicitud registrada correctamente.')
      setViewMode('LIST')
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : 'No fue posible registrar la solicitud.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="solicitudes-estudiante-view">
      <header className="solicitudes-estudiante-view__header">
        <h3>{viewMode === 'LIST' ? 'Mis solicitudes' : 'Nueva solicitud'}</h3>
        {viewMode === 'LIST' ? (
          <button
            className="solicitudes-estudiante-view__primary"
            onClick={() => {
              setFormError(null)
              setFormSuccess(null)
              setViewMode('FORM')
            }}
            type="button"
          >
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
          <SolicitudesTable mode="ESTUDIANTE" rows={rows} onRowClick={(solicitudId) => navigate(`/solicitudes/${solicitudId}`)} />
        )
      ) : loadingTipos ? (
        <p className="solicitudes-estudiante-view__status">Cargando tipos de solicitud...</p>
      ) : (
        <>
          {formError && (
            <p className="solicitudes-estudiante-view__status solicitudes-estudiante-view__status--error">{formError}</p>
          )}
          {formSuccess && <p className="solicitudes-estudiante-view__status">{formSuccess}</p>}
          <SolicitudEstudianteForm tipos={tiposSolicitud} onSubmit={handleRegisterSolicitud} />
          {saving && <p className="solicitudes-estudiante-view__status">Registrando solicitud...</p>}
        </>
      )}
    </section>
  )
}

export default SolicitudesEstudianteView

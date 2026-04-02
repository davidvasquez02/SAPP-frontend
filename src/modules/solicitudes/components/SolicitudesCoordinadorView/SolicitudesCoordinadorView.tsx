import { useEffect, useState } from 'react'
import SolicitudesTable from '../SolicitudesTable/SolicitudesTable'
import { fetchSolicitudesCoordinador } from '../../services/solicitudesMockService'
import type { SolicitudCoordinadorDto } from '../../types'
import './SolicitudesCoordinadorView.css'

const SolicitudesCoordinadorView = () => {
  const [rows, setRows] = useState<SolicitudCoordinadorDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    fetchSolicitudesCoordinador()
      .then((solicitudes) => {
        if (!mounted) {
          return
        }
        setRows(solicitudes)
      })
      .catch(() => {
        if (!mounted) {
          return
        }
        setError('No fue posible cargar el listado de solicitudes (mock).')
      })
      .finally(() => {
        if (mounted) {
          setLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  return (
    <section className="solicitudes-coordinador-view">
      <h3>Solicitudes</h3>
      {loading ? (
        <p className="solicitudes-coordinador-view__status">Cargando solicitudes...</p>
      ) : error ? (
        <p className="solicitudes-coordinador-view__status solicitudes-coordinador-view__status--error">{error}</p>
      ) : rows.length === 0 ? (
        <p className="solicitudes-coordinador-view__status">No hay solicitudes para mostrar.</p>
      ) : (
        <SolicitudesTable mode="COORDINADOR" rows={rows} />
      )}
    </section>
  )
}

export default SolicitudesCoordinadorView

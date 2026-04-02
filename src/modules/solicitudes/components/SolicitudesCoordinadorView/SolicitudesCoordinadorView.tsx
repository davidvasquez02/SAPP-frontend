import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import SolicitudesTable from '../SolicitudesTable/SolicitudesTable'
import type { SolicitudCoordinadorDto } from '../../types'
import { getSolicitudesAcademicas } from '../../api/solicitudesAcademicasService'
import './SolicitudesCoordinadorView.css'

const SolicitudesCoordinadorView = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [rows, setRows] = useState<SolicitudCoordinadorDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    setLoading(true)
    setError(null)

    getSolicitudesAcademicas()
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
  }, [location.key])

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
        <SolicitudesTable mode="COORDINADOR" rows={rows} onRowClick={(row) => navigate(`/solicitudes/${row.id}`)} />
      )}
    </section>
  )
}

export default SolicitudesCoordinadorView

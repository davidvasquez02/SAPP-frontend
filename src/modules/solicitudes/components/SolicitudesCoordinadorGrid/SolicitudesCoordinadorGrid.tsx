import SolicitudCard from '../SolicitudCard/SolicitudCard'
import type { SolicitudCoordinadorDto } from '../../types'
import './SolicitudesCoordinadorGrid.css'

interface SolicitudesCoordinadorGridProps {
  solicitudes: SolicitudCoordinadorDto[]
  loading?: boolean
  error?: string | null
}

const SolicitudesCoordinadorGrid = ({
  solicitudes,
  loading = false,
  error = null,
}: SolicitudesCoordinadorGridProps) => {
  if (loading) {
    return <p className="solicitudes-coordinador-grid__status">Cargando solicitudes...</p>
  }

  if (error) {
    return <p className="solicitudes-coordinador-grid__status solicitudes-coordinador-grid__status--error">{error}</p>
  }

  if (solicitudes.length === 0) {
    return <p className="solicitudes-coordinador-grid__status">No hay solicitudes para mostrar.</p>
  }

  return (
    <section>
      <p className="solicitudes-coordinador-grid__summary">Total solicitudes: {solicitudes.length}</p>
      <div className="solicitudes-coordinador-grid">
        {solicitudes.map((solicitud) => (
          <SolicitudCard
            key={solicitud.id}
            solicitud={solicitud}
            onClick={() => {
              console.log(`Detalle pendiente para solicitud ${solicitud.id}`)
            }}
          />
        ))}
      </div>
    </section>
  )
}

export default SolicitudesCoordinadorGrid

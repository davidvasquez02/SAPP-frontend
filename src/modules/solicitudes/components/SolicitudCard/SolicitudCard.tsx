import type { SolicitudCoordinadorDto } from '../../types'
import StatusBadge from '../StatusBadge/StatusBadge'
import './SolicitudCard.css'

interface SolicitudCardProps {
  solicitud: SolicitudCoordinadorDto
  onClick?: () => void
}

const formatDate = (dateValue: string | null): string => {
  if (!dateValue) {
    return 'Sin resolución'
  }

  const [year, month, day] = dateValue.split('-')
  return `${day}/${month}/${year}`
}

const SolicitudCard = ({ solicitud, onClick }: SolicitudCardProps) => {
  const isClickable = Boolean(onClick)

  return (
    <article
      className={`solicitud-card ${isClickable ? 'solicitud-card--clickable' : ''}`}
      onClick={onClick}
      onKeyDown={(event) => {
        if (isClickable && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault()
          onClick?.()
        }
      }}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      <header className="solicitud-card__header">
        <h3 className="solicitud-card__title">
          {solicitud.tipoSolicitudCodigo} — {solicitud.tipoSolicitud}
        </h3>
        <StatusBadge estado={solicitud.estadoSigla || solicitud.estado} size="sm" />
      </header>

      <p className="solicitud-card__subtitle">
        {solicitud.estudiante} • {solicitud.codigoEstudianteUis}
      </p>

      <dl className="solicitud-card__meta">
        <div>
          <dt>Programa</dt>
          <dd>{solicitud.programaAcademico}</dd>
        </div>
        <div>
          <dt>Fecha registro</dt>
          <dd>{formatDate(solicitud.fechaRegistro)}</dd>
        </div>
        <div>
          <dt>Fecha resolución</dt>
          <dd>{formatDate(solicitud.fechaResolucion)}</dd>
        </div>
      </dl>

      <p className="solicitud-card__observaciones">{solicitud.observaciones ?? 'Sin observaciones.'}</p>
    </article>
  )
}

export default SolicitudCard

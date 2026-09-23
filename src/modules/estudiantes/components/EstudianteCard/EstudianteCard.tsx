import { type KeyboardEvent } from 'react'
import { CalendarDays } from 'lucide-react'
import type { EstudianteCoordinacion } from '../../types'
import './EstudianteCard.css'

interface EstudianteCardProps {
  estudiante: EstudianteCoordinacion
  onClick: () => void
}

const getEstadoLabel = (estado: EstudianteCoordinacion['estadoAcademico']) => {
  const normalized = estado?.trim().toUpperCase()
  if (normalized === 'EN_TRABAJO_DE_GRADO') return 'En trabajo de grado'
  if (normalized === 'EN_ESPERA_CANDIDATURA') return 'En espera candidatura'
  if (normalized === 'ACTIVO' || normalized === '1') return 'Activo'
  if (normalized === 'INACTIVO') return 'Inactivo'
  if (normalized === 'EGRESADO') return 'Egresado'
  return estado.replaceAll('_', ' ').toLowerCase()
}

const getInitials = (name: string) => name
  .trim()
  .split(/\s+/)
  .slice(0, 2)
  .map((part) => part[0]?.toLocaleUpperCase('es-CO'))
  .join('') || 'ES'

const EstudianteCard = ({ estudiante, onClick }: EstudianteCardProps) => {
  const normalizedStatus = estudiante.estadoAcademico?.trim().toUpperCase()
  const isInactive = normalizedStatus === 'INACTIVO'

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onClick()
  }

  return (
    <article
      className={`estudiante-card${isInactive ? ' estudiante-card--inactive' : ''}`}
      role="link"
      tabIndex={0}
      aria-label={`Ver perfil de ${estudiante.nombreCompleto}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <div className="estudiante-card__identity">
        <div className="estudiante-card__media">
          {estudiante.fotoUrl ? (
            <img className="estudiante-card__photo" src={estudiante.fotoUrl} alt="" loading="lazy" draggable={false} />
          ) : (
            <div className="estudiante-card__photo-placeholder" aria-hidden="true">{getInitials(estudiante.nombreCompleto)}</div>
          )}
        </div>
        <span className={`estudiante-card__badge${isInactive ? ' estudiante-card__badge--inactive' : ''}`}>
          <span aria-hidden="true">{isInactive ? '○' : '✓'}</span>
          {getEstadoLabel(estudiante.estadoAcademico)}
        </span>
      </div>

      <div className="estudiante-card__content">
        <header className="estudiante-card__header">
          <h3 className="estudiante-card__title">{estudiante.nombreCompleto}</h3>
          <p className="estudiante-card__code">Código UIS {estudiante.codigo}</p>
        </header>

        <dl className="estudiante-card__details">
          <div>
            <dt><CalendarDays aria-hidden="true" size={16} /> Cohorte</dt>
            <dd>{estudiante.cohorte}</dd>
          </div>
          <div>
            <dt><span aria-hidden="true">▣</span> Estado académico</dt>
            <dd>{getEstadoLabel(estudiante.estadoAcademico)}</dd>
          </div>
        </dl>
      </div>

      <div className="estudiante-card__action" aria-hidden="true">
        <span>Ver perfil</span>
        <span aria-hidden="true">→</span>
      </div>
    </article>
  )
}

export default EstudianteCard

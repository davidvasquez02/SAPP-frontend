import type { KeyboardEvent } from 'react'
import type { EstudianteCoordinacion } from '../../types'
import './EstudianteCard.css'

interface EstudianteCardProps {
  estudiante: EstudianteCoordinacion
  onClick: () => void
}

const getEstadoLabel = (estado: EstudianteCoordinacion['estadoAcademico']) => {
  const normalized = estado?.trim().toUpperCase()

  if (normalized === 'EN_TRABAJO_DE_GRADO') {
    return 'En trabajo de grado'
  }

  if (normalized === 'EN_ESPERA_CANDIDATURA') {
    return 'En espera candidatura'
  }

  if (normalized === 'ACTIVO' || normalized === '1') {
    return 'Activo'
  }

  return estado.replaceAll('_', ' ').toLowerCase()
}

const EstudianteCard = ({ estudiante, onClick }: EstudianteCardProps) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick()
    }
  }

  return (
    <article
      className="estudiante-card"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <div className="estudiante-card__media">
        {estudiante.fotoUrl ? (
          <img
            className="estudiante-card__photo"
            src={estudiante.fotoUrl}
            alt={`Foto de ${estudiante.nombreCompleto}`}
            loading="lazy"
          />
        ) : (
          <div className="estudiante-card__photo-placeholder" aria-hidden="true">
            <span className="estudiante-card__placeholder-icon">
              <svg viewBox="0 0 24 24" focusable="false">
                <path d="M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4Zm0 2c-3.31 0-6 2.02-6 4.5V20h12v-1.5c0-2.48-2.69-4.5-6-4.5Z" />
              </svg>
            </span>
            <span>Sin foto</span>
          </div>
        )}
      </div>

      <header className="estudiante-card__header">
        <h2 className="estudiante-card__title">{estudiante.nombreCompleto}</h2>
        <span className="estudiante-card__badge">{getEstadoLabel(estudiante.estadoAcademico)}</span>
      </header>

      <div className="estudiante-card__body">
        <p className="estudiante-card__meta">
          <span className="estudiante-card__meta-icon" aria-hidden="true">▣</span>
          <span><strong>Código:</strong> {estudiante.codigo}</span>
        </p>
        <p className="estudiante-card__meta">
          <span className="estudiante-card__meta-icon" aria-hidden="true">▤</span>
          <span><strong>Documento:</strong> {estudiante.tipoDocumento} {estudiante.numeroDocumento}</span>
        </p>
        <p className="estudiante-card__meta estudiante-card__meta--break">
          <span className="estudiante-card__meta-icon" aria-hidden="true">✉</span>
          <span><strong>Correo:</strong> {estudiante.correoInstitucional}</span>
        </p>
        <p className="estudiante-card__meta">
          <span className="estudiante-card__meta-icon" aria-hidden="true">♙</span>
          <span><strong>Cohorte:</strong> {estudiante.cohorte}</span>
        </p>
      </div>

      <footer className="estudiante-card__footer">
        <span>Ver perfil</span>
        <span className="estudiante-card__footer-arrow" aria-hidden="true">→</span>
      </footer>
    </article>
  )
}

export default EstudianteCard

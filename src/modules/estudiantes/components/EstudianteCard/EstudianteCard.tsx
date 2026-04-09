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
      <header className="estudiante-card__header">
        <h2 className="estudiante-card__title">{estudiante.nombreCompleto}</h2>
        <span className="estudiante-card__badge">{getEstadoLabel(estudiante.estadoAcademico)}</span>
      </header>

      <div className="estudiante-card__body">
        <p className="estudiante-card__meta">
          <strong>Código:</strong> {estudiante.codigo}
        </p>
        <p className="estudiante-card__meta">
          <strong>Documento:</strong> {estudiante.tipoDocumento} {estudiante.numeroDocumento}
        </p>
        <p className="estudiante-card__meta estudiante-card__meta--break">
          <strong>Correo:</strong> {estudiante.correoInstitucional}
        </p>
        <p className="estudiante-card__meta">
          <strong>Cohorte:</strong> {estudiante.cohorte}
        </p>
      </div>

      <footer className="estudiante-card__footer">
        <span>Ver información</span>
        <span aria-hidden="true">›</span>
      </footer>
    </article>
  )
}

export default EstudianteCard

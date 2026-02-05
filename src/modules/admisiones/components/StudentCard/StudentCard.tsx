import type { InscripcionAdmisionDto } from '../../api/types'
import './StudentCard.css'

interface StudentCardProps {
  inscripcion: InscripcionAdmisionDto
  photoUrl: string
  onClick: () => void
}

const StudentCard = ({ inscripcion, photoUrl, onClick }: StudentCardProps) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick()
    }
  }

  return (
    <div
      className="student-card"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <div className="student-card__media">
        <img
          className="student-card__photo"
          src={photoUrl}
          alt={`Foto de ${inscripcion.nombreAspirante}`}
          loading="lazy"
        />
      </div>

      <div className="student-card__body">
        <h2 className="student-card__name">{inscripcion.nombreAspirante}</h2>

        <div className="student-card__badges">
          <span className="student-card__badge student-card__badge--state">
            {inscripcion.estado}
          </span>
          <span className="student-card__badge">{inscripcion.programaAcademico}</span>
        </div>

        <div className="student-card__meta">
          <div>
            <span className="student-card__label">Periodo</span>
            <span className="student-card__value">
              {inscripcion.periodoAcademico || '—'}
            </span>
          </div>
          <div>
            <span className="student-card__label">Puntaje</span>
            <span className="student-card__value">
              {inscripcion.puntajeTotal ?? '—'}
            </span>
          </div>
        </div>

        <div className="student-card__meta student-card__meta--secondary">
          <span className="student-card__label">Fecha inscripción</span>
          <span className="student-card__value">
            {inscripcion.fechaInscripcion || '—'}
          </span>
        </div>
      </div>

      <div className="student-card__footer">
        <span>Ver inscripción</span>
        <span aria-hidden="true">›</span>
      </div>
    </div>
  )
}

export default StudentCard

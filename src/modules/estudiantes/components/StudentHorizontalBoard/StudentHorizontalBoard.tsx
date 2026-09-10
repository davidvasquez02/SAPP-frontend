import { useRef } from 'react'
import type { EstudianteCoordinacion } from '../../types'
import EstudianteCard from '../EstudianteCard/EstudianteCard'
import './StudentHorizontalBoard.css'

interface StudentHorizontalBoardProps {
  estudiantes: EstudianteCoordinacion[]
  onStudentClick: (estudiante: EstudianteCoordinacion) => void
  title?: string
  ariaLabel?: string
}

const SCROLL_DISTANCE = 620

const StudentHorizontalBoard = ({
  estudiantes,
  onStudentClick,
  title = 'Estudiantes matriculados',
  ariaLabel = 'Listado horizontal de estudiantes',
}: StudentHorizontalBoardProps) => {
  const boardRef = useRef<HTMLDivElement | null>(null)

  const scrollBoard = (direction: 'left' | 'right') => {
    boardRef.current?.scrollBy({
      left: direction === 'left' ? -SCROLL_DISTANCE : SCROLL_DISTANCE,
      behavior: 'smooth',
    })
  }

  return (
    <section className="student-horizontal-board" aria-label={title}>
      <div className="student-horizontal-board__header">
        <h2 className="student-horizontal-board__title">
          <span className="student-horizontal-board__title-icon" aria-hidden="true">
            👥
          </span>
          {title}
        </h2>

        <div className="student-horizontal-board__tools">
          <p className="student-horizontal-board__hint">Desliza horizontalmente para ver más estudiantes</p>
          <div className="student-horizontal-board__controls" aria-label="Controles de desplazamiento horizontal">
            <button
              type="button"
              className="student-horizontal-board__control"
              aria-label="Desplazar estudiantes hacia la izquierda"
              onClick={() => scrollBoard('left')}
            >
              ←
            </button>
            <button
              type="button"
              className="student-horizontal-board__control"
              aria-label="Desplazar estudiantes hacia la derecha"
              onClick={() => scrollBoard('right')}
            >
              →
            </button>
          </div>
        </div>
      </div>

      <div
        ref={boardRef}
        className="student-horizontal-board__scroller"
        tabIndex={0}
        aria-label={ariaLabel}
      >
        {estudiantes.map((estudiante) => (
          <EstudianteCard
            key={estudiante.id}
            estudiante={estudiante}
            onClick={() => onStudentClick(estudiante)}
          />
        ))}
      </div>
    </section>
  )
}

export default StudentHorizontalBoard

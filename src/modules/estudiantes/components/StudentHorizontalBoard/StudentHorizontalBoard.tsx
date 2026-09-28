import { useId } from 'react'
import { UsersRound } from 'lucide-react'
import type { EstudianteCoordinacion } from '../../types'
import EstudianteCard from '../EstudianteCard/EstudianteCard'
import './StudentHorizontalBoard.css'

interface StudentHorizontalBoardProps {
  estudiantes: EstudianteCoordinacion[]
  onStudentClick: (estudiante: EstudianteCoordinacion) => void
  page: number
  pageCount: number
  start: number
  end: number
  total: number
  onPageChange: (page: number) => void
  title?: string
  ariaLabel?: string
  paginationAriaLabel?: string
}

const StudentHorizontalBoard = ({
  estudiantes,
  onStudentClick,
  page,
  pageCount,
  start,
  end,
  total,
  onPageChange,
  title = 'Estudiantes matriculados',
  ariaLabel = 'Listado de estudiantes',
  paginationAriaLabel = 'Paginación de estudiantes',
}: StudentHorizontalBoardProps) => {
  const titleId = useId()

  return (
    <section className="student-horizontal-board" aria-labelledby={titleId}>
      <div className="student-horizontal-board__header">
        <h2 className="student-horizontal-board__title" id={titleId}>
          <UsersRound aria-hidden="true" size={21} strokeWidth={2.2} />
          {title}
        </h2>
        <p className="student-horizontal-board__count" aria-live="polite">
          Mostrando {start}–{end} de {total} perfiles
        </p>
      </div>

      <div className="student-horizontal-board__grid" aria-label={ariaLabel}>
        {estudiantes.map((estudiante) => (
          <EstudianteCard
            key={estudiante.id}
            estudiante={estudiante}
            onClick={() => onStudentClick(estudiante)}
          />
        ))}
      </div>

      {pageCount > 1 ? (
        <nav className="student-horizontal-board__pagination" aria-label={paginationAriaLabel}>
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
          >
            Anterior
          </button>
          <span>
            Página <strong>{page}</strong> de <strong>{pageCount}</strong>
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page === pageCount}
          >
            Siguiente
          </button>
        </nav>
      ) : null}
    </section>
  )
}

export default StudentHorizontalBoard

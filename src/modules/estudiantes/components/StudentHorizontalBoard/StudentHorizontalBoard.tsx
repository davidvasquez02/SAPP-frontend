import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from 'react'
import { UsersRound } from 'lucide-react'
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
const DRAG_THRESHOLD = 6
const INTERACTIVE_SELECTOR = 'button, a, input, select, textarea, [contenteditable="true"]'

interface DragState {
  pointerId: number
  originX: number
  originY: number
  originScrollLeft: number
  dragging: boolean
}

const StudentHorizontalBoard = ({
  estudiantes,
  onStudentClick,
  title = 'Estudiantes matriculados',
  ariaLabel = 'Listado horizontal de estudiantes',
}: StudentHorizontalBoardProps) => {
  const boardRef = useRef<HTMLDivElement | null>(null)
  const titleId = useId()
  const dragRef = useRef<DragState | null>(null)
  const suppressClickRef = useRef(false)
  const [isDragging, setIsDragging] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollControls = useCallback(() => {
    const board = boardRef.current
    if (!board) return
    const remaining = board.scrollWidth - board.clientWidth - board.scrollLeft
    setCanScrollLeft(board.scrollLeft > 1)
    setCanScrollRight(remaining > 1)
  }, [])

  useEffect(() => {
    const board = boardRef.current
    if (!board) return
    updateScrollControls()
    const resizeObserver = new ResizeObserver(updateScrollControls)
    resizeObserver.observe(board)
    Array.from(board.children).forEach((child) => resizeObserver.observe(child))
    return () => resizeObserver.disconnect()
  }, [estudiantes, updateScrollControls])

  const scrollBoard = (direction: 'left' | 'right') => {
    boardRef.current?.scrollBy({
      left: direction === 'left' ? -SCROLL_DISTANCE : SCROLL_DISTANCE,
      behavior: 'smooth',
    })
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return
    if ((event.target as Element).closest(INTERACTIVE_SELECTOR)) return

    dragRef.current = {
      pointerId: event.pointerId,
      originX: event.clientX,
      originY: event.clientY,
      originScrollLeft: event.currentTarget.scrollLeft,
      dragging: false,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const deltaX = event.clientX - drag.originX
    const deltaY = event.clientY - drag.originY

    if (!drag.dragging) {
      if (Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD) return
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        dragRef.current = null
        event.currentTarget.releasePointerCapture(event.pointerId)
        return
      }
      drag.dragging = true
      suppressClickRef.current = true
      setIsDragging(true)
    }

    event.preventDefault()
    event.currentTarget.scrollLeft = drag.originScrollLeft - deltaX
  }

  const finishPointerGesture = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    dragRef.current = null
    setIsDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const cancelPointerGesture = (event: PointerEvent<HTMLDivElement>) => {
    suppressClickRef.current = false
    finishPointerGesture(event)
  }

  const handleClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) return
    event.preventDefault()
    event.stopPropagation()
    suppressClickRef.current = false
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    scrollBoard(event.key === 'ArrowLeft' ? 'left' : 'right')
  }

  return (
    <section className="student-horizontal-board" aria-labelledby={titleId}>
      <div className="student-horizontal-board__header">
        <div>
          <h2 className="student-horizontal-board__title" id={titleId}>
            <UsersRound aria-hidden="true" size={21} strokeWidth={2.2} />
            {title}
          </h2>
          <p className="student-horizontal-board__count">{estudiantes.length} perfiles en este tablero</p>
        </div>

        <div className="student-horizontal-board__tools">
          <p className="student-horizontal-board__hint">Arrastra o usa las flechas para recorrer</p>
          <div className="student-horizontal-board__controls" aria-label="Controles de desplazamiento horizontal">
            <button type="button" className="student-horizontal-board__control" aria-label="Desplazar estudiantes hacia la izquierda" onClick={() => scrollBoard('left')} disabled={!canScrollLeft}>
              <span aria-hidden="true">←</span>
            </button>
            <button type="button" className="student-horizontal-board__control" aria-label="Desplazar estudiantes hacia la derecha" onClick={() => scrollBoard('right')} disabled={!canScrollRight}>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>

      <div
        ref={boardRef}
        className={`student-horizontal-board__scroller${isDragging ? ' student-horizontal-board__scroller--dragging' : ''}`}
        tabIndex={0}
        aria-label={ariaLabel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointerGesture}
        onPointerCancel={cancelPointerGesture}
        onLostPointerCapture={finishPointerGesture}
        onClickCapture={handleClickCapture}
        onKeyDown={handleKeyDown}
        onScroll={updateScrollControls}
      >
        {estudiantes.map((estudiante) => (
          <EstudianteCard key={estudiante.id} estudiante={estudiante} onClick={() => onStudentClick(estudiante)} />
        ))}
      </div>
    </section>
  )
}

export default StudentHorizontalBoard

import type { ReactNode } from 'react'
import './InscripcionAccordionWindow.css'

interface InscripcionAccordionWindowProps {
  title: string
  subtitle?: string
  isOpen: boolean
  onToggle: () => void
  children: ReactNode
}

const InscripcionAccordionWindow = ({
  title,
  subtitle,
  isOpen,
  onToggle,
  children,
}: InscripcionAccordionWindowProps) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onToggle()
    }
  }

  return (
    <div className={`inscripcion-accordion-window ${isOpen ? 'is-open' : ''}`}>
      <div
        className="inscripcion-accordion-window__header"
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onClick={onToggle}
        onKeyDown={handleKeyDown}
      >
        <div className="inscripcion-accordion-window__header-text">
          <span className="inscripcion-accordion-window__title">{title}</span>
          {subtitle ? (
            <span className="inscripcion-accordion-window__subtitle">{subtitle}</span>
          ) : null}
        </div>
        <span
          className="inscripcion-accordion-window__chevron"
          aria-hidden="true"
        >
          ▾
        </span>
      </div>
      {isOpen ? (
        <div className="inscripcion-accordion-window__body">{children}</div>
      ) : null}
    </div>
  )
}

export default InscripcionAccordionWindow

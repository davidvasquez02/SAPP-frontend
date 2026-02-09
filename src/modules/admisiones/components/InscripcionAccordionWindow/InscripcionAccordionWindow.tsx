import type { ReactNode } from 'react'
import './InscripcionAccordionWindow.css'

interface InscripcionAccordionWindowProps {
  title: string
  subtitle?: string
  isOpen: boolean
  isDisabled?: boolean
  onToggle: () => void
  children: ReactNode
}

const InscripcionAccordionWindow = ({
  title,
  subtitle,
  isOpen,
  isDisabled = false,
  onToggle,
  children,
}: InscripcionAccordionWindowProps) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (isDisabled) {
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onToggle()
    }
  }

  const handleClick = () => {
    if (isDisabled) {
      return
    }

    onToggle()
  }

  return (
    <div
      className={`inscripcion-accordion-window ${isOpen ? 'is-open' : ''} ${
        isDisabled ? 'is-disabled' : ''
      }`}
    >
      <div
        className="inscripcion-accordion-window__header"
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        aria-expanded={isOpen}
        aria-disabled={isDisabled}
        onClick={handleClick}
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

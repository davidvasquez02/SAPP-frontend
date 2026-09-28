import { useId, type ReactNode } from 'react'
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
  const generatedId = useId()
  const triggerId = `inscripcion-accordion-trigger-${generatedId}`
  const panelId = `inscripcion-accordion-panel-${generatedId}`

  return (
    <div
      className={`inscripcion-accordion-window ${isOpen ? 'is-open' : ''} ${
        isDisabled ? 'is-disabled' : ''
      }`}
    >
      <button
        type="button"
        id={triggerId}
        className="inscripcion-accordion-window__header"
        aria-expanded={isOpen}
        aria-controls={panelId}
        disabled={isDisabled}
        onClick={onToggle}
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
      </button>
      {isOpen ? (
        <div
          id={panelId}
          className="inscripcion-accordion-window__body"
          role="region"
          aria-labelledby={triggerId}
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}

export default InscripcionAccordionWindow

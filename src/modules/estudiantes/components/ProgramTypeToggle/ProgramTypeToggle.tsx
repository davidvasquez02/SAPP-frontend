import './ProgramTypeToggle.css'

export type ProgramType = 'maestria' | 'doctorado'

const PROGRAM_OPTIONS: Array<{ value: ProgramType; label: string }> = [
  { value: 'maestria', label: 'Maestría' },
  { value: 'doctorado', label: 'Doctorado' },
]

interface ProgramTypeToggleProps {
  value: ProgramType
  onChange: (value: ProgramType) => void
  disabled?: boolean
}

const ProgramTypeToggle = ({ value, onChange, disabled = false }: ProgramTypeToggleProps) => {
  return (
    <div className="program-type-toggle" role="group" aria-label="Tipo de programa académico">
      {PROGRAM_OPTIONS.map((option) => {
        const isActive = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            className={`program-type-toggle__button${isActive ? ' program-type-toggle__button--active' : ''}`}
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            disabled={disabled}
          >
            <span className="program-type-toggle__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <path d="M12 3 1.8 8.4 12 13.8l8-4.24V16h2V8.4L12 3Zm0 8.54L6.05 8.4 12 5.26l5.95 3.14L12 11.54Zm-5.5.04v4.18c0 2.18 2.42 3.74 5.5 3.74s5.5-1.56 5.5-3.74v-4.18l-2 1.06v3.12c0 .78-1.36 1.74-3.5 1.74s-3.5-.96-3.5-1.74v-3.12l-2-1.06Z" />
              </svg>
            </span>
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export default ProgramTypeToggle

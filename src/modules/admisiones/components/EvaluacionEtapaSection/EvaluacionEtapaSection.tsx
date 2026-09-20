import type { EvaluacionAdmisionItem, EtapaEvaluacion } from '../../types/evaluacionAdmisionTypes'
import './EvaluacionEtapaSection.css'

export type EvaluacionDraft = {
  puntajeAspirante?: number
  observaciones?: string
}

interface EvaluacionEtapaSectionProps {
  title: string
  etapa: EtapaEvaluacion
  items: EvaluacionAdmisionItem[]
  drafts: Record<number, EvaluacionDraft>
  errorsByRow: Record<number, string | null>
  modifiedByRow?: Record<number, boolean>
  isSavingBulk?: boolean
  onChangeDraft: (id: number, changes: EvaluacionDraft) => void
  onSaveBulk?: () => Promise<void>
  isReadOnly?: boolean
}

const parseConsideraciones = (value: string): unknown => {
  const trimmed = value.trim()

  if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) {
    return value
  }

  try {
    return JSON.parse(trimmed)
  } catch {
    return value
  }
}

const Consideraciones = ({ value }: { value: string }) => {
  const parsed = parseConsideraciones(value)

  if (typeof parsed === 'string') {
    return <p className="evaluacion-etapa-section__consideraciones">{parsed}</p>
  }

  const renderValue = (entry: unknown): string => {
    if (entry === null) return 'null'
    if (typeof entry === 'string' || typeof entry === 'number' || typeof entry === 'boolean') return String(entry)
    return JSON.stringify(entry)
  }

  if (Array.isArray(parsed)) {
    return (
      <ol className="evaluacion-etapa-section__criteria-list">
        {parsed.map((entry, index) => <li key={index}>{renderValue(entry)}</li>)}
      </ol>
    )
  }

  if (parsed && typeof parsed === 'object') {
    return (
      <dl className="evaluacion-etapa-section__criteria-list">
        {Object.entries(parsed).map(([key, entry]) => (
          <div key={key}><dt>{key}</dt><dd>{renderValue(entry)}</dd></div>
        ))}
      </dl>
    )
  }

  return <p className="evaluacion-etapa-section__consideraciones">{value}</p>
}

const EvaluacionEtapaSection = ({
  title,
  etapa,
  items,
  drafts,
  errorsByRow,
  modifiedByRow = {},
  isSavingBulk = false,
  onChangeDraft,
  onSaveBulk,
  isReadOnly = false,
}: EvaluacionEtapaSectionProps) => {
  const hasItems = items.length > 0
  const hasChanges = Object.values(modifiedByRow).some(Boolean)
  const hasErrors = Object.entries(errorsByRow).some(
    ([id, errorMessage]) => modifiedByRow[Number(id)] && Boolean(errorMessage),
  )

  return (
    <section className="evaluacion-etapa-section" data-etapa={etapa}>
      <h2 className="evaluacion-etapa-section__title">{title}</h2>
      {!hasItems && (
        <p className="evaluacion-etapa-section__empty">
          No hay componentes de evaluación disponibles para esta etapa.
        </p>
      )}
      {hasItems && (
        <div className="evaluacion-etapa-section__table-wrapper sapp-table-shell">
          <table className="evaluacion-etapa-section__table sapp-table">
            <thead>
              <tr>
                <th>Aspecto</th>
                <th>Consideraciones</th>
                <th className="evaluacion-etapa-section__th-max">Puntaje máx.</th>
                <th className="evaluacion-etapa-section__th-nota">Nota</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const draft = drafts[item.id]
                const errorMessage = errorsByRow[item.id]
                const hasDraftScore = draft && Object.prototype.hasOwnProperty.call(draft, 'puntajeAspirante')
                const puntajeValue = hasDraftScore ? draft.puntajeAspirante ?? '' : item.puntajeAspirante ?? ''
                const observacionesValue = draft?.observaciones ?? item.observaciones ?? ''
                const isModified = Boolean(modifiedByRow[item.id])
                const noteId = `${etapa}-${item.id}-nota`
                const observationsId = `${etapa}-${item.id}-observaciones`
                const errorId = `${noteId}-error`

                return (
                  <tr key={item.id} className={isModified ? 'evaluacion-etapa-section__row--modified' : ''}>
                    <td data-label="Aspecto" className="evaluacion-etapa-section__aspecto">{item.aspecto}</td>
                    <td data-label="Consideraciones">
                      {item.consideraciones ? (
                        <details className="evaluacion-etapa-section__criteria">
                          <summary>Ver criterios</summary>
                          <Consideraciones value={item.consideraciones} />
                        </details>
                      ) : (
                        <span className="evaluacion-etapa-section__text-muted">-</span>
                      )}
                    </td>
                    <td data-label="Puntaje máximo" className="evaluacion-etapa-section__cell-max">{item.puntajeMax}</td>
                    <td className="evaluacion-etapa-section__cell-nota">
                      <div className="evaluacion-etapa-section__field evaluacion-etapa-section__nota-field">
                        <label htmlFor={noteId}>Nota</label>
                        <input
                          id={noteId}
                          className="evaluacion-etapa-section__input evaluacion-etapa-section__nota-input"
                          type="number"
                          min={0}
                          max={item.puntajeMax}
                          step="0.01"
                          inputMode="decimal"
                          aria-invalid={Boolean(errorMessage)}
                          aria-describedby={errorMessage ? errorId : undefined}
                          value={puntajeValue}
                          disabled={isReadOnly}
                          onChange={(event) => {
                            const value = event.target.value
                            const parsed = value === '' ? undefined : Number(value)
                            onChangeDraft(item.id, { puntajeAspirante: parsed })
                          }}
                        />
                        {errorMessage && (
                          <span id={errorId} className="evaluacion-etapa-section__error">{errorMessage}</span>
                        )}
                      </div>
                    </td>
                    <td data-label="Observaciones">
                      <label className="evaluacion-etapa-section__mobile-label" htmlFor={observationsId}>Observaciones</label>
                      <textarea
                        id={observationsId}
                        className="evaluacion-etapa-section__textarea"
                        rows={2}
                        value={observacionesValue}
                        disabled={isReadOnly}
                        onChange={(event) =>
                          onChangeDraft(item.id, { observaciones: event.target.value })
                        }
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {hasItems && onSaveBulk && (
        <div className="evaluacion-etapa-section__footer">
          <button
            className="evaluacion-etapa-section__button"
            type="button"
            disabled={!hasChanges || hasErrors || isSavingBulk || isReadOnly}
            onClick={onSaveBulk}
          >
            {isSavingBulk ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      )}
    </section>
  )
}

export default EvaluacionEtapaSection

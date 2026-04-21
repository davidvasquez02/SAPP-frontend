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
}

const parseConsideraciones = (value: string): string => {
  const trimmed = value.trim()

  if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) {
    return value
  }

  try {
    return JSON.stringify(JSON.parse(trimmed), null, 2)
  } catch {
    return value
  }
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
                <th>Observaciones</th>
                <th className="evaluacion-etapa-section__th-max">Puntaje máx.</th>
                <th className="evaluacion-etapa-section__th-nota">Nota</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const draft = drafts[item.id]
                const errorMessage = errorsByRow[item.id]
                const puntajeValue = draft?.puntajeAspirante ?? item.puntajeAspirante ?? ''
                const observacionesValue = draft?.observaciones ?? item.observaciones ?? ''
                const isModified = Boolean(modifiedByRow[item.id])

                return (
                  <tr key={item.id} className={isModified ? 'evaluacion-etapa-section__row--modified' : ''}>
                    <td>{item.aspecto}</td>
                    <td>
                      {item.consideraciones ? (
                        <pre className="evaluacion-etapa-section__consideraciones">
                          {parseConsideraciones(item.consideraciones)}
                        </pre>
                      ) : (
                        <span className="evaluacion-etapa-section__text-muted">-</span>
                      )}
                    </td>
                    <td>
                      <textarea
                        className="evaluacion-etapa-section__textarea"
                        rows={2}
                        value={observacionesValue}
                        onChange={(event) =>
                          onChangeDraft(item.id, { observaciones: event.target.value })
                        }
                      />
                    </td>
                    <td className="evaluacion-etapa-section__cell-max">{item.puntajeMax}</td>
                    <td className="evaluacion-etapa-section__cell-nota">
                      <div className="evaluacion-etapa-section__field evaluacion-etapa-section__nota-field">
                        <input
                          className="evaluacion-etapa-section__input evaluacion-etapa-section__nota-input"
                          type="number"
                          min={0}
                          max={item.puntajeMax}
                          step="0.01"
                          value={puntajeValue}
                          onChange={(event) => {
                            const value = event.target.value
                            const parsed = value === '' ? undefined : Number(value)
                            onChangeDraft(item.id, { puntajeAspirante: parsed })
                          }}
                        />
                        {errorMessage && (
                          <span className="evaluacion-etapa-section__error">{errorMessage}</span>
                        )}
                      </div>
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
            disabled={!hasChanges || hasErrors || isSavingBulk}
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

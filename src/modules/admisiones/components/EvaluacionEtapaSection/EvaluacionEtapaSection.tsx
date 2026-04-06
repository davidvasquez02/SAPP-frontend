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
  editingRowId: number | null
  errorsByRow: Record<number, string | null>
  savingRowId: number | null
  onEditRow: (item: EvaluacionAdmisionItem) => void
  onCancelEdit: (id: number) => void
  onChangeDraft: (id: number, changes: EvaluacionDraft) => void
  onSaveItem: (updated: EvaluacionAdmisionItem) => Promise<void>
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
  editingRowId,
  errorsByRow,
  savingRowId,
  onEditRow,
  onCancelEdit,
  onChangeDraft,
  onSaveItem,
}: EvaluacionEtapaSectionProps) => {
  const hasItems = items.length > 0

  return (
    <section className="evaluacion-etapa-section" data-etapa={etapa}>
      <h2 className="evaluacion-etapa-section__title">{title}</h2>
      {!hasItems && (
        <p className="evaluacion-etapa-section__empty">
          No hay componentes de evaluación disponibles para esta etapa.
        </p>
      )}
      {hasItems && (
        <div className="evaluacion-etapa-section__table-wrapper">
          <table className="evaluacion-etapa-section__table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Aspecto</th>
                <th>Consideraciones</th>
                <th>Observaciones</th>
                <th className="evaluacion-etapa-section__th-max">Puntaje máx.</th>
                <th className="evaluacion-etapa-section__th-nota">Nota</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isEditing = editingRowId === item.id
                const isEditingAnother = editingRowId !== null && editingRowId !== item.id
                const draft = drafts[item.id]
                const errorMessage = errorsByRow[item.id]
                const isSaving = savingRowId === item.id
                const puntajeValue = draft?.puntajeAspirante ?? ''
                const observacionesValue = draft?.observaciones ?? ''

                return (
                  <tr key={item.id}>
                    <td className="evaluacion-etapa-section__cell-code">{item.codigo || '-'}</td>
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
                      {isEditing ? (
                        <textarea
                          className="evaluacion-etapa-section__textarea"
                          rows={2}
                          value={observacionesValue}
                          onChange={(event) =>
                            onChangeDraft(item.id, { observaciones: event.target.value })
                          }
                        />
                      ) : (
                        <span>{item.observaciones || '-'}</span>
                      )}
                    </td>
                    <td className="evaluacion-etapa-section__cell-max">{item.puntajeMax}</td>
                    <td className="evaluacion-etapa-section__cell-nota">
                      {isEditing ? (
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
                      ) : (
                        <span className="evaluacion-etapa-section__nota-value">
                          {item.puntajeAspirante ?? '-'}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="evaluacion-etapa-section__actions">
                        {isEditing ? (
                          <>
                            <button
                              className="evaluacion-etapa-section__button"
                              type="button"
                              disabled={Boolean(errorMessage) || isSaving}
                              onClick={() =>
                                onSaveItem({
                                  ...item,
                                  puntajeAspirante:
                                    draft?.puntajeAspirante ?? item.puntajeAspirante,
                                  observaciones:
                                    draft?.observaciones?.trim() !== ''
                                      ? draft?.observaciones?.trim()
                                      : null,
                                })
                              }
                            >
                              {isSaving ? 'Guardando...' : 'Guardar'}
                            </button>
                            <button
                              className="evaluacion-etapa-section__button evaluacion-etapa-section__button--secondary"
                              type="button"
                              disabled={isSaving}
                              onClick={() => onCancelEdit(item.id)}
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <button
                            className="evaluacion-etapa-section__button"
                            type="button"
                            disabled={isEditingAnother}
                            onClick={() => onEditRow(item)}
                          >
                            Editar
                          </button>
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
    </section>
  )
}

export default EvaluacionEtapaSection

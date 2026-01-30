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
                <th>Aspecto</th>
                <th>Consideraciones</th>
                <th>Evaluador</th>
                <th>Puntaje</th>
                <th>Máximo</th>
                <th>Observaciones</th>
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
                    <td>{item.aspecto}</td>
                    <td>
                      {item.consideraciones ? (
                        <span
                          className="evaluacion-etapa-section__text-ellipsis"
                          title={item.consideraciones}
                        >
                          {item.consideraciones}
                        </span>
                      ) : (
                        <span className="evaluacion-etapa-section__text-muted">-</span>
                      )}
                    </td>
                    <td>{item.evaluador || '-'}</td>
                    <td>
                      {isEditing ? (
                        <div className="evaluacion-etapa-section__field">
                          <input
                            className="evaluacion-etapa-section__input"
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
                        <span>{item.puntajeAspirante ?? '-'}</span>
                      )}
                    </td>
                    <td>{item.puntajeMax}</td>
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

import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { getMockDocumentosByTipo } from '../../mock/documentosPorTipo.mock'
import {
  getSolicitudDoc,
  removeSolicitudDoc,
  upsertSolicitudDoc,
} from '../../mock/solicitudDocumentosStore.mock'
import type { SolicitudDocumentoDraft } from '../../types/solicitudDocumentosTypes'
import { fileToBase64 } from '../../../../utils/fileToBase64'
import { downloadBase64File, openBase64InNewTab } from '../../../../shared/files/base64FileUtils'
import './SolicitudDocumentosEditor.css'

const ENFORCE_REQUIRED_DOCS = false

export interface SolicitudDocumentosEditorHandle {
  commitChanges: () => Promise<void>
}

interface SolicitudDocumentosEditorProps {
  solicitudId: number
  tipoSolicitudId: number
  editable: boolean
  onDocsChanged?: () => void
}

const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const SolicitudDocumentosEditor = forwardRef<SolicitudDocumentosEditorHandle, SolicitudDocumentosEditorProps>(
  ({ solicitudId, tipoSolicitudId, editable, onDocsChanged }, ref) => {
    const requirements = useMemo(() => getMockDocumentosByTipo(tipoSolicitudId), [tipoSolicitudId])
    const [drafts, setDrafts] = useState<SolicitudDocumentoDraft[]>([])
    const [removedRequirementIds, setRemovedRequirementIds] = useState<number[]>([])

    useEffect(() => {
      setDrafts((previous) =>
        requirements.map((requirement) => {
          const previousDraft = previous.find((draft) => draft.requirement.id === requirement.id)
          const removed = removedRequirementIds.includes(requirement.id)
          const current = removed ? null : getSolicitudDoc(solicitudId, requirement.id)

          return {
            requirement,
            current,
            selectedFile: previousDraft?.selectedFile ?? null,
            error: null,
          }
        }),
      )
    }, [removedRequirementIds, requirements, solicitudId])

    const hasMissingRequired = drafts.some((draft) => {
      if (!draft.requirement.obligatorio) {
        return false
      }

      const isRemoved = removedRequirementIds.includes(draft.requirement.id)
      return !draft.selectedFile && (!draft.current || isRemoved)
    })

    const commitChanges = async (): Promise<void> => {
      for (const requirementId of removedRequirementIds) {
        removeSolicitudDoc(solicitudId, requirementId)
      }

      for (const draft of drafts) {
        if (!draft.selectedFile) {
          continue
        }

        const base64 = await fileToBase64(draft.selectedFile)
        upsertSolicitudDoc(solicitudId, {
          requirementId: draft.requirement.id,
          fileName: draft.selectedFile.name,
          mimeType: draft.selectedFile.type || 'application/octet-stream',
          base64,
          updatedAt: new Date().toISOString(),
        })
      }

      setRemovedRequirementIds([])
      setDrafts(
        requirements.map((requirement) => ({
          requirement,
          current: getSolicitudDoc(solicitudId, requirement.id),
          selectedFile: null,
          error: null,
        })),
      )
    }

    useImperativeHandle(ref, () => ({
      commitChanges: async () => {
        if (ENFORCE_REQUIRED_DOCS && hasMissingRequired) {
          throw new Error('Faltan documentos obligatorios por adjuntar.')
        }

        await commitChanges()
      },
    }))

    return (
      <section className="solicitud-documentos-editor">
        <div className="solicitud-documentos-editor__header">
          <h4>Documentos</h4>
          <p>Requisitos según el tipo de solicitud seleccionado.</p>
        </div>

        {drafts.length === 0 ? (
          <p className="solicitud-documentos-editor__empty">No hay documentos configurados para este tipo de solicitud.</p>
        ) : (
          <ul className="solicitud-documentos-editor__list">
            {drafts.map((draft) => {
              const isRemoved = removedRequirementIds.includes(draft.requirement.id)
              const current = isRemoved ? null : draft.current

              return (
                <li key={draft.requirement.id} className="solicitud-documentos-editor__item">
                  <div className="solicitud-documentos-editor__title-row">
                    <strong>{draft.requirement.nombre}</strong>
                    {draft.requirement.obligatorio && <span className="solicitud-documentos-editor__badge">Obligatorio</span>}
                  </div>

                  <p className="solicitud-documentos-editor__status">
                    {current
                      ? `Cargado: ${current.fileName} (${dateFormatter.format(new Date(current.updatedAt))})`
                      : 'Pendiente'}
                  </p>

                  {draft.selectedFile && (
                    <p className="solicitud-documentos-editor__selected">Archivo listo para guardar: {draft.selectedFile.name}</p>
                  )}

                  <div className="solicitud-documentos-editor__actions">
                    {current && (
                      <>
                        <button
                          type="button"
                          aria-label={`Ver ${current.fileName}`}
                          onClick={() => openBase64InNewTab(current.base64, current.mimeType, current.fileName)}
                        >
                          Ver
                        </button>
                        <button
                          type="button"
                          aria-label={`Descargar ${current.fileName}`}
                          onClick={() => downloadBase64File(current.base64, current.mimeType, current.fileName)}
                        >
                          Descargar
                        </button>
                      </>
                    )}

                    {editable && (
                      <>
                        <label className="solicitud-documentos-editor__file-input-label" aria-label={`Reemplazar ${draft.requirement.nombre}`}>
                          Reemplazar
                          <input
                            type="file"
                            disabled={!editable}
                            onChange={(event) => {
                              const file = event.target.files?.[0] ?? null
                              setDrafts((previous) =>
                                previous.map((item) =>
                                  item.requirement.id === draft.requirement.id
                                    ? {
                                        ...item,
                                        selectedFile: file,
                                      }
                                    : item,
                                ),
                              )
                              onDocsChanged?.()
                            }}
                          />
                        </label>

                        {current && (
                          <button
                            type="button"
                            aria-label={`Quitar documento ${current.fileName}`}
                            onClick={() => {
                              setRemovedRequirementIds((prev) => Array.from(new Set([...prev, draft.requirement.id])))
                              setDrafts((previous) =>
                                previous.map((item) =>
                                  item.requirement.id === draft.requirement.id
                                    ? { ...item, current: null, selectedFile: null }
                                    : item,
                                ),
                              )
                              onDocsChanged?.()
                            }}
                          >
                            Quitar
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {hasMissingRequired && editable && (
          <p className="solicitud-documentos-editor__warning">Faltan documentos obligatorios por adjuntar.</p>
        )}
      </section>
    )
  },
)

SolicitudDocumentosEditor.displayName = 'SolicitudDocumentosEditor'

export default SolicitudDocumentosEditor

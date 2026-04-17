import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { getChecklistDocumentos } from '../../../../api/documentChecklistService'
import type { DocumentChecklistItemDto } from '../../../../api/documentChecklistTypes'
import { uploadDocument } from '../../../../api/documentUploadService'
import { fileToBase64 } from '../../../../utils/fileToBase64'
import { sha256Hex } from '../../../../utils/sha256'
import { downloadBase64File, openBase64InNewTab } from '../../../../shared/files/base64FileUtils'
import './SolicitudDocumentosEditor.css'

const ENFORCE_REQUIRED_DOCS = false

export interface SolicitudDocumentosEditorHandle {
  commitChanges: () => Promise<void>
}

interface SolicitudDocumentosEditorProps {
  solicitudId: number
  codigoTipoTramite: string
  usuarioCargaId: number | null
  editable: boolean
  showSaveButton?: boolean
  onDocsChanged?: () => void
  onDocsCommitted?: () => void
}

const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const SolicitudDocumentosEditor = forwardRef<SolicitudDocumentosEditorHandle, SolicitudDocumentosEditorProps>(
  ({ solicitudId, codigoTipoTramite, usuarioCargaId, editable, showSaveButton = editable, onDocsChanged, onDocsCommitted }, ref) => {
    const [requirements, setRequirements] = useState<DocumentChecklistItemDto[]>([])
    const [selectedFiles, setSelectedFiles] = useState<Record<number, File | null>>({})
    const [isLoading, setIsLoading] = useState(false)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [isSavingDocs, setIsSavingDocs] = useState(false)

    const loadRequirements = async () => {
      const codigoTipoTramiteAsNumber = Number(codigoTipoTramite)
      if (!Number.isFinite(codigoTipoTramiteAsNumber)) {
        setRequirements([])
        setLoadError('No fue posible determinar el tipo de trámite para cargar documentos.')
        return
      }

      setIsLoading(true)
      setLoadError(null)
      try {
        const response = await getChecklistDocumentos({
          codigoTipoTramite: codigoTipoTramiteAsNumber,
          tramiteId: solicitudId,
        })
        setRequirements(response)
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'No fue posible cargar el checklist de documentos.')
      } finally {
        setIsLoading(false)
      }
    }

    useEffect(() => {
      void loadRequirements()
    }, [codigoTipoTramite, solicitudId])

    const hasMissingRequired = requirements.some((requirement) => {
      if (!requirement.obligatorioTipoDocumentoTramite) {
        return false
      }
      const hasUploadedFile = requirement.documentoCargado && requirement.documentoUploadedResponse != null
      return !hasUploadedFile && !selectedFiles[requirement.idTipoDocumentoTramite]
    })

    const commitChanges = async (): Promise<void> => {
      setIsSavingDocs(true)
      setUploadError(null)
      try {
        const entries = Object.entries(selectedFiles)
        for (const [idAsString, file] of entries) {
          if (!file) {
            continue
          }

          const tipoDocumentoTramiteId = Number(idAsString)
          const buffer = await file.arrayBuffer()
          const contenidoBase64 = await fileToBase64(file)
          const checksum = await sha256Hex(buffer)

          await uploadDocument({
            tipoDocumentoTramiteId,
            nombreArchivo: file.name,
            tramiteId: solicitudId,
            usuarioCargaId,
            aspiranteCargaId: null,
            contenidoBase64,
            mimeType: file.type || 'application/octet-stream',
            tamanoBytes: file.size,
            checksum,
          })
        }

        setSelectedFiles({})
        await loadRequirements()
        onDocsCommitted?.()
      } finally {
        setIsSavingDocs(false)
      }
    }

    useImperativeHandle(ref, () => ({
      commitChanges: async () => {
        if (ENFORCE_REQUIRED_DOCS && hasMissingRequired) {
          throw new Error('Faltan documentos obligatorios por adjuntar.')
        }

        try {
          await commitChanges()
        } catch (error) {
          const message = error instanceof Error ? error.message : 'No fue posible guardar los documentos.'
          setUploadError(message)
          throw error
        }
      },
    }))

    return (
      <section className="solicitud-documentos-editor">
        <div className="solicitud-documentos-editor__header">
          <h4>Documentos</h4>
          <p>Requisitos según el tipo de solicitud seleccionado.</p>
        </div>

        {isLoading ? (
          <p className="solicitud-documentos-editor__empty">Cargando documentos...</p>
        ) : loadError ? (
          <p className="solicitud-documentos-editor__warning">{loadError}</p>
        ) : requirements.length === 0 ? (
          <p className="solicitud-documentos-editor__empty">No hay documentos configurados para este tipo de solicitud.</p>
        ) : (
          <ul className="solicitud-documentos-editor__list">
            {requirements.map((requirement) => {
              const current = requirement.documentoUploadedResponse
              const selectedFile = selectedFiles[requirement.idTipoDocumentoTramite]

              return (
                <li key={requirement.idTipoDocumentoTramite} className="solicitud-documentos-editor__item">
                  <div className="solicitud-documentos-editor__title-row">
                    <strong>{requirement.nombreTipoDocumentoTramite}</strong>
                    {requirement.obligatorioTipoDocumentoTramite && <span className="solicitud-documentos-editor__badge">Obligatorio</span>}
                  </div>

                  <p className="solicitud-documentos-editor__status">
                    {current
                      ? `Cargado: ${current.nombreArchivoDocumento} (${dateFormatter.format(new Date(current.fechaCargaDocumento))})`
                      : 'Pendiente'}
                  </p>

                  {selectedFile && (
                    <p className="solicitud-documentos-editor__selected">Archivo listo para guardar: {selectedFile.name}</p>
                  )}

                  <div className="solicitud-documentos-editor__actions">
                    {current && (
                      <>
                        <button
                          type="button"
                          aria-label={`Ver ${current.nombreArchivoDocumento}`}
                          onClick={() =>
                            openBase64InNewTab(
                              current.base64DocumentoContenido,
                              current.mimeTypeDocumentoContenido,
                              current.nombreArchivoDocumento,
                            )
                          }
                        >
                          Ver
                        </button>
                        <button
                          type="button"
                          aria-label={`Descargar ${current.nombreArchivoDocumento}`}
                          onClick={() =>
                            downloadBase64File(
                              current.base64DocumentoContenido,
                              current.mimeTypeDocumentoContenido,
                              current.nombreArchivoDocumento,
                            )
                          }
                        >
                          Descargar
                        </button>
                      </>
                    )}

                    {editable && (
                      <>
                        <label className="solicitud-documentos-editor__file-input-label" aria-label={`Reemplazar ${requirement.nombreTipoDocumentoTramite}`}>
                          Reemplazar
                          <input
                            type="file"
                            disabled={!editable}
                            onChange={(event) => {
                              const file = event.target.files?.[0] ?? null
                              setSelectedFiles((prev) => ({
                                ...prev,
                                [requirement.idTipoDocumentoTramite]: file,
                              }))
                              onDocsChanged?.()
                            }}
                          />
                        </label>
                      </>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {uploadError && <p className="solicitud-documentos-editor__warning">{uploadError}</p>}
        {editable && showSaveButton && (
          <div className="solicitud-documentos-editor__footer">
            <button
              type="button"
              className="solicitud-documentos-editor__save-button"
              disabled={isSavingDocs}
              onClick={() => {
                void commitChanges().catch((error) => {
                  setUploadError(error instanceof Error ? error.message : 'No fue posible guardar los documentos.')
                })
              }}
            >
              {isSavingDocs ? 'Guardando...' : 'Guardar documentos'}
            </button>
          </div>
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

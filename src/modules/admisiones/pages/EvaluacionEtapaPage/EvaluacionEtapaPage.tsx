import { useCallback, useEffect, useId, useMemo, useState, type ReactNode } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'
import { BackButton, ModuleLayout } from '../../../../components'
import { canManagePosgrados, isEvaluadorAdmision } from '../../../../auth/roleGuards'
import { useAuth } from '../../../../context/Auth'
import type { AuthUser } from '../../../../context/Auth/types'
import { base64ToBlob, downloadBase64File, openBase64InNewTab } from '../../../../shared/files/base64FileUtils'
import { updateEvaluacionRegistroPuntaje } from '../../api/evaluacionAdmisionService'
import EvaluacionEtapaSection, {
  type EvaluacionDraft,
} from '../../components/EvaluacionEtapaSection/EvaluacionEtapaSection'
import type { EvaluacionAdmisionItem, EtapaEvaluacion } from '../../types/evaluacionAdmisionTypes'
import { groupByEvaluador } from '../../utils/groupByEvaluador'
import './EvaluacionEtapaPage.css'
import type { InscripcionDetalleOutletContext } from '../../../../pages/InscripcionAdmisionDetalle/InscripcionAdmisionDetallePage'
import { evaluacionCache, hojaVidaDocCache } from './evaluacionPrefetchCache'
import { getEvaluacionAdmisionInfo } from '../../api/evaluacionAdmisionService'
import { getDocumentosByTramiteParams } from '../../../documentos/api/documentosService'
import { CODIGO_TIPO_DOCUMENTO_HOJA_DE_VIDA_COORDINACION, CODIGO_TIPO_TRAMITE_ADMISION_COORDINACION } from '../../../documentos/constants'
import { clearEvaluationDrafts, getEvaluationDrafts, setEvaluationDrafts } from '../../utils/evaluacionDraftStore'

interface EvaluacionEtapaPageProps {
  title: string
  etapa: EtapaEvaluacion
  embedded?: boolean
}

interface HojaVidaPreviewDocument {
  base64: string
  mimeType: string
  filename: string
}

const ResponsiveInterviewGroup = ({ label, children }: { label: string; children: ReactNode }) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const contentId = `entrevista-grupo-${useId()}`

  return (
    <section className={`evaluacion-etapa-page__group${isExpanded ? ' evaluacion-etapa-page__group--expanded' : ''}`}>
      <h2 className="evaluacion-etapa-page__group-title">{label}</h2>
      <button
        type="button"
        className="evaluacion-etapa-page__group-toggle"
        aria-expanded={isExpanded}
        aria-controls={contentId}
        onClick={() => setIsExpanded((current) => !current)}
      >
        <span>{label}</span>
        <span aria-hidden="true">▾</span>
      </button>
      <div id={contentId} className="evaluacion-etapa-page__group-content">
        {children}
      </div>
    </section>
  )
}

const buildValidationMessage = (
  puntajeAspirante: number | undefined,
  puntajeMax: number,
): string | null => {
  if (puntajeAspirante === undefined || Number.isNaN(puntajeAspirante)) {
    return 'Ingrese un número'
  }

  if (puntajeAspirante < 0) {
    return 'El puntaje no puede ser negativo'
  }

  if (puntajeAspirante > puntajeMax) {
    return 'No puede superar el puntaje máximo'
  }

  return null
}

const normalizeWhitespaceUpper = (value: string | null | undefined): string =>
  (value ?? '').trim().toUpperCase().replace(/\s+/g, ' ')

const EvaluacionEtapaPage = ({ title, etapa, embedded = false }: EvaluacionEtapaPageProps) => {
  const { session } = useAuth()
  const { convocatoriaId, inscripcionId } = useParams()
  const { isEstadoFinal = false } = useOutletContext<InscripcionDetalleOutletContext>()
  const [items, setItems] = useState<EvaluacionAdmisionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<number, EvaluacionDraft>>({})
  const [modifiedByRow, setModifiedByRow] = useState<Record<number, boolean>>({})
  const [errorsByRow, setErrorsByRow] = useState<Record<number, string | null>>({})
  const [savingBulk, setSavingBulk] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null)
  const [isPdfPreviewExpanded, setIsPdfPreviewExpanded] = useState(false)
  const [hojaVidaPreviewDoc, setHojaVidaPreviewDoc] = useState<HojaVidaPreviewDocument | null>(null)
  const [hojaVidaDocStatus, setHojaVidaDocStatus] = useState<'idle' | 'loading' | 'ready' | 'missing' | 'error'>('idle')
  const [hojaVidaDocMessage, setHojaVidaDocMessage] = useState<string | null>(null)
  const isEntrevista = etapa === 'ENTREVISTA'
  const isHojaDeVida = etapa === 'HOJA_DE_VIDA'
  const inscripcionIdNumber = useMemo(
    () => (inscripcionId ? Number(inscripcionId) : NaN),
    [inscripcionId],
  )
  const roles = useMemo(() => (session?.kind === 'SAPP' ? session.user.roles : []), [session])
  const isEvaluadorOnly = isEvaluadorAdmision(roles) && !canManagePosgrados(roles)

  const nombreUsuarioSesion = useMemo(() => {
    if (session?.kind !== 'SAPP') {
      return ''
    }

    const { persona } = session.user as AuthUser
    return [persona.nombre1, persona.nombre2, persona.apellido1, persona.apellido2]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
  }, [session])
  const nombreUsuarioNormalizado = useMemo(
    () => normalizeWhitespaceUpper(nombreUsuarioSesion),
    [nombreUsuarioSesion],
  )

  const belongsToCurrentUser = useCallback(
    (item: EvaluacionAdmisionItem) =>
      nombreUsuarioNormalizado.length > 0 &&
      normalizeWhitespaceUpper(item.evaluador) === nombreUsuarioNormalizado,
    [nombreUsuarioNormalizado],
  )

  const shouldIncludeByProfesor = useCallback((item: EvaluacionAdmisionItem) => {
    if (!isEvaluadorOnly || !isEntrevista) {
      return true
    }

    return belongsToCurrentUser(item)
  }, [belongsToCurrentUser, isEntrevista, isEvaluadorOnly])

  const loadEvaluacion = useCallback(async () => {
    if (!inscripcionId || Number.isNaN(inscripcionIdNumber)) {
      setError('Inscripción inválida.')
      setLoading(false)
      return
    }

    const cacheKey = `${inscripcionIdNumber}-${etapa}`
    const restoreDrafts = (loadedItems: EvaluacionAdmisionItem[]) => {
      const savedDrafts = getEvaluationDrafts(inscripcionIdNumber, etapa)
      setDrafts(savedDrafts)
      setModifiedByRow(Object.fromEntries(loadedItems.map((item) => [item.id, Boolean(savedDrafts[item.id])])))
      setErrorsByRow(Object.fromEntries(loadedItems.map((item) => {
        const saved = savedDrafts[item.id]
        return [item.id, saved && Object.prototype.hasOwnProperty.call(saved, 'puntajeAspirante')
          ? buildValidationMessage(saved.puntajeAspirante, item.puntajeMax)
          : null]
      })))
    }
    const cachedItems = evaluacionCache.get(cacheKey)
    if (cachedItems) {
      const visibleItems = cachedItems.filter(shouldIncludeByProfesor)
      setItems(visibleItems)
      restoreDrafts(visibleItems)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await getEvaluacionAdmisionInfo(inscripcionIdNumber, etapa)
      evaluacionCache.set(cacheKey, data)
      const visibleItems = data.filter(shouldIncludeByProfesor)
      setItems(visibleItems)
      restoreDrafts(visibleItems)
    } catch (errorResponse) {
      const message =
        errorResponse instanceof Error
          ? errorResponse.message
          : 'No fue posible cargar la evaluación.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [etapa, inscripcionId, inscripcionIdNumber, shouldIncludeByProfesor])

  useEffect(() => {
    void loadEvaluacion()
  }, [loadEvaluacion])

  useEffect(() => {
    if (!isHojaDeVida) {
      return
    }

    const resolveHojaVidaDocumento = (base64: string, mimeType: string, filename: string): HojaVidaPreviewDocument => ({
      base64,
      mimeType,
      filename,
    })

    const loadHojaVidaDoc = async () => {
      if (Number.isNaN(inscripcionIdNumber)) {
        setHojaVidaDocStatus('error')
        setHojaVidaDocMessage('Inscripción inválida para cargar documento de hoja de vida.')
        return
      }

      setHojaVidaDocStatus('loading')
      setHojaVidaDocMessage(null)
      setHojaVidaPreviewDoc(null)

      try {
        const cachedDoc = hojaVidaDocCache.get(inscripcionIdNumber)
        if (cachedDoc) {
          setHojaVidaPreviewDoc(cachedDoc)
          setHojaVidaDocStatus('ready')
          return
        }

        const documentos = await getDocumentosByTramiteParams({
          tramiteId: inscripcionIdNumber,
          codigoTipoTramite: CODIGO_TIPO_TRAMITE_ADMISION_COORDINACION,
          codigoTipoDocumentoTramite: CODIGO_TIPO_DOCUMENTO_HOJA_DE_VIDA_COORDINACION,
        })
        const uploaded = documentos[0]?.documentoUploadedResponse
        const base64 = uploaded?.base64DocumentoContenido || uploaded?.contenidoBase64
        const mimeType = uploaded?.mimeTypeDocumentoContenido || uploaded?.mimeType || 'application/pdf'
        const filename = uploaded?.nombreArchivoDocumento || 'hoja-de-vida.pdf'

        if (!uploaded || !base64) {
          setHojaVidaDocStatus('missing')
          setHojaVidaDocMessage('No se encontró documento de hoja de vida para previsualizar.')
          return
        }

        const resolvedDoc = resolveHojaVidaDocumento(base64, mimeType, filename)
        hojaVidaDocCache.set(inscripcionIdNumber, resolvedDoc)
        setHojaVidaPreviewDoc(resolvedDoc)
        setHojaVidaDocStatus('ready')
      } catch (errorResponse) {
        setHojaVidaDocStatus('error')
        setHojaVidaDocMessage(
          errorResponse instanceof Error
            ? errorResponse.message
            : 'No fue posible cargar el documento de hoja de vida.',
        )
      }
    }

    loadHojaVidaDoc()
  }, [inscripcionIdNumber, isHojaDeVida])

  useEffect(() => {
    if (!hojaVidaPreviewDoc) {
      setPdfViewerUrl(null)
      return
    }

    const blob = base64ToBlob(hojaVidaPreviewDoc.base64, hojaVidaPreviewDoc.mimeType)
    const url = URL.createObjectURL(blob)
    setPdfViewerUrl(url)

    return () => URL.revokeObjectURL(url)
  }, [hojaVidaPreviewDoc])

  const hasUnsavedChanges = useMemo(
    () => Object.values(modifiedByRow).some(Boolean),
    [modifiedByRow],
  )

  useEffect(() => {
    if (!hasUnsavedChanges) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [hasUnsavedChanges])

  const normalizeObservaciones = (value: string | null | undefined): string | null => {
    if (!value) return null
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  const isDraftModified = (item: EvaluacionAdmisionItem, draft: EvaluacionDraft): boolean => {
    const hasDraftScore = Object.prototype.hasOwnProperty.call(draft, 'puntajeAspirante')
    const puntajeFromDraft = hasDraftScore ? draft.puntajeAspirante : item.puntajeAspirante
    const observacionesFromDraft = draft.observaciones ?? item.observaciones ?? ''
    return (
      puntajeFromDraft !== item.puntajeAspirante ||
      normalizeObservaciones(observacionesFromDraft) !== normalizeObservaciones(item.observaciones)
    )
  }

  const handleChangeDraft = (id: number, changes: EvaluacionDraft) => {
    const item = items.find((current) => current.id === id)
    if (!item || (isEntrevista && !belongsToCurrentUser(item))) return

    setDrafts((prev) => {
      const nextDraft = {
        ...prev[id],
        ...changes,
      }
      const modified = isDraftModified(item, nextDraft)

      setModifiedByRow((prevModified) => ({
        ...prevModified,
        [id]: modified,
      }))

      const nextDrafts = {
        ...prev,
        [id]: nextDraft,
      }
      if (!modified) delete nextDrafts[id]
      setEvaluationDrafts(inscripcionIdNumber, etapa, nextDrafts)
      return nextDrafts
    })

    if (Object.prototype.hasOwnProperty.call(changes, 'puntajeAspirante')) {
      const puntajeForValidation = changes.puntajeAspirante
      const validation = buildValidationMessage(puntajeForValidation, item.puntajeMax)
      setErrorsByRow((prev) => ({
        ...prev,
        [id]: validation,
      }))
    }
  }

  const handleSaveBulk = async () => {
    const changedItems = items.filter(
      (item) => modifiedByRow[item.id] && (!isEntrevista || belongsToCurrentUser(item)),
    )
    if (changedItems.length === 0) return

    const hasValidationErrors = changedItems.some((item) => Boolean(errorsByRow[item.id]))
    if (hasValidationErrors) {
      window.alert('Hay filas con errores de validación. Revise los puntajes antes de actualizar.')
      return
    }

    const payload = changedItems.map((item) => {
      const draft = drafts[item.id]
      return {
        id: item.id,
        puntajeAspirante: draft?.puntajeAspirante ?? item.puntajeAspirante,
        observaciones: normalizeObservaciones(draft?.observaciones ?? item.observaciones ?? ''),
      }
    })

    setSavingBulk(true)
    setSaveMessage(null)
    try {
      await updateEvaluacionRegistroPuntaje(payload)
      clearEvaluationDrafts(inscripcionIdNumber, etapa)
      evaluacionCache.delete(`${inscripcionIdNumber}-${etapa}`)
      await loadEvaluacion()
      setSaveMessage({ kind: 'success', text: 'Calificación guardada correctamente.' })
    } catch (errorResponse) {
      const message =
        errorResponse instanceof Error ? errorResponse.message : 'No fue posible actualizar.'
      setSaveMessage({ kind: 'error', text: message })
    } finally {
      setSavingBulk(false)
    }
  }

  const entrevistaItems = useMemo(
    () => items.filter((item) => item.etapaEvaluacion === 'ENTREVISTA'),
    [items],
  )
  const resumenEntrevista = useMemo(
    () => entrevistaItems.find((item) => item.codigo === 'ENTREV'),
    [entrevistaItems],
  )
  const itemsSinResumen = useMemo(
    () => entrevistaItems.filter((item) => item.codigo !== 'ENTREV'),
    [entrevistaItems],
  )
  const gruposEntrevista = useMemo(
    () => groupByEvaluador(itemsSinResumen),
    [itemsSinResumen],
  )

  const content = (
    <section
      className={`evaluacion-etapa-page${embedded ? ' evaluacion-etapa-page--embedded' : ''}`}
    >
      {!embedded ? (
        <>
          <BackButton to={`/admisiones/convocatoria/${convocatoriaId}/inscripcion/${inscripcionId}`}>
            Volver a inscripción
          </BackButton>
          <div className="evaluacion-etapa-page__header">
            <h1 className="evaluacion-etapa-page__title">{title}</h1>
          </div>
        </>
      ) : null}

      {loading && <p className="evaluacion-etapa-page__status">Cargando evaluación...</p>}
      {!loading && error && (
        <p className="evaluacion-etapa-page__status evaluacion-etapa-page__status--error">
          {error}
        </p>
      )}

      {!loading && !error && !isEntrevista && (
        <div
          className={`evaluacion-etapa-page__content-grid ${
            isHojaDeVida ? 'evaluacion-etapa-page__content-grid--hoja-vida' : ''
          }`}
        >
          <div className="evaluacion-etapa-page__main-panel">
            {saveMessage ? <p role="status" className={`evaluacion-etapa-page__save-message evaluacion-etapa-page__save-message--${saveMessage.kind}`}>{saveMessage.text}</p> : null}
            <EvaluacionEtapaSection
              title={`Componentes de ${title.toLowerCase()}`}
              etapa={etapa}
              items={items}
              drafts={drafts}
              errorsByRow={errorsByRow}
              modifiedByRow={modifiedByRow}
              isSavingBulk={savingBulk}
              onChangeDraft={handleChangeDraft}
              onSaveBulk={handleSaveBulk}
              isReadOnly={isEstadoFinal}
            />
          </div>
          {isHojaDeVida && (
            <aside className="evaluacion-etapa-page__pdf-panel" aria-label="Documento hoja de vida">
              <div className="evaluacion-etapa-page__pdf-toolbar">
                <h3 className="evaluacion-etapa-page__pdf-title">Hoja de vida (PDF)</h3>
                <div className="evaluacion-etapa-page__pdf-actions">
                  <button
                    type="button"
                    className="sapp-document-action evaluacion-etapa-page__pdf-action"
                    disabled={!hojaVidaPreviewDoc}
                    onClick={() => {
                      if (!hojaVidaPreviewDoc) return
                      openBase64InNewTab(
                        hojaVidaPreviewDoc.base64,
                        hojaVidaPreviewDoc.mimeType,
                        hojaVidaPreviewDoc.filename,
                      )
                    }}
                  >
                    Abrir PDF
                  </button>
                  <button
                    type="button"
                    className="sapp-document-action evaluacion-etapa-page__pdf-action"
                    disabled={!hojaVidaPreviewDoc}
                    onClick={() => {
                      if (!hojaVidaPreviewDoc) return
                      downloadBase64File(
                        hojaVidaPreviewDoc.base64,
                        hojaVidaPreviewDoc.mimeType,
                        hojaVidaPreviewDoc.filename,
                      )
                    }}
                  >
                    Descargar
                  </button>
                </div>
              </div>
              {hojaVidaDocStatus === 'loading' && (
                <p className="evaluacion-etapa-page__pdf-message">Cargando documento...</p>
              )}
              {hojaVidaDocStatus === 'missing' && (
                <p className="evaluacion-etapa-page__pdf-message">{hojaVidaDocMessage}</p>
              )}
              {hojaVidaDocStatus === 'error' && (
                <p className="evaluacion-etapa-page__pdf-message evaluacion-etapa-page__pdf-message--error">
                  {hojaVidaDocMessage || 'No fue posible cargar el documento.'}
                </p>
              )}
              {hojaVidaDocStatus === 'ready' && pdfViewerUrl && (
                <div className={`evaluacion-etapa-page__pdf-preview${isPdfPreviewExpanded ? ' evaluacion-etapa-page__pdf-preview--expanded' : ''}`}>
                  <button
                    type="button"
                    className="evaluacion-etapa-page__pdf-preview-toggle"
                    aria-expanded={isPdfPreviewExpanded}
                    aria-controls="hoja-vida-pdf-preview"
                    onClick={() => setIsPdfPreviewExpanded((current) => !current)}
                  >
                    {isPdfPreviewExpanded ? 'Ocultar previsualización' : 'Mostrar previsualización'}
                  </button>
                  <div id="hoja-vida-pdf-preview" className="evaluacion-etapa-page__pdf-preview-content">
                  <iframe src={pdfViewerUrl} title="Previsualización de hoja de vida" className="evaluacion-etapa-page__pdf-viewer" />
                  </div>
                </div>
              )}
            </aside>
          )}
        </div>
      )}
      {!loading && !error && isEntrevista && entrevistaItems.length === 0 && (
        <p className="evaluacion-etapa-page__status">
          {isEvaluadorOnly
            ? 'No tienes aspectos asignados para esta entrevista.'
            : 'No hay evaluaciones de entrevista.'}
        </p>
      )}
      {!loading && !error && isEntrevista && entrevistaItems.length > 0 && (
        <div className="evaluacion-etapa-page__groups">
          {resumenEntrevista && (
            <section className="evaluacion-etapa-page__summary">
              <h2 className="evaluacion-etapa-page__summary-title">Resumen entrevista</h2>
              <div className="evaluacion-etapa-page__summary-grid">
                <div>
                  <p className="evaluacion-etapa-page__summary-label">Puntaje</p>
                  <p className="evaluacion-etapa-page__summary-value">
                    {resumenEntrevista.puntajeAspirante ?? '-'}
                  </p>
                </div>
                <div>
                  <p className="evaluacion-etapa-page__summary-label">Puntaje máximo</p>
                  <p className="evaluacion-etapa-page__summary-value">
                    {resumenEntrevista.puntajeMax}
                  </p>
                </div>
                <div>
                  <p className="evaluacion-etapa-page__summary-label">Consideraciones</p>
                  <p className="evaluacion-etapa-page__summary-value">
                    {resumenEntrevista.consideraciones || '-'}
                  </p>
                </div>
                <div>
                  <p className="evaluacion-etapa-page__summary-label">Observaciones</p>
                  <p className="evaluacion-etapa-page__summary-value">
                    {resumenEntrevista.observaciones || '-'}
                  </p>
                </div>
              </div>
            </section>
          )}
          {saveMessage ? <p role="status" className={`evaluacion-etapa-page__save-message evaluacion-etapa-page__save-message--${saveMessage.kind}`}>{saveMessage.text}</p> : null}
          {gruposEntrevista.map((grupo) => (
            <ResponsiveInterviewGroup key={grupo.evaluadorKey} label={grupo.evaluadorLabel}>
              <EvaluacionEtapaSection
                title="Componentes evaluados"
                etapa={etapa}
                items={grupo.items}
                drafts={drafts}
                errorsByRow={errorsByRow}
                modifiedByRow={modifiedByRow}
                isSavingBulk={savingBulk}
                onChangeDraft={handleChangeDraft}
                isReadOnly={isEstadoFinal || !grupo.items.every(belongsToCurrentUser)}
              />
            </ResponsiveInterviewGroup>
          ))}
          <div className="evaluacion-etapa-page__interview-footer">
            <button
              type="button"
              className="evaluacion-etapa-section__button"
              disabled={
                !Object.values(modifiedByRow).some(Boolean) ||
                Object.entries(errorsByRow).some(
                  ([id, errorMessage]) => modifiedByRow[Number(id)] && Boolean(errorMessage),
                ) ||
                savingBulk
              }
              onClick={() => {
                void handleSaveBulk()
              }}
            >
              {savingBulk ? 'Enviando calificaciones...' : 'Enviar calificaciones'}
            </button>
          </div>
        </div>
      )}
    </section>
  )

  if (embedded) {
    return content
  }

  return <ModuleLayout title="Admisiones">{content}</ModuleLayout>
}

export default EvaluacionEtapaPage

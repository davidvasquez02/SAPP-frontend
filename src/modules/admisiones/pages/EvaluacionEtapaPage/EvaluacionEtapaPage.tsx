import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ModuleLayout } from '../../../../components'
import { hasAnyRole, isProfesor } from '../../../../auth/roleGuards'
import { useAuth } from '../../../../context/Auth'
import type { AuthUser } from '../../../../context/Auth/types'
import { base64ToBlob, downloadBase64File, openBase64InNewTab } from '../../../../shared/files/base64FileUtils'
import {
  getEvaluacionAdmisionInfo,
  updateEvaluacionRegistroPuntaje,
} from '../../api/evaluacionAdmisionService'
import EvaluacionEtapaSection, {
  type EvaluacionDraft,
} from '../../components/EvaluacionEtapaSection/EvaluacionEtapaSection'
import { getDocumentosByTramiteParams } from '../../../documentos/api/documentosService'
import type {
  EvaluacionAdmisionItem,
  EtapaEvaluacion,
} from '../../types/evaluacionAdmisionTypes'
import { groupByEvaluador } from '../../utils/groupByEvaluador'
import {
  CODIGO_TIPO_DOCUMENTO_HOJA_DE_VIDA_COORDINACION,
  CODIGO_TIPO_TRAMITE_ADMISION_COORDINACION,
} from '../../../documentos/constants'
import './EvaluacionEtapaPage.css'

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
  const [items, setItems] = useState<EvaluacionAdmisionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<number, EvaluacionDraft>>({})
  const [modifiedByRow, setModifiedByRow] = useState<Record<number, boolean>>({})
  const [errorsByRow, setErrorsByRow] = useState<Record<number, string | null>>({})
  const [savingBulk, setSavingBulk] = useState(false)
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null)
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
  const isProfesorOnly =
    isProfesor(roles) && !hasAnyRole(roles, ['ADMIN', 'COORDINADOR', 'SECRETARIA'])

  const nombreProfesor = useMemo(() => {
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

  const shouldIncludeByProfesor = useCallback((item: EvaluacionAdmisionItem) => {
    if (!isProfesorOnly || !isEntrevista) {
      return true
    }

    return normalizeWhitespaceUpper(item.evaluador) === normalizeWhitespaceUpper(nombreProfesor)
  }, [isEntrevista, isProfesorOnly, nombreProfesor])

  const loadEvaluacion = useCallback(async () => {
    if (!inscripcionId || Number.isNaN(inscripcionIdNumber)) {
      setError('Inscripción inválida.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await getEvaluacionAdmisionInfo(inscripcionIdNumber, etapa)
      setItems(data.filter(shouldIncludeByProfesor))
      setDrafts({})
      setModifiedByRow({})
      setErrorsByRow({})
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

        setHojaVidaPreviewDoc(resolveHojaVidaDocumento(base64, mimeType, filename))
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

  const normalizeObservaciones = (value: string | null | undefined): string | null => {
    if (!value) return null
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  const isDraftModified = (item: EvaluacionAdmisionItem, draft: EvaluacionDraft): boolean => {
    const puntajeFromDraft = draft.puntajeAspirante ?? item.puntajeAspirante
    const observacionesFromDraft = draft.observaciones ?? item.observaciones ?? ''
    return (
      puntajeFromDraft !== item.puntajeAspirante ||
      normalizeObservaciones(observacionesFromDraft) !== normalizeObservaciones(item.observaciones)
    )
  }

  const handleChangeDraft = (id: number, changes: EvaluacionDraft) => {
    const item = items.find((current) => current.id === id)
    if (!item) return

    setDrafts((prev) => {
      const nextDraft = {
        ...prev[id],
        ...changes,
      }

      setModifiedByRow((prevModified) => ({
        ...prevModified,
        [id]: isDraftModified(item, nextDraft),
      }))

      return {
        ...prev,
        [id]: nextDraft,
      }
    })

    if (Object.prototype.hasOwnProperty.call(changes, 'puntajeAspirante')) {
      const puntajeForValidation = changes.puntajeAspirante ?? drafts[id]?.puntajeAspirante
      const validation = buildValidationMessage(puntajeForValidation, item.puntajeMax)
      setErrorsByRow((prev) => ({
        ...prev,
        [id]: validation,
      }))
    }
  }

  const handleSaveBulk = async () => {
    const changedItems = items.filter((item) => modifiedByRow[item.id])
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
    try {
      await updateEvaluacionRegistroPuntaje(payload)
      window.alert('Calificación guardada')
      await loadEvaluacion()
    } catch (errorResponse) {
      const message =
        errorResponse instanceof Error ? errorResponse.message : 'No fue posible actualizar.'
      window.alert(message)
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
          <Link
            className="evaluacion-etapa-page__back"
            to={`/admisiones/convocatoria/${convocatoriaId}/inscripcion/${inscripcionId}`}
          >
            ← Volver a Inscripción
          </Link>
          <div className="evaluacion-etapa-page__header">
            <h1 className="evaluacion-etapa-page__title">{title}</h1>
            <p className="evaluacion-etapa-page__meta">Inscripción #{inscripcionId}</p>
          </div>
        </>
      ) : (
        <p className="evaluacion-etapa-page__meta">Inscripción #{inscripcionId}</p>
      )}

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
            />
          </div>
          {isHojaDeVida && (
            <aside className="evaluacion-etapa-page__pdf-panel" aria-label="Documento hoja de vida">
              <div className="evaluacion-etapa-page__pdf-toolbar">
                <h3 className="evaluacion-etapa-page__pdf-title">Hoja de vida (PDF)</h3>
                <div className="evaluacion-etapa-page__pdf-actions">
                  <button
                    type="button"
                    className="evaluacion-etapa-page__pdf-action"
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
                    Abrir
                  </button>
                  <button
                    type="button"
                    className="evaluacion-etapa-page__pdf-action"
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
                <iframe
                  src={pdfViewerUrl}
                  title="Hoja de vida"
                  className="evaluacion-etapa-page__pdf-viewer"
                />
              )}
            </aside>
          )}
        </div>
      )}
      {!loading && !error && isEntrevista && entrevistaItems.length === 0 && (
        <p className="evaluacion-etapa-page__status">
          {isProfesorOnly
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
          {gruposEntrevista.map((grupo) => (
            <div key={grupo.evaluadorKey} className="evaluacion-etapa-page__group">
              <h2 className="evaluacion-etapa-page__group-title">{grupo.evaluadorLabel}</h2>
              <EvaluacionEtapaSection
                title="Componentes evaluados"
                etapa={etapa}
                items={grupo.items}
                drafts={drafts}
                errorsByRow={errorsByRow}
                modifiedByRow={modifiedByRow}
                isSavingBulk={savingBulk}
                onChangeDraft={handleChangeDraft}
              />
            </div>
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

import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ModuleLayout } from '../../../../components'
import { base64ToBlob, downloadBase64File, openBase64InNewTab } from '../../../../shared/files/base64FileUtils'
import { getEvaluacionAdmisionInfo } from '../../api/evaluacionAdmisionService'
import EvaluacionEtapaSection, {
  type EvaluacionDraft,
} from '../../components/EvaluacionEtapaSection/EvaluacionEtapaSection'
import { getDocumentosByTramite } from '../../../documentos/api/documentosService'
import type { DocumentoTramiteItemDto } from '../../../documentos/api/types'
import type {
  EvaluacionAdmisionItem,
  EtapaEvaluacion,
} from '../../types/evaluacionAdmisionTypes'
import { groupByEvaluador } from '../../utils/groupByEvaluador'
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

const EvaluacionEtapaPage = ({ title, etapa, embedded = false }: EvaluacionEtapaPageProps) => {
  const { convocatoriaId, inscripcionId } = useParams()
  const [items, setItems] = useState<EvaluacionAdmisionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<number, EvaluacionDraft>>({})
  const [editingRowId, setEditingRowId] = useState<number | null>(null)
  const [errorsByRow, setErrorsByRow] = useState<Record<number, string | null>>({})
  const [savingRowId, setSavingRowId] = useState<number | null>(null)
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

  useEffect(() => {
    const loadEvaluacion = async () => {
      if (!inscripcionId || Number.isNaN(inscripcionIdNumber)) {
        setError('Inscripción inválida.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const data = await getEvaluacionAdmisionInfo(inscripcionIdNumber, etapa)
        setItems(data)
      } catch (errorResponse) {
        const message =
          errorResponse instanceof Error
            ? errorResponse.message
            : 'No fue posible cargar la evaluación.'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    loadEvaluacion()
  }, [etapa, inscripcionId, inscripcionIdNumber])

  useEffect(() => {
    if (!isHojaDeVida) {
      return
    }

    const resolveHojaVidaDocumento = (
      documentos: DocumentoTramiteItemDto[],
    ): HojaVidaPreviewDocument | null => {
      const target = documentos.find((doc) => {
        const uploaded = doc.documentoUploadedResponse
        if (!uploaded) {
          return false
        }

        const candidateText = `${doc.nombreTipoDocumentoTramite} ${doc.descripcionTipoDocumentoTramite} ${doc.codigoTipoDocumentoTramite}`.toUpperCase()
        return candidateText.includes('HOJA DE VIDA') || candidateText.includes(' HOJA ') || candidateText.includes('HV')
      })

      if (!target?.documentoUploadedResponse) {
        return null
      }

      const uploaded = target.documentoUploadedResponse
      const base64 = uploaded.base64DocumentoContenido || uploaded.contenidoBase64
      const mimeType = uploaded.mimeTypeDocumentoContenido || uploaded.mimeType || 'application/pdf'

      if (!base64) {
        return null
      }

      return {
        base64,
        mimeType,
        filename: uploaded.nombreArchivoDocumento || 'hoja-de-vida.pdf',
      }
    }

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
        const documentos = await getDocumentosByTramite(inscripcionIdNumber)
        const documentoHojaVida = resolveHojaVidaDocumento(documentos)

        if (!documentoHojaVida) {
          setHojaVidaDocStatus('missing')
          setHojaVidaDocMessage('No se encontró documento de hoja de vida para previsualizar.')
          return
        }

        setHojaVidaPreviewDoc(documentoHojaVida)
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

  const saveEvaluacionItem = async (updated: EvaluacionAdmisionItem): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
    window.alert('Guardado (mock).')
  }

  const handleEditRow = (item: EvaluacionAdmisionItem) => {
    setEditingRowId(item.id)
    setDrafts((prev) => ({
      ...prev,
      [item.id]: {
        puntajeAspirante: item.puntajeAspirante ?? undefined,
        observaciones: item.observaciones ?? '',
      },
    }))
    setErrorsByRow((prev) => ({
      ...prev,
      [item.id]: buildValidationMessage(item.puntajeAspirante ?? undefined, item.puntajeMax),
    }))
  }

  const handleCancelEdit = (id: number) => {
    setEditingRowId(null)
    setDrafts((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setErrorsByRow((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const handleChangeDraft = (id: number, changes: EvaluacionDraft) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...changes,
      },
    }))

    if (Object.prototype.hasOwnProperty.call(changes, 'puntajeAspirante')) {
      const item = items.find((current) => current.id === id)
      if (item) {
        const validation = buildValidationMessage(changes.puntajeAspirante, item.puntajeMax)
        setErrorsByRow((prev) => ({
          ...prev,
          [id]: validation,
        }))
      }
    }
  }

  const handleSaveItem = async (updated: EvaluacionAdmisionItem) => {
    if (errorsByRow[updated.id]) {
      return
    }

    setSavingRowId(updated.id)
    try {
      await saveEvaluacionItem(updated)
      handleCancelEdit(updated.id)
    } catch (errorResponse) {
      const message =
        errorResponse instanceof Error ? errorResponse.message : 'No fue posible guardar.'
      window.alert(message)
    } finally {
      setSavingRowId(null)
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
              editingRowId={editingRowId}
              errorsByRow={errorsByRow}
              savingRowId={savingRowId}
              onEditRow={handleEditRow}
              onCancelEdit={handleCancelEdit}
              onChangeDraft={handleChangeDraft}
              onSaveItem={handleSaveItem}
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
        <p className="evaluacion-etapa-page__status">No hay evaluaciones de entrevista.</p>
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
                editingRowId={editingRowId}
                errorsByRow={errorsByRow}
                savingRowId={savingRowId}
                onEditRow={handleEditRow}
                onCancelEdit={handleCancelEdit}
                onChangeDraft={handleChangeDraft}
                onSaveItem={handleSaveItem}
              />
            </div>
          ))}
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

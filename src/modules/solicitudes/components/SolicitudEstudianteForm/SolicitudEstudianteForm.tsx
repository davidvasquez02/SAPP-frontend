import { useEffect, useMemo, useState } from 'react'
import { DocumentUploadCard } from '../../../../components'
import { getDocumentosPorTipoTramite } from '../../../../api/tramiteDocumentService'
import type { TramiteDocumentoDto } from '../../../../api/tramiteDocumentTypes'
import type { DocumentUploadItem } from '../../../documentos/types/documentUploadTypes'
import type { SolicitudDocumentoDraft, TipoSolicitudDto } from '../../types'
import { formatTipoSolicitudLabel } from '../../utils/tipoSolicitudLabel'
import './SolicitudEstudianteForm.css'

export interface SolicitudEstudiantePayload {
  tipoSolicitudId: number
  observaciones: string
  documentos: Array<{
    id: number
    nombre: string
    obligatorio: boolean
    file: File | null
  }>
}

interface SolicitudEstudianteFormProps {
  tipos: TipoSolicitudDto[]
  onSubmit?: (payload: SolicitudEstudiantePayload) => Promise<void> | void
}

const mapDocumentoToDraft = (documento: TramiteDocumentoDto): SolicitudDocumentoDraft => ({
  id: documento.id,
  nombre: documento.nombre,
  obligatorio: documento.obligatorio,
  file: null,
  error: null,
})

const mapDraftToCardItem = (documento: SolicitudDocumentoDraft): DocumentUploadItem => ({
  id: documento.id,
  codigo: '',
  nombre: documento.nombre,
  obligatorio: documento.obligatorio,
  status: documento.file ? 'READY_TO_UPLOAD' : 'NOT_SELECTED',
  selectedFile: documento.file,
  errorMessage: documento.error ?? undefined,
})

const SolicitudEstudianteForm = ({ tipos, onSubmit }: SolicitudEstudianteFormProps) => {
  const [tipoSolicitudId, setTipoSolicitudId] = useState<number | null>(null)
  const [documentosDraft, setDocumentosDraft] = useState<SolicitudDocumentoDraft[]>([])
  const [loadingDocumentos, setLoadingDocumentos] = useState(false)
  const [documentosError, setDocumentosError] = useState<string | null>(null)
  const [observaciones, setObservaciones] = useState('')
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const selectedTipo = useMemo(() => tipos.find((tipo) => tipo.id === tipoSolicitudId) ?? null, [tipoSolicitudId, tipos])
  const selectedTipoLabel = useMemo(
    () =>
      formatTipoSolicitudLabel(selectedTipo?.codigoNombre) || selectedTipo?.nombre?.trim() || selectedTipo?.codigoNombre || '',
    [selectedTipo],
  )

  useEffect(() => {
    if (selectedTipo == null) {
      setDocumentosDraft([])
      setDocumentosError(null)
      setLoadingDocumentos(false)
      return
    }

    const tipoTramiteId = selectedTipo.tipoTramiteId
    if (tipoTramiteId == null || Number.isNaN(tipoTramiteId)) {
      setDocumentosDraft([])
      setDocumentosError('El tipo de solicitud seleccionado no tiene tipoTramiteId para consultar documentos.')
      setLoadingDocumentos(false)
      return
    }

    let mounted = true
    setLoadingDocumentos(true)
    setDocumentosError(null)

    getDocumentosPorTipoTramite(tipoTramiteId)
      .then((documentos) => {
        if (!mounted) {
          return
        }
        setDocumentosDraft(documentos.map(mapDocumentoToDraft))
      })
      .catch((documentsError) => {
        if (!mounted) {
          return
        }
        setDocumentosDraft([])
        setDocumentosError(
          documentsError instanceof Error
            ? documentsError.message
            : 'No fue posible cargar documentos del tipo de trámite seleccionado.',
        )
      })
      .finally(() => {
        if (mounted) {
          setLoadingDocumentos(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [selectedTipo])

  const handleFileChange = (documentoId: number, file: File | null) => {
    setDocumentosDraft((current) =>
      current.map((documento) =>
        documento.id === documentoId
          ? {
              ...documento,
              file,
              error: documento.obligatorio && file === null ? 'Este documento es obligatorio.' : null,
            }
          : documento,
      ),
    )
  }

  const validate = (): boolean => {
    if (tipoSolicitudId === null) {
      setErrorMsg('Debes seleccionar un tipo de trámite.')
      return false
    }
    if (documentosError) {
      setErrorMsg('No es posible registrar la solicitud hasta cargar correctamente el listado de documentos.')
      return false
    }
    const missingRequired = documentosDraft.some((documento) => documento.obligatorio && !documento.file)
    if (missingRequired) {
      setDocumentosDraft((current) =>
        current.map((documento) =>
          documento.obligatorio && !documento.file
            ? { ...documento, error: 'Este documento es obligatorio.' }
            : documento,
        ),
      )
      setErrorMsg('Adjunta todos los documentos obligatorios antes de registrar la solicitud.')
      return false
    }

    setErrorMsg(null)
    return true
  }

  const resetForm = () => {
    setTipoSolicitudId(null)
    setDocumentosDraft([])
    setObservaciones('')
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSuccessMsg(null)

    if (!validate() || tipoSolicitudId === null) {
      return
    }

    const payload: SolicitudEstudiantePayload = {
      tipoSolicitudId,
      observaciones,
      documentos: documentosDraft.map((documento) => ({
        id: documento.id,
        nombre: documento.nombre,
        obligatorio: documento.obligatorio,
        file: documento.file,
      })),
    }

    try {
      setLoadingSubmit(true)
      if (onSubmit) {
        await onSubmit(payload)
      } else {
        await new Promise((resolve) => {
          setTimeout(resolve, 200)
        })
      }

      setErrorMsg(null)
      setSuccessMsg('Solicitud registrada correctamente.')
      resetForm()
    } catch {
      setSuccessMsg(null)
      setErrorMsg('No fue posible registrar la solicitud. Intenta nuevamente.')
    } finally {
      setLoadingSubmit(false)
    }
  }

  return (
    <form className="solicitud-estudiante-form" onSubmit={handleSubmit}>
      <h3 className="solicitud-estudiante-form__title">Registro de solicitud</h3>
      <p className="solicitud-estudiante-form__subtitle">
        Selecciona el tipo de trámite y adjunta los soportes requeridos. El estado inicial de la solicitud será
        ENVIADA A COMITE ASESOR DE POSGRADOS.
      </p>

      {errorMsg && <p className="solicitud-estudiante-form__alert solicitud-estudiante-form__alert--error">{errorMsg}</p>}
      {successMsg && (
        <p className="solicitud-estudiante-form__alert solicitud-estudiante-form__alert--success">{successMsg}</p>
      )}

      <div className="solicitud-estudiante-form__section">
        <label htmlFor="tipoSolicitud">Tipo de trámite *</label>
        <select
          id="tipoSolicitud"
          value={tipoSolicitudId ?? ''}
          onChange={(event) => {
            const nextValue = event.target.value
            setTipoSolicitudId(nextValue ? Number(nextValue) : null)
            setErrorMsg(null)
            setSuccessMsg(null)
          }}
          required
        >
          <option value="">Selecciona una opción</option>
          {tipos.map((tipo) => (
            <option key={tipo.id} value={tipo.id}>
              {formatTipoSolicitudLabel(tipo.codigoNombre) || tipo.nombre || tipo.codigoNombre || `Tipo #${tipo.id}`}
            </option>
          ))}
        </select>
      </div>

      <div className="solicitud-estudiante-form__section">
        <h4>Documentos</h4>
        {selectedTipoLabel && <p className="solicitud-estudiante-form__help">Requisitos para: {selectedTipoLabel}</p>}

        {loadingDocumentos ? (
          <p className="solicitud-estudiante-form__empty">Cargando documentos requeridos...</p>
        ) : documentosError ? (
          <p className="solicitud-estudiante-form__doc-error">{documentosError}</p>
        ) : documentosDraft.length === 0 ? (
          <p className="solicitud-estudiante-form__empty">Selecciona un tipo de trámite para cargar documentos.</p>
        ) : (
          <div className="solicitud-estudiante-form__docs-list">
            {documentosDraft.map((documento) => (
              <DocumentUploadCard
                key={documento.id}
                item={mapDraftToCardItem(documento)}
                onSelectFile={handleFileChange}
                onRemoveFile={(documentoId) => handleFileChange(documentoId, null)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="solicitud-estudiante-form__section">
        <label htmlFor="observaciones">Observaciones</label>
        <textarea
          id="observaciones"
          rows={4}
          value={observaciones}
          onChange={(event) => setObservaciones(event.target.value)}
          placeholder="Describe detalles relevantes para tu solicitud"
        />
      </div>

      <button type="submit" className="solicitud-estudiante-form__submit" disabled={loadingSubmit}>
        {loadingSubmit ? 'Registrando...' : 'Registrar solicitud'}
      </button>
    </form>
  )
}

export default SolicitudEstudianteForm

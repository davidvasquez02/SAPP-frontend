import { useEffect, useMemo, useState } from 'react'
import { getMockDocumentosByTipo } from '../../mock/documentosPorTipo.mock'
import type { SolicitudDocumentoDraft, TipoSolicitudDto } from '../../types'
import './SolicitudEstudianteForm.css'

export interface SolicitudEstudiantePayload {
  tipoSolicitudId: number
  observaciones: string
  documentos: Array<{
    id: number
    nombre: string
    obligatorio: boolean
    fileName: string | null
  }>
}

interface SolicitudEstudianteFormProps {
  tipos: TipoSolicitudDto[]
  onSubmit?: (payload: SolicitudEstudiantePayload) => Promise<void> | void
}

const buildDraft = (tipoSolicitudId: number | null): SolicitudDocumentoDraft[] => {
  if (tipoSolicitudId === null) {
    return []
  }

  return getMockDocumentosByTipo(tipoSolicitudId).map((documento) => ({
    ...documento,
    file: null,
    error: null,
  }))
}

const SolicitudEstudianteForm = ({ tipos, onSubmit }: SolicitudEstudianteFormProps) => {
  const [tipoSolicitudId, setTipoSolicitudId] = useState<number | null>(null)
  const [documentosDraft, setDocumentosDraft] = useState<SolicitudDocumentoDraft[]>([])
  const [observaciones, setObservaciones] = useState('')
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    setDocumentosDraft(buildDraft(tipoSolicitudId))
  }, [tipoSolicitudId])

  const selectedTipoLabel = useMemo(
    () => tipos.find((tipo) => tipo.id === tipoSolicitudId)?.codigoNombre ?? '',
    [tipoSolicitudId, tipos],
  )

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
        fileName: documento.file?.name ?? null,
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
              {tipo.codigoNombre}
            </option>
          ))}
        </select>
      </div>

      <div className="solicitud-estudiante-form__section">
        <h4>Documentos</h4>
        {selectedTipoLabel && <p className="solicitud-estudiante-form__help">Requisitos para: {selectedTipoLabel}</p>}

        {documentosDraft.length === 0 ? (
          <p className="solicitud-estudiante-form__empty">Selecciona un tipo de trámite para cargar documentos.</p>
        ) : (
          <ul className="solicitud-estudiante-form__docs-list">
            {documentosDraft.map((documento) => (
              <li key={documento.id} className="solicitud-estudiante-form__doc-item">
                <div className="solicitud-estudiante-form__doc-header">
                  <span>{documento.nombre}</span>
                  {documento.obligatorio && <span className="solicitud-estudiante-form__badge">Obligatorio</span>}
                </div>
                <input
                  type="file"
                  onChange={(event) => {
                    handleFileChange(documento.id, event.target.files?.[0] ?? null)
                  }}
                />
                <p className="solicitud-estudiante-form__file-name">
                  {documento.file ? `Archivo: ${documento.file.name}` : 'Sin archivo seleccionado'}
                </p>
                {documento.error && <p className="solicitud-estudiante-form__doc-error">{documento.error}</p>}
              </li>
            ))}
          </ul>
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

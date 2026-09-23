import { useCallback, useEffect, useMemo, useState } from 'react'
import { getChecklistDocumentos } from '../../../api/documentChecklistService'
import type { DocumentChecklistItemDto } from '../../../api/documentChecklistTypes'
import { uploadDocument } from '../../../api/documentUploadService'
import { fileToBase64 } from '../../../utils/fileToBase64'
import { sha256Hex } from '../../../utils/sha256'
import { getProcesoEvaluacion } from './api'
import type { ProcesoEvaluacionTg } from './types'
import './AjustesEstudiantePanel.css'

interface AjustesEstudiantePanelProps {
  solicitudId: number
  codigoTipoTramite: string
  usuarioCargaId: number | null
  enAjustes: boolean
  onUploaded: () => Promise<void> | void
}

const AjustesEstudiantePanel = ({
  solicitudId,
  codigoTipoTramite,
  usuarioCargaId,
  enAjustes,
  onUploaded,
}: AjustesEstudiantePanelProps) => {
  const [proceso, setProceso] = useState<ProcesoEvaluacionTg | null>(null)
  const [requirement, setRequirement] = useState<DocumentChecklistItemDto | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const process = await getProcesoEvaluacion(solicitudId)
      setProceso(process)

      if (enAjustes && process.documentoEvaluarId != null) {
        const codigo = Number(codigoTipoTramite)
        if (!Number.isFinite(codigo)) throw new Error('No fue posible determinar el tipo de trámite del documento.')
        const requirements = await getChecklistDocumentos({ codigoTipoTramite: codigo, tramiteId: solicitudId })
        setRequirement(
          requirements.find((item) => item.documentoUploadedResponse?.idDocumento === process.documentoEvaluarId) ?? null,
        )
      } else {
        setRequirement(null)
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No fue posible consultar el proceso de evaluación.')
    } finally {
      setLoading(false)
    }
  }, [codigoTipoTramite, enAjustes, solicitudId])

  useEffect(() => {
    void load()
  }, [load])

  const observations = useMemo(
    () => proceso?.jurados.flatMap((jurado) =>
      jurado.evaluaciones
        .filter((evaluacion) => evaluacion.observaciones?.trim())
        .map((evaluacion) => ({ jurado: jurado.nombre, text: evaluacion.observaciones!.trim() })),
    ) ?? [],
    [proceso],
  )

  const handleUpload = async () => {
    if (!file || !requirement) return
    setUploading(true)
    setError(null)
    setMessage(null)
    try {
      const buffer = await file.arrayBuffer()
      await uploadDocument({
        tipoDocumentoTramiteId: requirement.idTipoDocumentoTramite,
        nombreArchivo: file.name,
        tramiteId: solicitudId,
        usuarioCargaId,
        aspiranteCargaId: null,
        contenidoBase64: await fileToBase64(file),
        mimeType: file.type || 'application/octet-stream',
        tamanoBytes: file.size,
        checksum: await sha256Hex(buffer),
      })
      setFile(null)
      setMessage('El archivo se cargó correctamente. La información de la solicitud fue actualizada.')
      await Promise.all([load(), onUploaded()])
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'No fue posible cargar nuevamente el archivo.')
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <p className="ajustes-estudiante__status">Consultando el proceso de evaluación…</p>
  if (!enAjustes) return error ? <p className="ajustes-estudiante__error" role="alert">{error}</p> : null

  const documentName = proceso?.documentoEvaluarNombre?.trim() || 'documento en evaluación'

  return (
    <section className="ajustes-estudiante" aria-labelledby="ajustes-estudiante-title">
      <h3 id="ajustes-estudiante-title">Ajustes solicitados por los evaluadores</h3>
      <p>Revisa los conceptos y carga nuevamente el archivo <strong>{documentName}</strong>.</p>
      <div className="ajustes-estudiante__observations">
        <h4>Conceptos de los evaluadores</h4>
        {observations.length ? <ul>{observations.map((item, index) => (
          <li key={`${item.jurado}-${index}`}><strong>{item.jurado}:</strong> {item.text}</li>
        ))}</ul> : <p>No se registraron observaciones para mostrar.</p>}
      </div>
      {requirement ? (
        <div className="ajustes-estudiante__upload">
          <label>
            <span>Nuevo archivo para {documentName}</span>
            <input type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} disabled={uploading} />
          </label>
          {file && <p>Archivo seleccionado: {file.name}</p>}
          <button type="button" onClick={() => void handleUpload()} disabled={!file || uploading}>
            {uploading ? 'Cargando…' : 'Cargar archivo nuevamente'}
          </button>
        </div>
      ) : (
        <p className="ajustes-estudiante__error" role="alert">
          No fue posible relacionar el documento en evaluación con los requisitos de esta solicitud.
        </p>
      )}
      {error && <p className="ajustes-estudiante__error" role="alert">{error}</p>}
      {message && <p className="ajustes-estudiante__success" role="status">{message}</p>}
    </section>
  )
}

export default AjustesEstudiantePanel

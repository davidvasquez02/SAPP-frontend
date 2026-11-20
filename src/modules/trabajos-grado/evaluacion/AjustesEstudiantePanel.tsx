import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DocumentUploadCard } from '../../../components/DocumentUploadCard/DocumentUploadCard'
import type { DocumentUploadItem } from '../../documentos/types/documentUploadTypes'
import { getChecklistDocumentos } from '../../../api/documentChecklistService'
import type { DocumentChecklistItemDto } from '../../../api/documentChecklistTypes'
import { uploadDocument } from '../../../api/documentUploadService'
import { fileToBase64 } from '../../../utils/fileToBase64'
import { sha256Hex } from '../../../utils/sha256'
import { isPdfFile, PDF_FILE_ACCEPT } from '../../../shared/files/pdfFile'
import { getProcesoEvaluacion } from './api'
import { rondaDeEvaluacion } from './presentacionEvaluacion'
import type { ProcesoEvaluacionTg } from './types'
import './AjustesEstudiantePanel.css'

interface AjustesEstudiantePanelProps {
  solicitudId: number
  codigoTipoTramite: string
  usuarioCargaId: number | null
  enAjustes: boolean
  onUploaded: () => Promise<void> | void
}

function documentoParaCorreccion(id: number, nombre: string, file: File | null, obligatorio: boolean): DocumentUploadItem {
  return {
    id,
    codigo: String(id),
    nombre,
    obligatorio,
    selectedFile: file,
    status: file ? 'READY_TO_UPLOAD' : 'NOT_SELECTED',
  }
}

const rondaMasReciente = (proceso: ProcesoEvaluacionTg): number =>
  Math.max(1, ...proceso.jurados.flatMap((jurado) => jurado.evaluaciones.map(rondaDeEvaluacion)))

const AjustesEstudiantePanel = ({
  solicitudId,
  codigoTipoTramite,
  usuarioCargaId,
  enAjustes,
  onUploaded,
}: AjustesEstudiantePanelProps) => {
  const [proceso, setProceso] = useState<ProcesoEvaluacionTg | null>(null)
  const [requirement, setRequirement] = useState<DocumentChecklistItemDto | null>(null)
  const [cartaRequirement, setCartaRequirement] = useState<DocumentChecklistItemDto | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [cartaFile, setCartaFile] = useState<File | null>(null)
  const [cartaError, setCartaError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [refreshError, setRefreshError] = useState(false)
  const busyRef = useRef(false)
  const savedCartaFile = useRef<File | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setSaved(false)
    setMessage(null)
    setRefreshError(false)
    setFile(null)
    setCartaFile(null)
    setCartaError(null)
    savedCartaFile.current = null
    setError(null)
    try {
      const process = await getProcesoEvaluacion(solicitudId)
      setProceso(process)

      if (enAjustes) {
        const codigo = Number(codigoTipoTramite)
        if (!Number.isFinite(codigo)) throw new Error('No fue posible determinar el tipo de trámite del documento.')
        const requirements = await getChecklistDocumentos({ codigoTipoTramite: codigo, tramiteId: solicitudId })
        setRequirement(
          enAjustes && process.documentoEvaluarId != null
            ? requirements.find((item) => item.documentoUploadedResponse?.idDocumento === process.documentoEvaluarId) ?? null
            : null,
        )
        setCartaRequirement(requirements.find((item) => item.codigoTipoDocumentoTramite === 'CARTA_RESPUESTAS_TG') ?? null)
      } else {
        setRequirement(null)
        setCartaRequirement(null)
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No fue posible consultar el proceso de evaluación.')
    } finally {
      setLoading(false)
    }
  }, [codigoTipoTramite, enAjustes, solicitudId])

  useEffect(() => {
    if (enAjustes) void load()
  }, [enAjustes, load])

  // Solo las observaciones de la ronda mas reciente: las anteriores ya se respondieron con una correccion.
  const observations = useMemo(
    () => proceso?.jurados.flatMap((jurado) =>
      jurado.evaluaciones
        .filter((evaluacion) => rondaDeEvaluacion(evaluacion) === rondaMasReciente(proceso))
        .filter((evaluacion) => evaluacion.observaciones?.trim())
        .map((evaluacion) => ({ jurado: jurado.nombre, text: evaluacion.observaciones!.trim() })),
    ) ?? [],
    [proceso],
  )

  const refresh = async () => {
    setRefreshError(false)
    try {
      await Promise.all([
        getProcesoEvaluacion(solicitudId).then(setProceso),
        onUploaded(),
      ])
    } catch {
      setRefreshError(true)
    }
  }

  const handleUpload = async () => {
    if (busyRef.current || saved || !enAjustes || !file || !requirement || cartaError) return
    if (cartaFile && !cartaRequirement) return
    busyRef.current = true
    setUploading(true)
    setError(null)
    try {
      const prepare = async (selected: File, item: DocumentChecklistItemDto) => ({
        tipoDocumentoTramiteId: item.idTipoDocumentoTramite,
        nombreArchivo: selected.name,
        tramiteId: solicitudId,
        usuarioCargaId,
        aspiranteCargaId: null,
        contenidoBase64: await fileToBase64(selected),
        mimeType: selected.type || 'application/pdf',
        tamanoBytes: selected.size,
        checksum: await sha256Hex(await selected.arrayBuffer()),
      })
      // Preparar ambos antes de escribir. La corrección se envía al final porque
      // su carga asigna el documento evaluado y avanza el estado en el backend.
      const corrected = await prepare(file, requirement)
      const carta = cartaFile && cartaRequirement && savedCartaFile.current !== cartaFile
        ? await prepare(cartaFile, cartaRequirement) : null
      if (carta) {
        await uploadDocument(carta)
        savedCartaFile.current = cartaFile
      }
      await uploadDocument(corrected)
      setSaved(true)
      setFile(null)
      setCartaFile(null)
      setMessage('Las correcciones se guardaron correctamente.')
      await refresh()
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'No fue posible guardar las correcciones.')
    } finally {
      busyRef.current = false
      setUploading(false)
    }
  }

  if (!enAjustes && !saved) return null
  if (loading) return <p className="ajustes-estudiante__status">Consultando el proceso de evaluación…</p>

  const documentName = proceso?.documentoEvaluarNombre?.trim() || 'documento en evaluación'

  return (
    <section className="ajustes-estudiante" aria-labelledby="ajustes-estudiante-title">
      <h3 id="ajustes-estudiante-title">Ajustes solicitados por los evaluadores</h3>
      {!saved && (
        <>
          <p>Revisa los conceptos y carga nuevamente el archivo <strong>{documentName}</strong>.</p>
          <div className="ajustes-estudiante__observations">
            <h4>Conceptos de los evaluadores</h4>
            {observations.length ? <ul>{observations.map((item, index) => (
              <li key={`${item.jurado}-${index}`}><strong>{item.jurado}:</strong> {item.text}</li>
            ))}</ul> : <p>No se registraron observaciones para mostrar.</p>}
          </div>
        </>
      )}
      {!saved && (requirement ? (
        <DocumentUploadCard
          item={documentoParaCorreccion(requirement.idTipoDocumentoTramite, `Nuevo archivo para ${documentName}`, file, true)}
          fileAccept={PDF_FILE_ACCEPT}
          disabled={uploading}
          onSelectFile={(_, selected) => {
            const invalido = selected != null && !isPdfFile(selected)
            setError(invalido ? 'Solo se permiten archivos PDF.' : null)
            setFile(invalido ? null : selected)
          }}
        />
      ) : (
        <p className="ajustes-estudiante__error" role="alert">
          No fue posible relacionar el documento en evaluación con los requisitos de esta solicitud.
        </p>
      ))}
      {error && <p className="ajustes-estudiante__error" role="alert">{error}</p>}
      {message && <p className="ajustes-estudiante__success" role="status">{message}</p>}
      {!saved && cartaRequirement && (
        <div className="ajustes-estudiante__upload">
          <DocumentUploadCard
            item={documentoParaCorreccion(cartaRequirement.idTipoDocumentoTramite, 'Carta de respuestas a las observaciones', cartaFile, false)}
            fileAccept={PDF_FILE_ACCEPT}
            disabled={uploading}
            onSelectFile={(_, selected) => {
              const invalido = selected != null && !isPdfFile(selected)
              setCartaError(invalido ? 'Solo se permiten archivos PDF.' : null)
              setCartaFile(invalido ? null : selected)
            }}
          />
          {proceso?.cartaRespuestasNombre && <p>Carta ya cargada: {proceso.cartaRespuestasNombre}</p>}
          {cartaError && <p className="ajustes-estudiante__error" role="alert">{cartaError}</p>}
        </div>
      )}
      {!saved && <button className="ajustes-estudiante__save" type="button" onClick={() => void handleUpload()} disabled={!file || !requirement || uploading || Boolean(cartaError)}>
        {uploading ? 'Guardando…' : 'Guardar correcciones'}
      </button>}
      {refreshError && <div role="alert">
        <p>Las correcciones están guardadas, pero no fue posible actualizar la solicitud.</p>
        <button className="ajustes-estudiante__save" type="button" disabled={uploading} onClick={() => void refresh()}>Actualizar solicitud</button>
      </div>}
    </section>
  )
}

export default AjustesEstudiantePanel

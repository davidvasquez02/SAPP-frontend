import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/Auth'
import { cargarCertificado, listarCertificados } from '../../modules/matricula-financiera/api'
import { useConsulta, useOperacion } from '../../modules/matricula-financiera/hooks'
import { fileToBase64 } from '../../utils/fileToBase64'
import { sha256Hex } from '../../utils/sha256'
import { downloadSolicitudDocument, openSolicitudDocument } from '../../modules/solicitudes/utils/solicitudDocumentFile'
import { Aviso } from './FinancieraUi'

interface CertificadoVotacionProps { liquidacionId: number; editable: boolean; onChange: () => void; onBusyChange?: (value: boolean) => void; onValidChange?: (value: boolean) => void; onPendingUploadChange?: (upload: (() => Promise<boolean>) | null) => void; embedded?: boolean; required?: boolean; deferredUpload?: boolean }
export function CertificadoVotacion({ liquidacionId, editable, onChange, onBusyChange, onValidChange, onPendingUploadChange, embedded = false, required = false, deferredUpload = false }: CertificadoVotacionProps) {
  const { session } = useAuth()
  const consulta = useConsulta(useCallback((signal: AbortSignal) => listarCertificados(liquidacionId, signal), [liquidacionId]))
  const op = useOperacion()
  const [file, setFile] = useState<File | null>(null)
  const [inputKey, setInputKey] = useState(0)
  const requirement = consulta.data?.find(d => d.codigoTipoDocumentoTramite === 'ANX-39')
  const current = requirement?.documentoUploadedResponse
  const valid = Boolean(current && current.estadoDocumento !== 'RECHAZADO')
  useEffect(() => { onValidChange?.(valid) }, [onValidChange, valid])
  const uploadRef = useRef<() => Promise<boolean>>(async () => false)
  uploadRef.current = async () => { if (!file || !requirement) return false; return op.run(async () => {
    onBusyChange?.(true)
    try {
      if (!session?.user.id) throw new Error('No fue posible identificar al usuario que carga el documento.')
      await cargarCertificado({ tipoDocumentoTramiteId: requirement!.idTipoDocumentoTramite, tramiteId: liquidacionId, nombreArchivo: file.name, usuarioCargaId: session.user.id, aspiranteCargaId: null, contenidoBase64: await fileToBase64(file), mimeType: file.type || 'application/octet-stream', tamanoBytes: file.size, checksum: await sha256Hex(await file.arrayBuffer()) })
      setFile(null); setInputKey(v => v + 1)
      if (!deferredUpload) { consulta.refresh(); onChange() }
    } finally { onBusyChange?.(false) }
  }, 'Certificado guardado.') }
  useEffect(() => { onPendingUploadChange?.(file && requirement ? () => uploadRef.current() : null); return () => onPendingUploadChange?.(null) }, [file, onPendingUploadChange, requirement])
  return <section className={embedded ? 'mf-certificate' : 'mf-card'}><h3>Certificado de votación</h3><p>{required ? 'Obligatorio para guardar una respuesta afirmativa.' : 'Opcional. Puedes cargarlo como respaldo si coordinación dispone del documento.'} Reemplazar crea una nueva versión.</p>
    <Aviso error={consulta.error || op.error} message={op.message} />
    {consulta.loading ? <p>Cargando documento…</p> : !requirement ? <p>No está disponible el certificado en el catálogo. Contacta a coordinación.</p> : <>
      <p>{current ? current.nombreArchivoDocumento : 'Sin documento cargado.'}</p>
      {current?.estadoDocumento === 'RECHAZADO' && <p>El documento fue rechazado y no cuenta como recibido. {current.observacionesDocumento}</p>}
      {current && <div className="mf-actions"><button type="button" disabled={op.busy} className="mf-button mf-button--secondary" onClick={() => void op.run(() => openSolicitudDocument(current.base64DocumentoContenido, current.mimeTypeDocumentoContenido, current.nombreArchivoDocumento), '')}>Ver documento</button><button type="button" disabled={op.busy} className="mf-button mf-button--secondary" onClick={() => void op.run(() => downloadSolicitudDocument(current.base64DocumentoContenido, current.mimeTypeDocumentoContenido, current.nombreArchivoDocumento), '')}>Descargar</button></div>}
      {editable && <div className="mf-questions"><label>{current ? 'Reemplazar certificado' : 'Seleccionar certificado'}<input key={inputKey} type="file" disabled={op.busy} onChange={e => setFile(e.target.files?.[0] ?? null)} /></label>{!deferredUpload && <button type="button" className="mf-button" disabled={op.busy || !file} onClick={() => void uploadRef.current()}>{op.busy ? 'Cargando…' : 'Guardar certificado'}</button>}</div>}
    </>}
    {consulta.error && <button type="button" className="mf-button mf-button--secondary" onClick={consulta.refresh}>Reintentar consulta</button>}
  </section>
}

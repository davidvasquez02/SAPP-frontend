import { useCallback, useEffect, useMemo, useState } from 'react'
import { uploadDocument } from '../../api/documentUploadService'
import { DocumentUploadCard } from '../../components'
import { CODIGO_TIPO_TRAMITE_ADMISION_COORDINACION } from '../../modules/documentos/constants'
import { getDocumentById, getDocumentosByTramiteParams } from '../../modules/documentos/api/documentosService'
import type { DocumentoTramiteItemDto } from '../../modules/documentos/api/types'
import type { DocumentUploadItem } from '../../modules/documentos/types/documentUploadTypes'
import { downloadBase64File, openBase64InNewTab } from '../../shared/files/base64FileUtils'
import { isPdfFile, PDF_FILE_ACCEPT } from '../../shared/files/pdfFile'
import { fileToBase64 } from '../../utils/fileToBase64'
import { sha256Hex } from '../../utils/sha256'

/** Tope de archivos por carga, el mismo que usan las solicitudes para sus soportes adicionales. */
const MAX_ARCHIVOS_POR_CARGA = 5

interface ReferenciasAcademicasSectionProps {
  /** Id de la inscripción de admisión. */
  tramiteId: number
  usuarioCargaId: number | null
  /** Quien no administra posgrados solo ve las referencias, sin poder subir. */
  puedeCargar: boolean
  /** Con la inscripción ya cerrada (admitida o rechazada) no se agregan más referencias. */
  inscripcionCerrada: boolean
}

interface TipoReferencia {
  id: number
  nombre: string
  descripcion: string
  documentos: DocumentoTramiteItemDto[]
}

/** El listado trae una fila por documento cargado de cada tipo (varias si el tipo admite varias cargas). */
const agruparPorTipo = (filas: DocumentoTramiteItemDto[]): TipoReferencia[] => {
  const tipos = new Map<number, TipoReferencia>()
  for (const fila of filas) {
    const tipo = tipos.get(fila.idTipoDocumentoTramite) ?? {
      id: fila.idTipoDocumentoTramite,
      nombre: fila.nombreTipoDocumentoTramite,
      descripcion: fila.descripcionTipoDocumentoTramite,
      documentos: [],
    }
    if (fila.documentoCargado && fila.documentoUploadedResponse) {
      tipo.documentos.push(fila)
    }
    tipos.set(fila.idTipoDocumentoTramite, tipo)
  }
  return [...tipos.values()]
}

const formatearFecha = (valor?: string | null): string => {
  if (!valor) return ''
  const fecha = new Date(valor)
  return Number.isNaN(fecha.getTime()) ? valor : fecha.toLocaleDateString('es-CO')
}

/**
 * Referencias académicas del aspirante: lo único que el coordinador sube en la admisión (el resto lo sube el aspirante).
 * Se pueden cargar varias, y cada una queda como un documento aparte.
 */
const ReferenciasAcademicasSection = ({
  tramiteId,
  usuarioCargaId,
  puedeCargar,
  inscripcionCerrada,
}: ReferenciasAcademicasSectionProps) => {
  const [tipos, setTipos] = useState<TipoReferencia[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [seleccion, setSeleccion] = useState<Record<number, File[]>>({})
  const [subiendoTipoId, setSubiendoTipoId] = useState<number | null>(null)
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  const [accionEnCurso, setAccionEnCurso] = useState<number | null>(null)

  const cargar = useCallback(async () => {
    try {
      setLoadError(null)
      const filas = await getDocumentosByTramiteParams({
        tramiteId,
        codigoTipoTramite: CODIGO_TIPO_TRAMITE_ADMISION_COORDINACION,
        incluirContenido: false,
      })
      setTipos(agruparPorTipo(filas))
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No fue posible consultar las referencias académicas.')
    } finally {
      setIsLoading(false)
    }
  }, [tramiteId])

  useEffect(() => {
    setIsLoading(true)
    void cargar()
  }, [cargar])

  const seleccionarArchivos = useCallback((tipoId: number, archivos: File[]) => {
    const pdfs = archivos.filter(isPdfFile)
    if (pdfs.length < archivos.length) {
      setMensaje({ tipo: 'error', texto: 'Solo se permiten archivos PDF.' })
    } else {
      setMensaje(null)
    }
    setSeleccion((actual) => ({
      ...actual,
      [tipoId]: [...(actual[tipoId] ?? []), ...pdfs].slice(0, MAX_ARCHIVOS_POR_CARGA),
    }))
  }, [])

  const quitarArchivo = useCallback((tipoId: number, indice: number) => {
    setSeleccion((actual) => ({ ...actual, [tipoId]: (actual[tipoId] ?? []).filter((_, i) => i !== indice) }))
  }, [])

  const subir = async (tipo: TipoReferencia) => {
    const archivos = seleccion[tipo.id] ?? []
    if (archivos.length === 0 || subiendoTipoId != null) return

    setSubiendoTipoId(tipo.id)
    setMensaje(null)
    const fallidos: string[] = []
    let subidos = 0
    // Una por una: si una falla, las demás se siguen subiendo y las que fallaron quedan seleccionadas para reintentar.
    const pendientes: File[] = []
    for (const archivo of archivos) {
      try {
        await uploadDocument({
          tipoDocumentoTramiteId: tipo.id,
          nombreArchivo: archivo.name,
          tramiteId,
          usuarioCargaId,
          aspiranteCargaId: null,
          contenidoBase64: await fileToBase64(archivo),
          mimeType: archivo.type || 'application/pdf',
          tamanoBytes: archivo.size,
          checksum: await sha256Hex(await archivo.arrayBuffer()),
        })
        subidos++
      } catch (error) {
        pendientes.push(archivo)
        fallidos.push(`${archivo.name}: ${error instanceof Error ? error.message : 'error desconocido'}`)
      }
    }

    setSeleccion((actual) => ({ ...actual, [tipo.id]: pendientes }))
    setMensaje(
      fallidos.length === 0
        ? { tipo: 'ok', texto: subidos === 1 ? 'Referencia cargada.' : `${subidos} referencias cargadas.` }
        : { tipo: 'error', texto: `No se pudo cargar: ${fallidos.join('; ')}` },
    )
    setSubiendoTipoId(null)
    await cargar()
  }

  const verOdescargar = async (documentoId: number, accion: 'ver' | 'descargar') => {
    const ventana = accion === 'ver' ? window.open('', '_blank') : null
    if (ventana) ventana.opener = null
    setAccionEnCurso(documentoId)
    try {
      const documento = await getDocumentById(documentoId)
      if (!documento.contenidoBase64) throw new Error('No hay contenido para mostrar.')
      const mime = documento.mimeType ?? 'application/pdf'
      if (accion === 'ver') {
        openBase64InNewTab(documento.contenidoBase64, mime, documento.nombreArchivo ?? undefined, ventana)
      } else {
        downloadBase64File(documento.contenidoBase64, mime, documento.nombreArchivo ?? 'referencia.pdf')
      }
    } catch (error) {
      ventana?.close()
      window.alert(error instanceof Error ? error.message : String(error))
    } finally {
      setAccionEnCurso(null)
    }
  }

  const itemTarjeta = useMemo(
    () => (tipo: TipoReferencia): DocumentUploadItem => ({
      id: tipo.id,
      codigo: String(tipo.id),
      nombre: `Agregar ${tipo.nombre.toLocaleLowerCase('es-CO')}`,
      descripcion: tipo.descripcion,
      obligatorio: false,
      selectedFile: null,
      status: subiendoTipoId === tipo.id ? 'UPLOADING' : (seleccion[tipo.id]?.length ?? 0) > 0 ? 'READY_TO_UPLOAD' : 'NOT_SELECTED',
    }),
    [seleccion, subiendoTipoId],
  )

  return (
    <section className="inscripcion-documentos__referencias" aria-labelledby="referencias-academicas-title">
      <h3 id="referencias-academicas-title" className="inscripcion-documentos__referencias-title">Referencias académicas</h3>
      <p className="inscripcion-documentos__subtitle">
        Las referencias las carga el coordinador; puedes agregar varias. El resto de documentos los carga el aspirante.
      </p>

      {mensaje ? (
        <p role="status" className={`inscripcion-documentos__operation-message inscripcion-documentos__operation-message--${mensaje.tipo === 'ok' ? 'success' : 'error'}`}>
          {mensaje.texto}
        </p>
      ) : null}

      {isLoading ? (
        <p className="inscripcion-documentos__status">Cargando referencias...</p>
      ) : loadError ? (
        <p className="inscripcion-documentos__error">{loadError}</p>
      ) : tipos.length === 0 ? (
        <p className="inscripcion-documentos__status">No hay un tipo de documento de referencia configurado.</p>
      ) : (
        tipos.map((tipo) => (
          <div key={tipo.id} className="inscripcion-documentos__referencias-tipo">
            {tipo.documentos.length === 0 ? (
              <p className="inscripcion-documentos__status">Aún no hay referencias cargadas.</p>
            ) : (
              <ul className="inscripcion-documentos__referencias-lista">
                {tipo.documentos.map((fila) => {
                  const documento = fila.documentoUploadedResponse!
                  return (
                    <li key={documento.idDocumento}>
                      <div>
                        <strong>{documento.nombreArchivoDocumento}</strong>
                        <small>Cargada el {formatearFecha(documento.fechaCargaDocumento)}</small>
                      </div>
                      <div className="inscripcion-documentos__referencias-acciones">
                        <button
                          type="button"
                          className="sapp-document-action"
                          disabled={accionEnCurso === documento.idDocumento}
                          onClick={() => void verOdescargar(documento.idDocumento, 'ver')}
                        >
                          Ver
                        </button>
                        <button
                          type="button"
                          className="sapp-document-action"
                          disabled={accionEnCurso === documento.idDocumento}
                          onClick={() => void verOdescargar(documento.idDocumento, 'descargar')}
                        >
                          Descargar
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}

            {puedeCargar && !inscripcionCerrada ? (
              <>
                <DocumentUploadCard
                  item={itemTarjeta(tipo)}
                  onSelectFile={() => undefined}
                  multiple
                  maxFiles={MAX_ARCHIVOS_POR_CARGA}
                  selectedFiles={seleccion[tipo.id] ?? []}
                  onSelectFiles={seleccionarArchivos}
                  onRemoveSelectedFile={quitarArchivo}
                  fileAccept={PDF_FILE_ACCEPT}
                  disabled={subiendoTipoId != null}
                  showUploadButton={false}
                />
                <button
                  type="button"
                  className="inscripcion-documentos__continue-button"
                  disabled={(seleccion[tipo.id]?.length ?? 0) === 0 || subiendoTipoId != null}
                  onClick={() => void subir(tipo)}
                >
                  {subiendoTipoId === tipo.id ? 'Cargando…' : 'Cargar referencias'}
                </button>
              </>
            ) : null}
          </div>
        ))
      )}
    </section>
  )
}

export default ReferenciasAcademicasSection

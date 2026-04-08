import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getChecklistDocumentos } from '../../api/documentChecklistService'
import type { DocumentChecklistItemDto } from '../../api/documentChecklistTypes'
import { getDocentesGrupoInvestigacion, getGruposInvestigacion } from '../../api/gruposInvestigacionService'
import { updateAspiranteInvestigacion } from '../../api/aspiranteService'
import type {
  GrupoInvestigacionDocenteDto,
  GrupoInvestigacionDto,
} from '../../api/gruposInvestigacionTypes'
import { uploadDocument } from '../../api/documentUploadService'
import { DocumentUploadCard } from '../../components'
import { useAuth } from '../../context/Auth'
import { cambiarEstadoInscripcionVal } from '../../modules/admisiones/api/inscripcionCambioEstadoService'
import { CODIGO_TIPO_TRAMITE_ADMISION_ASPIRANTE } from '../../modules/documentos/constants'
import { fileToBase64 } from '../../utils/fileToBase64'
import { sha256Hex } from '../../utils/sha256'
import type { DocumentUploadItem } from '../../modules/documentos/types/documentUploadTypes'
import type { AspiranteUser } from '../../context/Auth'
import './AspiranteDocumentosPage.css'

const mapDocumentoToUploadItem = (documento: DocumentChecklistItemDto): DocumentUploadItem => {
  const isUploaded = documento.documentoCargado === true && documento.documentoUploadedResponse != null

  return {
    id: documento.idTipoDocumentoTramite,
    codigo: documento.codigoTipoDocumentoTramite,
    nombre: documento.nombreTipoDocumentoTramite,
    descripcion: documento.descripcionTipoDocumentoTramite,
    obligatorio: documento.obligatorioTipoDocumentoTramite,
    status: isUploaded ? 'UPLOADED' : 'NOT_SELECTED',
    selectedFile: null,
    uploadedFileName: isUploaded
      ? documento.documentoUploadedResponse?.nombreArchivoDocumento
      : undefined,
    uploadedBase64: isUploaded
      ? documento.documentoUploadedResponse?.base64DocumentoContenido
      : undefined,
    uploadedMimeType: isUploaded
      ? documento.documentoUploadedResponse?.mimeTypeDocumentoContenido
      : undefined,
  }
}

const areRequiredDocumentsComplete = (documentos: Pick<DocumentUploadItem, 'obligatorio' | 'status'>[]) => {
  const obligatorios = documentos.filter((documento) => documento.obligatorio)

  if (obligatorios.length === 0) {
    return false
  }

  return obligatorios.every((documento) => documento.status === 'UPLOADED')
}

const AspiranteDocumentosPage = () => {
  const { session } = useAuth()
  const hasFetchedRef = useRef(false)
  const [items, setItems] = useState<DocumentUploadItem[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [grupoInvestigacionId, setGrupoInvestigacionId] = useState('')
  const [directorGrupoId, setDirectorGrupoId] = useState('')
  const [infoInvestigacionAgregada, setInfoInvestigacionAgregada] = useState(false)
  const [gruposInvestigacion, setGruposInvestigacion] = useState<GrupoInvestigacionDto[]>([])
  const [directoresGrupo, setDirectoresGrupo] = useState<GrupoInvestigacionDocenteDto[]>([])
  const [isLoadingGrupos, setIsLoadingGrupos] = useState(false)
  const [isLoadingDocentes, setIsLoadingDocentes] = useState(false)
  const [investigacionErrorMessage, setInvestigacionErrorMessage] = useState<string | null>(null)
  const [isSavingInvestigacion, setIsSavingInvestigacion] = useState(false)

  useEffect(() => {
    let isMounted = true

    const fetchGrupos = async () => {
      setIsLoadingGrupos(true)
      setInvestigacionErrorMessage(null)

      try {
        const grupos = await getGruposInvestigacion()
        if (!isMounted) {
          return
        }
        setGruposInvestigacion(grupos)
      } catch (error) {
        if (!isMounted) {
          return
        }
        const message = error instanceof Error ? error.message : 'Error consultando grupos de investigación.'
        setInvestigacionErrorMessage(message)
      } finally {
        if (isMounted) {
          setIsLoadingGrupos(false)
        }
      }
    }

    void fetchGrupos()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!grupoInvestigacionId) {
      setDirectoresGrupo([])
      setDirectorGrupoId('')
      return
    }

    let isMounted = true
    const fetchDocentesGrupo = async () => {
      setIsLoadingDocentes(true)
      setInvestigacionErrorMessage(null)
      setDirectorGrupoId('')

      try {
        const docentes = await getDocentesGrupoInvestigacion(Number(grupoInvestigacionId))
        if (!isMounted) {
          return
        }
        setDirectoresGrupo(docentes)
      } catch (error) {
        if (!isMounted) {
          return
        }
        const message = error instanceof Error ? error.message : 'Error consultando docentes del grupo.'
        setInvestigacionErrorMessage(message)
        setDirectoresGrupo([])
      } finally {
        if (isMounted) {
          setIsLoadingDocentes(false)
        }
      }
    }

    void fetchDocentesGrupo()

    return () => {
      isMounted = false
    }
  }, [grupoInvestigacionId])

  useEffect(() => {
    if (!session || session.kind !== 'ASPIRANTE') {
      return
    }

    if (hasFetchedRef.current) {
      return
    }

    const fetchDocumentos = async () => {
      try {
        const aspiranteUser = session.user as AspiranteUser
        const tramiteId = aspiranteUser.inscripcionAdmisionId

        if (tramiteId == null) {
          setErrorMessage('No se encontró inscripcionAdmisionId en la sesión del aspirante.')
          return
        }

        hasFetchedRef.current = true
        setErrorMessage(null)
        const documentos = await getChecklistDocumentos({
          codigoTipoTramite: CODIGO_TIPO_TRAMITE_ADMISION_ASPIRANTE,
          tramiteId,
        })
        console.log('[AspiranteDocumentos] requisitos:', documentos)
        setItems(documentos.map(mapDocumentoToUploadItem))
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.error('[AspiranteDocumentos] error consultando documentos:', message)
        setErrorMessage(message)
      }
    }

    void fetchDocumentos()
  }, [session])

  const obligatoriosTotales = useMemo(
    () => items.filter((item) => item.obligatorio).length,
    [items],
  )
  const obligatoriosCargados = useMemo(
    () => items.filter((item) => item.obligatorio && item.status === 'UPLOADED').length,
    [items],
  )
  const progresoObligatorios = obligatoriosTotales
    ? Math.round((obligatoriosCargados / obligatoriosTotales) * 100)
    : 100

  const handleSelectFile = useCallback((id: number, file: File | null) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              selectedFile: file,
              status: file ? 'READY_TO_UPLOAD' : 'NOT_SELECTED',
              errorMessage: undefined,
            }
          : item,
      ),
    )
  }, [])

  const handleUpload = useCallback(
    async (id: number) => {
      if (!session || session.kind !== 'ASPIRANTE') {
        console.error('[AspiranteDocumentos] sesión de aspirante no disponible')
        return
      }
      const aspiranteUser = session.user as AspiranteUser

      const item = items.find((current) => current.id === id)

      if (!item?.selectedFile) {
        return
      }

      setItems((prev) =>
        prev.map((current) =>
          current.id === id ? { ...current, status: 'UPLOADING', errorMessage: undefined } : current,
        ),
      )

      try {
        const tramiteId = aspiranteUser.inscripcionAdmisionId

        if (tramiteId == null) {
          setItems((prev) =>
            prev.map((current) =>
              current.id === id
                ? {
                    ...current,
                    status: 'ERROR',
                    errorMessage: 'No se encontró inscripcionAdmisionId en la sesión del aspirante.',
                  }
                : current,
            ),
          )
          return
        }

        const buffer = await item.selectedFile.arrayBuffer()
        const contenidoBase64 = await fileToBase64(item.selectedFile)
        const checksum = await sha256Hex(buffer)

        const uploaded = await uploadDocument({
          tipoDocumentoTramiteId: item.id,
          nombreArchivo: item.selectedFile.name,
          tramiteId,
          usuarioCargaId: null,
          aspiranteCargaId: aspiranteUser.id,
          contenidoBase64,
          mimeType: item.selectedFile.type || 'application/octet-stream',
          tamanoBytes: item.selectedFile.size,
          checksum,
        })

        const checklistWasComplete = areRequiredDocumentsComplete(items)
        const optimisticItems = items.map((current) =>
          current.id === id ? { ...current, status: 'UPLOADED' as const } : current,
        )
        const checklistIsComplete = areRequiredDocumentsComplete(optimisticItems)

        setItems((prev) =>
          prev.map((current) =>
            current.id === id
              ? {
                  ...current,
                  status: 'UPLOADED',
                  uploadedFileName: uploaded.nombreArchivo,
                  selectedFile: null,
                  errorMessage: undefined,
                }
              : current,
          ),
        )

        if (!checklistWasComplete && checklistIsComplete) {
          void cambiarEstadoInscripcionVal(tramiteId).catch((stateError) => {
            const stateMessage = stateError instanceof Error ? stateError.message : String(stateError)
            console.warn(
              '[AspiranteDocumentos] no fue posible ejecutar cambioEstadoVal tras completar checklist:',
              stateMessage,
            )
          })
        }

        try {
          const documentos = await getChecklistDocumentos({
            codigoTipoTramite: CODIGO_TIPO_TRAMITE_ADMISION_ASPIRANTE,
            tramiteId,
          })
          setItems(documentos.map(mapDocumentoToUploadItem))
        } catch (refreshError) {
          const refreshMessage =
            refreshError instanceof Error ? refreshError.message : String(refreshError)
          console.warn('[AspiranteDocumentos] error refrescando checklist:', refreshMessage)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido'
        setItems((prev) =>
          prev.map((current) =>
            current.id === id ? { ...current, status: 'ERROR', errorMessage: message } : current,
          ),
        )
      }
    },
    [items, session],
  )

  const handleAgregarInformacionInvestigacion = useCallback(async () => {
    if (!session || session.kind !== 'ASPIRANTE') {
      setInvestigacionErrorMessage('No se encontró la sesión del aspirante.')
      return
    }

    const aspiranteUser = session.user as AspiranteUser
    const aspiranteId = aspiranteUser.id
    const grupoId = Number(grupoInvestigacionId)
    const directorId = Number(directorGrupoId)

    if (!Number.isFinite(aspiranteId) || aspiranteId <= 0) {
      setInvestigacionErrorMessage('No se encontró el id del aspirante para guardar la información.')
      return
    }

    if (!Number.isFinite(grupoId) || grupoId <= 0 || !Number.isFinite(directorId) || directorId <= 0) {
      setInvestigacionErrorMessage('Seleccione un grupo de investigación y un director válidos.')
      return
    }

    setIsSavingInvestigacion(true)
    setInvestigacionErrorMessage(null)

    try {
      await updateAspiranteInvestigacion({
        id: aspiranteId,
        grupoInvestigacionId: grupoId,
        directorId,
      })
      setInfoInvestigacionAgregada(true)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No fue posible actualizar la información de investigación.'
      setInvestigacionErrorMessage(message)
      setInfoInvestigacionAgregada(false)
    } finally {
      setIsSavingInvestigacion(false)
    }
  }, [directorGrupoId, grupoInvestigacionId, session])

  const investigacionListaParaAgregar =
    grupoInvestigacionId.trim().length > 0 && directorGrupoId.trim().length > 0

  return (
    <section className="aspirante-documentos">
      <header className="aspirante-documentos__header">
        <div>
          <h1 className="aspirante-documentos__title">Carga de documentos del aspirante</h1>
          <p className="aspirante-documentos__summary">
            Obligatorios cargados: {obligatoriosCargados} / {obligatoriosTotales}
          </p>
          <p className="aspirante-documentos__summary">Total requisitos: {items.length}</p>
        </div>
        <div className="aspirante-documentos__progress">
          <div
            className="aspirante-documentos__progress-bar"
            style={{ width: `${progresoObligatorios}%` }}
          />
        </div>
      </header>

      <div className="aspirante-documentos__list">
        {errorMessage ? (
          <p className="aspirante-documentos__error">{errorMessage}</p>
        ) : items.length === 0 ? (
          <p className="aspirante-documentos__empty">No hay requisitos disponibles.</p>
        ) : (
          items.map((item) => (
            <DocumentUploadCard
              key={item.id}
              item={item}
              onSelectFile={handleSelectFile}
              onUpload={handleUpload}
              disabled={item.status === 'UPLOADING'}
            />
          ))
        )}
      </div>

      <section className="aspirante-documentos__investigacion-card" aria-label="Información de investigación">
        <h2 className="aspirante-documentos__investigacion-title">Información de investigación</h2>
        <p className="aspirante-documentos__investigacion-helper">
          Seleccione su grupo de investigación y el director del grupo.
        </p>

        <div className="aspirante-documentos__investigacion-grid">
          <label className="aspirante-documentos__field">
            <span>Grupo de investigación</span>
            <select
              value={grupoInvestigacionId}
              onChange={(event) => {
                setGrupoInvestigacionId(event.target.value)
                setInfoInvestigacionAgregada(false)
                setInvestigacionErrorMessage(null)
              }}
              disabled={infoInvestigacionAgregada || isLoadingGrupos || isSavingInvestigacion}
            >
              <option value="">Seleccione un grupo</option>
              {isLoadingGrupos ? (
                <option value="" disabled>
                  Cargando grupos...
                </option>
              ) : null}
              {gruposInvestigacion.map((grupo) => (
                <option key={grupo.id} value={String(grupo.id)}>
                  {grupo.codigoNombre}
                </option>
              ))}
            </select>
          </label>

          <label className="aspirante-documentos__field">
            <span>Director del grupo de investigación</span>
            <select
              value={directorGrupoId}
              onChange={(event) => {
                setDirectorGrupoId(event.target.value)
                setInfoInvestigacionAgregada(false)
                setInvestigacionErrorMessage(null)
              }}
              disabled={
                infoInvestigacionAgregada ||
                !grupoInvestigacionId ||
                isLoadingDocentes ||
                isSavingInvestigacion
              }
            >
              <option value="">Seleccione un director</option>
              {isLoadingDocentes ? (
                <option value="" disabled>
                  Cargando directores...
                </option>
              ) : null}
              {directoresGrupo.map((director) => (
                <option key={director.id} value={String(director.id)}>
                  {director.nombre.trim().replace(/\s+/g, ' ')}
                </option>
              ))}
            </select>
          </label>
        </div>
        {investigacionErrorMessage ? (
          <p className="aspirante-documentos__investigacion-error">{investigacionErrorMessage}</p>
        ) : null}

        <div className="aspirante-documentos__investigacion-actions">
          <button
            type="button"
            className="aspirante-documentos__investigacion-add-button"
            onClick={() => {
              void handleAgregarInformacionInvestigacion()
            }}
            disabled={infoInvestigacionAgregada || !investigacionListaParaAgregar || isSavingInvestigacion}
          >
            {infoInvestigacionAgregada
              ? 'Información agregada'
              : isSavingInvestigacion
                ? 'Guardando información...'
                : 'Agregar información'}
          </button>
        </div>
      </section>
    </section>
  )
}

export default AspiranteDocumentosPage

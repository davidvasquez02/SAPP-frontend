import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getChecklistDocumentos } from '../../api/documentChecklistService'
import type { DocumentChecklistItemDto } from '../../api/documentChecklistTypes'
import { uploadAspiranteDocumento } from '../../api/aspiranteUploadService'
import { DocumentUploadCard } from '../../components'
import { useAuth } from '../../context/Auth'
import type { DocumentUploadItem } from './types'
import './AspiranteDocumentosPage.css'

const getUploadedFileName = (documento: DocumentChecklistItemDto): string | undefined => {
  if (!documento.documentoCargado) {
    return undefined
  }

  if (typeof documento.documentoUploadedResponse === 'string') {
    return documento.documentoUploadedResponse
  }

  return 'Cargado en servidor'
}

const mapDocumentoToUploadItem = (documento: DocumentChecklistItemDto): DocumentUploadItem => ({
  id: documento.idTipoDocumentoTramite,
  codigo: documento.codigoTipoDocumentoTramite,
  nombre: documento.nombreTipoDocumentoTramite,
  descripcion: documento.descripcionTipoDocumentoTramite,
  obligatorio: documento.obligatorioTipoDocumentoTramite,
  status: documento.documentoCargado ? 'UPLOADED' : 'NOT_SELECTED',
  selectedFile: null,
  uploadedFileName: getUploadedFileName(documento),
})

const AspiranteDocumentosPage = () => {
  const { session } = useAuth()
  const hasFetchedRef = useRef(false)
  const [items, setItems] = useState<DocumentUploadItem[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!session || session.kind !== 'ASPIRANTE') {
      return
    }

    if (hasFetchedRef.current) {
      return
    }

    const fetchDocumentos = async () => {
      try {
        const tramiteId = session.user.inscripcionAdmisionId

        if (tramiteId == null) {
          setErrorMessage('No se encontró inscripcionAdmisionId en la sesión del aspirante.')
          return
        }

        hasFetchedRef.current = true
        setErrorMessage(null)
        const documentos = await getChecklistDocumentos({
          nombreTipoTramite: 'ADMISION_ASPIRANTE',
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
        const response = await uploadAspiranteDocumento({
          aspiranteId: session.user.id,
          idTipoDocumentoTramite: item.id,
          file: item.selectedFile,
        })

        if (response.ok) {
          setItems((prev) =>
            prev.map((current) =>
              current.id === id
                ? {
                    ...current,
                    status: 'UPLOADED',
                    uploadedFileName: item.selectedFile?.name,
                  }
                : current,
            ),
          )
        } else {
          setItems((prev) =>
            prev.map((current) =>
              current.id === id
                ? { ...current, status: 'ERROR', errorMessage: response.message }
                : current,
            ),
          )
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
    </section>
  )
}

export default AspiranteDocumentosPage

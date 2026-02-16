import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { uploadDocument } from '../../../../api/documentUploadService'
import { getTiposDocumentoIdentificacion } from '../../../../api/tipoDocumentoIdentificacionService'
import type { TipoDocumentoIdentificacionDto } from '../../../../api/tipoDocumentoIdentificacionTypes'
import { DocumentUploadCard } from '../../../../components'
import { fileToBase64 } from '../../../../utils/fileToBase64'
import { sha256Hex } from '../../../../utils/sha256'
import { createAspirante } from '../../api/aspiranteService'
import type {
  AspiranteCreateRequestDto,
  AspiranteCreateResponseDto,
} from '../../api/aspiranteCreateTypes'
import {
  mapTramiteDocsToDocumentUploadItems,
} from '../../api/tramiteDocumentoMappers'
import { getTramiteDocumentos } from '../../api/tramiteDocumentoService'
import type { DocumentUploadItem } from '../../../documentos/types/documentUploadTypes'
import { admisionAspiranteDocumentTemplate } from '../../../documentos/templates/admisionAspiranteDocumentTemplate'
import './CreateAspiranteModal.css'

interface CreateAspiranteModalProps {
  open: boolean
  onClose: () => void
  programaId: number | null
  onCreated?: (result: CreateAspiranteResult) => void
}

type FormErrors = Partial<Record<keyof AspiranteCreateRequestDto, string>> & {
  general?: string
  documentos?: string
}

interface UploadErrorItem {
  id: number
  nombre: string
  errorMessage: string
}

interface UploadSummary {
  status: 'idle' | 'success' | 'partial'
  failedItems: UploadErrorItem[]
}

interface CreateAspiranteResult {
  created: AspiranteCreateResponseDto
  uploadSummary: UploadSummary
}

interface FormState {
  nombre: string
  tipoDocumentoIdentificacionId: string
  numeroDocumento: string
  emailPersonal: string
  telefono: string
  numeroInscripcionUis: string
  observaciones: string
}

const initialFormState: FormState = {
  nombre: '',
  tipoDocumentoIdentificacionId: '',
  numeroDocumento: '',
  emailPersonal: '',
  telefono: '',
  numeroInscripcionUis: '',
  observaciones: '',
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const digitsRegex = /^\d+$/

export const CreateAspiranteModal = ({
  open,
  onClose,
  programaId,
  onCreated,
}: CreateAspiranteModalProps) => {
  const [formState, setFormState] = useState<FormState>(initialFormState)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumentoIdentificacionDto[]>([])
  const [tiposLoading, setTiposLoading] = useState(false)
  const [tiposError, setTiposError] = useState<string | null>(null)
  const [documentos, setDocumentos] = useState<DocumentUploadItem[]>([])
  const [isLoadingDocs, setIsLoadingDocs] = useState(false)
  const [docsError, setDocsError] = useState<string | null>(null)
  const [uploadSummary, setUploadSummary] = useState<UploadSummary>({
    status: 'idle',
    failedItems: [],
  })
  const [createdAspirante, setCreatedAspirante] = useState<AspiranteCreateResponseDto | null>(
    null,
  )
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profilePreviewUrl, setProfilePreviewUrl] = useState<string | null>(null)
  const nameInputRef = useRef<HTMLInputElement | null>(null)

  const buildTemplateFallbackDocumentItems = useCallback((): DocumentUploadItem[] => {
    return admisionAspiranteDocumentTemplate.map((item) => ({
      id: item.idTipoDocumentoTramite,
      codigo: item.codigoTipoDocumentoTramite,
      nombre: item.nombreTipoDocumentoTramite,
      descripcion: item.descripcionTipoDocumentoTramite ?? null,
      obligatorio: item.obligatorioTipoDocumentoTramite,
      status: 'NOT_SELECTED',
      selectedFile: null,
    }))
  }, [])

  const loadTramiteDocumentos = useCallback(async () => {
    setIsLoadingDocs(true)
    setDocsError(null)

    try {
      const docs = await getTramiteDocumentos()
      const mappedDocs = mapTramiteDocsToDocumentUploadItems(docs)
      setDocumentos(mappedDocs)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'No fue posible cargar los documentos de admisiones.'
      setDocsError(message)

      if (import.meta.env.DEV) {
        setDocumentos(buildTemplateFallbackDocumentItems())
      } else {
        setDocumentos([])
      }
    } finally {
      setIsLoadingDocs(false)
    }
  }, [buildTemplateFallbackDocumentItems])

  const resetForm = useCallback(() => {
    setFormState(initialFormState)
    setErrors({})
    setIsSubmitting(false)
    setUploadSummary({ status: 'idle', failedItems: [] })
    setCreatedAspirante(null)
    setProfileImage(null)
    setProfilePreviewUrl(null)
    setDocumentos([])
    setIsLoadingDocs(false)
    setDocsError(null)
  }, [])

  const loadTiposDocumento = useCallback(async () => {
    setTiposLoading(true)
    setTiposError(null)

    try {
      const data = await getTiposDocumentoIdentificacion()
      setTiposDocumento(data)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'No fue posible cargar los tipos de documento.'
      setTiposError(message)
    } finally {
      setTiposLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }

    const shouldPreserveState =
      createdAspirante != null && uploadSummary.status === 'partial'

    if (!shouldPreserveState) {
      resetForm()
    } else if (documentos.length === 0 && !isLoadingDocs) {
      loadTramiteDocumentos()
    }

    if (!shouldPreserveState) {
      loadTramiteDocumentos()
    }

    if (tiposDocumento.length === 0 && !tiposLoading) {
      loadTiposDocumento()
    }
  }, [
    open,
    loadTiposDocumento,
    resetForm,
    tiposDocumento.length,
    tiposLoading,
    documentos.length,
    isLoadingDocs,
    loadTramiteDocumentos,
    createdAspirante,
    uploadSummary.status,
  ])

  useEffect(() => {
    if (!open) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    nameInputRef.current?.focus()

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  useEffect(() => {
    if (!profileImage) {
      setProfilePreviewUrl(null)
      return
    }

    const url = URL.createObjectURL(profileImage)
    setProfilePreviewUrl(url)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [profileImage])

  const formTitleId = useMemo(() => 'create-aspirante-title', [])

  const handleChange = (
    field: keyof FormState,
    value: string
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
      general: undefined,
    }))
  }

  const validateForm = (): FormErrors => {
    const nextErrors: FormErrors = {}
    const isAspiranteCreated = createdAspirante != null

    if (!isAspiranteCreated && !formState.nombre.trim()) {
      nextErrors.nombre = 'El nombre es obligatorio.'
    }

    if (!isAspiranteCreated && !formState.tipoDocumentoIdentificacionId) {
      nextErrors.tipoDocumentoIdentificacionId = 'Seleccione un tipo de documento.'
    }

    if (!isAspiranteCreated && !formState.numeroDocumento.trim()) {
      nextErrors.numeroDocumento = 'El número de documento es obligatorio.'
    } else if (!isAspiranteCreated && !digitsRegex.test(formState.numeroDocumento.trim())) {
      nextErrors.numeroDocumento = 'Solo se permiten dígitos.'
    }

    if (!isAspiranteCreated && !formState.emailPersonal.trim()) {
      nextErrors.emailPersonal = 'El email es obligatorio.'
    } else if (!isAspiranteCreated && !emailRegex.test(formState.emailPersonal.trim())) {
      nextErrors.emailPersonal = 'Ingrese un email válido.'
    }

    if (!isAspiranteCreated && !formState.numeroInscripcionUis.trim()) {
      nextErrors.numeroInscripcionUis = 'El número de inscripción es obligatorio.'
    } else if (
      !isAspiranteCreated &&
      !digitsRegex.test(formState.numeroInscripcionUis.trim())
    ) {
      nextErrors.numeroInscripcionUis = 'Solo se permiten dígitos.'
    }

    if (!programaId && !isAspiranteCreated) {
      nextErrors.general = 'No se pudo determinar el programa de la convocatoria.'
    }

    const missingDocument = documentos.find(
      (item) => item.obligatorio && !item.selectedFile && !item.uploadedFileName,
    )

    if (missingDocument) {
      nextErrors.documentos = 'Adjunte todos los documentos requeridos.'
    }

    return nextErrors
  }

  const handleSelectFile = useCallback((id: number, file: File | null) => {
    setDocumentos((prev) =>
      prev.map((item) => {
        if (item.id !== id) {
          return item
        }

        if (!file) {
          return {
            ...item,
            selectedFile: null,
            status: item.uploadedFileName ? 'UPLOADED' : 'NOT_SELECTED',
            errorMessage: undefined,
          }
        }

        return {
          ...item,
          selectedFile: file,
          status: 'READY_TO_UPLOAD',
          errorMessage: undefined,
        }
      }),
    )
    setErrors((prev) => ({ ...prev, documentos: undefined }))
  }, [])

  const handleRemoveFile = useCallback((id: number) => {
    handleSelectFile(id, null)
  }, [handleSelectFile])

  const uploadSelectedDocuments = useCallback(
    async (
      aspiranteId: number,
      tramiteId: number,
      mode: 'all' | 'failed'
    ): Promise<UploadErrorItem[]> => {
      const itemsToUpload = documentos.filter((item) => {
        if (!item.selectedFile) {
          return false
        }

        if (mode === 'failed') {
          return item.status === 'ERROR'
        }

        return item.status !== 'UPLOADING'
      })

      const failedItems: UploadErrorItem[] = []

      for (const item of itemsToUpload) {
        const file = item.selectedFile
        if (!file) {
          continue
        }

        setDocumentos((prev) =>
          prev.map((current) =>
            current.id === item.id
              ? { ...current, status: 'UPLOADING', errorMessage: undefined }
              : current,
          ),
        )

        try {
          const buffer = await file.arrayBuffer()
          const contenidoBase64 = await fileToBase64(file)
          const checksum = await sha256Hex(buffer)

          const uploaded = await uploadDocument({
            tipoDocumentoTramiteId: item.id,
            nombreArchivo: file.name,
            tramiteId,
            usuarioCargaId: null,
            aspiranteCargaId: aspiranteId,
            contenidoBase64,
            mimeType: file.type || 'application/octet-stream',
            tamanoBytes: file.size,
            checksum,
          })

          setDocumentos((prev) =>
            prev.map((current) =>
              current.id === item.id
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
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error desconocido'
          failedItems.push({ id: item.id, nombre: item.nombre, errorMessage: message })
          setDocumentos((prev) =>
            prev.map((current) =>
              current.id === item.id
                ? { ...current, status: 'ERROR', errorMessage: message }
                : current,
            ),
          )
        }
      }

      return failedItems
    },
    [documentos],
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      if (validationErrors.documentos) {
        setDocumentos((prev) =>
          prev.map((item) => {
            if (item.obligatorio && !item.selectedFile && !item.uploadedFileName) {
              return {
                ...item,
                errorMessage: 'Documento obligatorio pendiente.',
              }
            }

            return item
          }),
        )
      }
      return
    }

    if (!programaId && !createdAspirante) {
      return
    }

    setIsSubmitting(true)
    setUploadSummary({ status: 'idle', failedItems: [] })
    setErrors((prev) => ({ ...prev, general: undefined }))

    try {
      let created = createdAspirante

      if (!created) {
        const payload: AspiranteCreateRequestDto = {
          nombre: formState.nombre.trim(),
          tipoDocumentoIdentificacionId: Number(formState.tipoDocumentoIdentificacionId),
          numeroDocumento: formState.numeroDocumento.trim(),
          emailPersonal: formState.emailPersonal.trim(),
          numeroInscripcionUis: formState.numeroInscripcionUis.trim(),
          telefono: formState.telefono.trim() || null,
          observaciones: formState.observaciones.trim() || null,
          programaId: programaId ?? 0,
        }

        created = await createAspirante(payload)
        setCreatedAspirante(created)
      }

      const failedItems = await uploadSelectedDocuments(
        created.id,
        created.inscripcionAdmisionId,
        'all',
      )

      const summary: UploadSummary = {
        status: failedItems.length === 0 ? 'success' : 'partial',
        failedItems,
      }

      setUploadSummary(summary)
      onCreated?.({ created, uploadSummary: summary })

      if (failedItems.length === 0) {
        onClose()
        resetForm()
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No fue posible crear el aspirante.'
      setErrors((prev) => ({ ...prev, general: message }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRetryFailed = useCallback(async () => {
    if (!createdAspirante) {
      return
    }

    setIsSubmitting(true)
    try {
      const failedItems = await uploadSelectedDocuments(
        createdAspirante.id,
        createdAspirante.inscripcionAdmisionId,
        'failed',
      )

      const summary: UploadSummary = {
        status: failedItems.length === 0 ? 'success' : 'partial',
        failedItems,
      }
      setUploadSummary(summary)
      onCreated?.({ created: createdAspirante, uploadSummary: summary })

      if (failedItems.length === 0) {
        onClose()
        resetForm()
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [createdAspirante, onClose, onCreated, resetForm, uploadSelectedDocuments])

  const isAspiranteCreated = createdAspirante != null
  const hasUploadErrors = uploadSummary.failedItems.length > 0
  const isDocsEmptyState = !isLoadingDocs && !docsError && documentos.length === 0

  if (!open) {
    return null
  }

  return (
    <div className="create-aspirante-modal" role="presentation">
      <div
        className="create-aspirante-modal__backdrop"
        role="button"
        tabIndex={0}
        aria-label="Cerrar"
        onClick={onClose}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            onClose()
          }
        }}
      />
      <div
        className="create-aspirante-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={formTitleId}
      >
        <header className="create-aspirante-modal__header">
          <h2 id={formTitleId}>Crear aspirante</h2>
          <p>Complete la información para registrar el aspirante en el programa.</p>
        </header>

        <form className="create-aspirante-modal__form" onSubmit={handleSubmit}>
          <h3 className="create-aspirante-modal__section-title create-aspirante-modal__field--full">
            Datos del aspirante
          </h3>
          {isAspiranteCreated ? (
            <p className="create-aspirante-modal__status create-aspirante-modal__field--full">
              Aspirante creado. Puede cargar o reintentar documentos pendientes.
            </p>
          ) : null}
          <label className="create-aspirante-modal__field">
            <span>Nombre</span>
            <input
              ref={nameInputRef}
              type="text"
              placeholder="Nombre completo"
              value={formState.nombre}
              onChange={(event) => handleChange('nombre', event.target.value)}
              disabled={isSubmitting || isAspiranteCreated}
            />
            {errors.nombre ? (
              <span className="create-aspirante-modal__error">{errors.nombre}</span>
            ) : null}
          </label>

          <label className="create-aspirante-modal__field">
            <span>Tipo de documento</span>
            <div className="create-aspirante-modal__select">
              <select
                value={formState.tipoDocumentoIdentificacionId}
                onChange={(event) =>
                  handleChange('tipoDocumentoIdentificacionId', event.target.value)
                }
                disabled={isSubmitting || tiposLoading || isAspiranteCreated}
              >
                <option value="">Seleccione una opción</option>
                {tiposDocumento.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.codigoNombre}
                  </option>
                ))}
              </select>
              {tiposLoading ? (
                <span className="create-aspirante-modal__loading">Cargando...</span>
              ) : null}
            </div>
            {tiposError ? (
              <span className="create-aspirante-modal__error">
                {tiposError}{' '}
                <button
                  type="button"
                  className="create-aspirante-modal__link"
                  onClick={loadTiposDocumento}
                  disabled={tiposLoading}
                >
                  Reintentar
                </button>
              </span>
            ) : null}
            {errors.tipoDocumentoIdentificacionId ? (
              <span className="create-aspirante-modal__error">
                {errors.tipoDocumentoIdentificacionId}
              </span>
            ) : null}
          </label>

          <label className="create-aspirante-modal__field">
            <span>Número de documento</span>
            <input
              type="text"
              placeholder="Documento"
              value={formState.numeroDocumento}
              onChange={(event) => handleChange('numeroDocumento', event.target.value)}
              disabled={isSubmitting || isAspiranteCreated}
            />
            {errors.numeroDocumento ? (
              <span className="create-aspirante-modal__error">
                {errors.numeroDocumento}
              </span>
            ) : null}
          </label>

          <label className="create-aspirante-modal__field">
            <span>Email personal</span>
            <input
              type="email"
              placeholder="correo@dominio.com"
              value={formState.emailPersonal}
              onChange={(event) => handleChange('emailPersonal', event.target.value)}
              disabled={isSubmitting || isAspiranteCreated}
            />
            {errors.emailPersonal ? (
              <span className="create-aspirante-modal__error">
                {errors.emailPersonal}
              </span>
            ) : null}
          </label>

          <label className="create-aspirante-modal__field">
            <span>Teléfono</span>
            <input
              type="text"
              placeholder="Opcional"
              value={formState.telefono}
              onChange={(event) => handleChange('telefono', event.target.value)}
              disabled={isSubmitting || isAspiranteCreated}
            />
          </label>

          <label className="create-aspirante-modal__field">
            <span>Número de inscripción UIS</span>
            <input
              type="text"
              placeholder="Ej: 202600015"
              value={formState.numeroInscripcionUis}
              onChange={(event) =>
                handleChange('numeroInscripcionUis', event.target.value)
              }
              disabled={isSubmitting || isAspiranteCreated}
            />
            {errors.numeroInscripcionUis ? (
              <span className="create-aspirante-modal__error">
                {errors.numeroInscripcionUis}
              </span>
            ) : null}
          </label>

          <label className="create-aspirante-modal__field create-aspirante-modal__field--full">
            <span>Foto de perfil</span>
            <div className="create-aspirante-modal__upload">
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null
                  setProfileImage(file)
                }}
                disabled={isSubmitting || isAspiranteCreated}
              />
              {profilePreviewUrl ? (
                <img
                  className="create-aspirante-modal__preview"
                  src={profilePreviewUrl}
                  alt="Vista previa del perfil"
                />
              ) : (
                <span className="create-aspirante-modal__helper">
                  Seleccione una imagen para previsualizar.
                </span>
              )}
            </div>
          </label>

          <div className="create-aspirante-modal__field create-aspirante-modal__field--full">
            <h3 className="create-aspirante-modal__section-title">Documentos</h3>
            <p className="create-aspirante-modal__helper">
              Adjunte los requisitos antes de enviar. Los obligatorios deben estar cargados.
            </p>
            <div className="create-aspirante-modal__documents">
              {isLoadingDocs ? (
                <p className="create-aspirante-modal__helper">Cargando documentos…</p>
              ) : docsError ? (
                <div className="create-aspirante-modal__docs-state">
                  <p className="create-aspirante-modal__error">{docsError}</p>
                  <button
                    type="button"
                    className="create-aspirante-modal__button create-aspirante-modal__button--ghost"
                    onClick={loadTramiteDocumentos}
                    disabled={isLoadingDocs || isSubmitting}
                  >
                    Reintentar
                  </button>
                </div>
              ) : documentos.length === 0 ? (
                <p className="create-aspirante-modal__helper">
                  No hay documentos configurados para ADMISION_COORDINACION.
                </p>
              ) : (
                documentos.map((item) => (
                  <DocumentUploadCard
                    key={item.id}
                    item={item}
                    onSelectFile={handleSelectFile}
                    onRemoveFile={handleRemoveFile}
                    disabled={isSubmitting}
                  />
                ))
              )}
            </div>
            {errors.documentos ? (
              <span className="create-aspirante-modal__error">{errors.documentos}</span>
            ) : null}
            {isDocsEmptyState ? (
              <span className="create-aspirante-modal__error">
                No es posible finalizar porque no hay documentos del trámite configurados.
              </span>
            ) : null}
          </div>

          <label className="create-aspirante-modal__field create-aspirante-modal__field--full">
            <span>Observaciones</span>
            <textarea
              placeholder="Notas adicionales"
              value={formState.observaciones}
              onChange={(event) => handleChange('observaciones', event.target.value)}
              disabled={isSubmitting || isAspiranteCreated}
              rows={3}
            />
          </label>

          {uploadSummary.status === 'partial' ? (
            <div className="create-aspirante-modal__summary create-aspirante-modal__field--full">
              <p className="create-aspirante-modal__summary-title">
                Aspirante creado. Falló la carga de {uploadSummary.failedItems.length}{' '}
                documento(s).
              </p>
              <ul className="create-aspirante-modal__summary-list">
                {uploadSummary.failedItems.map((item) => (
                  <li key={item.id}>
                    <strong>{item.nombre}:</strong> {item.errorMessage}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {errors.general ? (
            <p className="create-aspirante-modal__error create-aspirante-modal__error--general">
              {errors.general}
            </p>
          ) : null}

          <footer className="create-aspirante-modal__actions">
            <button
              type="button"
              className="create-aspirante-modal__button create-aspirante-modal__button--ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            {hasUploadErrors ? (
              <button
                type="button"
                className="create-aspirante-modal__button create-aspirante-modal__button--ghost"
                onClick={handleRetryFailed}
                disabled={isSubmitting}
              >
                Reintentar fallidos
              </button>
            ) : null}
            <button
              type="submit"
              className="create-aspirante-modal__button"
              disabled={
                isSubmitting ||
                isLoadingDocs ||
                (!programaId && !isAspiranteCreated) ||
                (!!docsError && !import.meta.env.DEV) ||
                isDocsEmptyState
              }
            >
              {isSubmitting
                ? isAspiranteCreated
                  ? 'Cargando documentos…'
                  : 'Creando…'
                : isAspiranteCreated
                  ? 'Cargar documentos'
                  : 'Crear aspirante y cargar documentos'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}

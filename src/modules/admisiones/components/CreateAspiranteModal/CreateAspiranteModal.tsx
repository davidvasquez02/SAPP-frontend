import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { getTiposDocumentoIdentificacion } from '../../../../api/tipoDocumentoIdentificacionService'
import type { TipoDocumentoIdentificacionDto } from '../../../../api/tipoDocumentoIdentificacionTypes'
import type {
  AspiranteCreateRequestDto,
  AspiranteCreateResponseDto,
} from '../../api/aspiranteCreateTypes'
import { getTramiteDocumentosAdmision } from '../../api/tramiteDocumentoService'
import type { TramiteDocumentoDto } from '../../api/tramiteDocumentoTypes'
import './CreateAspiranteModal.css'

interface CreateAspiranteModalProps {
  open: boolean
  onClose: () => void
  programaId: number | null
  onCreated?: (created: AspiranteCreateResponseDto | null) => void
}

type FormErrors = Partial<Record<keyof AspiranteCreateRequestDto, string>> & {
  general?: string
  documentos?: string
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
  const [documentos, setDocumentos] = useState<TramiteDocumentoDto[]>([])
  const [documentosLoading, setDocumentosLoading] = useState(false)
  const [documentosError, setDocumentosError] = useState<string | null>(null)
  const [documentFiles, setDocumentFiles] = useState<Record<number, File | null>>({})
  const [documentSelections, setDocumentSelections] = useState<Record<number, boolean>>({})
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profilePreviewUrl, setProfilePreviewUrl] = useState<string | null>(null)
  const nameInputRef = useRef<HTMLInputElement | null>(null)

  const resetForm = useCallback(() => {
    setFormState(initialFormState)
    setErrors({})
    setIsSubmitting(false)
    setProfileImage(null)
    setProfilePreviewUrl(null)
    setDocumentFiles({})
    setDocumentSelections({})
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

  const initializeDocumentSelections = useCallback((items: TramiteDocumentoDto[]) => {
    setDocumentSelections((prev) => {
      const next: Record<number, boolean> = { ...prev }

      items.forEach((item) => {
        if (item.obligatorio) {
          next[item.id] = true
        } else if (next[item.id] === undefined) {
          next[item.id] = false
        }
      })

      return next
    })
  }, [])

  const loadDocumentos = useCallback(async () => {
    setDocumentosLoading(true)
    setDocumentosError(null)

    try {
      const data = await getTramiteDocumentosAdmision()
      setDocumentos(data)
      initializeDocumentSelections(data)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'No fue posible cargar los documentos requeridos.'
      setDocumentosError(message)
    } finally {
      setDocumentosLoading(false)
    }
  }, [initializeDocumentSelections])

  useEffect(() => {
    if (!open) {
      return
    }

    resetForm()

    if (tiposDocumento.length === 0 && !tiposLoading) {
      loadTiposDocumento()
    }

    if (documentos.length === 0 && !documentosLoading) {
      loadDocumentos()
    }
  }, [
    open,
    loadTiposDocumento,
    loadDocumentos,
    resetForm,
    tiposDocumento.length,
    tiposLoading,
    documentos.length,
    documentosLoading,
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

    if (!formState.nombre.trim()) {
      nextErrors.nombre = 'El nombre es obligatorio.'
    }

    if (!formState.tipoDocumentoIdentificacionId) {
      nextErrors.tipoDocumentoIdentificacionId = 'Seleccione un tipo de documento.'
    }

    if (!formState.numeroDocumento.trim()) {
      nextErrors.numeroDocumento = 'El número de documento es obligatorio.'
    } else if (!digitsRegex.test(formState.numeroDocumento.trim())) {
      nextErrors.numeroDocumento = 'Solo se permiten dígitos.'
    }

    if (!formState.emailPersonal.trim()) {
      nextErrors.emailPersonal = 'El email es obligatorio.'
    } else if (!emailRegex.test(formState.emailPersonal.trim())) {
      nextErrors.emailPersonal = 'Ingrese un email válido.'
    }

    if (!formState.numeroInscripcionUis.trim()) {
      nextErrors.numeroInscripcionUis = 'El número de inscripción es obligatorio.'
    } else if (!digitsRegex.test(formState.numeroInscripcionUis.trim())) {
      nextErrors.numeroInscripcionUis = 'Solo se permiten dígitos.'
    }

    if (!programaId) {
      nextErrors.general = 'No se pudo determinar el programa de la convocatoria.'
    }

    const missingDocument = documentos.find(
      (item) =>
        item.obligatorio &&
        (!documentSelections[item.id] || !documentFiles[item.id])
    )

    if (missingDocument) {
      nextErrors.documentos = 'Adjunte los documentos obligatorios.'
    }

    return nextErrors
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    if (!programaId) {
      return
    }

    setIsSubmitting(true)

    const payload: AspiranteCreateRequestDto = {
      nombre: formState.nombre.trim(),
      tipoDocumentoIdentificacionId: Number(formState.tipoDocumentoIdentificacionId),
      numeroDocumento: formState.numeroDocumento.trim(),
      emailPersonal: formState.emailPersonal.trim(),
      numeroInscripcionUis: formState.numeroInscripcionUis.trim(),
      telefono: formState.telefono.trim() || null,
      observaciones: formState.observaciones.trim() || null,
      programaId,
    }

    const documentosPayload = documentos.map((item) => ({
      id: item.id,
      codigo: item.codigo,
      nombre: item.nombre,
      obligatorio: item.obligatorio,
      seleccionado: Boolean(documentSelections[item.id]),
      archivoNombre: documentFiles[item.id]?.name ?? null,
      archivoTamano: documentFiles[item.id]?.size ?? null,
    }))

    const profilePayload = profileImage
      ? { name: profileImage.name, size: profileImage.size, type: profileImage.type }
      : null

    console.log('Mock crear aspirante', {
      payload,
      perfil: profilePayload,
      documentos: documentosPayload,
    })

    onCreated?.(null)
    onClose()
    setIsSubmitting(false)
  }

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
          <label className="create-aspirante-modal__field">
            <span>Nombre</span>
            <input
              ref={nameInputRef}
              type="text"
              placeholder="Nombre completo"
              value={formState.nombre}
              onChange={(event) => handleChange('nombre', event.target.value)}
              disabled={isSubmitting}
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
                disabled={isSubmitting || tiposLoading}
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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
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
                disabled={isSubmitting}
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
            <span>Documentos requeridos</span>
            {documentosLoading ? (
              <p className="create-aspirante-modal__helper">Cargando documentos...</p>
            ) : null}
            {documentosError ? (
              <p className="create-aspirante-modal__error">
                {documentosError}{' '}
                <button
                  type="button"
                  className="create-aspirante-modal__link"
                  onClick={loadDocumentos}
                  disabled={documentosLoading}
                >
                  Reintentar
                </button>
              </p>
            ) : null}
            {!documentosLoading && !documentosError ? (
              <div className="create-aspirante-modal__documents">
                {documentos.length === 0 ? (
                  <p className="create-aspirante-modal__helper">
                    No hay documentos configurados para este trámite.
                  </p>
                ) : (
                  documentos.map((item) => (
                    <div key={item.id} className="create-aspirante-modal__document">
                      <div className="create-aspirante-modal__document-info">
                        <label>
                          <input
                            type="checkbox"
                            checked={Boolean(documentSelections[item.id])}
                            disabled={item.obligatorio || isSubmitting}
                            onChange={(event) => {
                              const checked = event.target.checked
                              setDocumentSelections((prev) => ({
                                ...prev,
                                [item.id]: checked,
                              }))
                              if (!checked) {
                                setDocumentFiles((prev) => ({
                                  ...prev,
                                  [item.id]: null,
                                }))
                              }
                            }}
                          />
                          <span>{item.nombre}</span>
                        </label>
                        <p>{item.descripcion}</p>
                        {item.obligatorio ? (
                          <span className="create-aspirante-modal__badge">
                            Obligatorio
                          </span>
                        ) : null}
                      </div>
                      <div className="create-aspirante-modal__document-upload">
                        <input
                          type="file"
                          disabled={!documentSelections[item.id] || isSubmitting}
                          onChange={(event) => {
                            const file = event.target.files?.[0] ?? null
                            setDocumentFiles((prev) => ({
                              ...prev,
                              [item.id]: file,
                            }))
                          }}
                        />
                        {documentFiles[item.id] ? (
                          <span className="create-aspirante-modal__helper">
                            {documentFiles[item.id]?.name}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : null}
            {errors.documentos ? (
              <span className="create-aspirante-modal__error">{errors.documentos}</span>
            ) : null}
          </div>

          <label className="create-aspirante-modal__field create-aspirante-modal__field--full">
            <span>Observaciones</span>
            <textarea
              placeholder="Notas adicionales"
              value={formState.observaciones}
              onChange={(event) => handleChange('observaciones', event.target.value)}
              disabled={isSubmitting}
              rows={3}
            />
          </label>

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
            <button
              type="submit"
              className="create-aspirante-modal__button"
              disabled={isSubmitting || !programaId}
            >
              {isSubmitting ? 'Creando…' : 'Crear'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}

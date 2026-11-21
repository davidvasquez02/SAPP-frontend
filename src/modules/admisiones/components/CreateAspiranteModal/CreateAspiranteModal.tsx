import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { getTiposDocumentoIdentificacion } from '../../../../api/tipoDocumentoIdentificacionService'
import type { TipoDocumentoIdentificacionDto } from '../../../../api/tipoDocumentoIdentificacionTypes'
import { createAspirante } from '../../api/aspiranteService'
import type {
  AspiranteCreateRequestDto,
  AspiranteCreateResponseDto,
} from '../../api/aspiranteCreateTypes'
import './CreateAspiranteModal.css'

interface CreateAspiranteModalProps {
  open: boolean
  onClose: () => void
  programaId: number | null
  convocatoriaAdmisionId: number | null
  onCreated?: (created: AspiranteCreateResponseDto) => void
}

type FormErrors = Partial<Record<keyof AspiranteCreateRequestDto, string>> & {
  general?: string
}

interface FormState {
  nombre1: string
  nombre2: string
  apellido1: string
  apellido2: string
  tipoDocumentoIdentificacionId: string
  numeroDocumento: string
  emailPersonal: string
  telefono: string
  numeroInscripcionUis: string
}

const initialFormState: FormState = {
  nombre1: '',
  nombre2: '',
  apellido1: '',
  apellido2: '',
  tipoDocumentoIdentificacionId: '',
  numeroDocumento: '',
  emailPersonal: '',
  telefono: '',
  numeroInscripcionUis: '',
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const digitsRegex = /^\d+$/

/**
 * Crea un aspirante. Solo eso: los documentos del aspirante ya no se cargan aqui, los sube el propio aspirante
 * (o el coordinador despues, desde su inscripcion).
 */
export const CreateAspiranteModal = ({
  open,
  onClose,
  programaId,
  convocatoriaAdmisionId,
  onCreated,
}: CreateAspiranteModalProps) => {
  const [formState, setFormState] = useState<FormState>(initialFormState)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumentoIdentificacionDto[]>([])
  const [tiposLoading, setTiposLoading] = useState(false)
  const [tiposError, setTiposError] = useState<string | null>(null)
  const firstNameInputRef = useRef<HTMLInputElement | null>(null)
  const wasOpenRef = useRef(false)

  const resetForm = useCallback(() => {
    setFormState(initialFormState)
    setErrors({})
    setIsSubmitting(false)
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
      wasOpenRef.current = false
      return
    }

    if (wasOpenRef.current) {
      return
    }

    wasOpenRef.current = true
    resetForm()

    if (tiposDocumento.length === 0 && !tiposLoading) {
      loadTiposDocumento()
    }
  }, [open, loadTiposDocumento, resetForm, tiposDocumento.length, tiposLoading])

  useEffect(() => {
    if (!open) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    firstNameInputRef.current?.focus()

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSubmitting, open, onClose])

  const formTitleId = useMemo(() => 'create-aspirante-title', [])

  const handleChange = (field: keyof FormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
      general: undefined,
    }))
  }

  const validateForm = (): FormErrors => {
    const nextErrors: FormErrors = {}

    if (!formState.nombre1.trim()) {
      nextErrors.nombre1 = 'El primer nombre es obligatorio.'
    }

    if (!formState.apellido1.trim()) {
      nextErrors.apellido1 = 'El primer apellido es obligatorio.'
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

    if (!convocatoriaAdmisionId) {
      nextErrors.general = 'No se pudo determinar la convocatoria desde la URL.'
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

    if (!programaId || !convocatoriaAdmisionId) {
      return
    }

    setIsSubmitting(true)
    setErrors((prev) => ({ ...prev, general: undefined }))

    try {
      const payload: AspiranteCreateRequestDto = {
        nombre1: formState.nombre1.trim(),
        nombre2: formState.nombre2.trim() || null,
        apellido1: formState.apellido1.trim(),
        apellido2: formState.apellido2.trim() || null,
        tipoDocumentoIdentificacionId: Number(formState.tipoDocumentoIdentificacionId),
        numeroDocumento: formState.numeroDocumento.trim(),
        emailPersonal: formState.emailPersonal.trim(),
        numeroInscripcionUis: formState.numeroInscripcionUis.trim(),
        telefono: formState.telefono.trim() || null,
        observaciones: null,
        programaId,
        convocatoriaAdmisionId,
      }

      const created = await createAspirante(payload)
      onCreated?.(created)
      onClose()
      resetForm()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No fue posible crear el aspirante.'
      setErrors((prev) => ({ ...prev, general: message }))
      // Keep the dialog and entered values visible. In particular, an HTTP 401/403
      // must not turn a recoverable create error into an unexpected navigation.
      requestAnimationFrame(() => {
        document.querySelector('.create-aspirante-modal__error--general')?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open) {
    return null
  }

  return (
    <div className="create-aspirante-modal" role="presentation">
      <div
        className="create-aspirante-modal__backdrop"
        role="presentation"
        aria-hidden="true"
        onClick={() => {
          if (!isSubmitting) onClose()
        }}
      />
      {isSubmitting ? (
        <div className="create-aspirante-modal__progress" role="status" aria-live="polite">
          <span className="create-aspirante-modal__spinner" aria-hidden="true" />
          <strong>Creando aspirante…</strong>
          <span>Espere mientras finaliza el proceso.</span>
        </div>
      ) : null}
      <div
        className="create-aspirante-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={formTitleId}
      >
        <header className="create-aspirante-modal__header">
          <h2 id={formTitleId}>Crear aspirante</h2>
        </header>

        <form className="create-aspirante-modal__form" onSubmit={handleSubmit} autoComplete="off">
          <h3 className="create-aspirante-modal__section-title create-aspirante-modal__field--full">
            Datos del aspirante
          </h3>
          <label className="create-aspirante-modal__field">
            <span>Primer nombre</span>
            <input
              ref={firstNameInputRef}
              type="text"
              placeholder="Primer nombre"
              autoComplete="off"
              value={formState.nombre1}
              onChange={(event) => handleChange('nombre1', event.target.value)}
              disabled={isSubmitting}
            />
            {errors.nombre1 ? (
              <span className="create-aspirante-modal__error">{errors.nombre1}</span>
            ) : null}
          </label>

          <label className="create-aspirante-modal__field">
            <span>Segundo nombre <small>(opcional)</small></span>
            <input
              type="text"
              placeholder="Segundo nombre"
              autoComplete="off"
              value={formState.nombre2}
              onChange={(event) => handleChange('nombre2', event.target.value)}
              disabled={isSubmitting}
            />
          </label>

          <label className="create-aspirante-modal__field">
            <span>Primer apellido</span>
            <input
              type="text"
              placeholder="Primer apellido"
              autoComplete="off"
              value={formState.apellido1}
              onChange={(event) => handleChange('apellido1', event.target.value)}
              disabled={isSubmitting}
            />
            {errors.apellido1 ? (
              <span className="create-aspirante-modal__error">{errors.apellido1}</span>
            ) : null}
          </label>

          <label className="create-aspirante-modal__field">
            <span>Segundo apellido <small>(opcional)</small></span>
            <input
              type="text"
              placeholder="Segundo apellido"
              autoComplete="off"
              value={formState.apellido2}
              onChange={(event) => handleChange('apellido2', event.target.value)}
              disabled={isSubmitting}
            />
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
              autoComplete="off"
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
              autoComplete="off"
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
              autoComplete="off"
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
              autoComplete="off"
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

          {errors.general ? (
            <p
              className="create-aspirante-modal__error create-aspirante-modal__error--general"
              role="alert"
              aria-live="assertive"
            >
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
              disabled={isSubmitting || !programaId || !convocatoriaAdmisionId}
            >
              {isSubmitting ? 'Creando…' : 'Crear aspirante'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}

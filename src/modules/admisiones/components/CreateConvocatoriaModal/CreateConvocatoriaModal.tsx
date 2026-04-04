import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type {
  ConvocatoriaAdmisionDto,
  CreateConvocatoriaRequest,
} from '../../api/convocatoriaAdmisionTypes'
import './CreateConvocatoriaModal.css'

type ProgramaOption = {
  programaId: number
  programa: string
}

type CreateConvocatoriaModalProps = {
  open: boolean
  convocatorias: ConvocatoriaAdmisionDto[]
  onClose: () => void
  onSubmit: (request: CreateConvocatoriaRequest) => Promise<void>
}

type FormState = {
  programaId: string
  cupos: string
  fechaInicio: string
  fechaFin: string
  observaciones: string
}

type FormErrors = Partial<Record<keyof FormState, string>> & { general?: string }

const initialFormState: FormState = {
  programaId: '',
  cupos: '1',
  fechaInicio: '',
  fechaFin: '',
  observaciones: '',
}

export const CreateConvocatoriaModal = ({
  open,
  convocatorias,
  onClose,
  onSubmit,
}: CreateConvocatoriaModalProps) => {
  const [formState, setFormState] = useState<FormState>(initialFormState)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const programas = useMemo<ProgramaOption[]>(() => {
    const grouped = new Map<number, string>()

    convocatorias.forEach((convocatoria) => {
      if (!grouped.has(convocatoria.programaId)) {
        grouped.set(convocatoria.programaId, convocatoria.programa)
      }
    })

    return Array.from(grouped.entries())
      .map(([programaId, programa]) => ({ programaId, programa }))
      .sort((a, b) => a.programa.localeCompare(b.programa, 'es'))
  }, [convocatorias])

  useEffect(() => {
    if (!open) {
      return
    }

    setFormState((prev) => ({
      ...initialFormState,
      programaId: prev.programaId || (programas[0] ? String(programas[0].programaId) : ''),
    }))
    setErrors({})
    setIsSubmitting(false)
  }, [open, programas])

  useEffect(() => {
    if (!open) {
      return
    }

    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose()
      }
    }

    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [isSubmitting, onClose, open])

  if (!open) {
    return null
  }

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {}
    const cupos = Number(formState.cupos)

    if (!formState.programaId) {
      nextErrors.programaId = 'Seleccione un programa.'
    }

    if (!Number.isFinite(cupos) || cupos <= 0) {
      nextErrors.cupos = 'Los cupos deben ser mayores a 0.'
    }

    if (!formState.fechaInicio) {
      nextErrors.fechaInicio = 'La fecha de inicio es obligatoria.'
    }

    if (!formState.fechaFin) {
      nextErrors.fechaFin = 'La fecha de fin es obligatoria.'
    }

    if (formState.fechaInicio && formState.fechaFin && formState.fechaFin < formState.fechaInicio) {
      nextErrors.fechaFin = 'La fecha de fin no puede ser menor a la fecha de inicio.'
    }

    return nextErrors
  }

  const handleField = (field: keyof FormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const formErrors = validate()

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      return
    }

    try {
      setIsSubmitting(true)
      await onSubmit({
        programaId: Number(formState.programaId),
        cupos: Number(formState.cupos),
        fechaInicio: formState.fechaInicio,
        fechaFin: formState.fechaFin,
        observaciones: formState.observaciones.trim(),
      })
      onClose()
    } catch (error) {
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : 'No fue posible crear la convocatoria. Inténtelo nuevamente.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="create-convocatoria-modal" role="dialog" aria-modal="true">
      <button
        type="button"
        className="create-convocatoria-modal__backdrop"
        aria-label="Cerrar modal"
        onClick={onClose}
        disabled={isSubmitting}
      />

      <div className="create-convocatoria-modal__dialog">
        <div className="create-convocatoria-modal__header">
          <h2>Nueva convocatoria</h2>
          <p>Complete los datos para registrar una nueva convocatoria de admisión.</p>
        </div>

        <form className="create-convocatoria-modal__form" onSubmit={handleSubmit}>
          <label className="create-convocatoria-modal__field">
            Programa
            <select
              value={formState.programaId}
              onChange={(event) => handleField('programaId', event.target.value)}
              disabled={isSubmitting}
            >
              <option value="">Seleccione...</option>
              {programas.map((programa) => (
                <option key={programa.programaId} value={programa.programaId}>
                  {programa.programa}
                </option>
              ))}
            </select>
            {errors.programaId ? (
              <span className="create-convocatoria-modal__error">{errors.programaId}</span>
            ) : null}
          </label>

          <label className="create-convocatoria-modal__field">
            Cupos
            <input
              type="number"
              min={1}
              value={formState.cupos}
              onChange={(event) => handleField('cupos', event.target.value)}
              disabled={isSubmitting}
            />
            {errors.cupos ? (
              <span className="create-convocatoria-modal__error">{errors.cupos}</span>
            ) : null}
          </label>

          <label className="create-convocatoria-modal__field">
            Fecha inicio
            <input
              type="date"
              value={formState.fechaInicio}
              onChange={(event) => handleField('fechaInicio', event.target.value)}
              disabled={isSubmitting}
            />
            {errors.fechaInicio ? (
              <span className="create-convocatoria-modal__error">{errors.fechaInicio}</span>
            ) : null}
          </label>

          <label className="create-convocatoria-modal__field">
            Fecha fin
            <input
              type="date"
              value={formState.fechaFin}
              onChange={(event) => handleField('fechaFin', event.target.value)}
              disabled={isSubmitting}
            />
            {errors.fechaFin ? (
              <span className="create-convocatoria-modal__error">{errors.fechaFin}</span>
            ) : null}
          </label>

          <label className="create-convocatoria-modal__field create-convocatoria-modal__field--full">
            Observaciones
            <textarea
              rows={3}
              value={formState.observaciones}
              onChange={(event) => handleField('observaciones', event.target.value)}
              disabled={isSubmitting}
              placeholder="Opcional"
            />
          </label>

          {errors.general ? (
            <p className="create-convocatoria-modal__error create-convocatoria-modal__error--general">
              {errors.general}
            </p>
          ) : null}

          <div className="create-convocatoria-modal__actions">
            <button
              type="button"
              className="create-convocatoria-modal__button create-convocatoria-modal__button--ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button type="submit" className="create-convocatoria-modal__button" disabled={isSubmitting}>
              {isSubmitting ? 'Creando...' : 'Crear convocatoria'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { createConvocatoriaAdmision } from '../../api/convocatoriaAdmisionService'
import type {
  ConvocatoriaAdmisionDto,
  CreateConvocatoriaRequest,
} from '../../api/convocatoriaAdmisionTypes'
import type { ProfesorOption } from '../../mock/profesores.mock'
import { assignProfesoresToConvocatoria } from '../../services/convocatoriaProfesoresMockService'
import { ensurePeriodoForAdmision } from '../../services/ensurePeriodoService'
import { fetchProfesores } from '../../services/profesoresMockService'
import './CreateConvocatoriaModal.css'

type ProgramaOption = {
  programaId: number
  programa: string
}

type PendingAssignment = {
  convocatoriaId: number
  profesoresId: number[]
}

type CreateConvocatoriaModalProps = {
  open: boolean
  convocatorias: ConvocatoriaAdmisionDto[]
  onClose: () => void
  onRefreshConvocatorias: () => Promise<ConvocatoriaAdmisionDto[]>
  onSuccess: (message: string) => void
}

type SubmitStep = 'idle' | 'verifying_periodo' | 'creating_periodo' | 'creating_convocatoria' | 'done'

type FormState = {
  programaId: string
  anio: string
  semestre: '1' | '2'
  cupos: string
  fechaInicio: string
  fechaFin: string
  observaciones: string
  profesorId: string
}

type FormErrors = Partial<Record<keyof FormState, string>> & { general?: string; warning?: string }

const nowYear = new Date().getFullYear()

const getDefaultDatesForSemester = (anio: number, semestre: 1 | 2) =>
  semestre === 1
    ? { inicio: `${anio}-01-01`, fin: `${anio}-06-30` }
    : { inicio: `${anio}-07-01`, fin: `${anio}-12-31` }

const initialDates = getDefaultDatesForSemester(nowYear, 1)

const initialFormState: FormState = {
  programaId: '',
  anio: String(nowYear),
  semestre: '1',
  cupos: '1',
  fechaInicio: initialDates.inicio,
  fechaFin: initialDates.fin,
  observaciones: '',
  profesorId: '',
}

export const CreateConvocatoriaModal = ({
  open,
  convocatorias,
  onClose,
  onRefreshConvocatorias,
  onSuccess,
}: CreateConvocatoriaModalProps) => {
  const [formState, setFormState] = useState<FormState>(initialFormState)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)
  const [profesores, setProfesores] = useState<ProfesorOption[]>([])
  const [selectedProfesores, setSelectedProfesores] = useState<ProfesorOption[]>([])
  const [pendingAssignment, setPendingAssignment] = useState<PendingAssignment | null>(null)
  const [datesTouched, setDatesTouched] = useState(false)
  const [submitStep, setSubmitStep] = useState<SubmitStep>('idle')
  const [submitNote, setSubmitNote] = useState<string | null>(null)

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

    let active = true

    const loadOptions = async () => {
      setIsLoadingOptions(true)
      try {
        const profesoresData = await fetchProfesores()

        if (!active) {
          return
        }

        const nextYear = new Date().getFullYear()
        const defaultDates = getDefaultDatesForSemester(nextYear, 1)

        setProfesores(profesoresData)
        setFormState({
          ...initialFormState,
          programaId: programas[0] ? String(programas[0].programaId) : '',
          anio: String(nextYear),
          fechaInicio: defaultDates.inicio,
          fechaFin: defaultDates.fin,
        })
        setSelectedProfesores([])
        setPendingAssignment(null)
        setErrors({})
        setDatesTouched(false)
        setSubmitStep('idle')
        setSubmitNote(null)
      } catch {
        if (!active) {
          return
        }

        setErrors({ general: 'No fue posible cargar el catálogo de profesores.' })
      } finally {
        if (active) {
          setIsLoadingOptions(false)
          setIsSubmitting(false)
        }
      }
    }

    loadOptions()

    return () => {
      active = false
    }
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

  useEffect(() => {
    if (datesTouched) {
      return
    }

    const anio = Number(formState.anio)
    const semestre = formState.semestre === '2' ? 2 : 1
    if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) {
      return
    }

    const defaultDates = getDefaultDatesForSemester(anio, semestre)
    setFormState((prev) => ({ ...prev, fechaInicio: defaultDates.inicio, fechaFin: defaultDates.fin }))
  }, [datesTouched, formState.anio, formState.semestre])

  if (!open) {
    return null
  }

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {}
    const cupos = Number(formState.cupos)
    const anio = Number(formState.anio)

    if (!formState.programaId) {
      nextErrors.programaId = 'Seleccione un programa.'
    }

    if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) {
      nextErrors.anio = 'Ingrese un año válido entre 2000 y 2100.'
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
    setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined, warning: undefined }))
  }

  const handleDateField = (field: 'fechaInicio' | 'fechaFin', value: string) => {
    setDatesTouched(true)
    handleField(field, value)
  }

  const handleAddProfesor = () => {
    const selectedId = Number(formState.profesorId)
    if (!selectedId) {
      return
    }

    const profesor = profesores.find((item) => item.id === selectedId)
    if (!profesor) {
      return
    }

    setSelectedProfesores((prev) => {
      if (prev.some((item) => item.id === profesor.id)) {
        return prev
      }

      return [...prev, profesor]
    })

    setFormState((prev) => ({ ...prev, profesorId: '' }))
  }

  const handleRemoveProfesor = (profesorId: number) => {
    setSelectedProfesores((prev) => prev.filter((item) => item.id !== profesorId))
    setErrors((prev) => ({ ...prev, warning: undefined }))
  }

  const resolveCreatedConvocatoriaId = async (
    request: CreateConvocatoriaRequest,
    created?: ConvocatoriaAdmisionDto | void
  ): Promise<number> => {
    if (created && typeof created === 'object' && 'id' in created && created.id) {
      return created.id
    }

    const updated = await onRefreshConvocatorias()

    const match = updated
      .filter(
        (item) =>
          item.programaId === request.programaId &&
          item.periodoId === request.periodoId &&
          item.fechaInicio.split(' ')[0] === request.fechaInicio &&
          item.fechaFin.split(' ')[0] === request.fechaFin
      )
      .sort((a, b) => b.id - a.id)[0]

    if (!match) {
      throw new Error('Convocatoria creada, pero no se pudo resolver el identificador retornado.')
    }

    return match.id
  }

  const runAssignProfesores = async (convocatoriaId: number, profesoresId: number[]) => {
    await assignProfesoresToConvocatoria({ convocatoriaId, profesoresId })
    setPendingAssignment(null)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (pendingAssignment) {
      try {
        setIsSubmitting(true)
        await runAssignProfesores(pendingAssignment.convocatoriaId, pendingAssignment.profesoresId)
        await onRefreshConvocatorias()
        onSuccess('Convocatoria creada y profesores asignados correctamente (mock).')
        onClose()
      } catch (error) {
        setErrors({
          warning:
            error instanceof Error
              ? `Convocatoria creada, pero no se pudieron asignar profesores. ${error.message}`
              : 'Convocatoria creada, pero no se pudieron asignar profesores.',
        })
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    const formErrors = validate()

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      return
    }

    const anio = Number(formState.anio)
    const semestre = formState.semestre === '2' ? 2 : 1

    try {
      setIsSubmitting(true)
      setSubmitNote(null)
      setSubmitStep('verifying_periodo')

      const ensured = await ensurePeriodoForAdmision({
        anio,
        semestre,
        fechaInicioDefault: formState.fechaInicio,
        fechaFinDefault: formState.fechaFin,
        descripcion: `Fechas admisiones ${anio}-${semestre} (auto)`,
      })

      if (ensured.existed) {
        setSubmitNote(`Se usó el periodo existente ${ensured.label}.`)
      } else {
        setSubmitStep('creating_periodo')
        setSubmitNote(`Se creó el periodo ${ensured.label} y se asociaron fechas para admisiones.`)
      }

      setSubmitStep('creating_convocatoria')

      // TODO: separar fechas del periodo académico de fechas de convocatoria cuando UX lo requiera.
      const payload: CreateConvocatoriaRequest = {
        programaId: Number(formState.programaId),
        periodoId: ensured.periodoId,
        cupos: Number(formState.cupos),
        fechaInicio: formState.fechaInicio,
        fechaFin: formState.fechaFin,
        observaciones: formState.observaciones.trim(),
      }

      const created = await createConvocatoriaAdmision(payload)
      const convocatoriaId = await resolveCreatedConvocatoriaId(payload, created)
      const profesoresId = selectedProfesores.map((profesor) => profesor.id)

      if (profesoresId.length > 0) {
        try {
          await runAssignProfesores(convocatoriaId, profesoresId)
        } catch (error) {
          setPendingAssignment({ convocatoriaId, profesoresId })
          setErrors({
            warning:
              error instanceof Error
                ? `Convocatoria creada, pero no se pudieron asignar profesores. ${error.message}`
                : 'Convocatoria creada, pero no se pudieron asignar profesores.',
          })
          return
        }
      }

      setSubmitStep('done')
      await onRefreshConvocatorias()
      onSuccess(
        profesoresId.length > 0
          ? 'Convocatoria creada y profesores asignados correctamente (mock).'
          : 'Convocatoria creada correctamente.'
      )
      onClose()
    } catch (error) {
      setSubmitStep('idle')
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

  const availableProfesores = profesores.filter(
    (profesor) => !selectedProfesores.some((selected) => selected.id === profesor.id)
  )

  const periodoSeleccionado = `${formState.anio}-${formState.semestre}`

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
              disabled={isSubmitting || isLoadingOptions || Boolean(pendingAssignment)}
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
            Año
            <input
              type="number"
              min={2000}
              max={2100}
              value={formState.anio}
              onChange={(event) => handleField('anio', event.target.value)}
              disabled={isSubmitting || Boolean(pendingAssignment)}
            />
            {errors.anio ? (
              <span className="create-convocatoria-modal__error">{errors.anio}</span>
            ) : null}
          </label>

          <label className="create-convocatoria-modal__field">
            Semestre
            <select
              value={formState.semestre}
              onChange={(event) => handleField('semestre', event.target.value as '1' | '2')}
              disabled={isSubmitting || Boolean(pendingAssignment)}
            >
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
          </label>

          <p className="create-convocatoria-modal__field create-convocatoria-modal__hint-block">
            Período seleccionado: <strong>{periodoSeleccionado}</strong>
          </p>

          <label className="create-convocatoria-modal__field">
            Cupos
            <input
              type="number"
              min={1}
              value={formState.cupos}
              onChange={(event) => handleField('cupos', event.target.value)}
              disabled={isSubmitting || Boolean(pendingAssignment)}
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
              onChange={(event) => handleDateField('fechaInicio', event.target.value)}
              disabled={isSubmitting || Boolean(pendingAssignment)}
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
              onChange={(event) => handleDateField('fechaFin', event.target.value)}
              disabled={isSubmitting || Boolean(pendingAssignment)}
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
              disabled={isSubmitting || Boolean(pendingAssignment)}
              placeholder="Opcional"
            />
          </label>

          <div className="create-convocatoria-modal__field create-convocatoria-modal__field--full">
            <span>Profesores (opcional)</span>
            <div className="create-convocatoria-modal__profesor-picker">
              <select
                value={formState.profesorId}
                onChange={(event) => handleField('profesorId', event.target.value)}
                disabled={isSubmitting || isLoadingOptions || Boolean(pendingAssignment)}
              >
                <option value="">Seleccione profesor...</option>
                {availableProfesores.map((profesor) => (
                  <option key={profesor.id} value={profesor.id}>
                    {profesor.nombre}
                    {profesor.email ? ` (${profesor.email})` : ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="create-convocatoria-modal__button create-convocatoria-modal__button--ghost"
                onClick={handleAddProfesor}
                disabled={!formState.profesorId || isSubmitting || Boolean(pendingAssignment)}
              >
                Agregar
              </button>
            </div>

            <div className="create-convocatoria-modal__chips">
              {selectedProfesores.length === 0 ? (
                <span className="create-convocatoria-modal__hint">Aún no se han agregado profesores.</span>
              ) : (
                selectedProfesores.map((profesor) => (
                  <div key={profesor.id} className="create-convocatoria-modal__chip">
                    <div>
                      <strong>{profesor.nombre}</strong>
                      {profesor.email ? <small>{profesor.email}</small> : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveProfesor(profesor.id)}
                      disabled={isSubmitting || Boolean(pendingAssignment)}
                    >
                      Quitar
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {isSubmitting ? (
            <div className="create-convocatoria-modal__status create-convocatoria-modal__field--full" role="status">
              <p>{submitStep === 'verifying_periodo' ? 'Verificando periodo…' : 'Verificando periodo...'}</p>
              <p>{submitStep === 'creating_periodo' ? 'Creando periodo (si aplica)…' : 'Creando periodo (si aplica)...'}</p>
              <p>{submitStep === 'creating_convocatoria' ? 'Creando convocatoria…' : 'Creando convocatoria...'}</p>
              <p>{submitStep === 'done' ? 'Listo' : 'Listo'}</p>
            </div>
          ) : null}

          {submitNote ? <p className="create-convocatoria-modal__note create-convocatoria-modal__field--full">{submitNote}</p> : null}

          {errors.warning ? (
            <p className="create-convocatoria-modal__warning">{errors.warning}</p>
          ) : null}

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
              {isSubmitting
                ? pendingAssignment
                  ? 'Reintentando...'
                  : 'Creando...'
                : pendingAssignment
                  ? 'Reintentar asignación'
                  : 'Crear convocatoria'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

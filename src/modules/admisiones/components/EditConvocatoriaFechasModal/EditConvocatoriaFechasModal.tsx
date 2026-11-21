import { useEffect, useState, type FormEvent } from 'react'
import { updateConvocatoriaAdmision } from '../../api/convocatoriaAdmisionService'
import type { ConvocatoriaAdmisionDto, UpdateConvocatoriaRequest } from '../../api/convocatoriaAdmisionTypes'
import './EditConvocatoriaFechasModal.css'

interface EditConvocatoriaFechasModalProps {
  convocatoria: ConvocatoriaAdmisionDto | null
  onClose: () => void
  onSuccess: (message: string) => void
}

const toDateInputValue = (value: string) => value.trim().split(/[ T]/)[0] ?? ''

export const EditConvocatoriaFechasModal = ({
  convocatoria,
  onClose,
  onSuccess,
}: EditConvocatoriaFechasModalProps) => {
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [cupos, setCupos] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!convocatoria) return

    setFechaInicio(toDateInputValue(convocatoria.fechaInicio))
    setFechaFin(toDateInputValue(convocatoria.fechaFin))
    setCupos(String(convocatoria.cupos ?? ''))
    setObservaciones(convocatoria.observaciones ?? '')
    setError(null)
  }, [convocatoria])

  if (!convocatoria) return null

  const initialFechaInicio = toDateInputValue(convocatoria.fechaInicio)
  const initialFechaFin = toDateInputValue(convocatoria.fechaFin)
  const initialCupos = String(convocatoria.cupos ?? '')
  const initialObservaciones = convocatoria.observaciones ?? ''
  const hasChanges =
    fechaInicio !== initialFechaInicio ||
    fechaFin !== initialFechaFin ||
    cupos.trim() !== initialCupos ||
    observaciones.trim() !== initialObservaciones.trim()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!fechaInicio || !fechaFin) {
      setError('Las fechas de inicio y fin son obligatorias.')
      return
    }

    if (fechaFin < fechaInicio) {
      setError('La fecha de fin no puede ser anterior a la fecha de inicio.')
      return
    }

    const cuposNumero = Number(cupos)
    if (!Number.isInteger(cuposNumero) || cuposNumero < 1) {
      setError('Los cupos deben ser un número entero mayor o igual a 1.')
      return
    }

    // Solo se envía lo que cambió.
    const request: UpdateConvocatoriaRequest = {}
    if (fechaInicio !== initialFechaInicio) request.fechaInicio = fechaInicio
    if (fechaFin !== initialFechaFin) request.fechaFin = fechaFin
    if (cupos.trim() !== initialCupos) request.cupos = cuposNumero
    if (observaciones.trim() !== initialObservaciones.trim()) request.observaciones = observaciones.trim()

    if (Object.keys(request).length === 0) {
      setError('Modifique al menos un dato antes de guardar.')
      return
    }

    setIsSubmitting(true)
    try {
      await updateConvocatoriaAdmision(convocatoria.id, request)
      onSuccess('Convocatoria actualizada correctamente.')
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'No fue posible actualizar la convocatoria.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="edit-convocatoria-fechas-modal__backdrop" role="presentation">
      <section
        className="edit-convocatoria-fechas-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-convocatoria-fechas-title"
      >
        <header className="edit-convocatoria-fechas-modal__header">
          <div>
            <h2 id="edit-convocatoria-fechas-title">Editar convocatoria</h2>
            <p>{convocatoria.programa} · {convocatoria.periodo}</p>
          </div>
          <button type="button" aria-label="Cerrar" onClick={onClose} disabled={isSubmitting}>×</button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="edit-convocatoria-fechas-modal__fields">
            <label>
              Fecha de inicio
              <input
                type="date"
                value={fechaInicio}
                onChange={(event) => setFechaInicio(event.target.value)}
                disabled={isSubmitting}
              />
            </label>
            <label>
              Fecha de fin
              <input
                type="date"
                value={fechaFin}
                min={fechaInicio || undefined}
                onChange={(event) => setFechaFin(event.target.value)}
                disabled={isSubmitting}
              />
            </label>
            <label>
              Cupos
              <input
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={cupos}
                onChange={(event) => setCupos(event.target.value)}
                disabled={isSubmitting}
              />
            </label>
            <label className="edit-convocatoria-fechas-modal__field--wide">
              Observaciones
              <textarea
                rows={3}
                value={observaciones}
                onChange={(event) => setObservaciones(event.target.value)}
                disabled={isSubmitting}
              />
            </label>
          </div>

          {error ? <p className="edit-convocatoria-fechas-modal__error" role="alert">{error}</p> : null}

          <footer className="edit-convocatoria-fechas-modal__actions">
            <button type="button" className="edit-convocatoria-fechas-modal__cancel" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting || !hasChanges}>
              {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

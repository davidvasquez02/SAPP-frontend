import { useEffect, useMemo, useState } from 'react'
import { ModuleLayout } from '../../components'
import {
  createPeriodoAcademico,
  getPeriodosAcademicosWithFechas,
  updatePeriodoAcademico,
} from '../../modules/configFechas/api/periodoAcademicoService'
import type { PeriodoAcademicoWithFechasDto } from '../../modules/configFechas/api/types'
import { TIPO_TRAMITE_ADMISIONES } from '../../modules/configFechas/constants'
import './ConfigFechasAdmisionesPage.css'

type FormState = {
  selectedPeriodoId: string
  anio: string
  periodo: '1' | '2'
  fechaInicio: string
  fechaFin: string
  descripcion: string
}

const EMPTY_FORM: FormState = {
  selectedPeriodoId: 'new',
  anio: String(new Date().getFullYear()),
  periodo: '1',
  fechaInicio: '',
  fechaFin: '',
  descripcion: '',
}

const formatDateLabel = (value: string | null) => {
  if (!value) return '-'
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

const ConfigFechasAdmisionesPage = () => {
  const [periodos, setPeriodos] = useState<PeriodoAcademicoWithFechasDto[]>([])
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const sortedPeriodos = useMemo(
    () =>
      [...periodos].sort((a, b) => {
        if (a.periodo.anio !== b.periodo.anio) return b.periodo.anio - a.periodo.anio
        return b.periodo.periodo - a.periodo.periodo
      }),
    [periodos]
  )

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getPeriodosAcademicosWithFechas()
      setPeriodos(data)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible cargar los periodos.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const handleSelectPeriodo = (value: string) => {
    setError(null)
    setFeedback(null)

    if (value === 'new') {
      setForm((current) => ({ ...EMPTY_FORM, anio: current.anio }))
      return
    }

    const periodo = sortedPeriodos.find((item) => item.periodo.id === Number(value))
    if (!periodo) return

    setForm({
      selectedPeriodoId: String(periodo.periodo.id),
      anio: String(periodo.periodo.anio),
      periodo: String(periodo.periodo.periodo) as '1' | '2',
      fechaInicio: periodo.periodo.fechaInicio ?? '',
      fechaFin: periodo.periodo.fechaFin ?? '',
      descripcion: periodo.periodo.descripcion ?? '',
    })
  }

  const handleSave = async () => {
    setError(null)
    setFeedback(null)

    if (!form.fechaInicio || !form.fechaFin) {
      setError('Debe seleccionar fecha de inicio y fecha fin.')
      return
    }

    if (form.fechaInicio > form.fechaFin) {
      setError('La fecha inicio no puede ser mayor que la fecha fin.')
      return
    }

    setIsSaving(true)
    try {
      if (form.selectedPeriodoId === 'new') {
        await createPeriodoAcademico({
          anio: Number(form.anio),
          periodo: Number(form.periodo) as 1 | 2,
          fechaInicio: form.fechaInicio,
          fechaFin: form.fechaFin,
          fechas: [
            {
              tipoTramiteId: TIPO_TRAMITE_ADMISIONES,
              fechaInicio: form.fechaInicio,
              fechaFin: form.fechaFin,
              descripcion: form.descripcion.trim() || `Fechas admisiones ${form.anio}-${form.periodo}`,
            },
          ],
        })
        setFeedback('Periodo académico creado correctamente.')
      } else {
        await updatePeriodoAcademico(Number(form.selectedPeriodoId), {
          fechaInicio: form.fechaInicio,
          fechaFin: form.fechaFin,
          descripcion: form.descripcion.trim() || `Periodo ${form.anio}-${form.periodo}`,
        })
        setFeedback('Periodo académico actualizado correctamente.')
      }

      await loadData()
      handleSelectPeriodo('new')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible guardar el periodo.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <ModuleLayout title="Fechas académicas — Admisiones">
      <section className="config-fechas-admisiones">
        <header className="config-fechas-admisiones__header">
          <div>
            <h1>Fechas académicas por semestre</h1>
            <p>Cree un nuevo periodo (año/semestre) o ajuste uno existente.</p>
          </div>
        </header>

        <div className="config-fechas-admisiones__form-card">
          <div className="config-fechas-admisiones__form-grid">
            <label className="config-fechas-admisiones__field config-fechas-admisiones__field--full">
              Gestión de periodo
              <select value={form.selectedPeriodoId} onChange={(event) => handleSelectPeriodo(event.target.value)}>
                <option value="new">Crear nuevo periodo</option>
                {sortedPeriodos.map((item) => (
                  <option key={item.periodo.id} value={item.periodo.id}>
                    {item.periodo.anioPeriodo}
                  </option>
                ))}
              </select>
            </label>

            <label className="config-fechas-admisiones__field">
              Año
              <input
                type="number"
                min={2020}
                value={form.anio}
                disabled={form.selectedPeriodoId !== 'new'}
                onChange={(event) => setForm((current) => ({ ...current, anio: event.target.value }))}
              />
            </label>

            <label className="config-fechas-admisiones__field">
              Periodo
              <select
                value={form.periodo}
                disabled={form.selectedPeriodoId !== 'new'}
                onChange={(event) => setForm((current) => ({ ...current, periodo: event.target.value as '1' | '2' }))}
              >
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
            </label>

            <label className="config-fechas-admisiones__field">
              Fecha inicio
              <input type="date" value={form.fechaInicio} onChange={(event) => setForm((c) => ({ ...c, fechaInicio: event.target.value }))} />
            </label>

            <label className="config-fechas-admisiones__field">
              Fecha fin
              <input type="date" value={form.fechaFin} onChange={(event) => setForm((c) => ({ ...c, fechaFin: event.target.value }))} />
            </label>

            <label className="config-fechas-admisiones__field config-fechas-admisiones__field--full">
              Descripción
              <textarea rows={3} value={form.descripcion} onChange={(event) => setForm((c) => ({ ...c, descripcion: event.target.value }))} />
            </label>
          </div>

          <div className="config-fechas-admisiones__actions">
            <button type="button" onClick={handleSave} disabled={isSaving || isLoading}>
              {isSaving ? 'Guardando...' : form.selectedPeriodoId === 'new' ? 'Crear periodo' : 'Actualizar periodo'}
            </button>
          </div>

          {error ? <p className="config-fechas-admisiones__alert config-fechas-admisiones__alert--error">{error}</p> : null}
          {feedback ? <p className="config-fechas-admisiones__alert config-fechas-admisiones__alert--success">{feedback}</p> : null}
        </div>

        <div className="config-fechas-admisiones__table-card">
          <h2>Periodos creados</h2>
          {isLoading ? (
            <p className="config-fechas-admisiones__status">Cargando periodos...</p>
          ) : (
            <div className="config-fechas-admisiones__table-wrap sapp-table-shell">
              <table className="config-fechas-admisiones__table sapp-table">
                <thead><tr><th>Periodo</th><th>Inicio</th><th>Fin</th><th>Descripción</th><th>Fechas trámite</th></tr></thead>
                <tbody>
                  {sortedPeriodos.map((item) => (
                    <tr key={item.periodo.id}>
                      <td>{item.periodo.anioPeriodo}</td><td>{formatDateLabel(item.periodo.fechaInicio)}</td><td>{formatDateLabel(item.periodo.fechaFin)}</td><td>{item.periodo.descripcion ?? '-'}</td><td>{item.fechas.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </ModuleLayout>
  )
}

export default ConfigFechasAdmisionesPage

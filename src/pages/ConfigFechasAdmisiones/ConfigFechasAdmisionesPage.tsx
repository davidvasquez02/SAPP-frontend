import { RUTA_CALENDARIO } from '../../modules/administracionAcademica/rutas'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BackButton, ModuleLayout } from '../../components'
import {
  createPeriodoAcademico,
  getPeriodosAcademicosWithFechas,
  updatePeriodoAcademico,
} from '../../modules/configFechas/api/periodoAcademicoService'
import {
  ID_TIPO_TRAMITE_MATRICULA,
  TIPO_TRAMITE_INCLUSION_CANCELACION,
  TIPO_TRAMITE_MATRICULA,
} from '../../modules/configFechas/constants'
import './ConfigFechasAdmisionesPage.css'

type FormState = {
  periodoId: number | null
  anio: string
  periodo: '1' | '2'
  fechaInicio: string
  fechaFin: string
  fechaInicioMatricula: string
  fechaFinMatricula: string
  tipoTramiteMatriculaId: number
  fechaFinInclusionCancelacion: string
  fechaFinInclusionCancelacionGuardada: string
}

const EMPTY_FORM: FormState = {
  periodoId: null,
  anio: String(new Date().getFullYear()),
  periodo: '1',
  fechaInicio: '',
  fechaFin: '',
  fechaInicioMatricula: '',
  fechaFinMatricula: '',
  tipoTramiteMatriculaId: ID_TIPO_TRAMITE_MATRICULA,
  fechaFinInclusionCancelacion: '',
  fechaFinInclusionCancelacionGuardada: '',
}

const ConfigFechasAdmisionesPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const requestedPeriodoId = Number(searchParams.get('periodoId'))
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getPeriodosAcademicosWithFechas()
      const item = data.find((candidate) => candidate.periodo.id === requestedPeriodoId)
      if (item) {
        const fechaMatricula = item.fechas.find(
          (fecha) => fecha.tipoTramite.nombre
            ? fecha.tipoTramite.nombre.trim().toUpperCase() === TIPO_TRAMITE_MATRICULA
            : fecha.tipoTramite.id === ID_TIPO_TRAMITE_MATRICULA
        )
        const fechaInclusionCancelacion = item.fechas.find(
          (fecha) => fecha.tipoTramite.nombre?.trim().toUpperCase() === TIPO_TRAMITE_INCLUSION_CANCELACION
        )
        setForm({
          periodoId: item.periodo.id,
          anio: String(item.periodo.anio),
          periodo: String(item.periodo.periodo) as '1' | '2',
          fechaInicio: item.periodo.fechaInicio ?? '',
          fechaFin: item.periodo.fechaFin ?? '',
          fechaInicioMatricula: fechaMatricula?.fechaInicio ?? '',
          fechaFinMatricula: fechaMatricula?.fechaFin ?? '',
          tipoTramiteMatriculaId: fechaMatricula?.tipoTramite.id ?? ID_TIPO_TRAMITE_MATRICULA,
          fechaFinInclusionCancelacion: fechaInclusionCancelacion?.fechaFin ?? '',
          fechaFinInclusionCancelacionGuardada: fechaInclusionCancelacion?.fechaFin ?? '',
        })
      } else {
        setForm(EMPTY_FORM)
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible cargar los periodos.')
    } finally {
      setIsLoading(false)
    }
  }, [requestedPeriodoId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const handleSave = async () => {
    setError(null)
    setFeedback(null)

    if (!form.fechaInicio || !form.fechaFin) {
      setError('Debe seleccionar fecha de inicio y fecha fin del semestre.')
      return
    }

    if (!form.fechaInicioMatricula || !form.fechaFinMatricula) {
      setError('Debe seleccionar fecha de inicio y fecha fin para matrículas.')
      return
    }

    if (form.fechaInicio > form.fechaFin) {
      setError('La fecha inicio del semestre no puede ser mayor que la fecha fin.')
      return
    }

    if (form.fechaInicioMatricula > form.fechaFinMatricula) {
      setError('La fecha inicio de matrículas no puede ser mayor que la fecha fin.')
      return
    }

    if (form.fechaFinInclusionCancelacionGuardada && !form.fechaFinInclusionCancelacion) {
      setError('Debe seleccionar la fecha de fin de inclusiones y cancelaciones.')
      return
    }

    if (form.fechaFinInclusionCancelacion && (
      form.fechaFinInclusionCancelacion < form.fechaFinMatricula || form.fechaFinInclusionCancelacion > form.fechaFin
    )) {
      setError('El fin de inclusiones y cancelaciones debe estar entre el cierre de matrículas y el fin del semestre.')
      return
    }

    const fechasPeriodo = {
      fechaInicio: form.fechaInicio,
      fechaFin: form.fechaFin,
      fechaFinInclusionCancelacion: form.fechaFinInclusionCancelacion !== form.fechaFinInclusionCancelacionGuardada
        ? form.fechaFinInclusionCancelacion
        : undefined,
      fechas: [{
        tipoTramiteId: form.tipoTramiteMatriculaId,
        fechaInicio: form.fechaInicioMatricula,
        fechaFin: form.fechaFinMatricula,
        descripcion: '',
      }],
    }

    setIsSaving(true)
    try {
      if (form.periodoId === null) {
        await createPeriodoAcademico({
          anio: Number(form.anio),
          periodo: Number(form.periodo) as 1 | 2,
          ...fechasPeriodo,
        })
      } else {
        await updatePeriodoAcademico(form.periodoId, {
          ...fechasPeriodo,
          descripcion: '',
        })
      }
      navigate(RUTA_CALENDARIO)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible guardar el periodo.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <ModuleLayout title={form.periodoId === null ? 'Crear período académico' : 'Editar período académico'}>
      <section className="config-fechas-admisiones">
        <BackButton to={RUTA_CALENDARIO}>Volver a fechas</BackButton>
        <header className="config-fechas-admisiones__header">
          <div>
            <h1>{form.periodoId === null ? 'Crear período académico' : 'Editar período académico'}</h1>
          </div>
        </header>

        <div className="config-fechas-admisiones__form-card">
          <div className="config-fechas-admisiones__form-grid">
            <label className="config-fechas-admisiones__field">
              Año
              <input
                type="number"
                min={2020}
                value={form.anio}
                disabled={form.periodoId !== null}
                onChange={(event) => setForm((current) => ({ ...current, anio: event.target.value }))}
              />
            </label>

            <label className="config-fechas-admisiones__field">
              Periodo
              <select
                value={form.periodo}
                disabled={form.periodoId !== null}
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

            <label className="config-fechas-admisiones__field">
              Fecha inicio matrículas
              <input
                type="date"
                value={form.fechaInicioMatricula}
                onChange={(event) => setForm((c) => ({ ...c, fechaInicioMatricula: event.target.value }))}
              />
            </label>

            <label className="config-fechas-admisiones__field">
              Fecha fin matrículas
              <input
                type="date"
                value={form.fechaFinMatricula}
                onChange={(event) => setForm((c) => ({ ...c, fechaFinMatricula: event.target.value }))}
              />
            </label>

            <div className="config-fechas-admisiones__field config-fechas-admisiones__field--full">
              <label htmlFor="fecha-fin-inclusiones">Fecha fin de inclusiones y cancelaciones</label>
              <input
                id="fecha-fin-inclusiones"
                type="date"
                value={form.fechaFinInclusionCancelacion}
                min={form.fechaFinMatricula || undefined}
                max={form.fechaFin || undefined}
                required={Boolean(form.fechaFinInclusionCancelacionGuardada)}
                aria-describedby="inicio-inclusiones-ayuda"
                onChange={(event) => setForm((c) => ({ ...c, fechaFinInclusionCancelacion: event.target.value }))}
              />
              <small id="inicio-inclusiones-ayuda">El plazo comienza en la fecha de cierre de la matrícula académica.</small>
            </div>

          </div>

          <div className="config-fechas-admisiones__actions">
            <button type="button" onClick={handleSave} disabled={isSaving || isLoading}>
              {isSaving ? 'Guardando...' : form.periodoId === null ? 'Crear período' : 'Actualizar período'}
            </button>
          </div>

          {error ? <p className="config-fechas-admisiones__alert config-fechas-admisiones__alert--error">{error}</p> : null}
          {feedback ? <p className="config-fechas-admisiones__alert config-fechas-admisiones__alert--success">{feedback}</p> : null}
        </div>

      </section>
    </ModuleLayout>
  )
}

export default ConfigFechasAdmisionesPage

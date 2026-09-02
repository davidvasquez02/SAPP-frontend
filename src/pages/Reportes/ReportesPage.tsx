import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { ModuleLayout } from '../../components'
import { getActas } from '../../modules/actas/api'
import type { ActaDto } from '../../modules/actas/types'
import { getConvocatoriasAdmision } from '../../modules/admisiones/api/convocatoriaAdmisionService'
import type { ConvocatoriaAdmisionDto } from '../../modules/admisiones/api/convocatoriaAdmisionTypes'
import { getPeriodosAcademicos } from '../../modules/configFechas/api/periodoAcademicoService'
import type { PeriodoAcademicoDto } from '../../modules/configFechas/api/types'
import {
  getProgramasAcademicos,
  type ProgramaAcademicoDto,
} from '../../modules/reportes/api/programaAcademicoService'
import {
  generarInforme,
  type TipoInforme,
} from '../../modules/reportes/services/informesMockService'
import './ReportesPage.css'

const PROCESS_OPTIONS: Array<{ id: TipoInforme; label: string; description: string }> = [
  { id: 'ADMISION', label: 'Admisión', description: 'Informe de una convocatoria de admisión.' },
  { id: 'MATRICULA', label: 'Matrícula', description: 'Informe de matrícula por período y programa.' },
  { id: 'CREDITOS_CONDONABLES', label: 'Créditos condonables', description: 'Informe de créditos por período y programa.' },
]

const findCurrentPeriodoId = (periodos: PeriodoAcademicoDto[]): string => {
  const today = new Date().toISOString().slice(0, 10)
  const current = periodos.find(
    ({ fechaInicio, fechaFin }) => fechaInicio && fechaFin && fechaInicio <= today && today <= fechaFin,
  )
  const latest = [...periodos].sort((a, b) => b.anio - a.anio || b.periodo - a.periodo)[0]
  return String(current?.id ?? latest?.id ?? '')
}

const ReportesPage = () => {
  const [tipo, setTipo] = useState<TipoInforme>('ADMISION')
  const [programaId, setProgramaId] = useState('')
  const [convocatoriaId, setConvocatoriaId] = useState('')
  const [periodoId, setPeriodoId] = useState('')
  const [actaId, setActaId] = useState('')
  const [programas, setProgramas] = useState<ProgramaAcademicoDto[]>([])
  const [convocatorias, setConvocatorias] = useState<ConvocatoriaAdmisionDto[]>([])
  const [periodos, setPeriodos] = useState<PeriodoAcademicoDto[]>([])
  const [actas, setActas] = useState<ActaDto[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      getProgramasAcademicos(),
      getConvocatoriasAdmision(),
      getPeriodosAcademicos(),
      getActas(),
    ])
      .then(([programasData, convocatoriasData, periodosData, actasData]) => {
        if (cancelled) return
        setProgramas([...programasData].sort((a, b) => a.codigoNombre.localeCompare(b.codigoNombre, 'es')))
        setConvocatorias(convocatoriasData)
        setPeriodos([...periodosData].sort((a, b) => b.anio - a.anio || b.periodo - a.periodo))
        setActas([...actasData].sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion)))
        setPeriodoId(findCurrentPeriodoId(periodosData))
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'No fue posible cargar los catálogos del informe.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const convocatoriasFiltradas = useMemo(
    () => convocatorias.filter((item) => String(item.programaId) === programaId),
    [convocatorias, programaId],
  )

  const selectTipo = (nextTipo: TipoInforme) => {
    setTipo(nextTipo)
    setProgramaId('')
    setConvocatoriaId('')
    setActaId('')
    setMessage(null)
    setError(null)
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage(null)
    setError(null)
    if (!programaId || !actaId || (tipo === 'ADMISION' ? !convocatoriaId : !periodoId)) {
      setError('Complete todos los parámetros requeridos para generar el informe.')
      return
    }
    setGenerating(true)
    try {
      const response = await generarInforme({
        tipoProceso: tipo,
        programaId: Number(programaId),
        actaId: Number(actaId),
        ...(tipo === 'ADMISION' ? { convocatoriaId: Number(convocatoriaId) } : { periodoId: Number(periodoId) }),
      })
      setMessage(`${response.mensaje} Referencia: ${response.solicitudId}.`)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No fue posible generar el informe.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <ModuleLayout title="Reportes">
      <section className="reports">
        <header className="reports__header">
          <p className="reports__eyebrow">Coordinación académica</p>
          <h1>Informes a dependencias</h1>
          <p>Seleccione el proceso y los parámetros institucionales que se incluirán en el informe.</p>
        </header>

        <div className="reports__processes" aria-label="Tipo de proceso">
          {PROCESS_OPTIONS.map((option) => (
            <button key={option.id} type="button" className={tipo === option.id ? 'reports__process reports__process--active' : 'reports__process'} onClick={() => selectTipo(option.id)} aria-pressed={tipo === option.id}>
              <strong>{option.label}</strong><span>{option.description}</span>
            </button>
          ))}
        </div>

        <form className="reports__form" onSubmit={submit}>
          <div className="reports__form-heading"><h2>Parámetros del informe</h2><span>Todos los campos son obligatorios</span></div>
          {loading ? <p role="status">Cargando programas, períodos, convocatorias y actas...</p> : null}
          {!loading ? (
            <div className="reports__fields">
              <label>Programa académico
                <select value={programaId} onChange={(event) => { setProgramaId(event.target.value); setConvocatoriaId('') }} required>
                  <option value="">Seleccione un programa</option>
                  {programas.map((programa) => <option key={programa.id} value={programa.id}>{programa.codigoNombre || programa.nombre}</option>)}
                </select>
              </label>
              {tipo === 'ADMISION' ? (
                <label>Convocatoria
                  <select value={convocatoriaId} onChange={(event) => setConvocatoriaId(event.target.value)} disabled={!programaId} required>
                    <option value="">{programaId ? 'Seleccione una convocatoria' : 'Primero seleccione un programa'}</option>
                    {convocatoriasFiltradas.map((convocatoria) => <option key={convocatoria.id} value={convocatoria.id}>{convocatoria.periodo} · {convocatoria.vigente ? 'Vigente' : 'Cerrada'}</option>)}
                  </select>
                </label>
              ) : (
                <label>Período académico
                  <select value={periodoId} onChange={(event) => setPeriodoId(event.target.value)} required>
                    <option value="">Seleccione un período</option>
                    {periodos.map((periodo) => <option key={periodo.id} value={periodo.id}>{periodo.anioPeriodo}</option>)}
                  </select>
                </label>
              )}
              <label>Acta asociada
                <select value={actaId} onChange={(event) => setActaId(event.target.value)} required>
                  <option value="">Seleccione un acta</option>
                  {actas.map((acta) => <option key={acta.id} value={acta.id}>{acta.codigo} · {acta.nombre}</option>)}
                </select>
              </label>
            </div>
          ) : null}
          {error ? <p className="reports__feedback reports__feedback--error" role="alert">{error}</p> : null}
          {message ? <p className="reports__feedback reports__feedback--success" role="status">{message}</p> : null}
          <div className="reports__actions"><button type="submit" disabled={loading || generating}>{generating ? 'Generando...' : 'Generar informe'}</button></div>
        </form>
      </section>
    </ModuleLayout>
  )
}

export default ReportesPage

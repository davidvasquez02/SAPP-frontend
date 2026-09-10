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
  generarReporteAdmision,
  type ReporteAdmisionGenerado,
} from '../../modules/reportes/services/reporteAdmisionService'
import {
  generarReportePeriodo,
  type ReportePeriodoGenerado,
} from '../../modules/reportes/services/reportePeriodoService'
import {
  getFaltantesReporte,
  type FaltantesReporte,
} from '../../modules/reportes/services/reporteError'
import { downloadBlobFile, openBlobInNewTab } from '../../shared/files/base64FileUtils'
import './ReportesPage.css'

type TipoInforme = 'ADMISION' | 'MATRICULA' | 'CREDITOS_CONDONABLES'

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

const formatGeneratedAt = (value: string) =>
  new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Bogota',
  }).format(new Date(value))

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
  const [faltantes, setFaltantes] = useState<FaltantesReporte | null>(null)
  const [generatedPdf, setGeneratedPdf] = useState<ReporteAdmisionGenerado | ReportePeriodoGenerado | null>(null)

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
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'No fue posible cargar los catálogos del informe.')
        }
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

  const selectedActa = useMemo(
    () => actas.find((acta) => String(acta.id) === actaId) ?? null,
    [actaId, actas],
  )

  const selectTipo = (nextTipo: TipoInforme) => {
    setTipo(nextTipo)
    setProgramaId('')
    setConvocatoriaId('')
    setActaId('')
    setMessage(null)
    setError(null)
    setFaltantes(null)
    setGeneratedPdf(null)
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage(null)
    setError(null)
    setFaltantes(null)
    setGeneratedPdf(null)
    if (!programaId || !actaId || (tipo === 'ADMISION' ? !convocatoriaId : !periodoId)) {
      setError('Complete todos los parámetros requeridos para generar el informe.')
      return
    }
    setGenerating(true)
    try {
      if (tipo === 'ADMISION') {
        const pdf = await generarReporteAdmision({
          actaId: Number(actaId),
          convocatoriaId: Number(convocatoriaId),
        })
        setGeneratedPdf(pdf)
        setMessage('El informe de admisión fue generado correctamente.')
        return
      }

      const pdf = await generarReportePeriodo(tipo, {
        programaId: Number(programaId),
        actaId: Number(actaId),
        periodoId: Number(periodoId),
      })
      setGeneratedPdf(pdf)
      setMessage(
        tipo === 'MATRICULA'
          ? 'El informe de matrícula fue generado correctamente.'
          : 'El informe de créditos condonables fue generado correctamente.',
      )
    } catch (submitError) {
      setFaltantes(getFaltantesReporte(submitError))
      setError(submitError instanceof Error ? submitError.message : 'No fue posible generar el informe.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <ModuleLayout title="Informes a dependencias">
      <section className="reports">
        <header className="reports__header">
          {/* <p className="reports__eyebrow">Coordinación académica</p>
          <h1>Informes a dependencias</h1> */}
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
                <select value={programaId} onChange={(event) => { setProgramaId(event.target.value); setConvocatoriaId(''); setGeneratedPdf(null) }} required>
                  <option value="">Seleccione un programa</option>
                  {programas.map((programa) => <option key={programa.id} value={programa.id}>{programa.codigoNombre || programa.nombre}</option>)}
                </select>
              </label>
              {tipo === 'ADMISION' ? (
                <label>Convocatoria
                  <select value={convocatoriaId} onChange={(event) => { setConvocatoriaId(event.target.value); setGeneratedPdf(null) }} disabled={!programaId} required>
                    <option value="">{programaId ? 'Seleccione una convocatoria' : 'Primero seleccione un programa'}</option>
                    {convocatoriasFiltradas.map((convocatoria) => <option key={convocatoria.id} value={convocatoria.id}>{convocatoria.periodo} · {convocatoria.vigente ? 'Vigente' : 'Cerrada'}</option>)}
                  </select>
                </label>
              ) : (
                <label>Período académico
                  <select value={periodoId} onChange={(event) => { setPeriodoId(event.target.value); setGeneratedPdf(null) }} required>
                    <option value="">Seleccione un período</option>
                    {periodos.map((periodo) => <option key={periodo.id} value={periodo.id}>{periodo.anioPeriodo}</option>)}
                  </select>
                </label>
              )}
              <label>Acta asociada
                <select value={actaId} onChange={(event) => { setActaId(event.target.value); setGeneratedPdf(null) }} required>
                  <option value="">Seleccione un acta</option>
                  {actas.map((acta) => <option key={acta.id} value={acta.id}>{acta.codigo} · {acta.nombre}</option>)}
                </select>
              </label>
            </div>
          ) : null}
          {error ? <p className="reports__feedback reports__feedback--error" role="alert">{error}</p> : null}
          {faltantes ? (
            <section className="reports__missing" aria-labelledby="reports-missing-title">
              <div className="reports__missing-heading">
                <div>
                  <h3 id="reports-missing-title">Información pendiente para generar el informe</h3>
                  <p>Complete los siguientes requisitos y vuelva a intentar.</p>
                </div>
                <span>{faltantes.aspirantesConDocumentosFaltantes.length} aspirante{faltantes.aspirantesConDocumentosFaltantes.length === 1 ? '' : 's'}</span>
              </div>
              {faltantes.categoriasInstitucionalesFaltantes.length > 0 ? (
                <div className="reports__missing-institutional">
                  <strong>Documentos institucionales pendientes</strong>
                  <ul>{faltantes.categoriasInstitucionalesFaltantes.map((categoria) => <li key={categoria}>{categoria}</li>)}</ul>
                </div>
              ) : null}
              <div className="reports__missing-people">
                {faltantes.aspirantesConDocumentosFaltantes.map((aspirante) => (
                  <details key={aspirante.inscripcionId} className="reports__missing-person">
                    <summary>
                      <span><strong>{aspirante.nombreCompleto}</strong><small>Documento {aspirante.documento || 'no registrado'} · Inscripción {aspirante.inscripcionId}</small></span>
                      <span className="reports__missing-count">{aspirante.documentosFaltantes.length} pendiente{aspirante.documentosFaltantes.length === 1 ? '' : 's'}</span>
                    </summary>
                    <ul>{aspirante.documentosFaltantes.map((documento) => <li key={documento}>{documento}</li>)}</ul>
                  </details>
                ))}
              </div>
            </section>
          ) : null}
          {message ? <p className="reports__feedback reports__feedback--success" role="status">{message}</p> : null}
          <div className="reports__actions"><button type="submit" disabled={loading || generating}>{generating ? 'Generando...' : 'Generar informe'}</button></div>
        </form>

        {generatedPdf ? (
          <section className="reports__generated" aria-label="PDF generado">
            <div className="reports__pdf-icon" aria-hidden="true"><span>PDF</span></div>
            <div className="reports__generated-info">
              <h2>PDF generado</h2>
              <p>{generatedPdf.filename}</p>
              <span>{selectedActa ? `${selectedActa.codigo} · ` : ''}{formatGeneratedAt(generatedPdf.generatedAt)}</span>
            </div>
            <div className="reports__generated-actions">
              <button type="button" className="sapp-document-action" onClick={() => openBlobInNewTab(generatedPdf.blob, generatedPdf.filename)}>
                Ver
              </button>
              <button type="button" className="sapp-document-action" onClick={() => downloadBlobFile(generatedPdf.blob, generatedPdf.filename)}>
                Descargar
              </button>
            </div>
          </section>
        ) : null}
      </section>
    </ModuleLayout>
  )
}

export default ReportesPage

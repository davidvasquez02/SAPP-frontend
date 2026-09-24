import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import { canManagePosgrados } from '../../auth/roleGuards'
import { useAuth } from '../../context/Auth'
import { crearProceso, listarMisLiquidaciones, listarProcesos, responderMiLiquidacion } from '../../modules/matricula-financiera/api'
import type { MiLiquidacion, ProcesoLiquidacion, RespuestasLiquidacion } from '../../modules/matricula-financiera/types'
import './MatriculaFinancieraPage.css'

const money = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 4 }).format(value)
const EMPTY = { periodoId: '', valorSmmlv: '', fuenteSmmlv: '', porcentajeVotacion: '10', porcentajeSalud: '10', baseSalud: 'SMMLV', fechaLimiteRespuesta: '' }

export const MatriculaFinancieraPage = () => {
  const { session } = useAuth(); const roles = session?.kind === 'SAPP' ? session.user.roles : []
  const coordinator = canManagePosgrados(roles)
  const [procesos, setProcesos] = useState<ProcesoLiquidacion[]>([]); const [mias, setMias] = useState<MiLiquidacion[]>([])
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [showCreate, setShowCreate] = useState(false); const [form, setForm] = useState(EMPTY)
  const load = useCallback(async () => { setLoading(true); setError(''); try { if (coordinator) setProcesos(await listarProcesos()); else setMias(await listarMisLiquidaciones()) } catch (e) { setError(e instanceof Error ? e.message : 'No fue posible cargar la información') } finally { setLoading(false) } }, [coordinator])
  useEffect(() => { void load() }, [load])
  const create = async (event: React.FormEvent) => { event.preventDefault(); try { await crearProceso({ ...form, periodoId: Number(form.periodoId), valorSmmlv: Number(form.valorSmmlv), porcentajeVotacion: Number(form.porcentajeVotacion), porcentajeSalud: Number(form.porcentajeSalud) }); setShowCreate(false); setForm(EMPTY); await load() } catch (e) { setError(e instanceof Error ? e.message : 'No fue posible crear el proceso') } }
  const respond = async (item: MiLiquidacion, answers: Partial<RespuestasLiquidacion>) => { try { await responderMiLiquidacion(item.liquidacionId, answers); await load() } catch (e) { setError(e instanceof Error ? e.message : 'No fue posible guardar las respuestas') } }
  return <ModuleLayout title="Matrícula financiera"><div className="mf-page">
    <header className="mf-page__intro"><div><span className="mf-page__icon">💳</span><h1>{coordinator ? 'Procesos de liquidación' : 'Mi liquidación'}</h1><p>{coordinator ? 'Crea, supervisa y publica las liquidaciones de cada periodo.' : 'Responde las preguntas de tu liquidación y consulta los valores publicados.'}</p></div><button className="mf-button mf-button--secondary" onClick={() => void load()} disabled={loading}>↻ Actualizar</button></header>
    {error && <div className="mf-notice mf-notice--error" role="alert">{error}</div>}
    {coordinator && <><div className="mf-toolbar"><button className="mf-button" onClick={() => setShowCreate(!showCreate)}>＋ Nuevo proceso</button></div>
      {showCreate && <form className="mf-form mf-card" onSubmit={create}><h2>Crear proceso</h2><label>Id del periodo<input required type="number" value={form.periodoId} onChange={e => setForm({...form, periodoId:e.target.value})}/></label><label>SMMLV<input required type="number" step="0.0001" value={form.valorSmmlv} onChange={e => setForm({...form, valorSmmlv:e.target.value})}/></label><label>Fuente<input value={form.fuenteSmmlv} onChange={e => setForm({...form, fuenteSmmlv:e.target.value})}/></label><label>Fecha límite<input required type="date" value={form.fechaLimiteRespuesta} onChange={e => setForm({...form, fechaLimiteRespuesta:e.target.value})}/></label><button className="mf-button" type="submit">Crear proceso</button></form>}
      <div className="mf-grid">{procesos.map(p => <Link className="mf-card mf-process" to={`/matricula/financiera/procesos/${p.id}`} key={p.id}><div><span className={`mf-badge mf-badge--${p.estado.toLowerCase()}`}>{p.estado}</span><h2>{p.periodo}</h2><p>Fecha límite: {p.fechaLimiteRespuesta}</p></div><div className="mf-stats"><span><b>{p.resumen.convocados}</b> convocados</span><span><b>{p.resumen.pendientes}</b> pendientes</span><span><b>{p.resumen.conAlertas}</b> con alertas</span></div></Link>)}</div></>}
    {!coordinator && <div className="mf-grid">{mias.map(item => <article className="mf-card mf-my" key={item.liquidacionId}><div><span className={`mf-badge mf-badge--${item.estado.toLowerCase()}`}>{item.estado.replaceAll('_',' ')}</span><h2>{item.programa}</h2><p>{item.codigoEstudiante} · Periodo {item.proceso.periodo}</p></div>{item.puedeResponder && <MiFormulario item={item} onSubmit={answers => respond(item, answers)}/>} {item.valores && <div className="mf-total"><small>Total liquidado</small><strong>{money(item.valores.totalFinal)}</strong></div>}</article>)}{!loading && mias.length === 0 && <div className="mf-empty">No tienes liquidaciones asociadas a esta cuenta.</div>}</div>}
    {loading && <p className="mf-empty">Cargando liquidaciones…</p>}
  </div></ModuleLayout>
}

const MiFormulario = ({ item, onSubmit }: { item: MiLiquidacion; onSubmit: (value: Partial<RespuestasLiquidacion>) => void }) => {
  const [answers, setAnswers] = useState<Partial<RespuestasLiquidacion>>(item.respuestas)
  return <form className="mf-questions" onSubmit={e => { e.preventDefault(); onSubmit(answers) }}>{item.preguntas.filter(q => q.aplica).map(q => <fieldset key={q.clave}><legend>{q.texto}</legend><label><input required type="radio" name={q.clave} checked={answers[q.clave] === true} onChange={() => setAnswers({...answers,[q.clave]:true})}/>Sí</label><label><input required type="radio" name={q.clave} checked={answers[q.clave] === false} onChange={() => setAnswers({...answers,[q.clave]:false})}/>No</label></fieldset>)}<button className="mf-button" type="submit">Guardar respuestas</button></form>
}

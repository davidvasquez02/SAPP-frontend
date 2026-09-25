import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import { canManagePosgrados } from '../../auth/roleGuards'
import { useAuth } from '../../context/Auth'
import { crearProceso, listarMisLiquidaciones, listarPeriodos, listarProcesos, responderMiLiquidacion } from '../../modules/matricula-financiera/api'
import { GUIA_COORDINACION, GUIA_ESTUDIANTE } from '../../modules/matricula-financiera/flow'
import { fechaColombia, money } from '../../modules/matricula-financiera/rules'
import { useConsulta, useOperacion } from '../../modules/matricula-financiera/hooks'
import type { MiLiquidacion } from '../../modules/matricula-financiera/types'
import { ParametrosProcesoForm } from './ParametrosProcesoForm'
import { RespuestasForm } from './RespuestasForm'
import { CertificadoVotacion } from './CertificadoVotacion'
import { Aviso, Paginacion } from './FinancieraUi'
import './MatriculaFinancieraPage.css'

export function MatriculaFinancieraPage() {
  const { session } = useAuth()
  const coordinator = canManagePosgrados(session?.user.roles ?? [])
  const guide = coordinator ? GUIA_COORDINACION : GUIA_ESTUDIANTE
  return <ModuleLayout title={coordinator ? 'Matrícula financiera' : 'Liquidación'}><div className="mf-page"><header className="mf-page__intro"><div><h1>{coordinator ? 'Procesos de liquidación' : 'Mi liquidación'}</h1><p>{coordinator ? 'Prepara, revisa y publica las liquidaciones de cada periodo.' : 'Responde la información y consulta tu liquidación.'}</p></div></header>
    <section className="mf-guide mf-card"><h2>Flujo de matrícula financiera</h2><ol className="mf-guide__steps">{guide.map((step, index) => <li key={step.titulo}><span className="mf-guide__number">{index + 1}</span><div><h3>{step.titulo}</h3><p>{step.descripcion}</p></div></li>)}</ol></section>
    {coordinator ? <Procesos /> : <MisLiquidaciones />}
  </div></ModuleLayout>
}
function Procesos() {
  const navigate = useNavigate()
  const consulta = useConsulta(useCallback((signal: AbortSignal) => listarProcesos(undefined, signal), []))
  const periodos = useConsulta(useCallback((signal: AbortSignal) => listarPeriodos(signal), []))
  const op = useOperacion()
  const [showCreate, setShowCreate] = useState(false)
  const [periodo, setPeriodo] = useState('')
  const [pagina, setPagina] = useState(1)
  const filtered = (consulta.data ?? []).filter(p => !periodo || p.periodoId === Number(periodo))
  const page = Math.min(pagina, Math.max(1, Math.ceil(filtered.length / 12)))
  return <><Aviso error={op.error || consulta.error || periodos.error} message={op.message} /><div className="mf-toolbar"><button className="mf-button" disabled={consulta.loading || op.busy || periodos.loading || !!periodos.error || !!consulta.error} onClick={() => setShowCreate(!showCreate)}>Crear proceso</button><Link className="mf-button mf-button--secondary" to="/matricula/financiera/tarifas">Administrar tarifas</Link><button className="mf-button mf-button--secondary" disabled={consulta.loading || op.busy} onClick={() => { consulta.refresh(); periodos.refresh() }}>Actualizar</button></div>
    {showCreate && <ParametrosProcesoForm periodos={periodos.data ?? []} procesos={consulta.data ?? []} busy={op.busy} onCancel={() => setShowCreate(false)} onSave={async body => { await op.run(async () => { const nuevo = await crearProceso(body); navigate(`/matricula/financiera/procesos/${nuevo.id}`) }) }} />}
    <div className="mf-filters"><label>Periodo<select value={periodo} onChange={e => { setPeriodo(e.target.value); setPagina(1) }}><option value="">Todos los periodos</option>{(periodos.data ?? []).map(p => <option key={p.id} value={p.id}>{p.anioPeriodo || `${p.anio} - ${p.periodo}`}</option>)}</select></label></div>
    {consulta.loading ? <p role="status">Cargando procesos…</p> : <><div className="mf-grid">{filtered.slice((page - 1) * 12, page * 12).map(p => <Link className="mf-card mf-process" to={`/matricula/financiera/procesos/${p.id}`} key={p.id}><span className={`mf-badge mf-badge--${p.estado.toLowerCase()}`}>{p.estado}</span><h2>{p.periodo}</h2><p>Recepción de respuestas habilitada hasta el {fechaColombia(p.fechaLimiteRespuesta)}</p><div className="mf-stats"><span><b>{p.resumen.convocados}</b>convocados</span><span><b>{p.resumen.pendientes}</b>pendientes</span></div></Link>)}</div>{!filtered.length && !consulta.error && <p className="mf-empty">No hay procesos para este filtro.</p>}<Paginacion pagina={page} total={Math.ceil(filtered.length / 12)} onChange={setPagina} /></>}
  </>
}
function MisLiquidaciones() {
  const consulta = useConsulta(useCallback((signal: AbortSignal) => listarMisLiquidaciones(signal), []))
  return <><Aviso error={consulta.error} />{consulta.error && <button className="mf-button" onClick={consulta.refresh}>Reintentar consulta</button>}{consulta.loading ? <p role="status">Cargando liquidaciones…</p> : <div className="mf-grid">{(consulta.data ?? []).map(item => <MiLiquidacionCard key={item.liquidacionId} item={item} onChange={consulta.refresh} />)}{!consulta.error && consulta.data?.length === 0 && <p className="mf-empty">No tienes liquidaciones disponibles en esta cuenta. Si esperabas una o aún no tienes cuenta propia, comunícate con coordinación para registrar tus respuestas.</p>}</div>}</>
}
function MiLiquidacionCard({ item, onChange }: { item: MiLiquidacion; onChange: () => void }) {
  const op = useOperacion()
  const [documentBusy, setDocumentBusy] = useState(false)
  return <article className="mf-card mf-my"><span className={`mf-badge mf-badge--${item.estado.toLowerCase()}`}>{item.estado.replaceAll('_', ' ')}</span><h2>{item.programa}</h2><p>{item.codigoEstudiante} · Periodo {item.proceso.periodo}</p><p>Recepción de respuestas habilitada hasta el {fechaColombia(item.proceso.fechaLimiteRespuesta)} · Proceso {item.proceso.estado}</p>
    {item.fueraDePlazo && <p className="mf-notice">La fecha de respuesta ya pasó. {item.puedeResponder ? 'Aún puedes responder mientras el proceso siga abierto; quedará registrada la respuesta fuera de plazo.' : 'La recepción está cerrada.'}</p>}
    <Aviso error={op.error} message={op.message} />
    <RespuestasForm key={JSON.stringify(item.respuestas)} respuestas={item.respuestas} preguntas={item.preguntas} tipo={item.tipoEstudiante} editable={item.puedeResponder} busy={op.busy || documentBusy} renderCertificado={(onValidChange, onPendingUploadChange) => <CertificadoVotacion embedded required deferredUpload liquidacionId={item.liquidacionId} editable={!op.busy && item.proceso.estado !== 'PUBLICADO'} onBusyChange={setDocumentBusy} onValidChange={onValidChange} onPendingUploadChange={onPendingUploadChange} onChange={onChange} />} onSave={async answers => { await op.run(async () => { await responderMiLiquidacion(item.liquidacionId, answers); onChange() }, 'Respuestas guardadas.') }} />
    {!item.puedeResponder && <p>Las respuestas están disponibles únicamente para consulta.</p>}
    {item.valores ? <><div className="mf-total"><span>Total liquidado</span><strong>{money(item.valores.totalFinal)}</strong></div><p>Consulta el detalle oficial por los canales institucionales del sistema financiero.</p></> : <p>El total estará disponible cuando coordinación confirme tu liquidación.</p>}
  </article>
}

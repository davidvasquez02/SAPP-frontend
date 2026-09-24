import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import { actualizarLiquidacion, actualizarProceso, agregarLiquidacion, ejecutarAccionProceso, exportarProceso, listarLiquidaciones, listarProgramas, obtenerProceso, publicarProceso } from '../../modules/matricula-financiera/api'
import { etiquetaResumen, puedeEjecutarAccion } from '../../modules/matricula-financiera/flow'
import { fechaColombia, hoyColombia, money, puedeEditarFila } from '../../modules/matricula-financiera/rules'
import { useConsulta, useOperacion } from '../../modules/matricula-financiera/hooks'
import type { EstadoLiquidacion, FiltrosLiquidaciones, Omision } from '../../modules/matricula-financiera/types'
import { ParametrosProcesoForm } from './ParametrosProcesoForm'
import { AgregarEstudiante } from './AgregarEstudiante'
import { Aviso, Paginacion, ResultadoOperacion } from './FinancieraUi'
import './MatriculaFinancieraPage.css'

interface Resultado { titulo: string; mensaje: string; omitidos?: Omision[] }
export function ProcesoLiquidacionPage() {
  const id = Number(useParams().procesoId)
  const [filtros, setFiltros] = useState<FiltrosLiquidaciones>({})
  const [texto, setTexto] = useState('')
  const [pagina, setPagina] = useState(1)
  const [editar, setEditar] = useState(false)
  const [agregar, setAgregar] = useState(false)
  const [fechaPago, setFechaPago] = useState('')
  const [confirmado, setConfirmado] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [progreso, setProgreso] = useState('')
  const op = useOperacion()
  const consulta = useConsulta(useCallback(async (signal: AbortSignal) => {
    if (!Number.isInteger(id) || id < 1) throw new Error('El proceso solicitado no es válido.')
    const [proceso, rows] = await Promise.all([obtenerProceso(id, signal), listarLiquidaciones(id, filtros, signal)])
    return { proceso, rows }
  }, [id, filtros]))
  const programas = useConsulta(useCallback((signal: AbortSignal) => listarProgramas(signal), []))
  const proceso = consulta.data?.proceso
  const rows = consulta.data?.rows ?? []
  const blocked = op.busy || consulta.loading || !!consulta.error
  const allowed = (action: Parameters<typeof puedeEjecutarAccion>[1]) => puedeEjecutarAccion(proceso?.estado, action)
  const page = Math.min(pagina, Math.max(1, Math.ceil(rows.length / 20)))
  const visibleRows = rows.slice((page - 1) * 20, page * 20)
  const codigos = Object.fromEntries(rows.map(r => [r.estudianteId, r.codigoEstudiante]))
  const filter = (patch: Partial<FiltrosLiquidaciones>) => { setPagina(1); setFiltros(previous => ({ ...previous, ...patch })) }
  const refresh = consulta.refresh
  const send = (accion: 'enviarSolicitudes' | 'enviarRecordatorio') => void op.run(async () => {
    setResultado(null); setProgreso('Procesando estudiantes elegibles…')
    try {
      const response = await ejecutarAccionProceso(id, accion)
      setResultado({ titulo: accion === 'enviarSolicitudes' ? 'Resultado de solicitudes' : 'Resultado de recordatorios', mensaje: `${response.enviados} enviados · ${response.omitidos.length} omitidos.`, omitidos: response.omitidos })
    } finally { setProgreso(''); refresh() }
  }, 'Envío terminado. Revisa los omitidos.')
  return <ModuleLayout title="Tablero de matrícula financiera"><div className="mf-page"><Link className="mf-back" to="/matricula/financiera">← Volver a procesos</Link><Aviso error={op.error || consulta.error} message={op.message} />{op.error && <p>Si una operación de envío falló, revisa el resultado parcial antes de volver a enviar; no se reintenta automáticamente.</p>}{progreso && <p role="status">{progreso}</p>}{resultado && <ResultadoOperacion titulo={resultado.titulo} omitidos={resultado.omitidos} codigos={codigos}>{resultado.mensaje}</ResultadoOperacion>}
    {consulta.loading && <p role="status">Cargando proceso y liquidaciones…</p>}{consulta.error && <button className="mf-button" onClick={refresh}>Reintentar consulta</button>}
    {proceso && <><header className="mf-page__intro"><div><span className={`mf-badge mf-badge--${proceso.estado.toLowerCase()}`}>{proceso.estado}</span><h1>Liquidaciones · {proceso.periodo}</h1><p>Respuesta hasta {fechaColombia(proceso.fechaLimiteRespuesta)} · SMMLV {money(proceso.valorSmmlv)}</p><p>Pago hasta {fechaColombia(proceso.fechaLimitePago)}</p></div><button disabled={blocked} className="mf-button mf-button--secondary" onClick={() => void op.run(() => exportarProceso(id), 'Excel descargado.')}>Exportar Excel</button></header>
      <section className="mf-summary" aria-label="Resumen del proceso">{Object.entries(proceso.resumen).map(([key, value]) => <div className="mf-card" key={key}><strong>{value}</strong><span>{etiquetaResumen(key)}</span></div>)}</section>
      <details className="mf-card"><summary>Parámetros y fechas del proceso</summary><dl className="mf-values"><div><dt>Fuente SMMLV</dt><dd>{proceso.fuenteSmmlv || 'Sin fuente registrada'}</dd></div><div><dt>Votación / salud</dt><dd>{proceso.porcentajeVotacion}% / {proceso.porcentajeSalud}%</dd></div><div><dt>Primer envío</dt><dd>{fechaColombia(proceso.fechaEnvioSolicitudes)}</dd></div><div><dt>Cierre</dt><dd>{fechaColombia(proceso.fechaCierre)}</dd></div><div><dt>Publicación</dt><dd>{fechaColombia(proceso.fechaPublicacion)}</dd></div></dl></details>
      <fieldset disabled={blocked} className="mf-fieldset mf-page">
        <div className="mf-actions">{proceso.estado !== 'PUBLICADO' && <button className="mf-button mf-button--secondary" onClick={() => setEditar(!editar)}>Editar parámetros</button>}{allowed('convocar') && <button className="mf-button mf-button--secondary" onClick={() => setAgregar(!agregar)}>Agregar estudiante</button>}</div>
        {editar && proceso.estado !== 'PUBLICADO' && <ParametrosProcesoForm key={JSON.stringify(proceso)} proceso={proceso} busy={blocked} onCancel={() => setEditar(false)} onSave={async (body) => { await op.run(async () => { await actualizarProceso(id, { valorSmmlv: body.valorSmmlv, fuenteSmmlv: body.fuenteSmmlv, porcentajeVotacion: body.porcentajeVotacion, porcentajeSalud: body.porcentajeSalud, baseSalud: body.baseSalud, fechaLimiteRespuesta: body.fechaLimiteRespuesta }); setEditar(false); refresh() }, 'Parámetros guardados y recálculo solicitado al servidor.') }} />}
        {agregar && allowed('convocar') && <AgregarEstudiante busy={blocked} onAdd={body => op.run(async () => { await agregarLiquidacion(id, body); refresh() }, 'Estudiante agregado.')} />}
        {allowed('convocar') && <section className="mf-card"><h2>Convocar estudiantes</h2><div className="mf-actions"><button className="mf-button" onClick={() => void op.run(async () => { const result = await ejecutarAccionProceso(id, 'convocar', { incluirVigentes: true, incluirNuevos: true }); setResultado({ titulo: 'Convocatoria', mensaje: `${result.creadas} creadas · ${result.yaExistentes} ya existentes.`, omitidos: result.omitidos }); refresh() }, 'Convocatoria procesada.')}>{op.busy ? 'Convocando…' : 'Convocar vigentes y nuevos'}</button></div><p>La convocatoria incluye siempre estudiantes vigentes y nuevos. Revisa la lista y excluye los casos que no correspondan desde el detalle antes de enviar correos.</p></section>}
        <section className="mf-card"><h2>Seguimiento y cierre</h2><p>Las solicitudes y los recordatorios se envían a todos los estudiantes elegibles del proceso completo, independientemente de los filtros visibles en la tabla.</p><div className="mf-actions">{allowed('enviarSolicitudes') && <button disabled={proceso.fechaLimiteRespuesta < hoyColombia()} onClick={() => send('enviarSolicitudes')} className="mf-button">{op.busy ? 'Enviando…' : 'Enviar solicitudes'}</button>}{allowed('enviarRecordatorio') && <button onClick={() => send('enviarRecordatorio')} className="mf-button mf-button--secondary">{op.busy ? 'Enviando…' : 'Enviar recordatorio'}</button>}{allowed('recalcular') && <button onClick={() => void op.run(async () => { const result = await ejecutarAccionProceso(id, 'recalcular'); setResultado({ titulo: 'Recálculo', mensaje: `${result.recalculadas} recalculadas · ${result.sinCambios} sin cambios.` }); refresh() })} className="mf-button mf-button--secondary">{op.busy ? 'Recalculando…' : 'Recalcular'}</button>}{allowed('cerrar') && <button onClick={() => void op.run(async () => { await ejecutarAccionProceso(id, 'cerrar'); refresh() }, 'Recepción cerrada. Puedes revisar y ajustar las liquidaciones antes de publicar.')} className="mf-button mf-button--secondary">Cerrar recepción</button>}{allowed('reabrir') && <button onClick={() => void op.run(async () => { await ejecutarAccionProceso(id, 'reabrir'); refresh() }, 'Recepción reabierta.')} className="mf-button mf-button--secondary">Reabrir recepción</button>}</div>{proceso.fechaLimiteRespuesta < hoyColombia() && allowed('enviarSolicitudes') && <p>La fecha de respuesta venció. Edita los parámetros antes de enviar nuevas solicitudes.</p>}<p>Cerrar impide nuevas respuestas del estudiante. Publicar congela las ediciones del proceso.</p></section>
        {allowed('publicar') && <form className="mf-card mf-questions" onSubmit={e => { e.preventDefault(); if (!confirmado || !proceso.resumen.liquidadas || fechaPago < hoyColombia()) return; void op.run(async () => { try { const result = await publicarProceso(id, fechaPago); setResultado({ titulo: 'Publicación', mensaje: `${result.enviados} avisos enviados · ${result.omitidos.length} omitidos. El proceso queda publicado.`, omitidos: result.omitidos }); setConfirmado(false) } finally { refresh() } }, 'Proceso publicado.') }}><h2>Publicar resultados</h2><p>Los estudiantes ya pueden consultar las filas liquidadas. Publicar envía el aviso y congela el proceso, incluso si algún correo se omite.</p><p>{proceso.resumen.liquidadas} liquidadas · {proceso.resumen.pendientes} pendientes · {proceso.resumen.conAlertas} con alertas.</p><label>Fecha límite de pago<input required type="date" min={hoyColombia()} value={fechaPago} onChange={e => setFechaPago(e.target.value)} /></label><label className="mf-check"><input type="checkbox" required checked={confirmado} onChange={e => setConfirmado(e.target.checked)} />Revisé las liquidaciones y confirmo el cierre definitivo de las ediciones.</label><button disabled={!proceso.resumen.liquidadas || !confirmado} className="mf-button">Publicar y notificar</button>{!proceso.resumen.liquidadas && <p>Se requiere al menos una fila liquidada.</p>}</form>}
        <form className="mf-filters" onSubmit={e => { e.preventDefault(); filter({ texto: texto.trim() }) }}><label className="mf-filter--programa">Programa<select value={filtros.programaId ?? ''} onChange={e => filter({ programaId: e.target.value ? Number(e.target.value) : undefined })}><option value="">Todos los programas</option>{(programas.data ?? []).map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></label><label>Estado<select value={filtros.estado ?? ''} onChange={e => filter({ estado: e.target.value as EstadoLiquidacion | '' })}><option value="">Todos</option><option value="PENDIENTE_RESPUESTA">Pendiente</option><option value="RESPONDIDA">Respondida</option><option value="LIQUIDADA">Liquidada</option><option value="NO_LIQUIDAR">No liquidar</option></select></label><label>Estudiante<input placeholder="Código o nombre" value={texto} onChange={e => setTexto(e.target.value)} /></label><label className="mf-check"><input type="checkbox" checked={!!filtros.conAlertas} onChange={e => filter({ conAlertas: e.target.checked || undefined })} />Solo con alertas</label><button className="mf-button mf-button--secondary">Buscar</button></form>
        <Aviso error={programas.error} />
        {!consulta.loading && !consulta.error && <><div className="mf-table-wrap"><table className="mf-table"><thead><tr><th>Nombre</th><th>Código</th><th>Programa académico</th><th>Tipo de estudiante</th><th>Estado</th><th>Semestre</th><th>Total</th><th>Acciones</th></tr></thead><tbody>{visibleRows.map(row => <tr key={row.id}><td>{row.nombreCompleto || 'Nombre no disponible'}</td><td><b>{row.codigoEstudiante}</b></td><td>{row.programa}</td><td>{row.tipoEstudiante}</td><td>{row.estado.replaceAll('_', ' ')}</td><td>{row.semestre ?? '—'}</td><td>{money(row.totalFinal)}</td><td><Link className="mf-text-button" to={`/matricula/financiera/procesos/${id}/liquidaciones/${row.id}`}>Ver y revisar</Link>{puedeEditarFila(proceso.estado, row, 'liquidada') && <button className="mf-text-button" onClick={() => void op.run(async () => { await actualizarLiquidacion(row.id, 'liquidada', { liquidada: row.estado !== 'LIQUIDADA' }); refresh() }, 'Estado actualizado.')}>{row.estado === 'LIQUIDADA' ? 'Desmarcar liquidada' : 'Confirmar liquidada en PUTTY'}</button>}</td></tr>)}</tbody></table></div>{!rows.length && <p className="mf-empty">No hay liquidaciones para estos filtros.</p>}<Paginacion pagina={page} total={Math.ceil(rows.length / 20)} onChange={setPagina} /></>}
      </fieldset>
    </>}
  </div></ModuleLayout>
}

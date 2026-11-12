import { formatNombrePersona } from '../../shared/utils/formatNombrePersona'
import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BackButton, ModuleLayout } from '../../components'
import { actualizarProceso, agregarLiquidacion, ejecutarAccionProceso, exportarProceso, listarLiquidaciones, listarProgramas, obtenerProceso, publicarProceso, vistaPreviaConvocatoria } from '../../modules/matricula-financiera/api'
import { etiquetaResumen, puedeEjecutarAccion, puedePublicarProceso } from '../../modules/matricula-financiera/flow'
import { etiquetaEstadoLiquidacion, fechaColombia, hoyColombia, money } from '../../modules/matricula-financiera/rules'
import { useConsulta, useOperacion } from '../../modules/matricula-financiera/hooks'
import type { EstadoLiquidacion, FiltrosLiquidaciones, Omision, OrigenRespuestaLiquidacion, VistaPreviaConvocatoria } from '../../modules/matricula-financiera/types'
import { ParametrosProcesoForm } from './ParametrosProcesoForm'
import { AgregarEstudiante } from './AgregarEstudiante'
import { Aviso, Paginacion, ResultadoOperacion } from './FinancieraUi'
import { LiquidacionActions } from './LiquidacionActions'
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
  const publicacionPermitida = proceso ? puedePublicarProceso(proceso.resumen) : false
  const page = Math.min(pagina, Math.max(1, Math.ceil(rows.length / 20)))
  const visibleRows = rows.slice((page - 1) * 20, page * 20)
  const codigos = Object.fromEntries(rows.map(r => [r.estudianteId, r.codigoEstudiante]))
  const filter = (patch: Partial<FiltrosLiquidaciones>) => { setPagina(1); setFiltros(previous => ({ ...previous, ...patch })) }
  const refresh = consulta.refresh
  const send = (accion: 'enviarSolicitudes' | 'enviarRecordatorio' | 'enviarRecordatorioSoportePago') => void op.run(async () => {
    setResultado(null); setProgreso('Procesando estudiantes elegibles…')
    try {
      const response = await ejecutarAccionProceso(id, accion)
      const titulos = { enviarSolicitudes: 'Resultado de solicitudes', enviarRecordatorio: 'Resultado de recordatorios', enviarRecordatorioSoportePago: 'Resultado de recordatorios de soporte de pago' }
      setResultado({ titulo: titulos[accion], mensaje: `${response.enviados} enviados · ${response.omitidos.length} omitidos.`, omitidos: response.omitidos })
    } finally { setProgreso(''); refresh() }
  }, 'Envío terminado. Revisa los omitidos.')
  return <ModuleLayout title="Tablero de matrícula financiera"><div className="mf-page"><BackButton to="/matricula/financiera">Volver a procesos</BackButton><Aviso error={op.error || consulta.error} message={op.message} />{op.error && <p>Si una operación de envío falló, revisa el resultado parcial antes de volver a enviar; no se reintenta automáticamente.</p>}{progreso && <p role="status">{progreso}</p>}{resultado && <ResultadoOperacion titulo={resultado.titulo} omitidos={resultado.omitidos} codigos={codigos}>{resultado.mensaje}</ResultadoOperacion>}
    {consulta.loading && <p role="status">Cargando proceso y liquidaciones…</p>}{consulta.error && <button className="mf-button" onClick={refresh}>Reintentar consulta</button>}
    {proceso && <><header className="mf-page__intro"><div><span className={`mf-badge mf-badge--${proceso.estado.toLowerCase()}`}>{proceso.estado}</span><h1>Liquidaciones · {proceso.periodo}</h1><p>Recepción de respuestas habilitada hasta el {fechaColombia(proceso.fechaLimiteRespuesta)} · SMMLV {money(proceso.valorSmmlv)}</p></div><button disabled={blocked} className="mf-button mf-button--secondary" onClick={() => void op.run(() => exportarProceso(id), 'Excel descargado.')}>Exportar Excel</button></header>
      <section className="mf-summary" aria-label="Resumen del proceso">{Object.entries(proceso.resumen).filter(([key]) => key !== 'conAlertas').map(([key, value]) => <div className="mf-card" key={key}><strong>{value}</strong><span>{etiquetaResumen(key)}</span></div>)}</section>
      <details className="mf-card"><summary>Parámetros y fechas del proceso</summary><dl className="mf-values"><div><dt>Fuente SMMLV</dt><dd>{proceso.fuenteSmmlv || 'Sin fuente registrada'}</dd></div><div><dt>SMMLV</dt><dd>{money(proceso.valorSmmlv)}</dd></div><div><dt>Porcentaje de votación</dt><dd>{proceso.porcentajeVotacion}%</dd></div><div><dt>Porcentaje de salud</dt><dd>{proceso.porcentajeSalud}%</dd></div><div><dt>Fecha del primer envío de solicitudes</dt><dd>{fechaColombia(proceso.fechaEnvioSolicitudes)}</dd></div><div><dt>Fecha límite recepción respuestas</dt><dd>{fechaColombia(proceso.fechaLimiteRespuesta)}</dd></div><div><dt>Fecha límite de pago en el sistema de la universidad</dt><dd>{fechaColombia(proceso.fechaLimitePago)}</dd></div></dl>{proceso.estado !== 'PUBLICADO' && <div className="mf-actions"><button type="button" disabled={blocked} className="mf-button mf-button--secondary" onClick={() => setEditar(!editar)}>Editar parámetros</button></div>}</details>
      <fieldset disabled={blocked} className="mf-fieldset mf-page">
        {editar && proceso.estado !== 'PUBLICADO' && <ParametrosProcesoForm key={JSON.stringify(proceso)} proceso={proceso} busy={blocked} onCancel={() => setEditar(false)} onSave={async (body) => { await op.run(async () => { await actualizarProceso(id, { valorSmmlv: body.valorSmmlv, fuenteSmmlv: body.fuenteSmmlv, porcentajeVotacion: body.porcentajeVotacion, porcentajeSalud: body.porcentajeSalud, baseSalud: body.baseSalud, fechaLimiteRespuesta: body.fechaLimiteRespuesta }); setEditar(false); refresh() }, 'Parámetros guardados y recálculo solicitado al servidor.') }} />}
        {allowed('convocar') && <ConvocatoriaSection id={id} op={op} onResultado={setResultado} onChange={refresh} />}
        <section className="mf-card"><h2>Seguimiento y cierre</h2><p>Las solicitudes y los recordatorios se envían a todos los estudiantes elegibles del proceso completo, independientemente de los filtros visibles en la tabla.</p><div className="mf-actions">{allowed('convocar') && <button className="mf-button mf-button--secondary" onClick={() => setAgregar(!agregar)}>Agregar estudiante</button>}{allowed('enviarSolicitudes') && <button disabled={proceso.fechaLimiteRespuesta < hoyColombia()} onClick={() => send('enviarSolicitudes')} className="mf-button">{op.busy ? 'Enviando…' : 'Enviar solicitudes'}</button>}{allowed('enviarRecordatorio') && <button onClick={() => send('enviarRecordatorio')} className="mf-button mf-button--secondary">{op.busy ? 'Enviando…' : 'Enviar recordatorio'}</button>}{proceso.estado !== 'BORRADOR' && <button onClick={() => send('enviarRecordatorioSoportePago')} className="mf-button mf-button--secondary">{op.busy ? 'Enviando…' : 'Recordar soporte de pago'}</button>}{allowed('recalcular') && <button onClick={() => void op.run(async () => { const result = await ejecutarAccionProceso(id, 'recalcular'); setResultado({ titulo: 'Recálculo', mensaje: `${result.recalculadas} recalculadas · ${result.sinCambios} sin cambios.` }); refresh() })} className="mf-button mf-button--secondary">{op.busy ? 'Recalculando…' : 'Recalcular'}</button>}{allowed('cerrar') && <button onClick={() => void op.run(async () => { await ejecutarAccionProceso(id, 'cerrar'); refresh() }, 'Recepción cerrada. Puedes revisar y ajustar las liquidaciones antes de publicar.')} className="mf-button mf-button--secondary">Cerrar recepción</button>}{allowed('reabrir') && <button onClick={() => void op.run(async () => { await ejecutarAccionProceso(id, 'reabrir'); refresh() }, 'Recepción reabierta.')} className="mf-button mf-button--secondary">Reabrir recepción</button>}</div>{agregar && allowed('convocar') && <AgregarEstudiante busy={blocked} onAdd={body => op.run(async () => { await agregarLiquidacion(id, body); refresh() }, 'Estudiante agregado.')} />}{proceso.fechaLimiteRespuesta < hoyColombia() && allowed('enviarSolicitudes') && <p>La fecha de respuesta venció. Edita los parámetros antes de enviar nuevas solicitudes.</p>}<p>Cerrar impide nuevas respuestas del estudiante. Publicar congela las ediciones del proceso.</p></section>
        {allowed('publicar') && <form className="mf-card mf-questions" onSubmit={e => { e.preventDefault(); if (!confirmado || !publicacionPermitida || !proceso.resumen.liquidadas || fechaPago < hoyColombia()) return; void op.run(async () => { try { const result = await publicarProceso(id, fechaPago); setResultado({ titulo: 'Publicación', mensaje: `${result.enviados} avisos enviados · ${result.omitidos.length} omitidos. El proceso queda publicado.`, omitidos: result.omitidos }); setConfirmado(false) } finally { refresh() } }, 'Proceso publicado.') }}><h2>Publicar resultados</h2><p>Los estudiantes ya pueden consultar las filas liquidadas. Publicar envía el aviso y congela el proceso, incluso si algún correo se omite.</p><p>{proceso.resumen.liquidadas} liquidadas · {proceso.resumen.pendientes} pendientes · {proceso.resumen.respondidas} respondidas.</p><label>Fecha límite de pago de las liquidaciones en el sistema de la universidad<input required type="date" min={hoyColombia()} value={fechaPago} onChange={e => setFechaPago(e.target.value)} /></label><label className="mf-check"><input type="checkbox" required checked={confirmado} onChange={e => setConfirmado(e.target.checked)} />Revisé las liquidaciones y confirmo el cierre definitivo de las ediciones.</label><button disabled={!proceso.resumen.liquidadas || !publicacionPermitida || !confirmado} className="mf-button">Publicar y notificar</button>{!proceso.resumen.liquidadas && <p>Se requiere al menos una fila liquidada.</p>}{!publicacionPermitida && <p className="mf-notice" role="status">Para publicar, lleva todas las liquidaciones a un estado final: Liquidada o No liquidar.</p>}</form>}
        <form className="mf-filters" onSubmit={e => { e.preventDefault(); filter({ texto: texto.trim() }) }}><label className="mf-filter--programa">Programa<select value={filtros.programaId ?? ''} onChange={e => filter({ programaId: e.target.value ? Number(e.target.value) : undefined })}><option value="">Todos los programas</option>{(programas.data ?? []).map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></label><label>Estado<select value={filtros.estado ?? ''} onChange={e => filter({ estado: e.target.value as EstadoLiquidacion | '' })}><option value="">Todos</option><option value="PENDIENTE_RESPUESTA">Pendiente</option><option value="RESPONDIDA">Respondida</option><option value="DEVUELTA">Devuelta</option><option value="APROBADA">Aprobada</option><option value="LIQUIDADA">Liquidada</option><option value="PAGO_CONFIRMADO">Pago confirmado</option><option value="NO_LIQUIDAR">No liquidar</option></select></label><label>Estudiante<input placeholder="Código o nombre" value={texto} onChange={e => setTexto(e.target.value)} /></label><label>Tipo de respuesta<select value={filtros.origenRespuesta ?? ''} onChange={e => filter({ origenRespuesta: e.target.value as OrigenRespuestaLiquidacion | '' })}><option value="">Todos</option><option value="ESTUDIANTE">Estudiante</option><option value="COORDINADOR">Coordinador</option></select></label><button className="mf-button mf-button--secondary">Buscar</button></form>
        <Aviso error={programas.error} />
        {!consulta.loading && !consulta.error && <><div className="mf-table-wrap"><table className="mf-table"><thead><tr><th>Nombre</th><th>Código</th><th>Programa académico</th><th>Tipo de estudiante</th><th>Tipo de respuesta</th><th>Estado</th><th>Total</th><th>Acciones</th></tr></thead><tbody>{visibleRows.map(row => <tr key={row.id}><td>{formatNombrePersona(row.nombreCompleto) || 'Nombre no disponible'}</td><td><b>{row.codigoEstudiante}</b></td><td>{row.programa}</td><td>{row.tipoEstudiante}</td><td>{row.origenRespuesta === 'ESTUDIANTE' ? 'Estudiante' : row.origenRespuesta === 'COORDINADOR' ? 'Coordinador' : '—'}</td><td><span className={`mf-badge mf-badge--${row.estado.toLowerCase()}`} title={row.estado === 'LIQUIDADA' ? 'Informativo: el pago lo gestiona y confirma el sistema institucional, no esta plataforma.' : undefined}>{etiquetaEstadoLiquidacion(row.estado)}</span></td><td>{money(row.totalFinal)}</td><td><div className="mf-row-actions"><Link className="mf-button mf-button--secondary mf-button--table" to={`/matricula/financiera/procesos/${id}/liquidaciones/${row.id}`}>Ver detalle</Link><LiquidacionActions compact fila={row} proceso={proceso} onChange={refresh} /></div></td></tr>)}</tbody></table></div>{!rows.length && <p className="mf-empty">No hay liquidaciones para estos filtros.</p>}<Paginacion pagina={page} total={Math.ceil(rows.length / 20)} onChange={setPagina} /></>}
      </fieldset>
    </>}
  </div></ModuleLayout>
}
function ConvocatoriaSection({ id, op, onResultado, onChange }: { id: number; op: ReturnType<typeof useOperacion>; onResultado: (resultado: Resultado) => void; onChange: () => void }) {
  const [incluirVigentes, setIncluirVigentes] = useState(true)
  const [incluirNuevos, setIncluirNuevos] = useState(true)
  const [vistaPrevia, setVistaPrevia] = useState<VistaPreviaConvocatoria | null>(null)
  const actualizarOpcion = (patch: { incluirVigentes?: boolean; incluirNuevos?: boolean }) => {
    setVistaPrevia(null)
    if (patch.incluirVigentes !== undefined) setIncluirVigentes(patch.incluirVigentes)
    if (patch.incluirNuevos !== undefined) setIncluirNuevos(patch.incluirNuevos)
  }
  const totalEstudiantes = vistaPrevia?.programas.reduce((total, programa) => total + programa.estudiantes.length, 0) ?? 0
  return <section className="mf-card"><h2>Convocar estudiantes</h2>
    <div className="mf-convocation-warning" role="note" aria-label="Advertencia antes de convocar"><span className="mf-convocation-warning__icon" aria-hidden="true">!</span><div><strong>Importante antes de convocar</strong><p>Revisa la vista previa antes de confirmar: lista a quienes se convocaría, agrupados por programa. Después de confirmar, excluye desde el detalle de cada estudiante a quien no corresponda, antes de enviar las solicitudes.</p></div></div>
    <div className="mf-actions"><label className="mf-check"><input type="checkbox" checked={incluirVigentes} onChange={e => actualizarOpcion({ incluirVigentes: e.target.checked })} />Incluir vigentes</label><label className="mf-check"><input type="checkbox" checked={incluirNuevos} onChange={e => actualizarOpcion({ incluirNuevos: e.target.checked })} />Incluir nuevos</label></div>
    <div className="mf-actions">
      <button type="button" className="mf-button mf-button--secondary" disabled={op.busy || (!incluirVigentes && !incluirNuevos)} onClick={() => void op.run(async () => { setVistaPrevia(await vistaPreviaConvocatoria(id, { incluirVigentes, incluirNuevos })) })}>{op.busy ? 'Consultando…' : 'Ver vista previa'}</button>
      {vistaPrevia && <button type="button" className="mf-button" disabled={op.busy} onClick={() => void op.run(async () => { const result = await ejecutarAccionProceso(id, 'convocar', { incluirVigentes, incluirNuevos }); onResultado({ titulo: 'Convocatoria', mensaje: `${result.creadas} creadas · ${result.yaExistentes} ya existentes.`, omitidos: result.omitidos }); setVistaPrevia(null); onChange() }, 'Convocatoria procesada.')}>{op.busy ? 'Convocando…' : `Confirmar convocatoria (${totalEstudiantes})`}</button>}
    </div>
    {vistaPrevia && (totalEstudiantes === 0 ? <p className="mf-empty">No hay estudiantes para convocar con estas opciones.</p> : vistaPrevia.programas.map(programa => <div key={programa.programaId} className="mf-table-wrap"><h3>{programa.programaCodigoNombre}</h3><table className="mf-table"><thead><tr><th>Código</th><th>Nombre</th><th>Tipo</th></tr></thead><tbody>{programa.estudiantes.map(estudiante => <tr key={estudiante.estudianteId}><td><b>{estudiante.codigoEstudiante}</b></td><td>{formatNombrePersona(estudiante.nombreCompleto) || 'Nombre no disponible'}</td><td>{estudiante.tipoEstudiante}</td></tr>)}</tbody></table></div>))}
  </section>
}

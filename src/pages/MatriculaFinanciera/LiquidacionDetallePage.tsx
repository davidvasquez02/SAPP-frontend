import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import { actualizarLiquidacion, obtenerLiquidacion, obtenerProceso } from '../../modules/matricula-financiera/api'
import { useConsulta, useOperacion } from '../../modules/matricula-financiera/hooks'
import { ajustesActuales, fechaColombia, puedeEditarFila } from '../../modules/matricula-financiera/rules'
import type { LiquidacionMatricula, ProcesoLiquidacion, PreguntaLiquidacion } from '../../modules/matricula-financiera/types'
import { Aviso, Alertas, Importe } from './FinancieraUi'
import { RespuestasForm } from './RespuestasForm'
import { CertificadoVotacion } from './CertificadoVotacion'
import './MatriculaFinancieraPage.css'

export function LiquidacionDetallePage() {
  const params = useParams(); const id = Number(params.liquidacionId); const procesoId = Number(params.procesoId)
  const consulta = useConsulta(useCallback(async (signal: AbortSignal) => {
    if (!Number.isInteger(id) || id < 1 || !Number.isInteger(procesoId) || procesoId < 1) throw new Error('La liquidación solicitada no es válida.')
    const [fila, proceso] = await Promise.all([obtenerLiquidacion(id, signal), obtenerProceso(procesoId, signal)])
    if (fila.procesoId !== procesoId) throw new Error('La liquidación no pertenece a este proceso.')
    return { fila, proceso }
  }, [id, procesoId]))
  return <ModuleLayout title="Detalle de liquidación"><div className="mf-page"><Link className="mf-back" to={`/matricula/financiera/procesos/${procesoId}`}>← Volver al proceso</Link><Aviso error={consulta.error} />{consulta.error && <button className="mf-button" onClick={consulta.refresh}>Reintentar consulta</button>}{consulta.loading ? <p role="status">Cargando liquidación…</p> : consulta.data && <Detalle key={JSON.stringify(consulta.data)} {...consulta.data} onChange={consulta.refresh} />}</div></ModuleLayout>
}
function Detalle({ fila, proceso, onChange }: { fila: LiquidacionMatricula; proceso: ProcesoLiquidacion; onChange: () => void }) {
  const op = useOperacion()
  const [documentBusy, setDocumentBusy] = useState(false)
  const busy = op.busy || documentBusy
  const initial = ajustesActuales(fila)
  const [ajustes, setAjustes] = useState({ semestre: fila.semestre == null ? '' : String(initial.semestre), ajusteManual: String(initial.ajusteManual), valorFinalManual: initial.valorFinalManual == null ? '' : String(initial.valorFinalManual), observaciones: initial.observaciones ?? '' })
  const [motivo, setMotivo] = useState('')
  const allowed = (accion: Parameters<typeof puedeEditarFila>[2]) => puedeEditarFila(proceso.estado, fila, accion)
  const preguntas: PreguntaLiquidacion[] = [
    { clave: 'entregoTrabajoGrado', texto: '¿Entregó el trabajo de grado (Acuerdo 048 de 2024)?', aplica: fila.tipoEstudiante === 'VIGENTE' },
    { clave: 'cumLaude', texto: '¿Tiene beneficio de matrícula por Cum Laude?', aplica: fila.tipoEstudiante === 'VIGENTE' },
    { clave: 'certificadoVotacion', texto: '¿Tiene certificado de votación vigente?', aplica: true },
    { clave: 'deseaSalud', texto: '¿Desea el pago de derechos de salud UIS?', aplica: true },
  ]
  return <><header><h1>{fila.codigoEstudiante} · {fila.nombreCompleto || 'Nombre no disponible'}</h1></header>
    <Aviso error={op.error} message={op.message} /><section className="mf-card"><div className="mf-review-status"><span>Estado de la liquidación</span><strong className={`mf-badge mf-badge--${fila.estado.toLowerCase()}`}>{fila.estado === 'PENDIENTE_RESPUESTA' ? 'Pendiente de respuesta' : fila.estado === 'NO_LIQUIDAR' ? 'No liquidar' : fila.estado === 'RESPONDIDA' ? 'Respondida' : 'Liquidada'}</strong></div><h2>Revisión del caso</h2><Alertas alertas={fila.alertas.filter(alerta => alerta !== 'PROMOCION_FALTANTE')} />{fila.motivoExclusion && <p>Motivo de exclusión: {fila.motivoExclusion}</p>}<dl className="mf-values"><div><dt>Programa académico</dt><dd>{fila.programa}</dd></div><div><dt>Tipo de estudiante</dt><dd>{fila.tipoEstudiante}</dd></div><div><dt>Periodo</dt><dd>{proceso.periodo}</dd></div><div><dt>Semestre</dt><dd>{fila.semestre ?? 'Sin calcular'} · {fila.semestreOrigen ?? 'Sin origen'}</dd></div><div><dt>Origen de respuesta</dt><dd>{fila.origenRespuesta ?? 'Sin respuesta'}</dd></div>{Object.entries({ 'Solicitud enviada': fila.fechaEnvioSolicitud, 'Último recordatorio': fila.fechaUltimoRecordatorio, 'Respuesta recibida': fila.fechaRespuesta, 'Marcada liquidada': fila.fechaLiquidada }).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{fechaColombia(value)}</dd></div>)}</dl></section>
    <section className="mf-card"><h2>Respuestas y respaldo de coordinación</h2><RespuestasForm respuestas={fila.respuestas} preguntas={preguntas} tipo={fila.tipoEstudiante} coordinacion observaciones={fila.observaciones} editable={allowed('respuestas')} busy={busy} renderCertificado={() => <CertificadoVotacion embedded liquidacionId={fila.id} editable={proceso.estado !== 'PUBLICADO' && !op.busy} onBusyChange={setDocumentBusy} onChange={onChange} />} onSave={async body => { await op.run(async () => { await actualizarLiquidacion(fila.id, 'respuestas', body); onChange() }) }} />{fila.estado === 'LIQUIDADA' && proceso.estado !== 'PUBLICADO' && <p>Desmarca la liquidación para corregir respuestas.</p>}</section>
    <section className="mf-card"><h2>Cálculo recibido del sistema</h2><dl className="mf-values"><Importe titulo="Matrícula" valor={fila.calculo?.valorMatricula} /><Importe titulo="Derechos académicos" valor={fila.calculo?.valorDerechos} /><Importe titulo="Descuento trabajo de grado" valor={fila.calculo?.descuentoTrabajoGrado} /><Importe titulo="Descuento Cum Laude" valor={fila.calculo?.descuentoCumLaude} /><Importe titulo="Descuento votación" valor={fila.calculo?.descuentoVotacion} /><Importe titulo="Salud" valor={fila.calculo?.valorSalud} /><Importe titulo="Total calculado" valor={fila.calculo?.totalCalculado} /><Importe titulo="Ajuste manual" valor={fila.ajusteManual} />{fila.valorFinalManual != null && <Importe titulo="Valor final manual" valor={fila.valorFinalManual} />}<Importe titulo="Total final" valor={fila.totalFinal} /></dl></section>
    <form className="mf-card" onSubmit={e => { e.preventDefault(); void op.run(async () => { await actualizarLiquidacion(fila.id, 'ajustes', { semestre: Number(ajustes.semestre), promocion: initial.promocion, ajusteManual: Number(ajustes.ajusteManual), valorFinalManual: ajustes.valorFinalManual === '' ? null : Number(ajustes.valorFinalManual), observaciones: ajustes.observaciones.trim() || null }); onChange() }) }}><h2>Ajustes autorizados</h2><p>Se conserva el cálculo del servidor. Un valor final manual prevalece sobre el cálculo y el ajuste. Dejarlo vacío retira esa excepción.</p>{fila.estado === 'LIQUIDADA' && <p>Si cambias valores, revisa que coincidan con la liquidación realizada en el sistema financiero.</p>}<fieldset disabled={busy || !allowed('ajustes')} className="mf-form mf-fieldset">
      <label>Semestre<input type="number" min="1" step="1" required value={ajustes.semestre} onChange={e => setAjustes({ ...ajustes, semestre: e.target.value })} /></label><label>Ajuste manual (COP)<input type="number" step="0.0001" required value={ajustes.ajusteManual} onChange={e => setAjustes({ ...ajustes, ajusteManual: e.target.value })} /></label><label>Valor final manual (opcional)<input type="number" min="0" step="0.0001" value={ajustes.valorFinalManual} onChange={e => setAjustes({ ...ajustes, valorFinalManual: e.target.value })} /></label><label>Observaciones<textarea value={ajustes.observaciones} onChange={e => setAjustes({ ...ajustes, observaciones: e.target.value })} /></label>{allowed('ajustes') && <button className="mf-button" type="submit">{busy ? 'Guardando…' : 'Guardar ajustes'}</button>}</fieldset></form>
    <section className="mf-card"><h2>Estado de la liquidación</h2>{proceso.estado === 'PUBLICADO' ? <p>El proceso está publicado. Solo se permite consulta.</p> : <><p>Marca liquidada después de generar la liquidación en PUTTY. Esto no registra un pago. Los cambios hechos en Excel deben registrarse también en SAPP antes de publicar.</p>
      <button className="mf-button" disabled={busy || !allowed('liquidada')} onClick={() => void op.run(async () => { await actualizarLiquidacion(fila.id, 'liquidada', { liquidada: fila.estado !== 'LIQUIDADA' }); onChange() })}>{fila.estado === 'LIQUIDADA' ? 'Desmarcar liquidada' : 'Confirmar liquidación realizada en PUTTY'}</button>
      {fila.estado === 'RESPONDIDA' && fila.totalFinal == null && <p>Necesitas un total calculado o un valor final manual antes de marcar.</p>}
      {allowed('excluir') && <form className="mf-questions" onSubmit={e => { e.preventDefault(); if (!motivo.trim()) return; void op.run(async () => { await actualizarLiquidacion(fila.id, 'excluir', { motivo: motivo.trim() }); onChange() }) }}><label>Motivo de exclusión<textarea required disabled={busy} value={motivo} onChange={e => setMotivo(e.target.value)} /></label><button className="mf-button mf-button--secondary" disabled={busy || !motivo.trim()}>Excluir del proceso</button></form>}
      {allowed('reincluir') && <button className="mf-button mf-button--secondary" disabled={busy} onClick={() => void op.run(async () => { await actualizarLiquidacion(fila.id, 'reincluir'); onChange() })}>Reincluir estudiante</button>}
    </>}</section></>
}

import { formatNombrePersona } from '../../shared/utils/formatNombrePersona'
import { useState } from 'react'
import { actualizarLiquidacion, aprobarSoportePago, rechazarSoportePago } from '../../modules/matricula-financiera/api'
import { useOperacion } from '../../modules/matricula-financiera/hooks'
import { money, puedeEditarFila } from '../../modules/matricula-financiera/rules'
import type { LiquidacionMatricula, ProcesoLiquidacion } from '../../modules/matricula-financiera/types'
import { Aviso } from './FinancieraUi'

type Dialogo = 'confirmar' | 'excluir' | 'desmarcar' | 'reincluir' | 'aprobar' | 'devolver' | 'aprobarSoportePago' | 'rechazarSoportePago' | null

const TITULOS: Record<Exclude<Dialogo, null>, string> = {
  confirmar: 'Confirmar liquidación en PUTTY', excluir: 'Excluir del proceso', desmarcar: 'Desmarcar liquidación',
  reincluir: 'Reincluir estudiante', aprobar: 'Aprobar respuestas', devolver: 'Devolver al estudiante para corrección',
  aprobarSoportePago: 'Aprobar soporte de pago', rechazarSoportePago: 'Rechazar soporte de pago',
}
const CONFIRMACIONES: Record<Exclude<Dialogo, null>, string> = {
  confirmar: 'Confirmo que esta liquidación ya fue registrada en PUTTY', excluir: 'Confirmo que deseo excluir esta liquidación del proceso',
  desmarcar: 'Confirmo que deseo desmarcar esta liquidación', reincluir: 'Confirmo que deseo reincluir esta liquidación',
  aprobar: 'Confirmo que las respuestas y su respaldo documental son correctos', devolver: 'Confirmo que deseo devolver esta liquidación al estudiante para que corrija',
  aprobarSoportePago: 'Confirmo que el soporte de pago es correcto', rechazarSoportePago: 'Confirmo que deseo rechazar el soporte de pago',
}
const CON_MOTIVO: ReadonlySet<Dialogo> = new Set(['excluir', 'devolver', 'rechazarSoportePago'])

export function LiquidacionActions({ fila, proceso, cambiosSinGuardar = false, onChange, compact = false }: {
  fila: LiquidacionMatricula; proceso: ProcesoLiquidacion; cambiosSinGuardar?: boolean; onChange: () => void; compact?: boolean
}) {
  const op = useOperacion(); const [dialogo, setDialogo] = useState<Dialogo>(null)
  const [acepta, setAcepta] = useState(false); const [motivo, setMotivo] = useState('')
  const close = () => { if (!op.busy) { setDialogo(null); setAcepta(false); setMotivo('') } }
  const execute = (run: () => Promise<unknown>) => void op.run(async () => { await run(); close(); onChange() }, 'Estado actualizado.')
  const ejecutarDialogo = () => {
    const motivoRecortado = motivo.trim()
    switch (dialogo) {
      case 'confirmar': return execute(() => actualizarLiquidacion(fila.id, 'liquidada', { liquidada: true }))
      case 'desmarcar': return execute(() => actualizarLiquidacion(fila.id, 'liquidada', { liquidada: false }))
      case 'excluir': return execute(() => actualizarLiquidacion(fila.id, 'excluir', { motivo: motivoRecortado }))
      case 'reincluir': return execute(() => actualizarLiquidacion(fila.id, 'reincluir'))
      case 'aprobar': return execute(() => actualizarLiquidacion(fila.id, 'aprobar'))
      case 'devolver': return execute(() => actualizarLiquidacion(fila.id, 'devolver', { motivo: motivoRecortado }))
      case 'aprobarSoportePago': return execute(() => aprobarSoportePago(fila.id))
      case 'rechazarSoportePago': return execute(() => rechazarSoportePago(fila.id, motivoRecortado))
      default: return undefined
    }
  }
  const canConfirm = puedeEditarFila(proceso.estado, fila, 'liquidada') && fila.estado === 'APROBADA' && !cambiosSinGuardar
  const actionClassName = compact ? 'mf-button mf-button--secondary mf-button--table' : 'mf-button mf-button--secondary'
  return <div className={compact ? 'mf-row-actions' : 'mf-state-actions'}>
    <Aviso error={op.error} message={op.message} />
    {fila.estado === 'RESPONDIDA' && <><button type="button" className={compact ? actionClassName : 'mf-button'} disabled={op.busy || !puedeEditarFila(proceso.estado, fila, 'aprobar')} onClick={() => setDialogo('aprobar')}>Aprobar respuestas</button><button type="button" className={actionClassName} disabled={op.busy || !puedeEditarFila(proceso.estado, fila, 'devolver')} onClick={() => setDialogo('devolver')}>Devolver al estudiante</button></>}
    {fila.estado === 'APROBADA' && <button type="button" className={compact ? actionClassName : 'mf-button'} disabled={op.busy || !canConfirm} onClick={() => setDialogo('confirmar')}>Confirmar liquidación en PUTTY</button>}
    {fila.estado === 'LIQUIDADA' && <><button type="button" className={compact ? actionClassName : 'mf-text-button'} disabled={op.busy || proceso.estado === 'PUBLICADO'} onClick={() => setDialogo('desmarcar')}>Desmarcar liquidación</button><button type="button" className={actionClassName} disabled={op.busy || !puedeEditarFila(proceso.estado, fila, 'aprobarSoportePago')} title={!fila.soportePagoRecibido ? 'Falta el documento del soporte de pago' : undefined} onClick={() => setDialogo('aprobarSoportePago')}>Aprobar soporte de pago</button><button type="button" className={actionClassName} disabled={op.busy || !puedeEditarFila(proceso.estado, fila, 'rechazarSoportePago')} onClick={() => setDialogo('rechazarSoportePago')}>Rechazar soporte de pago</button></>}
    {puedeEditarFila(proceso.estado, fila, 'excluir') && <button type="button" className={actionClassName} disabled={op.busy} onClick={() => setDialogo('excluir')}>Excluir del proceso</button>}
    {fila.estado === 'NO_LIQUIDAR' && <button type="button" className={actionClassName} disabled={op.busy || !puedeEditarFila(proceso.estado, fila, 'reincluir')} onClick={() => setDialogo('reincluir')}>Reincluir estudiante</button>}
    {dialogo && <div className="mf-dialog-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) close() }}><section className="mf-dialog" role="dialog" aria-modal="true" aria-labelledby="mf-dialog-title">
      <h2 id="mf-dialog-title">{TITULOS[dialogo]}</h2>
      <dl className="mf-values"><div><dt>Estudiante</dt><dd>{formatNombrePersona(fila.nombreCompleto) || 'Nombre no disponible'}</dd></div><div><dt>Código</dt><dd>{fila.codigoEstudiante}</dd></div><div><dt>Periodo</dt><dd>{proceso.periodo}</dd></div>{dialogo === 'confirmar' && <div><dt>Total</dt><dd>{money(fila.totalFinal)}</dd></div>}</dl>
      {CON_MOTIVO.has(dialogo) && <label className="mf-dialog__field">Motivo<textarea autoFocus required value={motivo} onChange={e => setMotivo(e.target.value)} /></label>}
      <label className="mf-check"><input type="checkbox" checked={acepta} onChange={e => setAcepta(e.target.checked)} />{CONFIRMACIONES[dialogo]}</label>
      <div className="mf-form__actions"><button type="button" className="mf-button mf-button--secondary" disabled={op.busy} onClick={close}>Cancelar</button><button type="button" className="mf-button" disabled={op.busy || !acepta || (CON_MOTIVO.has(dialogo) && !motivo.trim())} onClick={ejecutarDialogo}>{op.busy ? 'Guardando…' : 'Confirmar'}</button></div>
    </section></div>}
  </div>
}

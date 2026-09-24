import { useState } from 'react'
import { actualizarLiquidacion } from '../../modules/matricula-financiera/api'
import { useOperacion } from '../../modules/matricula-financiera/hooks'
import { money, puedeEditarFila } from '../../modules/matricula-financiera/rules'
import type { LiquidacionMatricula, ProcesoLiquidacion } from '../../modules/matricula-financiera/types'
import { Aviso } from './FinancieraUi'

type Dialogo = 'confirmar' | 'excluir' | 'desmarcar' | 'reincluir' | null

export function LiquidacionActions({ fila, proceso, cambiosSinGuardar = false, onChange, compact = false }: {
  fila: LiquidacionMatricula; proceso: ProcesoLiquidacion; cambiosSinGuardar?: boolean; onChange: () => void; compact?: boolean
}) {
  const op = useOperacion(); const [dialogo, setDialogo] = useState<Dialogo>(null)
  const [acepta, setAcepta] = useState(false); const [motivo, setMotivo] = useState('')
  const close = () => { if (!op.busy) { setDialogo(null); setAcepta(false); setMotivo('') } }
  const execute = (action: 'liquidada' | 'excluir' | 'reincluir', body?: { liquidada: boolean } | { motivo: string }) => void op.run(async () => {
    await actualizarLiquidacion(fila.id, action, body); close(); onChange()
  }, 'Estado actualizado.')
  const canConfirm = puedeEditarFila(proceso.estado, fila, 'liquidada') && fila.estado === 'RESPONDIDA' && !cambiosSinGuardar
  const actionClassName = compact ? 'mf-button mf-button--secondary mf-button--table' : 'mf-button mf-button--secondary'
  return <div className={compact ? 'mf-row-actions' : 'mf-state-actions'}>
    <Aviso error={op.error} message={op.message} />
    {fila.estado === 'LIQUIDADA' ? <button type="button" className={compact ? actionClassName : 'mf-text-button'} disabled={op.busy || proceso.estado === 'PUBLICADO'} onClick={() => setDialogo('desmarcar')}>Desmarcar liquidación</button> : <>
      <button type="button" className={compact ? actionClassName : 'mf-button'} disabled={op.busy || !canConfirm} onClick={() => setDialogo('confirmar')}>Confirmar liquidación en PUTTY</button>
      {(fila.estado === 'PENDIENTE_RESPUESTA' || fila.estado === 'RESPONDIDA') && <button type="button" className={actionClassName} disabled={op.busy || !puedeEditarFila(proceso.estado, fila, 'excluir')} onClick={() => setDialogo('excluir')}>Excluir del proceso</button>}
    </>}
    {fila.estado === 'NO_LIQUIDAR' && <button type="button" className={actionClassName} disabled={op.busy || !puedeEditarFila(proceso.estado, fila, 'reincluir')} onClick={() => setDialogo('reincluir')}>Reincluir estudiante</button>}
    {dialogo && <div className="mf-dialog-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) close() }}><section className="mf-dialog" role="dialog" aria-modal="true" aria-labelledby="mf-dialog-title">
      <h2 id="mf-dialog-title">{dialogo === 'confirmar' ? 'Confirmar liquidación en PUTTY' : dialogo === 'excluir' ? 'Excluir del proceso' : dialogo === 'desmarcar' ? 'Desmarcar liquidación' : 'Reincluir estudiante'}</h2>
      <dl className="mf-values"><div><dt>Estudiante</dt><dd>{fila.nombreCompleto || 'Nombre no disponible'}</dd></div><div><dt>Código</dt><dd>{fila.codigoEstudiante}</dd></div><div><dt>Periodo</dt><dd>{proceso.periodo}</dd></div>{dialogo === 'confirmar' && <div><dt>Total</dt><dd>{money(fila.totalFinal)}</dd></div>}</dl>
      {dialogo === 'excluir' && <label className="mf-dialog__field">Motivo de exclusión<textarea autoFocus required value={motivo} onChange={e => setMotivo(e.target.value)} /></label>}
      <label className="mf-check"><input type="checkbox" checked={acepta} onChange={e => setAcepta(e.target.checked)} />{dialogo === 'confirmar' ? 'Confirmo que esta liquidación ya fue registrada en PUTTY' : dialogo === 'excluir' ? 'Confirmo que deseo excluir esta liquidación del proceso' : dialogo === 'desmarcar' ? 'Confirmo que deseo desmarcar esta liquidación' : 'Confirmo que deseo reincluir esta liquidación'}</label>
      <div className="mf-form__actions"><button type="button" className="mf-button mf-button--secondary" disabled={op.busy} onClick={close}>Cancelar</button><button type="button" className="mf-button" disabled={op.busy || !acepta || (dialogo === 'excluir' && !motivo.trim())} onClick={() => dialogo === 'confirmar' ? execute('liquidada', { liquidada: true }) : dialogo === 'excluir' ? execute('excluir', { motivo: motivo.trim() }) : dialogo === 'desmarcar' ? execute('liquidada', { liquidada: false }) : execute('reincluir')}>{op.busy ? 'Guardando…' : 'Confirmar'}</button></div>
    </section></div>}
  </div>
}

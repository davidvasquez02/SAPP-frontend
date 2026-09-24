import { useState } from 'react'
import type { CrearProcesoRequest, ParametrosProceso, PeriodoFinanciera, ProcesoLiquidacion } from '../../modules/matricula-financiera/types'

interface ParametrosProcesoFormProps {
  proceso?: ProcesoLiquidacion
  periodos?: PeriodoFinanciera[]
  procesos?: ProcesoLiquidacion[]
  busy: boolean
  onSave: (value: CrearProcesoRequest) => Promise<void>
  onCancel: () => void
}
export function ParametrosProcesoForm({ proceso, periodos = [], procesos = [], busy, onSave, onCancel }: ParametrosProcesoFormProps) {
  const [form, setForm] = useState({ periodoId: '', procesoBaseId: '', valorSmmlv: proceso ? String(proceso.valorSmmlv) : '', fuenteSmmlv: proceso?.fuenteSmmlv ?? '', porcentajeVotacion: String(proceso?.porcentajeVotacion ?? 10), porcentajeSalud: String(proceso?.porcentajeSalud ?? 10), baseSalud: proceso?.baseSalud ?? 'SMMLV', fechaLimiteRespuesta: proceso?.fechaLimiteRespuesta ?? '' })
  const occupied = new Set(procesos.map(p => p.periodoId))
  const set = (key: keyof typeof form, value: string) => setForm(previous => ({ ...previous, [key]: value }))
  return <form className="mf-card" onSubmit={e => {
    e.preventDefault()
    const parametros: ParametrosProceso = { valorSmmlv: Number(form.valorSmmlv), fuenteSmmlv: form.fuenteSmmlv.trim() || null, porcentajeVotacion: Number(form.porcentajeVotacion), porcentajeSalud: Number(form.porcentajeSalud), baseSalud: form.baseSalud, fechaLimiteRespuesta: form.fechaLimiteRespuesta }
    void onSave({ ...parametros, periodoId: proceso?.periodoId ?? Number(form.periodoId), ...(form.procesoBaseId ? { procesoBaseId: Number(form.procesoBaseId) } : {}) })
  }}><fieldset disabled={busy} className="mf-form mf-fieldset"><div className="mf-form__heading"><h2>{proceso ? 'Editar parámetros' : 'Crear proceso'}</h2><p>{proceso ? 'Guardar recalcula las filas sin valor final manual. Revisa los valores antes de exportar nuevamente.' : 'Selecciona un periodo libre. El proceso base permite recuperar las promociones al convocar.'}</p></div>
    {!proceso && <><label>Periodo académico<select required value={form.periodoId} onChange={e => set('periodoId', e.target.value)}><option value="">Selecciona un periodo</option>{periodos.map(p => <option disabled={occupied.has(p.id)} key={p.id} value={p.id}>{p.anioPeriodo || `${p.anio} - ${p.periodo}`}{occupied.has(p.id) ? ' (ya tiene proceso)' : ''}</option>)}</select></label><label>Copiar promociones de<select value={form.procesoBaseId} onChange={e => set('procesoBaseId', e.target.value)}><option value="">Sin proceso base</option>{procesos.map(p => <option key={p.id} value={p.id}>{p.periodo}</option>)}</select></label></>}
    <label>SMMLV (COP)<input required min="0.0001" type="number" step="0.0001" value={form.valorSmmlv} onChange={e => set('valorSmmlv', e.target.value)} /></label>
    <label>Fuente del SMMLV (opcional)<input value={form.fuenteSmmlv} onChange={e => set('fuenteSmmlv', e.target.value)} /></label>
    <label>Fecha límite de respuesta<input required type="date" value={form.fechaLimiteRespuesta} onChange={e => set('fechaLimiteRespuesta', e.target.value)} /></label>
    <label>Descuento por votación (%)<input required min="0" max="100" type="number" step="0.0001" value={form.porcentajeVotacion} onChange={e => set('porcentajeVotacion', e.target.value)} /></label>
    <label>Aporte de salud (%)<input required min="0" max="100" type="number" step="0.0001" value={form.porcentajeSalud} onChange={e => set('porcentajeSalud', e.target.value)} /></label>
    <label>Base de salud<select value={form.baseSalud} onChange={e => set('baseSalud', e.target.value)}><option value="SMMLV">SMMLV</option><option value="MATRICULA">Valor de matrícula</option></select></label>
    <div className="mf-form__actions"><button type="button" className="mf-button mf-button--secondary" onClick={onCancel}>Cancelar</button><button className="mf-button" type="submit">{busy ? 'Guardando…' : 'Guardar proceso'}</button></div>
  </fieldset></form>
}

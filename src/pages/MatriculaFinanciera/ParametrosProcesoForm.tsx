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
  const [form, setForm] = useState({ periodoId: '', valorSmmlv: proceso ? String(proceso.valorSmmlv) : '', fuenteSmmlv: proceso?.fuenteSmmlv ?? '', porcentajeVotacion: String(proceso?.porcentajeVotacion ?? 10), porcentajeSalud: String(proceso?.porcentajeSalud ?? 10), fechaLimiteRespuesta: proceso?.fechaLimiteRespuesta ?? '' })
  const occupied = new Set(procesos.map(p => p.periodoId))
  const set = (key: keyof typeof form, value: string) => setForm(previous => ({ ...previous, [key]: value }))
  return <form className="mf-card" onSubmit={e => {
    e.preventDefault()
    const parametros: ParametrosProceso = { valorSmmlv: Number(form.valorSmmlv), fuenteSmmlv: form.fuenteSmmlv.trim() || null, porcentajeVotacion: Number(form.porcentajeVotacion), porcentajeSalud: Number(form.porcentajeSalud), baseSalud: 'SMMLV', fechaLimiteRespuesta: form.fechaLimiteRespuesta }
    void onSave({ ...parametros, periodoId: proceso?.periodoId ?? Number(form.periodoId) })
  }}><fieldset disabled={busy} className="mf-form mf-fieldset"><div className="mf-form__heading"><h2>{proceso ? 'Editar parámetros' : 'Crear proceso'}</h2><p>{proceso ? 'Guardar recalcula las filas sin valor final manual. Revisa los valores antes de exportar nuevamente.' : 'Selecciona un periodo libre y configura los valores del proceso.'}</p>{proceso?.baseSalud === 'MATRICULA' && <p className="mf-notice">Este proceso usa históricamente la matrícula como base de salud. Al guardar se aplicará SMMLV y el backend recalculará según las reglas actuales.</p>}</div>
    {!proceso && <label>Periodo académico<select required value={form.periodoId} onChange={e => set('periodoId', e.target.value)}><option value="">Selecciona un periodo</option>{periodos.map(p => <option disabled={occupied.has(p.id)} key={p.id} value={p.id}>{p.anioPeriodo || `${p.anio} - ${p.periodo}`}{occupied.has(p.id) ? ' (ya tiene proceso)' : ''}</option>)}</select></label>}
    <label>Valor del SMMLV para la liquidación (COP)<input required min="0.0001" type="number" step="0.0001" value={form.valorSmmlv} onChange={e => set('valorSmmlv', e.target.value)} /><small>Valor del salario mínimo que se utilizará para calcular los costos del periodo.</small></label>
    <label>Fuente normativa del SMMLV (opcional)<input value={form.fuenteSmmlv} onChange={e => set('fuenteSmmlv', e.target.value)} /><small>Documento, resolución o referencia institucional que respalda el valor registrado.</small></label>
    <label>Fecha límite para recibir respuestas<input required type="date" value={form.fechaLimiteRespuesta} onChange={e => set('fechaLimiteRespuesta', e.target.value)} /><small>Último día en que los estudiantes podrán diligenciar o modificar sus respuestas.</small></label>
    <label>Descuento por certificado electoral (%)<input required min="0" max="100" type="number" step="0.0001" value={form.porcentajeVotacion} onChange={e => set('porcentajeVotacion', e.target.value)} /><small>Porcentaje descontado cuando se acredita un certificado de votación vigente.</small></label>
    <label>Porcentaje del aporte de salud UIS<input required min="0" max="100" type="number" step="0.0001" value={form.porcentajeSalud} onChange={e => set('porcentajeSalud', e.target.value)} /><small>Porcentaje utilizado para calcular el valor de los derechos de salud solicitados.</small></label>
    <div className="mf-form__actions"><button type="button" className="mf-button mf-button--secondary" onClick={onCancel}>Cancelar</button><button className="mf-button" type="submit">{busy ? proceso ? 'Guardando…' : 'Creando…' : proceso ? 'Guardar cambios' : 'Crear proceso'}</button></div>
  </fieldset></form>
}

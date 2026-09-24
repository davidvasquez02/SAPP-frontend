import { useCallback, useState } from 'react'
import { buscarEstudiantes } from '../../modules/matricula-financiera/api'
import { useConsulta } from '../../modules/matricula-financiera/hooks'
import type { TipoEstudianteLiquidacion } from '../../modules/matricula-financiera/types'
import { Aviso } from './FinancieraUi'

interface AgregarEstudianteProps { busy: boolean; onAdd: (body: { estudianteId: number; tipoEstudiante: TipoEstudianteLiquidacion }) => Promise<boolean> }
export function AgregarEstudiante({ busy, onAdd }: AgregarEstudianteProps) {
  const [texto, setTexto] = useState(''); const [query, setQuery] = useState(''); const [selected, setSelected] = useState(''); const [tipo, setTipo] = useState<TipoEstudianteLiquidacion>('VIGENTE')
  const consulta = useConsulta(useCallback((signal: AbortSignal) => query ? buscarEstudiantes(query, signal) : Promise.resolve([]), [query]))
  return <section className="mf-card"><h2>Agregar estudiante manualmente</h2><p>Para reingresos o casos fuera de la convocatoria automática. El estudiante debe tener código UIS y estar registrado en SAPP.</p><Aviso error={consulta.error} />
    <form className="mf-filters" onSubmit={e => { e.preventDefault(); setSelected(''); if (query === texto.trim()) consulta.refresh(); else setQuery(texto.trim()) }}><label>Buscar por código o nombre<input required value={texto} disabled={busy} onChange={e => setTexto(e.target.value)} /></label><button className="mf-button mf-button--secondary" disabled={busy || consulta.loading || !texto.trim()}>Buscar</button></form>
    {consulta.loading && query && <p role="status">Buscando estudiantes…</p>}
    {query && !consulta.loading && !consulta.error && <form className="mf-form" onSubmit={e => { e.preventDefault(); void onAdd({ estudianteId: Number(selected), tipoEstudiante: tipo }).then(ok => { if (ok) setSelected('') }) }}><label>Estudiante<select required disabled={busy} value={selected} onChange={e => setSelected(e.target.value)}><option value="">Selecciona un resultado</option>{(consulta.data ?? []).map(s => <option key={s.id} value={s.id}>{s.codigoNombre}</option>)}</select></label><label>Tipo<select value={tipo} disabled={busy} onChange={e => setTipo(e.target.value as TipoEstudianteLiquidacion)}><option value="VIGENTE">Vigente</option><option value="NUEVO">Nuevo</option></select></label>{!consulta.data?.length && <p>No se encontraron estudiantes.</p>}<button className="mf-button" disabled={busy || !selected}>Agregar al proceso</button></form>}
  </section>
}

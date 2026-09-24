import { useState } from 'react'
import type { PreguntaLiquidacion, RespuestasCoordinacionRequest, RespuestasLiquidacion, TipoEstudianteLiquidacion } from '../../modules/matricula-financiera/types'
import { seleccionarRespuestas } from '../../modules/matricula-financiera/rules'

interface RespuestasFormProps {
  respuestas: RespuestasLiquidacion
  tipo: TipoEstudianteLiquidacion
  preguntas: PreguntaLiquidacion[]
  busy: boolean
  editable: boolean
  coordinacion?: boolean
  recibido?: boolean
  observaciones?: string | null
  onSave: (value: RespuestasCoordinacionRequest) => Promise<void>
}
export function RespuestasForm({ respuestas, tipo, preguntas, busy, editable, coordinacion = false, recibido = false, observaciones, onSave }: RespuestasFormProps) {
  const [answers, setAnswers] = useState(respuestas)
  const [certificado, setCertificado] = useState(recibido)
  const [cambioRecibido, setCambioRecibido] = useState(false)
  const [notas, setNotas] = useState(observaciones ?? '')
  return <form className="mf-questions" onSubmit={e => { e.preventDefault(); void onSave({ ...seleccionarRespuestas(answers, tipo, preguntas), ...(coordinacion ? { ...(cambioRecibido ? { certificadoVotacionRecibido: certificado } : {}), observaciones: notas.trim() || null } : {}) }) }}>
    {preguntas.filter(q => q.aplica).map(q => <fieldset disabled={busy || !editable} key={q.clave}><legend>{q.texto}</legend>{editable ? <><label><input required type="radio" name={q.clave} checked={answers[q.clave] === true} onChange={() => setAnswers({ ...answers, [q.clave]: true })} />Sí</label><label><input required type="radio" name={q.clave} checked={answers[q.clave] === false} onChange={() => setAnswers({ ...answers, [q.clave]: false })} />No</label>{answers[q.clave] == null && <small>Sin responder</small>}</> : <span>{respuestas[q.clave] == null ? 'Sin responder' : respuestas[q.clave] ? 'Sí' : 'No'}</span>}</fieldset>)}
    {coordinacion && <fieldset className="mf-form mf-fieldset" disabled={busy || !editable}><label className="mf-check"><input type="checkbox" checked={certificado} onChange={e => { setCertificado(e.target.checked); setCambioRecibido(true) }} />Certificado recibido (documento o recepción por correo)</label><label>Observaciones<textarea value={notas} onChange={e => setNotas(e.target.value)} /></label></fieldset>}
    {editable && <button disabled={busy} className="mf-button" type="submit">{busy ? 'Guardando…' : coordinacion ? 'Registrar respuestas' : 'Guardar respuestas'}</button>}
  </form>
}


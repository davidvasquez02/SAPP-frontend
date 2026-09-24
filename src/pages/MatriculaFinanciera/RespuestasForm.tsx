import { useState } from 'react'
import type { PreguntaLiquidacion, RespuestasCoordinacionRequest, RespuestasLiquidacion, TipoEstudianteLiquidacion } from '../../modules/matricula-financiera/types'
import type { ReactNode } from 'react'
import { respuestasCompletas, seleccionarRespuestas } from '../../modules/matricula-financiera/rules'

interface RespuestasFormProps {
  respuestas: RespuestasLiquidacion
  tipo: TipoEstudianteLiquidacion
  preguntas: PreguntaLiquidacion[]
  busy: boolean
  editable: boolean
  coordinacion?: boolean
  observaciones?: string | null
  renderCertificado?: () => ReactNode
  onSave: (value: RespuestasCoordinacionRequest) => Promise<void>
}
export function RespuestasForm({ respuestas, tipo, preguntas, busy, editable, coordinacion = false, observaciones, renderCertificado, onSave }: RespuestasFormProps) {
  const [answers, setAnswers] = useState(respuestas)
  const [notas, setNotas] = useState(observaciones ?? '')
  const completas = respuestasCompletas(answers, tipo, preguntas)
  return <form className="mf-questions" onSubmit={e => { e.preventDefault(); if (!completas) return; void onSave({ ...seleccionarRespuestas(answers, tipo, preguntas), ...(coordinacion ? { certificadoVotacionRecibido: answers.certificadoVotacion === true, observaciones: notas.trim() || null } : {}) }) }}>
    {preguntas.filter(q => q.aplica).map(q => <fieldset disabled={busy || !editable} key={q.clave}><legend>{q.texto}</legend>{editable ? <><label><input required type="radio" name={q.clave} checked={answers[q.clave] === true} onChange={() => setAnswers({ ...answers, [q.clave]: true })} />Sí</label><label><input required type="radio" name={q.clave} checked={answers[q.clave] === false} onChange={() => setAnswers({ ...answers, [q.clave]: false })} />No</label>{answers[q.clave] == null && <small>Sin responder</small>}</> : <span>{respuestas[q.clave] == null ? 'Sin responder' : respuestas[q.clave] ? 'Sí' : 'No'}</span>}</fieldset>)}
    {answers.certificadoVotacion === true && renderCertificado?.()}
    {coordinacion && <fieldset className="mf-form mf-fieldset" disabled={busy || !editable}><label>Observaciones (opcional)<textarea value={notas} onChange={e => setNotas(e.target.value)} /></label></fieldset>}
    {editable && <button disabled={busy || !completas} className="mf-button" type="submit">{busy ? 'Guardando…' : coordinacion ? 'Registrar respuestas' : 'Guardar respuestas'}</button>}
  </form>
}

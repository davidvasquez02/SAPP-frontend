import { useState } from 'react'
import type { PreguntaLiquidacion, RespuestasCoordinacionRequest, RespuestasLiquidacion, TipoEstudianteLiquidacion } from '../../modules/matricula-financiera/types'
import type { ReactNode } from 'react'
import { ordenarPreguntasEstudiante, respuestasListasParaGuardar, seleccionarRespuestas } from '../../modules/matricula-financiera/rules'

interface RespuestasFormProps {
  respuestas: RespuestasLiquidacion
  tipo: TipoEstudianteLiquidacion
  preguntas: PreguntaLiquidacion[]
  busy: boolean
  editable: boolean
  coordinacion?: boolean
  observaciones?: string | null
  renderCertificado?: (onValidChange: (valid: boolean) => void) => ReactNode
  onSave: (value: RespuestasCoordinacionRequest) => Promise<boolean | void>
  onDirtyChange?: (dirty: boolean) => void
}
export function RespuestasForm({ respuestas, tipo, preguntas, busy, editable, coordinacion = false, observaciones, renderCertificado, onSave, onDirtyChange }: RespuestasFormProps) {
  const [answers, setAnswers] = useState(respuestas)
  const [notas, setNotas] = useState(observaciones ?? '')
  const [certificadoValido, setCertificadoValido] = useState(false)
  const puedeGuardar = respuestasListasParaGuardar(answers, tipo, preguntas, certificadoValido, coordinacion)
  const preguntasVisibles = coordinacion ? preguntas : ordenarPreguntasEstudiante(preguntas)
  const updateAnswers = (next: RespuestasLiquidacion) => { if (!coordinacion && next.certificadoVotacion === true && answers.certificadoVotacion !== true) setCertificadoValido(false); setAnswers(next); onDirtyChange?.(true) }
  return <form className="mf-questions" onSubmit={e => { e.preventDefault(); if (!puedeGuardar) return; void onSave({ ...seleccionarRespuestas(answers, tipo, preguntas), ...(coordinacion ? { certificadoVotacionRecibido: answers.certificadoVotacion === true, observaciones: notas.trim() || null } : {}) }).then(saved => { if (saved !== false) onDirtyChange?.(false) }) }}>
    {preguntasVisibles.filter(q => q.aplica).map(q => <fieldset disabled={busy || !editable} key={q.clave}><legend>{q.texto}</legend>{editable ? <><label><input required type="radio" name={q.clave} checked={answers[q.clave] === true} onChange={() => updateAnswers({ ...answers, [q.clave]: true })} />Sí</label><label><input required type="radio" name={q.clave} checked={answers[q.clave] === false} onChange={() => updateAnswers({ ...answers, [q.clave]: false })} />No</label>{answers[q.clave] == null && <small>Sin responder</small>}</> : <span>{respuestas[q.clave] == null ? 'Sin responder' : respuestas[q.clave] ? 'Sí' : 'No'}</span>}</fieldset>)}
    {answers.certificadoVotacion === true && renderCertificado?.(setCertificadoValido)}
    {!coordinacion && answers.certificadoVotacion === true && !certificadoValido && <p className="mf-notice">Carga correctamente el certificado de votación para habilitar el guardado de respuestas.</p>}
    {coordinacion && <fieldset className="mf-form mf-fieldset" disabled={busy || !editable}><label>Observaciones (opcional)<textarea value={notas} onChange={e => { setNotas(e.target.value); onDirtyChange?.(true) }} /></label></fieldset>}
    {editable && <button disabled={busy || !puedeGuardar} className="mf-button" type="submit">{busy ? 'Guardando…' : coordinacion ? 'Registrar respuestas' : 'Guardar respuestas'}</button>}
  </form>
}

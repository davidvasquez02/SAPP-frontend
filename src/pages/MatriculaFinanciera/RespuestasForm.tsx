import { useCallback, useState } from 'react'
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
  renderCertificado?: (onValidChange: (valid: boolean) => void, onPendingUploadChange: (upload: (() => Promise<boolean>) | null) => void) => ReactNode
  onSave: (value: RespuestasCoordinacionRequest) => Promise<boolean | void>
  onDirtyChange?: (dirty: boolean) => void
}
export function RespuestasForm({ respuestas, tipo, preguntas, busy, editable, coordinacion = false, observaciones, renderCertificado, onSave, onDirtyChange }: RespuestasFormProps) {
  const [answers, setAnswers] = useState(respuestas)
  const [notas, setNotas] = useState(observaciones ?? '')
  const [certificadoValido, setCertificadoValido] = useState(false)
  const [cargarCertificadoPendiente, setCargarCertificadoPendiente] = useState<(() => Promise<boolean>) | null>(null)
  const registrarCargaPendiente = useCallback((upload: (() => Promise<boolean>) | null) => setCargarCertificadoPendiente(() => upload), [])
  const certificadoDisponible = certificadoValido || cargarCertificadoPendiente !== null
  const puedeGuardar = respuestasListasParaGuardar(answers, tipo, preguntas, certificadoDisponible, coordinacion)
  const preguntasVisibles = coordinacion ? preguntas : ordenarPreguntasEstudiante(preguntas)
  const updateAnswers = (next: RespuestasLiquidacion) => { if (!coordinacion && next.certificadoVotacion === true && answers.certificadoVotacion !== true) setCertificadoValido(false); setAnswers(next); onDirtyChange?.(true) }
  const save = async () => {
    if (!puedeGuardar) return
    if (cargarCertificadoPendiente && !await cargarCertificadoPendiente()) return
    const saved = await onSave({ ...seleccionarRespuestas(answers, tipo, preguntas), ...(coordinacion ? { certificadoVotacionRecibido: answers.certificadoVotacion === true, observaciones: notas.trim() || null } : {}) })
    if (saved !== false) onDirtyChange?.(false)
  }
  return <form className="mf-questions" onSubmit={e => { e.preventDefault(); void save() }}>
    {preguntasVisibles.filter(q => q.aplica).map(q => <fieldset disabled={busy || !editable} key={q.clave}><legend>{q.texto}</legend>{editable ? <><label><input required type="radio" name={q.clave} checked={answers[q.clave] === true} onChange={() => updateAnswers({ ...answers, [q.clave]: true })} />Sí</label><label><input required type="radio" name={q.clave} checked={answers[q.clave] === false} onChange={() => updateAnswers({ ...answers, [q.clave]: false })} />No</label>{answers[q.clave] == null && <small>Sin responder</small>}</> : <span>{respuestas[q.clave] == null ? 'Sin responder' : respuestas[q.clave] ? 'Sí' : 'No'}</span>}</fieldset>)}
    {answers.certificadoVotacion === true && renderCertificado?.(setCertificadoValido, registrarCargaPendiente)}
    {!coordinacion && answers.certificadoVotacion === true && !certificadoDisponible && <p className="mf-notice">Selecciona el certificado de votación para guardar las respuestas.</p>}
    {coordinacion && (editable ? <fieldset className="mf-form mf-fieldset" disabled={busy}><label>Observaciones (opcional)<textarea value={notas} onChange={e => { setNotas(e.target.value); onDirtyChange?.(true) }} /></label></fieldset> : <div className="mf-readonly-field"><strong>Observaciones</strong><p>{observaciones?.trim() || 'Sin observaciones'}</p></div>)}
    {editable && <button disabled={busy || !puedeGuardar} className="mf-button" type="submit">{busy ? 'Guardando…' : coordinacion ? 'Registrar respuestas' : 'Guardar respuestas'}</button>}
  </form>
}

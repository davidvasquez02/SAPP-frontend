import { useEffect, useState } from 'react'
import { getPeriodoMatriculaVigente } from '../../../matricula/services/matriculaAcademicaService'
import { enviarRecordatoriosCandidatura } from '../../evaluacion/api'
import './RecordatoriosCandidatura.css'

const RecordatoriosCandidatura = () => {
  const [confirmando, setConfirmando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mostrarRecordatorios, setMostrarRecordatorios] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false

    void getPeriodoMatriculaVigente()
      .then((periodoVigente) => {
        if (!cancelled) {
          setMostrarRecordatorios(periodoVigente?.periodo.notificacionCandidaturaEnviada !== true)
        }
      })
      .catch(() => {
        if (!cancelled) {
          // Si no es posible validar el período, se conserva la acción disponible.
          setMostrarRecordatorios(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const cerrarConfirmacion = () => {
    if (!enviando) setConfirmando(false)
  }

  const confirmarEnvio = async () => {
    setEnviando(true)
    setError(null)
    setMensaje(null)

    try {
      const enviados = await enviarRecordatoriosCandidatura()
      setMensaje(
        enviados === 1
          ? 'Se envió 1 recordatorio de examen de candidatura doctoral.'
          : `Se enviaron ${enviados} recordatorios de examen de candidatura doctoral.`,
      )
      setConfirmando(false)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'No fue posible enviar los recordatorios de candidatura doctoral.',
      )
    } finally {
      setEnviando(false)
    }
  }

  if (mostrarRecordatorios !== true) {
    return null
  }

  return (
    <section className="recordatorios-candidatura" aria-labelledby="recordatorios-candidatura-title">
      <div>
        <p className="recordatorios-candidatura__eyebrow">Examen de candidatura doctoral</p>
        <h3 id="recordatorios-candidatura-title">Recordatorios por correo</h3>
        <p>
          Envía manualmente un correo a todos los estudiantes que deben recibir el recordatorio.
          El servidor determina los destinatarios elegibles.
        </p>
      </div>
      <button type="button" onClick={() => { setError(null); setMensaje(null); setConfirmando(true) }}>
        Enviar recordatorios
      </button>

      {mensaje ? <p className="recordatorios-candidatura__feedback" role="status">{mensaje}</p> : null}
      {error ? <p className="recordatorios-candidatura__feedback recordatorios-candidatura__feedback--error" role="alert">{error}</p> : null}

      {confirmando ? (
        <div className="recordatorios-candidatura__backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) cerrarConfirmacion()
        }}>
          <section
            className="recordatorios-candidatura__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="recordatorios-candidatura-dialog-title"
            aria-describedby="recordatorios-candidatura-dialog-description"
          >
            <h2 id="recordatorios-candidatura-dialog-title">Confirmar envío de recordatorios</h2>
            <p id="recordatorios-candidatura-dialog-description">
              Esta acción enviará correos a todos los estudiantes que el servidor identifique como
              pendientes del examen de candidatura doctoral.
            </p>
            {error ? <p className="recordatorios-candidatura__feedback recordatorios-candidatura__feedback--error" role="alert">{error}</p> : null}
            <div className="recordatorios-candidatura__dialog-actions">
              <button type="button" className="recordatorios-candidatura__secondary" disabled={enviando} onClick={cerrarConfirmacion}>
                Cancelar
              </button>
              <button type="button" disabled={enviando} onClick={() => void confirmarEnvio()}>
                {enviando ? 'Enviando…' : 'Confirmar y enviar'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  )
}

export default RecordatoriosCandidatura

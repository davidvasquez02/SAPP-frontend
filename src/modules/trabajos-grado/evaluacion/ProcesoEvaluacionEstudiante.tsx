import { presentarNotaFinalCandidatura, presentarValorEvaluacion } from './presentacionEvaluacion'
import { obtenerDetalleSustentacion, tieneDetalleSustentacion } from './sustentacion'
import type { ProcesoEvaluacionTg } from './types'
import './ProcesoEvaluacionEstudiante.css'

interface ProcesoEvaluacionEstudianteProps {
  proceso: ProcesoEvaluacionTg
}

const formatDate = (value?: string | null, includeTime = false) => {
  if (!value) return null
  const hasExplicitTimeZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)
  const normalizedValue = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T12:00:00-05:00`
    : hasExplicitTimeZone ? value : `${value}-05:00`
  const date = new Date(normalizedValue)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    dateStyle: 'long',
    ...(includeTime ? { timeStyle: 'short' as const } : {}),
  }).format(date)
}

const ProcesoEvaluacionEstudiante = ({ proceso }: ProcesoEvaluacionEstudianteProps) => {
  const evaluadores = proceso.jurados
    .filter((jurado) => jurado.activo)
    .sort((first, second) => (first.orden ?? 0) - (second.orden ?? 0))
  const resultado = proceso.resultadoNombre || proceso.resultado || proceso.resultadoCodigo
  const fechaResultado = formatDate(proceso.fechaResultado)
  const notaFinal = presentarNotaFinalCandidatura(proceso.notaFinal, proceso.tipoSolicitudCodigo)
  const sustentacion = obtenerDetalleSustentacion(proceso)
  const fechaSustentacion = formatDate(sustentacion.fecha, true)

  return (
    <section className="evaluacion-estudiante" aria-labelledby="evaluacion-estudiante-title">
      <header className="evaluacion-estudiante__header">
        <div>
          <p className="evaluacion-estudiante__eyebrow">Evaluación del proyecto de grado</p>
          <h3 id="evaluacion-estudiante-title">Resultado de la evaluación</h3>
          <p>Consulta el resultado y los conceptos emitidos por tus evaluadores.</p>
        </div>
        <div className="evaluacion-estudiante__result" aria-label={`Resultado: ${resultado || 'Pendiente'}`}>
          <span>Resultado</span>
          <strong>{resultado || 'Pendiente'}</strong>
          {notaFinal && <small>Nota final: {notaFinal}</small>}
          {fechaResultado && <small>Registrado el {fechaResultado}</small>}
        </div>
      </header>

      {tieneDetalleSustentacion(sustentacion) && (
        <dl className="evaluacion-estudiante__defense" aria-label="Información de la sustentación">
          {fechaSustentacion && <div><dt>Fecha de sustentación</dt><dd>{fechaSustentacion}</dd></div>}
          {sustentacion.modalidad && <div><dt>Modalidad</dt><dd>{sustentacion.modalidad}</dd></div>}
          {sustentacion.lugar && <div><dt>Lugar</dt><dd>{sustentacion.lugar}</dd></div>}
          {sustentacion.esVirtual && sustentacion.enlace && (
            <div><dt>Enlace de sustentación</dt><dd><a href={sustentacion.enlace} target="_blank" rel="noreferrer">Ingresar a la sustentación</a></dd></div>
          )}
        </dl>
      )}

      <div className="evaluacion-estudiante__section-heading">
        <h4>Conceptos de los evaluadores</h4>
        <span>{evaluadores.length} evaluador{evaluadores.length === 1 ? '' : 'es'}</span>
      </div>

      {evaluadores.length === 0 ? (
        <p className="evaluacion-estudiante__empty">Aún no hay evaluadores activos registrados.</p>
      ) : (
        <div className="evaluacion-estudiante__list">
          {evaluadores.map((jurado) => (
            <article className="evaluacion-estudiante__evaluator" key={jurado.id}>
              <div className="evaluacion-estudiante__evaluator-heading">
                <div>
                  <h5>{jurado.nombre}</h5>
                  {jurado.institucion && <p>{jurado.institucion}</p>}
                </div>
                <span>{jurado.estadoInvitacionNombre || jurado.estadoInvitacion}</span>
              </div>

              {jurado.evaluaciones.length === 0 ? (
                <p className="evaluacion-estudiante__empty">Evaluación pendiente.</p>
              ) : (
                <div className="evaluacion-estudiante__evaluations">
                  {jurado.evaluaciones.map((evaluacion) => {
                    const presentation = presentarValorEvaluacion(evaluacion, proceso.tipoSolicitudCodigo)
                    const momento = evaluacion.momentoNombre || evaluacion.momento || evaluacion.momentoCodigo
                    const observaciones = evaluacion.observaciones?.trim()

                    return (
                      <section key={evaluacion.id} className="evaluacion-estudiante__evaluation">
                        <h6>{momento}</h6>
                        <dl>
                          <div>
                            <dt>{presentation.etiqueta}</dt>
                            <dd>{presentation.valor ?? 'Sin concepto registrado.'}</dd>
                          </div>
                          <div>
                            <dt>Observaciones</dt>
                            <dd>{observaciones || 'Sin observaciones.'}</dd>
                          </div>
                        </dl>
                      </section>
                    )
                  })}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default ProcesoEvaluacionEstudiante

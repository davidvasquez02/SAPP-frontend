import './MatriculaClosedState.css'

type MatriculaClosedStateProps = {
  message?: string
}

const MatriculaClosedState = ({ message }: MatriculaClosedStateProps) => {
  return (
    <section className="matricula-closed-state" aria-live="polite">
      <span className="matricula-closed-state__icon" aria-hidden="true" />
      <div>
        <h3 className="matricula-closed-state__title">No hay fechas de matrícula habilitadas actualmente.</h3>
        {message ? <p className="matricula-closed-state__message">{message}</p> : null}
      </div>
    </section>
  )
}

export default MatriculaClosedState

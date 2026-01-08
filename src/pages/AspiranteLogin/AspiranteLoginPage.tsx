import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/Auth'
import './AspiranteLoginPage.css'

const AspiranteLoginPage = () => {
  const { loginAspirante } = useAuth()
  const navigate = useNavigate()
  const [numeroAspirante, setNumeroAspirante] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await loginAspirante(numeroAspirante)
      navigate('/aspirante/documentos', { replace: true })
    } catch (loginError) {
      if (loginError instanceof Error) {
        setError(loginError.message)
      } else {
        setError('No fue posible validar el número de aspirante.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="aspirante-login">
      <div className="aspirante-login__card">
        <h1 className="aspirante-login__title">Ingreso aspirante</h1>
        <p className="aspirante-login__subtitle">
          Digita tu número de aspirante para continuar.
        </p>
        <form className="aspirante-login__form" onSubmit={handleSubmit}>
          <label className="aspirante-login__field">
            Número de aspirante
            <input
              type="text"
              name="numeroAspirante"
              value={numeroAspirante}
              onChange={(event) => setNumeroAspirante(event.target.value)}
              placeholder="Ej: 1234"
            />
          </label>
          {error ? <p className="aspirante-login__error">{error}</p> : null}
          <button type="submit" className="aspirante-login__primary" disabled={isSubmitting}>
            {isSubmitting ? 'Validando...' : 'Validar'}
          </button>
        </form>
        <button
          type="button"
          className="aspirante-login__back"
          onClick={() => navigate('/login')}
        >
          Volver
        </button>
      </div>
    </div>
  )
}

export default AspiranteLoginPage

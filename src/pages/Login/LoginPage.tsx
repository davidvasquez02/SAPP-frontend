import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/Auth'
import './LoginPage.css'

const LoginPage = () => {
  const { login, isAuthenticated, session, initializationError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAspirante, setIsAspirante] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !session) {
      return
    }

    if (session.kind === 'ASPIRANTE') {
      navigate('/aspirante/documentos', { replace: true })
      return
    }

    navigate('/', { replace: true })
  }, [isAuthenticated, navigate, session])

  const handleRetry = async () => {
    setError(null)
    setIsSubmitting(true)

    try {
      await login()
      const redirectPath = (location.state as { from?: { pathname: string } } | undefined)?.from
        ?.pathname
      navigate(redirectPath ?? '/', { replace: true })
    } catch (loginError) {
      if (loginError instanceof Error) {
        setError(loginError.message)
      } else {
        setError('No fue posible iniciar sesión.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAspiranteToggle = (checked: boolean) => {
    setIsAspirante(checked)

    if (checked) {
      navigate('/borrar/aspirante')
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">SAPP</h1>
        <p className="login-subtitle">
          Sistema de apoyo a procesos de posgrado. Ingresa con tu usuario institucional.
        </p>
        <label className="login-toggle">
          <input
            type="checkbox"
            checked={isAspirante}
            onChange={(event) => handleAspiranteToggle(event.target.checked)}
          />
          Soy aspirante (no estudiante)
        </label>
        {!isAspirante ? (
          <div className="login-form">
            <p className="login-error">
              {error ?? initializationError ?? 'No fue posible cargar la sesión institucional.'}
            </p>
            <button className="login-button" type="button" disabled={isSubmitting} onClick={handleRetry}>
              {isSubmitting ? 'Validando...' : 'Reintentar'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default LoginPage

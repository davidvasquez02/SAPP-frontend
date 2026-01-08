import { FormEvent, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/Auth'
import './LoginPage.css'

const LoginPage = () => {
  const { login, isAuthenticated, session } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await login(username, password)
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

  const handleAspiranteContinue = () => {
    navigate('/login/aspirante')
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">SAPP Posgrados</h1>
        <p className="login-subtitle">Ingresa con tu usuario institucional.</p>
        <label className="login-toggle">
          <input
            type="checkbox"
            checked={isAspirante}
            onChange={(event) => setIsAspirante(event.target.checked)}
          />
          Soy aspirante (no estudiante)
        </label>
        {!isAspirante ? (
          <form className="login-form" onSubmit={handleSubmit}>
            <label className="login-field">
              Usuario
              <input
                type="text"
                name="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="usuario"
                autoComplete="username"
              />
            </label>
            <label className="login-field">
              Contraseña
              <input
                type="password"
                name="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </label>
            {error ? <p className="login-error">{error}</p> : null}
            <button className="login-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Validando...' : 'Ingresar'}
            </button>
          </form>
        ) : (
          <button type="button" className="login-button" onClick={handleAspiranteContinue}>
            Continuar
          </button>
        )}
      </div>
    </div>
  )
}

export default LoginPage

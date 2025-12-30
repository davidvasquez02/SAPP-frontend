import type { FormEvent } from 'react'

interface LoginViewProps {
  email: string
  password: string
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

const LoginView = ({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: LoginViewProps) => {
  return (
    <main className="login">
      <section className="login__panel">
        <header className="login__header">
          <span className="login__badge">SAPP</span>
          <h1>Bienvenido</h1>
          <p>
            Accede con tus credenciales. Más adelante este flujo se conectará a un
            servicio de autenticación.
          </p>
        </header>
        <form className="login__form" onSubmit={onSubmit}>
          <label className="login__field">
            <span>Correo electrónico</span>
            <input
              type="email"
              name="email"
              placeholder="usuario@empresa.com"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              required
            />
          </label>
          <label className="login__field">
            <span>Contraseña</span>
            <input
              type="password"
              name="password"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              required
            />
          </label>
          <button type="submit" className="login__submit">
            Ingresar
          </button>
        </form>
      </section>
      <aside className="login__aside">
        <div>
          <h2>Portal de acceso</h2>
          <p>
            Configura tus flujos de autenticación y la consulta al backend cuando el
            servicio esté disponible.
          </p>
        </div>
      </aside>
    </main>
  )
}

export default LoginView

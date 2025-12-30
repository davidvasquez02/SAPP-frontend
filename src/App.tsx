import { useState } from 'react'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsAuthenticated(true)
  }

  if (isAuthenticated) {
    return (
      <main className="home">
        <div className="home__content">
          <h1>Inicio</h1>
          <p>Esta pantalla quedará disponible para mostrar la información del backend.</p>
          <div className="home__empty">Sin datos por ahora.</div>
        </div>
      </main>
    )
  }

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
        <form className="login__form" onSubmit={handleSubmit}>
          <label className="login__field">
            <span>Correo electrónico</span>
            <input
              type="email"
              name="email"
              placeholder="usuario@empresa.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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
              onChange={(event) => setPassword(event.target.value)}
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

export default App

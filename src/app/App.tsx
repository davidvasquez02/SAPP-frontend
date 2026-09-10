import { AppRoutes } from './routes'
import { useAuth } from '../context/Auth'

const App = () => {
  const { isInitializing } = useAuth()

  if (isInitializing) {
    return <main aria-live="polite">Cargando sesión institucional...</main>
  }

  return (
    <AppRoutes />
  )
}

export default App

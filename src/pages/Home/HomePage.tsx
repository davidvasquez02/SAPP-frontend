import { ModuleLayout } from '../../components'
import { useAuth } from '../../context/Auth'
import './HomePage.css'

const HomePage = () => {
  const { user } = useAuth()
  const displayName = user
    ? 'username' in user
      ? user.nombreCompleto || user.username
      : user.numeroInscripcionUis || user.numeroDocumento
    : 'Usuario'

  return (
    <ModuleLayout title="Inicio">
      <p className="home-page__welcome">Bienvenido/a, {displayName}</p>
      <p className="home-page__lead">Selecciona una opción del menú</p>
    </ModuleLayout>
  )
}

export default HomePage

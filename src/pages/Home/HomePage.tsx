import { ModuleLayout } from '../../components/ModuleLayout'
import { useAuth } from '../../context/Auth'
import './HomePage.css'

const HomePage = () => {
  const { user } = useAuth()
  const displayName = user?.nombreCompleto || user?.username || 'Usuario'

  return (
    <ModuleLayout title="Inicio">
      <p className="home-page__welcome">Bienvenido/a, {displayName}</p>
      <p className="home-page__lead">Selecciona una opción del menú</p>
    </ModuleLayout>
  )
}

export default HomePage

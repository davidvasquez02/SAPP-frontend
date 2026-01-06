import { ModuleLayout } from '../../components/ModuleLayout'
import './HomePage.css'

const HomePage = () => {
  return (
    <ModuleLayout title="Inicio">
      <p className="home-page__lead">
        Selecciona un módulo para continuar con tus trámites de posgrado.
      </p>
    </ModuleLayout>
  )
}

export default HomePage

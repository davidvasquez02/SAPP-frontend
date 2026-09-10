import { Link } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import { getPrimaryNavigationItems } from '../../app/navigationItems'
import { useAuth } from '../../context/Auth'
import { SidebarModuleIcon } from '../../components/Sidebar/SidebarModuleIcon'
import './HomePage.css'

const HomePage = () => {
  const { session } = useAuth()

  const roles = session?.kind === 'SAPP' ? session.user.roles : []
  const shortcuts = getPrimaryNavigationItems(roles)

  return (
    <ModuleLayout title="Inicio">
      <p className="home-page__lead">Sistema de apoyo a procesos de posgrado. Acá puedes atender los siguientes procesos: </p>

      <section className="home-page__shortcuts" aria-label="Accesos del sistema">
        {shortcuts.map((item) => (
          <Link key={item.to} to={item.to} className="home-page__shortcut-card" title={item.label}>
            <span className="home-page__shortcut-icon" aria-hidden="true">
              <SidebarModuleIcon
                modulePath={item.to}
                className="home-page__shortcut-icon-svg"
              />
            </span>
            <span className="home-page__shortcut-label">{item.label}</span>
          </Link>
        ))}
      </section>
    </ModuleLayout>
  )
}

export default HomePage

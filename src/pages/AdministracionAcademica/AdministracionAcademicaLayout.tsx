import { NavLink, Outlet } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import { EmbeddedModuleContext } from '../../components/ModuleLayout/EmbeddedModuleContext'
import { SidebarModuleIcon } from '../../components/Sidebar/SidebarModuleIcon'
import { SECCIONES_ADMINISTRACION } from '../../modules/administracionAcademica/rutas'
import './AdministracionAcademicaLayout.css'

const AdministracionAcademicaLayout = () => (
  <ModuleLayout title="Administración académica" compactOnMobile>
    <div className="administracion-academica">
      <nav className="administracion-academica__nav" aria-label="Administración académica">
        <p className="administracion-academica__caption">Gestionar</p>
        {SECCIONES_ADMINISTRACION.map(({ to, label, description, icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) =>
            `administracion-academica__link${isActive ? ' administracion-academica__link--active' : ''}`
          }>
            <SidebarModuleIcon modulePath={icon} className="administracion-academica__icon" />
            <span><strong>{label}</strong><small>{description}</small></span>
          </NavLink>
        ))}
      </nav>
      <div className="administracion-academica__content">
        <EmbeddedModuleContext.Provider value={true}>
          <Outlet />
        </EmbeddedModuleContext.Provider>
      </div>
    </div>
  </ModuleLayout>
)

export default AdministracionAcademicaLayout

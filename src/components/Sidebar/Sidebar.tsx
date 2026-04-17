import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/Auth'
import { hasAnyRole, isProfesor, ROLES } from '../../auth/roleGuards'
import './Sidebar.css'

interface SidebarItem {
  to: string
  label: string
  icon: string
  visible?: boolean
}

const Sidebar = () => {
  const { session, logout } = useAuth()
  const navigate = useNavigate()

  const canSeeAdmisiones =
    session?.kind === 'SAPP' &&
    hasAnyRole(session.user.roles, [ROLES.COORDINACION, ROLES.SECRETARIA, ROLES.ADMIN, ROLES.PROFESOR, ROLES.DOCENTE])
  const canSeeGestionEstudiantes =
    session?.kind === 'SAPP' &&
    hasAnyRole(session.user.roles, [ROLES.COORDINACION, ROLES.SECRETARIA, ROLES.ADMIN])
  const isProfesorOnly =
    session?.kind === 'SAPP' &&
    isProfesor(session.user.roles) &&
    !hasAnyRole(session.user.roles, [ROLES.COORDINACION, ROLES.SECRETARIA, ROLES.ADMIN])

  const sidebarItems: SidebarItem[] = [
    { to: '/solicitudes', label: 'Solicitudes', icon: '📝' },
    { to: '/matricula', label: 'Matrícula', icon: '🎓', visible: !isProfesorOnly },
    { to: '/creditos', label: 'Créditos', icon: '💳', visible: !isProfesorOnly },
    { to: '/coordinacion/estudiantes', label: 'Estudiantes', icon: '👥', visible: canSeeGestionEstudiantes },
    { to: '/admisiones', label: 'Admisiones', icon: '📋', visible: canSeeAdmisiones },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside
      className="sidebar"
      aria-label="Navegación principal"
    >
      <div className="sidebar__brand" title="SAPP">
        <span className="sidebar__brand-icon" aria-hidden="true">
          🧭
        </span>
        <span className="sidebar__label">SAPP</span>
      </div>

      <nav className="sidebar__nav">
        {sidebarItems
          .filter((item) => item.visible ?? true)
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
              }
              title={item.label}
            >
              <span className="sidebar__icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="sidebar__label">{item.label}</span>
            </NavLink>
          ))}
      </nav>

      <div className="sidebar__footer">
        <button
          type="button"
          className="sidebar__logout"
          onClick={handleLogout}
          title="Cerrar sesión"
        >
          <span className="sidebar__icon" aria-hidden="true">
            🚪
          </span>
          <span className="sidebar__label">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar

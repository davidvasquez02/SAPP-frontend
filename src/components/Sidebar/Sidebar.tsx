import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/Auth'
import { hasAnyRole, ROLES } from '../../auth/roleGuards'
import './Sidebar.css'

const Sidebar = () => {
  const { session, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const canSeeAdmisiones =
    session?.kind === 'SAPP' &&
    hasAnyRole(session.user.roles, [ROLES.COORDINACION, ROLES.SECRETARIA, ROLES.ADMIN])

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">SAPP</div>
      <nav className="sidebar__nav">
        <NavLink
          to="/solicitudes"
          className={({ isActive }) =>
            `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
          }
        >
          Solicitudes
        </NavLink>
        <NavLink
          to="/matricula"
          className={({ isActive }) =>
            `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
          }
        >
          Matrícula
        </NavLink>
        <NavLink
          to="/creditos"
          className={({ isActive }) =>
            `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
          }
        >
          Créditos
        </NavLink>
        {canSeeAdmisiones ? (
          <NavLink
            to="/coordinacion/estudiantes"
            className={({ isActive }) =>
              `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
            }
          >
            Estudiantes
          </NavLink>
        ) : null}
        {canSeeAdmisiones ? (
          <NavLink
            to="/admisiones"
            className={({ isActive }) =>
              `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
            }
          >
            Admisiones
          </NavLink>
        ) : null}
      </nav>
      <div className="sidebar__footer">
        <button
          type="button"
          className="sidebar__logout"
          onClick={handleLogout}
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

export default Sidebar

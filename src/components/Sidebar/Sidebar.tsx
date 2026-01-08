import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/Auth'
import './Sidebar.css'

const Sidebar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const displayName = user
    ? 'username' in user
      ? user.nombreCompleto || user.username
      : [user.nombres, user.apellidos].filter(Boolean).join(' ') || user.numeroAspirante
    : 'Usuario'

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">SAPP Posgrados</div>
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
      </nav>
      <div className="sidebar__footer">
        <p className="sidebar__user">{displayName}</p>
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

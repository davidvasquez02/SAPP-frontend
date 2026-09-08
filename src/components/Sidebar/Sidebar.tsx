import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/Auth";
import { getPrimaryNavigationItems } from "../../app/navigationItems";
import "./Sidebar.css";

const Sidebar = () => {
  const { session, logout } = useAuth();

  const roles = session?.kind === "SAPP" ? session.user.roles : [];
  const sidebarItems = getPrimaryNavigationItems(roles);

  return (
    <aside className="sidebar" aria-label="Navegación principal">
      <NavLink to="/" className="sidebar__brand" title="Ir al inicio" aria-label="Ir al inicio">
        <img
          className="sidebar__brand-logo"
          src="/brand/eisi-favicon.svg"
          alt=""
          aria-hidden="true"
        />
        <span className="sidebar__brand-name">Minerva | Posgrados</span>
      </NavLink>

      <nav className="sidebar__nav">
        {sidebarItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar__link${isActive ? " sidebar__link--active" : ""}`
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
          onClick={logout}
          title="Cerrar sesión"
        >
          <span className="sidebar__icon" aria-hidden="true">
            🚪
          </span>
          <span className="sidebar__label">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

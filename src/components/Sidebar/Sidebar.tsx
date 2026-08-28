import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/Auth";
import { hasAnyRole, isProfesor, ROLES } from "../../auth/roleGuards";
import "./Sidebar.css";

interface SidebarItem {
  to: string;
  label: string;
  icon: string;
  visible?: boolean;
}

const Sidebar = () => {
  const { session } = useAuth();

  const canSeeAdmisiones =
    session?.kind === "SAPP" &&
    hasAnyRole(session.user.roles, [
      ROLES.COORDINACION,
      ROLES.SECRETARIA,
      ROLES.ADMIN,
      ROLES.PROFESOR,
      ROLES.DOCENTE,
    ]);
  const canSeeGestionEstudiantes =
    session?.kind === "SAPP" &&
    hasAnyRole(session.user.roles, [
      ROLES.COORDINACION,
      ROLES.SECRETARIA,
      ROLES.ADMIN,
    ]);
  const canSeeFechas =
    session?.kind === "SAPP" &&
    hasAnyRole(session.user.roles, [ROLES.COORDINACION, ROLES.ADMIN]);
  const canSeeActas =
    session?.kind === "SAPP" &&
    hasAnyRole(session.user.roles, [ROLES.COORDINACION, ROLES.ADMIN]);
  const isProfesorOnly =
    session?.kind === "SAPP" &&
    isProfesor(session.user.roles) &&
    !hasAnyRole(session.user.roles, [
      ROLES.COORDINACION,
      ROLES.SECRETARIA,
      ROLES.ADMIN,
    ]);

  const sidebarItems: SidebarItem[] = [
    { to: "/solicitudes", label: "Solicitudes", icon: "📝" },
    {
      to: "/matricula",
      label: "Matrícula",
      icon: "🎓",
      visible: !isProfesorOnly,
    },
    {
      to: "/coordinacion/estudiantes",
      label: "Estudiantes",
      icon: "👥",
      visible: canSeeGestionEstudiantes,
    },
    {
      to: "/admisiones",
      label: "Admisiones",
      icon: "📋",
      visible: canSeeAdmisiones,
    },
    {
      to: "/actas",
      label: "Actas",
      icon: "📄",
      visible: canSeeActas,
    },
    {
      to: "/fechas",
      label: "Fechas",
      icon: "📅",
      visible: canSeeFechas,
    },
  ];

  return (
    <aside className="sidebar" aria-label="Navegación principal">
      <NavLink to="/" className="sidebar__brand" title="Ir al inicio" aria-label="Ir al inicio">
        <span className="sidebar__label_title">SAPP</span>
      </NavLink>

      <nav className="sidebar__nav">
        {sidebarItems
          .filter((item) => item.visible ?? true)
          .map((item) => (
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
    </aside>
  );
};

export default Sidebar;

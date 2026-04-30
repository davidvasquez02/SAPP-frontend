import { Link } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import { hasAnyRole, isProfesor, ROLES } from '../../auth/roleGuards'
import { useAuth } from '../../context/Auth'
import './HomePage.css'

interface HomeShortcut {
  to: string
  label: string
  icon: string
  visible: boolean
}

const HomePage = () => {
  const { session } = useAuth()

  const roles = session?.kind === 'SAPP' ? session.user.roles : []
  const canSeeAdmisiones = hasAnyRole(roles, [
    ROLES.COORDINACION,
    ROLES.SECRETARIA,
    ROLES.ADMIN,
    ROLES.PROFESOR,
    ROLES.DOCENTE,
  ])
  const canSeeGestionEstudiantes = hasAnyRole(roles, [ROLES.COORDINACION, ROLES.SECRETARIA, ROLES.ADMIN])
  const canSeeConfiguracion = hasAnyRole(roles, [ROLES.COORDINACION, ROLES.ADMIN])
  const isProfesorOnly =
    isProfesor(roles) && !hasAnyRole(roles, [ROLES.COORDINACION, ROLES.SECRETARIA, ROLES.ADMIN])

  const shortcuts: HomeShortcut[] = [
    { to: '/solicitudes', label: 'Solicitudes', icon: '📝', visible: true },
    { to: '/matricula', label: 'Matrícula', icon: '🎓', visible: !isProfesorOnly },
    { to: '/coordinacion/estudiantes', label: 'Estudiantes', icon: '👥', visible: canSeeGestionEstudiantes },
    { to: '/admisiones', label: 'Admisiones', icon: '📋', visible: canSeeAdmisiones },
    { to: '/configuracion', label: 'Configuración', icon: '⚙️', visible: canSeeConfiguracion },
  ]

  const visibleShortcuts = shortcuts.filter((item) => item.visible)

  return (
    <ModuleLayout title="Inicio">
      <p className="home-page__lead">Accesos rápidos según tu rol</p>

      <section className="home-page__shortcuts" aria-label="Accesos del sistema">
        {visibleShortcuts.map((item) => (
          <Link key={item.to} to={item.to} className="home-page__shortcut-card" title={item.label}>
            <span className="home-page__shortcut-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="home-page__shortcut-label">{item.label}</span>
          </Link>
        ))}
      </section>
    </ModuleLayout>
  )
}

export default HomePage

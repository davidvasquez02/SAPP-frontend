import { useAuth } from '../../context/Auth'
import './ModuleLayout.css'

type ModuleLayoutProps = {
  title: string
  children: React.ReactNode
}

const ModuleLayout = ({ title, children }: ModuleLayoutProps) => {
  const { user, logout } = useAuth()
  const displayName = user
    ? 'username' in user
      ? user.nombreCompleto || user.username
      : user.numeroInscripcionUis || user.numeroDocumento
    : 'Usuario'
  const roleLabel = user?.roles?.[0] ?? 'ESTUDIANTE'

  return (
    <div className="module-layout">
      <header className="module-layout__header">
        <div>
          <p className="module-layout__eyebrow">SAPP Posgrados</p>
          <h2 className="module-layout__title">{title}</h2>
        </div>
        <div className="module-layout__user">
          <div>
            <p className="module-layout__user-name">{displayName}</p>
            <p className="module-layout__user-role">{roleLabel}</p>
          </div>
          <button type="button" className="module-layout__logout" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </header>
      <main className="module-layout__content">{children}</main>
    </div>
  )
}

export default ModuleLayout

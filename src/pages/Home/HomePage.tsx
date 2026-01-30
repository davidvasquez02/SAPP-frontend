import { ModuleLayout } from '../../components'
import { useAuth } from '../../context/Auth'
import './HomePage.css'

const HomePage = () => {
  const { user, session } = useAuth()
  const displayName = user
    ? 'username' in user
      ? user.nombreCompleto || user.username
      : user.numeroInscripcionUis || user.numeroDocumento
    : 'Usuario'
  const isUserSession = session?.kind === 'SAPP' && user && 'username' in user
  const roleCodes = isUserSession ? user.roles.join(', ') : ''
  const expiresAtDate = isUserSession && session.expiresAt ? new Date(session.expiresAt * 1000) : null

  return (
    <ModuleLayout title="Inicio">
      <p className="home-page__welcome">Bienvenido/a, {displayName}</p>
      <p className="home-page__lead">Selecciona una opción del menú</p>
      {isUserSession && (
        <section className="home-page__session">
          <h2 className="home-page__session-title">Mi cuenta</h2>
          <dl className="home-page__session-list">
            <div>
              <dt>Usuario</dt>
              <dd>{user.username}</dd>
            </div>
            <div>
              <dt>Roles</dt>
              <dd>{roleCodes || 'Sin roles'}</dd>
            </div>
            <div>
              <dt>Expira</dt>
              <dd>{expiresAtDate ? expiresAtDate.toLocaleString('es-CO') : 'Sin expiración'}</dd>
            </div>
          </dl>
        </section>
      )}
    </ModuleLayout>
  )
}

export default HomePage

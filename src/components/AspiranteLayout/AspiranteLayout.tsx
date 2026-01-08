import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/Auth'
import './AspiranteLayout.css'

const AspiranteLayout = () => {
  const { session, logout } = useAuth()
  const navigate = useNavigate()
  const aspiranteUser = session?.kind === 'ASPIRANTE' ? session.user : null
  const numeroAspirante =
    aspiranteUser && 'numeroAspirante' in aspiranteUser ? aspiranteUser.numeroAspirante : '—'

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="aspirante-layout">
      <header className="aspirante-layout__header">
        <div>
          <p className="aspirante-layout__eyebrow">SAPP – Aspirantes</p>
          <p className="aspirante-layout__meta">Número de aspirante: {numeroAspirante}</p>
        </div>
        <button type="button" className="aspirante-layout__logout" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </header>
      <main className="aspirante-layout__content">
        <Outlet />
      </main>
    </div>
  )
}

export default AspiranteLayout

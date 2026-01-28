import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/Auth'
import './AspiranteLayout.css'

const AspiranteLayout = () => {
  const { session, logout } = useAuth()
  const navigate = useNavigate()
  const aspiranteUser = session?.kind === 'ASPIRANTE' ? session.user : null
  const numeroInscripcion =
    aspiranteUser && 'numeroInscripcionUis' in aspiranteUser
      ? aspiranteUser.numeroInscripcionUis
      : '—'
  const tipoDocumento =
    aspiranteUser && 'tipoDocumentoIdentificacion' in aspiranteUser
      ? aspiranteUser.tipoDocumentoIdentificacion
      : '—'
  const numeroDocumento =
    aspiranteUser && 'numeroDocumento' in aspiranteUser ? aspiranteUser.numeroDocumento : '—'
  const emailPersonal =
    aspiranteUser && 'emailPersonal' in aspiranteUser ? aspiranteUser.emailPersonal : undefined

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="aspirante-layout">
      <header className="aspirante-layout__header">
        <div>
          <p className="aspirante-layout__eyebrow">SAPP – Aspirantes</p>
          <p className="aspirante-layout__meta">Número de inscripción: {numeroInscripcion}</p>
          <p className="aspirante-layout__meta">
            Doc: {tipoDocumento} {numeroDocumento}
          </p>
          {emailPersonal ? (
            <p className="aspirante-layout__meta">Email: {emailPersonal}</p>
          ) : null}
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

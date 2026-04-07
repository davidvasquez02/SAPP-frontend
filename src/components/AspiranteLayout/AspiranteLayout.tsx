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
  const nombre = aspiranteUser && 'nombre' in aspiranteUser ? aspiranteUser.nombre : undefined
  const grupoInvestigacion =
    aspiranteUser && 'grupoInvestigacion' in aspiranteUser
      ? aspiranteUser.grupoInvestigacion
      : undefined
  const director = aspiranteUser && 'director' in aspiranteUser ? aspiranteUser.director : undefined
  const telefono = aspiranteUser && 'telefono' in aspiranteUser ? aspiranteUser.telefono : undefined

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="aspirante-layout">
      <header className="aspirante-layout__header">
        <div className="aspirante-layout__identity">
          <p className="aspirante-layout__eyebrow">SAPP – Aspirantes</p>
          <h1 className="aspirante-layout__name">{nombre ?? 'Aspirante'}</h1>
          <div className="aspirante-layout__meta-grid">
            <p className="aspirante-layout__meta">
              <span className="aspirante-layout__meta-label">Inscripción</span>
              <span>{numeroInscripcion}</span>
            </p>
            <p className="aspirante-layout__meta">
              <span className="aspirante-layout__meta-label">Documento</span>
              <span>
                {tipoDocumento} {numeroDocumento}
              </span>
            </p>
            {grupoInvestigacion ? (
              <p className="aspirante-layout__meta">
                <span className="aspirante-layout__meta-label">Grupo</span>
                <span>{grupoInvestigacion}</span>
              </p>
            ) : null}
            {director ? (
              <p className="aspirante-layout__meta">
                <span className="aspirante-layout__meta-label">Director</span>
                <span>{director}</span>
              </p>
            ) : null}
            {telefono ? (
              <p className="aspirante-layout__meta">
                <span className="aspirante-layout__meta-label">Teléfono</span>
                <span>{telefono}</span>
              </p>
            ) : null}
            {emailPersonal ? (
              <p className="aspirante-layout__meta">
                <span className="aspirante-layout__meta-label">Email</span>
                <span>{emailPersonal}</span>
              </p>
            ) : null}
          </div>
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

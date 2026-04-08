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
          <dl className="aspirante-layout__meta-list">
            <div className="aspirante-layout__meta-item">
              <dt className="aspirante-layout__meta-label">Inscripción</dt>
              <dd className="aspirante-layout__meta-value">{numeroInscripcion}</dd>
            </div>
            <div className="aspirante-layout__meta-item">
              <dt className="aspirante-layout__meta-label">{tipoDocumento} </dt>
              <dd className="aspirante-layout__meta-value">
                {numeroDocumento}
              </dd>
            </div>
            {grupoInvestigacion ? (
              <div className="aspirante-layout__meta-item">
                <dt className="aspirante-layout__meta-label">Grupo</dt>
                <dd className="aspirante-layout__meta-value">{grupoInvestigacion}</dd>
              </div>
            ) : null}
            {director ? (
              <div className="aspirante-layout__meta-item">
                <dt className="aspirante-layout__meta-label">Director</dt>
                <dd className="aspirante-layout__meta-value">{director}</dd>
              </div>
            ) : null}
            {telefono ? (
              <div className="aspirante-layout__meta-item">
                <dt className="aspirante-layout__meta-label">Teléfono</dt>
                <dd className="aspirante-layout__meta-value">{telefono}</dd>
              </div>
            ) : null}
            {emailPersonal ? (
              <div className="aspirante-layout__meta-item">
                <dt className="aspirante-layout__meta-label">Email</dt>
                <dd className="aspirante-layout__meta-value">{emailPersonal}</dd>
              </div>
            ) : null}
          </dl>
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

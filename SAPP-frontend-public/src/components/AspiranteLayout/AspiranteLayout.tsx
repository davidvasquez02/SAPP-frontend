import type { PropsWithChildren } from 'react'
import { useAuth } from '../../context/Auth'
import './AspiranteLayout.css'

const AspiranteLayout = ({ children }: PropsWithChildren) => {
  const { session, logout } = useAuth()
  const aspiranteUser = session?.kind === 'ASPIRANTE' ? session.user : null
  const numeroInscripcion = aspiranteUser?.numeroInscripcionUis ?? '—'
  const tipoDocumento = aspiranteUser?.tipoDocumentoIdentificacion ?? '—'
  const numeroDocumento = aspiranteUser?.numeroDocumento ?? '—'
  const emailPersonal = aspiranteUser?.emailPersonal
  const nombre = aspiranteUser?.nombre
  const grupoInvestigacion = aspiranteUser?.grupoInvestigacion
  const director = aspiranteUser?.director
  const telefono = aspiranteUser?.telefono

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
              <dd className="aspirante-layout__meta-value">{numeroDocumento}</dd>
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
        <button type="button" className="aspirante-layout__logout" onClick={logout}>
          Cerrar sesión
        </button>
      </header>
      <main className="aspirante-layout__content">{children}</main>
    </div>
  )
}

export default AspiranteLayout

import { useAuth } from '../../context/Auth'
import './ModuleLayout.css'

const UIS_LOGO_SRC = '/brand/LOGO UIS_PNG.png'

const FALLBACK_AVATAR =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><circle cx="60" cy="60" r="58" fill="%23e6e9ef"/><circle cx="60" cy="46" r="20" fill="%2399a1ad"/><path d="M22 98c6-18 20-28 38-28s32 10 38 28" fill="%2399a1ad"/></svg>'

type ModuleLayoutProps = {
  title: string
  children: React.ReactNode
}

const ModuleLayout = ({ title, children }: ModuleLayoutProps) => {
  const { user } = useAuth()
  const displayName = user
    ? 'username' in user
      ? user.nombreCompleto || user.username
      : user.numeroInscripcionUis || user.numeroDocumento
    : 'Usuario'
  const roleLabel = user?.roles?.[0] ?? 'ESTUDIANTE'
  const estudianteFoto =
    user && 'username' in user ? user.estudiante?.foto : null
  const avatarSrc = estudianteFoto?.contenidoBase64
    ? `data:${estudianteFoto.mimeType || 'image/jpeg'};base64,${estudianteFoto.contenidoBase64}`
    : FALLBACK_AVATAR

  return (
    <div className="module-layout">
      <header className="module-layout__header">
        <div>
          <h2 className="module-layout__title">{title}</h2>
        </div>
        <div className="module-layout__user">
          <div>
            <p className="module-layout__user-name">{displayName}</p>
            <p className="module-layout__user-role">{roleLabel}</p>
          </div>
          <img className="module-layout__avatar" src={avatarSrc} alt={`Foto de perfil de ${displayName}`} />
          <img
            className="module-layout__uis-logo"
            src={UIS_LOGO_SRC}
            alt="Universidad Industrial de Santander"
          />
        </div>
      </header>
      <main className="module-layout__content">{children}</main>
    </div>
  )
}

export default ModuleLayout

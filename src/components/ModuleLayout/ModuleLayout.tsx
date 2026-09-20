import { Link } from 'react-router-dom'
import { useAuth } from '../../context/Auth'
import { imageDataUrl } from '../../shared/files/base64FileUtils'
import { formatRoleLabel } from '../../modules/auth/roles/roleUtils'
import './ModuleLayout.css'

const UIS_LOGO_SRC = '/brand/LOGO UIS_PNG.png'
const EISI_LOGO_SRC = '/brand/eisi%20imagen.png'
const GENERIC_SYSTEM_ROLE = 'DEFAULT-ROLES-EISI'

const FALLBACK_AVATAR =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><circle cx="60" cy="60" r="58" fill="%23e6e9ef"/><circle cx="60" cy="46" r="20" fill="%2399a1ad"/><path d="M22 98c6-18 20-28 38-28s32 10 38 28" fill="%2399a1ad"/></svg>'

type ModuleLayoutProps = {
  title: string
  children: React.ReactNode
  showUserSummary?: boolean
  compactOnMobile?: boolean
}

const ModuleLayout = ({ title, children, showUserSummary = true, compactOnMobile = false }: ModuleLayoutProps) => {
  const { user } = useAuth()
  const displayName = user ? user.nombreCompleto || user.username : 'Usuario'
  const functionalRole = user?.roles?.find((role) => role.toUpperCase() !== GENERIC_SYSTEM_ROLE)
  const roleLabel = functionalRole ? formatRoleLabel(functionalRole) : 'SIN ROL ASIGNADO'
  const estudianteFoto =
    user?.estudiante?.foto ?? null
  const avatarSrc = imageDataUrl(estudianteFoto?.contenidoBase64, estudianteFoto?.mimeType) ?? FALLBACK_AVATAR

  return (
    <div className={`module-layout${compactOnMobile ? ' module-layout--compact-mobile' : ''}`}>
      <header className="module-layout__header">
        <div>
          <h2 className="module-layout__title">{title}</h2>
        </div>
        <div className="module-layout__user">
          {showUserSummary && (
            <>
              <div>
                <p className="module-layout__user-name">{displayName}</p>
                <p className="module-layout__user-role">{roleLabel}</p>
              </div>
              <Link className="module-layout__profile-link" to="/perfil" aria-label="Abrir mi perfil">
                <img className="module-layout__avatar" src={avatarSrc} alt={`Foto de perfil de ${displayName}`} />
              </Link>
            </>
          )}
          <div className="module-layout__institutional-logos" aria-label="Identidad institucional">
            <img
              className="module-layout__institutional-logo"
              src={UIS_LOGO_SRC}
              alt="Universidad Industrial de Santander"
            />
            <img
              className="module-layout__institutional-logo module-layout__institutional-logo--eisi"
              src={EISI_LOGO_SRC}
              alt="Escuela de Ingeniería de Sistemas e Informática"
            />
          </div>
        </div>
      </header>
      <main className="module-layout__content">{children}</main>
    </div>
  )
}

export default ModuleLayout

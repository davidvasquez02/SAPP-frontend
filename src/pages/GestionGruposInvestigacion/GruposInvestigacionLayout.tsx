import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import './GestionGruposInvestigacionPage.css'

export const RUTA_GRUPOS = '/coordinacion/grupos-investigacion'

const SECCIONES = [
  { to: RUTA_GRUPOS, label: 'Grupos', end: true },
  { to: `${RUTA_GRUPOS}/instituciones`, label: 'Instituciones', end: false },
  { to: `${RUTA_GRUPOS}/profesores`, label: 'Profesores', end: false },
] as const

interface GruposInvestigacionLayoutProps {
  children: ReactNode
}

/** Marco comun de las pantallas de Grupos de investigacion: titulo, pestañas y contenido. */
export const GruposInvestigacionLayout = ({ children }: GruposInvestigacionLayoutProps) => (
  <ModuleLayout title="Grupos de investigación">
    <div className="gestion-grupos-layout">
      <nav className="gestion-grupos__tabs" aria-label="Secciones de grupos de investigación">
        {SECCIONES.map((seccion) => (
          <NavLink
            key={seccion.to}
            to={seccion.to}
            end={seccion.end}
            className={({ isActive }) => `gestion-grupos__tab${isActive ? ' gestion-grupos__tab--active' : ''}`}
          >
            {seccion.label}
          </NavLink>
        ))}
      </nav>
      {children}
    </div>
  </ModuleLayout>
)

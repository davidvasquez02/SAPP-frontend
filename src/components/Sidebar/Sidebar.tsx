import { useCallback, useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../../context/Auth'
import { getPrimaryNavigationItems } from '../../app/navigationItems'
import { SidebarModuleIcon } from './SidebarModuleIcon'
import './Sidebar.css'

const MOBILE_NAV_QUERY = '(max-width: 900px)'
const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

const MenuIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)

const CloseIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
)

const Sidebar = () => {
  const { session, logout } = useAuth()
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_NAV_QUERY).matches)
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const [expandedItems, setExpandedItems] = useState<string[]>(() =>
    location.pathname.startsWith('/matricula') ? ['/matricula'] : [],
  )
  const panelRef = useRef<HTMLElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  const roles = session?.kind === 'SAPP' ? session.user.roles : []
  const sidebarItems = getPrimaryNavigationItems(roles)

  const closeMenu = useCallback((restoreFocus = true) => {
    setIsOpen(false)
    if (restoreFocus) {
      window.requestAnimationFrame(() => menuButtonRef.current?.focus())
    }
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_NAV_QUERY)
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches)
      setIsOpen(false)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (!isMobile || !isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeMenu()
        return
      }

      if (event.key !== 'Tab' || !panelRef.current) return
      const focusableElements = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      )
      if (focusableElements.length === 0) return

      const first = focusableElements[0]
      const last = focusableElements[focusableElements.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [closeMenu, isMobile, isOpen])

  const mobileTabIndex = isMobile && !isOpen ? -1 : undefined

  return (
    <>
      <header className="mobile-navigation">
        <NavLink to="/" className="mobile-navigation__brand" aria-label="Ir al inicio">
          <img src="/brand/eisi%20imagen.png" alt="" aria-hidden="true" />
          <span>Minerva | Posgrados</span>
        </NavLink>
        <button
          ref={menuButtonRef}
          type="button"
          className="mobile-navigation__menu-button"
          aria-label="Abrir menú principal"
          aria-expanded={isOpen}
          aria-controls="main-navigation-panel"
          onClick={() => setIsOpen(true)}
        >
          <MenuIcon />
        </button>
      </header>

      <button
        type="button"
        className={`sidebar-backdrop${isOpen ? ' sidebar-backdrop--visible' : ''}`}
        aria-label="Cerrar menú principal"
        tabIndex={isOpen ? 0 : -1}
        onClick={() => closeMenu()}
      />

      <aside
        id="main-navigation-panel"
        ref={panelRef}
        className={`sidebar${isOpen ? ' sidebar--open' : ''}`}
        aria-label="Navegación principal"
        aria-hidden={isMobile && !isOpen}
        aria-modal={isMobile && isOpen ? true : undefined}
        role={isMobile ? 'dialog' : undefined}
        tabIndex={isMobile && isOpen ? -1 : undefined}
      >
        <div className="sidebar__mobile-heading">
          <span>Menú principal</span>
          <button type="button" aria-label="Cerrar menú principal" onClick={() => closeMenu()}>
            <CloseIcon />
          </button>
        </div>
        <NavLink
          to="/"
          className="sidebar__brand"
          title="Ir al inicio"
          aria-label="Ir al inicio"
          tabIndex={mobileTabIndex}
          onClick={() => isMobile && closeMenu(false)}
        >
          <img className="sidebar__brand-logo" src="/brand/eisi%20imagen.png" alt="" aria-hidden="true" />
          <span className="sidebar__brand-name">Minerva | Posgrados</span>
        </NavLink>

        <nav className="sidebar__nav">
          {sidebarItems.map((item) => item.children ? (
            <div className="sidebar__group" key={item.to}>
              <div className={`sidebar__link sidebar__link--parent${location.pathname.startsWith(item.to) ? ' sidebar__link--active' : ''}`}>
                <NavLink to={item.to} className="sidebar__parent-link" title={item.label} tabIndex={mobileTabIndex} onClick={() => isMobile && closeMenu(false)}>
                  <span className="sidebar__icon" aria-hidden="true"><SidebarModuleIcon modulePath={item.to} /></span>
                  <span className="sidebar__label">{item.label}</span>
                </NavLink>
                <button type="button" className="sidebar__expand" aria-label={`${expandedItems.includes(item.to) ? 'Contraer' : 'Desplegar'} ${item.label}`} aria-expanded={expandedItems.includes(item.to)} onClick={() => setExpandedItems((current) => current.includes(item.to) ? current.filter((value) => value !== item.to) : [...current, item.to])}>
                  <ChevronDownIcon />
                </button>
              </div>
              {expandedItems.includes(item.to) && <div className="sidebar__submenu">
                {item.children.map((child) => <NavLink key={child.to} to={child.to} className={({ isActive }) => `sidebar__sublink${isActive ? ' sidebar__sublink--active' : ''}`} onClick={() => isMobile && closeMenu(false)}>{child.label}</NavLink>)}
              </div>}
            </div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar__link${isActive ? ' sidebar__link--active' : ''}`}
              title={item.label}
              tabIndex={mobileTabIndex}
              onClick={() => isMobile && closeMenu(false)}
            >
              <span className="sidebar__icon" aria-hidden="true">
                <SidebarModuleIcon modulePath={item.to} />
              </span>
              <span className="sidebar__label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <button type="button" className="sidebar__logout" onClick={logout} title="Cerrar sesión" tabIndex={mobileTabIndex}>
            <span className="sidebar__icon" aria-hidden="true"><LogOut className="sidebar__module-icon" /></span>
            <span className="sidebar__label">Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar

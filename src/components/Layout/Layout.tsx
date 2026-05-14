import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '../Sidebar'
import './Layout.css'

const Layout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.classList.toggle('menu-open', isMobileMenuOpen)
    return () => {
      document.body.classList.remove('menu-open')
    }
  }, [isMobileMenuOpen])

  return (
    <div className="app-shell">
      <button
        type="button"
        className="app-shell__menu-button"
        aria-label="Abrir menú de navegación"
        aria-expanded={isMobileMenuOpen}
        aria-controls="sapp-main-sidebar"
        onClick={() => setIsMobileMenuOpen(true)}
      >
        ☰ Menú
      </button>

      <div
        className={`app-shell__overlay${isMobileMenuOpen ? ' app-shell__overlay--visible' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <Sidebar
        id="sapp-main-sidebar"
        isMobileOpen={isMobileMenuOpen}
        onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
      />

      <main className="app-shell__content">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout

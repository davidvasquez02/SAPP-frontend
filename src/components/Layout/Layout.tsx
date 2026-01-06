import { Outlet } from 'react-router-dom'
import { Sidebar } from '../Sidebar'
import './Layout.css'

const Layout = () => {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-shell__content">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout

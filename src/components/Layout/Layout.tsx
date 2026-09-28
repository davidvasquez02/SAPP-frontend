import { Outlet } from 'react-router-dom'
import { Sidebar } from '../Sidebar'
import { SignatureReminder } from '../SignatureReminder'
import './Layout.css'

const Layout = () => {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-shell__content">
        <Outlet />
      </main>
      <SignatureReminder />
    </div>
  )
}

export default Layout

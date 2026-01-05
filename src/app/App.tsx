import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../context/Auth'
import { AppRoutes } from './routes'
import './App.css'

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-shell">
          <AppRoutes />
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/Auth'
import './styles/globals.css'
import App from './app/App'

const savedTheme = window.localStorage.getItem('sapp-theme')
const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
const initialTheme = savedTheme === 'dark' || savedTheme === 'light'
  ? savedTheme
  : systemPrefersDark
    ? 'dark'
    : 'light'

document.body.classList.remove('light', 'dark')
document.body.classList.add(initialTheme)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

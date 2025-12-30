import { useState } from 'react'
import './App.css'
import HomeView from './components/HomeView'
import LoginView from './components/LoginView'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsAuthenticated(true)
  }

  if (isAuthenticated) {
    return <HomeView />
  }

  return (
    <LoginView
      email={email}
      password={password}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
    />
  )
}

export default App

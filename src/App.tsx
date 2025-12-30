import { useState } from 'react'
import './App.css'
import Home from './components/Home'
import Login from './components/Login'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsAuthenticated(true)
  }

  if (isAuthenticated) {
    return <Home />
  }

  return (
    <Login
      email={email}
      password={password}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
    />
  )
}

export default App

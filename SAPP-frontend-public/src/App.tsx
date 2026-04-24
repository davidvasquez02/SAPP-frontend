import { AspiranteLayout } from './components'
import { useAuth } from './context/Auth'
import { AspiranteDocumentosPage } from './pages/AspiranteDocumentos'
import { AspiranteLoginPage } from './pages/AspiranteLogin'

function App() {
  const { session } = useAuth()

  if (!session || session.kind !== 'ASPIRANTE') {
    return <AspiranteLoginPage />
  }

  return (
    <AspiranteLayout>
      <AspiranteDocumentosPage />
    </AspiranteLayout>
  )
}

export default App

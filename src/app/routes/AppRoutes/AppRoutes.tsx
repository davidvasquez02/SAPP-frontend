import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../../../components/ProtectedRoute'
import { CreditosPage } from '../../../pages/CreditosPage'
import { LoginPage } from '../../../pages/LoginPage'
import { MatriculaPage } from '../../../pages/MatriculaPage'
import { TramitesPage } from '../../../pages/TramitesPage'
import './AppRoutes.css'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/tramites" replace />} />
        <Route path="/tramites" element={<TramitesPage />} />
        <Route path="/matricula" element={<MatriculaPage />} />
        <Route path="/creditos" element={<CreditosPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/tramites" replace />} />
    </Routes>
  )
}

export default AppRoutes

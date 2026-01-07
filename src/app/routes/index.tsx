import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { useAuth } from '../../context/Auth'
import { HomePage } from '../../pages/HomePage'
import { LoginPage } from '../../pages/Login'
import { creditosRoutes } from './creditosRoutes'
import { matriculaRoutes } from './matriculaRoutes'
import { ProtectedRoute } from './protectedRoute'
import { tramitesRoutes } from './tramitesRoutes'

export const AppRoutes = () => {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
        }
      />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          {tramitesRoutes}
          {matriculaRoutes}
          {creditosRoutes}
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

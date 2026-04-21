import { Route } from 'react-router-dom'
import { MatriculaDetalleCoordinacionPage, MatriculaPage } from '../../pages'

export const matriculaRoutes = (
  <>
    <Route path="/matricula" element={<MatriculaPage />} />
    <Route path="/matricula/:matriculaId" element={<MatriculaDetalleCoordinacionPage />} />
  </>
)

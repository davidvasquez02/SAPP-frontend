import { Route } from 'react-router-dom'
import { MatriculaPage } from '../../pages/MatriculaPage'

export const matriculaRoutes = () => {
  return <Route path="/matricula" element={<MatriculaPage />} />
}

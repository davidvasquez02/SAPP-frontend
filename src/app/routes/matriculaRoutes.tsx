import { Route } from 'react-router-dom'
import { MatriculaPage } from '../../pages/MatriculaPage'

export const MatriculaRoutes = () => {
  return <Route path="/matricula" element={<MatriculaPage />} />
}

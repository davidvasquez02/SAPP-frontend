import { Route } from 'react-router-dom'
import { TramitesPage } from '../../pages/TramitesPage'

export const TramitesRoutes = () => {
  return <Route path="/tramites" element={<TramitesPage />} />
}

import { Route } from 'react-router-dom'
import { TramitesPage } from '../../pages/TramitesPage'

export const tramitesRoutes = () => {
  return <Route path="/tramites" element={<TramitesPage />} />
}

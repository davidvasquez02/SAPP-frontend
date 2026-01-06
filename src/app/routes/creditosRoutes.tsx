import { Route } from 'react-router-dom'
import { CreditosPage } from '../../pages/CreditosPage'

export const CreditosRoutes = () => {
  return <Route path="/creditos" element={<CreditosPage />} />
}

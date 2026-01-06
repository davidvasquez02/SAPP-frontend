import { Route } from 'react-router-dom'
import { CreditosPage } from '../../pages/CreditosPage'

export const creditosRoutes = () => {
  return <Route path="/creditos" element={<CreditosPage />} />
}

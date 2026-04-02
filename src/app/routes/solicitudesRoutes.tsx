import { Route } from 'react-router-dom'
import { SolicitudDetallePage, SolicitudesPage } from '../../pages'

export const solicitudesRoutes = (
  <>
    <Route path="/solicitudes" element={<SolicitudesPage />} />
    <Route path="/solicitudes/:solicitudId" element={<SolicitudDetallePage />} />
  </>
)

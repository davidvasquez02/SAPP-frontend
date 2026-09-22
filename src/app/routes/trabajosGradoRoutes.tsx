import { Route } from 'react-router-dom'
import { SolicitudDetallePage, TrabajosGradoPage } from '../../pages'

export const trabajosGradoRoutes = (
  <>
    <Route path="/trabajos-grado" element={<TrabajosGradoPage />} />
    <Route path="/trabajos-grado/:nivel" element={<TrabajosGradoPage />} />
    <Route path="/trabajos-grado/:nivel/solicitudes/:solicitudId" element={<SolicitudDetallePage />} />
  </>
)

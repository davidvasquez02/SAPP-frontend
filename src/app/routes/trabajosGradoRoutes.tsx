import { Navigate, Route, useLocation } from 'react-router-dom'
import { SolicitudDetallePage, TrabajosGradoPage } from '../../pages'
import { RUTA_PROYECTOS } from '../../modules/trabajos-grado/rutas'

const RUTA_ANTERIOR = '/trabajos-grado'

function RedireccionProyectos() {
  const { pathname, search, hash, state } = useLocation()
  const destino = RUTA_PROYECTOS + pathname.slice(RUTA_ANTERIOR.length)
  return <Navigate to={{ pathname: destino, search, hash }} state={state} replace />
}

export const trabajosGradoRoutes = (
  <>
    <Route path={RUTA_PROYECTOS}>
      <Route index element={<TrabajosGradoPage />} />
      <Route path=":nivel" element={<TrabajosGradoPage />} />
      <Route path=":nivel/solicitudes/:solicitudId" element={<SolicitudDetallePage />} />
    </Route>
    <Route path={`${RUTA_ANTERIOR}/*`} element={<RedireccionProyectos />} />
  </>
)

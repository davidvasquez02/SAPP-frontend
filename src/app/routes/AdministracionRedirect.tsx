import { Navigate, useLocation } from 'react-router-dom'
import { destinoAdministracion } from '../../modules/administracionAcademica/rutas'

/** Reemplaza enlaces antiguos y la portada, conservando contexto e historial útil. */
const AdministracionRedirect = () => {
  const location = useLocation()
  return <Navigate replace to={destinoAdministracion(location)} state={location.state} />
}

export default AdministracionRedirect

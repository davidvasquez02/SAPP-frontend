import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import { getPlantillasCorreo, type PlantillaCorreoResumen } from '../../api/plantillasCorreoService'
import { RUTA_PLANTILLAS } from './rutas'
import './PlantillasCorreo.css'

interface MensajeNavegacion {
  mensaje?: string
}

const PlantillasCorreoPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const mensajeInicial = (location.state as MensajeNavegacion | null)?.mensaje ?? null

  const [plantillas, setPlantillas] = useState<PlantillaCorreoResumen[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mensaje = mensajeInicial

  useEffect(() => {
    getPlantillasCorreo()
      .then(setPlantillas)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'No fue posible cargar las plantillas.'))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <ModuleLayout title="Plantillas de correo">
      <section className="plantillas-correo">
        <header className="plantillas-correo__header">
          <p>Textos de los correos que envía el sistema. El encabezado y el pie generales se agregan automáticamente a cada correo.</p>
        </header>

        {error ? <p className="plantillas-correo__alert plantillas-correo__alert--error" role="alert">{error}</p> : null}
        {mensaje ? <p className="plantillas-correo__alert plantillas-correo__alert--success" role="status">{mensaje}</p> : null}
        {isLoading ? <p className="plantillas-correo__status">Cargando plantillas...</p> : null}

        {!isLoading && !error && plantillas.length === 0 ? (
          <p className="plantillas-correo__status">No hay plantillas registradas.</p>
        ) : null}

        {!isLoading && plantillas.length > 0 ? (
          <div className="plantillas-correo__table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Asunto</th>
                  <th>Idioma</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {plantillas.map((plantilla) => (
                  <tr key={plantilla.id}>
                    <td>
                      <strong>{plantilla.nombre}</strong>
                      <span className="plantillas-correo__sigla">{plantilla.sigla}</span>
                    </td>
                    <td>{plantilla.asunto}</td>
                    <td><span className="plantillas-correo__idioma">{plantilla.idioma === 'EN' ? 'Inglés' : 'Español'}</span></td>
                    <td className="plantillas-correo__acciones">
                      <button type="button" className="plantillas-correo__edit" onClick={() => navigate(`${RUTA_PLANTILLAS}/${plantilla.id}/editar`)}>
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </ModuleLayout>
  )
}

export default PlantillasCorreoPage

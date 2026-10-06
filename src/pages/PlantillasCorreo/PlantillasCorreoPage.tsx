import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import { getPlantillasCorreo, type IdiomaPlantillaCorreo, type PlantillaCorreoResumen } from '../../api/plantillasCorreoService'
import { RUTA_PLANTILLAS } from './rutas'
import './PlantillasCorreo.css'

const TAMANO_PAGINA = 10

interface MensajeNavegacion {
  mensaje?: string
}

const normalizarTexto = (texto: string) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

const NOMBRE_IDIOMA: Record<IdiomaPlantillaCorreo, string> = {
  ES: 'Español',
  EN: 'Inglés',
}

const PlantillasCorreoPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const mensaje = (location.state as MensajeNavegacion | null)?.mensaje ?? null

  const [plantillas, setPlantillas] = useState<PlantillaCorreoResumen[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [idiomaFiltro, setIdiomaFiltro] = useState('')
  const [pagina, setPagina] = useState(1)

  useEffect(() => {
    getPlantillasCorreo()
      .then(setPlantillas)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'No fue posible cargar las plantillas.'))
      .finally(() => setIsLoading(false))
  }, [])

  const filtradas = useMemo(() => {
    const termino = normalizarTexto(busqueda)
    return plantillas.filter((plantilla) => {
      if (idiomaFiltro && plantilla.idioma !== idiomaFiltro) return false
      if (!termino) return true
      return [plantilla.nombre, plantilla.descripcion].some((campo) => normalizarTexto(campo).includes(termino))
    })
  }, [plantillas, busqueda, idiomaFiltro])

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / TAMANO_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const visibles = filtradas.slice((paginaActual - 1) * TAMANO_PAGINA, paginaActual * TAMANO_PAGINA)
  const hayFiltros = busqueda.trim() !== '' || idiomaFiltro !== ''

  return (
    <ModuleLayout title="Plantillas de correo">
      <section className="plantillas-correo">
        <header className="plantillas-correo__header">
          <p>Textos de los correos que envía el sistema. El encabezado y el pie generales se agregan automáticamente a cada correo.</p>
        </header>

        {error ? <p className="plantillas-correo__alert plantillas-correo__alert--error" role="alert">{error}</p> : null}
        {mensaje ? <p className="plantillas-correo__alert plantillas-correo__alert--success" role="status">{mensaje}</p> : null}

        {!isLoading && plantillas.length > 0 ? (
          <div className="sapp-filters-panel">
            <label className="sapp-filter-field">
              <span>Buscar por nombre o descripción</span>
              <input type="search" value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPagina(1) }} placeholder="Ej. solicitud o jurado" />
            </label>
            <label className="sapp-filter-field">
              <span>Idioma</span>
              <select value={idiomaFiltro} onChange={(e) => { setIdiomaFiltro(e.target.value); setPagina(1) }}>
                <option value="">Todos</option>
                <option value="ES">Español</option>
                <option value="EN">Inglés</option>
              </select>
            </label>
            <button type="button" className="sapp-filters-clear-button" onClick={() => { setBusqueda(''); setIdiomaFiltro(''); setPagina(1) }} disabled={!hayFiltros}>
              Limpiar filtros
            </button>
          </div>
        ) : null}

        {isLoading ? <p className="plantillas-correo__status">Cargando plantillas...</p> : null}

        {!isLoading && plantillas.length > 0 && filtradas.length === 0 ? (
          <p className="plantillas-correo__status">No hay plantillas que coincidan con los filtros.</p>
        ) : null}

        {!isLoading && visibles.length > 0 ? (
          <div className="plantillas-correo__table-wrap">
            <table className="plantillas-correo__table">
              <colgroup>
                <col style={{ width: '28%' }} />
                <col style={{ width: '50%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '10%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th className="plantillas-correo__centrado">Idioma</th>
                  <th className="plantillas-correo__centrado">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((plantilla) => (
                  <tr key={plantilla.id}>
                    <td><strong className="plantillas-correo__nombre">{plantilla.nombre}</strong></td>
                    <td>
                      <span className="plantillas-correo__descripcion" title={plantilla.descripcion}>{plantilla.descripcion}</span>
                    </td>
                    <td className="plantillas-correo__centrado">
                      <span className={`plantillas-correo__idioma plantillas-correo__idioma--${plantilla.idioma.toLowerCase()}`}>
                        {NOMBRE_IDIOMA[plantilla.idioma]}
                      </span>
                    </td>
                    <td className="plantillas-correo__centrado">
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

        {!isLoading && filtradas.length > TAMANO_PAGINA ? (
          <nav className="plantillas-correo__paginacion" aria-label="Paginación de plantillas">
            <button type="button" disabled={paginaActual === 1} onClick={() => setPagina(paginaActual - 1)}>Anterior</button>
            <span>Página {paginaActual} de {totalPaginas}</span>
            <button type="button" disabled={paginaActual === totalPaginas} onClick={() => setPagina(paginaActual + 1)}>Siguiente</button>
          </nav>
        ) : null}
      </section>
    </ModuleLayout>
  )
}

export default PlantillasCorreoPage

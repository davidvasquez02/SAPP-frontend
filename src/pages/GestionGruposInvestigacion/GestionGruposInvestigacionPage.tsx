import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  desactivarGrupoGestion,
  getGruposGestion,
  getInstitucionesGrupo,
  reactivarGrupoGestion,
  type FiltrosGruposGestion,
} from '../../api/gruposInvestigacionGestionService'
import type {
  GrupoGestionDto,
  InstitucionGrupoDto,
} from '../../api/gruposInvestigacionGestionTypes'
import { GruposInvestigacionLayout, RUTA_GRUPOS } from './GruposInvestigacionLayout'
import './GestionGruposInvestigacionPage.css'

interface MensajeNavegacion {
  mensaje?: string
}

const GestionGruposInvestigacionPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const mensajeInicial = (location.state as MensajeNavegacion | null)?.mensaje ?? null

  const [grupos, setGrupos] = useState<GrupoGestionDto[]>([])
  const [instituciones, setInstituciones] = useState<InstitucionGrupoDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(mensajeInicial)
  const [busqueda, setBusqueda] = useState('')
  const [institucionFiltro, setInstitucionFiltro] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('')

  const hayFiltros = busqueda.trim() !== '' || institucionFiltro !== '' || estadoFiltro !== ''

  const solicitudGruposRef = useRef(0)

  const filtrosActuales = (): FiltrosGruposGestion => ({
    busqueda: busqueda.trim(),
    institucionId: institucionFiltro ? Number(institucionFiltro) : undefined,
    estado: estadoFiltro || undefined,
  })

  const limpiarFiltros = () => {
    setBusqueda('')
    setInstitucionFiltro('')
    setEstadoFiltro('')
  }

  const cargarGrupos = async (filtros: FiltrosGruposGestion) => {
    const solicitud = ++solicitudGruposRef.current
    setError(null)
    try {
      const gruposData = await getGruposGestion(filtros)
      if (solicitud === solicitudGruposRef.current) setGrupos(gruposData)
    } catch (err) {
      if (solicitud === solicitudGruposRef.current) {
        setError(err instanceof Error ? err.message : 'No fue posible cargar los grupos de investigación.')
      }
    } finally {
      if (solicitud === solicitudGruposRef.current) setIsLoading(false)
    }
  }

  const cargar = async () => {
    await cargarGrupos(filtrosActuales())
  }

  useEffect(() => {
    getInstitucionesGrupo()
      .then(setInstituciones)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'No fue posible cargar las instituciones.'))
  }, [])

  useEffect(() => {
    const espera = setTimeout(() => {
      void cargarGrupos({
        busqueda: busqueda.trim(),
        institucionId: institucionFiltro ? Number(institucionFiltro) : undefined,
        estado: estadoFiltro || undefined,
      })
    }, 300)
    return () => clearTimeout(espera)
  }, [busqueda, institucionFiltro, estadoFiltro])

  const reactivar = async (grupo: GrupoGestionDto) => {
    setError(null)
    setMensaje(null)
    try {
      await reactivarGrupoGestion(grupo.id)
      setMensaje(`El grupo ${grupo.codigo} fue reactivado.`)
      await cargar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible reactivar el grupo.')
    }
  }

  const retirar = async (grupo: GrupoGestionDto) => {
    setError(null)
    setMensaje(null)
    try {
      await desactivarGrupoGestion(grupo.id)
      setMensaje(`El grupo ${grupo.codigo} fue retirado. Su historial se conserva.`)
      await cargar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible retirar el grupo.')
    }
  }

  return (
    <GruposInvestigacionLayout>
      <section className="gestion-grupos">
        <header className="gestion-grupos__header">
          <p>Crea, modifica o retira los grupos de investigación. Un grupo retirado se conserva con su historial y deja de ofrecerse para nuevas asignaciones.</p>
          <button type="button" className="gestion-grupos__primary" onClick={() => navigate(`${RUTA_GRUPOS}/nuevo`)}>
            Nuevo grupo
          </button>
        </header>

        {error ? <p className="gestion-grupos__alert gestion-grupos__alert--error" role="alert">{error}</p> : null}
        {mensaje ? <p className="gestion-grupos__alert gestion-grupos__alert--success" role="status">{mensaje}</p> : null}

        {isLoading ? <p className="gestion-grupos__status">Cargando grupos...</p> : null}

        {!isLoading ? (
          <div className="sapp-filters-panel">
            <label className="sapp-filter-field">
              <span>Buscar por código, nombre o institución</span>
              <input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Ej. STI o Sistemas" />
            </label>
            <label className="sapp-filter-field">
              <span>Institución</span>
              <select value={institucionFiltro} onChange={(e) => setInstitucionFiltro(e.target.value)}>
                <option value="">Todas</option>
                {instituciones.map((institucion) => (
                  <option key={institucion.id} value={institucion.id}>
                    {institucion.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="sapp-filter-field">
              <span>Estado</span>
              <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
                <option value="">Todos</option>
                <option value="ACTIVO">Activo</option>
                <option value="RETIRADO">Retirado</option>
              </select>
            </label>
            <button type="button" className="sapp-filters-clear-button" onClick={limpiarFiltros} disabled={!hayFiltros}>
              Limpiar filtros
            </button>
          </div>
        ) : null}

        {!isLoading && grupos.length === 0 ? (
          <p className="gestion-grupos__status">
            {hayFiltros ? 'No hay grupos que coincidan con los filtros.' : 'No hay grupos de investigación registrados.'}
          </p>
        ) : null}

        {!isLoading && grupos.length > 0 ? (
          <div className="gestion-grupos__table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Institución</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {grupos.map((grupo) => (
                  <tr key={grupo.id} className={grupo.estado === 'RETIRADO' ? 'gestion-grupos__row--retirado' : ''}>
                    <td>{grupo.codigo}</td>
                    <td>{grupo.nombre}</td>
                    <td>{grupo.institucionNombre}</td>
                    <td>
                      <span className={`gestion-grupos__estado gestion-grupos__estado--${grupo.estado === 'RETIRADO' ? 'retirado' : 'activo'}`}>
                        {grupo.estado === 'RETIRADO' ? 'Retirado' : 'Activo'}
                      </span>
                    </td>
                    <td className="gestion-grupos__acciones">
                      <button type="button" className="gestion-grupos__edit" onClick={() => navigate(`${RUTA_GRUPOS}/${grupo.id}/editar`)}>
                        Editar
                      </button>
                      {grupo.estado === 'ACTIVO' ? (
                        <button type="button" className="gestion-grupos__delete" onClick={() => void retirar(grupo)}>
                          Retirar
                        </button>
                      ) : (
                        <button type="button" className="gestion-grupos__edit" onClick={() => void reactivar(grupo)}>
                          Reactivar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </GruposInvestigacionLayout>
  )
}

export default GestionGruposInvestigacionPage

import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  getInstitucionesPaginadas,
  getOpcionesInstituciones,
  modificarInstitucionGrupo,
  type PaginaInstitucionesGrupo,
} from '../../api/gruposInvestigacionGestionService'
import type {
  InstitucionGrupoDto,
  TipoInstitucionGrupo,
} from '../../api/gruposInvestigacionGestionTypes'
import { GruposInvestigacionLayout, RUTA_GRUPOS } from './GruposInvestigacionLayout'
import './GestionGruposInvestigacionPage.css'

const TIPO_ESCUELA: TipoInstitucionGrupo = 'ESCUELA'
const TIPO_FACULTAD: TipoInstitucionGrupo = 'FACULTAD'
const SIN_FACULTAD = 'SIN_FACULTAD'
const TAMANO_PAGINA = 10

const RUTA_NUEVA: Record<TipoInstitucionGrupo, string> = {
  ESCUELA: `${RUTA_GRUPOS}/instituciones/escuelas/nueva`,
  FACULTAD: `${RUTA_GRUPOS}/instituciones/facultades/nueva`,
}

const TITULO: Record<TipoInstitucionGrupo, string> = {
  ESCUELA: 'Escuelas',
  FACULTAD: 'Facultades',
}

interface MensajeNavegacion {
  mensaje?: string
}

interface BloqueProps {
  tipo: TipoInstitucionGrupo
  busqueda: string
  facultadFiltro: string
  facultades: InstitucionGrupoDto[]
  onMensaje: (mensaje: string) => void
}

/** Bloque de un tipo (escuelas o facultades): listado paginado y edicion en linea. */
const BloqueInstituciones = ({ tipo, busqueda, facultadFiltro, facultades, onMensaje }: BloqueProps) => {
  const navigate = useNavigate()
  const [pagina, setPagina] = useState<PaginaInstitucionesGrupo | null>(null)
  const [numero, setNumero] = useState(0)
  const [recarga, setRecarga] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isGuardando, setIsGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [nombreEditado, setNombreEditado] = useState('')
  const [padreEditado, setPadreEditado] = useState('')
  const solicitudRef = useRef(0)

  const esEscuela = tipo === TIPO_ESCUELA

  useEffect(() => {
    setNumero(0)
  }, [busqueda, facultadFiltro])

  useEffect(() => {
    const espera = setTimeout(() => {
      const filtros = {
        busqueda: busqueda.trim() || undefined,
        facultadId: esEscuela && facultadFiltro && facultadFiltro !== SIN_FACULTAD ? Number(facultadFiltro) : undefined,
        sinFacultad: esEscuela && facultadFiltro === SIN_FACULTAD,
      }
      const solicitud = ++solicitudRef.current
      setError(null)
      getInstitucionesPaginadas({ ...filtros, tipo }, numero, TAMANO_PAGINA)
        .then((data) => {
          if (solicitud === solicitudRef.current) setPagina(data)
        })
        .catch((err: unknown) => {
          if (solicitud === solicitudRef.current) {
            setError(err instanceof Error ? err.message : `No fue posible cargar las ${TITULO[tipo].toLowerCase()}.`)
          }
        })
        .finally(() => {
          if (solicitud === solicitudRef.current) setIsLoading(false)
        })
    }, 300)
    return () => clearTimeout(espera)
  }, [tipo, busqueda, facultadFiltro, numero, recarga, esEscuela])

  const iniciarEdicion = (institucion: InstitucionGrupoDto) => {
    setEditandoId(institucion.id)
    setNombreEditado(institucion.nombre)
    setPadreEditado(institucion.institucionPadreId ? String(institucion.institucionPadreId) : '')
    setError(null)
  }

  const guardarEdicion = async (institucion: InstitucionGrupoDto) => {
    if (!nombreEditado.trim()) {
      setError('El nombre es obligatorio.')
      return
    }
    setIsGuardando(true)
    setError(null)
    try {
      await modificarInstitucionGrupo(institucion.id, {
        nombre: nombreEditado.trim(),
        institucionPadreId: institucion.tipo === TIPO_ESCUELA && padreEditado ? Number(padreEditado) : null,
      })
      setEditandoId(null)
      onMensaje(`${TITULO[tipo].slice(0, -1)} actualizada.`)
      setRecarga((valor) => valor + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible actualizar la institución.')
    } finally {
      setIsGuardando(false)
    }
  }

  const instituciones = pagina?.content ?? []
  const total = pagina?.totalElements ?? 0
  const totalPaginas = pagina?.totalPages ?? 0
  const hayFiltros = busqueda.trim() !== '' || (esEscuela && facultadFiltro !== '')

  return (
    <section className="gestion-grupos__bloque" aria-labelledby={`bloque-${tipo}`}>
      <div className="gestion-grupos__bloque-cabecera">
        <h2 id={`bloque-${tipo}`} className="gestion-grupos__page-title">{TITULO[tipo]} <span className="gestion-grupos__conteo">({total})</span></h2>
        <button type="button" className="gestion-grupos__primary" onClick={() => navigate(RUTA_NUEVA[tipo])}>
          Nueva {tipo === TIPO_ESCUELA ? 'escuela' : 'facultad'}
        </button>
      </div>

      {error ? <p className="gestion-grupos__alert gestion-grupos__alert--error" role="alert">{error}</p> : null}
      {isLoading ? <p className="gestion-grupos__status">Cargando {TITULO[tipo].toLowerCase()}...</p> : null}

      {!isLoading && total === 0 ? (
        <p className="gestion-grupos__status">
          {hayFiltros ? `No hay ${TITULO[tipo].toLowerCase()} que coincidan con los filtros.` : `No hay ${TITULO[tipo].toLowerCase()} registradas.`}
        </p>
      ) : null}

      {!isLoading && instituciones.length > 0 ? (
        <div className="gestion-grupos__table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                {esEscuela ? <th>Facultad</th> : null}
                <th className="gestion-grupos__col-acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {instituciones.map((institucion) => {
                const editando = editandoId === institucion.id
                return (
                  <tr key={institucion.id}>
                    <td>
                      {editando ? (
                        <input aria-label="Nuevo nombre" value={nombreEditado} onChange={(e) => setNombreEditado(e.target.value)} />
                      ) : (
                        institucion.nombre
                      )}
                    </td>
                    {esEscuela ? (
                      <td>
                        {editando ? (
                          <select aria-label="Facultad de la escuela" value={padreEditado} onChange={(e) => setPadreEditado(e.target.value)}>
                            <option value="" disabled>Selecciona una facultad</option>
                            {facultades.map((facultad) => (
                              <option key={facultad.id} value={facultad.id}>{facultad.nombre}</option>
                            ))}
                          </select>
                        ) : institucion.institucionPadreNombre ? (
                          institucion.institucionPadreNombre
                        ) : (
                          <span className="gestion-grupos__estado gestion-grupos__estado--retirado">Sin facultad asignada</span>
                        )}
                      </td>
                    ) : null}
                    <td className="gestion-grupos__acciones gestion-grupos__acciones--derecha">
                      {editando ? (
                        <>
                          <button type="button" className="gestion-grupos__secondary" onClick={() => setEditandoId(null)} disabled={isGuardando}>Cancelar</button>
                          <button type="button" className="gestion-grupos__primary" onClick={() => void guardarEdicion(institucion)} disabled={isGuardando}>
                            {isGuardando ? 'Guardando...' : 'Guardar'}
                          </button>
                        </>
                      ) : (
                        <button type="button" className="gestion-grupos__edit" onClick={() => iniciarEdicion(institucion)} disabled={editandoId !== null}>
                          Editar
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {!isLoading && totalPaginas > 1 ? (
        <nav className="gestion-grupos__pagination" aria-label={`Paginación de ${TITULO[tipo].toLowerCase()}`}>
          <button type="button" disabled={numero === 0} onClick={() => setNumero(numero - 1)}>Anterior</button>
          <span>Página {numero + 1} de {totalPaginas}</span>
          <button type="button" disabled={numero >= totalPaginas - 1} onClick={() => setNumero(numero + 1)}>Siguiente</button>
        </nav>
      ) : null}
    </section>
  )
}

const InstitucionesGrupoPage = () => {
  const location = useLocation()
  const mensajeInicial = (location.state as MensajeNavegacion | null)?.mensaje ?? null

  const [seccion, setSeccion] = useState<TipoInstitucionGrupo>(TIPO_ESCUELA)
  const [facultades, setFacultades] = useState<InstitucionGrupoDto[]>([])
  const [mensaje, setMensaje] = useState<string | null>(mensajeInicial)
  const [busqueda, setBusqueda] = useState('')
  const [facultadFiltro, setFacultadFiltro] = useState('')

  useEffect(() => {
    getOpcionesInstituciones(TIPO_FACULTAD).then(setFacultades).catch(() => setFacultades([]))
  }, [])

  const hayFiltros = busqueda.trim() !== '' || facultadFiltro !== ''

  return (
    <GruposInvestigacionLayout>
      <section className="gestion-grupos">
        <header className="gestion-grupos__header">
          <p>Facultades de la UIS y las escuelas de cada una. Una escuela pertenece a una facultad, y los grupos de investigación pertenecen a una escuela.</p>
        </header>

        {mensaje ? <p className="gestion-grupos__alert gestion-grupos__alert--success" role="status">{mensaje}</p> : null}

        <div className="gestion-grupos__subtabs" role="tablist" aria-label="Tipo de institución">
          <button
            type="button"
            role="tab"
            aria-selected={seccion === TIPO_ESCUELA}
            className={`gestion-grupos__subtab${seccion === TIPO_ESCUELA ? ' gestion-grupos__subtab--active' : ''}`}
            onClick={() => setSeccion(TIPO_ESCUELA)}
          >
            Escuelas
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={seccion === TIPO_FACULTAD}
            className={`gestion-grupos__subtab${seccion === TIPO_FACULTAD ? ' gestion-grupos__subtab--active' : ''}`}
            onClick={() => setSeccion(TIPO_FACULTAD)}
          >
            Facultades
          </button>
        </div>

        {seccion === TIPO_ESCUELA ? (
          <>
            <div className="sapp-filters-panel">
              <label className="sapp-filter-field">
                <span>Buscar por nombre</span>
                <input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Ej. Eléctrica o Sistemas" />
              </label>
              <label className="sapp-filter-field">
                <span>Facultad</span>
                <select value={facultadFiltro} onChange={(e) => setFacultadFiltro(e.target.value)}>
                  <option value="">Todas</option>
                  <option value={SIN_FACULTAD}>Sin facultad asignada</option>
                  {facultades.map((facultad) => (
                    <option key={facultad.id} value={facultad.id}>{facultad.nombre}</option>
                  ))}
                </select>
              </label>
              <button type="button" className="sapp-filters-clear-button" onClick={() => { setBusqueda(''); setFacultadFiltro('') }} disabled={!hayFiltros}>
                Limpiar filtros
              </button>
            </div>
            <BloqueInstituciones
              tipo={TIPO_ESCUELA}
              busqueda={busqueda}
              facultadFiltro={facultadFiltro}
              facultades={facultades}
              onMensaje={setMensaje}
            />
          </>
        ) : (
          <BloqueInstituciones
            tipo={TIPO_FACULTAD}
            busqueda=""
            facultadFiltro=""
            facultades={facultades}
            onMensaje={setMensaje}
          />
        )}
      </section>
    </GruposInvestigacionLayout>
  )
}

export default InstitucionesGrupoPage

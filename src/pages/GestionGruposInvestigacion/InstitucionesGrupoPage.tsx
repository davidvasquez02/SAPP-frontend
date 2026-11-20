import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  eliminarInstitucionGrupo,
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
const TIPO_EXTERNA: TipoInstitucionGrupo = 'EXTERNA'
const TAMANO_PAGINA = 10

type Ambito = 'UIS' | 'EXTERNAS'

const RUTA_NUEVA: Record<TipoInstitucionGrupo, string> = {
  ESCUELA: `${RUTA_GRUPOS}/instituciones/escuelas/nueva`,
  FACULTAD: `${RUTA_GRUPOS}/instituciones/facultades/nueva`,
  EXTERNA: `${RUTA_GRUPOS}/instituciones/externas/nueva`,
}

const TITULO: Record<TipoInstitucionGrupo, string> = {
  ESCUELA: 'Escuelas',
  FACULTAD: 'Facultades',
  EXTERNA: 'Instituciones externas',
}

const SINGULAR: Record<TipoInstitucionGrupo, string> = {
  ESCUELA: 'Escuela',
  FACULTAD: 'Facultad',
  EXTERNA: 'Institución externa',
}

const BOTON_NUEVA: Record<TipoInstitucionGrupo, string> = {
  ESCUELA: 'Nueva escuela',
  FACULTAD: 'Nueva facultad',
  EXTERNA: 'Nueva institución externa',
}

interface MensajeNavegacion {
  mensaje?: string
  seccion?: TipoInstitucionGrupo
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
  const [confirmarEliminarId, setConfirmarEliminarId] = useState<number | null>(null)
  const [isEliminando, setIsEliminando] = useState(false)
  const solicitudRef = useRef(0)

  const esEscuela = tipo === TIPO_ESCUELA

  useEffect(() => {
    setNumero(0)
  }, [busqueda, facultadFiltro])

  useEffect(() => {
    const espera = setTimeout(() => {
      const filtros = {
        busqueda: busqueda.trim() || undefined,
        facultadId: esEscuela && facultadFiltro ? Number(facultadFiltro) : undefined,
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
      onMensaje(`${SINGULAR[tipo]} actualizada.`)
      setRecarga((valor) => valor + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible actualizar la institución.')
    } finally {
      setIsGuardando(false)
    }
  }

  const eliminar = async (institucion: InstitucionGrupoDto) => {
    setIsEliminando(true)
    setError(null)
    try {
      await eliminarInstitucionGrupo(institucion.id)
      setConfirmarEliminarId(null)
      onMensaje(`${SINGULAR[tipo]} "${institucion.nombre}" eliminada.`)
      setRecarga((valor) => valor + 1)
    } catch (err) {
      setConfirmarEliminarId(null)
      setError(err instanceof Error ? err.message : 'No fue posible eliminar la institución.')
    } finally {
      setIsEliminando(false)
    }
  }

  const instituciones = pagina?.content ?? []
  const total = pagina?.totalElements ?? 0
  const totalPaginas = pagina?.totalPages ?? 0
  const hayFiltros = busqueda.trim() !== '' || (esEscuela && facultadFiltro !== '')
  const minusculas = TITULO[tipo].toLowerCase()

  return (
    <section className="gestion-grupos__bloque" aria-labelledby={`bloque-${tipo}`}>
      <div className="gestion-grupos__bloque-cabecera">
        <h2 id={`bloque-${tipo}`} className="gestion-grupos__page-title">{TITULO[tipo]} <span className="gestion-grupos__conteo">({total})</span></h2>
        <button type="button" className="gestion-grupos__primary" onClick={() => navigate(RUTA_NUEVA[tipo])}>
          {BOTON_NUEVA[tipo]}
        </button>
      </div>

      {error ? <p className="gestion-grupos__alert gestion-grupos__alert--error" role="alert">{error}</p> : null}
      {isLoading ? <p className="gestion-grupos__status">Cargando {TITULO[tipo].toLowerCase()}...</p> : null}

      {!isLoading && total === 0 ? (
        <p className="gestion-grupos__status">
          {hayFiltros ? `No hay ${minusculas} que coincidan con los filtros.` : `No hay ${minusculas} registradas.`}
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
                      ) : confirmarEliminarId === institucion.id ? (
                        <>
                          <button type="button" className="gestion-grupos__secondary" onClick={() => setConfirmarEliminarId(null)} disabled={isEliminando}>Cancelar</button>
                          <button type="button" className="gestion-grupos__delete" onClick={() => void eliminar(institucion)} disabled={isEliminando}>
                            {isEliminando ? 'Eliminando...' : 'Confirmar eliminar'}
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" className="gestion-grupos__edit" onClick={() => iniciarEdicion(institucion)} disabled={editandoId !== null}>
                            Editar
                          </button>
                          <button type="button" className="gestion-grupos__delete" onClick={() => setConfirmarEliminarId(institucion.id)} disabled={editandoId !== null}>
                            Eliminar
                          </button>
                        </>
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
  const navegacion = location.state as MensajeNavegacion | null
  const mensajeInicial = navegacion?.mensaje ?? null

  const [ambito, setAmbito] = useState<Ambito>(navegacion?.seccion === TIPO_EXTERNA ? 'EXTERNAS' : 'UIS')
  // dentro de la UIS la facultad va primero: de ella dependen las escuelas
  const [seccion, setSeccion] = useState<TipoInstitucionGrupo>(
    navegacion?.seccion === TIPO_ESCUELA ? TIPO_ESCUELA : TIPO_FACULTAD,
  )
  const [facultades, setFacultades] = useState<InstitucionGrupoDto[]>([])
  const [mensaje, setMensaje] = useState<string | null>(mensajeInicial)
  const [busqueda, setBusqueda] = useState('')
  const [facultadFiltro, setFacultadFiltro] = useState('')

  useEffect(() => {
    getOpcionesInstituciones(TIPO_FACULTAD).then(setFacultades).catch(() => setFacultades([]))
  }, [])

  const tipoActivo: TipoInstitucionGrupo = ambito === 'EXTERNAS' ? TIPO_EXTERNA : seccion
  const muestraFiltros = tipoActivo !== TIPO_FACULTAD
  const hayFiltros = busqueda.trim() !== '' || facultadFiltro !== ''
  const limpiarFiltros = () => {
    setBusqueda('')
    setFacultadFiltro('')
  }

  const cambiarAmbito = (nuevo: Ambito) => {
    setAmbito(nuevo)
    limpiarFiltros()
  }
  const cambiarSeccion = (nueva: TipoInstitucionGrupo) => {
    setSeccion(nueva)
    limpiarFiltros()
  }

  return (
    <GruposInvestigacionLayout>
      <section className="gestion-grupos">
        <header className="gestion-grupos__header">
          <p>
            {ambito === 'UIS'
              ? 'Facultades de la UIS y las escuelas de cada una. Una escuela pertenece a una facultad, y los grupos de investigación pertenecen a una escuela.'
              : 'Instituciones de otras universidades u organizaciones. Se registran en general (por ejemplo, Universidad de Valencia), sin facultades ni escuelas.'}
          </p>
        </header>

        {mensaje ? <p className="gestion-grupos__alert gestion-grupos__alert--success" role="status">{mensaje}</p> : null}

        <div className="gestion-grupos__subtabs" role="tablist" aria-label="Ámbito de la institución">
          <button
            type="button"
            role="tab"
            aria-selected={ambito === 'UIS'}
            className={`gestion-grupos__subtab${ambito === 'UIS' ? ' gestion-grupos__subtab--active' : ''}`}
            onClick={() => cambiarAmbito('UIS')}
          >
            UIS
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={ambito === 'EXTERNAS'}
            className={`gestion-grupos__subtab${ambito === 'EXTERNAS' ? ' gestion-grupos__subtab--active' : ''}`}
            onClick={() => cambiarAmbito('EXTERNAS')}
          >
            Instituciones externas
          </button>
        </div>

        {ambito === 'UIS' ? (
          <div className="gestion-grupos__subtabs gestion-grupos__subtabs--nivel2" role="tablist" aria-label="Tipo de institución de la UIS">
            <button
              type="button"
              role="tab"
              aria-selected={seccion === TIPO_FACULTAD}
              className={`gestion-grupos__subtab${seccion === TIPO_FACULTAD ? ' gestion-grupos__subtab--active' : ''}`}
              onClick={() => cambiarSeccion(TIPO_FACULTAD)}
            >
              Facultades
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={seccion === TIPO_ESCUELA}
              className={`gestion-grupos__subtab${seccion === TIPO_ESCUELA ? ' gestion-grupos__subtab--active' : ''}`}
              onClick={() => cambiarSeccion(TIPO_ESCUELA)}
            >
              Escuelas
            </button>
          </div>
        ) : null}

        {muestraFiltros ? (
          <div className="sapp-filters-panel">
            <label className="sapp-filter-field">
              <span>Buscar por nombre</span>
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder={tipoActivo === TIPO_EXTERNA ? 'Ej. Valencia' : 'Ej. Eléctrica o Sistemas'}
              />
            </label>
            {tipoActivo === TIPO_ESCUELA ? (
              <label className="sapp-filter-field">
                <span>Facultad</span>
                <select value={facultadFiltro} onChange={(e) => setFacultadFiltro(e.target.value)}>
                  <option value="">Todas</option>
                  {facultades.map((facultad) => (
                    <option key={facultad.id} value={facultad.id}>{facultad.nombre}</option>
                  ))}
                </select>
              </label>
            ) : null}
            <button type="button" className="sapp-filters-clear-button" onClick={limpiarFiltros} disabled={!hayFiltros}>
              Limpiar filtros
            </button>
          </div>
        ) : null}

        <BloqueInstituciones
          key={tipoActivo}
          tipo={tipoActivo}
          busqueda={muestraFiltros ? busqueda : ''}
          facultadFiltro={tipoActivo === TIPO_ESCUELA ? facultadFiltro : ''}
          facultades={facultades}
          onMensaje={setMensaje}
        />
      </section>
    </GruposInvestigacionLayout>
  )
}

export default InstitucionesGrupoPage

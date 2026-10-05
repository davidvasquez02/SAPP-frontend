import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  getInstitucionesGrupo,
  modificarInstitucionGrupo,
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

const NOMBRE_TIPO: Record<TipoInstitucionGrupo, string> = {
  FACULTAD: 'Facultad',
  ESCUELA: 'Escuela',
}

interface MensajeNavegacion {
  mensaje?: string
}

const normalizarTexto = (texto: string) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

const InstitucionesGrupoPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const mensajeInicial = (location.state as MensajeNavegacion | null)?.mensaje ?? null

  const [instituciones, setInstituciones] = useState<InstitucionGrupoDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGuardando, setIsGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(mensajeInicial)

  const [busqueda, setBusqueda] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [facultadFiltro, setFacultadFiltro] = useState('')

  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [nombreEditado, setNombreEditado] = useState('')
  const [padreEditado, setPadreEditado] = useState('')

  const facultades = useMemo(
    () => instituciones.filter((institucion) => institucion.tipo === TIPO_FACULTAD),
    [instituciones],
  )

  const hayFiltros = busqueda.trim() !== '' || tipoFiltro !== '' || facultadFiltro !== ''

  const institucionesVisibles = useMemo(() => {
    const termino = normalizarTexto(busqueda)
    return instituciones.filter((institucion) => {
      if (tipoFiltro && institucion.tipo !== tipoFiltro) return false
      if (facultadFiltro) {
        if (facultadFiltro === SIN_FACULTAD) {
          if (institucion.tipo !== TIPO_ESCUELA || institucion.institucionPadreId) return false
        } else if (institucion.institucionPadreId !== Number(facultadFiltro)) {
          return false
        }
      }
      if (!termino) return true
      return [institucion.nombre, institucion.institucionPadreNombre ?? ''].some((campo) =>
        normalizarTexto(campo).includes(termino),
      )
    })
  }, [instituciones, busqueda, tipoFiltro, facultadFiltro])

  const limpiarFiltros = () => {
    setBusqueda('')
    setTipoFiltro('')
    setFacultadFiltro('')
  }

  const cargar = async () => {
    setError(null)
    try {
      setInstituciones(await getInstitucionesGrupo())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cargar las instituciones.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void cargar()
  }, [])

  const iniciarEdicion = (institucion: InstitucionGrupoDto) => {
    setEditandoId(institucion.id)
    setNombreEditado(institucion.nombre)
    setPadreEditado(institucion.institucionPadreId ? String(institucion.institucionPadreId) : '')
    setMensaje(null)
    setError(null)
  }

  const guardarEdicion = async (institucion: InstitucionGrupoDto) => {
    if (!nombreEditado.trim()) {
      setError('El nombre de la institución es obligatorio.')
      return
    }
    setIsGuardando(true)
    setError(null)
    setMensaje(null)
    try {
      await modificarInstitucionGrupo(institucion.id, {
        nombre: nombreEditado.trim(),
        institucionPadreId: institucion.tipo === TIPO_ESCUELA && padreEditado ? Number(padreEditado) : null,
      })
      setEditandoId(null)
      setMensaje('La institución fue actualizada.')
      await cargar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible actualizar la institución.')
    } finally {
      setIsGuardando(false)
    }
  }

  return (
    <GruposInvestigacionLayout>
      <section className="gestion-grupos">
        <header className="gestion-grupos__header">
          <p>Facultades y escuelas de la UIS. Una escuela pertenece a una facultad, y los grupos de investigación pertenecen a una escuela.</p>
          <button type="button" className="gestion-grupos__primary" onClick={() => navigate(`${RUTA_GRUPOS}/instituciones/nueva`)}>
            Nueva institución
          </button>
        </header>

        {error ? <p className="gestion-grupos__alert gestion-grupos__alert--error" role="alert">{error}</p> : null}
        {mensaje ? <p className="gestion-grupos__alert gestion-grupos__alert--success" role="status">{mensaje}</p> : null}

        {isLoading ? <p className="gestion-grupos__status">Cargando instituciones...</p> : null}

        {!isLoading && instituciones.length > 0 ? (
          <div className="sapp-filters-panel">
            <label className="sapp-filter-field">
              <span>Buscar por nombre de institución o facultad</span>
              <input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Ej. Eléctrica o Físico" />
            </label>
            <label className="sapp-filter-field">
              <span>Tipo</span>
              <select
                value={tipoFiltro}
                onChange={(e) => {
                  setTipoFiltro(e.target.value)
                  if (e.target.value === TIPO_FACULTAD) setFacultadFiltro('')
                }}
              >
                <option value="">Todos</option>
                <option value={TIPO_FACULTAD}>Facultad</option>
                <option value={TIPO_ESCUELA}>Escuela</option>
              </select>
            </label>
            <label className="sapp-filter-field">
              <span>Facultad</span>
              <select value={facultadFiltro} onChange={(e) => setFacultadFiltro(e.target.value)} disabled={tipoFiltro === TIPO_FACULTAD}>
                <option value="">Todas</option>
                <option value={SIN_FACULTAD}>Sin facultad asignada</option>
                {facultades.map((facultad) => (
                  <option key={facultad.id} value={facultad.id}>{facultad.nombre}</option>
                ))}
              </select>
            </label>
            <button type="button" className="sapp-filters-clear-button" onClick={limpiarFiltros} disabled={!hayFiltros}>
              Limpiar filtros
            </button>
          </div>
        ) : null}

        {!isLoading && instituciones.length === 0 ? (
          <p className="gestion-grupos__status">No hay instituciones registradas.</p>
        ) : null}

        {!isLoading && instituciones.length > 0 && institucionesVisibles.length === 0 ? (
          <p className="gestion-grupos__status">No hay instituciones que coincidan con los filtros.</p>
        ) : null}

        {!isLoading && institucionesVisibles.length > 0 ? (
          <div className="gestion-grupos__table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Facultad</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {institucionesVisibles.map((institucion) => {
                  const editando = editandoId === institucion.id
                  return (
                    <tr key={institucion.id}>
                      <td>
                        {editando ? (
                          <input
                            aria-label="Nuevo nombre de la institución"
                            value={nombreEditado}
                            onChange={(e) => setNombreEditado(e.target.value)}
                          />
                        ) : (
                          institucion.nombre
                        )}
                      </td>
                      <td>{NOMBRE_TIPO[institucion.tipo]}</td>
                      <td>
                        {institucion.tipo === TIPO_FACULTAD ? (
                          <span>—</span>
                        ) : editando ? (
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
                      <td className="gestion-grupos__acciones">
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
      </section>
    </GruposInvestigacionLayout>
  )
}

export default InstitucionesGrupoPage

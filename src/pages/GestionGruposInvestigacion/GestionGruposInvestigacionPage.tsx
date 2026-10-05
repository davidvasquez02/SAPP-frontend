import { useEffect, useState } from 'react'
import { ModuleLayout } from '../../components'
import {
  crearGrupoGestion,
  crearInstitucionGrupo,
  desactivarGrupoGestion,
  getGruposGestion,
  getInstitucionesGrupo,
  modificarGrupoGestion,
  modificarInstitucionGrupo,
} from '../../api/gruposInvestigacionGestionService'
import type {
  GrupoGestionDto,
  InstitucionGrupoDto,
} from '../../api/gruposInvestigacionGestionTypes'
import './GestionGruposInvestigacionPage.css'

const NUEVA_INSTITUCION = 'NUEVA'

const normalizarTexto = (texto: string) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

interface FormState {
  codigo: string
  nombre: string
  institucionId: string
  nuevaInstitucion: string
}

const FORM_VACIO: FormState = {
  codigo: '',
  nombre: '',
  institucionId: '',
  nuevaInstitucion: '',
}

const GestionGruposInvestigacionPage = () => {
  const [grupos, setGrupos] = useState<GrupoGestionDto[]>([])
  const [instituciones, setInstituciones] = useState<InstitucionGrupoDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [editando, setEditando] = useState<GrupoGestionDto | 'nuevo' | null>(null)
  const [form, setForm] = useState<FormState>(FORM_VACIO)
  const [isGuardando, setIsGuardando] = useState(false)
  const [corrigiendoInstitucion, setCorrigiendoInstitucion] = useState(false)
  const [nombreCorregido, setNombreCorregido] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [institucionFiltro, setInstitucionFiltro] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('')

  const institucionSeleccionada = instituciones.find((i) => String(i.id) === form.institucionId) ?? null

  const hayFiltros = busqueda.trim() !== '' || institucionFiltro !== '' || estadoFiltro !== ''

  const gruposFiltrados = grupos.filter((grupo) => {
    if (institucionFiltro && String(grupo.institucionId) !== institucionFiltro) return false
    if (estadoFiltro && grupo.estado !== estadoFiltro) return false
    const termino = normalizarTexto(busqueda)
    if (!termino) return true
    return [grupo.codigo, grupo.nombre, grupo.institucionNombre].some((campo) =>
      normalizarTexto(campo ?? '').includes(termino),
    )
  })

  const limpiarFiltros = () => {
    setBusqueda('')
    setInstitucionFiltro('')
    setEstadoFiltro('')
  }

  const cargar = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [gruposData, institucionesData] = await Promise.all([
        getGruposGestion(),
        getInstitucionesGrupo(),
      ])
      setGrupos(gruposData)
      setInstituciones(institucionesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cargar los grupos de investigación.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void cargar()
  }, [])

  const abrirNuevo = () => {
    setEditando('nuevo')
    setForm(FORM_VACIO)
    setError(null)
    setMensaje(null)
  }

  const abrirEdicion = (grupo: GrupoGestionDto) => {
    setEditando(grupo)
    setForm({
      codigo: grupo.codigo,
      nombre: grupo.nombre,
      institucionId: String(grupo.institucionId),
      nuevaInstitucion: '',
    })
    setError(null)
    setMensaje(null)
  }

  const cerrarFormulario = () => {
    setEditando(null)
    setForm(FORM_VACIO)
    setCorrigiendoInstitucion(false)
    setNombreCorregido('')
  }

  const guardarCorreccionInstitucion = async () => {
    if (!institucionSeleccionada) return
    if (!nombreCorregido.trim()) {
      setError('El nombre de la institución es obligatorio.')
      return
    }
    setIsGuardando(true)
    setError(null)
    setMensaje(null)
    try {
      await modificarInstitucionGrupo(institucionSeleccionada.id, nombreCorregido.trim())
      setCorrigiendoInstitucion(false)
      setMensaje('El nombre de la institución fue corregido.')
      await cargar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible corregir la institución.')
    } finally {
      setIsGuardando(false)
    }
  }

  const guardar = async () => {
    if (!form.codigo.trim() || !form.nombre.trim()) {
      setError('El código y el nombre del grupo son obligatorios.')
      return
    }
    if (!form.institucionId) {
      setError('Selecciona la institución del grupo.')
      return
    }

    setIsGuardando(true)
    setError(null)
    setMensaje(null)
    try {
      let institucionId: number
      if (form.institucionId === NUEVA_INSTITUCION) {
        if (!form.nuevaInstitucion.trim()) {
          setError('Escribe el nombre de la nueva institución.')
          return
        }
        const creada = await crearInstitucionGrupo(form.nuevaInstitucion.trim())
        institucionId = creada.id
      } else {
        institucionId = Number(form.institucionId)
      }

      const request = { codigo: form.codigo.trim(), nombre: form.nombre.trim(), institucionId }
      if (editando === 'nuevo') {
        await crearGrupoGestion(request)
        setMensaje('Grupo de investigación creado correctamente.')
      } else if (editando) {
        await modificarGrupoGestion(editando.id, request)
        setMensaje('Grupo de investigación actualizado correctamente.')
      }

      cerrarFormulario()
      await cargar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible guardar el grupo.')
    } finally {
      setIsGuardando(false)
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
    <ModuleLayout title="Grupos de investigación">
      <section className="gestion-grupos">
        <header className="gestion-grupos__header">
          <p>Crea, modifica o retira los grupos de investigación. Un grupo retirado se conserva con su historial y deja de ofrecerse para nuevas asignaciones.</p>
          <button type="button" className="gestion-grupos__primary" onClick={abrirNuevo} disabled={editando !== null}>
            Nuevo grupo
          </button>
        </header>

        {error ? <p className="gestion-grupos__alert gestion-grupos__alert--error" role="alert">{error}</p> : null}
        {mensaje ? <p className="gestion-grupos__alert gestion-grupos__alert--success" role="status">{mensaje}</p> : null}

        {editando !== null ? (
          <form
            className="gestion-grupos__form"
            onSubmit={(event) => {
              event.preventDefault()
              void guardar()
            }}
          >
            <h2>{editando === 'nuevo' ? 'Nuevo grupo' : `Editar ${editando.codigo}`}</h2>

            <label>
              Código
              <input value={form.codigo} onChange={(e) => setForm((c) => ({ ...c, codigo: e.target.value }))} />
            </label>

            <label>
              Nombre
              <input value={form.nombre} onChange={(e) => setForm((c) => ({ ...c, nombre: e.target.value }))} />
            </label>

            <label>
              Institución
              <select
                value={form.institucionId}
                onChange={(e) => setForm((c) => ({ ...c, institucionId: e.target.value, nuevaInstitucion: '' }))}
              >
                <option value="">Selecciona una institución</option>
                {instituciones.map((institucion) => (
                  <option key={institucion.id} value={institucion.id}>
                    {institucion.nombre}
                  </option>
                ))}
                <option value={NUEVA_INSTITUCION}>+ Nueva institución…</option>
              </select>
            </label>

            {institucionSeleccionada && !corrigiendoInstitucion ? (
              <div className="gestion-grupos__institucion-acciones">
                <button
                  type="button"
                  className="gestion-grupos__secondary"
                  onClick={() => {
                    setNombreCorregido(institucionSeleccionada.nombre)
                    setCorrigiendoInstitucion(true)
                  }}
                >
                  Corregir nombre de la institución
                </button>
              </div>
            ) : null}

            {institucionSeleccionada && corrigiendoInstitucion ? (
              <div className="gestion-grupos__institucion-acciones">
                <label>
                  Nombre corregido de la institución
                  <input value={nombreCorregido} onChange={(e) => setNombreCorregido(e.target.value)} />
                </label>
                <button type="button" className="gestion-grupos__secondary" onClick={() => setCorrigiendoInstitucion(false)} disabled={isGuardando}>
                  Cancelar corrección
                </button>
                <button type="button" className="gestion-grupos__primary" onClick={() => void guardarCorreccionInstitucion()} disabled={isGuardando}>
                  {isGuardando ? 'Guardando...' : 'Guardar nombre'}
                </button>
              </div>
            ) : null}

            {form.institucionId === NUEVA_INSTITUCION ? (
              <label>
                Nombre de la nueva institución
                <input
                  value={form.nuevaInstitucion}
                  onChange={(e) => setForm((c) => ({ ...c, nuevaInstitucion: e.target.value }))}
                />
                <span className="gestion-grupos__hint">
                  Revisa primero la lista: si la institución ya existe, selecciónala arriba en lugar de crearla.
                </span>
              </label>
            ) : null}

            <div className="gestion-grupos__form-actions">
              <button type="button" className="gestion-grupos__secondary" onClick={cerrarFormulario} disabled={isGuardando}>Cancelar</button>
              <button type="submit" className="gestion-grupos__primary" disabled={isGuardando}>
                {isGuardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        ) : null}

        {isLoading ? <p className="gestion-grupos__status">Cargando grupos...</p> : null}

        {!isLoading && grupos.length === 0 ? (
          <p className="gestion-grupos__status">No hay grupos de investigación registrados.</p>
        ) : null}

        {!isLoading && grupos.length > 0 ? (
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

        {!isLoading && grupos.length > 0 && gruposFiltrados.length === 0 ? (
          <p className="gestion-grupos__status">No hay grupos que coincidan con los filtros.</p>
        ) : null}

        {!isLoading && gruposFiltrados.length > 0 ? (
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
                {gruposFiltrados.map((grupo) => (
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
                      <button type="button" className="gestion-grupos__edit" onClick={() => abrirEdicion(grupo)} disabled={editando !== null}>
                        Editar
                      </button>
                      {grupo.estado === 'ACTIVO' ? (
                        <button type="button" className="gestion-grupos__delete" onClick={() => void retirar(grupo)} disabled={editando !== null}>
                          Retirar
                        </button>
                      ) : null}
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

export default GestionGruposInvestigacionPage

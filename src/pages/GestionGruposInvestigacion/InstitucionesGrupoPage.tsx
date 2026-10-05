import { useEffect, useMemo, useState } from 'react'
import {
  crearInstitucionGrupo,
  getInstitucionesGrupo,
  modificarInstitucionGrupo,
} from '../../api/gruposInvestigacionGestionService'
import type {
  InstitucionGrupoDto,
  TipoInstitucionGrupo,
} from '../../api/gruposInvestigacionGestionTypes'
import { GruposInvestigacionLayout } from './GruposInvestigacionLayout'
import './GestionGruposInvestigacionPage.css'

const TIPO_ESCUELA: TipoInstitucionGrupo = 'ESCUELA'
const TIPO_FACULTAD: TipoInstitucionGrupo = 'FACULTAD'

const NOMBRE_TIPO: Record<TipoInstitucionGrupo, string> = {
  FACULTAD: 'Facultad',
  ESCUELA: 'Escuela',
}

const InstitucionesGrupoPage = () => {
  const [instituciones, setInstituciones] = useState<InstitucionGrupoDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGuardando, setIsGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const [tipoNueva, setTipoNueva] = useState<TipoInstitucionGrupo>(TIPO_ESCUELA)
  const [nombreNueva, setNombreNueva] = useState('')
  const [padreNueva, setPadreNueva] = useState('')

  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [nombreEditado, setNombreEditado] = useState('')
  const [padreEditado, setPadreEditado] = useState('')

  const facultades = useMemo(
    () => instituciones.filter((institucion) => institucion.tipo === TIPO_FACULTAD),
    [instituciones],
  )

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

  const agregar = async () => {
    if (!nombreNueva.trim()) {
      setError('Escribe el nombre de la institución.')
      return
    }
    if (tipoNueva === TIPO_ESCUELA && !padreNueva) {
      setError('Selecciona la facultad a la que pertenece la escuela.')
      return
    }
    setIsGuardando(true)
    setError(null)
    setMensaje(null)
    try {
      const creada = await crearInstitucionGrupo({
        nombre: nombreNueva.trim(),
        tipo: tipoNueva,
        institucionPadreId: tipoNueva === TIPO_ESCUELA ? Number(padreNueva) : null,
      })
      setNombreNueva('')
      setPadreNueva('')
      setMensaje(`${NOMBRE_TIPO[creada.tipo]} "${creada.nombre}" agregada.`)
      await cargar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible agregar la institución.')
    } finally {
      setIsGuardando(false)
    }
  }

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

  const sinFacultades = facultades.length === 0

  return (
    <GruposInvestigacionLayout>
      <section className="gestion-grupos">
        <header className="gestion-grupos__header">
          <p>Facultades y escuelas de la UIS. Una escuela pertenece a una facultad, y los grupos de investigación pertenecen a una escuela. Revisa primero la lista: si la institución ya existe, no la agregues de nuevo; el sistema tampoco permite nombres repetidos.</p>
        </header>

        {error ? <p className="gestion-grupos__alert gestion-grupos__alert--error" role="alert">{error}</p> : null}
        {mensaje ? <p className="gestion-grupos__alert gestion-grupos__alert--success" role="status">{mensaje}</p> : null}

        <form
          className="gestion-grupos__inline-form"
          onSubmit={(event) => {
            event.preventDefault()
            void agregar()
          }}
        >
          <label>
            Tipo
            <select value={tipoNueva} onChange={(e) => setTipoNueva(e.target.value as TipoInstitucionGrupo)}>
              <option value={TIPO_ESCUELA}>Escuela</option>
              <option value={TIPO_FACULTAD}>Facultad</option>
            </select>
          </label>
          <label>
            Nombre
            <input value={nombreNueva} onChange={(e) => setNombreNueva(e.target.value)} placeholder="Nombre completo" />
          </label>
          {tipoNueva === TIPO_ESCUELA ? (
            <label>
              Facultad
              <select value={padreNueva} onChange={(e) => setPadreNueva(e.target.value)} disabled={sinFacultades}>
                <option value="">{sinFacultades ? 'Primero registra una facultad' : 'Selecciona una facultad'}</option>
                {facultades.map((facultad) => (
                  <option key={facultad.id} value={facultad.id}>{facultad.nombre}</option>
                ))}
              </select>
            </label>
          ) : null}
          <button type="submit" className="gestion-grupos__primary" disabled={isGuardando}>
            {isGuardando ? 'Guardando...' : 'Agregar'}
          </button>
        </form>

        {isLoading ? <p className="gestion-grupos__status">Cargando instituciones...</p> : null}

        {!isLoading && instituciones.length === 0 ? (
          <p className="gestion-grupos__status">No hay instituciones registradas.</p>
        ) : null}

        {!isLoading && instituciones.length > 0 ? (
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
                {instituciones.map((institucion) => {
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

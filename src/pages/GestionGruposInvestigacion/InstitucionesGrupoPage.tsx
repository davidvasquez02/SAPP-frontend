import { useEffect, useState } from 'react'
import {
  crearInstitucionGrupo,
  getInstitucionesGrupo,
  modificarInstitucionGrupo,
} from '../../api/gruposInvestigacionGestionService'
import type { InstitucionGrupoDto } from '../../api/gruposInvestigacionGestionTypes'
import { GruposInvestigacionLayout } from './GruposInvestigacionLayout'
import './GestionGruposInvestigacionPage.css'

const InstitucionesGrupoPage = () => {
  const [instituciones, setInstituciones] = useState<InstitucionGrupoDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGuardando, setIsGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [nuevaInstitucion, setNuevaInstitucion] = useState('')
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [nombreEditado, setNombreEditado] = useState('')

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
    if (!nuevaInstitucion.trim()) {
      setError('Escribe el nombre de la institución.')
      return
    }
    setIsGuardando(true)
    setError(null)
    setMensaje(null)
    try {
      const creada = await crearInstitucionGrupo(nuevaInstitucion.trim())
      setNuevaInstitucion('')
      setMensaje(`La institución "${creada.nombre}" fue agregada.`)
      await cargar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible agregar la institución.')
    } finally {
      setIsGuardando(false)
    }
  }

  const guardarCorreccion = async (institucion: InstitucionGrupoDto) => {
    if (!nombreEditado.trim()) {
      setError('El nombre de la institución es obligatorio.')
      return
    }
    setIsGuardando(true)
    setError(null)
    setMensaje(null)
    try {
      await modificarInstitucionGrupo(institucion.id, nombreEditado.trim())
      setEditandoId(null)
      setMensaje('El nombre de la institución fue corregido.')
      await cargar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible corregir la institución.')
    } finally {
      setIsGuardando(false)
    }
  }

  return (
    <GruposInvestigacionLayout>
      <section className="gestion-grupos">
        <header className="gestion-grupos__header">
          <p>Catálogo de instituciones de los grupos de investigación. Los grupos se asocian a una institución de esta lista. La escuela de la EISI se marca como interna.</p>
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
            Nueva institución
            <input value={nuevaInstitucion} onChange={(e) => setNuevaInstitucion(e.target.value)} placeholder="Nombre completo de la institución" />
          </label>
          <button type="submit" className="gestion-grupos__primary" disabled={isGuardando}>
            {isGuardando ? 'Guardando...' : 'Agregar institución'}
          </button>
        </form>
        <p className="gestion-grupos__hint">Revisa primero la lista: si la institución ya existe, no la agregues de nuevo. El sistema tampoco permite nombres repetidos.</p>

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
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {instituciones.map((institucion) => (
                  <tr key={institucion.id}>
                    <td>
                      {editandoId === institucion.id ? (
                        <input
                          aria-label="Nuevo nombre de la institución"
                          value={nombreEditado}
                          onChange={(e) => setNombreEditado(e.target.value)}
                        />
                      ) : (
                        institucion.nombre
                      )}
                    </td>
                    <td>
                      <span className={`gestion-grupos__estado gestion-grupos__estado--${institucion.interna ? 'activo' : 'retirado'}`}>
                        {institucion.interna ? 'Interna (EISI)' : 'Externa'}
                      </span>
                    </td>
                    <td className="gestion-grupos__acciones">
                      {editandoId === institucion.id ? (
                        <>
                          <button type="button" className="gestion-grupos__secondary" onClick={() => setEditandoId(null)} disabled={isGuardando}>Cancelar</button>
                          <button type="button" className="gestion-grupos__primary" onClick={() => void guardarCorreccion(institucion)} disabled={isGuardando}>
                            {isGuardando ? 'Guardando...' : 'Guardar nombre'}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="gestion-grupos__edit"
                          onClick={() => {
                            setEditandoId(institucion.id)
                            setNombreEditado(institucion.nombre)
                            setMensaje(null)
                          }}
                          disabled={editandoId !== null}
                        >
                          Corregir nombre
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

export default InstitucionesGrupoPage

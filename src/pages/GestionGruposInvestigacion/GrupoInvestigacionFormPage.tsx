import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  crearGrupoGestion,
  getGruposGestion,
  getOpcionesInstituciones,
  modificarGrupoGestion,
} from '../../api/gruposInvestigacionGestionService'
import type {
  GrupoGestionDto,
  InstitucionGrupoDto,
} from '../../api/gruposInvestigacionGestionTypes'
import { GruposInvestigacionLayout, RUTA_GRUPOS } from './GruposInvestigacionLayout'
import './GestionGruposInvestigacionPage.css'

type Origen = 'UIS' | 'EXTERNA'

const GrupoInvestigacionFormPage = () => {
  const navigate = useNavigate()
  const { grupoId } = useParams<{ grupoId: string }>()
  const esEdicion = grupoId !== undefined

  const [instituciones, setInstituciones] = useState<InstitucionGrupoDto[]>([])
  const [grupoOriginal, setGrupoOriginal] = useState<GrupoGestionDto | null>(null)
  const [codigo, setCodigo] = useState('')
  const [nombre, setNombre] = useState('')
  const [origen, setOrigen] = useState<Origen | null>(null)
  const [institucionId, setInstitucionId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isGuardando, setIsGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cargarDatos = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [escuelas, externas, gruposData] = await Promise.all([
          getOpcionesInstituciones('ESCUELA'),
          getOpcionesInstituciones('EXTERNA'),
          esEdicion ? getGruposGestion() : Promise.resolve([] as GrupoGestionDto[]),
        ])
        const institucionesData = [...escuelas, ...externas]
        setInstituciones(institucionesData)
        if (esEdicion) {
          const grupo = gruposData.find((item) => String(item.id) === grupoId)
          if (!grupo) {
            setError('No existe el grupo de investigación indicado.')
            return
          }
          setGrupoOriginal(grupo)
          setCodigo(grupo.codigo)
          setNombre(grupo.nombre)
          setInstitucionId(String(grupo.institucionId))
          // el origen se deduce de la institución actual del grupo
          setOrigen(institucionesData.find((item) => item.id === grupo.institucionId)?.tipo === 'EXTERNA' ? 'EXTERNA' : 'UIS')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No fue posible cargar el grupo de investigación.')
      } finally {
        setIsLoading(false)
      }
    }
    void cargarDatos()
  }, [esEdicion, grupoId])

  const volver = () => navigate(RUTA_GRUPOS)

  const guardar = async () => {
    if (!codigo.trim() || !nombre.trim()) {
      setError('El código y el nombre del grupo son obligatorios.')
      return
    }
    if (!origen) {
      setError('Indica si el grupo es de la UIS o de una institución externa.')
      return
    }
    if (!institucionId) {
      setError(origen === 'UIS' ? 'Selecciona la escuela del grupo.' : 'Selecciona la institución externa del grupo.')
      return
    }

    setIsGuardando(true)
    setError(null)
    try {
      const request = { codigo: codigo.trim(), nombre: nombre.trim(), institucionId: Number(institucionId) }
      if (grupoOriginal) {
        await modificarGrupoGestion(grupoOriginal.id, request)
        navigate(RUTA_GRUPOS, { state: { mensaje: 'Grupo de investigación actualizado correctamente.' } })
      } else {
        await crearGrupoGestion(request)
        navigate(RUTA_GRUPOS, { state: { mensaje: 'Grupo de investigación creado correctamente.' } })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible guardar el grupo.')
    } finally {
      setIsGuardando(false)
    }
  }

  const cambiarOrigen = (nuevo: Origen) => {
    if (nuevo === origen) return
    setOrigen(nuevo)
    // la institución elegida pertenece al otro origen: se limpia para no guardar una combinación incorrecta
    setInstitucionId('')
  }

  const tipoInstitucion = origen === 'EXTERNA' ? 'EXTERNA' : 'ESCUELA'
  const opciones = instituciones.filter((institucion) => institucion.tipo === tipoInstitucion)

  const titulo = esEdicion ? `Editar ${grupoOriginal?.codigo ?? ''}`.trim() : 'Nuevo grupo'

  return (
    <GruposInvestigacionLayout>
      <section className="gestion-grupos">
        <header className="gestion-grupos__header">
          <div>
            <h2 className="gestion-grupos__page-title">{titulo}</h2>
          </div>
        </header>

        {error ? <p className="gestion-grupos__alert gestion-grupos__alert--error" role="alert">{error}</p> : null}
        {isLoading ? <p className="gestion-grupos__status">Cargando...</p> : null}

        {!isLoading && !(esEdicion && !grupoOriginal) ? (
          <form
            className="gestion-grupos__form"
            onSubmit={(event) => {
              event.preventDefault()
              void guardar()
            }}
          >
            <label>
              Código
              <input value={codigo} onChange={(e) => setCodigo(e.target.value)} />
            </label>

            <label>
              Nombre
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </label>

            <fieldset className="gestion-grupos__origen">
              <legend>El grupo es de</legend>
              <label className="gestion-grupos__opcion">
                <input type="radio" name="origen-grupo" checked={origen === 'UIS'} onChange={() => cambiarOrigen('UIS')} />
                <span>La UIS</span>
              </label>
              <label className="gestion-grupos__opcion">
                <input type="radio" name="origen-grupo" checked={origen === 'EXTERNA'} onChange={() => cambiarOrigen('EXTERNA')} />
                <span>Una institución externa</span>
              </label>
            </fieldset>

            <label>
              {origen === 'EXTERNA' ? 'Institución externa' : 'Escuela'}
              <select value={institucionId} onChange={(e) => setInstitucionId(e.target.value)} disabled={!origen}>
                <option value="">
                  {!origen
                    ? 'Primero indica si el grupo es de la UIS o externo'
                    : origen === 'UIS'
                      ? 'Selecciona una escuela'
                      : 'Selecciona una institución externa'}
                </option>
                {opciones.map((institucion) => (
                  <option key={institucion.id} value={institucion.id}>
                    {institucion.nombre}
                  </option>
                ))}
              </select>
            </label>

            <div className="gestion-grupos__form-actions">
              <button type="button" className="gestion-grupos__secondary" onClick={volver} disabled={isGuardando}>Cancelar</button>
              <button type="submit" className="gestion-grupos__primary" disabled={isGuardando}>
                {isGuardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        ) : null}
      </section>
    </GruposInvestigacionLayout>
  )
}

export default GrupoInvestigacionFormPage

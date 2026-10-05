import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
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

const GrupoInvestigacionFormPage = () => {
  const navigate = useNavigate()
  const { grupoId } = useParams<{ grupoId: string }>()
  const esEdicion = grupoId !== undefined

  const [instituciones, setInstituciones] = useState<InstitucionGrupoDto[]>([])
  const [grupoOriginal, setGrupoOriginal] = useState<GrupoGestionDto | null>(null)
  const [codigo, setCodigo] = useState('')
  const [nombre, setNombre] = useState('')
  const [institucionId, setInstitucionId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isGuardando, setIsGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cargarDatos = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [institucionesData, gruposData] = await Promise.all([
          getOpcionesInstituciones('ESCUELA'),
          esEdicion ? getGruposGestion() : Promise.resolve([] as GrupoGestionDto[]),
        ])
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
    if (!institucionId) {
      setError('Selecciona la institución del grupo.')
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

  const titulo = esEdicion ? `Editar ${grupoOriginal?.codigo ?? ''}`.trim() : 'Nuevo grupo'

  return (
    <GruposInvestigacionLayout>
      <section className="gestion-grupos">
        <header className="gestion-grupos__header">
          <div>
            <h2 className="gestion-grupos__page-title">{titulo}</h2>
            <p>Un grupo pertenece a una escuela de la UIS. Si la escuela no aparece, agrégala primero en la pestaña <Link to={`${RUTA_GRUPOS}/instituciones`}>Instituciones</Link>.</p>
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

            <label>
              Escuela
              <select value={institucionId} onChange={(e) => setInstitucionId(e.target.value)}>
                <option value="">Selecciona una escuela</option>
                {instituciones.filter((institucion) => institucion.tipo === 'ESCUELA').map((institucion) => (
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

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  crearInstitucionGrupo,
  getOpcionesInstituciones,
} from '../../api/gruposInvestigacionGestionService'
import type {
  InstitucionGrupoDto,
  TipoInstitucionGrupo,
} from '../../api/gruposInvestigacionGestionTypes'
import { GruposInvestigacionLayout, RUTA_GRUPOS } from './GruposInvestigacionLayout'
import './GestionGruposInvestigacionPage.css'

interface InstitucionFormPageProps {
  tipo: TipoInstitucionGrupo
}

/** Alta de una escuela o de una facultad, cada una en su propia pantalla. */
const InstitucionFormPage = ({ tipo }: InstitucionFormPageProps) => {
  const navigate = useNavigate()
  const esEscuela = tipo === 'ESCUELA'
  const esExterna = tipo === 'EXTERNA'
  const etiqueta = esEscuela ? 'escuela' : esExterna ? 'institución externa' : 'facultad'
  const etiquetaCapital = esEscuela ? 'Escuela' : esExterna ? 'Institución externa' : 'Facultad'

  const [facultades, setFacultades] = useState<InstitucionGrupoDto[]>([])
  const [nombre, setNombre] = useState('')
  const [facultadId, setFacultadId] = useState('')
  const [isLoading, setIsLoading] = useState(esEscuela)
  const [isGuardando, setIsGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!esEscuela) return
    getOpcionesInstituciones('FACULTAD')
      .then(setFacultades)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'No fue posible cargar las facultades.'))
      .finally(() => setIsLoading(false))
  }, [esEscuela])

  const volver = () => navigate(`${RUTA_GRUPOS}/instituciones`, { state: { seccion: tipo } })

  const guardar = async () => {
    if (!nombre.trim()) {
      setError(`Escribe el nombre de la ${etiqueta}.`)
      return
    }
    if (esEscuela && !facultadId) {
      setError('Selecciona la facultad a la que pertenece la escuela.')
      return
    }

    setIsGuardando(true)
    setError(null)
    try {
      const creada = await crearInstitucionGrupo({
        nombre: nombre.trim(),
        tipo,
        institucionPadreId: esEscuela ? Number(facultadId) : null,
      })
      navigate(`${RUTA_GRUPOS}/instituciones`, {
        state: {
          mensaje: `${etiquetaCapital} "${creada.nombre}" agregada correctamente.`,
          seccion: tipo,
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : `No fue posible agregar la ${etiqueta}.`)
    } finally {
      setIsGuardando(false)
    }
  }

  const sinFacultades = esEscuela && !isLoading && facultades.length === 0

  return (
    <GruposInvestigacionLayout>
      <section className="gestion-grupos">
        <header className="gestion-grupos__header">
          <div>
            <h2 className="gestion-grupos__page-title">Nueva {etiqueta}</h2>
            <p>
              Revisa primero la lista: si la {etiqueta} ya existe, no la agregues de nuevo. El sistema tampoco permite nombres repetidos.
              {esExterna ? ' Regístrala en general, sin facultades ni escuelas (por ejemplo, Universidad de Valencia).' : null}
              {esEscuela ? <> Si la facultad no aparece, agrégala primero en <Link to={`${RUTA_GRUPOS}/instituciones`}>Instituciones</Link>.</> : null}
            </p>
          </div>
        </header>

        {error ? <p className="gestion-grupos__alert gestion-grupos__alert--error" role="alert">{error}</p> : null}
        {isLoading ? <p className="gestion-grupos__status">Cargando...</p> : null}

        {!isLoading ? (
          <form
            className="gestion-grupos__form"
            onSubmit={(event) => {
              event.preventDefault()
              void guardar()
            }}
          >
            <label>
              Nombre
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={esExterna ? 'Ej. Universidad de Valencia' : 'Nombre completo'} />
            </label>

            {esEscuela ? (
              <label>
                Facultad
                <select value={facultadId} onChange={(e) => setFacultadId(e.target.value)} disabled={sinFacultades}>
                  <option value="">{sinFacultades ? 'Primero registra una facultad' : 'Selecciona una facultad'}</option>
                  {facultades.map((facultad) => (
                    <option key={facultad.id} value={facultad.id}>{facultad.nombre}</option>
                  ))}
                </select>
              </label>
            ) : null}

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

export default InstitucionFormPage

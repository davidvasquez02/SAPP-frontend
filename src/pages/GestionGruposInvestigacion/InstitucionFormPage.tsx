import { useEffect, useMemo, useState } from 'react'
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

const TIPO_ESCUELA: TipoInstitucionGrupo = 'ESCUELA'
const TIPO_FACULTAD: TipoInstitucionGrupo = 'FACULTAD'

const InstitucionFormPage = () => {
  const navigate = useNavigate()
  const [instituciones, setInstituciones] = useState<InstitucionGrupoDto[]>([])
  const [tipo, setTipo] = useState<TipoInstitucionGrupo>(TIPO_ESCUELA)
  const [nombre, setNombre] = useState('')
  const [facultadId, setFacultadId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isGuardando, setIsGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const facultades = useMemo(
    () => instituciones.filter((institucion) => institucion.tipo === TIPO_FACULTAD),
    [instituciones],
  )
  const sinFacultades = facultades.length === 0

  useEffect(() => {
    getOpcionesInstituciones('FACULTAD')
      .then(setInstituciones)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'No fue posible cargar las instituciones.'))
      .finally(() => setIsLoading(false))
  }, [])

  const volver = () => navigate(`${RUTA_GRUPOS}/instituciones`)

  const guardar = async () => {
    if (!nombre.trim()) {
      setError('Escribe el nombre de la institución.')
      return
    }
    if (tipo === TIPO_ESCUELA && !facultadId) {
      setError('Selecciona la facultad a la que pertenece la escuela.')
      return
    }

    setIsGuardando(true)
    setError(null)
    try {
      const creada = await crearInstitucionGrupo({
        nombre: nombre.trim(),
        tipo,
        institucionPadreId: tipo === TIPO_ESCUELA ? Number(facultadId) : null,
      })
      const etiqueta = creada.tipo === TIPO_FACULTAD ? 'Facultad' : 'Escuela'
      navigate(`${RUTA_GRUPOS}/instituciones`, {
        state: { mensaje: `${etiqueta} "${creada.nombre}" agregada correctamente.` },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible agregar la institución.')
    } finally {
      setIsGuardando(false)
    }
  }

  return (
    <GruposInvestigacionLayout>
      <section className="gestion-grupos">
        <header className="gestion-grupos__header">
          <div>
            <h2 className="gestion-grupos__page-title">Nueva institución</h2>
            <p>Revisa primero la lista: si la institución ya existe, no la agregues de nuevo. El sistema tampoco permite nombres repetidos. Si la facultad no aparece, agrégala primero como facultad en <Link to={`${RUTA_GRUPOS}/instituciones`}>Instituciones</Link>.</p>
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
              Tipo
              <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoInstitucionGrupo)}>
                <option value={TIPO_ESCUELA}>Escuela</option>
                <option value={TIPO_FACULTAD}>Facultad</option>
              </select>
            </label>

            <label>
              Nombre
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre completo" />
            </label>

            {tipo === TIPO_ESCUELA ? (
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

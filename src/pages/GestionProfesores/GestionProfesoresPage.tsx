import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { ModuleLayout } from '../../components'
import {
  eliminarDocenteGrupoInvestigacion,
  getDocentes,
  getDocentesGrupoInvestigacion,
  getGruposInvestigacion,
  registrarDocenteGrupoInvestigacion,
} from '../../api/gruposInvestigacionService'
import type {
  DocenteDto,
  GrupoInvestigacionDocenteDto,
  GrupoInvestigacionDto,
} from '../../api/gruposInvestigacionTypes'
import './GestionProfesoresPage.css'

type Vista = 'docentes' | 'grupos'

const normalize = (value: string) => value.trim().toLocaleLowerCase('es')

const GestionProfesoresPage = () => {
  const [vista, setVista] = useState<Vista>('docentes')
  const [docentes, setDocentes] = useState<DocenteDto[]>([])
  const [grupos, setGrupos] = useState<GrupoInvestigacionDto[]>([])
  const [docentesGrupo, setDocentesGrupo] = useState<GrupoInvestigacionDocenteDto[]>([])
  const [grupoId, setGrupoId] = useState('')
  const [docenteUuid, setDocenteUuid] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingGroup, setIsLoadingGroup] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const loadCatalogs = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [docentesData, gruposData] = await Promise.all([getDocentes(), getGruposInvestigacion()])
        setDocentes(docentesData)
        setGrupos(gruposData)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No fue posible cargar la información.')
      } finally {
        setIsLoading(false)
      }
    }
    void loadCatalogs()
  }, [])

  useEffect(() => {
    if (!grupoId) {
      setDocentesGrupo([])
      return
    }

    const loadGroup = async () => {
      setIsLoadingGroup(true)
      setError(null)
      try {
        setDocentesGrupo(await getDocentesGrupoInvestigacion(Number(grupoId)))
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No fue posible cargar el grupo.')
      } finally {
        setIsLoadingGroup(false)
      }
    }
    void loadGroup()
  }, [grupoId])

  const docentesFiltrados = useMemo(() => {
    const term = normalize(busqueda)
    return docentes.filter((docente) => !term || normalize(docente.nombre).includes(term))
  }, [busqueda, docentes])

  const docentesDisponibles = useMemo(() => {
    const assignedUuids = new Set(docentesGrupo.map((item) => item.docenteUuid ?? item.uuid).filter(Boolean))
    return docentes.filter((docente) => docente.uuid && !assignedUuids.has(docente.uuid))
  }, [docentes, docentesGrupo])

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!grupoId || !docenteUuid) return
    setIsSaving(true)
    setError(null)
    setSuccess(null)
    try {
      await registrarDocenteGrupoInvestigacion({ grupoId: Number(grupoId), docenteUuid })
      setDocenteUuid('')
      setDocentesGrupo(await getDocentesGrupoInvestigacion(Number(grupoId)))
      setSuccess('El docente fue registrado en el grupo de investigación.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No fue posible registrar el docente.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (docente: GrupoInvestigacionDocenteDto) => {
    if (!grupoId || !window.confirm(`¿Retirar a ${docente.nombre.trim()} del grupo?`)) return
    const docenteId = docente.docenteId ?? docente.id
    setDeletingId(docenteId)
    setError(null)
    setSuccess(null)
    try {
      await eliminarDocenteGrupoInvestigacion(Number(grupoId), docenteId)
      setDocentesGrupo((current) => current.filter((item) => (item.docenteId ?? item.id) !== docenteId))
      setSuccess('El docente fue retirado del grupo de investigación.')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No fue posible retirar el docente.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <ModuleLayout title="Gestión profesores">
      <main className="gestion-profesores">
        <header className="gestion-profesores__hero">
          <div><h1>Gestión de profesores</h1><p>Consulte docentes de Minerva y administre su participación en grupos de investigación.</p></div>
          <button type="button" disabled title="El servicio de creación aún no está disponible">+ Inscribir docente</button>
        </header>

        <nav className="gestion-profesores__tabs" aria-label="Funcionalidades de gestión de profesores">
          <button type="button" aria-pressed={vista === 'docentes'} onClick={() => setVista('docentes')}>Docentes en Minerva</button>
          <button type="button" aria-pressed={vista === 'grupos'} onClick={() => setVista('grupos')}>Grupos de investigación</button>
        </nav>

        {error ? <p className="gestion-profesores__message gestion-profesores__message--error" role="alert">{error}</p> : null}
        {success ? <p className="gestion-profesores__message gestion-profesores__message--success" role="status">{success}</p> : null}

        {vista === 'docentes' ? (
          <section className="gestion-profesores__card" aria-labelledby="docentes-title">
            <div className="gestion-profesores__heading"><div><h2 id="docentes-title">Docentes registrados</h2><p>Información obtenida del catálogo institucional de docentes.</p></div><span>{docentesFiltrados.length} docentes</span></div>
            <label className="gestion-profesores__search"><span>Buscar docente</span><input type="search" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Nombre del docente" /></label>
            {isLoading ? <p className="gestion-profesores__empty">Cargando docentes...</p> : (
              <div className="gestion-profesores__table-wrap"><table><thead><tr><th>ID</th><th>Nombre</th><th>UUID</th></tr></thead><tbody>{docentesFiltrados.map((docente) => <tr key={docente.uuid || docente.id}><td>{docente.id}</td><td>{docente.nombre.trim()}</td><td><code>{docente.uuid || 'No informado'}</code></td></tr>)}</tbody></table>{docentesFiltrados.length === 0 ? <p className="gestion-profesores__empty">No se encontraron docentes.</p> : null}</div>
            )}
          </section>
        ) : (
          <section className="gestion-profesores__card" aria-labelledby="grupos-title">
            <div className="gestion-profesores__heading"><div><h2 id="grupos-title">Docentes por grupo</h2><p>Seleccione un grupo y asigne un docente mediante su UUID institucional.</p></div></div>
            <form className="gestion-profesores__form" onSubmit={handleRegister}>
              <label><span>Grupo de investigación</span><select value={grupoId} onChange={(event) => { setGrupoId(event.target.value); setDocenteUuid('') }} required><option value="">Seleccione un grupo</option>{grupos.map((grupo) => <option key={grupo.id} value={grupo.id}>{grupo.codigoNombre}</option>)}</select></label>
              <label><span>Docente</span><select value={docenteUuid} onChange={(event) => setDocenteUuid(event.target.value)} disabled={!grupoId} required><option value="">Seleccione un docente</option>{docentesDisponibles.map((docente) => <option key={docente.uuid || docente.id} value={docente.uuid}>{docente.nombre.trim()}</option>)}</select></label>
              <button type="submit" disabled={!grupoId || !docenteUuid || isSaving}>{isSaving ? 'Registrando...' : 'Registrar en el grupo'}</button>
            </form>
            {!grupoId ? <p className="gestion-profesores__empty">Seleccione un grupo para consultar sus docentes.</p> : isLoadingGroup ? <p className="gestion-profesores__empty">Cargando docentes del grupo...</p> : <div className="gestion-profesores__table-wrap"><table><thead><tr><th>Docente</th><th>Identificador</th><th aria-label="Acciones" /></tr></thead><tbody>{docentesGrupo.map((docente) => { const id = docente.docenteId ?? docente.id; return <tr key={id}><td>{docente.nombre.trim()}</td><td>{id}</td><td><button className="gestion-profesores__delete" type="button" disabled={deletingId === id} onClick={() => void handleDelete(docente)}>{deletingId === id ? 'Retirando...' : 'Retirar'}</button></td></tr> })}</tbody></table>{docentesGrupo.length === 0 ? <p className="gestion-profesores__empty">Este grupo todavía no tiene docentes registrados.</p> : null}</div>}
          </section>
        )}
      </main>
    </ModuleLayout>
  )
}

export default GestionProfesoresPage

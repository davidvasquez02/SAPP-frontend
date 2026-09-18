import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { ModuleLayout } from '../../components'
import {
  asignarRolDocentePosgrados,
  eliminarDocenteGrupoInvestigacion,
  eliminarRolDocentePosgrados,
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
const PAGE_SIZE = 10

const normalize = (value: string) => value.trim().toLocaleLowerCase('es')

const GestionProfesoresPage = () => {
  const [vista, setVista] = useState<Vista>('docentes')
  const [docentes, setDocentes] = useState<DocenteDto[]>([])
  const [grupos, setGrupos] = useState<GrupoInvestigacionDto[]>([])
  const [docentesGrupo, setDocentesGrupo] = useState<GrupoInvestigacionDocenteDto[]>([])
  const [grupoId, setGrupoId] = useState('')
  const [docenteUuid, setDocenteUuid] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [paginaPosgrados, setPaginaPosgrados] = useState(1)
  const [paginaEscuela, setPaginaEscuela] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingGroup, setIsLoadingGroup] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [changingRoleUuid, setChangingRoleUuid] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadDocentes = useCallback(async () => {
    setDocentes(await getDocentes())
  }, [])

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
    return docentes.filter((docente) => {
      const searchable = [docente.fullName, docente.email, docente.documentNumber].join(' ')
      return !term || normalize(searchable).includes(term)
    })
  }, [busqueda, docentes])

  const docentesPosgrados = docentesFiltrados.filter((docente) => docente.tieneRolDocentePosgrados)
  const docentesEscuela = docentesFiltrados.filter((docente) => !docente.tieneRolDocentePosgrados)
  const paginasPosgrados = Math.max(1, Math.ceil(docentesPosgrados.length / PAGE_SIZE))
  const paginasEscuela = Math.max(1, Math.ceil(docentesEscuela.length / PAGE_SIZE))

  useEffect(() => {
    setPaginaPosgrados(1)
    setPaginaEscuela(1)
  }, [busqueda])

  useEffect(() => {
    setPaginaPosgrados((page) => Math.min(page, paginasPosgrados))
    setPaginaEscuela((page) => Math.min(page, paginasEscuela))
  }, [paginasEscuela, paginasPosgrados])

  const docentesDisponibles = useMemo(() => {
    const assignedUuids = new Set(docentesGrupo.map((item) => item.docenteUuid ?? item.uuid).filter(Boolean))
    return docentes.filter(
      (docente) => docente.tieneRolDocentePosgrados && docente.uuid && !assignedUuids.has(docente.uuid),
    )
  }, [docentes, docentesGrupo])

  const changeRole = async (docente: DocenteDto, assign: boolean) => {
    const verb = assign ? 'agregar a' : 'retirar de'
    if (!window.confirm(`¿Desea ${verb} posgrados a ${docente.fullName.trim()}?`)) return
    setChangingRoleUuid(docente.uuid)
    setError(null)
    setSuccess(null)
    try {
      if (assign) await asignarRolDocentePosgrados(docente.uuid)
      else await eliminarRolDocentePosgrados(docente.uuid)
      await loadDocentes()
      setSuccess(assign ? 'El profesor fue agregado a posgrados.' : 'El profesor fue retirado de posgrados.')
    } catch (roleError) {
      setError(roleError instanceof Error ? roleError.message : 'No fue posible actualizar el rol del profesor.')
    } finally {
      setChangingRoleUuid(null)
    }
  }

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

  const renderDocentesTable = (
    items: DocenteDto[],
    assign: boolean,
    page: number,
    pageCount: number,
    setPage: (page: number) => void,
  ) => (
    <>
    <div className="gestion-profesores__table-wrap">
      <table>
        <thead><tr><th>Nombre</th><th>Documento</th><th>Correo institucional</th><th aria-label="Acciones" /></tr></thead>
        <tbody>{items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((docente) => (
          <tr key={docente.uuid}>
            <td>{docente.fullName.trim()}</td><td>{docente.documentNumber || '—'}</td><td>{docente.email || '—'}</td>
            <td><button className={assign ? 'gestion-profesores__assign' : 'gestion-profesores__delete'} type="button" disabled={changingRoleUuid !== null} onClick={() => void changeRole(docente, assign)}>{changingRoleUuid === docente.uuid ? 'Actualizando...' : assign ? 'Agregar a posgrados' : 'Retirar de posgrados'}</button></td>
          </tr>
        ))}</tbody>
      </table>
      {items.length === 0 ? <p className="gestion-profesores__empty">No se encontraron profesores.</p> : null}
    </div>
    {items.length > PAGE_SIZE ? <nav className="gestion-profesores__pagination" aria-label="Paginación de profesores"><button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</button><span>Página {page} de {pageCount}</span><button type="button" disabled={page === pageCount} onClick={() => setPage(page + 1)}>Siguiente</button></nav> : null}
    </>
  )

  return (
    <ModuleLayout title="Gestión profesores">
      <main className="gestion-profesores">
        <header className="gestion-profesores__hero"><div><h1>Gestión de profesores</h1><p>Administre el acceso de los profesores de la EISI al sistema de posgrados y su participación en grupos de investigación.</p></div></header>
        <nav className="gestion-profesores__tabs" aria-label="Funcionalidades de gestión de profesores">
          <button type="button" aria-pressed={vista === 'docentes'} onClick={() => setVista('docentes')}>Profesores</button>
          <button type="button" aria-pressed={vista === 'grupos'} onClick={() => setVista('grupos')}>Grupos de investigación</button>
        </nav>
        {error ? <p className="gestion-profesores__message gestion-profesores__message--error" role="alert">{error}</p> : null}
        {success ? <p className="gestion-profesores__message gestion-profesores__message--success" role="status">{success}</p> : null}

        {vista === 'docentes' ? (
          <>
            <label className="gestion-profesores__search"><span>Buscar profesor</span><input type="search" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Nombre, documento o correo institucional" /></label>
            <section className="gestion-profesores__card" aria-labelledby="posgrados-title">
              <div className="gestion-profesores__heading"><div><h2 id="posgrados-title">Profesores de posgrados</h2><p>Usuarios con el rol de docente de posgrados activo en SAPP.</p></div><span>{docentesPosgrados.length} profesores</span></div>
              {isLoading ? <p className="gestion-profesores__empty">Cargando profesores...</p> : renderDocentesTable(docentesPosgrados, false, paginaPosgrados, paginasPosgrados, setPaginaPosgrados)}
            </section>
            <section className="gestion-profesores__card" aria-labelledby="escuela-title">
              <div className="gestion-profesores__heading"><div><h2 id="escuela-title">Profesores de la EISI disponibles</h2><p>Profesores que todavía no tienen el rol de docente de posgrados en SAPP.</p></div><span>{docentesEscuela.length} profesores</span></div>
              {isLoading ? <p className="gestion-profesores__empty">Cargando profesores...</p> : renderDocentesTable(docentesEscuela, true, paginaEscuela, paginasEscuela, setPaginaEscuela)}
            </section>
          </>
        ) : (
          <section className="gestion-profesores__card" aria-labelledby="grupos-title">
            <div className="gestion-profesores__heading"><div><h2 id="grupos-title">Docentes por grupo</h2><p>Seleccione un grupo y asigne un profesor de posgrados mediante su UUID institucional.</p></div></div>
            <form className="gestion-profesores__form" onSubmit={handleRegister}>
              <label><span>Grupo de investigación</span><select value={grupoId} onChange={(event) => { setGrupoId(event.target.value); setDocenteUuid('') }} required><option value="">Seleccione un grupo</option>{grupos.map((grupo) => <option key={grupo.id} value={grupo.id}>{grupo.codigoNombre}</option>)}</select></label>
              <label><span>Docente</span><select value={docenteUuid} onChange={(event) => setDocenteUuid(event.target.value)} disabled={!grupoId} required><option value="">Seleccione un docente</option>{docentesDisponibles.map((docente) => <option key={docente.uuid} value={docente.uuid}>{docente.fullName}</option>)}</select></label>
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

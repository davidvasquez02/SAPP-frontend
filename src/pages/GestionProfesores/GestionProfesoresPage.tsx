import { useCallback, useEffect, useMemo, useState } from 'react'
import { ModuleLayout } from '../../components'
import {
  asignarDirectorGrupoInvestigacion,
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
  const [busqueda, setBusqueda] = useState('')
  const [busquedaGrupo, setBusquedaGrupo] = useState('')
  const [paginaPosgrados, setPaginaPosgrados] = useState(1)
  const [paginaEscuela, setPaginaEscuela] = useState(1)
  const [paginaDisponibles, setPaginaDisponibles] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingGroup, setIsLoadingGroup] = useState(false)
  const [savingUuid, setSavingUuid] = useState<string | null>(null)
  const [changingRoleUuid, setChangingRoleUuid] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [changingDirectorId, setChangingDirectorId] = useState<number | null>(null)
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
    let isCurrentGroup = true
    const selectedGroupId = Number(grupoId)
    const loadGroup = async () => {
      setIsLoadingGroup(true)
      setError(null)
      try {
        const groupTeachers = await getDocentesGrupoInvestigacion(selectedGroupId)
        if (isCurrentGroup) setDocentesGrupo(groupTeachers)
      } catch (loadError) {
        if (isCurrentGroup) {
          setError(loadError instanceof Error ? loadError.message : 'No fue posible cargar el grupo.')
        }
      } finally {
        if (isCurrentGroup) setIsLoadingGroup(false)
      }
    }
    void loadGroup()
    return () => {
      isCurrentGroup = false
    }
  }, [grupoId])

  const selectedGroup = grupos.find((grupo) => String(grupo.id) === grupoId)

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, current: Vista) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const next = event.key === 'Home'
      ? 'docentes'
      : event.key === 'End'
        ? 'grupos'
        : current === 'docentes' ? 'grupos' : 'docentes'
    setVista(next)
    document.getElementById(`gestion-profesores-tab-${next}`)?.focus()
  }

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
    const assignedNames = new Set(docentesGrupo.map((item) => normalize(item.nombre)))
    const term = normalize(busquedaGrupo)

    return docentes.filter(
      (docente) =>
        docente.tieneRolDocentePosgrados &&
        docente.uuid &&
        !assignedUuids.has(docente.uuid) &&
        !assignedNames.has(normalize(docente.fullName)) &&
        (!term || normalize([docente.fullName, docente.email, docente.documentNumber].join(' ')).includes(term)),
    )
  }, [busquedaGrupo, docentes, docentesGrupo])

  const paginasDisponibles = Math.max(1, Math.ceil(docentesDisponibles.length / PAGE_SIZE))

  useEffect(() => {
    setPaginaDisponibles(1)
  }, [busquedaGrupo, grupoId])

  useEffect(() => {
    setPaginaDisponibles((page) => Math.min(page, paginasDisponibles))
  }, [paginasDisponibles])

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

  const handleRegister = async (docente: DocenteDto) => {
    if (!grupoId) return
    setSavingUuid(docente.uuid)
    setError(null)
    setSuccess(null)
    try {
      await registrarDocenteGrupoInvestigacion({ grupoId: Number(grupoId), docenteUuid: docente.uuid })
      setDocentesGrupo(await getDocentesGrupoInvestigacion(Number(grupoId)))
      setSuccess(`${docente.fullName.trim()} fue agregado al grupo de investigación.`)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No fue posible registrar el docente.')
    } finally {
      setSavingUuid(null)
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

  const handleAssignDirector = async (docente: GrupoInvestigacionDocenteDto) => {
    if (!grupoId || !window.confirm(`¿Designar a ${docente.nombre.trim()} como director del grupo?`)) return
    const docenteId = docente.docenteId ?? docente.id
    setChangingDirectorId(docenteId)
    setError(null)
    setSuccess(null)
    try {
      await asignarDirectorGrupoInvestigacion(Number(grupoId), docenteId)
      setDocentesGrupo(await getDocentesGrupoInvestigacion(Number(grupoId)))
      setSuccess(`${docente.nombre.trim()} es ahora el director del grupo de investigación.`)
    } catch (directorError) {
      setError(directorError instanceof Error ? directorError.message : 'No fue posible asignar el director del grupo.')
    } finally {
      setChangingDirectorId(null)
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
            <td data-label="Nombre">{docente.fullName.trim()}</td><td data-label="Documento">{docente.documentNumber || '—'}</td><td data-label="Correo institucional">{docente.email || '—'}</td>
            <td className="gestion-profesores__action-cell"><button className={assign ? 'gestion-profesores__assign' : 'gestion-profesores__delete'} type="button" disabled={changingRoleUuid !== null} onClick={() => void changeRole(docente, assign)}>{changingRoleUuid === docente.uuid ? 'Actualizando...' : assign ? 'Agregar a posgrados' : 'Retirar de posgrados'}</button></td>
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
        <nav className="gestion-profesores__tabs" aria-label="Funcionalidades de gestión de profesores" role="tablist">
          <button id="gestion-profesores-tab-docentes" type="button" role="tab" aria-selected={vista === 'docentes'} aria-controls="gestion-profesores-panel-docentes" tabIndex={vista === 'docentes' ? 0 : -1} onKeyDown={(event) => handleTabKeyDown(event, 'docentes')} onClick={() => setVista('docentes')}>Profesores</button>
          <button id="gestion-profesores-tab-grupos" type="button" role="tab" aria-selected={vista === 'grupos'} aria-controls="gestion-profesores-panel-grupos" tabIndex={vista === 'grupos' ? 0 : -1} onKeyDown={(event) => handleTabKeyDown(event, 'grupos')} onClick={() => setVista('grupos')}>Grupos de investigación</button>
        </nav>
        {error ? <p className="gestion-profesores__message gestion-profesores__message--error" role="alert">{error}</p> : null}
        {success ? <p className="gestion-profesores__message gestion-profesores__message--success" role="status">{success}</p> : null}

        {vista === 'docentes' ? (
          <div id="gestion-profesores-panel-docentes" role="tabpanel" aria-labelledby="gestion-profesores-tab-docentes" className="gestion-profesores__panel">
            <label className="gestion-profesores__search"><span>Buscar profesor</span><input type="search" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Nombre, documento o correo institucional" /></label>
            <section className="gestion-profesores__card" aria-labelledby="posgrados-title">
              <div className="gestion-profesores__heading"><div><h2 id="posgrados-title">Profesores de posgrados</h2><p>Usuarios con el rol de docente de posgrados activo en SAPP.</p></div><span>{docentesPosgrados.length} profesores</span></div>
              {isLoading ? <p className="gestion-profesores__empty">Cargando profesores...</p> : renderDocentesTable(docentesPosgrados, false, paginaPosgrados, paginasPosgrados, setPaginaPosgrados)}
            </section>
            <section className="gestion-profesores__card" aria-labelledby="escuela-title">
              <div className="gestion-profesores__heading"><div><h2 id="escuela-title">Profesores de la EISI disponibles</h2><p>Profesores que todavía no tienen el rol de docente de posgrados en SAPP.</p></div><span>{docentesEscuela.length} profesores</span></div>
              {isLoading ? <p className="gestion-profesores__empty">Cargando profesores...</p> : renderDocentesTable(docentesEscuela, true, paginaEscuela, paginasEscuela, setPaginaEscuela)}
            </section>
          </div>
        ) : (
          <section id="gestion-profesores-panel-grupos" role="tabpanel" aria-labelledby="gestion-profesores-tab-grupos" className="gestion-profesores__card">
            <div className="gestion-profesores__heading"><div><h2 id="grupos-title">Docentes por grupo</h2><p>Seleccione un grupo para consultar sus integrantes y agregar profesores del listado de posgrados.</p></div></div>
            <label className="gestion-profesores__group-select"><span>Grupo de investigación</span><select value={grupoId} onChange={(event) => setGrupoId(event.target.value)}><option value="">Seleccione un grupo</option>{grupos.map((grupo) => <option key={grupo.id} value={grupo.id}>{grupo.codigoNombre}</option>)}</select></label>
            {selectedGroup ? <p className="gestion-profesores__selected-group"><strong>Grupo seleccionado:</strong> {selectedGroup.codigoNombre}</p> : null}
            {!grupoId ? <p className="gestion-profesores__empty">Seleccione un grupo para consultar sus docentes.</p> : isLoadingGroup ? <p className="gestion-profesores__empty">Cargando docentes del grupo...</p> : (
              <>
                <section className="gestion-profesores__group-section" aria-labelledby="integrantes-title">
                  <div className="gestion-profesores__subheading"><div><h3 id="integrantes-title">Profesores del grupo</h3><p>Integrantes registrados actualmente en el grupo de investigación.</p></div><span>{docentesGrupo.length} profesores</span></div>
                  <div className="gestion-profesores__table-wrap"><table><thead><tr><th>Profesor</th><th>Identificador</th><th>Rol en el grupo</th><th aria-label="Acciones" /></tr></thead><tbody>{docentesGrupo.map((docente) => { const id = docente.docenteId ?? docente.id; const isMutating = deletingId !== null || savingUuid !== null || changingDirectorId !== null; return <tr key={id}><td data-label="Profesor">{docente.nombre.trim()}</td><td data-label="Identificador">{id}</td><td data-label="Rol en el grupo">{docente.esDirector ? <span className="gestion-profesores__director-badge">Director</span> : 'Integrante'}</td><td className="gestion-profesores__action-cell"><div className="gestion-profesores__row-actions">{!docente.esDirector ? <button className="gestion-profesores__director" type="button" disabled={isMutating} onClick={() => void handleAssignDirector(docente)}>{changingDirectorId === id ? 'Asignando...' : 'Hacer director'}</button> : null}<button className="gestion-profesores__delete" type="button" disabled={isMutating} onClick={() => void handleDelete(docente)}>{deletingId === id ? 'Retirando...' : 'Retirar'}</button></div></td></tr> })}</tbody></table>{docentesGrupo.length === 0 ? <p className="gestion-profesores__empty">Este grupo todavía no tiene profesores registrados.</p> : null}</div>
                </section>
                <section className="gestion-profesores__group-section" aria-labelledby="disponibles-title">
                  <div className="gestion-profesores__subheading"><div><h3 id="disponibles-title">Profesores de posgrados disponibles</h3><p>Agregue al grupo únicamente profesores que tienen activo el rol de posgrados.</p></div><span>{docentesDisponibles.length} profesores</span></div>
                  <label className="gestion-profesores__search"><span>Buscar profesor disponible</span><input type="search" value={busquedaGrupo} onChange={(event) => setBusquedaGrupo(event.target.value)} placeholder="Nombre, documento o correo institucional" /></label>
                  <div className="gestion-profesores__table-wrap"><table><thead><tr><th>Nombre</th><th>Documento</th><th>Correo institucional</th><th aria-label="Acciones" /></tr></thead><tbody>{docentesDisponibles.slice((paginaDisponibles - 1) * PAGE_SIZE, paginaDisponibles * PAGE_SIZE).map((docente) => <tr key={docente.uuid}><td data-label="Nombre">{docente.fullName.trim()}</td><td data-label="Documento">{docente.documentNumber || '—'}</td><td data-label="Correo institucional">{docente.email || '—'}</td><td className="gestion-profesores__action-cell"><button className="gestion-profesores__assign" type="button" disabled={savingUuid !== null || deletingId !== null || changingDirectorId !== null} onClick={() => void handleRegister(docente)}>{savingUuid === docente.uuid ? 'Agregando...' : 'Agregar al grupo'}</button></td></tr>)}</tbody></table>{docentesDisponibles.length === 0 ? <p className="gestion-profesores__empty">No hay profesores de posgrados disponibles para agregar.</p> : null}</div>
                  {docentesDisponibles.length > PAGE_SIZE ? <nav className="gestion-profesores__pagination" aria-label="Paginación de profesores disponibles"><button type="button" disabled={paginaDisponibles === 1} onClick={() => setPaginaDisponibles(paginaDisponibles - 1)}>Anterior</button><span>Página {paginaDisponibles} de {paginasDisponibles}</span><button type="button" disabled={paginaDisponibles === paginasDisponibles} onClick={() => setPaginaDisponibles(paginaDisponibles + 1)}>Siguiente</button></nav> : null}
                </section>
              </>
            )}
          </section>
        )}
      </main>
    </ModuleLayout>
  )
}

export default GestionProfesoresPage

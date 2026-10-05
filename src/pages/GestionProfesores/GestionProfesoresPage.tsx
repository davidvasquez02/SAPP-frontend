import { useCallback, useEffect, useMemo, useState } from 'react'
import { ModuleLayout } from '../../components'
import {
  asignarRolDocentePosgrados,
  eliminarRolDocentePosgrados,
  getDocentes,
} from '../../api/gruposInvestigacionService'
import type { DocenteDto } from '../../api/gruposInvestigacionTypes'
import { ConfirmacionProfesorDialog, type ConfirmacionProfesorCopy } from './ConfirmacionProfesorDialog'
import { DocentesPorGrupoPanel } from './DocentesPorGrupoPanel'
import { PAGE_SIZE, normalize } from './utilsProfesores'
import './GestionProfesoresPage.css'

type Vista = 'docentes' | 'grupos'

interface RolConfirmacion {
  docente: DocenteDto
  assign: boolean
}

const GestionProfesoresPage = () => {
  const [vista, setVista] = useState<Vista>('docentes')
  const [docentes, setDocentes] = useState<DocenteDto[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [paginaPosgrados, setPaginaPosgrados] = useState(1)
  const [paginaEscuela, setPaginaEscuela] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [changingRoleUuid, setChangingRoleUuid] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<RolConfirmacion | null>(null)

  const confirmationBusy = changingRoleUuid !== null

  const loadDocentes = useCallback(async () => {
    setDocentes(await getDocentes())
  }, [])

  useEffect(() => {
    const loadCatalogs = async () => {
      setIsLoading(true)
      setError(null)
      try {
        setDocentes(await getDocentes())
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No fue posible cargar la información.')
      } finally {
        setIsLoading(false)
      }
    }
    void loadCatalogs()
  }, [])

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

  const changeRole = async (docente: DocenteDto, assign: boolean) => {
    setChangingRoleUuid(docente.uuid)
    setError(null)
    setSuccess(null)
    try {
      if (assign) await asignarRolDocentePosgrados(docente.uuid)
      else await eliminarRolDocentePosgrados(docente.uuid)
      await loadDocentes()
      setSuccess(assign ? 'El profesor fue agregado a posgrados.' : 'El profesor fue retirado de posgrados.')
      setConfirmation(null)
    } catch (roleError) {
      setError(roleError instanceof Error ? roleError.message : 'No fue posible actualizar el rol del profesor.')
    } finally {
      setChangingRoleUuid(null)
    }
  }

  const confirmationCopy: ConfirmacionProfesorCopy | null = confirmation
    ? {
        title: confirmation.assign ? 'Agregar profesor a posgrados' : 'Retirar profesor de posgrados',
        description: confirmation.assign
          ? 'El profesor obtendrá acceso a las funcionalidades asignadas al rol de docente de posgrados.'
          : 'El profesor dejará de tener acceso a las funcionalidades asignadas al rol de docente de posgrados.',
        name: confirmation.docente.fullName.trim(),
        label: confirmation.assign ? 'Sí, agregar a posgrados' : 'Sí, retirar de posgrados',
        busyLabel: 'Actualizando...',
        danger: !confirmation.assign,
      }
    : null

  const cerrarConfirmacion = () => setConfirmation(null)

  const confirmarRol = () => {
    if (confirmation) void changeRole(confirmation.docente, confirmation.assign)
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
            <td className="gestion-profesores__action-cell"><button className={assign ? 'gestion-profesores__assign' : 'gestion-profesores__delete'} type="button" disabled={changingRoleUuid !== null} onClick={() => setConfirmation({ docente, assign })}>{changingRoleUuid === docente.uuid ? 'Actualizando...' : assign ? 'Agregar a posgrados' : 'Retirar de posgrados'}</button></td>
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
        <header className="gestion-profesores__hero"><p>Administre el acceso de los profesores de la EISI al sistema de posgrados y su participación en grupos de investigación.</p></header>
        <nav className="gestion-profesores__tabs" aria-label="Funcionalidades de gestión de profesores" role="tablist">
          <button id="gestion-profesores-tab-docentes" type="button" role="tab" aria-selected={vista === 'docentes'} aria-controls="gestion-profesores-panel-docentes" tabIndex={vista === 'docentes' ? 0 : -1} onKeyDown={(event) => handleTabKeyDown(event, 'docentes')} onClick={() => setVista('docentes')}>Profesores</button>
          <button id="gestion-profesores-tab-grupos" type="button" role="tab" aria-selected={vista === 'grupos'} aria-controls="gestion-profesores-panel-grupos" tabIndex={vista === 'grupos' ? 0 : -1} onKeyDown={(event) => handleTabKeyDown(event, 'grupos')} onClick={() => setVista('grupos')}>Grupos de investigación</button>
        </nav>

        {vista === 'docentes' ? (
          <div id="gestion-profesores-panel-docentes" role="tabpanel" aria-labelledby="gestion-profesores-tab-docentes" className="gestion-profesores__panel">
            {error ? <p className="gestion-profesores__message gestion-profesores__message--error" role="alert">{error}</p> : null}
            {success ? <p className="gestion-profesores__message gestion-profesores__message--success" role="status">{success}</p> : null}
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
          <div id="gestion-profesores-panel-grupos" role="tabpanel" aria-labelledby="gestion-profesores-tab-grupos" className="gestion-profesores__panel">
            <DocentesPorGrupoPanel />
          </div>
        )}

        {confirmation && confirmationCopy ? (
          <ConfirmacionProfesorDialog copy={confirmationCopy} busy={confirmationBusy} onCancel={cerrarConfirmacion} onConfirm={confirmarRol} />
        ) : null}
      </main>
    </ModuleLayout>
  )
}

export default GestionProfesoresPage

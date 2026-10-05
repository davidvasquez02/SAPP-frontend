import { useEffect, useMemo, useState } from 'react'
import {
  asignarDirectorGrupoInvestigacion,
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
import { ConfirmacionProfesorDialog, type ConfirmacionProfesorCopy } from './ConfirmacionProfesorDialog'
import { PAGE_SIZE, normalize } from './utilsProfesores'
import './GestionProfesoresPage.css'

type ConfirmacionGrupo =
  | { type: 'group'; docente: GrupoInvestigacionDocenteDto }
  | { type: 'director'; docente: GrupoInvestigacionDocenteDto }

/**
 * Gestion de los profesores asociados a un grupo de investigacion. Lo usan Gestion de profesores
 * y la seccion Profesores de Grupos de investigacion, para que ambas muestren y cambien lo mismo.
 */
export const DocentesPorGrupoPanel = () => {
  const [docentes, setDocentes] = useState<DocenteDto[]>([])
  const [grupos, setGrupos] = useState<GrupoInvestigacionDto[]>([])
  const [docentesGrupo, setDocentesGrupo] = useState<GrupoInvestigacionDocenteDto[]>([])
  const [grupoId, setGrupoId] = useState('')
  const [busquedaGrupo, setBusquedaGrupo] = useState('')
  const [paginaDisponibles, setPaginaDisponibles] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingGroup, setIsLoadingGroup] = useState(false)
  const [savingUuid, setSavingUuid] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [changingDirectorId, setChangingDirectorId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<ConfirmacionGrupo | null>(null)

  const confirmationBusy = deletingId !== null || changingDirectorId !== null

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
    if (!grupoId) return
    const docenteId = docente.docenteId ?? docente.id
    setDeletingId(docenteId)
    setError(null)
    setSuccess(null)
    try {
      await eliminarDocenteGrupoInvestigacion(Number(grupoId), docenteId)
      setDocentesGrupo((current) => current.filter((item) => (item.docenteId ?? item.id) !== docenteId))
      setSuccess('El docente fue retirado del grupo de investigación.')
      setConfirmation(null)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No fue posible retirar el docente.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleAssignDirector = async (docente: GrupoInvestigacionDocenteDto) => {
    if (!grupoId) return
    const docenteId = docente.docenteId ?? docente.id
    setChangingDirectorId(docenteId)
    setError(null)
    setSuccess(null)
    try {
      await asignarDirectorGrupoInvestigacion(Number(grupoId), docenteId)
      setDocentesGrupo(await getDocentesGrupoInvestigacion(Number(grupoId)))
      setSuccess(`${docente.nombre.trim()} es ahora el director del grupo de investigación.`)
      setConfirmation(null)
    } catch (directorError) {
      setError(directorError instanceof Error ? directorError.message : 'No fue posible asignar el director del grupo.')
    } finally {
      setChangingDirectorId(null)
    }
  }

  const confirmationCopy: ConfirmacionProfesorCopy | null = confirmation
    ? confirmation.type === 'group'
      ? {
          title: 'Retirar profesor del grupo',
          description: `El profesor dejará de pertenecer a ${selectedGroup?.codigoNombre ?? 'este grupo de investigación'}.`,
          name: confirmation.docente.nombre.trim(),
          label: 'Sí, retirar del grupo',
          busyLabel: 'Retirando...',
          danger: true,
        }
      : {
          title: 'Designar director del grupo',
          description: `El profesor quedará registrado como director de ${selectedGroup?.codigoNombre ?? 'este grupo de investigación'}.`,
          name: confirmation.docente.nombre.trim(),
          label: 'Sí, designar director',
          busyLabel: 'Asignando...',
          danger: false,
        }
    : null

  const confirmAction = () => {
    if (!confirmation) return
    if (confirmation.type === 'group') void handleDelete(confirmation.docente)
    else void handleAssignDirector(confirmation.docente)
  }

  const cerrarConfirmacion = () => setConfirmation(null)

  const isMutating = deletingId !== null || savingUuid !== null || changingDirectorId !== null

  return (
    <section className="gestion-profesores__card" aria-labelledby="grupos-title">
      <div className="gestion-profesores__heading"><div><h2 id="grupos-title">Docentes por grupo</h2><p>Seleccione un grupo para consultar sus integrantes y agregar profesores del listado de posgrados.</p></div></div>
      {error ? <p className="gestion-profesores__message gestion-profesores__message--error" role="alert">{error}</p> : null}
      {success ? <p className="gestion-profesores__message gestion-profesores__message--success" role="status">{success}</p> : null}
      {isLoading ? <p className="gestion-profesores__empty">Cargando grupos...</p> : null}
      <label className="gestion-profesores__group-select"><span>Grupo de investigación</span><select value={grupoId} onChange={(event) => setGrupoId(event.target.value)}><option value="">Seleccione un grupo</option>{grupos.map((grupo) => <option key={grupo.id} value={grupo.id}>{grupo.codigoNombre}</option>)}</select></label>
      {selectedGroup ? <p className="gestion-profesores__selected-group"><strong>Grupo seleccionado:</strong> {selectedGroup.codigoNombre}</p> : null}
      {!grupoId ? <p className="gestion-profesores__empty">Seleccione un grupo para consultar sus docentes.</p> : isLoadingGroup ? <p className="gestion-profesores__empty">Cargando docentes del grupo...</p> : (
        <>
          <section className="gestion-profesores__group-section" aria-labelledby="integrantes-title">
            <div className="gestion-profesores__subheading"><div><h3 id="integrantes-title">Profesores del grupo</h3><p>Integrantes registrados actualmente en el grupo de investigación.</p></div><span>{docentesGrupo.length} profesores</span></div>
            <div className="gestion-profesores__table-wrap"><table><thead><tr><th>Profesor</th><th>Rol en el grupo</th><th aria-label="Acciones" /></tr></thead><tbody>{docentesGrupo.map((docente) => { const id = docente.docenteId ?? docente.id; return <tr key={id}><td data-label="Profesor">{docente.nombre.trim()}</td><td data-label="Rol en el grupo">{docente.esDirector ? <span className="gestion-profesores__director-badge">Director</span> : 'Integrante'}</td><td className="gestion-profesores__action-cell"><div className="gestion-profesores__row-actions">{!docente.esDirector ? <button className="gestion-profesores__director" type="button" disabled={isMutating} onClick={() => setConfirmation({ type: 'director', docente })}>{changingDirectorId === id ? 'Asignando...' : 'Hacer director'}</button> : null}<button className="gestion-profesores__delete" type="button" disabled={isMutating} onClick={() => setConfirmation({ type: 'group', docente })}>{deletingId === id ? 'Retirando...' : 'Retirar'}</button></div></td></tr> })}</tbody></table>{docentesGrupo.length === 0 ? <p className="gestion-profesores__empty">Este grupo todavía no tiene profesores registrados.</p> : null}</div>
          </section>
          <section className="gestion-profesores__group-section" aria-labelledby="disponibles-title">
            <div className="gestion-profesores__subheading"><div><h3 id="disponibles-title">Profesores de posgrados disponibles</h3><p>Agregue al grupo únicamente profesores que tienen activo el rol de posgrados.</p></div><span>{docentesDisponibles.length} profesores</span></div>
            <label className="gestion-profesores__search"><span>Buscar profesor disponible</span><input type="search" value={busquedaGrupo} onChange={(event) => setBusquedaGrupo(event.target.value)} placeholder="Nombre, documento o correo institucional" /></label>
            <div className="gestion-profesores__table-wrap"><table><thead><tr><th>Nombre</th><th>Documento</th><th>Correo institucional</th><th aria-label="Acciones" /></tr></thead><tbody>{docentesDisponibles.slice((paginaDisponibles - 1) * PAGE_SIZE, paginaDisponibles * PAGE_SIZE).map((docente) => <tr key={docente.uuid}><td data-label="Nombre">{docente.fullName.trim()}</td><td data-label="Documento">{docente.documentNumber || '—'}</td><td data-label="Correo institucional">{docente.email || '—'}</td><td className="gestion-profesores__action-cell"><button className="gestion-profesores__assign" type="button" disabled={savingUuid !== null || deletingId !== null || changingDirectorId !== null} onClick={() => void handleRegister(docente)}>{savingUuid === docente.uuid ? 'Agregando...' : 'Agregar al grupo'}</button></td></tr>)}</tbody></table>{docentesDisponibles.length === 0 ? <p className="gestion-profesores__empty">No hay profesores de posgrados disponibles para agregar.</p> : null}</div>
            {docentesDisponibles.length > PAGE_SIZE ? <nav className="gestion-profesores__pagination" aria-label="Paginación de profesores disponibles"><button type="button" disabled={paginaDisponibles === 1} onClick={() => setPaginaDisponibles(paginaDisponibles - 1)}>Anterior</button><span>Página {paginaDisponibles} de {paginasDisponibles}</span><button type="button" disabled={paginaDisponibles === paginasDisponibles} onClick={() => setPaginaDisponibles(paginaDisponibles + 1)}>Siguiente</button></nav> : null}
          </section>
        </>
      )}
      {confirmation && confirmationCopy ? (
        <ConfirmacionProfesorDialog copy={confirmationCopy} busy={confirmationBusy} onCancel={cerrarConfirmacion} onConfirm={confirmAction} />
      ) : null}
    </section>
  )
}

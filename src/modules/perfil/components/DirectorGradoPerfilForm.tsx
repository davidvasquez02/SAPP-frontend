import { useCallback, useEffect, useRef, useState } from 'react'
import { getGruposInvestigacion } from '../../../api/gruposInvestigacionService'
import type { GrupoInvestigacionDto, GrupoInvestigacionDocenteDto } from '../../../api/gruposInvestigacionTypes'
import { HttpError } from '../../../shared/http/httpClient'
import { formatNombrePersona } from '../../../shared/utils/formatNombrePersona'
import {
  asignarDirectorGradoPerfil, obtenerDirectorGradoPerfil, obtenerDocentesPosgradosGrupo,
  type DirectorGradoPerfil,
} from '../services/directorGradoPerfilService'

interface DirectorGradoPerfilFormProps {
  estudianteId: number
  onActualizado: (asignacion: DirectorGradoPerfil) => void
}

export const DirectorGradoPerfilForm = ({ estudianteId, onActualizado }: DirectorGradoPerfilFormProps) => {
  const [asignacion, setAsignacion] = useState<DirectorGradoPerfil | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [open, setOpen] = useState(false)
  const [grupos, setGrupos] = useState<GrupoInvestigacionDto[]>([])
  const [docentes, setDocentes] = useState<GrupoInvestigacionDocenteDto[]>([])
  const [grupoId, setGrupoId] = useState('')
  const [directorId, setDirectorId] = useState('')
  const [loadingGrupos, setLoadingGrupos] = useState(false)
  const [loadingDocentes, setLoadingDocentes] = useState(false)
  const [catalogError, setCatalogError] = useState('')
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  const docenteRequest = useRef(0)

  const aplicar = useCallback((data: DirectorGradoPerfil) => {
    setAsignacion(data)
    onActualizado(data)
  }, [onActualizado])

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await obtenerDirectorGradoPerfil(estudianteId)
        if (active) aplicar(data)
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'No fue posible consultar el director de grado.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false; docenteRequest.current += 1 }
  }, [estudianteId, aplicar])

  const recargar = async () => {
    setLoading(true)
    setAsignacion(null)
    setError('')
    try { aplicar(await obtenerDirectorGradoPerfil(estudianteId)) }
    catch (e) { setError(e instanceof Error ? e.message : 'No fue posible consultar el director de grado.') }
    finally { setLoading(false) }
  }

  const cargarDocentes = async (id: string) => {
    const request = ++docenteRequest.current
    setDocentes([])
    setDirectorId('')
    setCatalogError('')
    setLoadingDocentes(Boolean(id))
    if (!id) return
    try {
      const data = await obtenerDocentesPosgradosGrupo(Number(id))
      if (request === docenteRequest.current) setDocentes(data)
    } catch (e) {
      if (request === docenteRequest.current) setCatalogError(e instanceof Error ? e.message : 'No fue posible consultar los docentes.')
    } finally {
      if (request === docenteRequest.current) setLoadingDocentes(false)
    }
  }

  const abrir = async () => {
    setOpen(true)
    setLoadingGrupos(true)
    setCatalogError('')
    try {
      const data = await getGruposInvestigacion()
      setGrupos(data)
      const initial = asignacion?.grupo?.id ? String(asignacion.grupo.id) : ''
      setGrupoId(initial)
      await cargarDocentes(initial)
    } catch (e) {
      setCatalogError(e instanceof Error ? e.message : 'No fue posible consultar los grupos.')
    } finally { setLoadingGrupos(false) }
  }

  const guardar = async () => {
    if (savingRef.current || !asignacion?.puedeAsignar || !grupoId || !directorId) return
    savingRef.current = true
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const data = await asignarDirectorGradoPerfil(estudianteId, {
        grupoInvestigacionId: Number(grupoId), directorId: Number(directorId),
      })
      aplicar(data)
      setOpen(false)
      setMessage('El director de grado se asignó correctamente.')
    } catch (e) {
      if (e instanceof HttpError && e.status === 409) {
        setOpen(false)
        await recargar()
        setError(e.message)
      } else {
        setError(e instanceof Error ? e.message : 'No fue posible guardar el director de grado.')
      }
    } finally { savingRef.current = false; setSaving(false) }
  }

  return <div className="profile-page__director">
    {loading ? <p role="status">Consultando director de grado…</p> : asignacion && <>
      <dl className="profile-page__data-grid">
        <div><dt>Grupo de investigación</dt><dd>{asignacion.grupo?.nombre || 'Sin grupo registrado'}</dd></div>
        <div><dt>Director de trabajo de grado</dt><dd>{asignacion.director
          ? formatNombrePersona(asignacion.director.nombreCompleto) || 'Director asignado; nombre no disponible'
          : 'Sin director asignado'}</dd></div>
        <div><dt>Correo del director</dt><dd>{asignacion.director?.correo || 'No disponible'}</dd></div>
      </dl>
      {asignacion.puedeAsignar && !asignacion.director && !open && <button type="button" onClick={() => { void abrir() }}>Agregar director de grado</button>}
      {asignacion.puedeAsignar && !asignacion.director && open && <div className="profile-page__director-form">
        <p>Selecciona el grupo y un docente de posgrado. Una vez guardado, no podrás cambiarlo desde tu perfil.</p>
        <div className="profile-page__title-field"><label htmlFor={`perfil-grupo-${estudianteId}`}>Grupo de investigación</label>
          <select id={`perfil-grupo-${estudianteId}`} value={grupoId} disabled={saving || loadingGrupos} onChange={(event) => {
            setGrupoId(event.target.value); setError(''); void cargarDocentes(event.target.value)
          }}>
            <option value="">{loadingGrupos ? 'Cargando grupos…' : 'Selecciona un grupo'}</option>
            {grupos.map((grupo) => <option key={grupo.id} value={grupo.id}>{grupo.codigoNombre}</option>)}
          </select>
        </div>
        <div className="profile-page__title-field"><label htmlFor={`perfil-director-${estudianteId}`}>Docente director de grado</label>
          <select id={`perfil-director-${estudianteId}`} value={directorId} disabled={saving || loadingGrupos || loadingDocentes || !grupoId} onChange={(event) => { setDirectorId(event.target.value); setError('') }}>
            <option value="">{loadingDocentes ? 'Cargando docentes…' : 'Selecciona un docente'}</option>
            {docentes.map((docente) => <option key={docente.id} value={docente.id}>{formatNombrePersona(docente.nombre)}</option>)}
          </select>
        </div>
        {!loadingGrupos && !grupos.length && !catalogError && <p>No hay grupos de investigación disponibles.</p>}
        {grupoId && !loadingDocentes && !loadingGrupos && !docentes.length && !catalogError && <p>Este grupo no tiene docentes de posgrado disponibles.</p>}
        {catalogError && <><p role="alert" className="profile-page__feedback profile-page__feedback--error">{catalogError}</p>
          <button type="button" disabled={saving || loadingGrupos || loadingDocentes} onClick={() => { void (grupos.length ? cargarDocentes(grupoId) : abrir()) }}>Reintentar consulta</button></>}
        <button type="button" disabled={saving || loadingGrupos || loadingDocentes || Boolean(catalogError) || !grupoId || !directorId} onClick={() => { void guardar() }}>
          {saving ? 'Guardando director…' : 'Guardar director de grado'}
        </button>
      </div>}
    </>}
    {error && <p role="alert" className="profile-page__feedback profile-page__feedback--error">{error}</p>}
    {!loading && !asignacion && <button type="button" onClick={() => { void recargar() }}>Reintentar consulta</button>}
    {message && <p role="status" className="profile-page__feedback">{message}</p>}
  </div>
}

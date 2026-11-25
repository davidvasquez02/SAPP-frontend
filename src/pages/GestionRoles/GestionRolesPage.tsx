import { useEffect, useState } from 'react'
import { ModuleLayout } from '../../components'
import {
  asignarRolIam,
  buscarUsuariosIam,
  getRolesDeUsuarioIam,
  getRolesGestionables,
  retirarRolIam,
} from '../../api/gestionRolService'
import type { UsuarioIamDto } from '../../api/gestionRolTypes'
import { formatRoleLabel } from '../../modules/auth/roles/roleUtils'
import './GestionRolesPage.css'

const GestionRolesPage = () => {
  const [texto, setTexto] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [resultados, setResultados] = useState<UsuarioIamDto[] | null>(null)
  const [seleccionado, setSeleccionado] = useState<UsuarioIamDto | null>(null)
  const [rolesGestionables, setRolesGestionables] = useState<string[]>([])
  const [rolesActuales, setRolesActuales] = useState<string[] | null>(null)
  const [cambiandoRol, setCambiandoRol] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const cargarGestionables = async () => {
      try {
        setRolesGestionables(await getRolesGestionables())
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No fue posible consultar los roles gestionables.')
      }
    }
    void cargarGestionables()
  }, [])

  const buscar = async () => {
    const termino = texto.trim()
    if (!termino) return
    setBuscando(true)
    setError(null)
    setSuccess(null)
    setSeleccionado(null)
    setRolesActuales(null)
    try {
      setResultados(await buscarUsuariosIam(termino))
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : 'No fue posible buscar usuarios.')
      setResultados(null)
    } finally {
      setBuscando(false)
    }
  }

  const seleccionar = async (usuario: UsuarioIamDto) => {
    setSeleccionado(usuario)
    setError(null)
    setSuccess(null)
    setRolesActuales(null)
    try {
      setRolesActuales(await getRolesDeUsuarioIam(usuario.uuid))
    } catch (rolesError) {
      setError(rolesError instanceof Error ? rolesError.message : 'No fue posible consultar los roles del usuario.')
    }
  }

  const cambiarRol = async (rol: string, asignar: boolean) => {
    if (!seleccionado) return
    setCambiandoRol(rol)
    setError(null)
    setSuccess(null)
    try {
      const request = { usuarioUuid: seleccionado.uuid, rol }
      if (asignar) await asignarRolIam(request)
      else await retirarRolIam(request)
      setRolesActuales(await getRolesDeUsuarioIam(seleccionado.uuid))
      setSuccess(
        asignar
          ? `Rol ${formatRoleLabel(rol)} asignado correctamente.`
          : `Rol ${formatRoleLabel(rol)} retirado correctamente.`,
      )
    } catch (changeError) {
      setError(changeError instanceof Error ? changeError.message : 'No fue posible actualizar el rol.')
    } finally {
      setCambiandoRol(null)
    }
  }

  return (
    <ModuleLayout title="Gestión de roles">
      <main className="gestion-roles">
                {error ? <p className="gestion-roles__message gestion-roles__message--error" role="alert">{error}</p> : null}
        {success ? <p className="gestion-roles__message gestion-roles__message--success" role="status">{success}</p> : null}

        <section className="gestion-roles__card">
          <h2>Buscar usuario</h2>
          <form
            className="gestion-roles__search"
            onSubmit={(event) => {
              event.preventDefault()
              void buscar()
            }}
          >
            <label>
              <span>Nombre, correo o documento</span>
              <input
                type="search"
                value={texto}
                onChange={(event) => setTexto(event.target.value)}
                placeholder="Ej. Ana Torres"
              />
            </label>
            <button type="submit" disabled={buscando || !texto.trim()}>
              {buscando ? 'Buscando…' : 'Buscar'}
            </button>
          </form>
          {resultados ? (
            resultados.length === 0 ? (
              <p className="gestion-roles__empty">No se encontraron usuarios.</p>
            ) : (
              <ul className="gestion-roles__results">
                {resultados.map((usuario) => (
                  <li key={usuario.uuid}>
                    <button
                      type="button"
                      className={`gestion-roles__result${seleccionado?.uuid === usuario.uuid ? ' gestion-roles__result--active' : ''}`}
                      onClick={() => void seleccionar(usuario)}
                    >
                      <strong>{usuario.fullName || 'Nombre no disponible'}</strong>
                      <span>
                        {usuario.email || 'Sin correo'}
                        {usuario.documentNumber ? ` · ${usuario.documentNumber}` : ''}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : null}
        </section>

        {seleccionado ? (
          <section className="gestion-roles__card">
            <h2>Roles de {seleccionado.fullName || seleccionado.email || 'este usuario'}</h2>
            {rolesGestionables.length === 0 ? (
              <p className="gestion-roles__empty">No tiene permiso para gestionar ningún rol.</p>
            ) : rolesActuales === null ? (
              <p role="status">Cargando roles…</p>
            ) : (
              <ul className="gestion-roles__roles">
                {rolesGestionables.map((rol) => {
                  const tieneRol = rolesActuales.includes(rol)
                  const busy = cambiandoRol === rol
                  return (
                    <li key={rol} className="gestion-roles__role">
                      <span className={`gestion-roles__role-badge${tieneRol ? ' gestion-roles__role-badge--active' : ''}`} title={rol}>
                        {formatRoleLabel(rol)}
                      </span>
                      <button
                        type="button"
                        className={tieneRol ? 'gestion-roles__retirar' : 'gestion-roles__asignar'}
                        disabled={busy}
                        onClick={() => void cambiarRol(rol, !tieneRol)}
                      >
                        {busy ? 'Actualizando…' : tieneRol ? 'Retirar' : 'Asignar'}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        ) : null}
      </main>
    </ModuleLayout>
  )
}

export default GestionRolesPage

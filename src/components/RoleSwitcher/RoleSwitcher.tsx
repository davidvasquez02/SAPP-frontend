import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/Auth'
import { formatRoleDisplay, getSelectableRoles } from '../../modules/auth/roles/activeRole'
import './RoleSwitcher.css'

/** Desde este número de roles el selector ofrece buscar entre ellos. */
const ROLES_PARA_BUSCAR = 6

const sinTildes = (valor: string) => valor.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const IconoUsuario = () => (
  <svg className="role-switcher__icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9.2" />
    <circle cx="12" cy="10" r="3" />
    <path d="M6.2 18.2c1.4-2.3 3.4-3.4 5.8-3.4s4.4 1.1 5.8 3.4" />
  </svg>
)

const IconoFlecha = () => (
  <svg className="role-switcher__caret" viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
    <path d="M7 10l5 5 5-5z" />
  </svg>
)

const IconoLupa = () => (
  <svg className="role-switcher__search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M15.5 15.5L21 21" />
  </svg>
)

const IconoCheck = () => (
  <svg className="role-switcher__check" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
)

/**
 * Rol con el que se trabaja. Si el usuario tiene varios roles asignados (por ejemplo coordinador y profesor), este
 * selector deja elegir con cuál: la interfaz completa cambia a la de ese rol. Con un solo rol se muestra como etiqueta.
 */
const RoleSwitcher = () => {
  const { availableRoles, activeRole: rolActivo, changeActiveRole, user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const contenedor = useRef<HTMLDivElement | null>(null)
  const listaId = useId()

  // sin proveedor de sesión completo (pruebas, vistas sueltas) se usan los roles del usuario tal cual
  const roles = useMemo(() => availableRoles ?? getSelectableRoles(user?.roles), [availableRoles, user?.roles])
  const activeRole = rolActivo ?? roles[0] ?? null
  const puedeElegir = roles.length > 1

  useEffect(() => {
    if (!open) return
    const cerrarAlHacerClicFuera = (event: MouseEvent) => {
      if (contenedor.current && !contenedor.current.contains(event.target as Node)) setOpen(false)
    }
    const cerrarConEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', cerrarAlHacerClicFuera)
    document.addEventListener('keydown', cerrarConEscape)
    return () => {
      document.removeEventListener('mousedown', cerrarAlHacerClicFuera)
      document.removeEventListener('keydown', cerrarConEscape)
    }
  }, [open])

  const visibles = useMemo(() => {
    const termino = sinTildes(busqueda.trim())
    return roles.filter((rol) => !termino || sinTildes(formatRoleDisplay(rol)).includes(termino))
  }, [busqueda, roles])

  const etiqueta = activeRole ? formatRoleDisplay(activeRole) : 'Sin rol asignado'

  if (!puedeElegir) {
    return (
      <span className="role-switcher__pill role-switcher__pill--static">
        <IconoUsuario />
        <span>{etiqueta}</span>
      </span>
    )
  }

  const elegir = (rol: string) => {
    setOpen(false)
    setBusqueda('')
    if (rol === activeRole) return
    changeActiveRole(rol)
    // cada rol tiene su propia interfaz: se entra por el inicio de ese rol
    navigate('/')
  }

  return (
    <div className="role-switcher" ref={contenedor}>
      <button
        type="button"
        className="role-switcher__pill"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listaId}
        aria-label={`Rol actual: ${etiqueta}. Cambiar de rol`}
        onClick={() => setOpen((actual) => !actual)}
      >
        <IconoUsuario />
        <span className="role-switcher__label">{etiqueta}</span>
        <IconoFlecha />
      </button>

      {open ? (
        <div className="role-switcher__panel">
          {roles.length >= ROLES_PARA_BUSCAR ? (
            <label className="role-switcher__search">
              <IconoLupa />
              <input
                type="search"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Buscar rol"
                aria-label="Buscar rol"
                autoFocus
              />
            </label>
          ) : null}
          <ul id={listaId} className="role-switcher__list" role="listbox" aria-label="Roles asignados">
            {visibles.map((rol) => {
              const seleccionado = rol === activeRole
              return (
                <li key={rol} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={seleccionado}
                    className={`role-switcher__option${seleccionado ? ' role-switcher__option--selected' : ''}`}
                    onClick={() => elegir(rol)}
                  >
                    <span>{formatRoleDisplay(rol)}</span>
                    {seleccionado ? <IconoCheck /> : null}
                  </button>
                </li>
              )
            })}
            {visibles.length === 0 ? <li className="role-switcher__empty">No hay roles que coincidan.</li> : null}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

export default RoleSwitcher

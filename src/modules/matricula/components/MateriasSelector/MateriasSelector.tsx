import { useEffect, useMemo, useRef, useState } from 'react'
import type { MateriaDto, MateriaSeleccionada } from '../../types'
import './MateriasSelector.css'

type MateriasSelectorProps = {
  materias: MateriaDto[]
  selected: MateriaSeleccionada[]
  onAdd: (materia: MateriaDto) => void
  disabled?: boolean
}

const MateriasSelector = ({ materias, selected, onAdd, disabled = false }: MateriasSelectorProps) => {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const selectedIds = useMemo(() => new Set(selected.map((item) => item.id)), [selected])

  const filteredMaterias = useMemo(() => {
    const term = query.trim().toLowerCase()
    return materias.filter((materia) => {
      const alreadySelected = selectedIds.has(materia.id)
      if (alreadySelected) {
        return false
      }

      if (!term) {
        return true
      }

      const codigo = materia.codigo?.toLowerCase() ?? ''
      return materia.nombre.toLowerCase().includes(term) || codigo.includes(term)
    })
  }, [materias, query, selectedIds])

  useEffect(() => {
    const onWindowClick = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    window.addEventListener('click', onWindowClick)
    return () => window.removeEventListener('click', onWindowClick)
  }, [])

  return (
    <div className="materias-selector" ref={wrapperRef}>
      <input
        type="search"
        className="materias-selector__input"
        value={query}
        placeholder="Buscar materia…"
        disabled={disabled}
        onChange={(event) => {
          setQuery(event.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
      />

      {isOpen && !disabled ? (
        <ul className="materias-selector__dropdown" role="listbox">
          {filteredMaterias.length === 0 ? (
            <li className="materias-selector__empty">Sin resultados</li>
          ) : (
            filteredMaterias.map((materia) => (
              <li key={materia.id}>
                <button
                  type="button"
                  className="materias-selector__option"
                  onClick={() => {
                    onAdd(materia)
                    setQuery('')
                    setIsOpen(false)
                  }}
                >
                  <span>{materia.nombre}</span>
                  <small>{`${materia.codigo ?? 'Sin código'} · Nivel ${materia.nivel}`}</small>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  )
}

export default MateriasSelector

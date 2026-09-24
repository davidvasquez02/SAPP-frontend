import { useEffect, useMemo, useRef, useState } from 'react'
import type { MateriaDto, MateriaSeleccionada } from '../../types'
import { filterMaterias, getNivelesMaterias, type NivelMateriaFilter } from './materiasFilter'
import './MateriasSelector.css'

type MateriasSelectorProps = {
  materias: MateriaDto[]
  selected: MateriaSeleccionada[]
  onAdd: (materia: MateriaDto) => void
  disabled?: boolean
}

const MateriasSelector = ({ materias, selected, onAdd, disabled = false }: MateriasSelectorProps) => {
  const [query, setQuery] = useState('')
  const [nivel, setNivel] = useState<NivelMateriaFilter>(null)
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const selectedIds = useMemo(() => new Set(selected.map((item) => item.id)), [selected])
  const niveles = useMemo(() => getNivelesMaterias(materias), [materias])

  const filteredMaterias = useMemo(
    () => filterMaterias(materias, selectedIds, query, nivel),
    [materias, nivel, query, selectedIds],
  )

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
      <div className="materias-selector__controls">
        <label className="materias-selector__search-field">
          <span>Materia</span>
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
        </label>

        <label className="materias-selector__level-field">
          <span>Nivel</span>
          <select
            className="materias-selector__level-select"
            value={nivel ?? ''}
            disabled={disabled}
            onChange={(event) => {
              setNivel(event.target.value === '' ? null : Number(event.target.value))
              setIsOpen(true)
            }}
          >
            <option value="">Todos</option>
            {niveles.map((item) => (
              <option key={item} value={item}>Nivel {item}</option>
            ))}
          </select>
        </label>
      </div>

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
                  <small>
                    {materia.codigo ?? 'Sin código'} · {materia.nivel == null ? 'Electiva' : `Nivel ${materia.nivel}`}
                  </small>
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

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { daneLocations, findMunicipality, formatLocationName } from './daneLocations'
import './DaneLocationSelector.css'

interface DaneLocationSelectorProps {
  departmentCode: string
  municipality: string
  onDepartmentChange: (departmentCode: string) => void
  onMunicipalityChange: (municipality: string) => void
}

const normalizeSearch = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-CO')

export const DaneLocationSelector = ({
  departmentCode,
  municipality,
  onDepartmentChange,
  onMunicipalityChange,
}: DaneLocationSelectorProps) => {
  const municipalityListId = useId()
  const comboboxRef = useRef<HTMLDivElement>(null)
  const [isMunicipalityOpen, setIsMunicipalityOpen] = useState(false)
  const [activeOptionIndex, setActiveOptionIndex] = useState(0)
  const selectedDepartment = useMemo(
    () => daneLocations.find((department) => department.code === departmentCode) ?? daneLocations[0],
    [departmentCode],
  )
  const filteredMunicipalities = useMemo(() => {
    const search = normalizeSearch(municipality.trim())
    if (!search) return selectedDepartment?.municipalities ?? []

    return (selectedDepartment?.municipalities ?? []).filter((item) =>
      normalizeSearch(formatLocationName(item.name)).includes(search),
    )
  }, [municipality, selectedDepartment])

  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!comboboxRef.current?.contains(event.target as Node)) setIsMunicipalityOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [])

  const selectMunicipality = (name: string) => {
    onMunicipalityChange(formatLocationName(name))
    setIsMunicipalityOpen(false)
  }

  const handleMunicipalityBlur = () => {
    const selectedMunicipality = findMunicipality(departmentCode, municipality)
    if (selectedMunicipality) onMunicipalityChange(formatLocationName(selectedMunicipality.name))
  }

  const handleMunicipalityKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setIsMunicipalityOpen(false)
      return
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setIsMunicipalityOpen(true)
      const direction = event.key === 'ArrowDown' ? 1 : -1
      setActiveOptionIndex((current) =>
        Math.max(0, Math.min(filteredMunicipalities.length - 1, current + direction)),
      )
      return
    }

    if (event.key === 'Enter' && isMunicipalityOpen && filteredMunicipalities[activeOptionIndex]) {
      event.preventDefault()
      selectMunicipality(filteredMunicipalities[activeOptionIndex].name)
    }
  }

  return (
    <fieldset className="dane-location-selector">
      <legend>Lugar de expedición del documento *</legend>
      <div className="dane-location-selector__fields">
        <div className="dane-location-selector__department">
          <label htmlFor="departamentoExpedicionDocumento">Departamento</label>
          <select
            id="departamentoExpedicionDocumento"
            value={departmentCode}
            onChange={(event) => {
              setActiveOptionIndex(0)
              onDepartmentChange(event.target.value)
            }}
            required
          >
            {daneLocations.map((department) => (
              <option key={department.code} value={department.code}>
                {formatLocationName(department.name)}
              </option>
            ))}
          </select>
        </div>
        <div ref={comboboxRef} className="dane-location-selector__municipality">
          <label htmlFor="ciudadExpedicionDocumento">Municipio/Ciudad</label>
          <div className="dane-location-selector__combobox">
            <input
              id="ciudadExpedicionDocumento"
              role="combobox"
              aria-autocomplete="list"
              aria-controls={municipalityListId}
              aria-expanded={isMunicipalityOpen}
              aria-activedescendant={
                isMunicipalityOpen && filteredMunicipalities[activeOptionIndex]
                  ? `${municipalityListId}-${filteredMunicipalities[activeOptionIndex].code}`
                  : undefined
              }
              value={municipality}
              onChange={(event) => {
                setActiveOptionIndex(0)
                onMunicipalityChange(event.target.value)
                setIsMunicipalityOpen(true)
              }}
              onFocus={() => setIsMunicipalityOpen(true)}
              onBlur={handleMunicipalityBlur}
              onKeyDown={handleMunicipalityKeyDown}
              placeholder="Escribe para filtrar"
              autoComplete="off"
              required
            />
            <span className="dane-location-selector__chevron" aria-hidden="true">▾</span>
            {isMunicipalityOpen && (
              <ul id={municipalityListId} className="dane-location-selector__options" role="listbox">
                {filteredMunicipalities.length > 0 ? (
                  filteredMunicipalities.map((item, index) => (
                    <li
                      id={`${municipalityListId}-${item.code}`}
                      key={`${departmentCode}-${item.code}`}
                      role="option"
                      aria-selected={index === activeOptionIndex}
                      className={index === activeOptionIndex ? 'is-active' : undefined}
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseEnter={() => setActiveOptionIndex(index)}
                      onClick={() => selectMunicipality(item.name)}
                    >
                      {formatLocationName(item.name)}
                    </li>
                  ))
                ) : (
                  <li className="dane-location-selector__empty">No hay municipios que coincidan</li>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>
      <p className="solicitud-estudiante-form__help">
        Selecciona un municipio del departamento. Al servicio solo se enviará el nombre del municipio.
      </p>
    </fieldset>
  )
}

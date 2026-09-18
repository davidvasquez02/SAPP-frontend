import { useId, useMemo } from 'react'
import { daneLocations, findMunicipality, formatLocationName } from './daneLocations'
import './DaneLocationSelector.css'

interface DaneLocationSelectorProps {
  departmentCode: string
  municipality: string
  onDepartmentChange: (departmentCode: string) => void
  onMunicipalityChange: (municipality: string) => void
}


export const DaneLocationSelector = ({
  departmentCode,
  municipality,
  onDepartmentChange,
  onMunicipalityChange,
}: DaneLocationSelectorProps) => {
  const municipalityListId = useId()
  const selectedDepartment = useMemo(
    () => daneLocations.find((department) => department.code === departmentCode) ?? daneLocations[0],
    [departmentCode],
  )

  const handleMunicipalityBlur = () => {
    const selectedMunicipality = findMunicipality(departmentCode, municipality)
    if (selectedMunicipality) {
      onMunicipalityChange(formatLocationName(selectedMunicipality.name))
    }
  }

  return (
    <fieldset className="dane-location-selector">
      <legend>Lugar de expedición del documento *</legend>
      <div className="dane-location-selector__fields">
        <div>
          <label htmlFor="departamentoExpedicionDocumento">Departamento</label>
          <select
            id="departamentoExpedicionDocumento"
            value={departmentCode}
            onChange={(event) => onDepartmentChange(event.target.value)}
            required
          >
            {daneLocations.map((department) => (
              <option key={department.code} value={department.code}>
                {formatLocationName(department.name)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="ciudadExpedicionDocumento">Municipio/Ciudad</label>
          <input
            id="ciudadExpedicionDocumento"
            list={municipalityListId}
            value={municipality}
            onChange={(event) => onMunicipalityChange(event.target.value)}
            onBlur={handleMunicipalityBlur}
            placeholder="Escribe para filtrar"
            autoComplete="off"
            required
          />
          <datalist id={municipalityListId}>
            {selectedDepartment?.municipalities.map((item) => (
              <option key={`${departmentCode}-${item.code}`} value={formatLocationName(item.name)} />
            ))}
          </datalist>
        </div>
      </div>
      <p className="solicitud-estudiante-form__help">
        Selecciona un municipio del departamento. Al servicio solo se enviará el nombre del municipio.
      </p>
    </fieldset>
  )
}

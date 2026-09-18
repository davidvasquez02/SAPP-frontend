import daneLocationsData from '../../data/daneLocations.json'

export interface DaneMunicipality {
  code: string
  name: string
}

export interface DaneDepartment {
  code: string
  name: string
  municipalities: DaneMunicipality[]
}

export const daneLocations = daneLocationsData as DaneDepartment[]

export const DEFAULT_DEPARTMENT_CODE = '68'

export const normalizeLocationName = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleUpperCase('es-CO')

export const formatLocationName = (value: string): string =>
  value
    .trim()
    .toLocaleLowerCase('es-CO')
    .replace(/(^|[\s'-])\p{L}/gu, (letter) => letter.toLocaleUpperCase('es-CO'))

export const findMunicipality = (departmentCode: string, value: string): DaneMunicipality | undefined => {
  const normalizedValue = normalizeLocationName(value)
  return daneLocations
    .find((department) => department.code === departmentCode)
    ?.municipalities.find((municipality) => normalizeLocationName(municipality.name) === normalizedValue)
}

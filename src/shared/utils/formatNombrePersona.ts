/** Formato de presentación; no modifica el nombre almacenado ni los payloads. */
export const formatNombrePersona = (nombre: string | null | undefined): string =>
  (nombre ?? '').trim().toLocaleLowerCase('es-CO')
    .replace(/(^|[\s\p{Pd}]+)(\p{L})/gu, (_, separador: string, letra: string) =>
      separador + letra.toLocaleUpperCase('es-CO'))

/** Etiqueta del selector: código UIS - nombre (programa). */
export const formatEtiquetaEstudiante = (etiqueta: string): string =>
  etiqueta.replace(/^(.*? - )(.*?)( \(.*\))?$/, (_, codigo: string, nombre: string, programa: string | undefined) =>
    codigo + formatNombrePersona(nombre) + (programa ?? ''))

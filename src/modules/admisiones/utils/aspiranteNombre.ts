export type AspiranteNombre = {
  nombre1: string
  nombre2?: string | null
  apellido1: string
  apellido2?: string | null
}

export const getNombreCompletoAspirante = (aspirante: AspiranteNombre): string =>
  [aspirante.nombre1, aspirante.nombre2, aspirante.apellido1, aspirante.apellido2]
    .map((parte) => parte?.trim())
    .filter((parte): parte is string => Boolean(parte))
    .join(' ')

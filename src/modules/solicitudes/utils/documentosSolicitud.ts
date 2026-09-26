const normalizeDocumentoDescriptor = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()

export const MAX_DOCUMENTOS_SOPORTE_ADICIONAL = 5

export const limitarDocumentosSoporte = (archivosActuales: File[], archivosNuevos: File[]): File[] =>
  [...archivosActuales, ...archivosNuevos].slice(0, MAX_DOCUMENTOS_SOPORTE_ADICIONAL)

export const permiteMultiplesArchivos = (documento: { codigo?: string; nombre?: string }): boolean => {
  const descriptor = normalizeDocumentoDescriptor(`${documento.codigo ?? ''} ${documento.nombre ?? ''}`)
  return descriptor.includes('DOCUMENTO SOPORTE ADICIONAL') || descriptor.includes('SOPORTE ADICIONAL')
}

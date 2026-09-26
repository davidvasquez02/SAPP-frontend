const normalizeDocumentoDescriptor = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()

export const permiteMultiplesArchivos = (documento: { codigo?: string; nombre?: string }): boolean => {
  const descriptor = normalizeDocumentoDescriptor(`${documento.codigo ?? ''} ${documento.nombre ?? ''}`)
  return descriptor.includes('DOCUMENTO SOPORTE ADICIONAL') || descriptor.includes('SOPORTE ADICIONAL')
}

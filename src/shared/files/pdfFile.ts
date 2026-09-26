export const PDF_FILE_ACCEPT = 'application/pdf,.pdf'

export const isPdfFile = (file: File): boolean =>
  file.type.toLowerCase() === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

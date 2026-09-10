import type { SolicitudDocumentoAdjuntoDto } from '../types/documentosAdjuntos'

export const solicitudDocumentosById: Record<number, SolicitudDocumentoAdjuntoDto[]> = {
  1: [
    {
      idDocumento: 101,
      nombreArchivo: 'CARTA_SOLICITUD.pdf',
      mimeType: 'application/pdf',
      base64Contenido: 'JVBERi0xLjQKJcTl8uXrp/Og0MTGCg==',
      descripcion: 'Carta de solicitud firmada por el estudiante',
      obligatorio: true,
    },
    {
      idDocumento: 102,
      nombreArchivo: 'CRONOGRAMA.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      base64Contenido: 'UEsDBBQAAAAIABx9bVIAAAAAAAAAAAAAAAAJAAAAY29udGVudC54bWw=',
      descripcion: 'Cronograma de actividades propuesto',
      obligatorio: false,
    },
  ],
  2: [
    {
      idDocumento: 201,
      nombreArchivo: 'SOPORTE_PAGO.pdf',
      mimeType: 'application/pdf',
      base64Contenido: 'JVBERi0xLjQKJaqrrK0KMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZw==',
      obligatorio: true,
    },
  ],
  3: [
    {
      idDocumento: 301,
      nombreArchivo: 'FORMATO_FIRMAS.pdf',
      mimeType: 'application/pdf',
      base64Contenido: 'JVBERi0xLjQKJcfsj6IKMSAwIG9iago8PAovUGFnZXMgMiAwIFI+Pg==',
      obligatorio: true,
    },
    {
      idDocumento: 302,
      nombreArchivo: 'ANEXO_RESUMEN.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      base64Contenido: 'UEsDBBQABgAIAAAAAAAAAAAAAAAAAAAAAAAAEAAAAd29yZC9kb2N1bWVudC54bWw=',
      obligatorio: false,
    },
    {
      idDocumento: 303,
      nombreArchivo: 'COMPROBANTE_BIBLIOTECA.pdf',
      mimeType: 'application/pdf',
      base64Contenido: 'JVBERi0xLjQKJeLjz9MKMSAwIG9iagpbL1BERi9UZXh0XQplbmRvYmo=',
      obligatorio: false,
    },
  ],
  4: [
    {
      idDocumento: 401,
      nombreArchivo: 'SOLICITUD_EXTEMPORANEA.pdf',
      mimeType: 'application/pdf',
      base64Contenido: 'JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC9UeXBlIC9QYWdlPj4=',
      descripcion: 'Formato oficial de solicitud extemporánea',
      obligatorio: true,
    },
  ],
}

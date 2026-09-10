// TODO: Reemplazar por endpoint de requisitos por tipo de trámite cuando esté disponible.
export interface DocumentoTemplateItem {
  idTipoDocumentoTramite: number
  codigoTipoDocumentoTramite: string
  nombreTipoDocumentoTramite: string
  obligatorioTipoDocumentoTramite: boolean
  descripcionTipoDocumentoTramite?: string
}

export const admisionAspiranteDocumentTemplate: DocumentoTemplateItem[] = [
  {
    idTipoDocumentoTramite: 7,
    codigoTipoDocumentoTramite: 'ADM-ASP-01',
    nombreTipoDocumentoTramite: 'Documento de identidad',
    obligatorioTipoDocumentoTramite: true,
    descripcionTipoDocumentoTramite: 'Cédula o documento oficial vigente.',
  },
  {
    idTipoDocumentoTramite: 8,
    codigoTipoDocumentoTramite: 'ADM-ASP-02',
    nombreTipoDocumentoTramite: 'Hoja de vida',
    obligatorioTipoDocumentoTramite: true,
    descripcionTipoDocumentoTramite: 'Formato libre con experiencia académica.',
  },
  {
    idTipoDocumentoTramite: 9,
    codigoTipoDocumentoTramite: 'ADM-ASP-03',
    nombreTipoDocumentoTramite: 'Certificado de notas',
    obligatorioTipoDocumentoTramite: true,
    descripcionTipoDocumentoTramite: 'Histórico académico del programa de origen.',
  },
]

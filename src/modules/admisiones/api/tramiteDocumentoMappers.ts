import type { DocumentUploadItem } from '../../documentos/types/documentUploadTypes'
import type { TramiteDocumentoDto, TramiteDocumentoUploadItem } from './tramiteDocumentoTypes'

const TARGET_TIPO_TRAMITE = 'ADMISION_COORDINACION'

const normalizeRoleString = (value: unknown): string => String(value ?? '').trim().toUpperCase()

export const resolveTipoTramiteName = (dto: TramiteDocumentoDto): string => {
  if (typeof dto.tipoTramite === 'string') {
    return dto.tipoTramite
  }

  if (dto.tipoTramite?.nombre) {
    return dto.tipoTramite.nombre
  }

  return dto.nombreTipoTramite ?? ''
}

export const mapTramiteDocsToUploadItems = (
  docs: TramiteDocumentoDto[],
): TramiteDocumentoUploadItem[] => {
  return docs
    .filter((doc) => normalizeRoleString(resolveTipoTramiteName(doc)) === TARGET_TIPO_TRAMITE)
    .map((doc) => ({
      idTipoDocumentoTramite: doc.id,
      codigoTipoDocumentoTramite: doc.codigo?.trim() || `DOC-${doc.id}`,
      nombre: doc.nombre,
      descripcion: doc.descripcion ?? null,
      obligatorio: Boolean(doc.obligatorio),
      tipoTramiteNombre: resolveTipoTramiteName(doc),
    }))
}

export const mapTramiteDocsToDocumentUploadItems = (
  docs: TramiteDocumentoDto[],
): DocumentUploadItem[] => {
  return mapTramiteDocsToUploadItems(docs).map((item) => ({
    id: item.idTipoDocumentoTramite,
    codigo: item.codigoTipoDocumentoTramite,
    nombre: item.nombre,
    descripcion: item.descripcion,
    obligatorio: item.obligatorio,
    status: 'NOT_SELECTED',
    selectedFile: null,
  }))
}

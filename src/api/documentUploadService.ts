import { httpPost } from '../shared/http/httpClient'
import type { ApiResponse } from './types'
import type { DocumentUploadRequest, DocumentUploadResponseDto } from './documentUploadTypes'

export async function uploadDocument(
  req: DocumentUploadRequest,
): Promise<DocumentUploadResponseDto> {
  const payload = await httpPost<ApiResponse<DocumentUploadResponseDto>>('/sapp/document', req)

  if (!payload.ok) {
    throw new Error(payload.message || 'Upload fallido')
  }

  return payload.data
}

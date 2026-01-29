import { API_BASE_URL } from './config'
import type { ApiResponse } from './types'
import type { DocumentUploadRequest, DocumentUploadResponseDto } from './documentUploadTypes'

export async function uploadDocument(
  req: DocumentUploadRequest,
): Promise<DocumentUploadResponseDto> {
  const response = await fetch(`${API_BASE_URL}/sapp/document`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const payload: ApiResponse<DocumentUploadResponseDto> = await response.json()

  if (!payload.ok) {
    throw new Error(payload.message || 'Upload fallido')
  }

  return payload.data
}

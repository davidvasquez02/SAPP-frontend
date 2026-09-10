export type UploadStatus =
  | 'NOT_SELECTED'
  | 'READY_TO_UPLOAD'
  | 'UPLOADING'
  | 'UPLOADED'
  | 'APPROVED'
  | 'REJECTED'
  | 'ERROR'

export interface DocumentUploadItem {
  id: number
  codigo: string
  nombre: string
  descripcion?: string | null
  obligatorio: boolean
  status: UploadStatus
  selectedFile: File | null
  uploadedFileName?: string
  uploadedBase64?: string
  uploadedMimeType?: string
  backendEstadoDocumento?: string
  rejectionReason?: string
  errorMessage?: string
}

export type UploadStatus = 'NOT_SELECTED' | 'READY_TO_UPLOAD' | 'UPLOADING' | 'UPLOADED' | 'ERROR'

export interface DocumentUploadItem {
  id: number
  codigo: string
  nombre: string
  descripcion?: string | null
  obligatorio: boolean
  status: UploadStatus
  selectedFile: File | null
  uploadedFileName?: string
  errorMessage?: string
}

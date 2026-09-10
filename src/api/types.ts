export interface ApiResponse<T> {
  ok: boolean
  message: string
  data: T
}

export interface ApiError {
  message: string
  status?: number
}

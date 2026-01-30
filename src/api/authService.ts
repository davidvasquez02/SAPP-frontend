import { API_BASE_URL } from './config'
import type { LoginRequestDto, LoginResponseDto } from './authTypes'
import type { ApiResponse } from './types'

export const login = async (username: string, password: string): Promise<LoginResponseDto> => {
  if (!username.trim() || !password.trim()) {
    throw new Error('Credenciales inválidas')
  }

  const payload: LoginRequestDto = {
    username: username.trim(),
    password,
  }

  const response = await fetch(`${API_BASE_URL}/sapp/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    let errorMessage = `Error HTTP ${response.status}`

    try {
      const errorBody = (await response.json()) as Partial<ApiResponse<unknown>>
      if (errorBody?.message) {
        errorMessage = errorBody.message
      }
    } catch {
      try {
        const fallbackText = await response.text()
        if (fallbackText) {
          errorMessage = fallbackText
        }
      } catch {
        // Ignore parsing errors and keep the default message.
      }
    }

    throw new Error(errorMessage)
  }

  const data = (await response.json()) as ApiResponse<LoginResponseDto>

  if (!data.ok) {
    throw new Error(data.message || 'Login fallido')
  }

  return data.data
}

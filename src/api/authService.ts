import { httpPost } from '../shared/http/httpClient'
import type { LoginRequestDto, UserLoginResponseDto } from './authTypes'
import type { ApiResponse } from './types'

export const login = async (username: string, password: string): Promise<UserLoginResponseDto> => {
  if (!username.trim() || !password.trim()) {
    throw new Error('Credenciales inválidas')
  }

  const payload: LoginRequestDto = {
    username: username.trim(),
    password,
  }

  const data = await httpPost<ApiResponse<UserLoginResponseDto>>('/sapp/auth/login', payload, {
    auth: false,
  })

  if (!data.ok) {
    throw new Error(data.message || 'Login fallido')
  }

  return data.data
}

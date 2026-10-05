import { httpGet, httpPost, httpPut } from '../shared/http/httpClient'
import type { ApiResponse } from './types'

export type IdiomaPlantillaCorreo = 'ES' | 'EN'

export interface PlantillaCorreoResumen {
  id: number
  sigla: string
  nombre: string
  descripcion: string
  asunto: string
  idioma: IdiomaPlantillaCorreo
  fechaCreacion: string
}

export interface PlantillaCorreo extends PlantillaCorreoResumen {
  contenidoHtml: string
}

export interface DatosPlantillaCorreo {
  nombre: string
  descripcion: string
  asunto: string
  idioma: IdiomaPlantillaCorreo
  contenidoHtml: string
}

export interface NuevaPlantillaCorreo extends DatosPlantillaCorreo {
  sigla: string
}

const BASE = '/sapp/plantillasCorreo'

export const getPlantillasCorreo = async (): Promise<PlantillaCorreoResumen[]> => {
  const response = await httpGet<ApiResponse<PlantillaCorreoResumen[]>>(BASE)
  return response.data ?? []
}

export const getPlantillaCorreo = async (id: number): Promise<PlantillaCorreo> => {
  const response = await httpGet<ApiResponse<PlantillaCorreo>>(`${BASE}/${id}`)
  return response.data
}

export const crearPlantillaCorreo = async (plantilla: NuevaPlantillaCorreo): Promise<PlantillaCorreo> => {
  const response = await httpPost<ApiResponse<PlantillaCorreo>>(BASE, plantilla)
  return response.data
}

export const actualizarPlantillaCorreo = async (id: number, datos: DatosPlantillaCorreo): Promise<PlantillaCorreo> => {
  const response = await httpPut<ApiResponse<PlantillaCorreo>>(`${BASE}/${id}`, datos)
  return response.data
}

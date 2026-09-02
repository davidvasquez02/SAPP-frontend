export type TipoInforme = 'ADMISION' | 'MATRICULA' | 'CREDITOS_CONDONABLES'

export interface GenerarInformeRequest {
  tipoProceso: TipoInforme
  programaId: number
  actaId: number
  convocatoriaId?: number
  periodoId?: number
}

export interface GenerarInformeResponse {
  solicitudId: string
  mensaje: string
}

export const generarInforme = async (
  request: GenerarInformeRequest,
): Promise<GenerarInformeResponse> => {
  await new Promise((resolve) => window.setTimeout(resolve, 650))

  return {
    solicitudId: `MOCK-${request.tipoProceso}-${Date.now()}`,
    mensaje: 'La solicitud del informe fue generada correctamente (servicio mock).',
  }
}

export interface UploadResponse {
  ok: boolean
  message: string
}

interface UploadParams {
  aspiranteId: number
  idTipoDocumentoTramite: number
  file: File
}

export const uploadAspiranteDocumento = async ({
  aspiranteId,
  idTipoDocumentoTramite,
  file,
}: UploadParams): Promise<UploadResponse> => {
  void aspiranteId
  void idTipoDocumentoTramite
  const delay = Math.floor(Math.random() * 700) + 800

  return new Promise((resolve) => {
    window.setTimeout(() => {
      if (file.size === 0) {
        resolve({ ok: false, message: 'Archivo inválido' })
        return
      }

      resolve({ ok: true, message: 'Documento cargado correctamente (mock)' })
    }, delay)
  })
}

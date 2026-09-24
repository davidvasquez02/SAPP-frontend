export interface ConfiguracionDatosTrabajoSolicitud {
  esExamenDoctoral: boolean
  requiereTitulo: boolean
  requiereResumen: boolean
  tituloLabel: string
}

const TIPOS_MAESTRIA_CON_DATOS_TRABAJO = new Set([6, 7])
const TIPOS_DOCTORADO_CON_DATOS_TRABAJO = new Set([4, 5])
const TIPO_EXAMEN_DOCTORAL_ID = 9

export const getConfiguracionDatosTrabajo = (
  tipoSolicitudId: number | null,
): ConfiguracionDatosTrabajoSolicitud => {
  const esMaestria = tipoSolicitudId !== null && TIPOS_MAESTRIA_CON_DATOS_TRABAJO.has(tipoSolicitudId)
  const esDoctorado = tipoSolicitudId !== null && TIPOS_DOCTORADO_CON_DATOS_TRABAJO.has(tipoSolicitudId)
  const requiereResumen = esMaestria || esDoctorado

  return {
    esExamenDoctoral: tipoSolicitudId === TIPO_EXAMEN_DOCTORAL_ID,
    requiereTitulo: requiereResumen || tipoSolicitudId === TIPO_EXAMEN_DOCTORAL_ID,
    requiereResumen,
    tituloLabel: esMaestria
      ? 'Título del trabajo de investigación'
      : esDoctorado
        ? 'Título de la tesis'
        : 'Título del trabajo',
  }
}

export const getErrorTituloTrabajo = (
  configuracion: ConfiguracionDatosTrabajoSolicitud,
  tituloTrabajo: string,
): string | null =>
  configuracion.requiereTitulo && tituloTrabajo.trim() === ''
    ? `Debes ingresar el ${configuracion.tituloLabel.toLocaleLowerCase('es-CO')}.`
    : null

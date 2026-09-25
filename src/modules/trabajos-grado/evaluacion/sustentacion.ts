import type { ProcesoEvaluacionTg } from './types'

export interface DetalleSustentacion {
  fecha: string | null
  modalidad: string | null
  lugar: string | null
  enlace: string | null
  esVirtual: boolean
}

const clean = (value?: string | null): string | null => value?.trim() || null

export const obtenerDetalleSustentacion = (proceso: ProcesoEvaluacionTg): DetalleSustentacion => {
  const modalidadCodigo = clean(
    proceso.sustentacion?.modalidadCodigo || proceso.modalidadSustentacionCodigo,
  )
  const modalidad = clean(
    proceso.sustentacion?.modalidadNombre || proceso.modalidadSustentacion || modalidadCodigo,
  )

  return {
    fecha: clean(proceso.sustentacion?.fechaSustentacion || proceso.fechaSustentacion),
    modalidad,
    lugar: clean(proceso.sustentacion?.lugar || proceso.lugarSustentacion),
    enlace: clean(proceso.sustentacion?.enlace || proceso.enlaceSustentacion),
    esVirtual: modalidadCodigo?.toLocaleUpperCase('es-CO') === 'VIRTUAL'
      || modalidad?.toLocaleUpperCase('es-CO') === 'VIRTUAL',
  }
}

export const tieneDetalleSustentacion = (detalle: DetalleSustentacion): boolean =>
  Boolean(detalle.fecha || detalle.modalidad || detalle.lugar || (detalle.esVirtual && detalle.enlace))

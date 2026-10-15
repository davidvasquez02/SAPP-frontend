import type { ProcesoEvaluacionTg } from './types'

export interface DetalleSustentacion {
  fecha: string | null
  modalidad: string | null
  lugar: string | null
  enlace: string | null
  esVirtual: boolean
  esHibrida: boolean
}

const clean = (value?: string | null): string | null => value?.trim() || null

const modalidadNormalizada = (value: string | null | undefined) =>
  (value ?? '').trim().normalize('NFD').replace(/\p{M}/gu, '').toUpperCase()

export const requiereLugarSustentacion = (modalidad: string) =>
  ['PRESENCIAL', 'HIBRIDA'].includes(modalidadNormalizada(modalidad))

export const requiereEnlaceSustentacion = (modalidad: string) =>
  ['VIRTUAL', 'HIBRIDA'].includes(modalidadNormalizada(modalidad))

export const validarUbicacionSustentacion = (modalidad: string, lugar: string, enlace: string): string | null => {
  if (!['PRESENCIAL', 'VIRTUAL', 'HIBRIDA'].includes(modalidadNormalizada(modalidad))) return 'Selecciona una modalidad de sustentación válida.'
  if (requiereLugarSustentacion(modalidad) && !lugar.trim()) return 'La modalidad seleccionada requiere un lugar.'
  if (requiereEnlaceSustentacion(modalidad)) {
    if (!enlace.trim()) return 'La modalidad seleccionada requiere un enlace.'
    try {
      const url = new URL(enlace.trim())
      if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) throw new Error('URL inválida')
    } catch { return 'Ingresa un enlace de videoconferencia válido (http o https).' }
  }
  return null
}

export const obtenerDetalleSustentacion = (proceso: ProcesoEvaluacionTg): DetalleSustentacion => {
  const modalidadCodigo = clean(
    proceso.sustentacion?.modalidadCodigo || proceso.modalidadSustentacionCodigo,
  )
  const modalidad = clean(
    proceso.sustentacion?.modalidadNombre || proceso.modalidadSustentacion || modalidadCodigo,
  )
  const codigo = modalidadNormalizada(modalidadCodigo || modalidad)

  return {
    fecha: clean(proceso.sustentacion?.fechaSustentacion || proceso.fechaSustentacion),
    modalidad,
    lugar: clean(proceso.sustentacion?.lugar || proceso.lugarSustentacion),
    enlace: clean(proceso.sustentacion?.enlace || proceso.enlaceSustentacion),
    esVirtual: codigo === 'VIRTUAL',
    esHibrida: codigo === 'HIBRIDA',
  }
}

export const tieneDetalleSustentacion = (detalle: DetalleSustentacion): boolean =>
  Boolean(detalle.fecha || detalle.modalidad || detalle.lugar || ((detalle.esVirtual || detalle.esHibrida) && detalle.enlace))

import type { EstudianteBusqueda } from './types'

export interface EstudianteConsultaBusqueda {
  estudiante: { id: number; codigoEstudianteUis?: string | null }
  nombreCompleto?: string | null
}

const normalizarBusqueda = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-CO')

export function filtrarEstudiantesPorNombre(estudiantes: EstudianteConsultaBusqueda[], query: string): EstudianteBusqueda[] {
  const terminos = normalizarBusqueda(query.trim()).split(/\s+/).filter(Boolean)
  return estudiantes
    .filter(({ nombreCompleto }) => {
      const nombre = normalizarBusqueda(nombreCompleto ?? '')
      return terminos.every(termino => nombre.includes(termino))
    })
    .map(({ estudiante, nombreCompleto }) => ({
      id: estudiante.id,
      codigoNombre: `${estudiante.codigoEstudianteUis?.trim() || `EST-${estudiante.id}`} · ${nombreCompleto?.trim() || 'Nombre no disponible'}`,
    }))
}

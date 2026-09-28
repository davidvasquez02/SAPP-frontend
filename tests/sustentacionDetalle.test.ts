import assert from 'node:assert/strict'
import test from 'node:test'
import { obtenerDetalleSustentacion, tieneDetalleSustentacion } from '../src/modules/trabajos-grado/evaluacion/sustentacion.ts'
import type { ProcesoEvaluacionTg } from '../src/modules/trabajos-grado/evaluacion/types.ts'

const procesoBase = {
  tipoSolicitudCodigo: 'CAND_DOCTORAL',
  titulo: 'Título de prueba',
  programa: 'Doctorado',
  estadoSolicitud: 'SUST_PROGRAMADA',
  jurados: [],
} satisfies ProcesoEvaluacionTg

test('obtiene los campos planos de una sustentación presencial programada', () => {
  const detalle = obtenerDetalleSustentacion({
    ...procesoBase,
    fechaSustentacion: '2026-09-25T15:03:00',
    modalidadSustentacionCodigo: 'PRESENCIAL',
    modalidadSustentacion: 'Presencial',
    lugarSustentacion: 'UIS',
    enlaceSustentacion: 'https://meet.example/sala-no-aplicable',
  })

  assert.deepEqual(detalle, {
    fecha: '2026-09-25T15:03:00',
    modalidad: 'Presencial',
    lugar: 'UIS',
    enlace: 'https://meet.example/sala-no-aplicable',
    esVirtual: false,
  })
  assert.equal(tieneDetalleSustentacion(detalle), true)
})

test('conserva el enlace para una sustentación virtual', () => {
  const detalle = obtenerDetalleSustentacion({
    ...procesoBase,
    modalidadSustentacionCodigo: 'VIRTUAL',
    modalidadSustentacion: 'Virtual',
    enlaceSustentacion: 'https://meet.example/sala',
  })

  assert.equal(detalle.esVirtual, true)
  assert.equal(detalle.enlace, 'https://meet.example/sala')
  assert.equal(tieneDetalleSustentacion(detalle), true)
})

test('mantiene compatibilidad con la sustentación anidada', () => {
  const detalle = obtenerDetalleSustentacion({
    ...procesoBase,
    sustentacion: {
      fechaSustentacion: '2026-09-25T15:03:00',
      modalidadCodigo: 'VIRTUAL',
      modalidadNombre: 'Virtual',
      enlace: 'https://meet.example/sala',
    },
  })

  assert.equal(detalle.fecha, '2026-09-25T15:03:00')
  assert.equal(detalle.modalidad, 'Virtual')
  assert.equal(detalle.esVirtual, true)
})

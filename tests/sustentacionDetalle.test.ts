import assert from 'node:assert/strict'
import test from 'node:test'
import { obtenerDetalleSustentacion, tieneDetalleSustentacion, requiereLugarSustentacion, requiereEnlaceSustentacion, validarUbicacionSustentacion } from '../src/modules/trabajos-grado/evaluacion/sustentacion.ts'
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
    esHibrida: false,
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

test('sustentación híbrida conserva lugar y enlace en contratos planos y anidados', () => {
  for (const fields of [
    { modalidadSustentacionCodigo: 'HIBRIDA', modalidadSustentacion: 'Híbrida', lugarSustentacion: 'UIS, sala 4', enlaceSustentacion: 'https://meet.example/sala' },
    { sustentacion: { fechaSustentacion: '2026-11-01T15:00:00', modalidadCodigo: 'HIBRIDA', modalidadNombre: 'Híbrida', lugar: 'UIS, sala 4', enlace: 'https://meet.example/sala' } },
  ]) {
    const detalle = obtenerDetalleSustentacion({ ...procesoBase, ...fields })
    assert.equal(detalle.esHibrida, true)
    assert.equal(detalle.esVirtual, false)
    assert.equal(detalle.lugar, 'UIS, sala 4')
    assert.equal(detalle.enlace, 'https://meet.example/sala')
    assert.equal(tieneDetalleSustentacion(detalle), true)
  }
})

test('reconoce Híbrida por nombre y prefiere el código sobre un nombre desactualizado', () => {
  assert.equal(obtenerDetalleSustentacion({ ...procesoBase, modalidadSustentacion: ' Híbrida ' }).esHibrida, true)
  const detalle = obtenerDetalleSustentacion({ ...procesoBase, modalidadSustentacionCodigo: 'PRESENCIAL', modalidadSustentacion: 'Virtual' })
  assert.equal(detalle.esVirtual, false)
  assert.equal(detalle.esHibrida, false)
})

test('cada modalidad exige los campos correspondientes', () => {
  assert.equal(requiereLugarSustentacion('HIBRIDA'), true)
  assert.equal(requiereEnlaceSustentacion('HIBRIDA'), true)
  assert.equal(requiereLugarSustentacion('VIRTUAL'), false)
  assert.equal(requiereEnlaceSustentacion('PRESENCIAL'), false)
  assert.match(validarUbicacionSustentacion('HIBRIDA', '', 'https://meet.example/sala')!, /requiere un lugar/)
  assert.match(validarUbicacionSustentacion('HIBRIDA', 'UIS', '   ')!, /requiere un enlace/)
  assert.equal(validarUbicacionSustentacion('HIBRIDA', ' UIS ', ' https://meet.example/sala '), null)
  assert.equal(validarUbicacionSustentacion('PRESENCIAL', 'UIS', ''), null)
  assert.equal(validarUbicacionSustentacion('VIRTUAL', '', 'https://meet.example/sala'), null)
})

test('rechaza enlaces inválidos y modalidades desconocidas', () => {
  for (const modalidad of ['VIRTUAL', 'HIBRIDA']) {
    for (const enlace of ['javascript:alert(1)', 'ftp://example.test', 'meet.example/sala', 'https://']) {
      assert.match(validarUbicacionSustentacion(modalidad, 'UIS', enlace)!, /enlace de videoconferencia válido/)
    }
  }
  assert.match(validarUbicacionSustentacion('OTRA', 'UIS', 'https://meet.example')!, /modalidad.*válida/)
})

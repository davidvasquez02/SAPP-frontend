import assert from 'node:assert/strict'
import test from 'node:test'
import { getAprobacionTrabajoGradoLabel } from '../src/modules/trabajos-grado/constants.ts'

test('describe el siguiente paso al aprobar un proyecto enviado a comité', () => {
  assert.equal(
    getAprobacionTrabajoGradoLabel(6, 'ENVIADA_COMITE', 'ENVIADA A COMITÉ ASESOR DE POSGRADOS'),
    'Aprobar y enviar a consejo académico',
  )
  assert.equal(
    getAprobacionTrabajoGradoLabel(13, 'ENVIADA', 'ENVIADA A COMITE ASESOR DE POSGRADOS'),
    'Aprobar y enviar a consejo académico',
  )
})

test('describe la asignación de jurados al aprobar un proyecto enviado a consejo', () => {
  assert.equal(
    getAprobacionTrabajoGradoLabel(4, 'ENVIADA_CONSEJO', 'ENVIADA A CONSEJO ACADÉMICO'),
    'Aprobar y asignar jurados',
  )
})

test('conserva la etiqueta general fuera de proyectos de grado', () => {
  assert.equal(
    getAprobacionTrabajoGradoLabel(11, 'ENVIADA_CONSEJO', 'ENVIADA A CONSEJO ACADÉMICO'),
    'Aprobar',
  )
})

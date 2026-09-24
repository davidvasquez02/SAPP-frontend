import assert from 'node:assert/strict'
import test from 'node:test'
import { TIPOS_SOLICITUD_GENERAL_IDS } from '../src/modules/solicitudes/constants.ts'

test('limita el modulo de coordinacion a los tipos de solicitudes generales', () => {
  assert.deepEqual(TIPOS_SOLICITUD_GENERAL_IDS, [1, 10, 11, 2])
})

import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getConvocatoriaCreateErrorMessage,
  isDuplicateConvocatoriaError,
} from '../src/modules/admisiones/utils/convocatoriaCreateError.ts'

test('presenta un mensaje de negocio cuando ya existe la convocatoria del programa y período', () => {
  const technicalError = new Error(
    'Unexpected error: duplicate key value violates unique constraint "uq_convocatoria" Detail: Key (programa_id, periodo_id)=(1, 1) already exists.',
  )

  assert.equal(isDuplicateConvocatoriaError(technicalError), true)
  assert.equal(
    getConvocatoriaCreateErrorMessage(technicalError, '2026-1'),
    'Ya existe una convocatoria para el programa seleccionado en el período académico 2026-1.',
  )
  assert.equal(
    getConvocatoriaCreateErrorMessage(technicalError, '2026-1').includes('uq_convocatoria'),
    false,
  )
})

test('conserva el mensaje recibido cuando el error no corresponde a la convocatoria duplicada', () => {
  const validationError = new Error('La fecha de fin no puede ser menor a la fecha de inicio.')

  assert.equal(isDuplicateConvocatoriaError(validationError), false)
  assert.equal(
    getConvocatoriaCreateErrorMessage(validationError, '2026-1'),
    validationError.message,
  )
})

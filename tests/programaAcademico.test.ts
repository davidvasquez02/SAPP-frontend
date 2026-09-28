import assert from 'node:assert/strict'
import test from 'node:test'
import {
  formatProgramaAcademico,
  resolveTipoPrograma,
} from '../src/shared/domain/programaAcademico.ts'

test('reconoce el contrato vigente de programas académicos', () => {
  assert.equal(resolveTipoPrograma({ id: 1, nombre: 'MAESTRÍA EN INGENIERÍA DE SISTEMAS E INFORMÁTICA', nivel: 'MAESTRIA', codigo_uis: '302' }), 'maestria')
  assert.equal(resolveTipoPrograma({ id: 2, nombre: 'DOCTORADO EN CIENCIAS DE LA COMPUTACION', nivel: 'DOCTORADO', codigo_uis: '347' }), 'doctorado')
})

test('presenta código UIS y nombre oficial sin siglas históricas', () => {
  assert.equal(formatProgramaAcademico({ id: 1, nombre: 'MISI' }), '302 - MAESTRÍA EN INGENIERÍA DE SISTEMAS E INFORMÁTICA')
  assert.equal(formatProgramaAcademico({ id: 2, nombre: 'DCC' }), '347 - DOCTORADO EN CIENCIAS DE LA COMPUTACION')
})

test('mantiene compatibilidad de lectura con valores históricos', () => {
  assert.equal(resolveTipoPrograma('61412 - MISI'), 'maestria')
  assert.equal(resolveTipoPrograma('61204 - DCC'), 'doctorado')
})

import assert from 'node:assert/strict'
import test from 'node:test'
import {
  etiquetaPrograma,
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

test('el programa se muestra siempre como "código - nombre"', () => {
  // lo que ya viene del servidor con código no se repite
  assert.equal(etiquetaPrograma('302 - Maestría en Ingeniería de Sistemas e Informática'), '302 - Maestría en Ingeniería de Sistemas e Informática')
  assert.equal(etiquetaPrograma({ id: 1, nombre: 'x', codigoNombre: '302 - Maestría' }), '302 - Maestría')
  // siglas históricas: código y nombre completo
  assert.equal(etiquetaPrograma('MISI'), '302 - Maestría en Ingeniería de Sistemas e Informática')
  assert.equal(etiquetaPrograma('DCC'), '347 - Doctorado en Ciencias de la Computación')
  // sin código en el texto: se antepone el del programa
  assert.equal(etiquetaPrograma({ id: 2, nombre: 'Doctorado en Ciencias de la Computación' }), '347 - Doctorado en Ciencias de la Computación')
  assert.equal(etiquetaPrograma({ id: 9, nombre: 'Programa nuevo', codigoUis: '999' }), '999 - Programa nuevo')
  // un programa desconocido sin código queda con su nombre
  assert.equal(etiquetaPrograma('Programa sin código'), 'Programa sin código')
  assert.equal(etiquetaPrograma(null), '')
})

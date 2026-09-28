import assert from 'node:assert/strict'
import test from 'node:test'
import type { AspiranteCreateResponseDto } from '../src/modules/admisiones/api/aspiranteCreateTypes.ts'
import { getNombreCompletoAspirante } from '../src/modules/admisiones/utils/aspiranteNombre.ts'

test('compone el nombre del aspirante desde la respuesta real de creación', () => {
  const response: AspiranteCreateResponseDto = {
    id: 161,
    inscripcionAdmisionId: 156,
    nombre1: 'davidxzz',
    nombre2: 'david',
    apellido1: 'vasquezzz',
    apellido2: 'vasquez',
    numeroDocumento: '23213123',
    numeroInscripcionUis: 23213123,
    emailPersonal: '10davids111@gmail.com',
    telefono: '3148605434',
    observaciones: null,
    tipoDocumentoIdentificacion: 'CEDULA DE CIUDADANIA',
    fechaRegistro: '2026-09-26 15:55:51',
    director: null,
    grupoInvestigacion: null,
  }

  assert.equal(
    getNombreCompletoAspirante(response),
    'davidxzz david vasquezzz vasquez',
  )
})

test('omite nombres opcionales nulos o vacíos sin intentar ejecutar trim sobre undefined', () => {
  assert.equal(
    getNombreCompletoAspirante({
      nombre1: 'David',
      nombre2: null,
      apellido1: 'Vasquez',
      apellido2: null,
    }),
    'David Vasquez',
  )
})

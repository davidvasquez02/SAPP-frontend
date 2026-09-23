import assert from 'node:assert/strict'
import test from 'node:test'
import { puedeFirmarDocumentosSolicitud } from '../src/modules/solicitudes/utils/firmaSolicitud.ts'

test('permite al docente firmar una solicitud que tiene asignada y está pendiente de firma', () => {
  assert.equal(puedeFirmarDocumentosSolicitud({
    esGestionPosgrados: false,
    esDocente: true,
    estaAsignadaAlUsuario: true,
    estado: 'POR FIRMA CARTA CONTRAPRESTACION',
  }), true)
})

test('reconoce las siglas de los estados de firma', () => {
  assert.equal(puedeFirmarDocumentosSolicitud({
    esGestionPosgrados: false,
    esDocente: true,
    estaAsignadaAlUsuario: true,
    estadoSigla: 'PFIR_CAR_CONT',
  }), true)
})

test('no permite al docente firmar solicitudes ajenas ni solicitudes fuera de firma', () => {
  assert.equal(puedeFirmarDocumentosSolicitud({
    esGestionPosgrados: false,
    esDocente: true,
    estaAsignadaAlUsuario: false,
    estadoSigla: 'PFIR_CAR_CONT',
  }), false)
  assert.equal(puedeFirmarDocumentosSolicitud({
    esGestionPosgrados: false,
    esDocente: true,
    estaAsignadaAlUsuario: true,
    estadoSigla: 'EN_REVISION',
  }), false)
})

test('conserva la firma de gestión de posgrados en estados habilitados', () => {
  assert.equal(puedeFirmarDocumentosSolicitud({
    esGestionPosgrados: true,
    esDocente: false,
    estaAsignadaAlUsuario: false,
    estadoSigla: 'PFIR_COOR_POS',
  }), true)
})

test('oculta la firma al docente cuando el trámite pasa a otro responsable', () => {
  assert.equal(puedeFirmarDocumentosSolicitud({
    esGestionPosgrados: false,
    esDocente: true,
    estaAsignadaAlUsuario: false,
    estado: 'POR FIRMA COORDINACION DE POSGRADOS',
    estadoSigla: 'PFIR_COOR_POS',
  }), false)
})

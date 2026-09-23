import assert from 'node:assert/strict'
import test from 'node:test'
import {
  estaAsignadaSolicitudAlUsuario,
  puedeFirmarDocumentosSolicitud,
} from '../src/modules/solicitudes/utils/firmaSolicitud.ts'

test('compara la persona asignada del crédito con la persona de la sesión', () => {
  assert.equal(estaAsignadaSolicitudAlUsuario({
    personaAsignadaId: 65,
    personaSesionId: 65,
    incluidaEnSolicitudesAsignadas: false,
  }), true)
  assert.equal(estaAsignadaSolicitudAlUsuario({
    personaAsignadaId: 66,
    personaSesionId: 65,
    incluidaEnSolicitudesAsignadas: true,
  }), false)
})

test('usa el listado de asignadas cuando el detalle no identifica al responsable', () => {
  assert.equal(estaAsignadaSolicitudAlUsuario({
    incluidaEnSolicitudesAsignadas: true,
  }), true)
})

test('permite al docente firmar una solicitud que tiene asignada y está pendiente de firma', () => {
  assert.equal(puedeFirmarDocumentosSolicitud({
    estaAsignadaAlUsuario: true,
    estado: 'POR FIRMA CARTA CONTRAPRESTACION',
  }), true)
})

test('reconoce las siglas de los estados de firma', () => {
  assert.equal(puedeFirmarDocumentosSolicitud({
    estaAsignadaAlUsuario: true,
    estadoSigla: 'PFIR_CAR_CONT',
  }), true)
})

test('no permite al docente firmar solicitudes ajenas ni solicitudes fuera de firma', () => {
  assert.equal(puedeFirmarDocumentosSolicitud({
    estaAsignadaAlUsuario: false,
    estadoSigla: 'PFIR_CAR_CONT',
  }), false)
  assert.equal(puedeFirmarDocumentosSolicitud({
    estaAsignadaAlUsuario: true,
    estadoSigla: 'EN_REVISION',
  }), false)
})

test('exige asignación vigente también para gestión de posgrados', () => {
  assert.equal(puedeFirmarDocumentosSolicitud({
    estaAsignadaAlUsuario: false,
    estadoSigla: 'PFIR_COOR_POS',
  }), false)
})

test('oculta la firma al docente cuando el trámite pasa a otro responsable', () => {
  assert.equal(puedeFirmarDocumentosSolicitud({
    estaAsignadaAlUsuario: false,
    estado: 'POR FIRMA COORDINACION DE POSGRADOS',
    estadoSigla: 'PFIR_COOR_POS',
  }), false)
})

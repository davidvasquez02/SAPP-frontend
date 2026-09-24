import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getConfiguracionDatosTrabajo,
  getErrorTituloTrabajo,
} from '../src/modules/solicitudes/utils/datosTrabajoSolicitud.ts'

test('exige título en cada solicitud de proyecto de grado que presenta ese campo', () => {
  for (const tipoSolicitudId of [4, 5, 6, 7, 9]) {
    const configuracion = getConfiguracionDatosTrabajo(tipoSolicitudId)

    assert.equal(configuracion.requiereTitulo, true)
    assert.match(getErrorTituloTrabajo(configuracion, '   ') ?? '', /^Debes ingresar el título/)
    assert.equal(getErrorTituloTrabajo(configuracion, 'Análisis de sistemas'), null)
  }
})

test('no exige ni envía datos de trabajo para tipos que no presentan el campo', () => {
  const configuracion = getConfiguracionDatosTrabajo(13)

  assert.equal(configuracion.requiereTitulo, false)
  assert.equal(configuracion.requiereResumen, false)
  assert.equal(getErrorTituloTrabajo(configuracion, ''), null)
})

test('mantiene el resumen obligatorio solo para propuestas y defensas', () => {
  for (const tipoSolicitudId of [4, 5, 6, 7]) {
    assert.equal(getConfiguracionDatosTrabajo(tipoSolicitudId).requiereResumen, true)
  }

  assert.equal(getConfiguracionDatosTrabajo(9).requiereResumen, false)
})

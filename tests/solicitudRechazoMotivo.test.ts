import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const detailSource = readFileSync('src/pages/SolicitudDetalle/SolicitudDetallePage.tsx', 'utf8')
const serviceSource = readFileSync('src/modules/solicitudes/api/solicitudCambioEstadoService.ts', 'utf8')

test('solicitudes, créditos y proyectos solicitan un motivo antes de rechazar', () => {
  assert.match(detailSource, /onClick=\{handleRejectClick\}/)
  assert.match(detailSource, /<h3 id="rejection-title">Motivo de rechazo<\/h3>/)
  assert.match(detailSource, /if \(!motivo\) \{\s*setRejectionReasonError\('Debes indicar el motivo del rechazo\.'\)/)
  assert.match(detailSource, /handleResolverSolicitud\('RECHAZADA', undefined, undefined, motivo\)/)
})

test('el cambio de estado envía observaciones y el detalle rechazado las identifica como motivo', () => {
  assert.match(serviceSource, /params\.set\('observaciones', options\.observaciones\)/)
  assert.match(detailSource, /currentEstado === 'RECHAZADA' \? 'Motivo de rechazo' : 'Observaciones'/)
  assert.match(detailSource, /\{solicitud\.observaciones \|\| 'Sin observaciones\.'\}/)
})

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const detailSource = readFileSync('src/pages/SolicitudDetalle/SolicitudDetallePage.tsx', 'utf8')
const apiSource = readFileSync('src/modules/solicitudes/api/solicitudesAcademicasService.ts', 'utf8')

test('el historial se consulta desde el contrato indicado y solo se ofrece antes de resolver', () => {
  assert.match(apiSource, /'\/homologaciones\/historial'/)
  assert.match(detailSource, /isCoordinador && isHomologacion && !\['APROBADA', 'RECHAZADA'\]\.includes\(currentEstado\)/)
  assert.match(detailSource, /Ver historial de homologaciones/)
})

test('el detalle estudiantil no ofrece edición de solicitudes', () => {
  assert.doesNotMatch(detailSource, /Editar solicitud/)
  assert.doesNotMatch(detailSource, /updateSolicitudEstudiante/)
})

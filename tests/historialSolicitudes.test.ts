import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const solicitudesApi = readFileSync('src/modules/solicitudes/api/solicitudesAcademicasService.ts', 'utf8')
const evaluacionApi = readFileSync('src/modules/trabajos-grado/evaluacion/api.ts', 'utf8')
const detalle = readFileSync('src/pages/SolicitudDetalle/SolicitudDetallePage.tsx', 'utf8')
const panelEvaluacion = readFileSync('src/modules/trabajos-grado/evaluacion/ProcesoEvaluacionPanel.tsx', 'utf8')

test('todas las solicitudes consultan el historial académico por identificador', () => {
  assert.match(solicitudesApi, /`\/solicitudesAcademicas\/\$\{encodeURIComponent\(solicitudId\)\}\/historial`/)
  assert.match(detalle, /getHistorialSolicitudAcademica\(response\.id\)/)
  assert.match(detalle, /Histórico de cambios/)
  assert.match(detalle, /item\.responsable/)
  assert.match(detalle, /item\.detalle/)
})

test('proyectos de grado deja de usar el historial específico del proceso', () => {
  assert.match(evaluacionApi, /`\/solicitudesAcademicas\/\$\{encodeURIComponent\(solicitudId\)\}\/historial`/)
  assert.doesNotMatch(evaluacionApi, /\$\{BASE\}\/solicitud\/\$\{solicitudId\}\/historial/)
  assert.doesNotMatch(panelEvaluacion, /Estado anterior:/)
  assert.doesNotMatch(panelEvaluacion, /Tiempo en estado anterior:/)
})

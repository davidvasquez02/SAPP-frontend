import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const detailSource = readFileSync('src/pages/SolicitudDetalle/SolicitudDetallePage.tsx', 'utf8')

test('un estudiante solo resuelve el detalle desde sus propias solicitudes', () => {
  assert.match(detailSource, /const debeValidarPropiedadEstudiante = isEstudiante && !isCoordinador/)
  assert.match(detailSource, /getSolicitudesAcademicasByEstudiante\(estudianteId\)/)
  assert.match(detailSource, /solicitudes\.find\(\(item\) => item\.id === parsedId\)/)
  assert.match(detailSource, /No tienes permiso para consultar esta solicitud\./)
})

test('el cambio de sesión vuelve a ejecutar la validación y limpia el detalle anterior', () => {
  assert.match(detailSource, /setSolicitud\(null\)/)
  assert.match(detailSource, /\[debeValidarPropiedadEstudiante, estudianteId, solicitudId\]/)
})

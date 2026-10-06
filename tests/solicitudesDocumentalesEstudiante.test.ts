import assert from 'node:assert/strict'
import test from 'node:test'
import { formatFechaSolicitudDocumental, seleccionarSolicitudesDocumentales } from '../src/pages/EstudianteDetalleCoordinacion/solicitudesDocumentales.ts'
import type { SolicitudAcademicaDto } from '../src/modules/solicitudes/api/types.ts'

const solicitudes = [
  { id: 1, tipoSolicitud: 'Homologación', estado: 'Aprobada', fechaRegistro: '2026-01-01' },
  { id: 2, tipoSolicitud: 'Cancelación', estado: 'En revisión', fechaRegistro: '2026-02-02' },
  { id: 3, tipoSolicitud: 'Homologación', estado: 'En revisión', fechaRegistro: '2026-03-03' },
] as SolicitudAcademicaDto[]

test('encuentra solicitudes por tipo sin tildes o por ID y combina el filtro de estado', () => {
  const select = (busqueda: string, estado = '') => seleccionarSolicitudesDocumentales(solicitudes, { busqueda, estado, pagina: 1, pageSize: 5 }).items.map(item => item.id)
  assert.deepEqual(select(' HOMOLOGACION '), [3, 1])
  assert.deepEqual(select('homologacion', 'En revisión'), [3])
  assert.deepEqual(select('2'), [2])
  assert.deepEqual(select('inexistente'), [])
})

test('pagina las solicitudes más recientes y corrige la página al reducir los resultados', () => {
  const before = [...solicitudes]
  const page = seleccionarSolicitudesDocumentales(solicitudes, { busqueda: '', estado: '', pagina: 2, pageSize: 2 })
  assert.deepEqual(page.items.map(item => item.id), [1])
  assert.equal(page.totalPages, 2)
  const filtered = seleccionarSolicitudesDocumentales(solicitudes, { busqueda: '', estado: 'Aprobada', pagina: 2, pageSize: 2 })
  assert.equal(filtered.page, 1)
  assert.deepEqual(filtered.items.map(item => item.id), [1])
  assert.deepEqual(solicitudes, before)
})

test('las fechas se muestran en Colombia y valores inválidos no rompen la pestaña', () => {
  assert.equal(formatFechaSolicitudDocumental('2026-01-01'), '1 de enero de 2026')
  assert.equal(formatFechaSolicitudDocumental('2026-01-02T02:00:00Z'), '1 de enero de 2026')
  assert.equal(formatFechaSolicitudDocumental(''), '—')
  assert.equal(formatFechaSolicitudDocumental('fecha inválida'), 'fecha inválida')
})

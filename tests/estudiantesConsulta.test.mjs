import assert from 'node:assert/strict'
import test from 'node:test'
import { createServer } from 'vite'

test('listado y detalle toleran nombres nulos, vacíos y con espacios', async (t) => {
  const server = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  t.after(() => server.close())
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => null } })
  t.after(() => {
    if (previousStorage) Object.defineProperty(globalThis, 'localStorage', previousStorage)
    else delete globalThis.localStorage
  })
  const data = [null, '', '   ', '  Persona de prueba  '].map((nombreCompleto, index) => ({
    estudiante: { id: index + 1, idAspirante: null, codigoEstudianteUis: null, cohorte: null, estado: 'ACTIVO', fechaIngreso: null, fechaEgreso: null },
    nombreCompleto, numeroDocumento: null, correoInstitucional: null, correoPersonal: null,
    directorTg: null, persona: { id: index + 1, idpId: null }, programaId: 1, programaCodigoNombre: null,
  }))
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ ok: true, data }), { headers: { 'Content-Type': 'application/json' } }))
  const { getEstudiantesByPrograma, getEstudianteById } = await server.ssrLoadModule('/src/modules/estudiantes/services/estudiantesMockService.ts')
  const estudiantes = await getEstudiantesByPrograma(1)
  assert.equal(estudiantes.length, 4)
  assert.deepEqual(estudiantes.map((item) => item.nombreCompleto), ['Nombre no disponible', 'Nombre no disponible', 'Nombre no disponible', 'Persona de prueba'])
  assert.equal(estudiantes[0].numeroDocumento, 'N/A')
  assert.equal((await getEstudianteById(1)).nombreCompleto, 'Nombre no disponible')
})

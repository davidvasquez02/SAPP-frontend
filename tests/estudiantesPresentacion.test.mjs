import assert from 'node:assert/strict'
import test from 'node:test'
import { createServer } from 'vite'

test('nombres de presentación y selección conservada al recargar', async (t) => {
  const server = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  t.after(() => server.close())
  const { formatNombrePersona, formatEtiquetaEstudiante } = await server.ssrLoadModule('/src/shared/utils/formatNombrePersona.ts')
  assert.equal(formatNombrePersona('  JOSÉ marÍA DE LA PEÑA  '), 'José María De La Peña')
  assert.equal(formatNombrePersona('ANA-MARÍA MUÑOZ'), 'Ana-María Muñoz')
  for (const value of [null, undefined, '', '   ']) assert.equal(formatNombrePersona(value), '')
  assert.equal(formatEtiquetaEstudiante('ABC123 - JOSÉ PÉREZ (MAESTRÍA)'), 'ABC123 - José Pérez (MAESTRÍA)')
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage')
  const storage = new Map()
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  } })
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'sessionStorage', previous)
    else delete globalThis.sessionStorage
  })
  const { leerProgramaEstudiantes, guardarProgramaEstudiantes } = await server.ssrLoadModule('/src/modules/estudiantes/services/estudiantesProgramaSeleccion.ts')
  assert.equal(leerProgramaEstudiantes(), 'doctorado')
  guardarProgramaEstudiantes('maestria')
  assert.equal(leerProgramaEstudiantes(), 'maestria')
  guardarProgramaEstudiantes('doctorado')
  assert.equal(leerProgramaEstudiantes(), 'doctorado')
  storage.set('sapp.estudiantes.programType', 'valor inválido')
  assert.equal(leerProgramaEstudiantes(), 'doctorado')
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, get() { throw new Error('Storage bloqueado') } })
  assert.equal(leerProgramaEstudiantes(), 'doctorado')
  assert.doesNotThrow(() => guardarProgramaEstudiantes('maestria'))
})

import assert from 'node:assert/strict'
import test from 'node:test'
import { createServer } from 'vite'

test('admisión y matrícula conservan el mismo detalle de faltantes desde HTTP', async (t) => {
  const server = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  t.after(() => server.close())
  t.mock.method(globalThis, 'fetch', async (input) => {
    const esAdmision = String(input).includes('reportesAdmision')
    const personas = esAdmision
      ? { aspirantesConDocumentosFaltantes: [{ inscripcionId: 12, documento: 'TEST-12', nombreCompleto: 'Persona de prueba', documentosFaltantes: ['Documento de identidad', 'Recibo de pago'] }] }
      : { estudiantesConDocumentosFaltantes: [{ matriculaId: 12, documento: 'TEST-12', nombreCompleto: 'Persona de prueba', documentosFaltantes: ['Documento de identidad', 'Recibo de pago'] }] }
    return new Response(JSON.stringify({
      message: 'Existen documentos faltantes',
      data: { faltantes: { categoriasInstitucionalesFaltantes: ['Acta del comité'], ...personas } },
    }), { status: 409, headers: { 'Content-Type': 'application/json' } })
  })
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => null } })
  t.after(() => {
    if (previousStorage) Object.defineProperty(globalThis, 'localStorage', previousStorage)
    else delete globalThis.localStorage
  })
  const { generarReporteAdmision } = await server.ssrLoadModule('/src/modules/reportes/services/reporteAdmisionService.ts')
  const { generarReportePeriodo } = await server.ssrLoadModule('/src/modules/reportes/services/reportePeriodoService.ts')
  const { getFaltantesReporte } = await server.ssrLoadModule('/src/modules/reportes/services/reporteError.ts')
  const results = []
  for (const request of [
    () => generarReporteAdmision({ actaId: 1, convocatoriaId: 2 }),
    () => generarReportePeriodo('MATRICULA', { actaId: 1, periodoId: 2, programaId: 3 }),
  ]) {
    await assert.rejects(request, (error) => {
      const detail = getFaltantesReporte(error)
      assert.equal(error.message, 'Existen documentos faltantes')
      assert.deepEqual(detail?.categoriasInstitucionalesFaltantes, ['Acta del comité'])
      assert.deepEqual(detail?.personasConDocumentosFaltantes[0].documentosFaltantes, ['Documento de identidad', 'Recibo de pago'])
      results.push(detail)
      return true
    })
  }
  assert.deepEqual(results[0], results[1])
  const urls = globalThis.fetch.mock.calls.map(({ arguments: args }) => args[0])
  assert.match(urls[0], /reportesAdmision\/generar\?/)
  assert.match(urls[1], /reportesMatricula\/generar\?/)
})

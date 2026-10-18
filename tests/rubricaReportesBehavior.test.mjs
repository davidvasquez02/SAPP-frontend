import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement as h } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('rúbricas e informes: archivos, parámetros y recuperación de errores', async t => {
  const ui = await reactApiHarness(t)
  const { default: Rubric } = await ui.load('/src/pages/RubricaEvaluacion/RubricaEvaluacionPage.tsx')
  const { default: Reports } = await ui.load('/src/pages/Reportes/ReportesPage.tsx')
  const { AuthContext } = await ui.load('/src/context/Auth/context.ts')
  let rubric, writes, failure
  t.beforeEach(() => {
    rubric = null; writes = []; failure = false
    ui.response((url, init) => {
      const u = new URL(url, 'https://test.invalid'); const path = u.pathname
      if (failure) return Response.json({ message: 'Servicio no disponible' }, { status: 503 })
      if (init.method === 'POST') { writes.push({ path, query: u.searchParams }); return new Response('%PDF-sintetico', { headers: { 'content-type': 'application/pdf', 'content-disposition': 'attachment; filename="informe-prueba.pdf"' } }) }
      if (path.endsWith('/rubrica-evaluacion')) { if (init.method === 'PUT') { const body = JSON.parse(init.body); writes.push(body); rubric = { id: 1, fechaCarga: '2030-01-01', ...body } } return Response.json({ ok: true, data: rubric }) }
      if (path.endsWith('/programaAcademico')) return Response.json({ ok: true, data: [{ id: 1, codigoUis: 'MISI', nombre: 'Maestría' }, { id: 2, codigoUis: 'DCC', nombre: 'Doctorado' }] })
      if (path.endsWith('/periodoAcademico')) return Response.json({ ok: true, data: [{ id: 7, anio: 2030, periodo: 1, anioPeriodo: '2030 - 1' }] })
      if (path.endsWith('/convocatoriaAdmision')) return Response.json({ ok: true, data: [{ id: 107, programaId: 1, periodo: '2030-1', vigente: true }] })
      if (path.endsWith('/actas')) return Response.json({ ok: true, data: [{ id: 8, codigo: 'ACTA-8', nombre: 'Acta sintética', fechaCreacion: '2030-01-01' }] })
      throw new Error(`Petición inesperada: ${url}`)
    })
  })
  const mount = (s, component = Rubric, session = true) => { s.after(ui.cleanup); const user = { id: 10, username: 'sintetico', roles: ['SECRETARIA_POSGRADOS'] }; return ui.render(h(MemoryRouter, null, h(AuthContext.Provider, { value: { user, session: session ? { kind: 'SAPP', user } : null } }, h(component)))) }
  const upload = (v, type = 'application/pdf', size) => { const bytes = new TextEncoder().encode('%PDF-prueba'); const f = new ui.dom.window.File([bytes], 'rubrica.pdf', { type }); f.arrayBuffer = async () => bytes.buffer; if (size) Object.defineProperty(f, 'size', { value: size }); ui.fireEvent.change(v.container.querySelector('input[type=file]'), { target: { files: [f] } }) }
  const change = (v, name, value) => ui.fireEvent.change(v.getByLabelText(name), { target: { value } })
  const submit = v => ui.fireEvent.submit(v.container.querySelector('form'))
  await t.test('rúbrica vacía no muestra acciones de descarga', async s => { const v = mount(s); await v.findByText('Aún no se ha cargado ninguna rúbrica de evaluación.'); assert.equal(v.queryAllByRole('button', { name: 'Ver', exact: true }).length, 0) })
  await t.test('rúbrica valida PDF, límite y usuario antes de cargar', async s => {
    const v = mount(s, Rubric, false); await v.findByText('Aún no se ha cargado ninguna rúbrica de evaluación.'); upload(v, 'image/png'); assert.ok(v.getByText('La rúbrica de evaluación debe estar en formato PDF.'))
    upload(v, 'application/pdf', 16 * 1024 * 1024); assert.ok(v.getByText('El archivo no puede superar 15 MB.')); upload(v); assert.ok(v.getByText(/No fue posible identificar al usuario actual/)); assert.equal(writes.length, 0)
  })
  await t.test('cargar PDF envía checksum, contenido y usuario', async s => {
    const v = mount(s); await v.findByText('Aún no se ha cargado ninguna rúbrica de evaluación.'); upload(v); await v.findByText('La rúbrica de evaluación fue actualizada correctamente.')
    assert.equal(writes[0].usuarioCargaId, 10); assert.match(writes[0].checksum, /^[a-f0-9]{64}$/); assert.equal(writes[0].contenidoBase64, Buffer.from('%PDF-prueba').toString('base64'))
  })
  await t.test('fallo de carga mantiene archivo previo y permite reintentar', async s => {
    rubric = { nombreArchivo: 'previa.pdf', contenidoBase64: 'YWJj', mimeType: 'application/pdf', tamanoBytes: 1024, fechaCarga: '2030-01-01' }
    const v = mount(s); await v.findByText(/previa.pdf/); failure = true; upload(v); await v.findByText(/Servicio no disponible/); assert.ok(v.getByText(/previa.pdf/))
    failure = false; upload(v); await v.findByText('La rúbrica de evaluación fue actualizada correctamente.')
  })
  await t.test('informe exige parámetros y filtra convocatoria por programa', async s => {
    const v = mount(s, Reports); await v.findByLabelText('Programa académico'); submit(v); assert.ok(v.getByText('Complete todos los parámetros requeridos para generar el informe.'))
    change(v, 'Programa académico', '2'); assert.equal(v.getByLabelText('Convocatoria').options.length, 1); change(v, 'Programa académico', '1'); assert.equal(v.getByLabelText('Convocatoria').options.length, 2); assert.equal(writes.length, 0)
  })
  await t.test('informe de admisión usa convocatoria y acta y presenta PDF recibido', async s => {
    const v = mount(s, Reports); await v.findByLabelText('Programa académico'); change(v, 'Programa académico', '1'); change(v, 'Convocatoria', '107'); change(v, 'Acta asociada', '8'); submit(v)
    await v.findByText('El informe de admisión fue generado correctamente.'); assert.ok(v.getByText('informe-prueba.pdf')); assert.equal(writes[0].query.get('actaId'), '8'); assert.equal(writes[0].query.get('convocatoriaId'), '107')
    ui.fireEvent.click(v.getByRole('button', { name: 'Matrícula', exact: true })); assert.equal(v.queryAllByText('informe-prueba.pdf').length, 0)
  })
  for (const [label, endpoint] of [['Matrícula', 'reportesMatricula'], ['Créditos condonables', 'reportesCreditosCondonables']]) await t.test(`informe de ${label} envía programa y periodo`, async s => {
    const v = mount(s, Reports); await v.findByLabelText('Programa académico'); ui.fireEvent.click(v.getByRole('button', { name: label, exact: true })); change(v, 'Programa académico', '1'); change(v, 'Acta asociada', '8'); submit(v)
    await v.findByText('informe-prueba.pdf'); assert.ok(writes[0].path.includes(endpoint)); assert.equal(writes[0].query.get('periodoId'), '7'); assert.equal(writes[0].query.get('programaId'), '1')
  })
  await t.test('fallo de generación no presenta PDF y permite reintento', async s => {
    const v = mount(s, Reports); await v.findByLabelText('Programa académico'); change(v, 'Programa académico', '1'); change(v, 'Convocatoria', '107'); change(v, 'Acta asociada', '8'); failure = true; submit(v); await v.findByText(/Servicio no disponible/)
    assert.equal(v.queryAllByText('informe-prueba.pdf').length, 0); failure = false; submit(v); await v.findByText('informe-prueba.pdf')
  })
})

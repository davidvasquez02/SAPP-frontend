import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement as h } from 'react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('expediente estudiantil: orden documental, descargas y solicitudes paginadas', async t => {
  const ui = await reactApiHarness(t)
  const { default: Detail } = await ui.load('/src/pages/EstudianteDetalleCoordinacion/EstudianteDetalleCoordinacionPage.tsx')
  const { default: Requests } = await ui.load('/src/pages/EstudianteDetalleCoordinacion/SolicitudesDocumentosEstudiante.tsx')
  const { AuthContext } = await ui.load('/src/context/Auth/context.ts')
  let groups, requests, fail, downloads, opened, blobs
  t.mock.method(URL, 'createObjectURL', blob => { blobs.push(blob); return `blob:synthetic-${blobs.length}` }); t.mock.method(URL, 'revokeObjectURL', () => {})
  ui.dom.window.HTMLAnchorElement.prototype.click = function () { downloads.push(this.download) }
  ui.dom.window.open = url => { opened.push(url); return null }
  const timeout = ui.dom.window.setTimeout.bind(ui.dom.window); ui.dom.window.setTimeout = (fn, delay, ...args) => timeout(fn, delay === 60000 ? 0 : delay, ...args)
  const doc = (id, type, state) => ({ id, tipoDocumentoTramiteId: type, tipoDocumento: `Requisito ${id}`, estado: state, nombreArchivo: id ? `archivo-${id}.pdf` : null, fechaCarga: 'fecha no válida', secuencia: id })
  t.beforeEach(() => {
    groups = ['2030-1', '2029-2', 'histórico', null].map((periodo, i) => ({ tipoTramite: 'MATRICULA', periodo, tramiteId: 60 + i, documentos: [doc(80 + i, 4, ['APROBADO','RECHAZADO','EN_REVISION',null][i]), doc(90 + i, 2, 'PENDIENTE')] }))
    requests = Array.from({ length: 7 }, (_, i) => ({ id: 600 + i, estudianteId: 7, tipoSolicitud: `Solicitud ${i + 1}`, estado: 'APROBADA', fechaRegistro: '2030-01-01', tipoTramiteCodigo: '4' })); fail = ''; downloads = []; opened = []; blobs = []
    ui.response((url, init) => {
      const path = new URL(url, 'https://test.invalid').pathname
      if (fail && path.includes(fail)) return Response.json({ message: 'Consulta fallida' }, { status: 503 })
      if (path.endsWith('/consulta')) return Response.json({ ok: true, data: [{ estudiante: { id: 7, idAspirante: null, codigoEstudianteUis: '20207', cohorte: '2030-1', estado: 'ACTIVO', foto: { contenidoBase64: 'YWJj', mimeType: 'image/png' } }, nombreCompleto: 'Persona prueba', persona: { id: 70 }, programaId: 1, programaCodigoNombre: 'MISI' }] })
      if (path.endsWith('/by-estudiante-id/7')) return Response.json({ ok: true, data: groups })
      if (path.endsWith('/solicitudesAcademicas/estudiante')) return Response.json({ ok: true, data: requests })
      if (path.endsWith('/document')) return Response.json({ ok: true, data: [] })
      if (path.endsWith('/zip')) return new Response('ZIP', { headers: { 'content-type': 'application/zip', 'content-disposition': 'attachment; filename="expediente.zip"' } })
      if (path.includes('/document/')) return Response.json({ ok: true, data: { contenidoBase64: 'YWJj', mimeType: 'application/pdf', nombreArchivo: 'documento.pdf' } })
      if (init.method === 'POST') return Response.json({ ok: true, data: { id: 80 } })
      throw new Error(`Petición inesperada: ${url}`)
    })
  })
  const mount = (s, component = Detail, userId = 10) => { s.after(ui.cleanup); const user = { id: userId, roles: ['SECRETARIA_POSGRADOS'] }; return ui.render(h(MemoryRouter, { initialEntries: ['/estudiantes/7'] }, h(AuthContext.Provider, { value: { user, session: { kind: 'SAPP', user } } }, h(Routes, null, h(Route, { path: '/estudiantes/:estudianteId', element: h(component, { estudianteId: 7, active: true }) }))))) }
  await t.test('agrupa y ordena periodos y requisitos sin mezclar estados', async s => {
    const v = mount(s); await v.findByText('Requisito 80'); const headings = v.getAllByRole('heading', { level: 3 }).map(e => e.textContent)
    assert.ok(headings.indexOf('Periodo 2029-2') < headings.indexOf('Periodo 2030-1')); assert.ok(v.getByAltText('Foto de Persona Prueba')); assert.ok(v.getAllByText('fecha no válida').length > 1)
    const firstGroup = v.getByRole('heading', { name: 'Periodo 2029-2' }).closest('section'); assert.deepEqual([...firstGroup.querySelectorAll('h4')].map(e => e.textContent), ['Requisito 91', 'Requisito 81'])
  })
  await t.test('abrir y descargar documento preservan archivo y ZIP devuelto', async s => {
    const v = mount(s); await v.findByText('Requisito 80'); ui.fireEvent.click(v.getAllByRole('button', { name: 'Ver', exact: true })[0]); await ui.waitFor(() => assert.equal(opened.length, 1))
    ui.fireEvent.click(v.getAllByRole('button', { name: 'Descargar', exact: true })[0]); await ui.waitFor(() => assert.equal(downloads.length, 1)); assert.equal(downloads[0], 'documento.pdf')
    ui.fireEvent.click(v.getByRole('button', { name: /Descargar información/ })); await ui.waitFor(() => assert.ok(downloads.includes('expediente.zip'))); assert.equal(blobs[0].type, 'application/pdf')
  })
  await t.test('fallo de documentos muestra error y admisión sin requisitos tiene mensaje', async s => {
    fail = '/by-estudiante-id/'; let v = mount(s); await v.findByText(/Consulta fallida/); await ui.cleanup(); fail = ''; groups = []; v = mount(s); await v.findByText('No hay documentos de matrícula registrados para este estudiante.'); ui.fireEvent.click(v.getByRole('tab', { name: 'Admisión' })); await v.findByText('No hay documentos de admisión registrados para este estudiante.')
  })
  await t.test('carga histórica sin usuario se rechaza antes de enviar', async s => {
    const v = mount(s, Detail, null); await v.findByText('Requisito 80'); const f = new ui.dom.window.File(['x'], 'archivo.pdf', { type: 'application/pdf' }); ui.fireEvent.change(v.container.querySelector('input[type=file]'), { target: { files: [f] } }); await v.findByText('No se encontró el usuario Minerva que realiza la carga.')
  })
  await t.test('solicitudes filtran propietario, paginan y buscan por id', async s => {
    requests.push({ ...requests[0], id: 900, estudianteId: 8 }); const v = mount(s, Requests); await v.findByText('Solicitud 7 · #606'); assert.equal(v.queryAllByText(/#900/).length, 0)
    ui.fireEvent.click(v.getByRole('button', { name: 'Siguiente' })); await v.findByText('Solicitud 1 · #600'); ui.fireEvent.click(v.getByRole('button', { name: 'Anterior' }));
    ui.fireEvent.change(v.getByLabelText(/Buscar/), { target: { value: '600' } }); await v.findByText('Solicitud 1 · #600'); assert.equal(v.queryAllByText('Solicitud 7 · #606').length, 0)
  })
  await t.test('fallo de listado y adjuntos admiten reintentar sin duplicar tarjetas', async s => {
    fail = '/solicitudesAcademicas/estudiante'; const v = mount(s, Requests); await v.findByText(/Consulta fallida/); fail = '/document'; ui.fireEvent.click(v.getByRole('button', { name: 'Reintentar' })); await v.findAllByText(/Consulta fallida/)
    const failures = v.getAllByText(/Consulta fallida/).length; fail = ''; ui.fireEvent.click(v.getAllByRole('button', { name: /Reintentar/ })[0]); await ui.waitFor(() => assert.equal(v.queryAllByText(/Consulta fallida/).length, failures - 1)); assert.equal(v.container.querySelectorAll('article').length, 5)
  })
})

import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement as h } from 'react'
import { MemoryRouter, Outlet, Routes, Route } from 'react-router-dom'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('documentos de inscripción: revisión e inicio de evaluación', async t => {
  const ui = await reactApiHarness(t)
  const { default: Page } = await ui.load('/src/pages/InscripcionDocumentos/InscripcionDocumentosPage.tsx')
  const { AuthContext } = await ui.load('/src/context/Auth/context.ts')
  const cache = await ui.load('/src/pages/InscripcionDocumentos/documentosPrefetchCache.ts')
  let docs, refs, uploads, writes, starts, polls, alerts, failure, started, callback, content, preview
  const documentRow = (estado = 'POR_REVISAR', uploaded = true) => ({
    idTipoDocumentoTramite: 1, codigoTipoDocumentoTramite: 'CEDULA', nombreTipoDocumentoTramite: 'Identidad de prueba',
    obligatorioTipoDocumentoTramite: true, documentoCargado: uploaded,
    documentoUploadedResponse: uploaded ? { idDocumento: 80, estadoDocumento: estado, nombreArchivoDocumento: 'identidad.pdf', versionDocumento: 1 } : null,
  })
  const timeout = ui.dom.window.setTimeout.bind(ui.dom.window)
  t.beforeEach(() => {
    cache.invalidateInscripcionDocumentosCache(160)
    docs = [documentRow()]; refs = []; uploads = []; writes = []; starts = 0; polls = 0; alerts = []; failure = false; started = true; callback = 0; content = ''
    preview = { opener: {}, closed: false, location: {}, close() { this.closed = true } }
    ui.dom.window.alert = value => alerts.push(value)
    ui.dom.window.open = () => preview
    ui.dom.window.setTimeout = (fn, delay, ...args) => timeout(fn, delay === 500 ? 0 : delay, ...args)
    ui.response((url, init) => {
      const path = new URL(url, 'https://test.invalid').pathname
      if (path.endsWith('/document') && init.method === 'PUT') {
        const body = JSON.parse(init.body); writes.push(body)
        if (failure) return Response.json({ message: 'Revisión no disponible' }, { status: 409 })
        docs = [documentRow(body.aprobado ? 'APROBADO' : 'RECHAZADO')]
        return Response.json({ ok: true, data: null })
      }
      // Las referencias académicas (trámite de coordinación 1001) se consultan aparte de los documentos del aspirante.
      if (path.endsWith('/document') && init.method === 'POST') { uploads.push(JSON.parse(init.body)); return Response.json({ ok: true, data: { id: 900 + uploads.length } }) }
      if (path.endsWith('/document') && new URL(url, 'https://test.invalid').searchParams.get('codigoTipoTramite') === '1001') return Response.json({ ok: true, data: refs })
      if (path.endsWith('/document')) return failure ? Response.json({ message: 'Consulta no disponible' }, { status: 503 }) : Response.json({ ok: true, data: docs })
      if (path.endsWith('/80')) return Response.json({ ok: true, data: { id: 80, contenidoBase64: content, mimeType: 'application/pdf', nombreArchivo: 'identidad.pdf' } })
      if (path.includes('/iniciarEvaluacion/')) { starts++; return failure ? Response.json({ ok: false, message: 'Inicio no disponible' }) : Response.json({ ok: true }) }
      if (path.endsWith('/evaluacionAdmision/info')) { polls++; return Response.json({ ok: started, data: null }) }
      throw new Error(`Petición inesperada: ${url}`)
    })
  })
  const mount = (s, { final = false, id = '160', roles = ['SECRETARIA_POSGRADOS'] } = {}) => {
    s.after(ui.cleanup)
    const user = { username: 'sintetico', roles }
    return ui.render(h(MemoryRouter, { initialEntries: [`/admisiones/convocatoria/107/inscripcion/${id}/documentos`] },
      h(AuthContext.Provider, { value: { session: { kind: 'SAPP', user }, user } },
        h(Routes, null, h(Route, { path: '/admisiones/convocatoria/:convocatoriaId/inscripcion/:inscripcionId', element: h(Outlet, { context: { isEstadoFinal: final, onEvaluacionStarted: async () => { callback++ } } }) },
          h(Route, { path: 'documentos', element: h(Page) }), h(Route, { path: 'hoja-vida', element: h('p', null, 'Evaluación disponible') }))))))
  }
  const ready = view => view.findByText('Identidad de prueba')
  const click = (v, name) => ui.fireEvent.click(v.getByRole('button', { name, exact: true }))

  await t.test('identificador inválido impide consultar documentos', async s => {
    const before = ui.requests.length
    const v = mount(s, { id: 'invalido' })
    await v.findByText('El identificador de inscripción no es válido.')
    assert.equal(ui.requests.length, before)
  })
  await t.test('lista vacía y error de consulta se muestran sin acciones', async s => {
    docs = []; let v = mount(s)
    await v.findByText('No hay documentos registrados.')
    await ui.cleanup(); cache.invalidateInscripcionDocumentosCache(160); failure = true
    v = mount(s); await v.findByText(/Consulta no disponible/)
    assert.equal(writes.length, 0)
  })
  const referenciaRow = (id, nombre) => ({
    idTipoDocumentoTramite: 10, codigoTipoDocumentoTramite: 'ANX-9', nombreTipoDocumentoTramite: 'Referencia académica', descripcionTipoDocumentoTramite: 'Referencia',
    obligatorioTipoDocumentoTramite: false, documentoCargado: true, tipoTramite: 'ADMISION_COORDINACION',
    documentoUploadedResponse: { idDocumento: id, nombreArchivoDocumento: nombre, versionDocumento: 1, fechaCargaDocumento: '2026-11-20T10:00:00' },
  })
  const pdf = nombre => new File(['%PDF-'], nombre, { type: 'application/pdf' })
  await t.test('referencias académicas: lista las cargadas y el coordinador sube varias de una vez', async s => {
    refs = [referenciaRow(901, 'ref1.pdf'), referenciaRow(902, 'ref2.pdf')]
    const v = mount(s); await ready(v)
    await v.findByText('ref1.pdf'); assert.ok(v.getByText('ref2.pdf'))
    ui.fireEvent.change(v.getByLabelText('Seleccionar archivos'), { target: { files: [pdf('a.pdf'), pdf('b.pdf')] } })
    click(v, 'Cargar referencias')
    await ui.waitFor(() => assert.equal(uploads.length, 2))
    // Cada archivo es un documento aparte del mismo tipo, cargado por el coordinador (no por un aspirante).
    assert.deepEqual(uploads.map(u => [u.tipoDocumentoTramiteId, u.tramiteId, u.aspiranteCargaId]), [[10, 160, null], [10, 160, null]])
    assert.deepEqual(uploads.map(u => u.nombreArchivo), ['a.pdf', 'b.pdf'])
  })
  await t.test('referencias académicas: con la inscripción cerrada o sin permiso solo se consultan', async s => {
    refs = [referenciaRow(901, 'ref1.pdf')]
    let v = mount(s, { final: true }); await v.findByText('ref1.pdf')
    assert.equal(v.queryByLabelText('Seleccionar archivos'), null)
    await ui.cleanup()
    v = mount(s, { roles: ['ESTUDIANTE'] }); await v.findByText('ref1.pdf')
    assert.equal(v.queryByLabelText('Seleccionar archivos'), null)
  })
  await t.test('obligatorios ausentes bloquean validación y avance', async s => {
    docs = [documentRow('POR_REVISAR', false)]
    const v = mount(s); await ready(v)
    for (const name of ['Aprobar', 'Rechazar', 'Ver', 'Descargar', 'Continuar evaluación']) assert.equal(v.getByRole('button', { name, exact: true }).disabled, true)
    assert.ok(v.getByText('Obligatorios aprobados: 0/1'))
  })
  await t.test('aprobar envía id y recarga estado sin repetir la decisión', async s => {
    const v = mount(s); await ready(v); click(v, 'Aprobar')
    await v.findByText('Documento aprobado correctamente.')
    assert.deepEqual(writes, [{ documentoId: 80, aprobado: true, observaciones: null }])
    assert.equal(v.getByRole('button', { name: 'Aprobar' }).disabled, false)
    assert.ok(v.getByText('Obligatorios aprobados: 1/1'))
    assert.equal(v.getByRole('button', { name: 'Continuar evaluación' }).disabled, false)
  })
  await t.test('una decisión tomada se puede cambiar: aprobar y luego rechazar, y volver a aprobar', async s => {
    const v = mount(s); await ready(v); click(v, 'Aprobar')
    await v.findByText('Documento aprobado correctamente.')
    assert.equal(v.getByRole('button', { name: 'Rechazar' }).disabled, false)
    click(v, 'Rechazar'); ui.fireEvent.change(v.getByLabelText('Motivo del rechazo'), { target: { value: 'Me equivoqué' } }); click(v, 'Confirmar rechazo')
    await v.findByText('Documento rechazado correctamente.')
    assert.ok(v.getByText('Obligatorios aprobados: 0/1'))
    assert.equal(v.getByRole('button', { name: 'Aprobar' }).disabled, false)
    click(v, 'Aprobar'); await v.findByText('Documento aprobado correctamente.')
    assert.deepEqual(writes.map(w => w.aprobado), [true, false, true])
    assert.ok(v.getByText('Obligatorios aprobados: 1/1'))
  })
  await t.test('rechazo exige motivo, permite cancelar y envía texto recortado', async s => {
    const v = mount(s); await ready(v); click(v, 'Rechazar'); click(v, 'Confirmar rechazo')
    assert.ok(v.getByText('Debe ingresar el motivo del rechazo.')); assert.equal(writes.length, 0)
    click(v, 'Cancelar'); assert.equal(v.queryAllByRole('textbox').length, 0)
    click(v, 'Rechazar'); ui.fireEvent.change(v.getByLabelText('Motivo del rechazo'), { target: { value: '  Archivo ilegible  ' } }); click(v, 'Confirmar rechazo')
    await v.findByText('Documento rechazado correctamente.')
    assert.deepEqual(writes, [{ documentoId: 80, aprobado: false, observaciones: 'Archivo ilegible' }])
  })
  await t.test('conflicto de revisión permite reintentar sin perder motivo', async s => {
    const v = mount(s); await ready(v); click(v, 'Rechazar')
    ui.fireEvent.change(v.getByLabelText('Motivo del rechazo'), { target: { value: 'Falta firma' } }); failure = true; click(v, 'Confirmar rechazo')
    await v.findByText(/Revisión no disponible/)
    assert.equal(v.getByLabelText('Motivo del rechazo').value, 'Falta firma')
    failure = false; click(v, 'Confirmar rechazo'); await v.findByText('Documento rechazado correctamente.')
    assert.equal(writes.length, 2)
  })
  await t.test('estado final bloquea revisión e inicio aunque todo esté aprobado', async s => {
    docs = [documentRow('APROBADO')]; const v = mount(s, { final: true }); await ready(v)
    for (const name of ['Aprobar', 'Rechazar', 'Continuar evaluación']) assert.equal(v.getByRole('button', { name, exact: true }).disabled, true)
    assert.equal(starts, 0)
  })
  await t.test('perfil estudiante no muestra acciones de archivo', async s => {
    const v = mount(s, { roles: ['ESTUDIANTE_POSGRADOS'] }); await ready(v)
    assert.equal(v.queryAllByRole('button', { name: /^(Ver|Descargar)$/ }).length, 0)
  })
  await t.test('archivo sin contenido cierra vista previa y permite reintentar descarga', async s => {
    const v = mount(s); await ready(v); click(v, 'Ver')
    await ui.waitFor(() => assert.equal(alerts.length, 1)); assert.equal(preview.closed, true); assert.equal(preview.opener, null)
    click(v, 'Descargar'); await ui.waitFor(() => assert.equal(alerts.length, 2))
    assert.match(alerts[0], /No hay contenido para visualizar/); assert.match(alerts[1], /No hay contenido para descargar/)
    await ui.waitFor(() => assert.equal(v.getByRole('button', { name: 'Descargar' }).disabled, false))
  })
  await t.test('evaluación confirmada actualiza contexto y navega a hoja de vida', async s => {
    docs = [documentRow('APROBADO')]; const v = mount(s); await ready(v); click(v, 'Continuar evaluación')
    await v.findByText('Evaluación disponible'); assert.equal(starts, 1); assert.equal(polls, 1); assert.equal(callback, 1)
  })
  await t.test('componentes aún no disponibles agotan cinco consultas sin navegar', async s => {
    started = false; docs = [documentRow('APROBADO')]; const v = mount(s); await ready(v); click(v, 'Continuar evaluación')
    await ui.waitFor(() => assert.equal(alerts.length, 1))
    assert.equal(polls, 5); assert.equal(callback, 0); assert.match(alerts[0], /componentes aún no están disponibles/)
    await ui.waitFor(() => assert.equal(v.getByRole('button', { name: 'Continuar evaluación' }).disabled, false))
  })
  await t.test('fallo al iniciar no consulta componentes y permite reintentar', async s => {
    docs = [documentRow('APROBADO')]; const v = mount(s); await ready(v); failure = true; click(v, 'Continuar evaluación')
    await ui.waitFor(() => assert.equal(alerts.length, 1)); assert.equal(polls, 0)
    failure = false; click(v, 'Continuar evaluación'); await v.findByText('Evaluación disponible'); assert.equal(starts, 2)
  })
})

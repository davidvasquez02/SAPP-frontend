import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement as h } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('radicación estudiantil: identidad, inferencia de trámite y carga parcial', async t => {
  const ui = await reactApiHarness(t)
  const { default: Page } = await ui.load('/src/modules/solicitudes/components/SolicitudesEstudianteView/SolicitudesEstudianteView.tsx')
  const { AuthContext } = await ui.load('/src/context/Auth/context.ts')
  let rows, writes, docs, fail, omitId, omitRefresh
  t.beforeEach(() => {
    rows = []; writes = []; docs = []; fail = ''; omitId = false; omitRefresh = false
    ui.response((url, init) => {
      const path = new URL(url, 'https://test.invalid').pathname
      if (fail && path.includes(fail)) return Response.json({ message: 'Registro no disponible' }, { status: 503 })
      if (path.endsWith('/tipoSolicitud')) return Response.json({ ok: true, data: [{ id: 99, nombre: 'Solicitud general', tipoTramiteId: 100 }] })
      if (path.endsWith('/estadosSolicitud')) return Response.json({ ok: true, data: [{ id: 1, sigla: 'REGISTRADA', nombre: 'Registrada' }] })
      if (path.endsWith('/tramite/document')) return Response.json({ ok: true, data: docs })
      if (path.endsWith('/estudiante')) return Response.json({ ok: true, data: rows })
      if (path.endsWith('/solicitudesAcademicas') && init.method === 'POST') { writes.push({ path, body: JSON.parse(init.body) }); if (!omitRefresh) rows = [{ id: 60, estudianteId: 7, tipoSolicitudId: 99, tipoSolicitud: 'Solicitud creada', observaciones: 'Registro sintético', fechaRegistro: '2030-01-01', estado: 'REGISTRADA' }]; return Response.json({ ok: true, data: omitId ? null : { id: 60 } }) }
      if (path.endsWith('/document') && init.method === 'POST') { writes.push({ path, body: JSON.parse(init.body) }); return Response.json({ ok: true, data: { id: 80 } }) }
      throw new Error(`Petición inesperada: ${url}`)
    })
  })
  const mount = s => { s.after(ui.cleanup); const user = { id: 10, persona: {}, estudiante: { id: 7 } }; return ui.render(h(MemoryRouter, null, h(AuthContext.Provider, { value: { user, session: { kind: 'SAPP', user } } }, h(Page)))) }
  const form = async v => { await v.findByText('No hay resultados con los filtros seleccionados.'); ui.fireEvent.click(v.getByRole('button', { name: 'Agregar solicitud' })); await v.findByLabelText(/Tipo de trámite/); ui.fireEvent.change(v.getByLabelText(/Tipo de trámite/), { target: { value: '99' } }); await ui.waitFor(() => assert.equal(v.queryAllByText('Cargando documentos requeridos...').length, 0)) }
  const submit = v => ui.fireEvent.submit(v.container.querySelector('form'))
  const file = v => { const bytes = new TextEncoder().encode('%PDF-radicación'); const f = new ui.dom.window.File([bytes], 'soporte.pdf', { type: 'application/pdf' }); f.arrayBuffer = async () => bytes.buffer; ui.fireEvent.change(v.container.querySelector('input[type=file]'), { target: { files: [f] } }) }
  await t.test('radicar sin archivos usa estudiante y muestra listado actualizado', async s => {
    const v = mount(s); await form(v); submit(v); await v.findByText('Registro sintético'); assert.equal(writes.length, 1); assert.equal(writes[0].body.estudianteId, 7); assert.equal(writes[0].body.tipoSolicitudId, 99)
  })
  await t.test('respuesta sin id infiere trámite nuevo antes de cargar PDF', async s => {
    omitId = true; docs = [{ id: 5, nombre: 'Soporte', obligatorio: true }]; const v = mount(s); await form(v); file(v); submit(v); await v.findByText('Registro sintético')
    assert.equal(writes.length, 2); assert.equal(writes[1].body.tramiteId, 60); assert.equal(writes[1].body.usuarioCargaId, 10); assert.match(writes[1].body.checksum, /^[a-f0-9]{64}$/)
  })
  await t.test('sin id ni nuevo trámite no intenta cargar documentos', async s => {
    omitId = true; omitRefresh = true; const v = mount(s); await form(v); submit(v); await v.findByText('Se creó la solicitud pero no fue posible determinar el trámite para cargar documentos.'); assert.equal(writes.length, 1)
  })
  await t.test('fallo de carga informa creación parcial y conserva formulario', async s => {
    docs = [{ id: 5, nombre: 'Soporte', obligatorio: true }]; const v = mount(s); await form(v); file(v); fail = '/sapp/document'; submit(v); await v.findByText(/La solicitud se creó, pero falló la carga de algunos documentos/); assert.equal(writes.length, 1)
  })
  await t.test('fallo de registro no carga documentos y permite volver a seleccionar el tipo', async s => {
    const v = mount(s); await form(v); fail = '/solicitudesAcademicas'; submit(v); await v.findAllByText(/Registro no disponible/); assert.equal(writes.length, 0); fail = ''; ui.fireEvent.change(v.getByLabelText(/Tipo de trámite/), { target: { value: '99' } }); await ui.waitFor(() => assert.equal(v.queryAllByText('Cargando documentos requeridos...').length, 0)); submit(v); await v.findByText('Registro sintético')
  })
})

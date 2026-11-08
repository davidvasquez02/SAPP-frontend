import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement as h } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('actas: consulta, filtros, carga PDF y eliminación confirmada', async t => {
  const ui = await reactApiHarness(t)
  const { default: Page } = await ui.load('/src/pages/Actas/ActasPage.tsx')
  const { AuthContext } = await ui.load('/src/context/Auth/context.ts')
  let rows, failure, writes, content
  t.beforeEach(() => {
    rows = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, codigo: `ACTA_COMITE_${i + 1}-2030`, nombre: `Acta prueba ${i + 1}`, fechaCreacion: '2030-01-01', tipoConsejo: i % 2 === 0, tamanoBytes: 2048, observaciones: '' }))
    writes = []; failure = ''; content = ''
    ui.response((url, init) => {
      const path = new URL(url, 'https://test.invalid').pathname
      if (init.method === 'POST' || init.method === 'DELETE') {
        writes.push({ path, method: init.method, body: init.body ? JSON.parse(init.body) : null })
        if (failure) return Response.json({ message: 'Acta no disponible' }, { status: 409 })
        return init.method === 'DELETE' ? new Response(null, { status: 204 }) : Response.json({ ok: true, data: { id: 99 } })
      }
      if (failure === 'list') return Response.json({ ok: false, message: 'Lista no disponible' })
      if (path.endsWith('/actas')) return Response.json({ ok: true, data: rows })
      return Response.json({ ok: true, data: { contenidoBase64: content } })
    })
  })
  const mount = s => { s.after(ui.cleanup); return ui.render(h(MemoryRouter, null, h(AuthContext.Provider, { value: { user: null, session: null } }, h(Page)))) }
  const ready = v => v.findByText('Acta prueba 12')
  const click = (v, name) => ui.fireEvent.click(v.getByRole('button', { name, exact: true }))
  const set = (v, label, value) => ui.fireEvent.change(v.getByLabelText(label), { target: { value } })
  await t.test('pagina y combina búsqueda con tipo', async s => {
    const v = mount(s); await ready(v); assert.equal(v.container.querySelectorAll('tbody tr').length, 10)
    click(v, 'Siguiente'); await v.findByText('Página 2 de 2'); click(v, 'Anterior')
    set(v, 'Buscar por nombre o código', 'prueba 1'); assert.equal(v.container.querySelectorAll('tbody tr').length, 4)
    set(v, 'Tipo de acta', 'CONSEJO'); assert.equal(v.container.querySelectorAll('tbody tr').length, 2)
    set(v, 'Buscar por nombre o código', 'inexistente'); assert.ok(v.getByText('No hay actas que coincidan con los filtros.'))
  })
  await t.test('fallo de consulta muestra error', async s => {
    failure = 'list'; const v = mount(s); await v.findByText('Lista no disponible'); assert.equal(v.container.querySelectorAll('tbody tr').length, 0)
  })
  await t.test('carga exige campos y rechaza MIME incorrecto o tamaño excesivo', async s => {
    const v = mount(s); await ready(v); click(v, '+ Cargar acta'); ui.fireEvent.submit(v.container.querySelector('form'))
    assert.ok(v.getByText('Complete el nombre, el código, el año y seleccione un archivo PDF o Word.'))
    const input = v.container.querySelector('input[type=file]')
    ui.fireEvent.change(input, { target: { files: [new ui.dom.window.File(['x'], 'imagen.png', { type: 'image/png' })] } })
    assert.ok(v.getByText('El archivo del acta debe estar en formato PDF o Word.'))
    const huge = new ui.dom.window.File(['x'], 'grande.pdf', { type: 'application/pdf' }); Object.defineProperty(huge, 'size', { value: 16 * 1024 * 1024 })
    ui.fireEvent.change(input, { target: { files: [huge] } }); assert.ok(v.getByText('El archivo no puede superar 15 MB.')); assert.equal(writes.length, 0)
  })
  await t.test('acepta actas en Word mientras no se les haya montado el flujo de firma', async s => {
    const v = mount(s); await ready(v); click(v, '+ Cargar acta')
    const input = v.container.querySelector('input[type=file]')
    const docx = new ui.dom.window.File(['x'], 'acta.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
    ui.fireEvent.change(input, { target: { files: [docx] } })
    assert.equal(v.queryByText('El archivo del acta debe estar en formato PDF o Word.'), null)
  })
  await t.test('crear acta envía PDF, checksum y campos normalizados', async s => {
    const v = mount(s); await ready(v); click(v, '+ Cargar acta')
    set(v, /Nombre del acta/, '  Acta sintética  '); set(v, 'Año del acta', '2030'); set(v, /Observaciones/, '  Observación  ')
    ui.fireEvent.change(v.getByPlaceholderText('001'), { target: { value: 'a-1' } })
    const bytes = new TextEncoder().encode('%PDF-test'); const file = new ui.dom.window.File([bytes], 'acta.pdf', { type: 'application/pdf' }); file.arrayBuffer = async () => bytes.buffer
    ui.fireEvent.change(v.container.querySelector('input[type=file]'), { target: { files: [file] } }); click(v, 'Crear acta')
    await v.findByText(/fue creada correctamente/)
    assert.equal(writes[0].body.codigo, 'ACTA_COMITE_A1-2030'); assert.equal(writes[0].body.nombre, 'Acta sintética'); assert.equal(writes[0].body.observaciones, 'Observación')
    assert.equal(writes[0].body.contenidoBase64, Buffer.from(bytes).toString('base64')); assert.match(writes[0].body.checksum, /^[a-f0-9]{64}$/)
  })
  await t.test('eliminar requiere confirmación y Escape cancela', async s => {
    const v = mount(s); await ready(v); ui.fireEvent.click(v.getAllByRole('button', { name: 'Eliminar' })[0]); click(v, 'Cancelar'); assert.equal(writes.length, 0)
    ui.fireEvent.click(v.getAllByRole('button', { name: 'Eliminar' })[0]); ui.fireEvent.keyDown(ui.dom.window, { key: 'Escape' }); assert.equal(v.queryAllByRole('dialog').length, 0)
    ui.fireEvent.click(v.getAllByRole('button', { name: 'Eliminar' })[0]); click(v, 'Sí, eliminar acta'); await v.findByText(/fue eliminada correctamente/)
    assert.equal(writes[0].method, 'DELETE'); assert.equal(v.queryAllByText('Acta prueba 12').length, 0)
  })
  await t.test('fallo al eliminar conserva diálogo y permite reintento', async s => {
    const v = mount(s); await ready(v); failure = 'delete'; ui.fireEvent.click(v.getAllByRole('button', { name: 'Eliminar' })[0]); click(v, 'Sí, eliminar acta')
    await v.findByText(/Acta no disponible/); assert.equal(v.getAllByRole('dialog').length, 1)
    failure = ''; click(v, 'Sí, eliminar acta'); await v.findByText(/fue eliminada correctamente/); assert.equal(writes.length, 2)
  })
  await t.test('archivo ausente informa error y habilita acciones nuevamente', async s => {
    const v = mount(s); await ready(v); ui.fireEvent.click(v.getAllByRole('button', { name: 'Ver', exact: true })[0]); await v.findByText('El acta todavía no tiene un archivo disponible.')
    await ui.waitFor(() => assert.equal(v.getAllByRole('button', { name: 'Descargar', exact: true })[0].disabled, false))
  })
})

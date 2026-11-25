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
    rows = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, codigo: `ACTA_COMITE_${i + 1}-2030`, nombre: `Acta prueba ${i + 1}`, fechaCreacion: '2030-01-01', tipoConsejo: i % 2 === 0, mimeType: 'application/pdf', tamanoBytes: 2048, observaciones: '' }))
    writes = []; failure = ''; content = ''
    ui.response((url, init) => {
      const path = new URL(url, 'https://test.invalid').pathname
      if (init.method === 'POST' || init.method === 'PUT' || init.method === 'DELETE') {
        writes.push({ path, method: init.method, body: init.body ? JSON.parse(init.body) : null })
        if (failure) return Response.json({ message: 'Acta no disponible' }, { status: 409 })
        if (init.method === 'DELETE') return new Response(null, { status: 204 })
        if (init.method === 'PUT') {
          const acta = rows.find(row => path.endsWith(`/${row.id}`))
          Object.assign(acta, writes.at(-1).body)
          return Response.json({ ok: true, data: acta })
        }
        const acta = { ...writes.at(-1).body, id: 99 }
        rows.push(acta)
        return Response.json({ ok: true, data: acta })
      }
      if (failure === 'list') return Response.json({ ok: false, message: 'Lista no disponible' })
      if (path.endsWith('/actas')) return Response.json({ ok: true, data: rows })
      const acta = rows.find(row => path.endsWith(`/${row.id}`))
      return Response.json({ ok: true, data: { contenidoBase64: acta?.contenidoBase64 ?? content, mimeType: acta?.mimeType, nombreArchivo: 'original.pdf' } })
    })
  })
  const mount = s => { s.after(ui.cleanup); return ui.render(h(MemoryRouter, null, h(AuthContext.Provider, { value: { user: null, session: null } }, h(Page)))) }
  const ready = v => v.findByText('Acta prueba 12')
  const click = (v, name) => ui.fireEvent.click(v.getByRole('button', { name, exact: true }))
  const set = (v, label, value) => ui.fireEvent.change(v.getByLabelText(label), { target: { value } })
  await t.test('pagina y combina búsqueda con tipo', async s => {
    const v = mount(s); await ready(v); assert.equal(v.container.querySelectorAll('tbody tr').length, 10)
    const actions = ui.within(v.getByText('Acta prueba 12').closest('tr'))
    for (const name of ['Ver', 'Descargar', 'Reemplazar documento', 'Eliminar']) {
      const button = actions.getByRole('button', { name, exact: true })
      assert.ok(button.querySelector('svg[aria-hidden="true"]'))
      assert.equal(button.nextElementSibling.textContent, name)
    }
    click(v, 'Siguiente'); await v.findByText('Página 2 de 2'); click(v, 'Anterior')
    set(v, 'Buscar por nombre o código', 'prueba 1'); assert.equal(v.container.querySelectorAll('tbody tr').length, 4)
    set(v, 'Tipo de acta', 'CONSEJO'); assert.equal(v.container.querySelectorAll('tbody tr').length, 2)
    set(v, 'Buscar por nombre o código', 'inexistente'); assert.ok(v.getByText('No hay actas que coincidan con los filtros.'))
  })
  await t.test('ordena por número de acta descendente y consecutivo ascendente', async s => {
    const expected = [
      '0001_20261125_ACTA_NO. 15',
      '0001_20261125_ACTA_NO. 14',
      '0002_20261125_ACTA_NO. 14',
      'ACTA_COMITE_99-2026',
      'ACTA_CONSEJO_14-2026',
      'ACT-9-2026',
      'ACTA_COMITE_A1-2026',
    ]
    const actas = expected.map((codigo, i) => ({ ...rows[i], codigo }))
    actas[3].nombre = '0003_20261125_ACTA_No. 14_Acta histórica'
    rows = [actas[3], actas[2], actas[6], actas[5], actas[0], actas[4], actas[1]]
    const v = mount(s)
    await v.findByText(expected[0])
    assert.deepEqual(Array.from(v.container.querySelectorAll('tbody tr'), row => row.cells[0].textContent), expected)
  })
  await t.test('fallo de consulta muestra error', async s => {
    failure = 'list'; const v = mount(s); await v.findByText('Lista no disponible'); assert.equal(v.container.querySelectorAll('tbody tr').length, 0)
  })
  await t.test('carga exige campos y rechaza MIME incorrecto o tamaño excesivo', async s => {
    const v = mount(s); await ready(v); click(v, '+ Cargar acta'); ui.fireEvent.submit(v.container.querySelector('form'))
    assert.ok(v.getByText('Complete el consecutivo, la fecha, el número y el nombre del acta.'))
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
    const datos = v.getByRole('region', { name: 'Datos del acta' })
    assert.ok(datos.textContent.includes('Fecha de la sesión'))
    assert.equal(v.queryByLabelText(/Alcance del documento|Código del acta/), null)
    set(v, /Nombre del acta/, '  Acta sintética  '); set(v, /Observaciones/, '  Observación  ')
    set(v, 'Tipo de acta *', 'CONSEJO')
    const bytes = new TextEncoder().encode('%PDF-test'); const file = new ui.dom.window.File([bytes], 'acta.pdf', { type: 'application/pdf' }); file.arrayBuffer = async () => bytes.buffer
    ui.fireEvent.submit(v.container.querySelector('form'))
    assert.ok(v.getByText('Complete el consecutivo, la fecha, el número y el nombre del acta.'))
    assert.equal(writes.length, 0)
    set(v, /Consecutivo/, '2')
    set(v, /Fecha del acta/, '2026-07-17')
    set(v, /Número del acta/, '15')
    const expectedCode = '0002_20260717_ACTA_NO. 15'
    assert.ok(v.getByText(`${expectedCode}_Acta sintética`))
    ui.fireEvent.submit(v.container.querySelector('form'))
    assert.ok(v.getByText('Seleccione un archivo PDF o Word.'))
    ui.fireEvent.change(v.container.querySelector('input[type=file]'), { target: { files: [file] } })
    click(v, 'Crear acta')
    await v.findByText(/fue creada correctamente/)
    assert.equal(writes[0].body.codigo, expectedCode); assert.equal(writes[0].body.tipoConsejo, true); assert.equal(writes[0].body.nombre, 'Acta sintética'); assert.equal(writes[0].body.observaciones, 'Observación')
    assert.equal(writes[0].body.contenidoBase64, Buffer.from(bytes).toString('base64')); assert.match(writes[0].body.checksum, /^[a-f0-9]{64}$/)
    await v.findByRole('option', { name: '2026' })
    set(v, 'Año', '2026')
    const row = v.getByRole('row', { name: /Acta sintética/ })
    const cells = Array.from(row.cells, cell => cell.textContent)
    assert.deepEqual(cells.slice(0, 4), [expectedCode, 'Consejo Académico', 'Acta sintética', '2026'])
  })
  await t.test('descarga actas nuevas con el formato generado y conserva el nombre histórico', async s => {
    const code = '0002_20260717_ACTA_NO. 15'
    const name = 'Acta sintética'
    const previousName = '0003_20260717_ACTA_No. 15_Acta sintética - OTRA PARTE DE ACTA'
    rows = rows.slice(-3)
    Object.assign(rows[2], { codigo: code, nombre: name })
    rows[1].nombre = previousName
    content = Buffer.from('%PDF-test').toString('base64')
    const downloads = []
    s.mock.method(ui.dom.window.HTMLAnchorElement.prototype, 'click', function () {
      downloads.push(this.download)
    })
    const v = mount(s)
    await v.findByText(name)
    for (const rowName of [name, previousName, 'Acta prueba 10']) {
      const button = ui.within(v.getByText(rowName).closest('tr')).getByRole('button', { name: 'Descargar', exact: true })
      ui.fireEvent.click(button)
      await ui.waitFor(() => assert.equal(button.disabled, false))
    }
    assert.deepEqual(downloads, [`${code}_${name}.pdf`, `${previousName}.pdf`, 'original.pdf'])
  })
  await t.test('reemplazo valida, permite cancelar y reintenta sin cambiar el registro', async s => {
    const v = mount(s)
    const row = (await ready(v)).closest('tr')
    const trigger = ui.within(row).getByRole('button', { name: 'Reemplazar documento' })
    ui.fireEvent.click(trigger)
    click(v, 'Cancelar')
    assert.equal(writes.length, 0)
    assert.equal(v.queryByRole('dialog'), null)
    ui.fireEvent.click(trigger)
    const dialog = v.getByRole('dialog', { name: 'Reemplazar documento' })
    const input = dialog.querySelector('input[type=file]')
    const submit = ui.within(dialog).getByRole('button', { name: 'Confirmar reemplazo' })
    ui.fireEvent.change(input, { target: { files: [new ui.dom.window.File(['x'], 'imagen.png', { type: 'image/png' })] } })
    assert.equal(submit.disabled, true)
    assert.match(ui.within(dialog).getByRole('alert').textContent, /PDF o Word/)
    const bytes = new TextEncoder().encode('nuevo documento')
    const file = new ui.dom.window.File([bytes], 'acta.doc', { type: 'application/msword' })
    file.arrayBuffer = async () => bytes.buffer
    ui.fireEvent.change(input, { target: { files: [file] } })
    failure = 'replace'
    ui.fireEvent.click(submit)
    await ui.within(dialog).findByText('Acta no disponible')
    assert.match(row.textContent, /PDF/)
    failure = ''
    ui.fireEvent.click(submit)
    await v.findByText(/Se reemplazó el documento/)
    assert.equal(v.queryByRole('dialog'), null)
    assert.match(row.textContent, /ACTA_COMITE_12-2030.*Acta prueba 12.*Word/)
    assert.equal(writes.length, 2)
    assert.equal(writes[1].method, 'PUT')
    assert.match(writes[1].path, /\/actas\/12$/)
    assert.deepEqual(writes[1].body, {
      contenidoBase64: Buffer.from(bytes).toString('base64'),
      mimeType: 'application/msword',
      tamanoBytes: bytes.length,
      checksum: Buffer.from(await crypto.subtle.digest('SHA-256', bytes)).toString('hex'),
    })
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

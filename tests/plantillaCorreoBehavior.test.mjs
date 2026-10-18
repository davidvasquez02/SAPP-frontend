import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement as h } from 'react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('plantillas de correo: edición, confirmación y recuperación sin envíos reales', async t => {
  const ui = await reactApiHarness(t)
  const { default: Page } = await ui.load('/src/pages/PlantillasCorreo/PlantillaCorreoFormPage.tsx')
  const { AuthContext } = await ui.load('/src/context/Auth/context.ts')
  let template, writes, failure
  t.beforeEach(() => {
    template = { id: 5, sigla: 'PRUEBA', nombre: 'Plantilla sintética', asunto: 'Hola {{nombre}}', idioma: 'ES', descripcion: 'Descripción', contenidoHtml: '<p>Hola {{nombre}}</p>' }; writes = []; failure = false
    ui.response((url, init) => {
      if (failure) return Response.json({ message: 'Plantilla no disponible' }, { status: 503 })
      if (init.method === 'PUT') { const body = JSON.parse(init.body); writes.push(body); template = { ...template, ...body } }
      if (init.method === 'POST') writes.push('prueba')
      return Response.json({ ok: true, data: template, message: 'Prueba simulada aceptada' })
    })
  })
  const mount = s => { s.after(ui.cleanup); return ui.render(h(MemoryRouter, { initialEntries: ['/plantilla/5'] }, h(AuthContext.Provider, { value: { user: null, session: null } }, h(Routes, null, h(Route, { path: '/plantilla/:plantillaId', element: h(Page) }))))) }
  const field = (v, name) => [...v.container.querySelectorAll('.plantillas-correo__campo')].find(e => e.querySelector('.plantillas-correo__campo-etiqueta')?.textContent.startsWith(name))
  const edit = (v, name) => ui.fireEvent.click(ui.within(field(v, name)).getByRole('button', { name: 'Editar' }))
  const done = (v, name) => ui.fireEvent.click(ui.within(field(v, name)).getByRole('button', { name: 'Listo' }))
  const change = (v, name, value) => ui.fireEvent.change(v.getByLabelText(name), { target: { value } })
  const click = (v, name) => ui.fireEvent.click(v.getByRole('button', { name, exact: true }))
  await t.test('sin cambios no permite guardar y edición bloquea prueba', async s => {
    const v = mount(s); await v.findByText('Plantilla sintética'); assert.equal(v.getByRole('button', { name: 'Guardar', exact: true }).disabled, true)
    edit(v, 'Nombre'); change(v, 'Nombre', 'Cambio temporal'); assert.equal(v.getByRole('button', { name: 'Enviar correo de prueba' }).disabled, true)
    ui.fireEvent.click(ui.within(field(v, 'Nombre')).getByRole('button', { name: 'Cancelar' })); assert.ok(v.getByText('Plantilla sintética')); assert.equal(writes.length, 0)
  })
  await t.test('guardar exige terminar edición y confirmar campos modificados', async s => {
    const v = mount(s); await v.findByText('Plantilla sintética'); edit(v, 'Asunto'); change(v, 'Asunto', '  Asunto actualizado  '); done(v, 'Asunto')
    click(v, 'Guardar'); assert.ok(v.getByText('Revisa los cambios antes de guardar:')); assert.equal(writes.length, 0)
    click(v, 'Seguir editando'); click(v, 'Guardar'); click(v, 'Confirmar y guardar'); await v.findByText('Cambios guardados correctamente.')
    assert.equal(writes[0].asunto, 'Asunto actualizado'); assert.equal(writes[0].contenidoHtml, '<p>Hola {{nombre}}</p>')
  })
  await t.test('campos requeridos vacíos impiden persistencia', async s => {
    const v = mount(s); await v.findByText('Plantilla sintética'); edit(v, 'Nombre'); change(v, 'Nombre', ' '); done(v, 'Nombre'); click(v, 'Guardar'); click(v, 'Confirmar y guardar')
    await v.findByText('El nombre, el asunto y el contenido son obligatorios.'); assert.equal(writes.length, 0)
  })
  await t.test('idioma, descripción y HTML se editan y preservan variables', async s => {
    const v = mount(s); await v.findByText('Plantilla sintética')
    for (const [name, label, value] of [['Idioma', 'Idioma', 'EN'], ['Descripción', 'Descripción', 'Description'], ['Contenido', 'Contenido HTML del correo', '<p>{{nombre}} nuevo</p>']]) { edit(v, name); change(v, label, value); done(v, name) }
    click(v, 'Guardar'); click(v, 'Confirmar y guardar'); await v.findByText('Cambios guardados correctamente.')
    assert.equal(writes[0].idioma, 'EN'); assert.equal(writes[0].descripcion, 'Description'); assert.equal(writes[0].contenidoHtml, '<p>{{nombre}} nuevo</p>')
    assert.ok(v.getByTitle('Vista previa del correo').getAttribute('srcdoc').includes('nombre'))
  })
  await t.test('fallo al guardar mantiene confirmación y permite reintentar', async s => {
    const v = mount(s); await v.findByText('Plantilla sintética'); edit(v, 'Nombre'); change(v, 'Nombre', 'Nombre nuevo'); done(v, 'Nombre'); click(v, 'Guardar'); failure = true; click(v, 'Confirmar y guardar')
    await v.findByText(/Plantilla no disponible/); failure = false; click(v, 'Confirmar y guardar'); await v.findByText('Cambios guardados correctamente.')
  })
  await t.test('prueba simulada usa versión guardada y muestra confirmación', async s => {
    const v = mount(s); await v.findByText('Plantilla sintética'); click(v, 'Enviar correo de prueba'); await v.findByText('Prueba simulada aceptada'); assert.deepEqual(writes, ['prueba'])
  })
  await t.test('error de carga no muestra campos editables', async s => {
    failure = true; const v = mount(s); await v.findByText(/Plantilla no disponible/); assert.equal(v.queryAllByRole('button', { name: 'Guardar', exact: true }).length, 0)
  })
})

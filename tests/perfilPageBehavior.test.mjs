import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement as h } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('perfil: firma, validaciones de imagen y campos por rol', async t => {
  const ui = await reactApiHarness(t)
  const { default: Page } = await ui.load('/src/pages/Perfil/PerfilPage.tsx')
  const { AuthContext } = await ui.load('/src/context/Auth/context.ts')
  let signature, writes, failure
  t.beforeEach(() => {
    signature = null; writes = []; failure = ''
    ui.response((url, init) => {
      if (failure && (String(url).includes(failure) || failure === 'save' && init.method === 'POST')) return Response.json({ message: 'Firma no disponible' }, { status: 503 })
      if (String(url).includes('/idp-account-url')) return Response.json({ ok: true, data: { url: 'https://idp.example.test/account' } })
      if (init.method === 'POST') { writes.push(JSON.parse(init.body)); return Response.json({ ok: true }) }
      if (String(url).includes('/firmaUsuario/')) return Response.json({ ok: true, data: signature })
      throw new Error(`Petición inesperada: ${url}`)
    })
  })
  const mount = (s, roles = ['DOCENTE_POSGRADOS'], absent = false) => {
    s.after(ui.cleanup); const user = absent ? null : { id: 10, username: 'sintetico', nombreCompleto: 'persona prueba', roles, persona: { nombre1: 'Persona', apellido1: 'Prueba', tipoDocumento: 'CC', numeroDocumento: '123', emailInstitucional: 'prueba@example.test' }, attributes: { phone: ['000'], personalEmail: ['personal@example.test'] } }
    return ui.render(h(MemoryRouter, null, h(AuthContext.Provider, { value: { user, session: user ? { kind: 'SAPP', user } : null } }, h(Page))))
  }
  const upload = (v, type = 'image/png', size) => {
    const f = new ui.dom.window.File(['firma sintética'], 'firma.png', { type }); if (size) Object.defineProperty(f, 'size', { value: size })
    ui.fireEvent.change(v.container.querySelector('input[type=file]'), { target: { files: [f] } })
  }
  const save = v => ui.fireEvent.click(v.getByRole('button', { name: 'Guardar firma' }))
  await t.test('perfil muestra identidad y enlace institucional, sin firma no habilita guardar', async s => {
    const v = mount(s); await v.findByText('Sin firma cargada'); assert.ok(v.getByRole('heading', { name: 'Persona Prueba' }))
    assert.equal(v.getByRole('link', { name: 'Actualizar mi información' }).getAttribute('href'), 'https://idp.example.test/account'); assert.equal(v.getByRole('button', { name: 'Guardar firma' }).disabled, true)
  })
  await t.test('firma existente interpreta URL de datos y conserva título', async s => {
    signature = { titulo: 'PhD', contenidoFirma: 'data:image/png;base64,YWJj' }; const v = mount(s); await v.findByAltText('Vista previa de la firma')
    assert.equal(v.getByLabelText('Título').value, 'PhD'); assert.equal(v.getByAltText('Vista previa de la firma').getAttribute('src'), signature.contenidoFirma)
  })
  await t.test('solo acepta PNG/JPEG y límite de dos MB', async s => {
    const v = mount(s); await v.findByText('Sin firma cargada'); upload(v, 'application/pdf'); assert.ok(v.getByText('Selecciona una imagen PNG o JPG.'))
    upload(v, 'image/png', 3 * 1024 * 1024); assert.ok(v.getByText('La imagen no puede superar 2 MB.')); assert.equal(writes.length, 0)
  })
  await t.test('docente requiere título y envía firma base64 con título recortado', async s => {
    const v = mount(s); await v.findByText('Sin firma cargada'); upload(v); await v.findByAltText('Vista previa de la firma'); save(v); assert.ok(v.getByText('Ingresa el título que acompañará la firma.'))
    ui.fireEvent.change(v.getByLabelText('Título'), { target: { value: '  PhD  ' } }); save(v); await v.findByText('La firma se actualizó correctamente.')
    assert.equal(writes[0].titulo, 'PhD'); assert.equal(writes[0].contenidoFirma, `data:image/png;base64,${Buffer.from('firma sintética').toString('base64')}`)
  })
  await t.test('rol estudiante no necesita título en la firma', async s => {
    const v = mount(s, ['ESTUDIANTE_POSGRADOS']); await v.findByText('Sin firma cargada'); upload(v); await v.findByAltText('Vista previa de la firma'); save(v); await v.findByText('La firma se actualizó correctamente.')
    assert.equal('titulo' in writes[0], false); assert.equal(v.queryAllByLabelText('Título').length, 0)
  })
  await t.test('fallo al guardar conserva imagen y permite reintento', async s => {
    signature = { titulo: 'PhD', contenidoFirma: 'YWJj' }; const v = mount(s); await v.findByAltText('Vista previa de la firma'); failure = 'save'; save(v); await v.findByText(/Firma no disponible/)
    failure = ''; save(v); await v.findByText('La firma se actualizó correctamente.')
  })
  await t.test('fallo de consulta se informa y perfil ausente no muestra datos', async s => {
    failure = 'firmaUsuario'; const v = mount(s); await v.findByText(/Firma no disponible/); await ui.cleanup(); const v2 = mount(s, [], true); assert.equal(v2.container.textContent, '')
  })
})

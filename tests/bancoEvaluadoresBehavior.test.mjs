import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement as h } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('ajuste #19: banco de evaluadores — listar, registrar, retirar y reincorporar', async t => {
  const ui = await reactApiHarness(t)
  const { default: BancoEvaluadoresPage } = await ui.load('/src/pages/BancoEvaluadores/BancoEvaluadoresPage.tsx')
  const { AuthContext } = await ui.load('/src/context/Auth/context.ts')
  let candidatos, writes, failed
  t.beforeEach(() => {
    candidatos = [{ id: 1, nombre: 'Ana Torres', tratamiento: 'Dra.', correo: 'ana@example.test', institucion: 'Universidad Nacional', externo: true, idioma: 'ES', notas: null, activo: true, fechaRegistro: '2026-11-01' }]
    writes = []
    failed = false
    ui.response((url, init) => {
      const path = new URL(url, 'https://test.invalid').pathname
      if (init.method === 'POST' || init.method === 'PUT') {
        writes.push({ path, method: init.method, body: init.body ? JSON.parse(init.body) : null })
        if (failed) return Response.json({ message: 'No fue posible guardar.' }, { status: 409 })
        return Response.json({ ok: true, data: candidatos[0] })
      }
      if (failed) return Response.json({ message: 'No fue posible consultar.' }, { status: 503 })
      return Response.json({ ok: true, data: candidatos })
    })
  })
  const mount = (s) => {
    s.after(ui.cleanup)
    return ui.render(h(MemoryRouter, null, h(AuthContext.Provider, { value: { user: null, session: null } }, h(BancoEvaluadoresPage))))
  }
  const ready = async (view) => { await view.findByText('Dra. Ana Torres') }

  await t.test('muestra diez filas por página y vuelve al inicio al cambiar un filtro', async s => {
    candidatos = Array.from({ length: 12 }, (_, index) => ({
      ...candidatos[0], id: index + 1, nombre: `Persona ${index + 1}`, tratamiento: null,
    }))
    const view = mount(s)
    await view.findByText('Página 1 de 2')
    assert.equal(view.getAllByRole('row').length, 11)
    ui.fireEvent.click(view.getByRole('button', { name: 'Siguiente' }))
    assert.equal(view.getAllByRole('row').length, 3)
    assert.equal(view.getByRole('button', { name: 'Siguiente' }).disabled, true)
    ui.fireEvent.click(view.getByRole('button', { name: 'Anterior' }))
    assert.ok(view.getByText('Página 1 de 2'))
    ui.fireEvent.click(view.getByRole('button', { name: 'Siguiente' }))
    ui.fireEvent.click(view.getByLabelText('Mostrar retirados'))
    assert.ok(view.getByText('Página 1 de 2'))
  })

  await t.test('lista a las personas registradas con su tratamiento', async s => {
    const view = mount(s)
    await ready(view)
    assert.ok(view.getByText('ana@example.test'))
  })

  await t.test('registra una persona nueva', async s => {
    const view = mount(s)
    await ready(view)
    ui.fireEvent.click(view.getByRole('button', { name: 'Registrar persona' }))
    ui.fireEvent.change(view.getByLabelText('Nombre *'), { target: { value: 'Carlos Pérez' } })
    ui.fireEvent.change(view.getByLabelText('Correo *'), { target: { value: 'carlos@example.test' } })
    ui.fireEvent.click(view.getByRole('button', { name: 'Guardar' }))
    await view.findByText('La persona fue registrada en el banco de evaluadores.')
    assert.equal(writes[0].method, 'POST')
    assert.equal(writes[0].body.nombre, 'Carlos Pérez')
    assert.equal(writes[0].body.correo, 'carlos@example.test')
  })

  await t.test('sin nombre ni correo no envía la mutación', async s => {
    const view = mount(s)
    await ready(view)
    ui.fireEvent.click(view.getByRole('button', { name: 'Registrar persona' }))
    ui.fireEvent.click(view.getByRole('button', { name: 'Guardar' }))
    assert.ok(view.getByText('Completa el nombre y el correo de la persona.'))
    assert.equal(writes.length, 0)
  })

  await t.test('retira a una persona activa sin borrarla', async s => {
    const view = mount(s)
    await ready(view)
    ui.fireEvent.click(view.getByRole('button', { name: 'Retirar' }))
    await view.findByText('Ana Torres fue retirado del banco.')
    assert.ok(writes[0].path.endsWith('/1/desactivar'))
  })

  await t.test('reincorpora a una persona retirada', async s => {
    candidatos = [{ ...candidatos[0], activo: false }]
    const view = mount(s)
    await ready(view)
    ui.fireEvent.click(view.getByRole('button', { name: 'Reincorporar' }))
    await view.findByText('Ana Torres fue reincorporado al banco.')
    assert.ok(writes[0].path.endsWith('/1/reactivar'))
  })
})

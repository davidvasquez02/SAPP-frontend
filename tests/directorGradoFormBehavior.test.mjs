import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('director de grado React: permisos, guardado y concurrencia', async t => {
  const ui = await reactApiHarness(t)
  const { DirectorGradoPerfilForm: Form } = await ui.load('/src/modules/perfil/components/DirectorGradoPerfilForm.tsx')
  let assignment, failGet, failSave, holdSave, putCount, releaseSave
  const ok = data => Response.json({ ok: true, data, message: '' })
  t.beforeEach(() => {
    assignment = { estudianteId: 18, puedeAsignar: true, grupo: { id: 1, nombre: 'Grupo uno' }, director: null }
    failGet = false; failSave = 0; holdSave = false; putCount = 0; releaseSave = undefined
    ui.response(async (url, init) => {
      const path = new URL(url, 'https://example.test')
      if (path.pathname.endsWith('/director-grado')) {
        if (init.method === 'PUT') {
          putCount++
          if (holdSave) await new Promise(resolve => { releaseSave = resolve })
          if (failSave) {
            if (failSave === 409) assignment = { ...assignment, puedeAsignar: false, director: { id: 10, nombreCompleto: 'Directora concurrente', correo: null } }
            return Response.json({ message: 'No se pudo asignar' }, { status: failSave })
          }
          const body = JSON.parse(init.body)
          assert.deepEqual(body, { grupoInvestigacionId: 1, directorId: 9 })
          assignment = { ...assignment, puedeAsignar: false, director: { id: 9, nombreCompleto: 'Docente de prueba', correo: 'docente@example.test' } }
        } else if (failGet) return Response.json({ message: 'Consulta temporalmente no disponible' }, { status: 503 })
        return ok(assignment)
      }
      if (path.pathname.endsWith('/gruposInvestigacion')) return ok([{ id: 1, codigoNombre: 'Grupo uno' }, { id: 2, codigoNombre: 'Grupo dos' }])
      if (path.pathname.endsWith('/gruposInvestigacionDocentes')) {
        assert.equal(path.searchParams.get('soloPosgrados'), 'true')
        return ok(path.searchParams.get('grupoId') === '1' ? [{ id: 9, nombre: 'Docente de prueba' }] : [])
      }
      throw new Error(`Petición inesperada: ${url}`)
    })
  })
  const mount = s => {
    s.after(ui.cleanup)
    return ui.render(createElement(Form, { estudianteId: 18, onActualizado: () => {} }))
  }
  const choose = async view => {
    ui.fireEvent.click(await view.findByRole('button', { name: 'Agregar director de grado' }))
    await view.findByRole('option', { name: 'Docente De Prueba' })
    ui.fireEvent.change(view.getByLabelText('Docente director de grado'), { target: { value: '9' } })
  }

  await t.test('consulta fallida ofrece reintento y no permite guardar a ciegas', async s => {
    failGet = true
    const view = mount(s)
    await view.findByText('Consulta temporalmente no disponible')
    assert.equal(view.queryByRole('button', { name: 'Agregar director de grado' }), null)
    failGet = false
    ui.fireEvent.click(view.getByRole('button', { name: 'Reintentar consulta' }))
    await view.findByRole('button', { name: 'Agregar director de grado' })
  })

  await t.test('director asignado con nombre nulo sigue bloqueando edición', async s => {
    assignment = { ...assignment, director: { id: 10, nombreCompleto: null, correo: null } }
    const view = mount(s)
    await view.findByText('Director asignado; nombre no disponible')
    assert.equal(view.queryByRole('button', { name: 'Agregar director de grado' }), null)
    assert.ok(view.getByText('No disponible'))
  })

  await t.test('guardado bloquea doble clic y al terminar retira el formulario', async s => {
    holdSave = true
    const view = mount(s)
    await choose(view)
    const save = view.getByRole('button', { name: 'Guardar director de grado' })
    ui.fireEvent.click(save)
    ui.fireEvent.click(save)
    await ui.waitFor(() => assert.equal(putCount, 1))
    assert.equal(view.getByRole('button', { name: 'Guardando director…' }).disabled, true)
    releaseSave()
    await view.findByText('El director de grado se asignó correctamente.')
    assert.ok(view.getByText('Docente De Prueba'))
    assert.equal(view.queryByLabelText('Docente director de grado'), null)
  })

  await t.test('cambiar grupo limpia selección y no permite guardar si no hay docentes', async s => {
    const view = mount(s)
    await choose(view)
    assert.equal(view.getByRole('button', { name: 'Guardar director de grado' }).disabled, false)
    ui.fireEvent.change(view.getByLabelText('Grupo de investigación'), { target: { value: '2' } })
    await view.findByText('Este grupo no tiene docentes de posgrado disponibles.')
    assert.equal(view.getByLabelText('Docente director de grado').value, '')
    assert.equal(view.getByRole('button', { name: 'Guardar director de grado' }).disabled, true)
    assert.equal(putCount, 0)
  })

  await t.test('fallo de guardado conserva selección; 409 vuelve a consultar la asignación', async s => {
    const view = mount(s)
    await choose(view)
    failSave = 503
    ui.fireEvent.click(view.getByRole('button', { name: 'Guardar director de grado' }))
    await view.findByText('No se pudo asignar')
    assert.equal(view.getByLabelText('Docente director de grado').value, '9')
    failSave = 409
    ui.fireEvent.click(view.getByRole('button', { name: 'Guardar director de grado' }))
    await view.findByText('Directora Concurrente')
    assert.equal(view.queryByRole('button', { name: 'Agregar director de grado' }), null)
    assert.equal(putCount, 2)
  })
})

import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { MemoryRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('rutas React: roles, revocación de sesión y habilitación de evaluación', async t => {
  const ui = await reactApiHarness(t)
  const { default: RequireRoles } = await ui.load('/src/routes/RequireRoles/RequireRoles.tsx')
  const { default: RequireEvaluacion } = await ui.load('/src/modules/admisiones/routes/RequireEvaluacionEnabled.tsx')
  const { AuthContext } = await ui.load('/src/context/Auth/context.ts')
  const text = value => createElement('p', null, value)
  const OtherScreen = () => text(`Otra pantalla: ${useLocation().pathname}`)
  let enabled, serverFailure, release, hold
  t.beforeEach(() => {
    enabled = true; serverFailure = false; hold = false; release = undefined
    ui.response(async url => {
      assert.ok(url.includes('/evaluacionAdmision/info?inscripcionId=160'))
      if (hold) await new Promise(resolve => { release = resolve })
      if (serverFailure) return Response.json({ message: 'No disponible' }, { status: 503 })
      return Response.json({ ok: enabled, data: null, message: 'Evaluación pendiente' })
    })
  })
  const session = (roles, kind = 'SAPP') => ({ kind, user: { id: 10, roles } })
  const rolesTree = (value, allowedRoles = ['COORDINADOR_POSGRADOS', 'ADMIN_POSGRADOS']) =>
    createElement(MemoryRouter, { initialEntries: ['/privada'] },
      createElement(AuthContext.Provider, { value: { session: value } },
        createElement(Routes, null,
          createElement(Route, { path: '/', element: text('Inicio público') }),
          createElement(Route, { path: '/privada', element: createElement(RequireRoles, { allowedRoles }, text('Contenido protegido')) }))))
  const base = '/admisiones/convocatoria/107/inscripcion/160'
  const evaluationTree = (context, id = '160') => {
    const path = `/admisiones/convocatoria/107/inscripcion/${id}`
    return createElement(MemoryRouter, { initialEntries: [`${path}/evaluacion`] },
      createElement(Routes, null,
        createElement(Route, { path: '/admisiones', element: text('Inicio admisiones') }),
        createElement(Route, { path: '/admisiones/convocatoria/:convocatoriaId/inscripcion/:inscripcionId', element: createElement(Outlet, { context }) },
          createElement(Route, { index: true, element: text('Detalle de inscripción') }),
          createElement(Route, { path: 'evaluacion', element: createElement(RequireEvaluacion, { etapa: 'ENTREVISTA' }, text('Evaluación protegida')) }))))
  }
  const mount = (s, tree) => { s.after(ui.cleanup); return ui.render(tree) }

  for (const [name, value] of [
    ['sesión ausente', null], ['sesión de otro tipo', session(['ADMIN'], 'ASPIRANTE')],
    ['estudiante sin rol requerido', session(['ESTUDIANTE'])], ['roles vacíos', session([])],
  ]) await t.test(`${name}: redirige sin mostrar contenido privado`, async s => {
    const view = mount(s, rolesTree(value))
    await view.findByText('Inicio público')
    assert.equal(view.queryAllByText('Contenido protegido').length, 0)
  })

  await t.test('roles canónicos y alias admitidos muestran la ruta', async s => {
    for (const roles of [['COORDINADOR_POSGRADOS'], [' admin '], ['ESTUDIANTE', 'COORDINADOR']]) {
      const view = mount(s, rolesTree(session(roles)))
      assert.ok(view.getByText('Contenido protegido'))
      await ui.cleanup()
    }
  })

  await t.test('cerrar sesión retira inmediatamente contenido protegido', async s => {
    const view = mount(s, rolesTree(session(['ADMIN'])))
    assert.ok(view.getByText('Contenido protegido'))
    view.rerender(rolesTree(null))
    await view.findByText('Inicio público')
    assert.equal(view.queryAllByText('Contenido protegido').length, 0)
  })

  await t.test('cambiar a un rol no permitido revoca la ruta sin ampliar permisos', async s => {
    const view = mount(s, rolesTree(session(['ADMIN'])))
    view.rerender(rolesTree(session(['ESTUDIANTE'])))
    await view.findByText('Inicio público')
    assert.equal(view.queryAllByText('Contenido protegido').length, 0)
  })

  await t.test('lista de roles permitidos vacía no concede acceso', async s => {
    const view = mount(s, rolesTree(session(['ADMIN']), []))
    await view.findByText('Inicio público')
  })

  await t.test('evaluación ya iniciada reutiliza contexto sin consulta duplicada', s => {
    const start = ui.requests.length
    const view = mount(s, evaluationTree({ evaluacionStatus: 'STARTED', isEvaluadorOnly: false }))
    assert.ok(view.getByText('Evaluación protegida'))
    assert.equal(ui.requests.length, start)
  })

  for (const status of ['NOT_STARTED', 'ERROR']) await t.test(`contexto ${status} vuelve al detalle sin consultar`, async s => {
    const start = ui.requests.length
    const view = mount(s, evaluationTree({ evaluacionStatus: status, isEvaluadorOnly: false }))
    await view.findByText('Detalle de inscripción')
    assert.equal(view.queryAllByText('Evaluación protegida').length, 0)
    assert.equal(ui.requests.length, start)
  })

  await t.test('evaluador espera consulta compartida y no dispara endpoint adicional', s => {
    const start = ui.requests.length
    const view = mount(s, evaluationTree({ evaluacionStatus: 'LOADING', isEvaluadorOnly: true }))
    assert.ok(view.getByText('Cargando...'))
    assert.equal(ui.requests.length, start)
    view.rerender(evaluationTree({ evaluacionStatus: 'STARTED', isEvaluadorOnly: true }))
    assert.ok(view.getByText('Evaluación protegida'))
    assert.equal(ui.requests.length, start)
  })

  await t.test('coordinación resuelve el permiso con la respuesta del servidor', async s => {
    const view = mount(s, evaluationTree({ evaluacionStatus: 'LOADING', isEvaluadorOnly: false }))
    await view.findByText('Evaluación protegida')
    assert.ok(ui.requests.at(-1).url.endsWith('inscripcionId=160'))
  })

  await t.test('respuesta sin evaluación y fallo HTTP regresan al detalle', async s => {
    enabled = false
    let view = mount(s, evaluationTree({ evaluacionStatus: 'LOADING', isEvaluadorOnly: false }))
    await view.findByText('Detalle de inscripción')
    await ui.cleanup()
    serverFailure = true
    view = mount(s, evaluationTree({ evaluacionStatus: 'LOADING', isEvaluadorOnly: false }))
    await view.findByText('Detalle de inscripción')
    assert.equal(view.queryAllByText('Evaluación protegida').length, 0)
  })

  await t.test('id inválido vuelve al detalle sin invocar la API', async s => {
    const start = ui.requests.length
    const view = mount(s, evaluationTree({ evaluacionStatus: 'LOADING', isEvaluadorOnly: false }, 'invalido'))
    await view.findByText('Detalle de inscripción')
    assert.equal(ui.requests.length, start)
  })

  await t.test('respuesta tardía no desmonta la pantalla posterior', async s => {
    hold = true
    const context = { evaluacionStatus: 'LOADING', isEvaluadorOnly: false }
    const view = mount(s, evaluationTree(context))
    await ui.waitFor(() => assert.equal(typeof release, 'function'))
    view.rerender(createElement(MemoryRouter, { initialEntries: [base] }, createElement(OtherScreen)))
    enabled = false
    await ui.act(async () => release())
    assert.ok(view.getByText(`Otra pantalla: ${base}/evaluacion`))
    assert.equal(view.queryAllByText('Evaluación protegida').length, 0)
  })
})

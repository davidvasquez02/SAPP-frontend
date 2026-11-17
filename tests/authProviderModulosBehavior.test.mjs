import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement as h } from 'react'
import { MemoryRouter, Routes, Route, useLocation, useNavigationType } from 'react-router-dom'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('proveedor de autenticación y entradas de módulos por perfil', async t => {
  const ui = await reactApiHarness(t)
  const { AuthProvider } = await ui.load('/src/context/Auth/AuthContext.tsx')
  const { useAuth } = await ui.load('/src/context/Auth/useAuth.ts')
  const { AuthContext } = await ui.load('/src/context/Auth/context.ts')
  const { default: Requests } = await ui.load('/src/pages/Solicitudes/SolicitudesPage.tsx')
  const { default: Projects } = await ui.load('/src/pages/TrabajosGrado/TrabajosGradoPage.tsx')
  const { trabajosGradoRoutes } = await ui.load('/src/app/routes/trabajosGradoRoutes.tsx')
  const { default: Reminder } = await ui.load('/src/components/SignatureReminder/SignatureReminder.tsx')
  const sessions = await ui.load('/src/modules/auth/session/sessionStore.ts')
  let fail, dto, signature, context
  t.beforeEach(() => {
    sessions.clearSession(); fail = false; signature = null
    dto = { id: 10, username: 'sintetico', fullName: 'Persona sintética', clientRoles: ['ESTUDIANTE'], detalle: { persona: { id: 70, firstName: 'Persona', lastName: 'Sintética', email: 'prueba@example.test' }, estudiante: { id: 7 } } }
    ui.response(url => {
      if (fail) return Response.json({ message: 'Sesión no disponible' }, { status: 503 })
      if (String(url).endsWith('/inicio')) return Response.json({ ok: true, data: dto })
      if (String(url).includes('/firmaUsuario/')) return Response.json({ ok: true, data: signature })
      return Response.json({ ok: true, data: [] })
    })
  })
  const Probe = () => { context = useAuth(); return h('p', null, context.isInitializing ? 'Inicializando' : context.initializationError ?? context.user?.username ?? 'Sin sesión') }
  const mountProvider = s => { s.after(ui.cleanup); return ui.render(h(AuthProvider, null, h(Probe))) }
  const mount = (s, Component, roles = [], path = '/prueba') => {
    s.after(ui.cleanup); const user = { id: 10, roles, persona: {}, estudiante: { id: 7, programaCodigoNombre: 'MISI' } }
    return ui.render(h(MemoryRouter, { initialEntries: [path] }, h(AuthContext.Provider, { value: { user, session: { kind: 'SAPP', user } } }, h(Routes, null, h(Route, { path: '/prueba', element: h(Component) }), h(Route, { path: '/proyectos-investigacion/:nivel?', element: h(Component) })))))
  }
  await t.test('inicializa desde gateway y persiste identidad local', async s => { const v = mountProvider(s); await v.findByText('sintetico'); assert.equal(context.session.user.persona.id, 70); assert.equal(sessions.getSession().user.estudiante.id, 7); assert.equal(context.isInitializing, false) })
  await t.test('fallo inicial limpia sesión y reintento vuelve a autenticar', async s => {
    fail = true; const v = mountProvider(s); await v.findByText(/Sesión no disponible/); assert.equal(context.session, null); fail = false; await ui.act(async () => context.retryInitialization()); await v.findByText('sintetico')
  })
  await t.test('sesión expirada no se conserva durante inicialización', async s => {
    sessions.saveSession({ kind: 'SAPP', accessToken: 'expirado', expiresAt: 1, user: { id: 99, roles: [] } }); fail = true; const v = mountProvider(s); await v.findByText(/Sesión no disponible/); assert.equal(sessions.getSession(), null)
  })
  await t.test('actualizar director cambia estudiante y persiste nueva asignación', async s => {
    const v = mountProvider(s); await v.findByText('sintetico'); await ui.act(async () => context.actualizarDirectorGrado({ estudianteId: 7, director: { id: 20, nombreCompleto: 'Director sintético' }, grupo: { id: 8 } })); assert.equal(context.user.estudiante.directorTg.id, 20)
    assert.equal(sessions.getSession().user.detalle.estudiante.directorTg.id, 20)
  })
  await t.test('logout limpia datos antes de solicitar redirección institucional', async s => {
    const v = mountProvider(s); await v.findByText('sintetico'); const original = globalThis.window; const redirects = []
    globalThis.window = new Proxy(original, { get(target, key) { return key === 'location' ? { ...target.location, replace: url => redirects.push(url) } : Reflect.get(target, key, target) } })
    try { await ui.act(async () => context.logout()); assert.deepEqual(redirects, ['/api/auth/slo/logout']); assert.equal(context.session, null); assert.equal(sessions.getSession(), null) } finally { globalThis.window = original }
  })
  await t.test('solicitudes rechaza perfil sin permiso y muestra listas según rol', async s => {
    let v = mount(s, Requests); await v.findByText('No tienes permisos.'); await ui.cleanup()
    v = mount(s, Requests, ['ESTUDIANTE_POSGRADOS']); await v.findByText('No hay resultados con los filtros seleccionados.'); await ui.cleanup()
    v = mount(s, Requests, ['DIRECTOR']); await v.findByText('No tienes solicitudes asignadas.'); assert.equal(v.queryAllByLabelText('Tipo de solicitud').length, 0)
  })
  await t.test('proyectos redirige al nivel de estudiante y deniega perfiles sin permiso', async s => {
    let v = mount(s, Projects, ['ESTUDIANTE_POSGRADOS'], '/proyectos-investigacion/doctorado'); await v.findByText('Trabajo de investigación de maestría'); await v.findByText('No hay resultados con los filtros seleccionados.'); await ui.cleanup()
    v = mount(s, Projects, [], '/proyectos-investigacion/maestria'); await v.findByText('No tienes permisos para consultar este módulo.')
  })
  await t.test('coordinación puede consultar nivel doctoral y lista vacía', async s => {
    const v = mount(s, Projects, ['SECRETARIA_POSGRADOS'], '/proyectos-investigacion/doctorado'); await v.findByRole('heading', { name: 'Tesis doctoral' }); await v.findByText('No hay resultados con los filtros seleccionados.')
  })
  const Ubicacion = () => {
    const { pathname, search, hash, state } = useLocation()
    return h('output', null, JSON.stringify([pathname, search, hash, state, useNavigationType()]))
  }
  for (const [origen, destino, rol] of [
    ['/trabajos-grado', '/proyectos-investigacion/maestria', 'COORDINADOR_POSGRADOS'],
    ['/trabajos-grado/doctorado', '/proyectos-investigacion/doctorado', 'SECRETARIA_POSGRADOS'],
    ['/trabajos-grado/doctorado', '/proyectos-investigacion/maestria', 'ESTUDIANTE_POSGRADOS'],
    ['/trabajos-grado/doctorado/solicitudes/42', '/proyectos-investigacion/doctorado/solicitudes/42', 'COORDINADOR_POSGRADOS'],
  ]) {
    await t.test(`el enlace anterior ${origen} conserva el destino y el contexto para ${rol}`, async s => {
      s.after(ui.cleanup)
      const state = { solicitudBaseId: 10 }
      const user = { id: 10, roles: [rol], persona: {}, detalle: {}, estudiante: { id: 7, programaCodigoNombre: 'MISI' } }
      const view = ui.render(h(MemoryRouter, { initialEntries: [{ pathname: origen, search: '?origen=aviso', hash: '#detalle', state }] },
        h(AuthContext.Provider, { value: { user, session: { kind: 'SAPP', user } } },
          h(Ubicacion), h(Routes, null, trabajosGradoRoutes))))
      const esReintento = rol === 'ESTUDIANTE_POSGRADOS'
      await view.findByText(JSON.stringify([destino, '?origen=aviso', '#detalle', esReintento ? null : state, 'REPLACE']))
      if (esReintento) await view.findByRole('button', { name: 'Registrar solicitud' })
    })
  }
  await t.test('recordatorio de firma aparece solo si falta y permite descartar', async s => {
    let v = mount(s, Reminder); await v.findByText('Firma pendiente'); ui.fireEvent.click(v.getByRole('button', { name: 'Cerrar recordatorio de firma' })); assert.equal(v.queryAllByText('Firma pendiente').length, 0); await ui.cleanup()
    signature = { titulo: '', contenidoFirma: 'YWJj' }; v = mount(s, Reminder); await ui.act(async () => new Promise(r => setImmediate(r))); assert.equal(v.queryAllByText('Firma pendiente').length, 0)
  })
})

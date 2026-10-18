import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement as h } from 'react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('navegación, limpieza de sesión, plantillas y recordatorios', async t => {
  const ui = await reactApiHarness(t)
  const { default: Sidebar } = await ui.load('/src/components/Sidebar/Sidebar.tsx')
  const { default: Templates } = await ui.load('/src/pages/PlantillasCorreo/PlantillasCorreoPage.tsx')
  const { default: Reminders } = await ui.load('/src/modules/trabajos-grado/components/RecordatoriosCandidatura/RecordatoriosCandidatura.tsx')
  const { clearBrowserSession } = await ui.load('/src/modules/auth/session/clearBrowserSession.ts')
  const { AuthContext } = await ui.load('/src/context/Auth/context.ts')
  ui.dom.window.requestAnimationFrame = fn => { fn(); return 1 }
  let mobile, failure, assigned, notified, sent, logouts
  ui.dom.window.matchMedia = () => ({ matches: mobile, addEventListener() {}, removeEventListener() {} })
  t.beforeEach(() => {
    mobile = false; failure = false; assigned = []; notified = false; sent = 0; logouts = 0
    delete ui.dom.window.caches; delete ui.dom.window.indexedDB; delete ui.dom.window.navigator.serviceWorker
    ui.response((url, init) => {
      const path = new URL(url, 'https://test.invalid').pathname
      if (failure) return Response.json({ message: 'Servicio no disponible' }, { status: 503 })
      if (path.includes('/entrevistasPorEvaluador')) return Response.json({ ok: true, data: assigned })
      if (path.endsWith('/plantillasCorreo')) return Response.json({ ok: true, data: Array.from({ length: 12 }, (_, i) => ({ id: i + 1, nombre: `Plantilla ${i + 1}`, descripcion: `Descripción ${i + 1}`, idioma: i % 2 ? 'EN' : 'ES' })) })
      if (path.endsWith('/vigente')) return Response.json({ ok: true, data: [{ tipoTramite: { nombre: 'MATRICULA' }, periodo: { notificacionCandidaturaEnviada: notified } }] })
      if (path.endsWith('/recordatorio-candidatura') && init.method === 'POST') { sent++; return Response.json({ ok: true, data: { correosEnviados: 2 } }) }
      throw new Error(`Petición inesperada: ${url}`)
    })
  })
  const Dest = () => h('p', null, `Destino ${useLocation().pathname}`)
  const mount = (s, Component = Sidebar, roles = ['SECRETARIA_POSGRADOS']) => { s.after(ui.cleanup); const user = { id: 10, roles }; return ui.render(h(MemoryRouter, { initialEntries: ['/prueba'] }, h(AuthContext.Provider, { value: { user, session: { kind: 'SAPP', user }, logout: () => logouts++ } }, h(Routes, null, h(Route, { path: '/prueba', element: h(Component) }), h(Route, { path: '*', element: h(Dest) }))))) }
  await t.test('menú móvil abre, contiene foco y restaura desplazamiento al cerrar', async s => {
    mobile = true; const v = mount(s); const open = v.getByRole('button', { name: 'Abrir menú principal' }); ui.fireEvent.click(open); const panel = v.getByRole('dialog')
    assert.equal(ui.dom.window.document.body.style.overflow, 'hidden'); const focusable = panel.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'); focusable[0].focus(); ui.fireEvent.keyDown(ui.dom.window.document, { key: 'Tab', shiftKey: true }); assert.equal(ui.dom.window.document.activeElement, focusable[focusable.length - 1])
    ui.fireEvent.keyDown(ui.dom.window.document, { key: 'Escape' }); assert.equal(open.getAttribute('aria-expanded'), 'false'); assert.equal(ui.dom.window.document.body.style.overflow, '')
  })
  await t.test('submenú de matrícula abre y cierra; cerrar sesión invoca contexto', async s => {
    const v = mount(s); ui.fireEvent.click(v.getByRole('button', { name: 'Desplegar Matrícula' })); assert.ok(v.getByRole('link', { name: 'Matrícula académica' })); ui.fireEvent.click(v.getByRole('button', { name: 'Contraer Matrícula' })); assert.equal(v.queryAllByRole('link', { name: 'Matrícula académica' }).length, 0)
    ui.fireEvent.click(v.getByRole('button', { name: 'Cerrar sesión' })); assert.equal(logouts, 1)
  })
  await t.test('docente sin entrevistas oculta admisiones; fallo temporal conserva acceso', async s => {
    let v = mount(s, Sidebar, ['DOCENTE_POSGRADOS']); await ui.waitFor(() => assert.equal(ui.requests.filter(r => r.url.includes('entrevistasPorEvaluador')).length > 0, true)); await ui.act(async () => new Promise(r => setImmediate(r))); assert.equal(v.queryAllByRole('link', { name: 'Admisiones', exact: true }).length, 0)
    await ui.cleanup(); failure = true; v = mount(s, Sidebar, ['DOCENTE_POSGRADOS']); await v.findByRole('link', { name: 'Admisiones', exact: true })
  })
  await t.test('limpieza elimina cookies y ambos almacenamientos del origen aislado', async () => {
    ui.dom.window.document.cookie = 'sesion=prueba; path=/'; ui.dom.window.localStorage.setItem('token', 'sintético'); ui.dom.window.sessionStorage.setItem('draft', 'sintético')
    await clearBrowserSession(); assert.equal(ui.dom.window.document.cookie, ''); assert.equal(ui.dom.window.localStorage.length, 0); assert.equal(ui.dom.window.sessionStorage.length, 0)
  })
  await t.test('limpieza tolera cachés fallidas, bases bloqueadas y solicitudes en curso', async () => {
    const deleted = [], databases = [], unregistered = []
    ui.dom.window.caches = { keys: async () => ['a', 'b'], delete: async name => { deleted.push(name); ui.dom.window.localStorage.setItem('tardio', 'x'); if (name === 'b') throw Error('cache ocupada'); return true } }
    ui.dom.window.indexedDB = { databases: async () => [{ name: 'a' }, { name: 'b' }, {}], deleteDatabase: name => { databases.push(name); const request = {}; queueMicrotask(() => name === 'a' ? request.onsuccess?.() : request.onblocked?.()); return request } }
    Object.defineProperty(ui.dom.window.navigator, 'serviceWorker', { configurable: true, value: { getRegistrations: async () => [{ unregister: async () => unregistered.push(true) }] } })
    await clearBrowserSession(); assert.deepEqual(deleted.sort(), ['a', 'b']); assert.deepEqual(databases.sort(), ['a', 'b']); assert.equal(unregistered.length, 1); assert.equal(ui.dom.window.localStorage.length, 0)
  })
  await t.test('plantillas pagina, filtra idioma y busca sin depender de tildes', async s => {
    const v = mount(s, Templates); await v.findByText('Página 1 de 2'); ui.fireEvent.click(v.getByRole('button', { name: 'Siguiente' })); await v.findByText('Página 2 de 2')
    ui.fireEvent.change(v.getByLabelText('Idioma'), { target: { value: 'ES' } }); assert.equal(v.container.querySelectorAll('tbody tr').length, 6)
    ui.fireEvent.change(v.getByLabelText('Buscar por nombre o descripción'), { target: { value: 'descripcion 12' } }); assert.ok(v.getByText('No hay plantillas que coincidan con los filtros.')); ui.fireEvent.click(v.getByRole('button', { name: 'Limpiar filtros' })); assert.equal(v.container.querySelectorAll('tbody tr').length, 10)
    ui.fireEvent.click(v.getAllByRole('button', { name: 'Editar' })[0]); await v.findByText(/Destino .*1\/editar/)
  })
  await t.test('fallo de catálogo de plantillas se informa', async s => { failure = true; const v = mount(s, Templates); await v.findByText(/Servicio no disponible/); assert.equal(v.container.querySelectorAll('tbody tr').length, 0) })
  await t.test('recordatorios ya notificados no ofrecen nuevo envío', async s => { notified = true; const v = mount(s, Reminders); await ui.act(async () => new Promise(r => setImmediate(r))); assert.equal(v.container.textContent, ''); assert.equal(sent, 0) })
  await t.test('recordatorios requieren confirmación y muestran cantidad simulada', async s => {
    const v = mount(s, Reminders); await v.findByRole('button', { name: 'Enviar recordatorios' }); ui.fireEvent.click(v.getByRole('button', { name: 'Enviar recordatorios' })); ui.fireEvent.click(v.getByRole('button', { name: 'Cancelar' })); assert.equal(sent, 0)
    ui.fireEvent.click(v.getByRole('button', { name: 'Enviar recordatorios' })); ui.fireEvent.click(v.getByRole('button', { name: 'Confirmar y enviar' })); await v.findByText('Se enviaron 2 recordatorios de examen de candidatura doctoral.'); assert.equal(sent, 1)
  })
  await t.test('fallo de recordatorios conserva confirmación y permite reintento', async s => {
    const v = mount(s, Reminders); await v.findByRole('button', { name: 'Enviar recordatorios' }); ui.fireEvent.click(v.getByRole('button', { name: 'Enviar recordatorios' })); failure = true; ui.fireEvent.click(v.getByRole('button', { name: 'Confirmar y enviar' })); await v.findAllByText(/Servicio no disponible/)
    failure = false; ui.fireEvent.click(v.getByRole('button', { name: 'Confirmar y enviar' })); await v.findByText('Se enviaron 2 recordatorios de examen de candidatura doctoral.')
  })
})

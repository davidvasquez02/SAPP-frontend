import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement as h } from 'react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('presentación y rutas: tarjetas, resultados, accesos y tarifas', async t => {
  const ui = await reactApiHarness(t)
  const modules = {}
  for (const [key, path] of Object.entries({ Card: 'modules/solicitudes/components/SolicitudCard/SolicitudCard', Grid: 'modules/solicitudes/components/SolicitudesCoordinadorGrid/SolicitudesCoordinadorGrid', Evaluation: 'modules/trabajos-grado/evaluacion/ProcesoEvaluacionEstudiante', Home: 'pages/Home/HomePage', Interviews: 'pages/AdmisionesMisEntrevistas/AdmisionesMisEntrevistasPage', Admin: 'pages/AdministracionAcademica/AdministracionAcademicaLayout', Redirect: 'app/routes/LegacyMatriculaDetailRedirect' })) modules[key] = (await ui.load(`/src/${path}.tsx`)).default
  const { MatriculaHomePage } = await ui.load('/src/pages/MatriculaHome/MatriculaHomePage.tsx')
  const { TarifasMatriculaPage } = await ui.load('/src/pages/MatriculaFinanciera/TarifasMatriculaPage.tsx')
  const { AppRoutes } = await ui.load('/src/app/routes/index.tsx')
  const { AuthContext } = await ui.load('/src/context/Auth/context.ts')
  let writes, fail
  ui.dom.window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} })
  t.beforeEach(() => { writes = []; fail = false; ui.response((url, init) => {
    if (fail) return Response.json({ message: 'Tarifa no disponible' }, { status: 503 })
    if (init.method === 'PUT') { writes.push(JSON.parse(init.body)); return Response.json({ ok: true, data: {} }) }
    const path = new URL(url, 'https://test.invalid').pathname
    if (path.endsWith('/programaAcademico')) return Response.json({ ok: true, data: [{ id: 1, nombre: 'Maestría' }] })
    if (path.endsWith('/tarifas')) return Response.json({ ok: true, data: [{ id: 5, semestreDesde: 1, semestreHasta: 4, factorMatricula: 3, factorDerechos: 1, activo: true }] })
    return Response.json({ ok: true, data: null })
  }) })
  const mount = (s, element, { path = '/prueba', roles = ['SECRETARIA_POSGRADOS'], authenticated = true, username = '' } = {}) => { s.after(ui.cleanup); const user = { id: 10, username, roles, persona: {} }; return ui.render(h(MemoryRouter, { initialEntries: [path] }, h(AuthContext.Provider, { value: { user, session: { kind: 'SAPP', user }, isAuthenticated: authenticated } }, element))) }
  const row = { id: 1, estudiante: 'persona sintética', codigoEstudianteUis: '20207', tipoSolicitud: 'OTRA', tipoSolicitudCodigo: 'OTRA', estadoSigla: 'APROBADA', programaAcademico: 'MISI', fechaRegistro: '2030-01-01', fechaResolucion: null }
  await t.test('tarjeta admite teclado y grilla distingue carga/error/vacío', async s => {
    let clicks = 0; let v = mount(s, h(modules.Card, { solicitud: row, onClick: () => clicks++ })); ui.fireEvent.keyDown(v.getByRole('button'), { key: 'Enter' }); ui.fireEvent.keyDown(v.getByRole('button'), { key: ' ' }); assert.equal(clicks, 2); assert.ok(v.getByText('Sin resolución')); await ui.cleanup()
    for (const [props, text] of [[{ loading: true }, 'Cargando solicitudes...'], [{ error: 'Error de consulta' }, 'Error de consulta'], [{}, 'No hay solicitudes para mostrar.'], [{ solicitudes: [row] }, 'Total solicitudes: 1']]) { v = mount(s, h(modules.Grid, { solicitudes: [], ...props })); assert.ok(v.getByText(text)); await ui.cleanup() }
  })
  await t.test('resultado estudiantil excluye jurados inactivos y muestra sustentación virtual', async s => {
    const proceso = { tipoSolicitudCodigo: 'CAND_DOCTORAL', notaFinal: 4.5, resultado: 'APROBADO', fechaResultado: '2030-01-01', modalidadSustentacion: 'VIRTUAL', fechaSustentacion: '2030-01-02T10:00:00', enlaceSustentacion: 'https://meet.example.test/', jurados: [{ id: 1, nombre: 'Jurado activo', activo: true, evaluaciones: [] }, { id: 2, nombre: 'Jurado inactivo', activo: false, evaluaciones: [] }] }
    const v = mount(s, h(modules.Evaluation, { proceso })); assert.ok(v.getByText('Jurado activo')); assert.equal(v.queryAllByText('Jurado inactivo').length, 0); assert.ok(v.getByText('Evaluación pendiente.'))
  })
  await t.test('Matrícula muestra un calendario con check y Proyectos de investigación un birrete', s => {
    const view = mount(s, h(modules.Home))
    const calendar = view.getByRole('link', { name: 'Matrícula', exact: true }).querySelector('svg')
    const cap = view.getByRole('link', { name: 'Proyectos de investigación', exact: true }).querySelector('svg')
    assert.ok(calendar?.querySelector('rect'))
    assert.ok(calendar?.querySelector('path[d*="m-13 5 3 3 5-5"]'))
    assert.ok(cap?.querySelector('path[d="M22 10v6"]'))
  })
  await t.test('inicio y matrícula ofrecen accesos coherentes con perfil', async s => {
    let v = mount(s, h(modules.Home)); assert.ok(v.getByRole('link', { name: 'Estudiantes' })); await ui.cleanup(); v = mount(s, h(MatriculaHomePage), { roles: ['ESTUDIANTE_POSGRADOS'] }); assert.ok(v.getByRole('link', { name: /Liquidación/ }))
  })
  await t.test('listado de entrevistas conserva ruta de inscripción asignada', async s => {
    const Dest = () => h('p', null, useLocation().pathname)
    const v = mount(s, h(Routes, null, h(Route, { path: '/prueba', element: h(modules.Interviews) }), h(Route, { path: '/admisiones/*', element: h(Dest) })))
    ui.fireEvent.click(v.getAllByRole('button', { name: 'Calificar entrevista' })[0]); await v.findByText(/\/admisiones\/convocatoria\/.+\/entrevistas/)
  })
  await t.test('rutas completas bloquean sesión ausente antes de mostrar contenido', async s => {
    const v = mount(s, h(AppRoutes), { authenticated: false, path: '/' }); assert.ok(v.getByText('No hay una sesión institucional activa.'))
  })
  await t.test('tarifas permite editar factores y preserva identidad de tarifa', async s => {
    const v = mount(s, h(TarifasMatriculaPage)); await v.findByRole('option', { name: 'Maestría' }); ui.fireEvent.change(v.getByLabelText('Programa'), { target: { value: '1' } }); await v.findByText('Semestres 1 a 4'); ui.fireEvent.click(v.getByRole('button', { name: 'Editar tarifa' })); ui.fireEvent.change(v.getByLabelText('Factor matrícula'), { target: { value: '4' } }); ui.fireEvent.submit(v.container.querySelector('form')); await v.findByText('Tarifa guardada. Recalcula los procesos que deban aplicar esta modificación.'); assert.equal(writes[0].factorMatricula, 4)
  })
})

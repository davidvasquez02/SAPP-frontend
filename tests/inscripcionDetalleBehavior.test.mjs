import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement as h } from 'react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('detalle de inscripción: perfiles, navegación y finalización', async t => {
  const ui = await reactApiHarness(t)
  const { default: Page } = await ui.load('/src/pages/InscripcionAdmisionDetalle/InscripcionAdmisionDetallePage.tsx')
  const { AuthContext } = await ui.load('/src/context/Auth/context.ts')
  const { evaluacionCache } = await ui.load('/src/modules/admisiones/pages/EvaluacionEtapaPage/evaluacionPrefetchCache.ts')
  const { invalidateInscripcionDocumentosCache } = await ui.load('/src/pages/InscripcionDocumentos/documentosPrefetchCache.ts')
  let detail, enabled, stageItems, failure, mutations, reads
  ui.dom.window.requestAnimationFrame = fn => { fn(); return 1 }
  t.beforeEach(() => {
    evaluacionCache.clear(); invalidateInscripcionDocumentosCache(160)
    detail = { id: 160, nombreAspirante: 'Persona sintética', estado: 'EN_EVALUACION', numeroDocumento: '123456', emailPersonal: 'prueba@example.test', telefono: '000', programaAcademico: 'Maestría de prueba', periodoAcademico: '2030-1', fechaInscripcion: 'fecha desconocida', foto: { contenidoBase64: 'YWJj', mimeType: 'image/png' } }
    enabled = true; stageItems = [{ id: 1, puntajeAspirante: 4, puntajeMax: 5 }]; failure = ''; mutations = []; reads = []
    ui.response((url, init) => {
      const u = new URL(url, 'https://test.invalid'); const path = u.pathname
      if (init.method === 'POST' || init.method === 'PUT') {
        mutations.push(path)
        if (failure && path.includes(failure)) return Response.json({ ok: false, message: 'Operación no disponible' })
        if (path.includes('iniciarEvaluacion')) enabled = true
        if (path.includes('cambioEstadoVal')) detail.estado = 'VALIDANDO_DOCUMENTOS'
        return Response.json({ ok: true, data: null })
      }
      reads.push(u)
      if (path.endsWith('/convocatoria/107')) return Response.json({ ok: true, data: [detail] })
      if (path.endsWith('/document')) return Response.json({ ok: true, data: [] })
      if (path.endsWith('/evaluacionAdmision/info')) {
        const etapa = u.searchParams.get('etapa')
        if (etapa && failure === etapa) return Response.json({ ok: false, message: 'Etapa no disponible' })
        return Response.json({ ok: etapa ? true : enabled, data: etapa ? stageItems : null, message: 'Evaluación pendiente' })
      }
      throw new Error(`Petición inesperada: ${url}`)
    })
  })
  const Child = () => h('p', null, `Sección activa: ${useLocation().pathname.split('/').at(-1)}`)
  const mount = (s, { roles = ['SECRETARIA_POSGRADOS'], section = '', state } = {}) => {
    s.after(ui.cleanup)
    const user = { username: 'sintetico', roles }
    return ui.render(h(MemoryRouter, { initialEntries: [{ pathname: `/admisiones/convocatoria/107/inscripcion/160${section ? '/' + section : ''}`, state }] },
      h(AuthContext.Provider, { value: { session: { kind: 'SAPP', user }, user } },
        h(Routes, null, h(Route, { path: '/admisiones/convocatoria/:convocatoriaId/inscripcion/:inscripcionId', element: h(Page) },
          ...['documentos', 'hoja-vida', 'examen', 'entrevistas'].map(path => h(Route, { key: path, path, element: h(Child) })))))))
  }
  const ready = async v => {
    await ui.waitFor(() => assert.equal(v.container.querySelector('[aria-busy]').getAttribute('aria-busy'), 'false'))
  }
  const click = (v, name) => ui.fireEvent.click(v.getByRole('button', { name }))
  const confirm = v => { click(v, 'Finalizar inscripción'); click(v, 'Calcular y finalizar') }

  await t.test('muestra identidad, fotografía y metadatos ampliables', async s => {
    const v = mount(s); await ready(v)
    assert.ok(v.getByText('Persona sintética')); assert.ok(v.getByText('prueba@example.test'))
    assert.equal(v.getByAltText('Foto de Persona sintética').getAttribute('src'), 'data:image/png;base64,YWJj')
    assert.ok(v.getByText('fecha desconocida'))
    const toggle = v.getByRole('button', { name: 'Datos de la inscripción' })
    assert.equal(toggle.getAttribute('aria-expanded'), 'false'); ui.fireEvent.click(toggle)
    assert.equal(toggle.getAttribute('aria-expanded'), 'true')
  })
  await t.test('abrir y cerrar sección conserva navegación del acordeón', async s => {
    const v = mount(s); await ready(v); click(v, /^Hoja de vida/)
    await v.findByText('Sección activa: hoja-vida'); click(v, /^Hoja de vida/)
    await ui.waitFor(() => assert.equal(v.queryAllByText('Sección activa: hoja-vida').length, 0))
    click(v, /^Examen de conocimiento/); await v.findByText('Sección activa: examen')
  })
  await t.test('evaluación pendiente bloquea etapas y finalizar hasta iniciar', async s => {
    enabled = false; const v = mount(s, { section: 'documentos' }); await ready(v)
    assert.equal(v.getByRole('button', { name: /^Hoja de vida/ }).disabled, true)
    assert.equal(v.getByRole('button', { name: 'Finalizar inscripción' }).disabled, true)
    click(v, 'Iniciar proceso de evaluación')
    await ui.waitFor(() => assert.equal(v.getByRole('button', { name: 'Finalizar inscripción' }).disabled, false))
    assert.equal(mutations.filter(x => x.includes('iniciarEvaluacion')).length, 1)
  })
  await t.test('fallo al iniciar se informa y no habilita finalización', async s => {
    enabled = false; failure = 'iniciarEvaluacion'; const v = mount(s, { section: 'documentos' }); await ready(v)
    click(v, 'Iniciar proceso de evaluación'); await v.findByText(/Operación no disponible/)
    assert.equal(v.getByRole('button', { name: 'Finalizar inscripción' }).disabled, true)
  })
  await t.test('docente consulta solo entrevista y se dirige a ella', async s => {
    const v = mount(s, { roles: ['DOCENTE_POSGRADOS'] }); await ready(v)
    await v.findByText('Sección activa: entrevistas')
    assert.equal(v.queryAllByRole('button', { name: /^Documentos cargados|^Hoja de vida|^Examen de conocimiento|Finalizar inscripción/ }).length, 0)
    const evaluationReads = reads.filter(u => u.pathname.endsWith('/evaluacionAdmision/info'))
    assert.equal(evaluationReads.length, 1); assert.equal(evaluationReads[0].searchParams.get('etapa'), 'ENTREVISTA')
    assert.equal(reads.filter(u => u.pathname.endsWith('/document')).length, 0)
  })
  await t.test('fallo de entrevista del docente se informa sin consultar otras etapas', async s => {
    failure = 'ENTREVISTA'; const v = mount(s, { roles: ['DOCENTE_POSGRADOS'] }); await ready(v)
    assert.ok(v.getAllByText(/Etapa no disponible/).length)
    assert.equal(reads.filter(u => u.pathname.endsWith('/evaluacionAdmision/info')).length, 1)
  })
  await t.test('estado admitido no permite finalizar nuevamente', async s => {
    detail.estado = 'ADMITIDO'; const v = mount(s); await ready(v)
    assert.equal(v.queryAllByRole('button', { name: 'Finalizar inscripción' }).length, 0)
    assert.equal(mutations.length, 0)
  })
  await t.test('cancelar y Escape cierran confirmación sin llamadas de escritura', async s => {
    const v = mount(s); await ready(v); click(v, 'Finalizar inscripción'); click(v, 'Cancelar')
    assert.equal(v.queryAllByRole('dialog').length, 0)
    click(v, 'Finalizar inscripción'); ui.fireEvent.keyDown(ui.dom.window, { key: 'Escape' })
    assert.equal(v.queryAllByRole('dialog').length, 0); assert.equal(mutations.length, 0)
  })
  await t.test('etapas sin componentes bloquean cálculo y finalización', async s => {
    stageItems = []; const v = mount(s); await ready(v); confirm(v)
    await v.findByText('La etapa ENTREVISTA no tiene componentes.')
    assert.equal(v.getAllByRole('listitem').filter(x => /no tiene componentes/.test(x.textContent)).length, 3)
    assert.equal(mutations.length, 0)
  })
  await t.test('puntajes fuera de rango bloquean cálculo y finalización', async s => {
    stageItems = [{ id: 1, puntajeAspirante: 6, puntajeMax: 5 }]
    const v = mount(s); await ready(v); confirm(v)
    await v.findByText('Faltan puntajes o hay puntajes fuera de rango en ENTREVISTA.')
    assert.equal(mutations.length, 0)
  })
  await t.test('finalización válida calcula antes de cerrar y muestra confirmación', async s => {
    const v = mount(s); await ready(v); confirm(v)
    await v.findByText('Inscripción finalizada correctamente.')
    assert.deepEqual(mutations.map(x => x.split('/').at(-2)), ['calcularPuntajes', 'finalizarEvaluacion'])
  })
  await t.test('fallo de cálculo impide cerrar y permite repetir confirmación', async s => {
    failure = 'calcularPuntajes'; const v = mount(s); await ready(v); confirm(v)
    await v.findByText('Operación no disponible')
    assert.equal(mutations.filter(x => x.includes('finalizarEvaluacion')).length, 0)
    failure = ''; confirm(v); await v.findByText('Inscripción finalizada correctamente.')
    assert.equal(mutations.length, 3)
  })
  await t.test('abrir documentos cambia estado por validar una sola vez', async s => {
    detail.estado = 'POR_VALIDAR_DOCUMENTOS'
    const v = mount(s, { state: { inscripcionEstado: 'POR_VALIDAR_DOCUMENTOS' } }); await ready(v)
    click(v, /^Documentos cargados/)
    await ui.waitFor(() => assert.equal(mutations.filter(x => x.includes('cambioEstadoVal')).length, 1))
    await ui.waitFor(() => assert.ok(v.getAllByText('VALIDANDO DOCUMENTOS').length))
    click(v, /^Documentos cargados/); click(v, /^Documentos cargados/)
    assert.equal(mutations.filter(x => x.includes('cambioEstadoVal')).length, 1)
  })
})

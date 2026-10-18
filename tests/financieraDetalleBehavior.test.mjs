import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement as h } from 'react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('financiera: detalle, respuestas, parámetros y certificado', async t => {
  const ui = await reactApiHarness(t)
  const { LiquidacionDetallePage: Detail } = await ui.load('/src/pages/MatriculaFinanciera/LiquidacionDetallePage.tsx')
  const { RespuestasForm: Answers } = await ui.load('/src/pages/MatriculaFinanciera/RespuestasForm.tsx')
  const { ParametrosProcesoForm: Parameters } = await ui.load('/src/pages/MatriculaFinanciera/ParametrosProcesoForm.tsx')
  const { CertificadoVotacion: Certificate } = await ui.load('/src/pages/MatriculaFinanciera/CertificadoVotacion.tsx')
  const { AuthContext } = await ui.load('/src/context/Auth/context.ts')
  let row, process, writes, fail, changed, pending, valid
  t.beforeEach(() => {
    row = { id: 50, procesoId: 9, nombreCompleto: 'Persona prueba', codigoEstudiante: '20207', programa: 'MISI', estado: 'RESPONDIDA', tipoEstudiante: 'NUEVO', semestre: 2, totalFinal: 1000, ajusteManual: 0, respuestas: { certificadoVotacion: false, deseaSalud: false, entregoTrabajoGrado: false, cumLaude: false }, alertas: [], calculo: null }
    process = { id: 9, periodoId: 7, periodo: '2030-1', estado: 'CERRADO', valorSmmlv: 1000000, porcentajeSalud: 10, porcentajeVotacion: 10, fechaLimiteRespuesta: '2030-01-01' }; writes = []; fail = false; changed = 0; pending = null; valid = null
    ui.response((url, init) => {
      const path = new URL(url, 'https://test.invalid').pathname
      if (fail) return Response.json({ message: 'Operación no disponible' }, { status: 409 })
      if (init.method === 'PUT' || init.method === 'POST') { writes.push({ path, body: init.body ? JSON.parse(init.body) : null }); return Response.json({ ok: true, data: path.endsWith('/document') ? { id: 80 } : row }) }
      if (path.endsWith('/procesos/9')) return Response.json({ ok: true, data: process })
      if (path.endsWith('/liquidaciones/50')) return Response.json({ ok: true, data: row })
      if (path.endsWith('/document')) return Response.json({ ok: true, data: [{ idTipoDocumentoTramite: 4, codigoTipoDocumentoTramite: 'ANX-39' }] })
      throw new Error(`Petición inesperada: ${url}`)
    })
  })
  const mount = (s, Component, props = {}, path = '/procesos/9/liquidaciones/50') => {
    s.after(ui.cleanup); const user = { id: 10, roles: ['SECRETARIA_POSGRADOS'] }
    return ui.render(h(MemoryRouter, { initialEntries: [path] }, h(AuthContext.Provider, { value: { user, session: { kind: 'SAPP', user } } }, h(Routes, null, h(Route, { path: '/procesos/:procesoId/liquidaciones/:liquidacionId', element: h(Component, props) })))))
  }
  const click = (v, name) => ui.fireEvent.click(v.getByRole('button', { name, exact: true }))
  const set = (v, name, value) => ui.fireEvent.change(v.getByLabelText(name), { target: { value } })
  await t.test('detalle valida pertenencia al proceso y permite reconsultar', async s => {
    row.procesoId = 8; const v = mount(s, Detail); await v.findByText('La liquidación no pertenece a este proceso.'); row.procesoId = 9; click(v, 'Reintentar consulta'); await v.findByText(/20207/)
  })
  await t.test('proceso publicado presenta solo consulta sin editar respuestas', async s => {
    process.estado = 'PUBLICADO'; const v = mount(s, Detail); await v.findByText('El proceso está publicado. Solo se permite consulta.'); assert.equal(v.queryAllByRole('button', { name: 'Editar respuestas' }).length, 0)
  })
  await t.test('editar respuestas en detalle permite cancelar sin escribir', async s => {
    const v = mount(s, Detail); await v.findByText(/20207/); click(v, 'Editar respuestas'); await v.findByText('Estás editando en nombre del estudiante.'); click(v, 'Cancelar edición'); assert.equal(writes.length, 0)
  })
  await t.test('certificado diferido anuncia carga pendiente y se envía al confirmar', async s => {
    const props = { liquidacionId: 50, editable: true, deferredUpload: true, onChange: () => changed++, onPendingUploadChange: callback => { pending = callback }, onValidChange: value => { valid = value } }
    const v = mount(s, Certificate, props); await v.findByText('Sin documento cargado.'); assert.equal(valid, false)
    const bytes = new TextEncoder().encode('%PDF-certificado'); const file = new ui.dom.window.File([bytes], 'certificado.pdf', { type: 'application/pdf' }); file.arrayBuffer = async () => bytes.buffer
    ui.fireEvent.change(v.container.querySelector('input[type=file]'), { target: { files: [file] } }); assert.equal(typeof pending, 'function'); await ui.act(async () => { assert.equal(await pending(), true) }); assert.equal(changed, 0); assert.equal(writes[0].body.tramiteId, 50); assert.match(writes[0].body.checksum, /^[a-f0-9]{64}$/)
  })
  await t.test('respuestas estudiantiles esperan certificado antes de guardar', async s => {
    const saves = []; const dirty = []; const questions = [{ clave: 'certificadoVotacion', texto: '¿Certificado?', aplica: true }, { clave: 'deseaSalud', texto: '¿Salud?', aplica: true }]
    const v = mount(s, Answers, { respuestas: { certificadoVotacion: false, deseaSalud: false }, tipo: 'NUEVO', preguntas: questions, editable: true, busy: false, onSave: async body => { saves.push(body); return true }, onDirtyChange: d => dirty.push(d) })
    ui.fireEvent.click(ui.within(v.getByText('¿Certificado?').closest('fieldset')).getByLabelText('Sí')); assert.equal(v.getByRole('button', { name: 'Guardar respuestas' }).disabled, true)
    ui.fireEvent.click(ui.within(v.getByText('¿Certificado?').closest('fieldset')).getByLabelText('No')); click(v, 'Guardar respuestas'); await ui.waitFor(() => assert.equal(saves.length, 1)); assert.equal(saves[0].certificadoVotacion, false); assert.equal(dirty.at(-1), false)
  })
  await t.test('respuestas de coordinación recortan notas y conservan estado sucio si falla guardado', async s => {
    const saves = [], dirty = []; const v = mount(s, Answers, { respuestas: { certificadoVotacion: true, deseaSalud: false }, tipo: 'NUEVO', preguntas: [{ clave: 'certificadoVotacion', texto: '¿Certificado?', aplica: true }, { clave: 'deseaSalud', texto: '¿Salud?', aplica: true }], editable: true, coordinacion: true, busy: false, onSave: async body => { saves.push(body); return false }, onDirtyChange: d => dirty.push(d) })
    set(v, 'Observaciones (opcional)', '  Nota de revisión  '); click(v, 'Registrar respuestas'); await ui.waitFor(() => assert.equal(saves.length, 1)); assert.equal(saves[0].observaciones, 'Nota de revisión'); assert.equal(saves[0].certificadoVotacionRecibido, true); assert.equal(dirty.at(-1), true)
  })
  await t.test('parámetros nuevos convierten números y fuente normativa recortada', async s => {
    const saves = []; const v = mount(s, Parameters, { periodos: [{ id: 7, anioPeriodo: '2030 - 1' }], busy: false, onCancel: () => changed++, onSave: async body => saves.push(body) })
    set(v, 'Periodo académico', '7'); set(v, /Valor del SMMLV/, '1000000'); set(v, /Fuente normativa/, '  Fuente  '); set(v, /Fecha límite/, '2030-01-01'); ui.fireEvent.submit(v.container.querySelector('form'))
    assert.equal(saves[0].periodoId, 7); assert.equal(saves[0].valorSmmlv, 1000000); assert.equal(saves[0].fuenteSmmlv, 'Fuente'); assert.equal(saves[0].baseSalud, 'SMMLV'); click(v, 'Cancelar'); assert.equal(changed, 1)
  })
  await t.test('id inválido no consulta liquidación', async s => { const before = ui.requests.length; const v = mount(s, Detail, {}, '/procesos/invalido/liquidaciones/50'); await v.findByText('La liquidación solicitada no es válida.'); assert.equal(ui.requests.length, before) })
})

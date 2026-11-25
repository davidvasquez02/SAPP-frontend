import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('evaluación React: jurados, estados, directorio y sustentación', async t => {
  const ui = await reactApiHarness(t)
  window.requestAnimationFrame = callback => { callback(); return 1 }
  const { default: Panel } = await ui.load('/src/modules/trabajos-grado/evaluacion/ProcesoEvaluacionPanel.tsx')
  const jurado = { id: 1, nombre: 'Jurado inicial', correo: 'jurado@example.test', institucion: 'Universidad de prueba', externo: true, idioma: 'ES', activo: true, estadoInvitacion: 'ACEPTADA', evaluaciones: [] }
  let proceso, failure, calls, updated, added
  const ok = data => Response.json({ ok: true, data })
  t.beforeEach(() => {
    proceso = { id: 9, solicitudAcademicaId: 42, tipoSolicitudCodigo: 'DEF_TESIS_DCC', titulo: 'Tesis de prueba', estadoSolicitud: 'JUR_POR_DESIG', documentoEvaluarId: 101, fechaLimiteEvaluacion: '2027-12-01', jurados: [jurado] }
    failure = ''; calls = []; updated = 0; added = 0
    ui.response((url, init) => {
      const parsed = new URL(url, 'https://example.test'), path = parsed.pathname
      if (failure && path.includes(failure)) return Response.json({ message: 'Servicio temporalmente no disponible' }, { status: 503 })
      if (path.endsWith('/catalogos')) return ok({ modalidades: [{ codigo: 'HIBRIDA', nombre: 'Híbrida' }, { codigo: 'PRESENCIAL', nombre: 'Presencial' }, { codigo: 'VIRTUAL', nombre: 'Virtual' }], resultados: [{ codigo: 'APROBADO', nombre: 'Aprobado' }], momentos: [], conceptos: [], estadosInvitacion: [] })
      if (path.endsWith('/42/historial')) return ok([])
      if (path.endsWith('/jurados/banco')) return ok([{ nombre: 'Ana de prueba', correo: 'ana@example.test', institucion: 'UIS', idioma: 'EN', externo: false, participaciones: 2 }])
      if (path.endsWith('/solicitud/42')) return ok(proceso)
      const body = init.body ? JSON.parse(init.body) : null
      calls.push({ path, method: init.method, body })
      if (path.includes('/documento-evaluar/')) proceso = { ...proceso, documentoEvaluarId: Number(path.split('/').at(-1)) }
      else if (path.endsWith('/jurados')) proceso = { ...proceso, jurados: [...proceso.jurados, { ...body.jurados[0], id: 2, activo: true, estadoInvitacion: 'PENDIENTE', evaluaciones: [] }] }
      else if (path.endsWith('/jurados/1') && init.method === 'PUT') proceso = { ...proceso, jurados: [{ ...jurado, activo: false }, { ...body, id: 2, activo: true, estadoInvitacion: 'PENDIENTE', evaluaciones: [] }] }
      else if (path.endsWith('/jurados/1') && init.method === 'DELETE') proceso = { ...proceso, jurados: [{ ...jurado, activo: false }] }
      else if (path.endsWith('/reenviar-invitacion')) { /* Conserva proceso tras reenviar. */ }
      else if (path.endsWith('/ajustes')) proceso = { ...proceso, estadoSolicitud: 'EN_AJUSTES' }
      else if (path.endsWith('/sustentacion')) proceso = { ...proceso, estadoSolicitud: 'SUST_PROGRAMADA', ...body }
      else throw new Error(`Petición inesperada: ${path}`)
      return ok(proceso)
    })
  })
  const mount = s => {
    s.after(ui.cleanup)
    return ui.render(createElement(Panel, { solicitudId: 42, documentos: [{ idDocumento: 101, nombreArchivo: 'tesis.pdf' }, { idDocumento: 102, nombreArchivo: 'correccion.pdf' }], actas: [], onUpdated: async () => { updated++ }, onJuradoAdded: async () => { added++ } }))
  }
  const ready = async view => { await view.findByRole('heading', { name: 'Proceso de evaluación' }) }
  const fill = view => {
    for (const [label, value] of [[/^Nombre/, 'Nueva jurado'], [/^Correo/, 'nueva@example.test'], [/^Institución/, 'Universidad de prueba']]) ui.fireEvent.change(view.getByLabelText(label), { target: { value } })
  }

  await t.test('carga fallida permite reintentar sin acciones prematuras', async s => {
    failure = '/solicitud/42'
    const view = mount(s)
    await view.findByText('Servicio temporalmente no disponible')
    assert.equal(view.queryAllByRole('button', { name: /Agregar evaluador/ }).length, 0)
    failure = ''
    ui.fireEvent.click(view.getByRole('button', { name: 'Reintentar' }))
    await ready(view)
  })

  await t.test('designar exige identidad y persiste documento antes de invitar', async s => {
    const view = mount(s)
    await ready(view)
    ui.fireEvent.click(view.getByRole('button', { name: /Agregar evaluador/ }))
    ui.fireEvent.click(view.getByRole('button', { name: 'Guardar jurado' }))
    assert.ok(view.getByText('Completa nombre, correo e institución del jurado.'))
    assert.equal(calls.length, 0)
    fill(view)
    ui.fireEvent.change(view.getByLabelText(/Documento a evaluar/), { target: { value: '102' } })
    const idioma = view.getByLabelText('Idioma de la invitación')
    assert.ok(idioma.compareDocumentPosition(view.getByPlaceholderText('PROFESOR')) & 4)
    ui.fireEvent.change(idioma, { target: { value: 'EN' } })
    const tratamiento = view.getByLabelText('Tratamiento en inglés (opcional)')
    assert.equal(tratamiento.placeholder, 'PROFESSOR')
    assert.equal(view.queryByLabelText('Tratamiento en español (opcional)'), null)
    ui.fireEvent.change(tratamiento, { target: { value: '   ' } })
    ui.fireEvent.click(view.getByRole('button', { name: 'Guardar jurado' }))
    await view.findByText('Jurado registrado e invitación enviada.')
    assert.ok(calls[0].path.endsWith('/documento-evaluar/102'))
    assert.ok(calls[1].path.endsWith('/jurados'))
    assert.equal(calls[1].body.documentoEvaluarId, 102)
    assert.equal(calls[1].body.jurados[0].idioma, 'EN')
    assert.equal(calls[1].body.jurados[0].tratamiento, 'PROFESSOR')
    assert.equal('tratamientoEn' in calls[1].body.jurados[0], false)
    assert.equal(calls[1].body.enviarInvitaciones, true)
    assert.equal(added, 1)
    assert.equal(updated, 0)
  })

  await t.test('sin documento seleccionado no envía invitación', async s => {
    proceso = { ...proceso, documentoEvaluarId: null }
    const view = mount(s)
    await ready(view)
    ui.fireEvent.click(view.getByRole('button', { name: /Agregar evaluador/ }))
    fill(view)
    ui.fireEvent.click(view.getByRole('button', { name: 'Guardar jurado' }))
    assert.ok(view.getByText('Selecciona la fecha límite y el documento que será evaluado.'))
    assert.equal(calls.length, 0)
  })

  await t.test('directorio completa datos sin enviar mutaciones', async s => {
    const view = mount(s)
    await ready(view)
    ui.fireEvent.click(view.getByRole('button', { name: /Agregar evaluador/ }))
    ui.fireEvent.click(view.getByRole('button', { name: 'Buscar en el directorio' }))
    ui.fireEvent.click(await view.findByRole('button', { name: 'Seleccionar' }))
    assert.equal(view.getByLabelText(/^Nombre/).value, 'Ana de prueba')
    assert.equal(view.getByLabelText(/^Correo/).value, 'ana@example.test')
    assert.equal(view.getByLabelText('Idioma de la invitación').value, 'EN')
    assert.equal(view.getByLabelText('Evaluador externo a la UIS').checked, false)
    assert.equal(calls.length, 0)
  })

  await t.test('reemplazar usa jurado original y refresco general', async s => {
    const view = mount(s)
    await ready(view)
    ui.fireEvent.click(view.getByRole('button', { name: 'Reemplazar' }))
    fill(view)
    ui.fireEvent.click(view.getByRole('button', { name: 'Reemplazar e invitar' }))
    await view.findByText('El jurado fue reemplazado y el nuevo evaluador fue invitado.')
    assert.equal(calls[0].method, 'PUT')
    assert.ok(calls[0].path.endsWith('/jurados/1'))
    assert.equal(calls[0].body.correo, 'nueva@example.test')
    assert.equal(calls[0].body.tratamiento, 'PROFESOR')
    assert.equal(updated, 1)
    assert.equal(added, 0)
  })

  await t.test('reemplazar envía el motivo del reemplazo cuando se diligencia', async s => {
    const view = mount(s)
    await ready(view)
    ui.fireEvent.click(view.getByRole('button', { name: 'Reemplazar' }))
    fill(view)
    ui.fireEvent.change(view.getByLabelText('Motivo del reemplazo (opcional)'), { target: { value: 'Conflicto de interés' } })
    ui.fireEvent.click(view.getByRole('button', { name: 'Reemplazar e invitar' }))
    await view.findByText('El jurado fue reemplazado y el nuevo evaluador fue invitado.')
    assert.equal(calls[0].body.motivoReemplazo, 'Conflicto de interés')
  })

  await t.test('ajuste #15: el tratamiento del jurado se envía al designarlo y se muestra junto al nombre', async s => {
    const view = mount(s)
    await ready(view)
    ui.fireEvent.click(view.getByRole('button', { name: /Agregar evaluador/ }))
    fill(view)
    ui.fireEvent.change(view.getByLabelText('Tratamiento en español (opcional)'), { target: { value: 'Dra.' } })
    ui.fireEvent.change(view.getByLabelText(/Documento a evaluar/), { target: { value: '102' } })
    ui.fireEvent.click(view.getByRole('button', { name: 'Guardar jurado' }))
    await view.findByText('Jurado registrado e invitación enviada.')
    assert.equal(calls[1].body.jurados[0].tratamiento, 'Dra.')
  })

  await t.test('ajuste #15: el tratamiento registrado se muestra junto al nombre del jurado', async s => {
    proceso = { ...proceso, jurados: [{ ...jurado, tratamiento: 'Ing.' }] }
    const view = mount(s)
    await ready(view)
    await view.findByText('Ing. Jurado inicial')
  })

  await t.test('jurado reemplazado tras declinar conserva visible el motivo de declinación', async s => {
    proceso = { ...proceso, jurados: [{ ...jurado, activo: false, estadoInvitacion: 'REEMPLAZADO', motivoDeclinacion: 'Conflicto de interés con el director' }] }
    const view = mount(s)
    await ready(view)
    await view.findByText('Declinó: Conflicto de interés con el director')
  })

  await t.test('ajuste #7: jurado que declina y sugiere reemplazo deja la sugerencia visible', async s => {
    proceso = { ...proceso, jurados: [{ ...jurado, activo: false, estadoInvitacion: 'DECLINADA', nombreSugerido: 'Dra. Ana Maria Rueda', correoSugerido: 'ana.rueda@universidad.edu.co' }] }
    const view = mount(s)
    await ready(view)
    await view.findByText('Sugiere: Dra. Ana Maria Rueda (ana.rueda@universidad.edu.co)')
  })

  await t.test('ajuste #7: sin sugerencia no aparece la línea de "Sugiere"', async s => {
    proceso = { ...proceso, jurados: [{ ...jurado, activo: false, estadoInvitacion: 'DECLINADA', motivoDeclinacion: 'No puedo participar' }] }
    const view = mount(s)
    await ready(view)
    await view.findByText('Declinó: No puedo participar')
    assert.equal(view.queryAllByText(/Sugiere:/).length, 0)
  })

  await t.test('retiro requiere confirmación; cancelar y Escape no eliminan', async s => {
    const view = mount(s)
    await ready(view)
    ui.fireEvent.click(view.getByRole('button', { name: 'Retirar' }))
    ui.fireEvent.click(view.getByRole('button', { name: 'Cancelar' }))
    assert.equal(calls.length, 0)
    ui.fireEvent.click(view.getByRole('button', { name: 'Retirar' }))
    ui.fireEvent.keyDown(document, { key: 'Escape' })
    assert.equal(calls.length, 0)
    ui.fireEvent.click(view.getByRole('button', { name: 'Retirar' }))
    ui.fireEvent.click(view.getByRole('button', { name: 'Sí, retirar jurado' }))
    await view.findByText('Jurado retirado.')
    assert.equal(calls[0].method, 'DELETE')
    assert.equal(updated, 1)
  })

  await t.test('fallo de reenvío conserva el jurado y habilita reintento', async s => {
    proceso = { ...proceso, jurados: [{ ...jurado, estadoInvitacion: 'PENDIENTE', estadoInvitacionCodigo: 'PENDIENTE' }] }
    const view = mount(s)
    await ready(view)
    failure = 'reenviar-invitacion'
    ui.fireEvent.click(view.getByRole('button', { name: 'Reenviar' }))
    await view.findByText('Servicio temporalmente no disponible')
    assert.equal(updated, 0)
    failure = ''
    ui.fireEvent.click(view.getByRole('button', { name: 'Reenviar' }))
    await view.findByText('Invitación reenviada.')
    assert.equal(updated, 1)
  })

  await t.test('evaluacion ofrece reenvio solo por jurado pendiente', async s => {
    const pendiente = { ...jurado, id: 1234, nombre: 'Jurado pendiente', estadoInvitacion: 'PENDIENTE', estadoInvitacionCodigo: 'PENDIENTE' }
    proceso = { ...proceso, estadoSolicitud: 'EN_EVALUACION', jurados: [jurado, pendiente] }
    const view = mount(s)
    await ready(view)
    assert.equal(view.queryByRole('button', { name: 'Enviar recordatorios' }), null)
    const reenviar = view.getByRole('button', { name: 'Reenviar' })
    assert.match(reenviar.closest('tr').textContent, /Jurado pendiente/)
    assert.equal(updated, 0)
  })

  await t.test('conceptos recibidos permiten enviar a correcciones', async s => {
    proceso = { ...proceso, estadoSolicitud: 'CONCEPTOS_REC' }
    const view = mount(s)
    await ready(view)
    ui.fireEvent.click(view.getByRole('button', { name: 'Enviar a correcciones' }))
    await view.findByText('El trabajo fue enviado a correcciones.')
    assert.equal(proceso.estadoSolicitud, 'EN_AJUSTES')
  })

  await t.test('sustentación híbrida exige lugar y enlace y envía ambos', async s => {
    proceso = { ...proceso, estadoSolicitud: 'CONCEPTOS_REC' }
    const view = mount(s)
    await ready(view)
    ui.fireEvent.click(view.getByRole('button', { name: 'Programar sustentación' }))
    ui.fireEvent.change(view.getByLabelText(/Fecha y hora/), { target: { value: '2027-11-01T10:00' } })
    ui.fireEvent.click(view.getByRole('button', { name: 'Programar' }))
    assert.equal(calls.length, 0)
    ui.fireEvent.change(view.getByLabelText(/Lugar/), { target: { value: ' Auditorio ' } })
    ui.fireEvent.change(view.getByLabelText(/Enlace/), { target: { value: 'https://example.test/sustentacion' } })
    ui.fireEvent.click(view.getByRole('button', { name: 'Programar' }))
    await view.findByText('Sustentación programada correctamente.')
    assert.deepEqual(calls[0].body, { fechaSustentacion: '2027-11-01T10:00', modalidadCodigo: 'HIBRIDA', lugar: 'Auditorio', enlace: 'https://example.test/sustentacion', notificarJurados: true })
  })

  await t.test('proceso cerrado no ofrece modificación de jurados ni recordatorios', async s => {
    proceso = { ...proceso, estadoSolicitud: 'FINALIZADA' }
    const view = mount(s)
    await ready(view)
    for (const name of [/Agregar evaluador/, 'Reemplazar', 'Retirar', 'Enviar recordatorios']) assert.equal(view.queryAllByRole('button', { name }).length, 0)
    assert.equal(calls.length, 0)
  })
})

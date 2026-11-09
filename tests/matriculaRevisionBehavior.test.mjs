import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('revisión de matrícula React: documentos, asignaturas y finalización', async t => {
  const ui = await reactApiHarness(t)
  const { default: Page } = await ui.load('/src/pages/MatriculaDetalleCoordinacion/MatriculaDetalleCoordinacionPage.tsx')
  const { AuthContext } = await ui.load('/src/context/Auth/context.ts')
  const document = (estado = 'POR_REVISAR') => ({
    idTipoDocumentoTramite: 5, codigoTipoDocumentoTramite: 'ANX-1', nombreTipoDocumentoTramite: 'Certificado', obligatorioTipoDocumentoTramite: true,
    documentoCargado: Boolean(estado), documentoUploadedResponse: estado ? {
      idDocumento: 50, nombreArchivoDocumento: 'certificado.pdf', estadoDocumento: estado,
      base64DocumentoContenido: 'JVBERi0=', mimeTypeDocumentoContenido: 'application/pdf',
    } : null,
  })
  let matricula, documents, missing, fetchError, decisionError, finalizationError, approvalError, validationError, decisions, approvals, finalized, savedSubjects
  const ok = data => Response.json({ ok: true, data })
  t.beforeEach(() => {
    matricula = { id: 24, estudianteNombreCompleto: 'Persona de prueba', codigoEstudianteUis: '2026001', programaAcademico: 'Maestría', periodoAcademico: '2026-2', estado: 'PENDIENTE_DOCUMENTOS', fechaSolicitud: '2026-10-17T10:00:00', asignaturas: [{ id: 33, asignaturaId: 7, asignaturaCodigo: 'UIS-7', asignaturaNombre: 'Investigación', estado: 'PENDIENTE', observaciones: null }] }
    documents = [document()]; missing = false; fetchError = false; decisionError = false; finalizationError = false; approvalError = false; validationError = false
    decisions = []; approvals = 0; finalized = 0; savedSubjects = []
    ui.response((url, init) => {
      const path = new URL(url, 'https://example.test').pathname
      if (path.endsWith('/matriculaAcademica')) return fetchError ? Response.json({ message: 'Detalle no disponible' }, { status: 503 }) : ok(missing ? [] : [matricula])
      if (path.endsWith('/document')) {
        if (init.method === 'PUT') {
          if (decisionError) return Response.json({ message: 'Decisión no guardada' }, { status: 503 })
          const body = JSON.parse(init.body)
          decisions.push(body)
          documents = documents.map(item => ({ ...item, documentoUploadedResponse: { ...item.documentoUploadedResponse, estadoDocumento: body.aprobado ? 'APROBADO' : 'RECHAZADO', observacionesDocumento: body.observaciones } }))
          return ok(null)
        }
        return ok(documents)
      }
      if (path.endsWith('/matriculaAcademica/24/finalizarRevisionDocumentos')) {
        finalized++
        return finalizationError ? Response.json({ message: 'Notificación no disponible' }, { status: 503 }) : new Response(null, { status: 204 })
      }
      if (path.endsWith('/matriculaAcademica/24/validarAsignaturas')) {
        if (validationError) return Response.json({ message: 'Validación no guardada' }, { status: 503 })
        const body = JSON.parse(init.body)
        savedSubjects.push(body)
        matricula = { ...matricula, asignaturas: matricula.asignaturas.map(item => ({ ...item, estado: body.asignaturas[0].estado, observaciones: body.asignaturas[0].observaciones })) }
        return ok(null)
      }
      if (path.endsWith('/matriculaAcademica/24')) {
        approvals++
        if (approvalError) return Response.json({ message: 'Matrícula no aprobada' }, { status: 503 })
        matricula = { ...matricula, estado: 'RADICADA' }
        return ok(null)
      }
      throw new Error(`Petición inesperada: ${url}`)
    })
  })
  const mount = (s, { id = '24', roles = ['COORDINADOR'] } = {}) => {
    s.after(ui.cleanup)
    const user = { id: 10, username: 'persona', nombreCompleto: 'Persona de prueba', roles }
    return ui.render(createElement(MemoryRouter, { initialEntries: [`/revision/${id}`] },
      createElement(AuthContext.Provider, { value: { session: { kind: 'SAPP', user }, user } },
        createElement(Routes, null, createElement(Route, { path: '/revision/:matriculaId', element: createElement(Page) })))))
  }
  const ready = async view => { await view.findByRole('heading', { name: 'Asignaturas registradas' }) }
  const approveDoc = view => ui.fireEvent.click(view.getAllByRole('button', { name: 'Aprobar' })[0])

  await t.test('id inválido y matrícula inexistente muestran errores sin acciones', async s => {
    let view = mount(s, { id: 'invalido' })
    await view.findByText('La matrícula solicitada no es válida.')
    assert.equal(decisions.length, 0)
    await ui.cleanup()
    missing = true
    view = mount(s)
    await view.findByText('No se encontró la matrícula seleccionada.')
    assert.equal(view.queryAllByRole('button', { name: 'Guardar validación de asignaturas' }).length, 0)
  })

  await t.test('fallo del servidor no presenta controles de revisión utilizables', async s => {
    fetchError = true
    const view = mount(s)
    await view.findByText('Detalle no disponible')
    assert.equal(view.queryAllByRole('button', { name: 'Aprobar' }).length, 0)
  })

  await t.test('estudiante no tiene controles administrativos en este detalle', async s => {
    const view = mount(s, { roles: ['ESTUDIANTE'] })
    assert.ok(view.getByText('No disponible para tu rol.'))
    await ui.waitFor(() => assert.ok(ui.requests.length > 0))
    assert.equal(view.queryAllByRole('button', { name: 'Aprobar' }).length, 0)
    assert.equal(approvals, 0)
    assert.equal(decisions.length, 0)
  })

  await t.test('documento pendiente no puede abrirse ni aprobarse', async s => {
    documents = [document(null)]
    const view = mount(s)
    await ready(view)
    assert.equal(view.getByRole('button', { name: 'Ver' }).disabled, true)
    assert.equal(view.getByRole('button', { name: 'Descargar' }).disabled, true)
    assert.equal(view.getAllByRole('button', { name: 'Aprobar' })[0].disabled, true)
    assert.equal(finalized, 0)
  })

  await t.test('rechazo exige motivo, permite cancelar y envía texto recortado', async s => {
    const view = mount(s)
    await ready(view)
    ui.fireEvent.click(view.getAllByRole('button', { name: 'Rechazar' })[0])
    ui.fireEvent.click(view.getByRole('button', { name: 'Confirmar rechazo' }))
    assert.ok(view.getByText('Debe ingresar el motivo del rechazo.'))
    assert.equal(decisions.length, 0)
    ui.fireEvent.click(view.getByRole('button', { name: 'Cancelar' }))
    assert.equal(view.queryAllByLabelText('Motivo del rechazo').length, 0)
    ui.fireEvent.click(view.getAllByRole('button', { name: 'Rechazar' })[0])
    ui.fireEvent.change(view.getByLabelText('Motivo del rechazo'), { target: { value: '  Certificado ilegible  ' } })
    ui.fireEvent.click(view.getByRole('button', { name: 'Confirmar rechazo' }))
    await ui.waitFor(() => assert.equal(finalized, 1))
    assert.deepEqual(decisions, [{ documentoId: 50, aprobado: false, observaciones: 'Certificado ilegible' }])
    assert.equal(approvals, 0)
    assert.ok(view.getByText('RECHAZADO'))
  })

  await t.test('último obligatorio aprobado finaliza revisión y avanza matrícula una sola vez', async s => {
    const view = mount(s)
    await ready(view)
    approveDoc(view)
    await view.findByText('Todos los documentos obligatorios fueron aprobados. La matrícula avanzó correctamente.')
    assert.deepEqual(decisions, [{ documentoId: 50, aprobado: true, observaciones: null }])
    assert.equal(finalized, 1)
    assert.equal(approvals, 1)
    ui.fireEvent.click(view.getByRole('button', { name: 'Cerrar notificación' }))
    assert.equal(view.queryAllByRole('button', { name: 'Cerrar notificación' }).length, 0)
  })

  await t.test('fallo de decisión conserva documento sin notificar ni aprobar matrícula', async s => {
    decisionError = true
    const view = mount(s)
    await ready(view)
    approveDoc(view)
    await view.findByText('Decisión no guardada')
    assert.equal(finalized, 0)
    assert.equal(approvals, 0)
    assert.equal(documents[0].documentoUploadedResponse.estadoDocumento, 'POR_REVISAR')
  })

  await t.test('fallo al notificar revisión conserva el rechazo ya guardado', async s => {
    finalizationError = true
    const view = mount(s)
    await ready(view)
    ui.fireEvent.click(view.getAllByRole('button', { name: 'Rechazar' })[0])
    ui.fireEvent.change(view.getByLabelText('Motivo del rechazo'), { target: { value: 'Documento incompleto' } })
    ui.fireEvent.click(view.getByRole('button', { name: 'Confirmar rechazo' }))
    await view.findByText(/La decisión se guardó, pero no fue posible notificar/)
    assert.equal(decisions.length, 1)
    assert.ok(view.getByText('RECHAZADO'))
    assert.equal(approvals, 0)
  })

  await t.test('error de avance automático no repite la aprobación durante rerender', async s => {
    documents = [document('APROBADO')]
    approvalError = true
    const view = mount(s)
    await view.findByText('Matrícula no aprobada')
    assert.equal(approvals, 1)
    ui.fireEvent.click(view.getByRole('button', { name: 'Cerrar notificación' }))
    assert.equal(approvals, 1)
  })

  await t.test('validación de asignaturas exige una decisión y envía usuario e ids correctos', async s => {
    const view = mount(s)
    await ready(view)
    ui.fireEvent.click(view.getByRole('button', { name: 'Guardar validación de asignaturas' }))
    await view.findByText('Debe seleccionar al menos una asignatura para aprobar o rechazar.')
    assert.equal(savedSubjects.length, 0)
    ui.fireEvent.click(view.getAllByRole('button', { name: 'Rechazar' }).at(-1))
    ui.fireEvent.change(view.getByPlaceholderText('Observaciones de validación'), { target: { value: '  No cumple prerrequisito  ' } })
    ui.fireEvent.click(view.getByRole('button', { name: 'Guardar validación de asignaturas' }))
    await view.findByText('La validación de asignaturas fue guardada correctamente.')
    assert.deepEqual(savedSubjects, [{ usuarioRevisionId: 10, observaciones: 'Revision manual', asignaturas: [{ asignaturaId: 7, estado: 'NO_MATRICULADA', observaciones: 'No cumple prerrequisito' }] }])
  })

  await t.test('error al guardar asignaturas mantiene decisión para reintentar', async s => {
    validationError = true
    const view = mount(s)
    await ready(view)
    ui.fireEvent.click(view.getAllByRole('button', { name: 'Aprobar' }).at(-1))
    ui.fireEvent.click(view.getByRole('button', { name: 'Guardar validación de asignaturas' }))
    await view.findByText('Validación no guardada')
    assert.ok(view.getByRole('button', { name: 'Aprobada' }))
    validationError = false
    ui.fireEvent.click(view.getByRole('button', { name: 'Guardar validación de asignaturas' }))
    await ui.waitFor(() => assert.equal(savedSubjects.length, 1))
  })

  await t.test('finalizada no ofrece aprobación documental ni guardado de asignaturas', async s => {
    matricula = { ...matricula, estado: 'FINALIZADA' }
    const view = mount(s)
    await ready(view)
    assert.equal(view.queryAllByRole('button', { name: 'Aprobar' }).length, 0)
    assert.equal(view.queryAllByRole('button', { name: 'Guardar validación de asignaturas' }).length, 0)
    assert.equal(view.getByPlaceholderText('Observaciones de validación').disabled, true)
  })

  await t.test('abrir y descargar documento usa contenido y nombre del checklist', async sub => {
    const opened = [], downloaded = []; const previous = ui.dom.window.open; const anchorClick = ui.dom.window.HTMLAnchorElement.prototype.click
    ui.dom.window.open = url => { opened.push(url); return null }; ui.dom.window.HTMLAnchorElement.prototype.click = function () { downloaded.push(this.download) }
    sub.after(() => { ui.dom.window.open = previous; ui.dom.window.HTMLAnchorElement.prototype.click = anchorClick })
    const view = mount(sub); await ready(view); ui.fireEvent.click(view.getByRole('button', { name: 'Ver', exact: true })); await ui.waitFor(() => assert.equal(opened.length, 1))
    ui.fireEvent.click(view.getByRole('button', { name: 'Descargar', exact: true })); await ui.waitFor(() => assert.equal(downloaded.length, 1)); assert.equal(downloaded[0], 'certificado.pdf')
  })
})

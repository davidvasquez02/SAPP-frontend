import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('página de matrícula React: roles, creación, documentos y listado administrativo', async t => {
  const ui = await reactApiHarness(t)
  const { default: Page } = await ui.load('/src/pages/Matricula/MatriculaPage.tsx')
  const { AuthContext } = await ui.load('/src/context/Auth/context.ts')
  const matricula = { id: 24, estudianteId: 18, periodoId: 7, periodoAcademico: '2026-2', programaAcademico: 'Maestría', estado: 'PENDIENTE_DOCUMENTOS', fechaSolicitud: '2026-10-17T10:00:00', asignaturas: [{ id: 40, asignaturaId: 1, asignaturaNombre: 'Investigación', asignaturaCodigo: 'UIS-1', estado: 'MATRICULADA', grupo: 'A' }] }
  const subject = { id: 1, nombre: 'Investigación', codigoUis: 'UIS-1', nivel: 1, programaId: 1 }
  const document = (estado = null) => ({
    idTipoDocumentoTramite: 5, nombreTipoDocumentoTramite: 'Certificado', descripcionTipoDocumentoTramite: 'Certificado académico', obligatorioTipoDocumentoTramite: true,
    documentoCargado: Boolean(estado), documentoUploadedResponse: estado ? {
      idDocumento: 50, estadoDocumento: estado, nombreArchivoDocumento: 'certificado.pdf', mimeTypeDocumentoContenido: 'application/pdf', base64DocumentoContenido: 'JVBERi0=', observacionesDocumento: estado === 'RECHAZADO' ? 'Archivo ilegible' : null,
    } : null,
  })
  let validation, documents, listado, listError, docsError, uploadError, uploadUnconfirmed, validationError, activePeriod, notificationError, notificationSent, createCount, uploadCount, completedCount, openingCount
  let historial, consultasHistorial
  let ventanasInclusiones, errorVentanas, solicitudesInclusiones, plazoCierraAlEnviar
  const ventanaInclusion = { id: 8, tipoTramite: { nombre: 'INCLUSION_CANCELACION_MATRICULA' },
    periodo: { id: 7, anioPeriodo: '2026-2' }, fechaInicio: '2026-10-31', fechaFin: '2026-11-05' }
  const ok = data => Response.json({ ok: true, data })
  t.beforeEach(() => {
    validation = { puedeCrear: true, periodoId: 7 }; documents = [document()]; listado = []
    listError = false; docsError = false; uploadError = false; notificationError = false; notificationSent = false
    validationError = false; uploadUnconfirmed = false; activePeriod = true
    createCount = 0; uploadCount = 0; completedCount = 0; openingCount = 0
    historial = []; consultasHistorial = 0
    ventanasInclusiones = []; errorVentanas = null; solicitudesInclusiones = []; plazoCierraAlEnviar = false
    ui.response((url, init) => {
      const parsed = new URL(url, 'https://example.test')
      const path = parsed.pathname
      if (path.endsWith('/matriculaAcademica/estudiante/18/historialAsignaturas')) {
        consultasHistorial++
        return ok(historial)
      }
      if (path.endsWith('/matriculaAcademica/vigente/estudiante/18')) return validationError ? Response.json({ message: 'Validación temporalmente no disponible' }, { status: 503 }) : ok(validation)
      if (path.endsWith('/asignaturas')) {
        assert.equal(parsed.searchParams.get('programaId'), '1')
        return ok([subject, { ...subject, id: 2, nombre: 'Seminario', codigoUis: 'UIS-2', nivel: 2 }])
      }
      if (path.endsWith('/tramite/document')) return docsError
        ? Response.json({ message: 'Checklist no disponible' }, { status: 503 })
        : ok([{ id: 5, nombre: 'Certificado', descripcion: 'Certificado académico', obligatorio: true }])
      if (path.endsWith('/document')) {
        if (init.method === 'POST') {
          uploadCount++
          if (uploadError) return Response.json({ message: 'Carga temporalmente no disponible' }, { status: 503 })
          if (uploadUnconfirmed) return ok({ nombreArchivo: 'sin-id.pdf' })
          const body = JSON.parse(init.body)
          assert.equal(body.tramiteId, 24)
          assert.equal(body.usuarioCargaId, 10)
          assert.equal(body.tipoDocumentoTramiteId, 5)
          assert.equal(body.contenidoBase64, 'JVBERi0=')
          assert.equal(body.tamanoBytes, 5)
          assert.match(body.checksum, /^[a-f0-9]{64}$/)
          documents = [document('EN_REVISION')]
          return ok({ id: 50, nombreArchivo: body.nombreArchivo })
        }
        return docsError ? Response.json({ message: 'Checklist no disponible' }, { status: 503 }) : ok(documents)
      }
      if (path.endsWith('/matriculaAcademica/24/notificarDocumentosCompletos')) { completedCount++; return new Response(null, { status: 204 }) }
      if (path.endsWith('/matriculaAcademica/notificarAperturaMatricula')) {
        openingCount++
        assert.equal(parsed.searchParams.get('periodoId'), '7')
        if (notificationError) return Response.json({ message: 'Correo temporalmente no disponible' }, { status: 503 })
        notificationSent = true
        return Response.json({ ok: true, message: 'Notificación enviada', data: null })
      }
      if (path.endsWith('/periodoAcademicoFecha/vigente')) {
        if (errorVentanas) return Response.json({ message: 'Fechas no disponibles' }, { status: errorVentanas })
        return ok([
          ...(activePeriod ? [{
            id: 3, tipoTramite: { nombre: 'MATRICULA' }, periodo: { id: 7, anioPeriodo: '2026-2' },
            fechaInicio: '2026-10-01', fechaFin: '2026-10-31', notificacionAperturaEnviada: notificationSent,
          }] : []),
          ...ventanasInclusiones,
        ])
      }
      if (path.endsWith('/matriculaAcademica/24/inclusionCancelacion')) {
        assert.equal(init.method, 'POST')
        if (plazoCierraAlEnviar) {
          ventanasInclusiones = []
          return Response.json({ message: 'El plazo de inclusiones y cancelaciones no está vigente para esta matrícula.' }, { status: 400 })
        }
        solicitudesInclusiones.push(JSON.parse(init.body))
        return ok(validation)
      }
      if (path.endsWith('/matriculaAcademica')) {
        if (init.method === 'POST') {
          createCount++
          assert.deepEqual(JSON.parse(init.body), { estudianteId: 18, periodoId: 7, asignaturas: [{ asignaturaId: 1 }] })
          validation = matricula
          historial = [{ matriculaId: 24, periodoAcademico: '2026-2', asignaturaId: 1, asignaturaCodigo: 'UIS-1',
            asignaturaNombre: 'Investigación', estadoAnterior: null, estadoNuevo: 'SELECCIONADA', fecha: '2026-10-17T10:00:00' }]
          return ok({ id: 24 })
        }
        return listError ? Response.json({ message: 'Listado no disponible' }, { status: 503 }) : ok(listado)
      }
      throw new Error(`Petición inesperada: ${url}`)
    })
  })
  const mount = (s, roles = ['ESTUDIANTE']) => {
    s.after(ui.cleanup)
    const user = { id: '10', username: 'persona', nombreCompleto: 'Persona de prueba', roles, estudiante: { id: 18, programaId: 1 } }
    return ui.render(createElement(MemoryRouter, null,
      createElement(AuthContext.Provider, { value: { session: { kind: 'SAPP', user }, user } }, createElement(Page))))
  }
  const ready = async view => {
    await view.findByText('Cargue de documentos')
    await ui.waitFor(() => assert.ok(!view.queryByText('Cargando documentos...')))
  }
  const add = async view => {
    await ready(view)
    ui.fireEvent.change(view.getByLabelText('Materia'), { target: { value: 'Investigación' } })
    ui.fireEvent.click(view.getByRole('button', { name: /Investigación.*UIS-1/ }))
  }
  const selectPdf = view => ui.fireEvent.change(view.container.querySelector('input[type="file"]'), {
    target: { files: [new File(['%PDF-'], 'nuevo.pdf', { type: 'application/pdf' })] },
  })

  await t.test('docente no puede consultar ni crear matrículas desde esta página', s => {
    const start = ui.requests.length
    const view = mount(s, ['DOCENTE'])
    assert.ok(view.getByText('No disponible para tu rol.'))
    assert.equal(ui.requests.length, start)
  })

  await t.test('sin periodo activo oculta la creación y comunica el motivo', async s => {
    activePeriod = false
    validation = { puedeCrear: false, periodoId: 7 }
    historial = [{ matriculaId: 12, periodoAcademico: '2026-1', asignaturaId: 2, asignaturaCodigo: 'UIS-2',
      asignaturaNombre: 'Seminario', estadoAnterior: null, estadoNuevo: 'MATRICULADA', fecha: '2026-05-10T10:00:00' }]
    const view = mount(s)
    await view.findByRole('heading', { name: 'No hay fechas de matrícula habilitadas actualmente.' })
    const seccion = view.getByRole('region', { name: 'Historial de materias' })
    const periodo = await ui.within(seccion).findByRole('region', { name: 'Periodo 2026-1' })
    assert.ok(ui.within(periodo).getByText('Seminario (UIS-2)'))
    assert.ok(ui.within(periodo).getByText('Matriculada'))
    assert.equal(seccion.parentElement.lastElementChild, seccion)
    assert.equal(view.queryAllByRole('button', { name: 'Confirmar matrícula' }).length, 0)
    assert.equal(createCount, 0)
  })

  await t.test('materias seleccionadas no se duplican y pueden retirarse antes de confirmar', async s => {
    const view = mount(s)
    await ready(view)
    assert.ok(view.getByText('Periodo académico: 2026-2'))
    assert.equal(view.getByRole('button', { name: 'Confirmar matrícula' }).disabled, true)
    await add(view)
    assert.equal(view.getByRole('button', { name: 'Confirmar matrícula' }).disabled, false)
    ui.fireEvent.change(view.getByLabelText('Materia'), { target: { value: 'Investigación' } })
    assert.equal(view.queryAllByRole('button', { name: /Investigación.*UIS-1/ }).length, 0)
    ui.fireEvent.click(view.getByRole('button', { name: 'Eliminar' }))
    assert.equal(view.getByRole('button', { name: 'Confirmar matrícula' }).disabled, true)
  })

  await t.test('crear, subir PDF y notificar documentos completos usa los ids correctos', async s => {
    const view = mount(s)
    const seccion = view.getByRole('region', { name: 'Historial de materias' })
    await ui.within(seccion).findByText('No hay historial de materias registrado.')
    await add(view)
    selectPdf(view)
    ui.fireEvent.click(view.getByRole('button', { name: 'Confirmar matrícula' }))
    await ui.waitFor(() => assert.equal(completedCount, 1))
    await ui.waitFor(() => assert.ok(!view.queryByRole('status', { name: 'Procesando solicitud de matrícula' })))
    assert.equal(createCount, 1)
    assert.equal(uploadCount, 1)
    assert.ok(view.getByText('Resumen de la matrícula'))
    assert.ok(view.getByText('certificado.pdf'))
    const periodo = await ui.within(seccion).findByRole('region', { name: 'Periodo 2026-2' })
    assert.ok(ui.within(periodo).getByText('Investigación (UIS-1)'))
    assert.equal(consultasHistorial, 2)
  })

  await t.test('error de carga no notifica ni duplica la matrícula al reintentar', async s => {
    uploadError = true
    const view = mount(s)
    await add(view)
    selectPdf(view)
    ui.fireEvent.click(view.getByRole('button', { name: 'Confirmar matrícula' }))
    await view.findByText(/La matrícula fue creada, pero falló la carga del documento/)
    assert.equal(createCount, 1)
    assert.equal(completedCount, 0)
    uploadError = false
    selectPdf(view)
    ui.fireEvent.click(view.getByRole('button', { name: 'Confirmar matrícula' }))
    await ui.waitFor(() => assert.equal(completedCount, 1))
    assert.equal(createCount, 1)
    assert.equal(uploadCount, 2)
  })

  await t.test('matrícula finalizada muestra seguimiento y bloquea cambios', async s => {
    validation = { ...matricula, estado: 'FINALIZADA', observaciones: 'Proceso terminado' }
    documents = [document('APROBADO')]
    const view = mount(s)
    await view.findByText('Proceso terminado')
    await ui.waitFor(() => assert.ok(!view.queryByText('Cargando documentos...')))
    assert.equal(view.getByRole('button', { name: 'Cargar' }).disabled, true)
    assert.equal(view.queryAllByRole('button', { name: /Actualizar matrícula|Confirmar matrícula/ }).length, 0)
    assert.equal(view.queryAllByLabelText('Materia').length, 0)
  })

  await t.test('matrícula finalizada permite incluir y cancelar con plazo vigente aunque cerró matrícula', async s => {
    activePeriod = false
    validation = { ...matricula, estado: 'FINALIZADA' }
    ventanasInclusiones = [ventanaInclusion]
    const view = mount(s)
    const abrir = await view.findByRole('button', { name: 'Solicitar inclusión o cancelación de materias' })
    assert.ok(view.queryByRole('heading', { name: 'No hay fechas de matrícula habilitadas actualmente.' }))
    ui.fireEvent.click(abrir)
    const materia = await view.findByLabelText('Materia')
    assert.ok(view.getByText('05/11/2026', { selector: 'time' }))
    assert.equal(view.queryByText(/Verificando la ventana/), null)
    ui.fireEvent.change(materia, { target: { value: 'Seminario' } })
    ui.fireEvent.click(view.getByRole('button', { name: /Seminario.*UIS-2/ }))
    ui.fireEvent.click(view.getByRole('checkbox', { name: 'Investigación' }))
    ui.fireEvent.click(view.getByRole('button', { name: 'Enviar solicitud' }))
    await view.findByText(/Solicitud registrada/)
    assert.deepEqual(solicitudesInclusiones, [{ incluir: [{ asignaturaId: 2 }], cancelarAsignaturaIds: [1] }])
    await ui.waitFor(() => assert.equal(consultasHistorial, 2))
  })

  await t.test('valida el mismo periodo y permite volver a consultar después de un 404 o un error de API', async s => {
    activePeriod = false
    validation = { ...matricula, estado: 'FINALIZADA' }
    errorVentanas = 404
    const view = mount(s)
    const abrir = () => ui.fireEvent.click(view.getByRole('button', { name: 'Solicitar inclusión o cancelación de materias' }))
    const cerrar = () => ui.fireEvent.click(view.getByRole('button', { name: 'Cerrar' }))
    const mensajePlazo = 'No hay una ventana de inclusión y cancelación vigente para este periodo.'
    await view.findByRole('button', { name: 'Solicitar inclusión o cancelación de materias' })
    abrir()
    await view.findByText(mensajePlazo)
    cerrar()
    errorVentanas = 503
    abrir()
    await view.findByText('Fechas no disponibles')
    cerrar()
    errorVentanas = null
    ventanasInclusiones = [{ ...ventanaInclusion, periodo: { id: 6 } }]
    abrir()
    await view.findByText(mensajePlazo)
    assert.equal(view.queryByRole('button', { name: 'Enviar solicitud' }), null)
    cerrar()
    ventanasInclusiones.push(ventanaInclusion)
    abrir()
    await view.findByRole('button', { name: 'Enviar solicitud' })
    assert.equal(solicitudesInclusiones.length, 0)
  })

  await t.test('si vence el plazo antes de enviar muestra el error y permite comprobar el cierre', async s => {
    activePeriod = false
    validation = { ...matricula, estado: 'FINALIZADA' }
    ventanasInclusiones = [ventanaInclusion]
    plazoCierraAlEnviar = true
    const view = mount(s)
    const textoAbrir = 'Solicitar inclusión o cancelación de materias'
    ui.fireEvent.click(await view.findByRole('button', { name: textoAbrir }))
    ui.fireEvent.click(await view.findByRole('checkbox', { name: 'Investigación' }))
    ui.fireEvent.click(view.getByRole('button', { name: 'Enviar solicitud' }))
    await view.findByText('El plazo de inclusiones y cancelaciones no está vigente para esta matrícula.')
    assert.equal(solicitudesInclusiones.length, 0)
    ui.fireEvent.click(view.getByRole('button', { name: 'Cerrar' }))
    ui.fireEvent.click(view.getByRole('button', { name: textoAbrir }))
    await view.findByText('No hay una ventana de inclusión y cancelación vigente para este periodo.')
    assert.equal(view.queryByRole('button', { name: 'Enviar solicitud' }), null)
  })

  await t.test('si el periodo cierra antes de confirmar no crea ni carga documentos', async s => {
    const view = mount(s)
    await add(view)
    selectPdf(view)
    validation = { puedeCrear: false, periodoId: 7 }
    ui.fireEvent.click(view.getByRole('button', { name: 'Confirmar matrícula' }))
    await view.findByRole('heading', { name: 'No hay fechas de matrícula habilitadas actualmente.' })
    assert.equal(createCount, 0)
    assert.equal(uploadCount, 0)
    assert.equal(completedCount, 0)
  })

  await t.test('respuesta de carga sin id no se considera documento guardado', async s => {
    uploadUnconfirmed = true
    const view = mount(s)
    await add(view)
    selectPdf(view)
    ui.fireEvent.click(view.getByRole('button', { name: 'Confirmar matrícula' }))
    await view.findByText(/La matrícula fue creada, pero falló la carga del documento.*El servidor no confirmó/)
    assert.equal(createCount, 1)
    assert.equal(uploadCount, 1)
    assert.equal(completedCount, 0)
  })

  await t.test('matrícula radicada bloquea correcciones aunque conserve un rechazo documental', async s => {
    validation = { ...matricula, estado: 'RADICADA' }
    documents = [document('RECHAZADO')]
    const view = mount(s)
    await ready(view)
    assert.equal(view.getByRole('button', { name: 'Cargar' }).disabled, true)
    assert.equal(view.getByRole('button', { name: 'Actualizar matrícula' }).disabled, true)
    assert.ok(view.getByText(/La carga no está disponible mientras la matrícula se encuentre en estado Radicada/))
    assert.equal(uploadCount, 0)
  })

  await t.test('actualizar sin seleccionar nueva versión no envía archivos ni notificación', async s => {
    validation = matricula
    documents = [document('RECHAZADO')]
    const view = mount(s)
    await ready(view)
    ui.fireEvent.click(view.getByRole('button', { name: 'Actualizar matrícula' }))
    await view.findByText('Selecciona al menos un documento nuevo para enviar.')
    assert.equal(uploadCount, 0)
    assert.equal(createCount, 0)
    assert.equal(completedCount, 0)
  })

  await t.test('fallo de validación inicial no presenta formulario utilizable', async s => {
    validationError = true
    const view = mount(s)
    await view.findByText('Validación temporalmente no disponible')
    assert.equal(view.queryAllByRole('button', { name: 'Confirmar matrícula' }).length, 0)
    assert.equal(createCount, 0)
  })

  await t.test('rechazo documental permite corregir PDF, rechaza imágenes y actualiza sin crear', async s => {
    validation = matricula
    documents = [document('RECHAZADO')]
    const view = mount(s)
    await ready(view)
    const input = view.container.querySelector('input[type="file"]')
    ui.fireEvent.change(input, { target: { files: [new File(['foto'], 'foto.png', { type: 'image/png' })] } })
    assert.ok(view.getByText('Solo se permiten archivos PDF.'))
    selectPdf(view)
    ui.fireEvent.click(view.getByRole('button', { name: 'Actualizar matrícula' }))
    await ui.waitFor(() => assert.equal(completedCount, 1))
    assert.equal(createCount, 0)
    assert.equal(uploadCount, 1)
  })

  await t.test('listado administrativo pagina, filtra y enlaza el trámite correcto', async s => {
    listado = Array.from({ length: 12 }, (_, i) => ({
      ...matricula, id: i + 1, estudianteNombreCompleto: `Persona ${i + 1}`, codigoEstudianteUis: `COD-${i + 1}`,
      programaAcademico: i % 2 ? 'Doctorado' : 'Maestría', periodoAcademico: '2020-1', estado: i % 2 ? 'RADICADA' : 'FINALIZADA',
      fechaSolicitud: `2020-01-${String(i + 1).padStart(2, '0')}T10:00:00`,
    }))
    const view = mount(s, ['SECRETARIA'])
    await view.findByText('Registros encontrados: 12')
    assert.ok(view.getByRole('option', { name: 'Todos los programas' }).selected)
    assert.ok(view.getByRole('option', { name: 'Todos los períodos' }).selected)
    assert.ok(view.getByRole('option', { name: 'Todos los estados' }).selected)
    assert.equal(view.queryByRole('region', { name: 'Historial de materias' }), null)
    assert.equal(consultasHistorial, 0)
    assert.ok(view.getByText('Página 1 de 2'))
    ui.fireEvent.click(view.getByRole('button', { name: 'Siguiente' }))
    assert.ok(view.getByText('Página 2 de 2'))
    ui.fireEvent.change(view.getByLabelText('Buscar estudiante'), { target: { value: 'COD-12' } })
    assert.ok(view.getByText('Registros encontrados: 1'))
    assert.equal(view.queryByRole('button', { name: 'Siguiente' }), null)
    assert.equal(view.getAllByRole('link', { name: 'Ver detalle' })[0].getAttribute('href'), '/matricula/academica/12')
    ui.fireEvent.change(view.getByLabelText('Estado'), { target: { value: 'FINALIZADA' } })
    assert.ok(view.getByText('Registros encontrados: 0'))
    assert.ok(view.getByText('No hay matrículas que coincidan con los filtros seleccionados.'))
    ui.fireEvent.change(view.getByLabelText('Buscar estudiante'), { target: { value: '' } })
    ui.fireEvent.change(view.getByLabelText('Programa académico'), { target: { value: 'Maestría' } })
    assert.ok(view.getByText('Registros encontrados: 6'))
  })

  await t.test('fallo del listado muestra mensaje sin presentar datos antiguos', async s => {
    listError = true
    const view = mount(s, ['COORDINADOR'])
    await view.findByText('Listado no disponible')
    assert.equal(view.queryAllByRole('link', { name: 'Ver detalle' }).length, 0)
  })

  await t.test('sin periodo administrativo abierto no permite notificar apertura', async s => {
    activePeriod = false
    const view = mount(s, ['COORDINADOR'])
    await view.findByText('No hay un periodo de matrícula abierto para notificar.')
    assert.equal(view.getByRole('button', { name: 'Enviar correo de inicio' }).disabled, true)
    assert.equal(openingCount, 0)
  })

  await t.test('notificación requiere confirmación y un error permite reintentar', async s => {
    notificationError = true
    const callbacks = []
    const originalTimeout = window.setTimeout.bind(window)
    s.mock.method(window, 'setTimeout', (callback, delay, ...args) => delay === 5000 ? (callbacks.push(callback), 1) : originalTimeout(callback, delay, ...args))
    const view = mount(s, ['COORDINADOR'])
    const open = await view.findByRole('button', { name: 'Enviar correo de inicio' })
    await ui.waitFor(() => assert.equal(open.disabled, false))
    ui.fireEvent.click(open)
    assert.equal(openingCount, 0)
    ui.fireEvent.click(view.getByRole('button', { name: 'Cancelar' }))
    assert.equal(openingCount, 0)
    ui.fireEvent.click(open)
    ui.fireEvent.click(view.getByRole('button', { name: 'Enviar correo' }))
    await view.findByText('Correo temporalmente no disponible')
    notificationError = false
    ui.fireEvent.click(view.getByRole('button', { name: 'Enviar correo de inicio' }))
    ui.fireEvent.click(view.getByRole('button', { name: 'Enviar correo' }))
    await view.findByText('Notificación enviada')
    assert.equal(openingCount, 2)
    await ui.act(async () => callbacks.forEach(fn => fn()))
    await ui.waitFor(() => assert.equal(view.queryAllByRole('button', { name: 'Enviar correo de inicio' }).length, 0))
  })
})

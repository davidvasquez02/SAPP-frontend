import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement as h } from 'react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('estudiantes: tablero, perfil, documentos y cambios de estado', async t => {
  const ui = await reactApiHarness(t)
  const previousObserver = Object.getOwnPropertyDescriptor(globalThis, 'ResizeObserver')
  Object.defineProperty(globalThis, 'ResizeObserver', { configurable: true, value: class { observe() {} disconnect() {} } })
  t.after(() => previousObserver ? Object.defineProperty(globalThis, 'ResizeObserver', previousObserver) : delete globalThis.ResizeObserver)
  const { default: List } = await ui.load('/src/pages/EstudiantesCoordinacion/EstudiantesCoordinacionPage.tsx')
  const { default: Detail } = await ui.load('/src/pages/EstudianteDetalleCoordinacion/EstudianteDetalleCoordinacionPage.tsx')
  const { AuthContext } = await ui.load('/src/context/Auth/context.ts')
  const { clearEstudiantesListCache } = await ui.load('/src/modules/estudiantes/services/estudiantesListCache.ts')
  let students, groups, failure, writes, reads, content, solicitudes
  const raw = (id = 7, estado = 'ACTIVO') => ({ estudiante: { id, idAspirante: null, codigoEstudianteUis: `2020${id}`, cohorte: '2030-1', estado, fechaIngreso: '2030-01-01', fechaEgreso: null }, nombreCompleto: `Persona prueba ${id}`, numeroDocumento: '123', persona: { id: 70 }, programaId: 1, programaCodigoNombre: 'MISI' })
  const doc = (id = 80) => ({ id, tipoDocumentoTramiteId: 4, tipoDocumento: 'Documento sintético', nombreArchivo: 'prueba.pdf', estado: 'APROBADO', fechaCarga: '2030-01-01', secuencia: 1 })
  t.beforeEach(() => {
    clearEstudiantesListCache(); ui.storage.clear(); students = [raw()]; groups = [{ tipoTramite: 'MATRICULA', periodo: '2030-1', tramiteId: 60, documentos: [doc()] }]; failure = ''; writes = []; reads = []; content = ''; solicitudes = []
    ui.response((url, init) => {
      const u = new URL(url, 'https://test.invalid'); const path = u.pathname
      if (init.method === 'PUT' || init.method === 'POST') { writes.push({ path, body: JSON.parse(init.body) }); if (failure) return Response.json({ message: 'Cambio no disponible' }, { status: 409 }); return Response.json({ ok: true, data: { id: 80 } }) }
      reads.push(u)
      if (failure && (path.includes(failure) || (failure === 'egresados' && u.searchParams.get('egresados') === 'true'))) return Response.json({ message: 'Consulta no disponible' }, { status: 503 })
      if (path.endsWith('/programaAcademico')) return Response.json({ ok: true, data: [{ id: 1, nombre: 'Maestría en Ingeniería de Sistemas e Informática', codigoUis: 'MISI' }, { id: 2, nombre: 'Doctorado en Ciencias de la Computación', codigoUis: 'DCC' }] })
      if (path.endsWith('/consulta')) return Response.json({ ok: true, data: u.searchParams.get('egresados') === 'true' ? [raw(9, 'EGRESADO')] : students })
      if (path.includes('/by-estudiante-id/')) return Response.json({ ok: true, data: groups })
      if (path.endsWith('/document/80')) return Response.json({ ok: true, data: { contenidoBase64: content } })
      if (path.endsWith('/solicitudesAcademicas/estudiante')) return Response.json({ ok: true, data: solicitudes })
      if (path.endsWith('/document')) return Response.json({ ok: true, data: [] })
      if (path.endsWith('/zip')) return Response.json({ message: 'ZIP no disponible' }, { status: 503 })
      throw new Error(`Petición inesperada: ${url}`)
    })
  })
  const mount = (s, detail = false, id = '7') => {
    s.after(ui.cleanup); const user = { id: 10, roles: ['SECRETARIA_POSGRADOS'] }
    return ui.render(h(MemoryRouter, { initialEntries: [detail ? `/coordinacion/estudiantes/${id}` : '/lista'] }, h(AuthContext.Provider, { value: { session: { kind: 'SAPP', user }, user } }, h(Routes, null,
      h(Route, { path: '/lista', element: h(List) }), h(Route, { path: '/coordinacion/estudiantes/:estudianteId', element: h(Detail) })))))
  }
  const click = (v, name) => ui.fireEvent.click(v.getByRole('button', { name }))
  const change = (v, label, value) => ui.fireEvent.change(v.getByLabelText(label), { target: { value } })
  await t.test('tablero filtra nombre sin tildes, estado y periodo', async s => {
    students.push(raw(8, 'INACTIVO')); const v = mount(s); await v.findByText('Persona Prueba 7')
    assert.equal(v.queryAllByText('Persona Prueba 8').length, 0)
    change(v, 'Estado', ''); await v.findByText('Persona Prueba 8'); change(v, 'Nombre o código', 'persona prueba 7')
    assert.equal(v.queryAllByText('Persona Prueba 8').length, 0)
    change(v, 'Nombre o código', 'ausente'); assert.ok(v.getByText('No hay estudiantes que coincidan con los filtros seleccionados.'))
    click(v, 'Limpiar filtros'); await v.findByText('Persona Prueba 7')
  })
  await t.test('egresados se consultan bajo demanda y error permite reintentar', async s => {
    const v = mount(s); await v.findByText('Persona Prueba 7'); assert.equal(reads.filter(u => u.searchParams.get('egresados') === 'true').length, 0)
    failure = 'egresados'; click(v, 'Mostrar egresados'); await v.findByText('No pudimos cargar los egresados.')
    failure = ''; click(v, 'Reintentar'); await v.findByText('Persona Prueba 9'); click(v, 'Ocultar egresados')
    assert.equal(v.queryAllByText('Persona Prueba 9').length, 0)
  })
  await t.test('lista vacía y error de programas se comunican', async s => {
    students = []; const v = mount(s); await v.findByText('No hay estudiantes registrados para este programa.')
    await ui.cleanup(); failure = '/programaAcademico'; const v2 = mount(s); await v2.findByText(/Consulta no disponible/)
  })
  await t.test('perfil consulta documentos por id y muestra grupo de matrícula', async s => {
    const v = mount(s, true); await v.findByText('Documento sintético')
    assert.ok(v.getByRole('heading', { name: 'Persona Prueba 7' })); assert.ok(v.getByText('Periodo 2030-1'))
    assert.ok(reads.some(u => u.pathname.endsWith('/by-estudiante-id/7')))
    assert.equal(reads.filter(u => u.pathname.endsWith('/solicitudesAcademicas/estudiante')).length, 0)
  })
  await t.test('estado académico cambia sin volver a consultar documentos', async s => {
    const v = mount(s, true); await v.findByText('Documento sintético'); click(v, 'Inactivar estudiante'); await v.findByText('El estudiante ahora está inactivo.')
    assert.deepEqual(writes[0].body, { estado: 'INACTIVO' }); assert.ok(writes[0].path.endsWith('/7/estado'))
    assert.equal(reads.filter(u => u.pathname.endsWith('/by-estudiante-id/7')).length, 1)
    click(v, 'Marcar como egresado'); await v.findByText('El estudiante ahora está egresado.')
  })
  await t.test('fallo de estado conserva perfil y permite reintento', async s => {
    const v = mount(s, true); await v.findByText('Documento sintético'); failure = 'write'; click(v, 'Inactivar estudiante'); await v.findByText(/Cambio no disponible/)
    assert.ok(v.getByRole('button', { name: 'Inactivar estudiante' })); failure = ''; click(v, 'Inactivar estudiante'); await v.findByText('El estudiante ahora está inactivo.')
  })
  await t.test('admisión y solicitudes se abren por pestaña sin mezclar documentos', async s => {
    groups.push({ tipoTramite: 'ADMISION_ASPIRANTE', periodo: null, tramiteId: 61, documentos: [{ ...doc(), id: 81, tipoDocumento: 'Documento admisión', nombreArchivo: null }] })
    const v = mount(s, true); await v.findByText('Documento sintético'); ui.fireEvent.click(v.getByRole('tab', { name: 'Admisión' })); await v.findByText('Documento admisión')
    ui.fireEvent.click(v.getByRole('tab', { name: 'Solicitudes' })); await v.findByText(/No hay solicitudes/)
    assert.equal(reads.filter(u => u.pathname.endsWith('/solicitudesAcademicas/estudiante')).length, 1)
  })
  await t.test('archivo vacío y ZIP fallido muestran error recuperable', async s => {
    const v = mount(s, true); await v.findByText('Documento sintético'); click(v, /^Ver$/); await v.findByText('El documento no contiene archivo disponible.')
    click(v, /Descargar información/); await v.findByText(/ZIP no disponible/)
    await ui.waitFor(() => assert.equal(v.getByRole('button', { name: /Descargar información/ }).disabled, false))
  })
  await t.test('carga histórica incluye usuario, trámite y checksum y recarga metadatos', async s => {
    const v = mount(s, true); await v.findByText('Documento sintético')
    const bytes = new TextEncoder().encode('%PDF-sintético'); const f = new ui.dom.window.File([bytes], 'nuevo.pdf', { type: 'application/pdf' }); f.arrayBuffer = async () => bytes.buffer
    ui.fireEvent.change(v.container.querySelector('input[type=file]'), { target: { files: [f] } })
    await ui.waitFor(() => assert.equal(writes.length, 1)); await ui.waitFor(() => assert.equal(reads.filter(u => u.pathname.endsWith('/by-estudiante-id/7')).length, 2))
    assert.equal(writes[0].body.cargaHistorica, true); assert.equal(writes[0].body.tramiteId, 60); assert.equal(writes[0].body.usuarioCargaId, 10); assert.match(writes[0].body.checksum, /^[a-f0-9]{64}$/)
  })
  await t.test('id inválido y perfil inexistente no presentan acciones', async s => {
    let v = mount(s, true, 'invalido'); await v.findByText('El estudiante solicitado no es válido.')
    await ui.cleanup(); students = []; v = mount(s, true); await v.findByText('No se encontró información para el estudiante seleccionado.')
  })
})

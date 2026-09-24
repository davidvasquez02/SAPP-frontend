// Banco manual local: todas las peticiones se resuelven en memoria, sin llamadas al backend.
import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthContext } from '../../../src/context/Auth/context'
import { MatriculaFinancieraPage } from '../../../src/pages/MatriculaFinanciera/MatriculaFinancieraPage'
import { ProcesoLiquidacionPage } from '../../../src/pages/MatriculaFinanciera/ProcesoLiquidacionPage'
import { LiquidacionDetallePage } from '../../../src/pages/MatriculaFinanciera/LiquidacionDetallePage'
import { TarifasMatriculaPage } from '../../../src/pages/MatriculaFinanciera/TarifasMatriculaPage'
import '../../../src/styles/globals.css'

const proceso = { id: 1, periodoId: 1, periodo: '2026 - 2', estado: 'ABIERTO', valorSmmlv: 1524569, fuenteSmmlv: 'Fuente de prueba', porcentajeVotacion: 10, porcentajeSalud: 10, baseSalud: 'SMMLV', fechaLimiteRespuesta: '2026-12-15', resumen: {} }
const respuestas = { entregoTrabajoGrado: null, cumLaude: null, certificadoVotacion: null, deseaSalud: null }
const rows = Array.from({ length: 26 }, (_, i) => ({ id: i + 1, procesoId: 1, estudianteId: i + 1, codigoEstudiante: `PRUEBA-${i + 1}`, nombreCompleto: `Estudiante ficticio ${i + 1}`, programaId: 1, programa: '302 - MAESTRÍA EN INGENIERÍA DE SISTEMAS E INFORMÁTICA', programaCodigo: '302', tipoEstudiante: i === 0 ? 'NUEVO' : 'VIGENTE', semestre: i === 0 ? null : 3, promocion: null, estado: 'PENDIENTE_RESPUESTA', respuestas: { ...respuestas }, ajusteManual: 0, valorFinalManual: null, observaciones: null, totalFinal: null, alertas: ['SIN_RESPUESTA', 'PROMOCION_FALTANTE'], liquidada: false }))
let certificado = null
let ultimaPeticion = ''
const tarifas = [{ id: 1, programaId: 1, semestreDesde: 1, semestreHasta: 4, factorMatricula: 1, factorDerechos: 1, activo: true }]
const response = (data, status = 200, message = 'Operación de prueba') => new Response(JSON.stringify({ ok: status === 200, data, message }), { status, headers: { 'Content-Type': 'application/json' } })
window.fetch = async (input, options = {}) => {
  const url = new URL(String(input), window.location.origin)
  const path = url.pathname.replace(/^.*?\/api(?:\/sapp)?/, '')
  const body = options.body ? JSON.parse(String(options.body)) : {}
  ultimaPeticion = `${options.method ?? 'GET'} ${path} ${JSON.stringify(body)}`
  window.dispatchEvent(new Event('peticion-prueba'))
  if (path === '/periodoAcademico') return response([{ id: 1, anio: 2026, periodo: 2, anioPeriodo: '2026 - 2' }, { id: 2, anio: 2027, periodo: 1, anioPeriodo: '2027 - 1' }])
  if (path === '/programaAcademico') return response([{ id: 1, nombre: '302 - Maestría' }, { id: 2, nombre: '347 - Doctorado' }])
  if (path === '/estudiantes') return response([{ id: 99, codigoNombre: 'PRUEBA-99 · Readmisión ficticia' }])
  if (path === '/document') {
    if (options.method === 'POST') { certificado = { idDocumento: 1, nombreArchivoDocumento: body.nombreArchivo, versionDocumento: (certificado?.versionDocumento ?? 0) + 1, estadoDocumento: 'CARGADO', base64DocumentoContenido: body.contenidoBase64, mimeTypeDocumentoContenido: body.mimeType }; return response({ id: 1 }) }
    return response([{ idTipoDocumentoTramite: 39, codigoTipoDocumentoTramite: 'ANX-39', documentoCargado: !!certificado, documentoUploadedResponse: certificado }])
  }
  if (path.endsWith('/tarifas')) return response(tarifas)
  if (/\/tarifas\/\d+$/.test(path)) { Object.assign(tarifas[0], body); return response(tarifas[0]) }
  proceso.resumen = { convocados: rows.length, pendientes: rows.filter(r => r.estado === 'PENDIENTE_RESPUESTA').length, respondidas: rows.filter(r => r.estado === 'RESPONDIDA').length, noLiquidar: rows.filter(r => r.estado === 'NO_LIQUIDAR').length, liquidadas: rows.filter(r => r.estado === 'LIQUIDADA').length, conAlertas: rows.filter(r => r.alertas.length).length }
  if (path === '/liquidacionMatricula/procesos') {
    if (options.method === 'POST') Object.assign(proceso, body, { estado: 'BORRADOR' })
    return response(options.method === 'POST' ? proceso : [proceso])
  }
  if (/\/procesos\/1$/.test(path)) { if (options.method === 'PUT') Object.assign(proceso, body); return response(proceso) }
  if (path.endsWith('/procesos/1/liquidaciones')) {
    if (options.method === 'POST') { if (rows.some(r => r.estudianteId === body.estudianteId)) return response(null, 400, 'El estudiante ya está en el proceso'); const row = { ...rows[1], id: 99, estudianteId: body.estudianteId, codigoEstudiante: 'PRUEBA-99', tipoEstudiante: body.tipoEstudiante }; rows.push(row); return response(row) }
    return response(rows.filter(r => (!url.searchParams.get('estado') || r.estado === url.searchParams.get('estado')) && (!url.searchParams.get('tipo') || r.tipoEstudiante === url.searchParams.get('tipo')) && (!url.searchParams.get('texto') || r.codigoEstudiante.includes(url.searchParams.get('texto')))))
  }
  const filaMatch = /\/(liquidaciones|mias)\/(\d+)(?:\/(\w+))?$/.exec(path)
  if (filaMatch) {
    const row = rows.find(r => r.id === Number(filaMatch[2])); const action = filaMatch[3]
    if (!row) return response(null, 404, 'No existe la fila')
    if (action && proceso.estado === 'PUBLICADO') return response(null, 409, 'El proceso está publicado')
    if (action === 'respuestas') {
      if (row.tipoEstudiante === 'NUEVO' && ('entregoTrabajoGrado' in body || 'cumLaude' in body)) return response(null, 400, 'NUEVO solo admite votación y salud')
      row.respuestas = { ...row.respuestas, ...body }; row.estado = 'RESPONDIDA'; row.totalFinal = 3049138; row.alertas = ['PROMOCION_FALTANTE']
    }
    if (action === 'ajustes') { Object.assign(row, body); row.totalFinal = body.valorFinalManual ?? 3049138 + body.ajusteManual; row.alertas = [] }
    if (action === 'liquidada') { row.estado = body.liquidada ? 'LIQUIDADA' : 'RESPONDIDA'; row.liquidada = body.liquidada }
    if (action === 'excluir') { row.estado = 'NO_LIQUIDAR'; row.motivoExclusion = body.motivo; row.alertas = [] }
    if (action === 'reincluir') { row.estado = row.respuestas.deseaSalud == null ? 'PENDIENTE_RESPUESTA' : 'RESPONDIDA'; row.motivoExclusion = null }
    return response(row)
  }
  if (path.endsWith('/mias')) return response(rows.slice(0, 1).map(row => ({ liquidacionId: row.id, proceso, programa: row.programa, codigoEstudiante: row.codigoEstudiante, tipoEstudiante: row.tipoEstudiante, estado: row.estado, puedeResponder: proceso.estado === 'ABIERTO' && !['LIQUIDADA','NO_LIQUIDAR'].includes(row.estado), fueraDePlazo: false, respuestas: row.respuestas, preguntas: Object.keys(respuestas).map(clave => ({ clave, texto: clave === 'certificadoVotacion' ? '¿Tienes certificado de votación vigente?' : clave === 'deseaSalud' ? '¿Deseas derechos de salud UIS?' : clave, aplica: ['certificadoVotacion','deseaSalud'].includes(clave) })), certificado: { requerido: row.respuestas.certificadoVotacion === true, cargado: !!certificado }, valores: row.estado === 'LIQUIDADA' ? { totalFinal: row.totalFinal, desglose: null } : null })))
  if (path.endsWith('/cerrar')) { proceso.estado = 'CERRADO'; return response(proceso) }
  if (path.endsWith('/reabrir')) { proceso.estado = 'ABIERTO'; return response(proceso) }
  if (path.endsWith('/recalcular')) return response({ recalculadas: 1, sinCambios: rows.length - 1 })
  if (path.endsWith('/convocar')) return response({ creadas: 0, yaExistentes: rows.length, omitidos: [] })
  if (path.endsWith('/publicar')) { proceso.estado = 'PUBLICADO'; proceso.fechaLimitePago = body.fechaLimitePago; return response({ enviados: 0, omitidos: [{ estudianteId: 1, liquidacionId: 1, motivo: 'Aviso omitido en la prueba local' }] }) }
  if (/\/(enviarSolicitudes|enviarRecordatorio)$/.test(path)) return response({ enviados: (body.liquidacionIds?.length ?? rows.length) - 1, omitidos: [{ estudianteId: 1, liquidacionId: 1, motivo: 'Cuenta IAM pendiente (simulado)' }] })
  return response(null, 404, `Ruta no simulada: ${path}`)
}
function Preview() {
  const [student, setStudent] = useState(false); const [mobile, setMobile] = useState(false); const [version, setVersion] = useState(0); const [last, setLast] = useState('')
  useEffect(() => { const update = () => setLast(ultimaPeticion); window.addEventListener('peticion-prueba', update); return () => window.removeEventListener('peticion-prueba', update) }, [])
  const user = { id: 999, username: 'Prueba local', nombreCompleto: 'Cuenta ficticia', roles: [student ? 'ESTUDIANTE_POSGRADOS' : 'COORDINADOR_POSGRADOS'] }
  const session = { kind: 'SAPP', accessToken: '', user }
  return <><header style={{ padding: 16 }}><strong>Prueba local · datos ficticios · sin red</strong><button onClick={() => { setStudent(!student); setVersion(v => v + 1) }}>Cambiar a {student ? 'coordinación' : 'estudiante'}</button><button onClick={() => { document.body.classList.toggle('dark'); document.body.classList.toggle('light') }}>Cambiar tema</button><button onClick={() => setMobile(!mobile)}>Ancho móvil</button><details><summary>Última petición de prueba</summary><code>{last}</code></details></header><div style={{ maxWidth: mobile ? 390 : 1440, margin: 'auto' }}><AuthContext.Provider value={{ session, user, isAuthenticated: true }}><MemoryRouter key={version} initialEntries={['/matricula/financiera']}><Routes><Route path="/matricula/financiera" element={<MatriculaFinancieraPage />} /><Route path="/matricula/financiera/procesos/:procesoId" element={<ProcesoLiquidacionPage />} /><Route path="/matricula/financiera/procesos/:procesoId/liquidaciones/:liquidacionId" element={<LiquidacionDetallePage />} /><Route path="/matricula/financiera/tarifas" element={<TarifasMatriculaPage />} /></Routes></MemoryRouter></AuthContext.Provider></div></>
}
createRoot(document.getElementById('root')).render(<Preview />)


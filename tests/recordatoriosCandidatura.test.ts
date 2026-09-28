import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const trabajosGradoPageSource = readFileSync('src/pages/TrabajosGrado/TrabajosGradoPage.tsx', 'utf8')
const solicitudesPageSource = readFileSync('src/pages/Solicitudes/SolicitudesPage.tsx', 'utf8')
const componentSource = readFileSync(
  'src/modules/trabajos-grado/components/RecordatoriosCandidatura/RecordatoriosCandidatura.tsx',
  'utf8',
)
const apiSource = readFileSync('src/modules/trabajos-grado/evaluacion/api.ts', 'utf8')

test('la acción masiva solo se presenta al coordinador en proyectos de grado doctorales', () => {
  assert.match(trabajosGradoPageSource, /isCoordinador && nivel === 'doctorado' \? <RecordatoriosCandidatura \/> : null/)
  assert.doesNotMatch(solicitudesPageSource, /RecordatoriosCandidatura/)
  assert.doesNotMatch(componentSource, /SolicitudesTable/)
})

test('oculta los recordatorios cuando el período vigente ya notificó la apertura', () => {
  assert.match(componentSource, /import \{ getPeriodoMatriculaVigente \} from '\.\.\/\.\.\/\.\.\/matricula\/services\/matriculaAcademicaService'/)
  assert.match(componentSource, /getPeriodoMatriculaVigente\(\)/)
  assert.match(componentSource, /periodoVigente\?\.notificacionAperturaEnviada !== true/)
  assert.match(componentSource, /if \(mostrarRecordatorios !== true\) \{\s*return null/)
})

test('solicita confirmación antes de invocar el endpoint de recordatorios', () => {
  assert.match(componentSource, /Confirmar envío de recordatorios/)
  assert.match(componentSource, /enviarRecordatoriosCandidatura\(\)/)
  assert.doesNotMatch(componentSource, /SOLICITUD_RECORDATORIOS_CANDIDATURA_ID/)
  assert.match(apiSource, /httpPost<ApiResponse<ResultadoRecordatoriosCandidatura>>\('\/solicitudesAcademicas\/recordatorio-candidatura'\)/)
  assert.match(apiSource, /return resultado\.correosEnviados/)
})

test('explica que el backend selecciona a todos los estudiantes elegibles', () => {
  assert.match(componentSource, /todos los estudiantes que deben recibir el recordatorio/)
  assert.match(componentSource, /servidor determina los destinatarios elegibles/)
  assert.match(componentSource, /role="status"/)
  assert.match(componentSource, /role="alert"/)
})

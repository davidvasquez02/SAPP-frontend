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

test('solicita confirmación antes de invocar el endpoint de recordatorios', () => {
  assert.match(componentSource, /Confirmar envío de recordatorios/)
  assert.match(componentSource, /enviarRecordatorios\(SOLICITUD_RECORDATORIOS_CANDIDATURA_ID\)/)
  assert.match(componentSource, /SOLICITUD_RECORDATORIOS_CANDIDATURA_ID = 1/)
  assert.match(apiSource, /solicitud\/\$\{solicitudId\}\/recordatorios/)
})

test('explica que el backend selecciona a todos los estudiantes elegibles', () => {
  assert.match(componentSource, /todos los estudiantes que deben recibir el recordatorio/)
  assert.match(componentSource, /servidor determina los destinatarios elegibles/)
  assert.match(componentSource, /role="status"/)
  assert.match(componentSource, /role="alert"/)
})

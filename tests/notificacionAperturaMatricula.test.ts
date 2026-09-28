import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const pageSource = readFileSync('src/pages/Matricula/MatriculaPage.tsx', 'utf8')
const serviceSource = readFileSync('src/modules/matricula/services/matriculaAcademicaService.ts', 'utf8')

test('oculta la notificación de inicio solo después de refrescar el periodo notificado', () => {
  assert.match(serviceSource, /notificacionAperturaEnviada: boolean/)
  assert.match(pageSource, /periodoMatriculaVigente\?\.notificacionAperturaEnviada !== true \? <section className="matricula-page__card matricula-page__notification-card">/)
  assert.match(pageSource, /window\.setTimeout\(\(\) => \{/)
  assert.match(pageSource, /\}, 5000\);/)
  assert.match(pageSource, /void getPeriodoMatriculaVigente\(\)/)
  assert.match(pageSource, /isNotificacionConfirmationOpen/)
  assert.match(pageSource, /matricula-page__confirmation-modal/)
  assert.match(pageSource, /Enviar correo de inicio/)
  assert.doesNotMatch(pageSource, /window\.confirm\(/)
  assert.doesNotMatch(pageSource, /notificacionAperturaEnviada: true/)
})

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const matriculaSource = readFileSync('src/pages/Matricula/MatriculaPage.tsx', 'utf8')
const fechasSource = readFileSync('src/pages/ConfigFechasAdmisiones/ConfigFechasAdmisionesPage.tsx', 'utf8')
const matriculaServiceSource = readFileSync('src/modules/matricula/services/matriculaAcademicaService.ts', 'utf8')

test('coordinación no dispone del envío manual del correo de inicio de matrícula', () => {
  assert.doesNotMatch(matriculaSource, /Enviar correo de inicio/)
  assert.doesNotMatch(matriculaSource, /handleNotificarAperturaMatricula/)
  assert.doesNotMatch(matriculaSource, /notificarAperturaMatricula/)
  assert.doesNotMatch(matriculaServiceSource, /notificarAperturaMatricula/)
})

test('la creación del periodo informa que el recordatorio se enviará automáticamente', () => {
  assert.match(fechasSource, /form\.periodoId === null/)
  assert.match(fechasSource, /correo de recordatorio de inicio del proceso de matrícula se enviará automáticamente/)
  assert.match(fechasSource, /className="config-fechas-admisiones__notice" role="note"/)
})

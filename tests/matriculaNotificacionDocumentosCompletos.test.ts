import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const studentPageSource = readFileSync('src/pages/Matricula/MatriculaPage.tsx', 'utf8')
const coordinatorPageSource = readFileSync(
  'src/pages/MatriculaDetalleCoordinacion/MatriculaDetalleCoordinacionPage.tsx',
  'utf8',
)

test('notifica documentos completos solo después de terminar las cargas obligatorias', () => {
  assert.match(studentPageSource, /for \(const documento of documentosConCambios\)/)
  assert.match(studentPageSource, /const documentosActualizados = await getDocumentosMatriculaAcademica\(/)
  assert.match(studentPageSource, /tieneDocumentosObligatoriosCargados\(documentosActualizados\)/)
  assert.match(studentPageSource, /await notificarDocumentosCompletosMatricula\(/)
  assert.doesNotMatch(coordinatorPageSource, /notificarDocumentosCompletosMatricula/)
})

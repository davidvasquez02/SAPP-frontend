import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const pageSource = readFileSync('src/pages/Matricula/MatriculaPage.tsx', 'utf8')

test('solo muestra la actualización de matrícula existente cuando hay documentos rechazados', () => {
  assert.match(pageSource, /const hasRejectedDocuments = useMemo\(\s*\(\) => documentos\.some\(\(item\) => item\.estado === "RECHAZADO"\)/)
  assert.match(pageSource, /if \(hasExistingMatricula\) \{\s*return hasRejectedDocuments;/)
  assert.match(pageSource, /!isReadOnlyMatriculaFinalizada && \(!hasExistingMatricula \|\| hasRejectedDocuments\) \? \(/)
})

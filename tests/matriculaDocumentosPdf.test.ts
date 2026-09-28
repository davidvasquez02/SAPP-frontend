import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const tableSource = readFileSync('src/modules/matricula/components/DocumentosRequeridosTable/DocumentosRequeridosTable.tsx', 'utf8')
const pageSource = readFileSync('src/pages/Matricula/MatriculaPage.tsx', 'utf8')

test('restringe los documentos de matrícula a PDF en el selector y la validación', () => {
  assert.match(tableSource, /import \{ PDF_FILE_ACCEPT \} from '.*shared\/files\/pdfFile'/)
  assert.match(tableSource, /type="file"\s*accept=\{PDF_FILE_ACCEPT\}/)
  assert.match(pageSource, /file && !isPdfFile\(file\)/)
  assert.match(pageSource, /Solo se permiten archivos PDF\./)
})

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const pageSource = readFileSync('src/pages/MatriculaDetalleCoordinacion/MatriculaDetalleCoordinacionPage.tsx', 'utf8')
const stylesSource = readFileSync('src/pages/MatriculaDetalleCoordinacion/MatriculaDetalleCoordinacionPage.css', 'utf8')

test('muestra en un toast el resultado de la aprobación automática de matrícula', () => {
  assert.match(pageSource, /const \[toast, setToast\] = useState<ToastFeedback \| null>\(null\)/)
  assert.match(pageSource, /window\.setTimeout\(\(\) => setToast\(null\), 5_000\)/)
  assert.match(pageSource, /tone: 'success'/)
  assert.match(pageSource, /className={`matricula-detalle__toast matricula-detalle__toast--\$\{toast\.tone\}`}/)
  assert.doesNotMatch(pageSource, /window\.alert\(\s*'Todos los documentos obligatorios fueron aprobados/)
  assert.match(stylesSource, /\.matricula-detalle__toast \{\s*position: fixed;/)
})

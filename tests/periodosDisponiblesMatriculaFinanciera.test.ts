import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const apiSource = readFileSync('src/modules/matricula-financiera/api.ts', 'utf8')
const pageSource = readFileSync('src/pages/MatriculaFinanciera/MatriculaFinancieraPage.tsx', 'utf8')
const formSource = readFileSync('src/pages/MatriculaFinanciera/ParametrosProcesoForm.tsx', 'utf8')

test('consulta exclusivamente los periodos habilitados para crear un proceso financiero', () => {
  assert.match(apiSource, /listarPeriodosDisponibles/)
  assert.match(apiSource, /call<PeriodoFinanciera\[]>\('\/procesos\/periodosDisponibles', \{ signal \}\)/)
  assert.doesNotMatch(apiSource, /listarPeriodos\s*=/)
  assert.doesNotMatch(apiSource, /'\/periodoAcademico'/)
  assert.match(pageSource, /listarPeriodosDisponibles\(signal\)/)
})

test('el selector de creación no marca ni deshabilita periodos por procesos existentes', () => {
  assert.doesNotMatch(formSource, /occupied/)
  assert.doesNotMatch(formSource, /ya tiene proceso/)
  assert.doesNotMatch(formSource, /procesos\?: ProcesoLiquidacion\[]/)
  assert.match(formSource, /periodos\.map\(p => <option key=\{p\.id\} value=\{p\.id\}>/)
})

test('el filtro del tablero se construye con los procesos existentes y no con periodos disponibles', () => {
  assert.match(pageSource, /const periodosConProceso = Array\.from\(/)
  assert.match(pageSource, /periodosConProceso\.map\(p => <option key=\{p\.id\}/)
  assert.match(pageSource, /periodos=\{periodosDisponibles\.data \?\? \[\]\}/)
})

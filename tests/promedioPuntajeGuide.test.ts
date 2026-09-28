import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  getPromedioPuntajeReglas,
  getPromedioRangoLabel,
} from '../src/modules/admisiones/utils/promedioPuntajeGuide.ts'

const sectionPath = new URL(
  '../src/modules/admisiones/components/EvaluacionEtapaSection/EvaluacionEtapaSection.tsx',
  import.meta.url,
)

const reglas = [
  { promedioMin: 3.5, promedioMax: 3.5, puntos: 6 },
  { promedioMin: 3.51, promedioMax: 3.7, puntos: 9 },
  { promedioMin: 3.71, promedioMax: 3.9, puntos: 12 },
  { promedioMin: 3.91, promedioMax: 4.1, puntos: 15 },
  { promedioMin: 4.11, promedioMax: 4.3, puntos: 18 },
  { promedioMin: 4.31, promedioMax: 4.6, puntos: 21 },
  { promedioMin: 4.61, promedioMax: 4.8, puntos: 24 },
  { promedioMin: 4.81, promedioMax: 5, puntos: 26 },
]

test('reconoce únicamente la guía completa de promedio y puntaje', () => {
  assert.deepEqual(getPromedioPuntajeReglas(reglas), reglas)
  assert.equal(getPromedioPuntajeReglas([{ promedioMin: 3.5, puntos: 6 }]), null)
  assert.equal(getPromedioPuntajeReglas(['criterio libre']), null)
})

test('presenta valores exactos y rangos de forma compacta', () => {
  assert.equal(getPromedioRangoLabel(reglas[0]), '3,5')
  assert.equal(getPromedioRangoLabel(reglas[1]), '3,51–3,7')
  assert.equal(getPromedioRangoLabel(reglas[7]), '4,81–5')
})

test('el componente representa la guía como rangos y puntos', async () => {
  const source = await readFile(sectionPath, 'utf8')

  assert.match(source, /Promedio → puntos/)
  assert.match(source, /Puntaje según promedio de pregrado/)
  assert.match(source, /getPromedioRangoLabel\(regla\)/)
  assert.match(source, /\{regla\.puntos\} pts/)
})

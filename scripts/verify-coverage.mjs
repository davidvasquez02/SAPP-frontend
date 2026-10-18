import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve, relative } from 'node:path'

// Evita publicar un porcentaje parcial por una regresión de alcance/instrumentación.
const sources = readdirSync('src', { recursive: true, withFileTypes: true })
  .filter(entry => entry.isFile() && /\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts'))
  .map(entry => resolve(entry.parentPath, entry.name))
const report = JSON.parse(readFileSync('coverage/coverage-final.json', 'utf8'))
const measured = new Map(Object.entries(report).map(([file, data]) => [resolve(file), data]))
const missing = sources.filter(file => !measured.has(file))
assert.deepEqual(missing, [], 'todos los archivos ejecutables TS/TSX de src deben estar en cobertura')
const extra = [...measured.keys()].filter(file => !sources.includes(file))
assert.deepEqual(extra, [], 'el informe solo debe medir src, sin tests, vendor ni node_modules')

for (const file of [
  'src/components/FileSelectButton/FileSelectButton.tsx',
  'src/modules/estudiantes/services/estudiantesMockService.ts',
]) {
  const data = measured.get(resolve(file))
  assert.ok(data && Object.values(data.s).some(count => count > 0), `${file}: cobertura de Vite SSR debe mapear al archivo original`)
}

const tsxCount = sources.filter(file => file.endsWith('.tsx')).length
const untouched = [...measured].filter(([, data]) => Object.keys(data.s).length > 0 && Object.values(data.s).every(count => count === 0))
const withoutStatements = [...measured].filter(([, data]) => Object.keys(data.s).length === 0)
console.log(`Cobertura verificada: ${sources.length} archivos de src (${tsxCount} TSX); ${untouched.length} con sentencias sin ejecutar, incluidos con 0 %; ${withoutStatements.length} sin sentencias medibles (tipos/reexportaciones).`)
console.log(`Informe HTML: ${relative('.', resolve('coverage/index.html'))}`)

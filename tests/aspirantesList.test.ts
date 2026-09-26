import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import type { InscripcionAdmisionDto } from '../src/modules/admisiones/api/types.ts'
import {
  filterAspirantes,
  paginateAspirantes,
} from '../src/modules/admisiones/utils/aspirantesList.ts'

const admisionesHomePath = new URL(
  '../src/pages/AdmisionesHome/AdmisionesHomePage.tsx',
  import.meta.url,
)
const convocatoriaDetallePath = new URL(
  '../src/pages/ConvocatoriaDetalle/ConvocatoriaDetallePage.tsx',
  import.meta.url,
)
const createAspirantePath = new URL(
  '../src/modules/admisiones/components/CreateAspiranteModal/CreateAspiranteModal.tsx',
  import.meta.url,
)

const aspirante = (
  id: number,
  nombreAspirante: string,
  numeroInscripcion: string,
): InscripcionAdmisionDto => ({
  id,
  aspiranteId: id,
  nombreAspirante,
  numeroInscripcion,
  estado: 'EN_CONSTRUCCION',
  fechaInscripcion: '2026-09-26',
  fechaResultado: null,
  puntajeTotal: null,
  posicion_admision: null,
  periodoAcademico: '2026-2',
  programaAcademico: 'Doctorado',
  observaciones: null,
})

test('filtra en un mismo campo por nombre sin depender de tildes o por código de inscripción', () => {
  const items = [
    aspirante(1, 'Ángela María Pérez', '20260001'),
    aspirante(2, 'David Vásquez', '20260002'),
  ]

  assert.deepEqual(filterAspirantes(items, 'angela').map((item) => item.id), [1])
  assert.deepEqual(filterAspirantes(items, '60002').map((item) => item.id), [2])
})

test('pagina resultados y corrige páginas fuera de rango', () => {
  const items = Array.from({ length: 10 }, (_, index) =>
    aspirante(index + 1, `Aspirante ${index + 1}`, String(20260000 + index + 1)),
  )

  const secondPage = paginateAspirantes(items, 2, 4)
  assert.deepEqual(secondPage.items.map((item) => item.id), [5, 6, 7, 8])
  assert.deepEqual(
    { page: secondPage.page, pageCount: secondPage.pageCount, start: secondPage.start, end: secondPage.end },
    { page: 2, pageCount: 3, start: 5, end: 8 },
  )

  assert.equal(paginateAspirantes(items, 99, 4).page, 3)
})

test('el inicio de admisiones usa el título del módulo y oculta el código del programa', async () => {
  const source = await readFile(admisionesHomePath, 'utf8')

  assert.match(source, /title="Módulo de Admisiones"/)
  assert.doesNotMatch(source, /admisiones-program-card__code/)
})

test('crear aspirante omite observaciones y presenta progreso durante la carga', async () => {
  const source = await readFile(createAspirantePath, 'utf8')

  assert.doesNotMatch(source, /<span>Observaciones<\/span>/)
  assert.match(source, /observaciones: null/)
  assert.match(source, /create-aspirante-modal__spinner/)
  assert.match(source, /Subiendo documentos/)
  assert.ok(
    source.indexOf('create-aspirante-modal__progress')
      < source.indexOf('create-aspirante-modal__dialog'),
    'el progreso debe ser hermano y superponerse al diálogo completo',
  )
})

test('el listado usa búsqueda y paginación sin captura de arrastre horizontal', async () => {
  const source = await readFile(convocatoriaDetallePath, 'utf8')

  assert.match(source, /Buscar por nombre o código de inscripción/)
  assert.match(source, /Paginación de aspirantes/)
  assert.doesNotMatch(source, /onPointerDown|onClickCapture|scrollBoard/)
})

test('al completar la creación muestra un toast con el nombre del aspirante', async () => {
  const source = await readFile(convocatoriaDetallePath, 'utf8')

  assert.match(source, /Se creó al aspirante \$\{aspiranteNombre\} de manera correcta/)
  assert.match(source, /convocatoria-detalle__toast/)
  assert.match(source, /setIsCreateModalOpen\(false\)/)
})

test('presenta una cabecera jerárquica de convocatoria sin iconos decorativos', async () => {
  const source = await readFile(convocatoriaDetallePath, 'utf8')

  assert.match(source, /Convocatoria de admisión/)
  assert.match(source, /convocatoria-detalle__program-name/)
  assert.match(source, /<span>Código<\/span>/)
  assert.match(source, /<span>Período académico<\/span>/)
  assert.doesNotMatch(source, /📅|🎓|＋/)
})

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import type { EstudianteCoordinacion } from '../src/modules/estudiantes/types.ts'
import {
  ESTUDIANTES_PAGE_SIZE,
  getEstudiantesPageSize,
  paginateEstudiantes,
} from '../src/modules/estudiantes/utils/estudiantesList.ts'

const boardSource = readFileSync(
  'src/modules/estudiantes/components/StudentHorizontalBoard/StudentHorizontalBoard.tsx',
  'utf8',
)
const boardStyles = readFileSync(
  'src/modules/estudiantes/components/StudentHorizontalBoard/StudentHorizontalBoard.css',
  'utf8',
)
const pageSource = readFileSync(
  'src/pages/EstudiantesCoordinacion/EstudiantesCoordinacionPage.tsx',
  'utf8',
)

const estudiante = (id: number): EstudianteCoordinacion => ({
  id,
  idAspirante: id,
  codigo: String(20260000 + id),
  nombreCompleto: `Estudiante ${id}`,
  fotoUrl: null,
  tipoDocumento: 'CC',
  numeroDocumento: String(10000000 + id),
  correoInstitucional: `estudiante${id}@uis.edu.co`,
  correoPersonal: `estudiante${id}@example.com`,
  directorTg: null,
  personaId: id,
  personaIdpId: String(id),
  estadoAcademico: 'ACTIVO',
  cohorte: '2026-2',
  promedioAcumulado: 4,
  creditosAprobados: 0,
  creditosPendientes: 0,
  programaId: 1,
  programaNombre: 'Programa',
  fechaIngreso: null,
})

test('pagina estudiantes en una sola fila y corrige páginas fuera de rango', () => {
  const estudiantes = Array.from({ length: 18 }, (_, index) => estudiante(index + 1))

  assert.equal(ESTUDIANTES_PAGE_SIZE, 4)
  assert.deepEqual(
    paginateEstudiantes(estudiantes, 2).items.map((item) => item.id),
    [5, 6, 7, 8],
  )

  const lastPage = paginateEstudiantes(estudiantes, 99)
  assert.deepEqual(
    {
      ids: lastPage.items.map((item) => item.id),
      page: lastPage.page,
      pageCount: lastPage.pageCount,
      start: lastPage.start,
      end: lastPage.end,
    },
    { ids: [17, 18], page: 5, pageCount: 5, start: 17, end: 18 },
  )

  assert.deepEqual(
    paginateEstudiantes([], 4),
    { items: [], page: 1, pageCount: 1, start: 0, end: 0, total: 0 },
  )
})

test('adapta la cantidad de tarjetas para conservar una sola fila', () => {
  assert.equal(getEstudiantesPageSize(1600), 4)
  assert.equal(getEstudiantesPageSize(1100), 3)
  assert.equal(getEstudiantesPageSize(800), 2)
  assert.equal(getEstudiantesPageSize(500), 1)
})

test('el tablero usa cuadrícula paginada y no captura gestos ni clics', () => {
  assert.match(boardSource, /student-horizontal-board__grid/)
  assert.match(boardSource, /Paginación de estudiantes/)
  assert.match(boardSource, /Mostrando \{start\}–\{end\} de \{total\} perfiles/)
  assert.doesNotMatch(
    boardSource,
    /onPointerDown|onPointerMove|onClickCapture|onWheel|scrollBy|setPointerCapture|ResizeObserver/,
  )
  assert.doesNotMatch(boardStyles, /overflow-x|scroll-snap|cursor:\s*grab/)
  assert.match(boardSource, /const visibleColumns = Math\.max\(1, Math\.min\(columns, estudiantes\.length\)\)/)
  assert.match(boardSource, /gridTemplateColumns: `repeat\(\$\{visibleColumns\}, minmax\(0, 1fr\)\)`/)
  assert.match(boardSource, /maxWidth: `\$\{maxGridWidthRem\}rem`/)
  assert.match(boardStyles, /margin-inline:\s*auto/)
  assert.doesNotMatch(boardStyles, /grid-template-columns/)
})

test('estudiantes y egresados conservan paginaciones independientes', () => {
  assert.match(pageSource, /const \[estudiantesPage, setEstudiantesPage\]/)
  assert.match(pageSource, /const \[egresadosPage, setEgresadosPage\]/)
  assert.match(pageSource, /paginateEstudiantes\(estudiantesVisibles, estudiantesPage, estudiantesPageSize\)/)
  assert.match(pageSource, /paginateEstudiantes\(egresados, egresadosPage, estudiantesPageSize\)/)
  assert.match(pageSource, /onPageChange=\{setEstudiantesPage\}/)
  assert.match(pageSource, /onPageChange=\{setEgresadosPage\}/)
  assert.match(pageSource, /estudiantesPage: estudiantesPagination\.page/)
  assert.match(pageSource, /egresadosPage: egresadosPagination\.page/)
})

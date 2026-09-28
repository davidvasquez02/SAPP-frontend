import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import type { EstudianteCoordinacion } from '../src/modules/estudiantes/types.ts'
import {
  ESTUDIANTES_PAGE_SIZE,
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

test('pagina estudiantes en grupos de ocho y corrige páginas fuera de rango', () => {
  const estudiantes = Array.from({ length: 18 }, (_, index) => estudiante(index + 1))

  assert.equal(ESTUDIANTES_PAGE_SIZE, 8)
  assert.deepEqual(
    paginateEstudiantes(estudiantes, 2).items.map((item) => item.id),
    [9, 10, 11, 12, 13, 14, 15, 16],
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
    { ids: [17, 18], page: 3, pageCount: 3, start: 17, end: 18 },
  )

  assert.deepEqual(
    paginateEstudiantes([], 4),
    { items: [], page: 1, pageCount: 1, start: 0, end: 0, total: 0 },
  )
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
  assert.match(boardStyles, /grid-template-columns:\s*repeat\(auto-fill/)
})

test('estudiantes y egresados conservan paginaciones independientes', () => {
  assert.match(pageSource, /const \[estudiantesPage, setEstudiantesPage\]/)
  assert.match(pageSource, /const \[egresadosPage, setEgresadosPage\]/)
  assert.match(pageSource, /paginateEstudiantes\(estudiantesVisibles, estudiantesPage\)/)
  assert.match(pageSource, /paginateEstudiantes\(egresados, egresadosPage\)/)
  assert.match(pageSource, /onPageChange=\{setEstudiantesPage\}/)
  assert.match(pageSource, /onPageChange=\{setEgresadosPage\}/)
  assert.match(pageSource, /estudiantesPage: estudiantesPagination\.page/)
  assert.match(pageSource, /egresadosPage: egresadosPagination\.page/)
})

import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  formatBackendDateTime,
  getAsignaturaEstadoLabel,
  getMatriculaEstadoLabel,
  selectStudentMatricula,
} from '../src/modules/matricula/utils/matriculaPresentation.ts'

type FixtureMatricula = {
  id: number
  periodoId: number
  fechaSolicitud: string
  estado: string
  fechaRevision: string | null
  observaciones: string | null
  asignaturas: Array<{
    id: number
    matriculaId: number
    asignaturaId: number
    estado: string
    grupo: string | null
    observaciones: string | null
  }>
}

const loadFixture = async (): Promise<{ data: FixtureMatricula[] }> =>
  JSON.parse(await readFile(new URL('./fixtures/matricula/student-matriculas.json', import.meta.url), 'utf8'))

test('presenta el estado general, el estado de materia y la observación en su contexto', async () => {
  const fixture = await loadFixture()
  const selected = selectStudentMatricula(fixture.data, 12)

  assert.equal(selected?.id, 41)
  assert.equal(getMatriculaEstadoLabel(selected?.estado ?? ''), 'Finalizada')
  assert.equal(getAsignaturaEstadoLabel(selected?.asignaturas[0].estado ?? ''), 'Matriculada')
  assert.equal(selected?.observaciones, 'Revision manual')
})

test('conserva identificadores, estados distintos, grupo nulo y observaciones por asignatura', async () => {
  const selected = selectStudentMatricula((await loadFixture()).data, 12)
  assert.deepEqual(
    selected?.asignaturas.map(({ id, asignaturaId, estado, grupo, observaciones }) => ({ id, asignaturaId, estado, grupo, observaciones })),
    [
      { id: 501, asignaturaId: 101, estado: 'MATRICULADA', grupo: null, observaciones: null },
      { id: 502, asignaturaId: 102, estado: 'NO_MATRICULADA', grupo: 'A1', observaciones: 'Requiere ajustar el prerrequisito' },
    ],
  )
})

test('selecciona por periodo y no por posición; usa una etiqueta neutral para estados desconocidos', async () => {
  const fixture = await loadFixture()
  const previous = selectStudentMatricula([...fixture.data].reverse(), 11)
  const latest = selectStudentMatricula([...fixture.data].reverse())

  assert.equal(previous?.id, 35)
  assert.equal(latest?.id, 41)
  assert.equal(getMatriculaEstadoLabel(previous?.estado ?? ''), 'Estado nuevo')
  assert.equal(formatBackendDateTime(previous?.fechaRevision ?? null), '—')
})

test('formatea fechas sin agregar zona horaria ni desplazar día u hora', () => {
  assert.equal(formatBackendDateTime('2026-03-08 14:30:00'), '08/03/2026, 14:30')
  assert.equal(formatBackendDateTime('valor no estándar'), 'valor no estándar')
})

import assert from 'node:assert/strict'
import test from 'node:test'
import { filterMaterias, getNivelesMaterias } from '../src/modules/matricula/components/MateriasSelector/materiasFilter.ts'
import type { MateriaDto } from '../src/modules/matricula/types.ts'

const materias: MateriaDto[] = [
  { id: 1, codigo: 'N1', nombre: 'Seminario uno', nivel: 1 },
  { id: 2, codigo: 'N2', nombre: 'Seminario dos', nivel: 2 },
  { id: 3, codigo: 'EL1', nombre: 'Electiva avanzada', nivel: null },
]

test('obtiene niveles únicos y ordenados sin convertir electivas en un nivel', () => {
  assert.deepEqual(getNivelesMaterias([...materias, { ...materias[0], id: 4 }]), [1, 2])
})

test('filtra por nivel y mantiene disponibles las electivas', () => {
  assert.deepEqual(filterMaterias(materias, new Set(), '', 2).map(({ id }) => id), [2, 3])
})

test('combina nivel y búsqueda y excluye las materias ya seleccionadas', () => {
  assert.deepEqual(filterMaterias(materias, new Set([2]), 'electiva', 2).map(({ id }) => id), [3])
})

import { documentosMock } from '../mock/documentos.mock'
import { materiasMock } from '../mock/materias.mock'
import { matriculaConvocatoriaMock } from '../mock/matriculaConvocatoria.mock'
import type { DocumentoRequerido, MateriaDto, MatriculaConvocatoria } from '../types'

const waitRandomDelay = async () => {
  const delayMs = Math.floor(Math.random() * 101) + 150
  await new Promise((resolve) => setTimeout(resolve, delayMs))
}

export async function fetchMatriculaConvocatoria(): Promise<MatriculaConvocatoria> {
  await waitRandomDelay()
  return matriculaConvocatoriaMock
}

export async function fetchMateriasCatalogo(): Promise<MateriaDto[]> {
  await waitRandomDelay()
  return materiasMock
}

export async function fetchDocumentosRequeridos(): Promise<DocumentoRequerido[]> {
  await waitRandomDelay()
  return documentosMock
}

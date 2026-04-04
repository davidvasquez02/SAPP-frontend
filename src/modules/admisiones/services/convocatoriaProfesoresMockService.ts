export async function assignProfesoresToConvocatoria(params: {
  convocatoriaId: number
  profesoresId: number[]
}): Promise<void> {
  const { profesoresId } = params

  await new Promise((resolve) => setTimeout(resolve, 250))

  if (profesoresId.length === 0) {
    return
  }

  if (profesoresId.includes(999)) {
    throw new Error('Error mock al asignar profesores a la convocatoria.')
  }
}

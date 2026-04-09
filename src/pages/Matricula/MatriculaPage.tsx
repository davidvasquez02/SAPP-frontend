import { useEffect, useMemo, useState } from 'react'
import { ModuleLayout } from '../../components'
import { hasAnyRole } from '../../auth/roleGuards'
import { useAuth } from '../../context/Auth'
import type { AuthUser } from '../../context/Auth/types'
import DocumentosRequeridosTable from '../../modules/matricula/components/DocumentosRequeridosTable/DocumentosRequeridosTable'
import MatriculaClosedState from '../../modules/matricula/components/MatriculaClosedState/MatriculaClosedState'
import MateriasSelectedTable from '../../modules/matricula/components/MateriasSelectedTable/MateriasSelectedTable'
import MateriasSelector from '../../modules/matricula/components/MateriasSelector/MateriasSelector'
import {
  fetchDocumentosRequeridos,
  fetchMatriculaConvocatoria,
} from '../../modules/matricula/services/matriculaMockService'
import {
  crearMatriculaAcademica,
  getAsignaturasPorPrograma,
  getMatriculaVigenteValidationByEstudiante,
} from '../../modules/matricula/services/matriculaAcademicaService'
import type { DocumentoRequerido, MateriaDto, MateriaSeleccionada, MatriculaConvocatoria } from '../../modules/matricula/types'
import './MatriculaPage.css'

const MatriculaPage = () => {
  const { session } = useAuth()
  const roles = useMemo(() => (session?.kind === 'SAPP' ? session.user.roles : []), [session])
  const isEstudiante = hasAnyRole(roles, ['ESTUDIANTE'])

  const [loadingConvocatoria, setLoadingConvocatoria] = useState(false)
  const [loadingForm, setLoadingForm] = useState(false)
  const [convocatoria, setConvocatoria] = useState<MatriculaConvocatoria | null>(null)
  const [materiasCatalogo, setMateriasCatalogo] = useState<MateriaDto[]>([])
  const [documentos, setDocumentos] = useState<DocumentoRequerido[]>([])
  const [selectedMaterias, setSelectedMaterias] = useState<MateriaSeleccionada[]>([])
  const [errorConvocatoria, setErrorConvocatoria] = useState<string | null>(null)
  const [errorForm, setErrorForm] = useState<string | null>(null)
  const [matriculaValidationMessage, setMatriculaValidationMessage] = useState<string | null>(null)
  const [canCreateMatricula, setCanCreateMatricula] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [periodoId, setPeriodoId] = useState<number>(1)

  const applyMatriculaValidation = (
    validation: Awaited<ReturnType<typeof getMatriculaVigenteValidationByEstudiante>>,
    materias: MateriaDto[],
  ) => {
    if (validation.status === 'EXISTS') {
      setCanCreateMatricula(false)
      setMatriculaValidationMessage('El estudiante ya tiene matrícula para el periodo vigente.')
      setPeriodoId(validation.matricula.periodoId)
      setConvocatoria((current) =>
        current
          ? {
              ...current,
              periodoLabel: validation.matricula.periodoAcademico,
            }
          : current,
      )

      const selectedFromMatricula = validation.matricula.asignaturas
        .map((asignatura) => {
          const materiaCatalogo = materias.find((item) => item.id === asignatura.asignaturaId)
          if (!materiaCatalogo) {
            return null
          }

          return {
            ...materiaCatalogo,
            grupo: asignatura.grupo,
            addedAt: new Date().toISOString(),
          } satisfies MateriaSeleccionada
        })
        .filter((item): item is MateriaSeleccionada => item !== null)

      setSelectedMaterias(selectedFromMatricula)
      return
    }

    if (validation.status === 'NO_ACTIVE_PERIOD') {
      setCanCreateMatricula(false)
      setMatriculaValidationMessage(validation.message)
      return
    }

    setCanCreateMatricula(true)
    setMatriculaValidationMessage(null)
  }

  const estudianteId = useMemo(() => {
    if (session?.kind !== 'SAPP') {
      return null
    }

    return (session.user as AuthUser).estudiante?.id ?? null
  }, [session])

  useEffect(() => {
    if (!isEstudiante || !estudianteId) {
      return
    }

    let cancelled = false

    const loadMatriculaState = async () => {
      let loadedConvocatoria = false
      setLoadingConvocatoria(true)
      setErrorConvocatoria(null)

      try {
        const matriculaValidation = await getMatriculaVigenteValidationByEstudiante(estudianteId)
        if (cancelled) {
          return
        }

        const convocatoriaResult = await fetchMatriculaConvocatoria()
        if (cancelled) {
          return
        }

        loadedConvocatoria = true
        setConvocatoria(convocatoriaResult)

        if (!convocatoriaResult.isOpen) {
          return
        }

        setLoadingForm(true)
        setErrorForm(null)

        const [materiasResult, documentosResult] = await Promise.all([
          getAsignaturasPorPrograma(1),
          fetchDocumentosRequeridos(),
        ])

        if (cancelled) {
          return
        }

        setMateriasCatalogo(materiasResult)
        setDocumentos(documentosResult)

        applyMatriculaValidation(matriculaValidation, materiasResult)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No fue posible cargar la información de matrícula.'

        if (!cancelled) {
          if (!loadedConvocatoria) {
            setErrorConvocatoria(message)
          } else {
            setErrorForm(message)
          }
        }
      } finally {
        if (!cancelled) {
          setLoadingConvocatoria(false)
          setLoadingForm(false)
        }
      }
    }

    void loadMatriculaState()

    return () => {
      cancelled = true
    }
  }, [estudianteId, isEstudiante])

  const handleAddMateria = (materia: MateriaDto) => {
    setSelectedMaterias((current) => {
      if (current.some((item) => item.id === materia.id)) {
        return current
      }

      return [...current, { ...materia, grupo: '', addedAt: new Date().toISOString() }]
    })
  }

  const handleConfirmMatricula = async () => {
    if (!estudianteId) {
      setErrorForm('No fue posible identificar el estudiante autenticado.')
      return
    }

    const hasInvalidGrupo = selectedMaterias.some((materia) => !materia.grupo.trim())
    if (hasInvalidGrupo) {
      setErrorForm('Debes asignar un grupo para cada materia antes de confirmar.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorForm(null)

      const latestValidation = await getMatriculaVigenteValidationByEstudiante(estudianteId)
      applyMatriculaValidation(latestValidation, materiasCatalogo)

      if (latestValidation.status !== 'CAN_CREATE') {
        setErrorForm(latestValidation.message || 'No es posible crear matrícula en este momento.')
        return
      }

      await crearMatriculaAcademica({
        estudianteId,
        periodoId,
        asignaturas: selectedMaterias.map((materia) => ({
          asignaturaId: materia.id,
          grupo: materia.grupo.trim(),
        })),
      })

      const matriculaValidation = await getMatriculaVigenteValidationByEstudiante(estudianteId)
      applyMatriculaValidation(matriculaValidation, materiasCatalogo)

      window.alert('Matrícula registrada correctamente.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No fue posible registrar la matrícula.'
      setErrorForm(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isEstudiante) {
    return (
      <ModuleLayout title="Matrícula">
        <p className="matricula-page__placeholder">No disponible para tu rol.</p>
      </ModuleLayout>
    )
  }

  return (
    <ModuleLayout title="Proceso de matrícula">
      <div className="matricula-page">
        <header className="matricula-page__header">
          <h3>Proceso de matrícula</h3>
          {convocatoria?.periodoLabel ? <p>Periodo académico: {convocatoria.periodoLabel}</p> : null}
        </header>

        {loadingConvocatoria ? <p className="matricula-page__status">Cargando convocatoria...</p> : null}
        {errorConvocatoria ? <p className="matricula-page__error">{errorConvocatoria}</p> : null}

        {!loadingConvocatoria && convocatoria && !convocatoria.isOpen ? (
          <MatriculaClosedState message={convocatoria.mensaje} />
        ) : null}

        {!loadingConvocatoria && convocatoria?.isOpen ? (
          <>
            <section className="matricula-page__card">
              <h4>Selección de materias</h4>
              <p className="matricula-page__description">Agrega las materias que cursarás en este periodo.</p>
              {loadingForm ? <p className="matricula-page__status">Cargando materias...</p> : null}
              {errorForm ? <p className="matricula-page__error">{errorForm}</p> : null}
              {matriculaValidationMessage ? <p className="matricula-page__status">{matriculaValidationMessage}</p> : null}
              {!loadingForm && !errorForm ? (
                <>
                  <MateriasSelector materias={materiasCatalogo} selected={selectedMaterias} onAdd={handleAddMateria} />
                  <MateriasSelectedTable
                    selected={selectedMaterias}
                    onGrupoChange={(id, grupo) =>
                      setSelectedMaterias((current) =>
                        current.map((item) => (item.id === id ? { ...item, grupo } : item)),
                      )
                    }
                    onRemove={(id) => setSelectedMaterias((current) => current.filter((item) => item.id !== id))}
                  />
                </>
              ) : null}
            </section>

            <section className="matricula-page__card">
              <h4>Cargue de documentos</h4>
              <p className="matricula-page__description">Revisa y carga los documentos solicitados para la matrícula.</p>
              {loadingForm ? <p className="matricula-page__status">Cargando documentos...</p> : null}
              {!loadingForm && !errorForm ? <DocumentosRequeridosTable documentos={documentos} /> : null}
            </section>

            <div className="matricula-page__actions">
              <button
                type="button"
                className="matricula-page__confirm"
                disabled={selectedMaterias.length === 0 || isSubmitting || !canCreateMatricula}
                onClick={() => void handleConfirmMatricula()}
              >
                {isSubmitting ? 'Confirmando...' : 'Confirmar matrícula'}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </ModuleLayout>
  )
}

export default MatriculaPage

import { useEffect, useMemo, useState } from 'react'
import { ModuleLayout } from '../../components'
import { hasAnyRole } from '../../auth/roleGuards'
import { useAuth } from '../../context/Auth'
import DocumentosRequeridosTable from '../../modules/matricula/components/DocumentosRequeridosTable/DocumentosRequeridosTable'
import MatriculaClosedState from '../../modules/matricula/components/MatriculaClosedState/MatriculaClosedState'
import MateriasSelectedTable from '../../modules/matricula/components/MateriasSelectedTable/MateriasSelectedTable'
import MateriasSelector from '../../modules/matricula/components/MateriasSelector/MateriasSelector'
import {
  fetchDocumentosRequeridos,
  fetchMateriasCatalogo,
  fetchMatriculaConvocatoria,
} from '../../modules/matricula/services/matriculaMockService'
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

  useEffect(() => {
    if (!isEstudiante) {
      return
    }

    let cancelled = false

    const loadMatriculaState = async () => {
      let loadedConvocatoria = false
      setLoadingConvocatoria(true)
      setErrorConvocatoria(null)

      try {
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
          fetchMateriasCatalogo(),
          fetchDocumentosRequeridos(),
        ])

        if (cancelled) {
          return
        }

        setMateriasCatalogo(materiasResult)
        setDocumentos(documentosResult)
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
  }, [isEstudiante])

  const handleAddMateria = (materia: MateriaDto) => {
    setSelectedMaterias((current) => {
      if (current.some((item) => item.id === materia.id)) {
        return current
      }

      return [...current, { ...materia, addedAt: new Date().toISOString() }]
    })
  }

  const handleConfirmMatricula = () => {
    window.alert('Matrícula confirmada (mock)')
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
              {!loadingForm && !errorForm ? (
                <>
                  <MateriasSelector materias={materiasCatalogo} selected={selectedMaterias} onAdd={handleAddMateria} />
                  <MateriasSelectedTable
                    selected={selectedMaterias}
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
                disabled={selectedMaterias.length === 0}
                onClick={handleConfirmMatricula}
              >
                Confirmar matrícula
              </button>
            </div>
          </>
        ) : null}
      </div>
    </ModuleLayout>
  )
}

export default MatriculaPage

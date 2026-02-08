import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import { useAuth } from '../../context/Auth'
import { ROLES, hasAnyRole } from '../../auth/roleGuards'
import { getInscripcionesByConvocatoria } from '../../modules/admisiones/api/inscripcionAdmisionService'
import type { InscripcionAdmisionDto } from '../../modules/admisiones/api/types'
import { CreateAspiranteModal } from '../../modules/admisiones/components/CreateAspiranteModal/CreateAspiranteModal'
import StudentCard from '../../modules/admisiones/components/StudentCard/StudentCard'
import { getMockStudentPhotoUrl } from '../../modules/admisiones/utils/mockStudentPhoto'
import { resolveProgramaIdFromInscripciones } from '../../modules/admisiones/utils/resolveProgramaId'
import './ConvocatoriaDetallePage.css'

const ConvocatoriaDetallePage = () => {
  const { convocatoriaId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { session } = useAuth()
  const [inscripciones, setInscripciones] = useState<InscripcionAdmisionDto[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const { periodoAcademico, periodoLabel, programaNombre, programaId } = useMemo(() => {
    return (
      (location.state as
        | {
            periodoAcademico?: string
            periodoLabel?: string
            programaNombre?: string
            programaId?: number
          }
        | null) ?? {}
    )
  }, [location.state])

  const resolvedProgramaId = useMemo(() => {
    if (typeof programaId === 'number') {
      return programaId
    }

    return resolveProgramaIdFromInscripciones(inscripciones)
  }, [inscripciones, programaId])

  const canCreateAspirante =
    session?.kind === 'SAPP' &&
    hasAnyRole(session.user.roles, [ROLES.COORDINACION, ROLES.SECRETARIA, ROLES.ADMIN])

  const periodoConvocatoria =
    periodoLabel ?? periodoAcademico ?? inscripciones[0]?.periodoAcademico ?? null
  const pageTitle = programaNombre && periodoConvocatoria
    ? `Convocatoria - ${programaNombre} · ${periodoConvocatoria}`
    : periodoConvocatoria
      ? `Convocatoria - ${periodoConvocatoria}`
      : 'Convocatoria'

  const loadInscripciones = useCallback(async () => {
    if (!convocatoriaId) {
      setError('Convocatoria inválida.')
      return
    }

    const convocatoriaIdNumber = Number(convocatoriaId)

    if (Number.isNaN(convocatoriaIdNumber)) {
      setError('Convocatoria inválida.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await getInscripcionesByConvocatoria(convocatoriaIdNumber)
      setInscripciones(data)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No fue posible cargar las inscripciones.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [convocatoriaId])

  useEffect(() => {
    if (!convocatoriaId) {
      setError('Convocatoria inválida.')
      return
    }

    const convocatoriaIdNumber = Number(convocatoriaId)

    if (Number.isNaN(convocatoriaIdNumber)) {
      setError('Convocatoria inválida.')
      return
    }

    loadInscripciones()
  }, [convocatoriaId, loadInscripciones])

  const handleRowClick = (inscripcion: InscripcionAdmisionDto) => {
    if (!convocatoriaId) {
      return
    }

    navigate(
      `/admisiones/convocatoria/${convocatoriaId}/inscripcion/${inscripcion.id}`,
      {
        state: {
          nombreAspirante: inscripcion.nombreAspirante,
          periodoAcademico: inscripcion.periodoAcademico,
          inscripcionId: inscripcion.id,
        },
      }
    )
  }

  const handleCreated = useCallback(() => {
    setSuccessMessage('Aspirante registrado (mock). Revisa la consola para ver el payload.')
  }, [])

  return (
    <ModuleLayout title="Admisiones">
      <section className="convocatoria-detalle">
        <Link className="convocatoria-detalle__back" to="/admisiones">
          ← Volver
        </Link>

        <header className="convocatoria-detalle__header">
          <div>
            <h1 className="convocatoria-detalle__title">{pageTitle}</h1>
            {successMessage ? (
              <p className="convocatoria-detalle__status convocatoria-detalle__status--success">
                {successMessage}
              </p>
            ) : null}
          </div>
          {canCreateAspirante ? (
            <div className="convocatoria-detalle__actions">
              <button
                type="button"
                className="convocatoria-detalle__create-button"
                onClick={() => setIsCreateModalOpen(true)}
                disabled={!resolvedProgramaId || isLoading}
              >
                Crear aspirante
              </button>
              {!resolvedProgramaId && !isLoading && !error ? (
                <p className="convocatoria-detalle__status convocatoria-detalle__status--error">
                  No se pudo determinar el programa de la convocatoria.
                </p>
              ) : null}
            </div>
          ) : null}
        </header>

        {isLoading ? (
          <div className="convocatoria-detalle__skeletons" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="convocatoria-detalle__skeleton" />
            ))}
          </div>
        ) : null}

        {error ? (
          <div className="convocatoria-detalle__status convocatoria-detalle__status--error">
            <p>{error}</p>
            <button
              className="convocatoria-detalle__retry"
              type="button"
              onClick={loadInscripciones}
            >
              Reintentar
            </button>
          </div>
        ) : null}

        {!isLoading && !error && inscripciones.length === 0 ? (
          <p className="convocatoria-detalle__status">
            No hay inscripciones para esta convocatoria.
          </p>
        ) : null}

        {!isLoading && !error && inscripciones.length > 0 ? (
          <div className="convocatoria-detalle__grid">
            {inscripciones.map((inscripcion) => (
              <StudentCard
                key={inscripcion.id}
                inscripcion={inscripcion}
                photoUrl={getMockStudentPhotoUrl(
                  inscripcion.aspiranteId,
                  inscripcion.nombreAspirante
                )}
                onClick={() => handleRowClick(inscripcion)}
              />
            ))}
          </div>
        ) : null}
      </section>

      <CreateAspiranteModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        programaId={resolvedProgramaId}
        onCreated={handleCreated}
      />
    </ModuleLayout>
  )
}

export default ConvocatoriaDetallePage

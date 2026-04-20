import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import { useAuth } from '../../context/Auth'
import { ROLES, hasAnyRole } from '../../auth/roleGuards'
import { getConvocatoriasAdmision } from '../../modules/admisiones/api/convocatoriaAdmisionService'
import type { ConvocatoriaAdmisionDto } from '../../modules/admisiones/api/convocatoriaAdmisionTypes'
import { getInscripcionesByConvocatoria } from '../../modules/admisiones/api/inscripcionAdmisionService'
import type { InscripcionAdmisionDto } from '../../modules/admisiones/api/types'
import { CreateAspiranteModal } from '../../modules/admisiones/components/CreateAspiranteModal/CreateAspiranteModal'
import StudentCard from '../../modules/admisiones/components/StudentCard/StudentCard'
import { isConvocatoriaVigente } from '../../modules/admisiones/utils/convocatoriaEstado'
import { getMockStudentPhotoUrl } from '../../modules/admisiones/utils/mockStudentPhoto'
import { resolveProgramaIdFromInscripciones } from '../../modules/admisiones/utils/resolveProgramaId'
import { getFotosDocumentoByTramites } from '../../modules/documentos/api/documentoFotoService'
import { CODIGO_TIPO_TRAMITE_ADMISION_ASPIRANTE } from '../../modules/documentos/constants'
import './ConvocatoriaDetallePage.css'

const CODIGO_TIPO_DOCUMENTO_FOTO = 'ANX-4'

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
  const [convocatoria, setConvocatoria] = useState<ConvocatoriaAdmisionDto | null>(null)
  const [fotosPorAspiranteId, setFotosPorAspiranteId] = useState<Record<number, string>>({})

  const { periodoAcademico, periodoLabel, programaNombre, programaId, cupos } = useMemo(() => {
    return (
      (location.state as
        | {
            periodoAcademico?: string
            periodoLabel?: string
            programaNombre?: string
            programaId?: number
            cupos?: number
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
  const cuposConvocatoria = typeof cupos === 'number' ? cupos : null
  const cuposExcedidos =
    typeof cuposConvocatoria === 'number' && inscripciones.length >= cuposConvocatoria
  const convocatoriaCerrada = convocatoria ? !isConvocatoriaVigente(convocatoria) : false

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
      const [data, convocatorias] = await Promise.all([
        getInscripcionesByConvocatoria(convocatoriaIdNumber),
        getConvocatoriasAdmision(),
      ])
      setInscripciones(data)
      setConvocatoria(
        convocatorias.find((item) => item.id === convocatoriaIdNumber) ?? null
      )
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

  useEffect(() => {
    let isMounted = true

    const loadFotos = async () => {
      const aspiranteIds = inscripciones.map((inscripcion) => inscripcion.aspiranteId)

      if (aspiranteIds.length === 0) {
        setFotosPorAspiranteId({})
        return
      }

      const fotos = await getFotosDocumentoByTramites({
        codigoTipoTramite: CODIGO_TIPO_TRAMITE_ADMISION_ASPIRANTE,
        codigoTipoDocumentoTramite: CODIGO_TIPO_DOCUMENTO_FOTO,
        tramiteIds: aspiranteIds,
      })

      if (isMounted) {
        setFotosPorAspiranteId(fotos)
      }
    }

    void loadFotos()

    return () => {
      isMounted = false
    }
  }, [inscripciones])

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
          inscripcionEstado: inscripcion.estado,
        },
      }
    )
  }

  const handleCreated = useCallback(
    (result: { uploadSummary: { failedItems: { id: number }[] } }) => {
      if (result.uploadSummary.failedItems.length > 0) {
        setSuccessMessage(
          `Aspirante creado. Falló la carga de ${result.uploadSummary.failedItems.length} documento(s).`
        )
      } else {
        setSuccessMessage('Aspirante creado y documentos cargados correctamente.')
      }
      loadInscripciones()
    },
    [loadInscripciones],
  )

  const handleOpenCreateAspirante = useCallback(() => {
    if (convocatoriaCerrada) {
      window.alert('No es posible crear aspirantes: la convocatoria está cerrada.')
      return
    }

    if (cuposExcedidos) {
      window.alert(
        `No es posible crear más aspirantes: la convocatoria alcanzó su cupo máximo (${cuposConvocatoria}).`
      )
      return
    }

    setIsCreateModalOpen(true)
  }, [convocatoriaCerrada, cuposConvocatoria, cuposExcedidos])

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
                onClick={handleOpenCreateAspirante}
                disabled={!resolvedProgramaId || isLoading || cuposExcedidos || convocatoriaCerrada}
              >
                Crear aspirante
              </button>
              {!resolvedProgramaId && !isLoading && !error ? (
                <p className="convocatoria-detalle__status convocatoria-detalle__status--error">
                  No se pudo determinar el programa de la convocatoria.
                </p>
              ) : null}
              {cuposExcedidos ? (
                <p className="convocatoria-detalle__status convocatoria-detalle__status--error">
                  Cupo máximo alcanzado ({cuposConvocatoria}). No se pueden registrar más aspirantes.
                </p>
              ) : null}
              {convocatoriaCerrada ? (
                <p className="convocatoria-detalle__status convocatoria-detalle__status--error">
                  La convocatoria está cerrada. No se pueden registrar nuevos aspirantes.
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
                photoUrl={
                  fotosPorAspiranteId[inscripcion.aspiranteId] ||
                  getMockStudentPhotoUrl(inscripcion.aspiranteId, inscripcion.nombreAspirante)
                }
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

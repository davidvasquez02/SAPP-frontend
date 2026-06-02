import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import { ROLES, hasAnyRole } from '../../auth/roleGuards'
import { useAuth } from '../../context/Auth'
import { getConvocatoriasAdmision } from '../../modules/admisiones/api/convocatoriaAdmisionService'
import type { ConvocatoriaAdmisionDto } from '../../modules/admisiones/api/convocatoriaAdmisionTypes'
import { admitirAspiranteComoEstudiante } from '../../modules/admisiones/api/estudianteAdmisionService'
import { getInscripcionesByConvocatoria } from '../../modules/admisiones/api/inscripcionAdmisionService'
import type { InscripcionAdmisionDto } from '../../modules/admisiones/api/types'
import { CreateAspiranteModal } from '../../modules/admisiones/components/CreateAspiranteModal/CreateAspiranteModal'
import StudentCard from '../../modules/admisiones/components/StudentCard/StudentCard'
import { isConvocatoriaVigente } from '../../modules/admisiones/utils/convocatoriaEstado'
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
  const [convocatoria, setConvocatoria] = useState<ConvocatoriaAdmisionDto | null>(null)
  const [admitidosConvertidos, setAdmitidosConvertidos] = useState<Record<number, number>>({})
  const [selectedAdmitidoId, setSelectedAdmitidoId] = useState<number | null>(null)
  const [codigoEstudiante, setCodigoEstudiante] = useState('')
  const [correoInstitucional, setCorreoInstitucional] = useState('')
  const [isSubmittingEstudiante, setIsSubmittingEstudiante] = useState(false)

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

  const parsedConvocatoriaId = useMemo(() => {
    if (!convocatoriaId) {
      return null
    }

    const convocatoriaIdNumber = Number(convocatoriaId)
    return Number.isNaN(convocatoriaIdNumber) ? null : convocatoriaIdNumber
  }, [convocatoriaId])

  const periodoConvocatoria =
    periodoLabel ?? periodoAcademico ?? inscripciones[0]?.periodoAcademico ?? null
  const pageTitle = programaNombre && periodoConvocatoria
    ? `Convocatoria - ${periodoConvocatoria} - ${programaNombre}`
    : periodoConvocatoria
      ? `Convocatoria - ${periodoConvocatoria}`
      : 'Convocatoria'

  const cuposConvocatoria = typeof cupos === 'number' ? cupos : null
  const cuposExcedidos = typeof cuposConvocatoria === 'number' && inscripciones.length >= cuposConvocatoria
  const convocatoriaCerrada = convocatoria ? !isConvocatoriaVigente(convocatoria) : false

  const aspirantesAdmitidos = useMemo(() => {
    return inscripciones.filter((inscripcion) => {
      const estadoNormalizado = inscripcion.estado?.trim().toUpperCase().replaceAll(' ', '_')
      return estadoNormalizado === 'ADMITIDO'
    })
  }, [inscripciones])

  const mostrarModuloAdmitir = convocatoriaCerrada || aspirantesAdmitidos.length > 0

  const selectedAdmitido = useMemo(
    () => aspirantesAdmitidos.find((inscripcion) => inscripcion.id === selectedAdmitidoId) ?? null,
    [aspirantesAdmitidos, selectedAdmitidoId],
  )

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
      setConvocatoria(convocatorias.find((item) => item.id === convocatoriaIdNumber) ?? null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No fue posible cargar las inscripciones.'
      const normalizedMessage = message.toLowerCase()
      const isEmptyInscripcionesResponse =
        normalizedMessage.includes('inscrip') &&
        (normalizedMessage.includes('no hay') ||
          normalizedMessage.includes('no existe') ||
          normalizedMessage.includes('sin registros'))

      if (isEmptyInscripcionesResponse) {
        setInscripciones([])
        setError(null)
      } else {
        setError(message)
      }
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

  const resolveAspirantePhoto = (inscripcion: InscripcionAdmisionDto): string | null => {
    const contenidoBase64 = inscripcion.foto?.contenidoBase64?.trim()
    if (!contenidoBase64) {
      return null
    }

    const mimeType = inscripcion.foto?.mimeType?.trim() || 'image/jpeg'
    return `data:${mimeType};base64,${contenidoBase64}`
  }

  const handleRowClick = (inscripcion: InscripcionAdmisionDto) => {
    if (!convocatoriaId) {
      return
    }

    navigate(`/admisiones/convocatoria/${convocatoriaId}/inscripcion/${inscripcion.id}`, {
      state: {
        nombreAspirante: inscripcion.nombreAspirante,
        periodoAcademico: inscripcion.periodoAcademico,
        inscripcionId: inscripcion.id,
        inscripcionEstado: inscripcion.estado,
      },
    })
  }

  const handleCreated = useCallback(
    (result: { uploadSummary: { failedItems: { id: number }[] } }) => {
      if (result.uploadSummary.failedItems.length > 0) {
        setSuccessMessage(
          `Aspirante creado. Falló la carga de ${result.uploadSummary.failedItems.length} documento(s).`,
        )
      } else {
        setSuccessMessage('Aspirante creado y documentos cargados correctamente.')
      }
      loadInscripciones()
    },
    [loadInscripciones],
  )

  const handleOpenCreateAspirante = useCallback(() => {
    // AJUSTE TEMPORAL PARA PRUEBAS (2026-06-02): permitir crear aspirantes aunque la convocatoria esté cerrada.
    // Revertir después de las pruebas para restaurar el bloqueo por convocatoria cerrada.
    if (cuposExcedidos) {
      window.alert(
        `No es posible crear más aspirantes: la convocatoria alcanzó su cupo máximo (${cuposConvocatoria}).`,
      )
      return
    }

    setIsCreateModalOpen(true)
  }, [cuposConvocatoria, cuposExcedidos])

  const handleOpenAdmitirEstudiante = (inscripcion: InscripcionAdmisionDto) => {
    setSelectedAdmitidoId(inscripcion.id)
    setCodigoEstudiante('')
    setCorreoInstitucional('')
    setSuccessMessage(null)
  }

  const handleCancelAdmitirEstudiante = () => {
    setSelectedAdmitidoId(null)
    setCodigoEstudiante('')
    setCorreoInstitucional('')
  }

  const handleConfirmAdmitirEstudiante = async () => {
    if (!selectedAdmitido || !resolvedProgramaId) {
      return
    }

    const correoNormalizado = correoInstitucional.trim().toLowerCase()
    const codigoNormalizado = codigoEstudiante.trim()
    if (!codigoNormalizado || !correoNormalizado.includes('@')) {
      window.alert('Debes diligenciar código estudiantil y correo institucional válido.')
      return
    }

    setIsSubmittingEstudiante(true)
    try {
      const response = await admitirAspiranteComoEstudiante({
        aspiranteId: selectedAdmitido.aspiranteId,
        programaId: resolvedProgramaId,
        periodoAcademico: selectedAdmitido.periodoAcademico,
        codigoEstudiante: codigoNormalizado,
        correoInstitucional: correoNormalizado,
      })

      setAdmitidosConvertidos((prev) => ({ ...prev, [selectedAdmitido.id]: response.estudianteId }))
      setSuccessMessage(`Aspirante ${selectedAdmitido.nombreAspirante} admitido como estudiante.`)
      handleCancelAdmitirEstudiante()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No fue posible admitir al aspirante.'
      window.alert(message)
    } finally {
      setIsSubmittingEstudiante(false)
    }
  }

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
              <p className="convocatoria-detalle__status convocatoria-detalle__status--success">{successMessage}</p>
            ) : null}
          </div>
          {canCreateAspirante ? (
            <div className="convocatoria-detalle__actions">
              {/* AJUSTE TEMPORAL PARA PRUEBAS (2026-06-02): antes este botón se ocultaba cuando la convocatoria estaba cerrada.
                  Revertir tras validar creación de aspirantes/estudiantes en convocatorias cerradas. */}
              <button
                type="button"
                className="convocatoria-detalle__create-button"
                onClick={handleOpenCreateAspirante}
                disabled={!resolvedProgramaId || !parsedConvocatoriaId || isLoading || cuposExcedidos}
              >
                Crear aspirante
              </button>
              {(!resolvedProgramaId || !parsedConvocatoriaId) && !isLoading && !error ? (
                <p className="convocatoria-detalle__status convocatoria-detalle__status--error">
                  No se pudo determinar el programa o el identificador de la convocatoria.
                </p>
              ) : null}
              {cuposExcedidos ? (
                <p className="convocatoria-detalle__status convocatoria-detalle__status--error">
                  Cupo máximo alcanzado ({cuposConvocatoria}). No se pueden registrar más aspirantes.
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
            <button className="convocatoria-detalle__retry" type="button" onClick={loadInscripciones}>
              Reintentar
            </button>
          </div>
        ) : null}

        {!isLoading && !error && inscripciones.length === 0 ? (
          <p className="convocatoria-detalle__status">No hay inscripciones para esta convocatoria.</p>
        ) : null}

        {!isLoading && !error && inscripciones.length > 0 ? (
          <div className="convocatoria-detalle__grid">
            {inscripciones.map((inscripcion) => (
              <StudentCard
                key={inscripcion.id}
                inscripcion={inscripcion}
                photoUrl={resolveAspirantePhoto(inscripcion)}
                onClick={() => handleRowClick(inscripcion)}
              />
            ))}
          </div>
        ) : null}

        {!isLoading && !error && mostrarModuloAdmitir && canCreateAspirante ? (
          <section className="convocatoria-detalle__admitir-panel">
            <h2>Admitir aspirantes</h2>
            {aspirantesAdmitidos.length === 0 ? (
              <p className="convocatoria-detalle__status">Aún no hay aspirantes en estado ADMITIDO para esta convocatoria.</p>
            ) : (
              <div className="convocatoria-detalle__table-wrap">
                <table className="convocatoria-detalle__table">
                  <thead>
                    <tr>
                      <th>Documento</th>
                      <th>Aspirante</th>
                      <th>Programa</th>
                      <th>Periodo</th>
                      <th>Estado</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aspirantesAdmitidos.map((inscripcion) => {
                      const estudianteId = admitidosConvertidos[inscripcion.id]
                      return (
                        <tr key={`admitido-${inscripcion.id}`}>
                          <td>{inscripcion.numeroDocumento ?? inscripcion.cedula ?? '—'}</td>
                          <td>{inscripcion.nombreAspirante}</td>
                          <td>{inscripcion.programaAcademico}</td>
                          <td>{inscripcion.periodoAcademico}</td>
                          <td>{estudianteId ? 'CONVERTIDO' : 'ADMITIDO'}</td>
                          <td>
                            <button
                              type="button"
                              className="convocatoria-detalle__create-button"
                              onClick={() => handleOpenAdmitirEstudiante(inscripcion)}
                              disabled={Boolean(estudianteId)}
                            >
                              {estudianteId ? `Estudiante #${estudianteId}` : 'Admitir estudiante'}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {selectedAdmitido ? (
              <div className="convocatoria-detalle__admitir-form">
                <h3>Admitir como estudiante: {selectedAdmitido.nombreAspirante}</h3>
                <label>
                  Código estudiantil
                  <input value={codigoEstudiante} onChange={(event) => setCodigoEstudiante(event.target.value)} />
                </label>
                <label>
                  Correo institucional
                  <input type="email" value={correoInstitucional} onChange={(event) => setCorreoInstitucional(event.target.value)} />
                </label>
                <div className="convocatoria-detalle__admitir-actions">
                  <button type="button" onClick={handleCancelAdmitirEstudiante} disabled={isSubmittingEstudiante}>Cancelar</button>
                  <button type="button" onClick={handleConfirmAdmitirEstudiante} disabled={isSubmittingEstudiante || !resolvedProgramaId}>
                    {isSubmittingEstudiante ? 'Guardando...' : 'Confirmar admisión'}
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}
      </section>

      <CreateAspiranteModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        programaId={resolvedProgramaId}
        convocatoriaAdmisionId={parsedConvocatoriaId}
        onCreated={handleCreated}
      />
    </ModuleLayout>
  )
}

export default ConvocatoriaDetallePage

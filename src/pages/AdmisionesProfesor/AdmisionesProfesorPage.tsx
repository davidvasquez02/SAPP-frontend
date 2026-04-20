import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { hasAnyRole, isProfesor, ROLES } from '../../auth/roleGuards'
import { ModuleLayout } from '../../components'
import { useAuth } from '../../context/Auth'
import {
  getConvocatoriasApi,
  getInscripcionesByConvocatoria,
} from '../../modules/admisionesProfesor/api/admisionesProfesorService'
import type {
  ConvocatoriaApiDto,
  InscripcionApiDto,
} from '../../modules/admisionesProfesor/api/types'
import { getMockStudentPhotoUrl } from '../../modules/admisiones/utils/mockStudentPhoto'
import { getProgramaNombreLargo } from '../../modules/admisiones/utils/programNames'
import './AdmisionesProfesorPage.css'

type InscripcionConConvocatoria = InscripcionApiDto & {
  convocatoriaId: number
  programaId: number
  programa: string
  periodo: string
}

const PROGRAMA_MISI = 1
const PROGRAMA_DCC = 2

const normalize = (value: string | null | undefined) => (value ?? '').trim().toUpperCase()

const isMisi = (row: InscripcionConConvocatoria) =>
  row.programaId === PROGRAMA_MISI || normalize(row.programa).includes('MISI')

const isDcc = (row: InscripcionConConvocatoria) =>
  row.programaId === PROGRAMA_DCC || normalize(row.programa).includes('DCC')

const AdmisionesProfesorPage = () => {
  const { session } = useAuth()
  const navigate = useNavigate()

  const roles = session?.kind === 'SAPP' ? session.user.roles : []
  const isProfesorOnly =
    isProfesor(roles) && !hasAnyRole(roles, [ROLES.ADMIN, ROLES.COORDINACION, ROLES.SECRETARIA])

  const [activeConvocatorias, setActiveConvocatorias] = useState<ConvocatoriaApiDto[]>([])
  const [inscripcionesByConvocatoria, setInscripcionesByConvocatoria] = useState<
    Record<number, InscripcionApiDto[]>
  >({})

  const [loadingConvocatorias, setLoadingConvocatorias] = useState(false)
  const [loadingInscripciones, setLoadingInscripciones] = useState(false)
  const [errorConvocatorias, setErrorConvocatorias] = useState<string | null>(null)
  const [errorInscripciones, setErrorInscripciones] = useState<string | null>(null)

  const loadConvocatorias = useCallback(async () => {
    setLoadingConvocatorias(true)
    setErrorConvocatorias(null)

    try {
      const convocatorias = await getConvocatoriasApi()
      setActiveConvocatorias(convocatorias.filter((convocatoria) => convocatoria.vigente))
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No fue posible cargar convocatorias activas.'
      setErrorConvocatorias(message)
      setActiveConvocatorias([])
    } finally {
      setLoadingConvocatorias(false)
    }
  }, [])

  useEffect(() => {
    if (!isProfesorOnly) {
      return
    }

    loadConvocatorias()
  }, [isProfesorOnly, loadConvocatorias])

  useEffect(() => {
    if (!isProfesorOnly) {
      return
    }

    if (activeConvocatorias.length === 0) {
      setInscripcionesByConvocatoria({})
      return
    }

    let isMounted = true

    const loadInscripciones = async () => {
      setLoadingInscripciones(true)
      setErrorInscripciones(null)

      try {
        const rows = await Promise.all(
          activeConvocatorias.map(async (convocatoria) => ({
            convocatoriaId: convocatoria.id,
            inscripciones: await getInscripcionesByConvocatoria(convocatoria.id),
          }))
        )

        if (!isMounted) {
          return
        }

        const nextMap = rows.reduce<Record<number, InscripcionApiDto[]>>((acc, item) => {
          acc[item.convocatoriaId] = item.inscripciones
          return acc
        }, {})

        setInscripcionesByConvocatoria(nextMap)
      } catch (error) {
        if (!isMounted) {
          return
        }

        const message =
          error instanceof Error
            ? error.message
            : 'No fue posible cargar las inscripciones por convocatoria.'
        setErrorInscripciones(message)
        setInscripcionesByConvocatoria({})
      } finally {
        if (isMounted) {
          setLoadingInscripciones(false)
        }
      }
    }

    loadInscripciones()

    return () => {
      isMounted = false
    }
  }, [activeConvocatorias, isProfesorOnly])

  const periodosLabel = useMemo(() => {
    const periodos = Array.from(new Set(activeConvocatorias.map((item) => item.periodo).filter(Boolean)))
    return periodos.join(', ')
  }, [activeConvocatorias])

  const inscripcionesConConvocatoria = useMemo<InscripcionConConvocatoria[]>(() => {
    if (activeConvocatorias.length === 0) {
      return []
    }

    return activeConvocatorias.flatMap((convocatoria) => {
      const inscripciones = inscripcionesByConvocatoria[convocatoria.id] ?? []

      return inscripciones.map((inscripcion) => ({
        ...inscripcion,
        convocatoriaId: convocatoria.id,
        programaId: convocatoria.programaId,
        programa: convocatoria.programa,
        periodo: convocatoria.periodo,
      }))
    })
  }, [activeConvocatorias, inscripcionesByConvocatoria])

  const misiInscripciones = useMemo(
    () => inscripcionesConConvocatoria.filter((inscripcion) => isMisi(inscripcion)),
    [inscripcionesConConvocatoria]
  )

  const dccInscripciones = useMemo(
    () => inscripcionesConConvocatoria.filter((inscripcion) => isDcc(inscripcion)),
    [inscripcionesConConvocatoria]
  )

  const goToEntrevistas = useCallback(
    (inscripcion: InscripcionConConvocatoria) => {
      navigate(
        `/admisiones/convocatoria/${inscripcion.convocatoriaId}/inscripcion/${inscripcion.id}/entrevistas`,
        {
          state: {
            nombreAspirante: inscripcion.nombreAspirante,
            periodo: inscripcion.periodoAcademico || inscripcion.periodo,
            programa: inscripcion.programaAcademico || inscripcion.programa,
          },
        }
      )
    },
    [navigate]
  )

  const renderProgramaSection = useCallback(
    (title: string, rows: InscripcionConConvocatoria[]) => (
      <section className="admisiones-profesor__program">
        <h2 className="admisiones-profesor__program-title">{title}</h2>

        {loadingInscripciones ? (
          <p className="admisiones-profesor__status">Cargando inscripciones...</p>
        ) : null}

        {!loadingInscripciones && rows.length === 0 ? (
          <p className="admisiones-profesor__status">No hay inscripciones para este programa.</p>
        ) : null}

        {!loadingInscripciones && rows.length > 0 ? (
          <div className="admisiones-profesor__cards-grid">
            {rows.map((inscripcion) => {
              const documento = inscripcion.numeroDocumento || '—'
              const email = inscripcion.emailPersonal || '—'
              const telefono = inscripcion.telefono || '—'

              return (
                <article
                  key={`${inscripcion.convocatoriaId}-${inscripcion.id}`}
                  className="admisiones-profesor__card"
                  role="button"
                  tabIndex={0}
                  onClick={() => goToEntrevistas(inscripcion)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      goToEntrevistas(inscripcion)
                    }
                  }}
                >
                  <img
                    className="admisiones-profesor__card-photo"
                    src={getMockStudentPhotoUrl(inscripcion.aspiranteId, inscripcion.nombreAspirante)}
                    alt={`Foto de ${inscripcion.nombreAspirante}`}
                    loading="lazy"
                  />

                  <div className="admisiones-profesor__card-body">
                    <h3 className="admisiones-profesor__card-name">{inscripcion.nombreAspirante}</h3>

                    <span className="admisiones-profesor__card-pill">
                      {inscripcion.estado?.replaceAll('_', ' ') || 'Sin estado'}
                    </span>

                    <dl className="admisiones-profesor__card-details">
                      <div>
                        <dt>Documento</dt>
                        <dd>{documento}</dd>
                      </div>
                      <div>
                        <dt>Email</dt>
                        <dd>{email}</dd>
                      </div>
                      <div>
                        <dt>Teléfono</dt>
                        <dd>{telefono}</dd>
                      </div>
                      <div>
                        <dt>Periodo</dt>
                        <dd>{inscripcion.periodoAcademico || inscripcion.periodo || '—'}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="admisiones-profesor__card-footer">
                    <span>Calificar entrevista</span>
                    <span aria-hidden="true">›</span>
                  </div>
                </article>
              )
            })}
          </div>
        ) : null}
      </section>
    ),
    [goToEntrevistas, loadingInscripciones]
  )

  if (!isProfesorOnly) {
    return null
  }

  return (
    <ModuleLayout title="Admisiones">
      <section className="admisiones-profesor">
        <header className="admisiones-profesor__header">
          <h1 className="admisiones-profesor__title">Admisiones — Mis entrevistas</h1>
          <p className="admisiones-profesor__subtitle">
            Convocatorias activas: {periodosLabel || 'Sin periodos activos'}
          </p>
        </header>

        {loadingConvocatorias ? (
          <p className="admisiones-profesor__status">Cargando convocatorias activas...</p>
        ) : null}

        {!loadingConvocatorias && errorConvocatorias ? (
          <div className="admisiones-profesor__error">
            <p>{errorConvocatorias}</p>
            <button type="button" onClick={loadConvocatorias}>
              Reintentar
            </button>
          </div>
        ) : null}

        {!loadingConvocatorias && !errorConvocatorias && activeConvocatorias.length === 0 ? (
          <p className="admisiones-profesor__status">No hay convocatorias activas.</p>
        ) : null}

        {!loadingConvocatorias && !errorConvocatorias && activeConvocatorias.length > 0 ? (
          <>
            {errorInscripciones ? (
              <div className="admisiones-profesor__error">
                <p>{errorInscripciones}</p>
              </div>
            ) : null}

            {renderProgramaSection(getProgramaNombreLargo(PROGRAMA_MISI, 'MISI'), misiInscripciones)}
            {renderProgramaSection(
              getProgramaNombreLargo(PROGRAMA_DCC, 'DCC'),
              dccInscripciones
            )}
          </>
        ) : null}
      </section>
    </ModuleLayout>
  )
}

export default AdmisionesProfesorPage

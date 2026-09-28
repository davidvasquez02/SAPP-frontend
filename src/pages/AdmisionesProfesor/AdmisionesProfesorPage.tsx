import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { canManagePosgrados, isEvaluadorAdmision } from '../../auth/roleGuards'
import { ModuleLayout } from '../../components'
import { useAuth } from '../../context/Auth'
import {
  getConvocatoriasAdmision,
} from '../../modules/admisiones/api/convocatoriaAdmisionService'
import type { ConvocatoriaAdmisionDto } from '../../modules/admisiones/api/convocatoriaAdmisionTypes'
import { getInscripcionesByConvocatoria } from '../../modules/admisiones/api/inscripcionAdmisionService'
import type { InscripcionAdmisionDto } from '../../modules/admisiones/api/types'
import { getAspiranteFotoSrc } from '../../modules/admisiones/utils/aspiranteFoto'
import { getProgramaNombreLargo } from '../../modules/admisiones/utils/programNames'
import './AdmisionesProfesorPage.css'
import { getEvaluacionAdmisionInfo } from '../../modules/admisiones/api/evaluacionAdmisionService'
import { getEstadoEntrevista } from '../../modules/admisiones/utils/estadoEntrevista'

type InscripcionConConvocatoria = InscripcionAdmisionDto & {
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

const AspirantePhoto = ({ fotoSrc, nombre }: { fotoSrc: string | null; nombre: string }) => {
  const [failedPhotoSrc, setFailedPhotoSrc] = useState<string | null>(null)
  const showFallback = !fotoSrc || failedPhotoSrc === fotoSrc

  return (
    <div className="admisiones-profesor__card-media">
      {showFallback ? (
        <div className="admisiones-profesor__card-photo-placeholder" aria-label="Sin foto">
          Sin foto
        </div>
      ) : (
        <img
          className="admisiones-profesor__card-photo"
          src={fotoSrc}
          alt={`Foto de ${nombre}`}
          loading="lazy"
          onError={() => setFailedPhotoSrc(fotoSrc)}
        />
      )}
    </div>
  )
}

const AdmisionesProfesorPage = () => {
  const { session } = useAuth()
  const navigate = useNavigate()

  const roles = session?.kind === 'SAPP' ? session.user.roles : []
  const isEvaluadorOnly = isEvaluadorAdmision(roles) && !canManagePosgrados(roles)
  const usuarioId = session?.user.id
  const [estadosEntrevista, setEstadosEntrevista] = useState<Record<string, string>>({})

  const [activeConvocatorias, setActiveConvocatorias] = useState<ConvocatoriaAdmisionDto[]>([])
  const [inscripcionesByConvocatoria, setInscripcionesByConvocatoria] = useState<
    Record<number, InscripcionAdmisionDto[]>
  >({})

  const [loadingConvocatorias, setLoadingConvocatorias] = useState(false)
  const [loadingInscripciones, setLoadingInscripciones] = useState(false)
  const [errorConvocatorias, setErrorConvocatorias] = useState<string | null>(null)
  const [errorInscripciones, setErrorInscripciones] = useState<string | null>(null)

  const loadConvocatorias = useCallback(async () => {
    setLoadingConvocatorias(true)
    setErrorConvocatorias(null)

    try {
      const convocatorias = await getConvocatoriasAdmision()
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
    if (!isEvaluadorOnly) {
      return
    }

    loadConvocatorias()
  }, [isEvaluadorOnly, loadConvocatorias])

  useEffect(() => {
    if (!isEvaluadorOnly) {
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

        const nextMap = rows.reduce<Record<number, InscripcionAdmisionDto[]>>((acc, item) => {
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
  }, [activeConvocatorias, isEvaluadorOnly])

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

  useEffect(() => {
    if (!isEvaluadorOnly || usuarioId == null) return
    let cancelled = false
    let cursor = 0
    const ids = [...new Set(inscripcionesConConvocatoria.map((item) => item.id))]
    setEstadosEntrevista({})
    const worker = async () => {
      while (!cancelled && cursor < ids.length) {
        const id = ids[cursor++]
        let label: string
        try {
          const items = await getEvaluacionAdmisionInfo(id, 'ENTREVISTA')
          label = getEstadoEntrevista(items, usuarioId).label
        } catch {
          label = 'No se pudo consultar'
        }
        if (!cancelled) setEstadosEntrevista((current) => ({ ...current, [`${usuarioId}-${id}`]: label }))
      }
    }
    void Promise.all(Array.from({ length: Math.min(4, ids.length) }, worker))
    return () => { cancelled = true }
  }, [inscripcionesConConvocatoria, isEvaluadorOnly, usuarioId])

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
              const fotoSrc = getAspiranteFotoSrc(inscripcion.foto)

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
                  <AspirantePhoto fotoSrc={fotoSrc} nombre={inscripcion.nombreAspirante} />

                  <div className="admisiones-profesor__card-body">
                    <h3 className="admisiones-profesor__card-name">{inscripcion.nombreAspirante}</h3>

                    <span className="admisiones-profesor__card-pill">
                      {inscripcion.estado?.replaceAll('_', ' ') || 'Sin estado'}
                    </span>

                    <dl className="admisiones-profesor__card-details">
                      <div>
                        <dt>Tu entrevista</dt>
                        <dd role="status">{estadosEntrevista[`${usuarioId}-${inscripcion.id}`] ?? 'Consultando calificación…'}</dd>
                      </div>
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
    [goToEntrevistas, loadingInscripciones, estadosEntrevista, usuarioId]
  )

  if (!isEvaluadorOnly) {
    return null
  }

  return (
    <ModuleLayout title="Admisiones">
      <section className="admisiones-profesor">
        <header className="admisiones-profesor__header">
          <h1 className="admisiones-profesor__title">Mis entrevistas</h1>
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

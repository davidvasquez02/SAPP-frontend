import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ActaDto } from '../../actas/types'
import StatusBadge from '../../solicitudes/components/StatusBadge/StatusBadge'
import type { SolicitudDocumentoAdjuntoDto } from '../../solicitudes/types/documentosAdjuntos'
import {
  buscarBancoJurados,
  definirDocumentoEvaluar,
  descargarCartaAgradecimiento,
  descargarRubricaDiligenciada,
  designarJurados,
  enviarAAjustes,
  enviarRecordatorios,
  getCatalogosEvaluacion,
  getProcesoEvaluacion,
  programarSustentacion,
  reenviarInvitacion,
  registrarResultado,
  reemplazarJurado,
  retirarJurado,
} from './api'
import { downloadBase64File } from '../../../shared/files/base64FileUtils'
import type {
  BancoJurado,
  CatalogosEvaluacion,
  IdiomaJurado,
  JuradoEvaluador,
  JuradoInput,
  ProcesoEvaluacionTg,
} from './types'
import {
  promedioNotasSustentacion,
  puedeAgendarSustentacion,
  todosLosJuradosActivosEvaluaronSustentacion,
} from './estadoProcesoEvaluacion'
import { esExamenCandidaturaDoctoral } from '../constants'
import {
  etiquetaRondaEvaluacion,
  evaluacionesOrdenadas,
  presentarNotaFinalCandidatura,
  presentarValorEvaluacion,
  progresoConceptosDeLaRonda,
} from './presentacionEvaluacion'
import { obtenerDetalleSustentacion, tieneDetalleSustentacion, requiereLugarSustentacion, requiereEnlaceSustentacion, validarUbicacionSustentacion } from './sustentacion'
import './ProcesoEvaluacionPanel.css'

interface ProcesoEvaluacionPanelProps {
  solicitudId: number
  documentos: SolicitudDocumentoAdjuntoDto[]
  actas: ActaDto[]
  onUpdated: () => Promise<void>
  onJuradoAdded: () => Promise<void>
}

type FormularioActivo = 'designar' | 'sustentacion' | 'resultado' | null

const EMPTY_JURADO: JuradoInput = { nombre: '', tratamiento: '', tratamientoEn: '', correo: '', institucion: '', externo: true, idioma: 'ES', motivoReemplazo: '' }
const SUCCESS_MESSAGE_DURATION_MS = 5_000
const ESTADOS_CON_AJUSTES = new Set(['CONCEPTOS_REC'])
const ESTADOS_CON_RESULTADO = new Set(['SUST_PROGRAMADA'])
// Hallazgo de pruebas (2026-11-14, ajuste #10): con la sustentacion ya programada puede
// pasar que un jurado se retire (una urgencia, por ejemplo); el coordinador necesita poder
// gestionarlo igual, aunque la fecha y el lugar ya esten comunicados.
const ESTADOS_CON_DESIGNACION = new Set(['JUR_POR_DESIG', 'JUR_INVITADO', 'EN_EVALUACION', 'CONCEPTOS_REC', 'EN_AJUSTES', 'AJUSTES_RECIB', 'SUST_PROGRAMADA'])
// Hallazgo de pruebas (2026-11-14, ajuste #9): "Reenviar" es para un enlace perdido o
// vencido, no para volver a invitar a alguien que ya respondio.
const ESTADOS_INVITACION_CON_REENVIO = new Set(['PENDIENTE', 'VENCIDA'])

const formatEstadoNombre = (nombre: string | null | undefined, codigo: string): string =>
  (nombre?.trim() || codigo).toLocaleUpperCase('es-CO')

const formatDate = (value?: string | null, includeTime = false) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    dateStyle: 'medium',
    ...(includeTime ? { timeStyle: 'short' as const } : {}),
  }).format(date)
}

const addCalendarDays = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

const suggestedDeadline = (tipo: string) => {
  if (tipo === 'PROP_TESIS_DCC' || tipo === 'PROP_TI_MISI') return addCalendarDays(21)
  if (tipo === 'DEF_TI_MISI') return addCalendarDays(28)
  if (tipo === 'DEF_TESIS_DCC') return addCalendarDays(60)
  return addCalendarDays(28)
}

const getErrorMessage = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback

const EvaluacionDetalle = ({ evaluacion, tipoSolicitudCodigo }: {
  evaluacion: JuradoEvaluador['evaluaciones'][number]
  tipoSolicitudCodigo: string
}) => {
  const momento = evaluacion.momentoNombre || evaluacion.momento || evaluacion.momentoCodigo
  const { etiqueta, valor } = presentarValorEvaluacion(evaluacion, tipoSolicitudCodigo)
  const observaciones = evaluacion.observaciones?.trim()
  const etiquetaRonda = etiquetaRondaEvaluacion(evaluacion)

  return (
    <article className="evaluacion-tg__evaluation">
      <strong>{momento}</strong>
      {etiquetaRonda && <small className="evaluacion-tg__round">{etiquetaRonda}</small>}
      {valor != null && valor !== '' && (
        <span><b>{etiqueta}:</b> {valor}</span>
      )}
      {observaciones && <span><b>Observaciones:</b> {observaciones}</span>}
    </article>
  )
}

const CartaAgradecimientoBoton = ({ solicitudId, juradoId }: { solicitudId: number, juradoId: number }) => {
  const [generando, setGenerando] = useState(false)
  const [fallo, setFallo] = useState(false)

  const descargar = async () => {
    setGenerando(true)
    setFallo(false)
    try {
      const carta = await descargarCartaAgradecimiento(solicitudId, juradoId)
      downloadBase64File(carta.contenidoBase64, carta.mimeType, carta.nombreArchivo)
    } catch {
      setFallo(true)
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div className="evaluacion-tg__carta">
      <button type="button" disabled={generando} onClick={() => void descargar()}>
        {generando ? 'Generando…' : 'Carta de agradecimiento'}
      </button>
      {fallo && <small role="alert">No fue posible generar la carta.</small>}
    </div>
  )
}

const RubricaCelda = ({ evaluaciones }: { evaluaciones: JuradoEvaluador['evaluaciones'] }) => {
  const [descargandoId, setDescargandoId] = useState<number | null>(null)
  const conRubrica = evaluaciones?.filter((evaluacion) => evaluacion.rubricaNombreArchivo) ?? []

  if (conRubrica.length === 0) return <span className="evaluacion-tg__rubrica-empty">—</span>

  const descargar = async (evaluacion: JuradoEvaluador['evaluaciones'][number]) => {
    setDescargandoId(evaluacion.id)
    try {
      const rubrica = await descargarRubricaDiligenciada(evaluacion.id)
      downloadBase64File(rubrica.contenidoBase64, rubrica.mimeType, rubrica.nombreArchivo)
    } catch {
      // Falla silenciosa: no hay un lugar en esta columna para mostrar un error puntual por fila.
    } finally {
      setDescargandoId(null)
    }
  }

  return (
    <div className="evaluacion-tg__rubricas">
      {conRubrica.map((evaluacion) => {
        const momento = evaluacion.momentoNombre || evaluacion.momento || evaluacion.momentoCodigo
        return (
          <button
            key={evaluacion.id}
            type="button"
            className="evaluacion-tg__rubrica-download"
            disabled={descargandoId === evaluacion.id}
            onClick={() => void descargar(evaluacion)}
            title={`Descargar rúbrica: ${momento} (${evaluacion.rubricaNombreArchivo})`}
            aria-label={`Descargar rúbrica de ${momento}`}
          >
            <span aria-hidden="true">⬇</span>
            {descargandoId === evaluacion.id ? 'Descargando…' : 'Descargar rúbrica'}
          </button>
        )
      })}
    </div>
  )
}

const ProcesoEvaluacionPanel = ({ solicitudId, documentos, actas, onUpdated, onJuradoAdded }: ProcesoEvaluacionPanelProps) => {
  const [proceso, setProceso] = useState<ProcesoEvaluacionTg | null>(null)
  const [catalogos, setCatalogos] = useState<CatalogosEvaluacion | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [formulario, setFormulario] = useState<FormularioActivo>(null)
  const [jurado, setJurado] = useState<JuradoInput>(EMPTY_JURADO)
  const [fechaLimite, setFechaLimite] = useState('')
  const [documentoId, setDocumentoId] = useState('')
  const [banco, setBanco] = useState<BancoJurado[]>([])
  const [bancoLoading, setBancoLoading] = useState(false)
  const [directorioAbierto, setDirectorioAbierto] = useState(false)
  const [filtroBanco, setFiltroBanco] = useState('')
  const [bancoError, setBancoError] = useState<string | null>(null)
  const [reemplazando, setReemplazando] = useState<JuradoEvaluador | null>(null)
  const [modalidad, setModalidad] = useState('')
  const [fechaSustentacion, setFechaSustentacion] = useState('')
  const [lugar, setLugar] = useState('')
  const [enlace, setEnlace] = useState('')
  const [resultado, setResultado] = useState('')
  const [notaFinal, setNotaFinal] = useState('')
  const [actaId, setActaId] = useState('')
  const [juradoARetirar, setJuradoARetirar] = useState<JuradoEvaluador | null>(null)
  const confirmarRetiroRef = useRef<HTMLButtonElement>(null)
  const retiroTriggerRef = useRef<HTMLButtonElement | null>(null)
  const busyRef = useRef(busy)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [nextProceso, nextCatalogos] = await Promise.all([
        getProcesoEvaluacion(solicitudId),
        getCatalogosEvaluacion(),
      ])
      setProceso(nextProceso)
      setCatalogos(nextCatalogos)
      setFechaLimite(nextProceso.fechaLimiteEvaluacion ?? suggestedDeadline(nextProceso.tipoSolicitudCodigo))
      setDocumentoId(nextProceso.documentoEvaluarId ? String(nextProceso.documentoEvaluarId) : '')
      setModalidad(nextCatalogos.modalidades[0]?.codigo ?? '')
      setResultado(nextCatalogos.resultados[0]?.codigo ?? '')
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'No fue posible cargar el proceso de evaluación.'))
    } finally {
      setLoading(false)
    }
  }, [solicitudId])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    if (!message) return

    const timeoutId = window.setTimeout(() => setMessage(null), SUCCESS_MESSAGE_DURATION_MS)
    return () => window.clearTimeout(timeoutId)
  }, [message])

  useEffect(() => { busyRef.current = busy }, [busy])

  useEffect(() => {
    if (!juradoARetirar) return

    const trigger = retiroTriggerRef.current
    confirmarRetiroRef.current?.focus()
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busyRef.current) setJuradoARetirar(null)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      window.removeEventListener('keydown', closeOnEscape)
      window.requestAnimationFrame(() => trigger?.focus())
    }
  }, [juradoARetirar])

  const estado = proceso?.estadoSolicitud ?? ''
  const activeJurors = useMemo(
    () => [...(proceso?.jurados ?? [])].sort((a, b) => Number(b.activo) - Number(a.activo)),
    [proceso?.jurados],
  )
  const canManageJurors = ESTADOS_CON_DESIGNACION.has(estado)

  const runMutation = async (
    operation: () => Promise<unknown>,
    success: string,
    refresh = onUpdated,
  ) => {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await operation()
      const [nextProceso] = await Promise.all([
        getProcesoEvaluacion(solicitudId),
        refresh(),
      ])
      setProceso(nextProceso)
      setMessage(success)
      setFormulario(null)
      setReemplazando(null)
      setJurado(EMPTY_JURADO)
      setJuradoARetirar(null)
    } catch (mutationError) {
      setError(getErrorMessage(mutationError, 'No fue posible completar la acción.'))
    } finally {
      setBusy(false)
    }
  }

  const selectBanco = (item: BancoJurado) => {
    setJurado({
      nombre: item.nombre,
      tratamiento: item.tratamiento ?? '',
      tratamientoEn: item.tratamientoEn ?? '',
      correo: item.correo,
      institucion: item.institucion ?? '',
      externo: item.externo ?? true,
      idioma: item.idioma ?? 'ES',
    })
    setDirectorioAbierto(false)
    setBancoError(null)
  }

  const consultarBanco = async (query = '') => {
    setBancoLoading(true)
    setBancoError(null)
    try {
      setBanco(await buscarBancoJurados(query))
    } catch (searchError) {
      setBanco([])
      setBancoError(getErrorMessage(searchError, 'No fue posible consultar el banco de evaluadores.'))
    } finally {
      setBancoLoading(false)
    }
  }

  const abrirDirectorio = () => {
    setDirectorioAbierto(true)
    setFiltroBanco('')
    void consultarBanco()
  }

  const submitJurado = () => {
    if (!proceso || !jurado.nombre.trim() || !jurado.correo.trim() || !jurado.institucion.trim()) {
      setError('Completa nombre, correo e institución del jurado.')
      return
    }
    if (reemplazando) {
      void runMutation(
        () => reemplazarJurado(solicitudId, reemplazando.id, jurado),
        'El jurado fue reemplazado y el nuevo evaluador fue invitado.',
      )
      return
    }
    const selectedDocument = Number(documentoId)
    if (!fechaLimite || !Number.isInteger(selectedDocument) || selectedDocument <= 0) {
      setError('Selecciona la fecha límite y el documento que será evaluado.')
      return
    }
    void runMutation(
      async () => {
        // Persist the explicit selection before sending the invitation. The juror
        // endpoint also receives the id, but defining it first prevents the backend
        // from falling back to the most recently uploaded document.
        await definirDocumentoEvaluar(solicitudId, selectedDocument)
        await designarJurados(solicitudId, {
          jurados: [jurado],
          fechaLimiteEvaluacion: fechaLimite,
          documentoEvaluarId: selectedDocument,
          enviarInvitaciones: true,
        })
      },
      'Jurado registrado e invitación enviada.',
      onJuradoAdded,
    )
  }

  const submitSustentacion = () => {
    if (!fechaSustentacion || !modalidad) {
      setError('Selecciona la fecha y la modalidad de la sustentación.')
      return
    }
    const ubicacionError = validarUbicacionSustentacion(modalidad, lugar, enlace)
    if (ubicacionError) {
      setError(ubicacionError)
      return
    }
    void runMutation(
      () => programarSustentacion(solicitudId, {
        fechaSustentacion,
        modalidadCodigo: modalidad,
        lugar: requiereLugarSustentacion(modalidad) ? lugar.trim() : null,
        enlace: requiereEnlaceSustentacion(modalidad) ? enlace.trim() : null,
        notificarJurados: true,
      }),
      'Sustentación programada correctamente.',
    )
  }

  if (loading) return <section className="evaluacion-tg evaluacion-tg--status"><p>Cargando proceso de evaluación…</p></section>
  if (!proceso) return <section className="evaluacion-tg evaluacion-tg--status"><p role="alert">{error}</p><button type="button" onClick={() => void load()}>Reintentar</button></section>

  const canSendReminders = ['EN_EVALUACION', 'JUR_INVITADO', 'AJUSTES_RECIB'].includes(estado)
  const canSendToAdjustments = ESTADOS_CON_AJUSTES.has(estado)
  const canScheduleDefense = puedeAgendarSustentacion(estado)
  const esperandoNuevosConceptos = estado === 'AJUSTES_RECIB'
  const progresoNuevosConceptos = progresoConceptosDeLaRonda(activeJurors, proceso.rondaConceptos ?? 1)
  const canRegisterResult = ESTADOS_CON_RESULTADO.has(estado)
    && todosLosJuradosActivosEvaluaronSustentacion(activeJurors)
  const esCandidaturaDoctoral = esExamenCandidaturaDoctoral(undefined, proceso.tipoSolicitudCodigo)
  const notaFinalPresentada = presentarNotaFinalCandidatura(proceso.notaFinal, proceso.tipoSolicitudCodigo)
  const notaFinalNumero = notaFinal.trim() === '' ? Number.NaN : Number(notaFinal)
  const notaFinalValida = Number.isFinite(notaFinalNumero) && notaFinalNumero >= 0 && notaFinalNumero <= 5
  const hasProcessActions = canSendReminders || canSendToAdjustments || canRegisterResult
  const hasJurorActions = canManageJurors && activeJurors.some((item) => item.activo)
  const sustentacion = obtenerDetalleSustentacion(proceso)

  return (
    <section className="evaluacion-tg" aria-labelledby="evaluacion-tg-title">
      <header className="evaluacion-tg__header">
        <div>
          <p className="evaluacion-tg__eyebrow">Gestión de coordinación</p>
          <h3 id="evaluacion-tg-title">Proceso de evaluación</h3>
          <p>{proceso.titulo}</p>
        </div>
        <StatusBadge
          estado={proceso.estadoSolicitud}
          etiquetaAlternativa={formatEstadoNombre(proceso.estadoSolicitudNombre, proceso.estadoSolicitud)}
        />
      </header>

      {notaFinalPresentada && (
        <aside className="evaluacion-tg__final-grade" aria-label="Calificación definitiva">
          <div>
            <span>Calificación definitiva</span>
            <strong>{notaFinalPresentada}</strong>
          </div>
          <p>Nota final registrada para el examen de candidatura doctoral.</p>
        </aside>
      )}

      {message && <p className="evaluacion-tg__message" role="status">{message}</p>}
      {error && <p className="evaluacion-tg__error" role="alert">{error}</p>}

      {esperandoNuevosConceptos && (
        <aside className="evaluacion-tg__ready evaluacion-tg__ready--pending" aria-labelledby="evaluacion-pending-title">
          <div className="evaluacion-tg__ready-icon" aria-hidden="true">…</div>
          <div>
            <strong id="evaluacion-pending-title">Correcciones recibidas</strong>
            <p>
              Se avisó a los evaluadores. Esperando su nuevo concepto sobre el documento corregido
              ({progresoNuevosConceptos.emitidos} de {progresoNuevosConceptos.total}). Cuando todos lo emitan, la solicitud vuelve a «Conceptos recibidos».
            </p>
          </div>
          <button type="button" onClick={() => setFormulario('sustentacion')} disabled={busy}>Programar sustentación</button>
        </aside>
      )}

      {canScheduleDefense && !esperandoNuevosConceptos && (
        <aside className="evaluacion-tg__ready" aria-labelledby="evaluacion-ready-title">
          <div className="evaluacion-tg__ready-icon" aria-hidden="true">✓</div>
          <div>
            <strong id="evaluacion-ready-title">Conceptos completos</strong>
            <p>Todos los evaluadores emitieron su concepto. La sustentación ya se puede programar.</p>
          </div>
          <button type="button" onClick={() => setFormulario('sustentacion')} disabled={busy}>Programar sustentación</button>
        </aside>
      )}

      {hasProcessActions && <div className="evaluacion-tg__actions" aria-label="Acciones del proceso">
        {canSendReminders && <button type="button" onClick={() => {
          setBusy(true); setError(null); setMessage(null)
          enviarRecordatorios(solicitudId).then(async (count) => {
            const [nextProceso] = await Promise.all([getProcesoEvaluacion(solicitudId), onUpdated()])
            setProceso(nextProceso)
            setMessage(`Se enviaron ${count} recordatorio(s).`)
          }).catch((e: unknown) => setError(getErrorMessage(e, 'No fue posible enviar recordatorios.'))).finally(() => setBusy(false))
        }} disabled={busy} title="Solo se envían a jurados que aceptaron y aún no evaluaron.">Enviar recordatorios</button>}
        {canSendToAdjustments && <button type="button" onClick={() => void runMutation(() => enviarAAjustes(solicitudId), 'El trabajo fue enviado a correcciones.')} disabled={busy}>Enviar a correcciones</button>}
        {canRegisterResult && <button type="button" onClick={() => {
          const promedio = promedioNotasSustentacion(activeJurors)
          setNotaFinal(promedio == null ? '' : promedio.toFixed(2))
          setFormulario('resultado')
        }} disabled={busy}>Registrar resultado</button>}
      </div>}

      {formulario === 'designar' && (
        <div className="evaluacion-tg__form-card">
          <h4>{reemplazando ? `Reemplazar a ${reemplazando.nombre}` : 'Agregar evaluador'}</h4>
          <div className="evaluacion-tg__directory-access">
            <div><strong>Banco de evaluadores</strong><span>Consulta el directorio y selecciona un evaluador para completar sus datos automáticamente.</span></div>
            <button type="button" className="secondary" onClick={abrirDirectorio} disabled={bancoLoading}>Buscar en el directorio</button>
          </div>
          {directorioAbierto && (
            <section className="evaluacion-tg__directory" aria-labelledby="banco-evaluadores-title">
              <div className="evaluacion-tg__directory-heading">
                <div><h5 id="banco-evaluadores-title">Directorio de evaluadores</h5><span>{banco.length} resultado(s)</span></div>
                <button type="button" className="secondary" onClick={() => setDirectorioAbierto(false)}>Cerrar</button>
              </div>
              <form className="evaluacion-tg__directory-search" onSubmit={(event) => { event.preventDefault(); void consultarBanco(filtroBanco) }}>
                <label htmlFor="filtro-banco-evaluadores"><span>Filtrar por nombre, correo o institución</span><input id="filtro-banco-evaluadores" type="search" value={filtroBanco} onChange={(event) => setFiltroBanco(event.target.value)} placeholder="Ej. Ana Torres o universidad.edu" /></label>
                <button type="submit" disabled={bancoLoading}>{bancoLoading ? 'Buscando…' : 'Buscar'}</button>
              </form>
              {bancoError && <p className="evaluacion-tg__directory-error" role="alert">{bancoError}</p>}
              {!bancoLoading && !bancoError && banco.length === 0 && <p className="evaluacion-tg__directory-empty">No se encontraron evaluadores con ese filtro.</p>}
              {banco.length > 0 && <div className="evaluacion-tg__directory-list">{banco.map((item) => (
                <article key={item.correo} className="evaluacion-tg__directory-item">
                  <div><strong>{item.nombre}</strong><span>{item.correo}</span><span>{item.institucion || 'Institución no registrada'}</span></div>
                  <div className="evaluacion-tg__directory-meta"><span>{item.externo ? 'Externo' : 'UIS'}</span><span>{item.idioma || 'ES'}</span><span>{item.participaciones} participación(es)</span>{item.ultimaParticipacion && <span>Última: {formatDate(item.ultimaParticipacion)}</span>}</div>
                  <button type="button" onClick={() => selectBanco(item)}>Seleccionar</button>
                </article>
              ))}</div>}
            </section>
          )}
          <div className="evaluacion-tg__form-grid">
            <label><span>Nombre *</span><input value={jurado.nombre} onChange={(e) => setJurado((v) => ({ ...v, nombre: e.target.value }))} /></label>
            <label><span>Tratamiento en español (opcional)</span><input value={jurado.tratamiento} onChange={(e) => setJurado((v) => ({ ...v, tratamiento: e.target.value }))} placeholder="Dr., Dra., MSc., Ing., etc. Por defecto: Profesor(a)" /></label>
            <label><span>Tratamiento en inglés (opcional)</span><input value={jurado.tratamientoEn ?? ''} onChange={(e) => setJurado((v) => ({ ...v, tratamientoEn: e.target.value }))} placeholder="Dr., Prof., etc. Por defecto: Professor" /></label>
            <label><span>Correo *</span><input type="email" value={jurado.correo} onChange={(e) => setJurado((v) => ({ ...v, correo: e.target.value }))} /></label>
            <label><span>Institución *</span><input value={jurado.institucion} onChange={(e) => setJurado((v) => ({ ...v, institucion: e.target.value }))} /></label>
            <label><span>Idioma de la invitación</span><select value={jurado.idioma} onChange={(e) => setJurado((v) => ({ ...v, idioma: e.target.value as IdiomaJurado }))}><option value="ES">Español</option><option value="EN">Inglés</option></select></label>
            {!reemplazando && <><label><span>Fecha límite *</span><input type="date" value={fechaLimite} onChange={(e) => setFechaLimite(e.target.value)} /></label><label><span>Documento a evaluar *</span><select value={documentoId} onChange={(e) => setDocumentoId(e.target.value)}><option value="">Selecciona un documento</option>{documentos.map((doc) => <option key={doc.idDocumento} value={doc.idDocumento}>{doc.nombreArchivo}</option>)}</select></label></>}
          </div>
          <label className="evaluacion-tg__check"><input type="checkbox" checked={jurado.externo} onChange={(e) => setJurado((v) => ({ ...v, externo: e.target.checked }))} /> Evaluador externo a la UIS</label>
          {reemplazando && <label><span>Motivo del reemplazo (opcional)</span><textarea value={jurado.motivoReemplazo} onChange={(e) => setJurado((v) => ({ ...v, motivoReemplazo: e.target.value }))} placeholder="Por qué se reemplaza a este jurado" /></label>}
          <div className="evaluacion-tg__form-actions"><button type="button" onClick={submitJurado} disabled={busy}>{busy ? 'Guardando…' : reemplazando ? 'Reemplazar e invitar' : 'Guardar jurado'}</button><button type="button" className="secondary" onClick={() => { setFormulario(null); setReemplazando(null); setJurado(EMPTY_JURADO) }} disabled={busy}>Cancelar</button></div>
        </div>
      )}

      {formulario === 'sustentacion' && <div className="evaluacion-tg__form-card evaluacion-tg__form-card--sustentacion"><h4>Programar sustentación</h4><div className="evaluacion-tg__form-grid"><label><span>Fecha y hora *</span><input type="datetime-local" value={fechaSustentacion} onChange={(e) => setFechaSustentacion(e.target.value)} /></label><label><span>Modalidad *</span><select value={modalidad} onChange={(e) => setModalidad(e.target.value)}>{catalogos?.modalidades.map((item) => <option key={item.codigo} value={item.codigo}>{item.nombre}</option>)}</select></label>{requiereLugarSustentacion(modalidad) && <label><span>Lugar *</span><input value={lugar} onChange={(e) => setLugar(e.target.value)} /></label>}{requiereEnlaceSustentacion(modalidad) && <label><span>Enlace *</span><input type="url" value={enlace} onChange={(e) => setEnlace(e.target.value)} /></label>}</div><div className="evaluacion-tg__form-actions"><button type="button" onClick={submitSustentacion} disabled={busy}>Programar</button><button type="button" className="secondary" onClick={() => setFormulario(null)}>Cancelar</button></div></div>}

      {formulario === 'resultado' && canRegisterResult && <div className="evaluacion-tg__form-card"><h4>Registrar resultado</h4><div className="evaluacion-tg__form-grid">{esCandidaturaDoctoral ? <label><span>Nota final *</span><input type="number" min="0" max="5" step="0.01" value={notaFinal} onChange={(e) => setNotaFinal(e.target.value)} aria-describedby="nota-final-ayuda" /></label> : <label><span>Resultado *</span><select value={resultado} onChange={(e) => setResultado(e.target.value)}>{catalogos?.resultados.map((item) => <option key={item.codigo} value={item.codigo}>{item.nombre}</option>)}</select></label>}<label><span>Acta</span><select value={actaId} onChange={(e) => setActaId(e.target.value)}><option value="">Sin acta asociada</option>{actas.map((acta) => <option key={acta.id} value={acta.id}>{acta.codigo} — {acta.nombre}</option>)}</select></label></div>{esCandidaturaDoctoral && <p id="nota-final-ayuda">La nota se precarga con el promedio de las calificaciones de sustentación de los jurados activos. Puedes modificarla antes de registrar.</p>}<div className="evaluacion-tg__form-actions"><button type="button" disabled={busy || (esCandidaturaDoctoral ? !notaFinalValida : !resultado)} onClick={() => void runMutation(() => registrarResultado(solicitudId, esCandidaturaDoctoral ? { resultadoCodigo: '', notaFinal: notaFinalNumero, actaId: actaId ? Number(actaId) : null } : { resultadoCodigo: resultado, notaFinal: null, actaId: actaId ? Number(actaId) : null }), 'Resultado registrado y proceso cerrado.')}>Registrar resultado</button><button type="button" className="secondary" onClick={() => setFormulario(null)}>Cancelar</button></div></div>}

      <section className="evaluacion-tg__section" aria-labelledby="jurados-title"><div className="evaluacion-tg__section-heading"><div><h4 id="jurados-title">Jurados evaluadores</h4><span>{activeJurors.filter((item) => item.activo).length} activos</span></div>{canManageJurors && formulario !== 'designar' && <button type="button" className="evaluacion-tg__add-evaluator" onClick={() => { setReemplazando(null); setJurado(EMPTY_JURADO); setFormulario('designar') }} disabled={busy}><span aria-hidden="true">＋</span> Agregar evaluador</button>}</div>{activeJurors.length === 0 ? <p>No se han agregado evaluadores.</p> : <div className="evaluacion-tg__table-shell"><table><thead><tr><th>Jurado</th><th>Institución</th><th>Invitación</th><th>Respuesta</th><th>Evaluaciones</th><th>Rúbrica</th>{hasJurorActions && <th>Acciones</th>}</tr></thead><tbody>{activeJurors.map((item) => <tr key={item.id} className={!item.activo ? 'evaluacion-tg__inactive' : undefined}><td data-label="Jurado"><strong>{item.tratamiento ? `${item.tratamiento} ` : ''}{item.nombre}</strong><span>{item.correo}</span></td><td data-label="Institución">{item.institucion || '—'}</td><td data-label="Invitación"><span className={`evaluacion-tg__chip evaluacion-tg__chip--${item.estadoInvitacion.toLocaleLowerCase()}`}>{item.estadoInvitacionNombre || item.estadoInvitacion}</span>{item.motivoDeclinacion && <small className="evaluacion-tg__motivo-declinacion">Declinó: {item.motivoDeclinacion}</small>}{item.motivoReemplazo && <small className="evaluacion-tg__motivo-declinacion">Motivo del reemplazo: {item.motivoReemplazo}</small>}{(item.nombreSugerido || item.correoSugerido) && <small className="evaluacion-tg__motivo-declinacion">Sugiere: {item.nombreSugerido || '—'}{item.correoSugerido ? ` (${item.correoSugerido})` : ''}</small>}</td><td data-label="Respuesta">{formatDate(item.fechaRespuesta, true)}</td><td data-label="Evaluaciones">{item.evaluaciones?.length ? <div className="evaluacion-tg__evaluations">{evaluacionesOrdenadas(item).map((evaluation) => <EvaluacionDetalle key={evaluation.id} evaluacion={evaluation} tipoSolicitudCodigo={proceso.tipoSolicitudCodigo} />)}</div> : 'Pendientes'}</td><td data-label="Rúbrica"><RubricaCelda evaluaciones={item.evaluaciones} />{proceso.resultadoCodigo && item.estadoInvitacionCodigo === 'ACEPTADA' && <CartaAgradecimientoBoton solicitudId={solicitudId} juradoId={item.id} />}</td>{hasJurorActions && <td data-label="Acciones">{item.activo && <div className="evaluacion-tg__row-actions">{ESTADOS_INVITACION_CON_REENVIO.has(item.estadoInvitacionCodigo ?? '') && <button type="button" disabled={busy} onClick={() => void runMutation(() => reenviarInvitacion(solicitudId, item.id), 'Invitación reenviada.')}>Reenviar</button>}<button type="button" disabled={busy} onClick={() => { setReemplazando(item); setJurado(EMPTY_JURADO); setFormulario('designar') }}>Reemplazar</button><button type="button" className="danger" disabled={busy} onClick={(event) => { retiroTriggerRef.current = event.currentTarget; setJuradoARetirar(item) }}>Retirar</button></div>}</td>}</tr>)}</tbody></table></div>}</section>

      {juradoARetirar && (
        <div className="evaluacion-tg__confirmation" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setJuradoARetirar(null) }}>
          <section className="evaluacion-tg__confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="evaluacion-retiro-title" aria-describedby="evaluacion-retiro-description">
            <div className="evaluacion-tg__confirmation-icon" aria-hidden="true">!</div>
            <div className="evaluacion-tg__confirmation-content">
              <h2 id="evaluacion-retiro-title">Retirar jurado evaluador</h2>
              <p id="evaluacion-retiro-description">El jurado dejará de participar en este proceso de evaluación. Esta acción no elimina el historial registrado.</p>
              <dl><div><dt>Jurado</dt><dd>{juradoARetirar.nombre}</dd></div></dl>
            </div>
            <div className="evaluacion-tg__confirmation-actions">
              <button type="button" className="evaluacion-tg__confirmation-cancel" disabled={busy} onClick={() => setJuradoARetirar(null)}>Cancelar</button>
              <button ref={confirmarRetiroRef} type="button" className="evaluacion-tg__confirmation-confirm" disabled={busy} onClick={() => void runMutation(() => retirarJurado(solicitudId, juradoARetirar.id), 'Jurado retirado.')}>{busy ? 'Retirando…' : 'Sí, retirar jurado'}</button>
            </div>
          </section>
        </div>
      )}

      {tieneDetalleSustentacion(sustentacion) && <section className="evaluacion-tg__section"><h4>Información de la sustentación</h4><dl className="evaluacion-tg__summary">{sustentacion.fecha && <div><dt>Fecha y hora</dt><dd>{formatDate(sustentacion.fecha, true)}</dd></div>}{sustentacion.modalidad && <div><dt>Modalidad</dt><dd>{sustentacion.modalidad}</dd></div>}{sustentacion.lugar && <div><dt>Lugar</dt><dd>{sustentacion.lugar}</dd></div>}{(sustentacion.esVirtual || sustentacion.esHibrida) && sustentacion.enlace && <div><dt>Enlace de sustentación</dt><dd><a href={sustentacion.enlace} target="_blank" rel="noreferrer">Ingresar a la sustentación</a></dd></div>}</dl></section>}

    </section>
  )
}

export default ProcesoEvaluacionPanel

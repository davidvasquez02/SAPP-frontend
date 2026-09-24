import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ActaDto } from '../../actas/types'
import type { SolicitudDocumentoAdjuntoDto } from '../../solicitudes/types/documentosAdjuntos'
import {
  buscarBancoJurados,
  designarJurados,
  enviarAAjustes,
  enviarRecordatorios,
  getCatalogosEvaluacion,
  getHistorialProcesoEvaluacion,
  getProcesoEvaluacion,
  programarSustentacion,
  reenviarInvitacion,
  registrarResultado,
  reemplazarJurado,
  retirarJurado,
} from './api'
import type {
  BancoJurado,
  CatalogosEvaluacion,
  HistorialProcesoEvaluacion,
  IdiomaJurado,
  JuradoEvaluador,
  JuradoInput,
  ProcesoEvaluacionTg,
} from './types'
import {
  puedeAgendarSustentacion,
  todosLosJuradosActivosEvaluaronSustentacion,
} from './estadoProcesoEvaluacion'
import { presentarValorEvaluacion } from './presentacionEvaluacion'
import './ProcesoEvaluacionPanel.css'

interface ProcesoEvaluacionPanelProps {
  solicitudId: number
  documentos: SolicitudDocumentoAdjuntoDto[]
  actas: ActaDto[]
  onUpdated: () => Promise<void>
}

type FormularioActivo = 'designar' | 'sustentacion' | 'resultado' | null

const EMPTY_JURADO: JuradoInput = { nombre: '', correo: '', institucion: '', externo: true, idioma: 'ES' }
const ESTADOS_CON_AJUSTES = new Set(['CONCEPTOS_REC'])
const ESTADOS_CON_RESULTADO = new Set(['SUST_PROGRAMADA'])
const ESTADOS_CON_DESIGNACION = new Set(['JUR_POR_DESIG', 'JUR_INVITADO', 'EN_EVALUACION'])

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

  return (
    <article className="evaluacion-tg__evaluation">
      <strong>{momento}</strong>
      {valor != null && valor !== '' && (
        <span><b>{etiqueta}:</b> {valor}</span>
      )}
      {observaciones && <span><b>Observaciones:</b> {observaciones}</span>}
    </article>
  )
}

const ProcesoEvaluacionPanel = ({ solicitudId, documentos, actas, onUpdated }: ProcesoEvaluacionPanelProps) => {
  const [proceso, setProceso] = useState<ProcesoEvaluacionTg | null>(null)
  const [historial, setHistorial] = useState<HistorialProcesoEvaluacion[]>([])
  const [catalogos, setCatalogos] = useState<CatalogosEvaluacion | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [formulario, setFormulario] = useState<FormularioActivo>(null)
  const [jurado, setJurado] = useState<JuradoInput>(EMPTY_JURADO)
  const [fechaLimite, setFechaLimite] = useState('')
  const [documentoId, setDocumentoId] = useState('')
  const [enviarInvitaciones, setEnviarInvitaciones] = useState(true)
  const [banco, setBanco] = useState<BancoJurado[]>([])
  const [bancoLoading, setBancoLoading] = useState(false)
  const [reemplazando, setReemplazando] = useState<JuradoEvaluador | null>(null)
  const [modalidad, setModalidad] = useState('')
  const [fechaSustentacion, setFechaSustentacion] = useState('')
  const [lugar, setLugar] = useState('')
  const [enlace, setEnlace] = useState('')
  const [notificarJurados, setNotificarJurados] = useState(true)
  const [resultado, setResultado] = useState('')
  const [actaId, setActaId] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [nextProceso, nextCatalogos, nextHistorial] = await Promise.all([
        getProcesoEvaluacion(solicitudId),
        getCatalogosEvaluacion(),
        getHistorialProcesoEvaluacion(solicitudId),
      ])
      setProceso(nextProceso)
      setHistorial(nextHistorial)
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
    const query = jurado.correo.trim() || jurado.nombre.trim()
    if (query.length < 3 || reemplazando) {
      setBanco([])
      return
    }
    const timeout = window.setTimeout(() => {
      setBancoLoading(true)
      buscarBancoJurados(query)
        .then(setBanco)
        .catch(() => setBanco([]))
        .finally(() => setBancoLoading(false))
    }, 350)
    return () => window.clearTimeout(timeout)
  }, [jurado.correo, jurado.nombre, reemplazando])

  const estado = proceso?.estadoSolicitud ?? ''
  const activeJurors = useMemo(
    () => [...(proceso?.jurados ?? [])].sort((a, b) => Number(b.activo) - Number(a.activo)),
    [proceso?.jurados],
  )
  const canManageJurors = ESTADOS_CON_DESIGNACION.has(estado)

  const runMutation = async (operation: () => Promise<unknown>, success: string) => {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await operation()
      const [nextProceso, nextHistorial] = await Promise.all([
        getProcesoEvaluacion(solicitudId),
        getHistorialProcesoEvaluacion(solicitudId),
        onUpdated(),
      ])
      setProceso(nextProceso)
      setHistorial(nextHistorial)
      setMessage(success)
      setFormulario(null)
      setReemplazando(null)
      setJurado(EMPTY_JURADO)
    } catch (mutationError) {
      setError(getErrorMessage(mutationError, 'No fue posible completar la acción.'))
    } finally {
      setBusy(false)
    }
  }

  const selectBanco = (item: BancoJurado) => {
    setJurado({
      nombre: item.nombre,
      correo: item.correo,
      institucion: item.institucion ?? '',
      externo: item.externo ?? true,
      idioma: item.idioma ?? 'ES',
    })
    setBanco([])
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
      () => designarJurados(solicitudId, {
        jurados: [jurado],
        fechaLimiteEvaluacion: fechaLimite,
        documentoEvaluarId: selectedDocument,
        enviarInvitaciones,
      }),
      enviarInvitaciones ? 'Jurado registrado e invitación enviada.' : 'Jurado registrado.',
    )
  }

  const submitSustentacion = () => {
    if (!fechaSustentacion || !modalidad) {
      setError('Selecciona la fecha y la modalidad de la sustentación.')
      return
    }
    if (modalidad === 'VIRTUAL' && !enlace.trim()) {
      setError('La modalidad virtual requiere un enlace.')
      return
    }
    if (modalidad === 'PRESENCIAL' && !lugar.trim()) {
      setError('La modalidad presencial requiere un lugar.')
      return
    }
    void runMutation(
      () => programarSustentacion(solicitudId, {
        fechaSustentacion,
        modalidadCodigo: modalidad,
        lugar: lugar.trim() || null,
        enlace: enlace.trim() || null,
        notificarJurados,
      }),
      'Sustentación programada correctamente.',
    )
  }

  if (loading) return <section className="evaluacion-tg evaluacion-tg--status"><p>Cargando proceso de evaluación…</p></section>
  if (!proceso) return <section className="evaluacion-tg evaluacion-tg--status"><p role="alert">{error}</p><button type="button" onClick={() => void load()}>Reintentar</button></section>

  const canSendReminders = ['EN_EVALUACION', 'JUR_INVITADO'].includes(estado)
  const canSendToAdjustments = ESTADOS_CON_AJUSTES.has(estado)
  const canScheduleDefense = puedeAgendarSustentacion(estado)
  const canRegisterResult = ESTADOS_CON_RESULTADO.has(estado)
    && todosLosJuradosActivosEvaluaronSustentacion(activeJurors)
  const hasProcessActions = canSendReminders || canSendToAdjustments || canRegisterResult
  const hasJurorActions = canManageJurors && activeJurors.some((item) => item.activo)

  return (
    <section className="evaluacion-tg" aria-labelledby="evaluacion-tg-title">
      <header className="evaluacion-tg__header">
        <div>
          <p className="evaluacion-tg__eyebrow">Gestión de coordinación</p>
          <h3 id="evaluacion-tg-title">Proceso de evaluación</h3>
          <p>{proceso.titulo}</p>
        </div>
        <span className="evaluacion-tg__state">
          {formatEstadoNombre(proceso.estadoSolicitudNombre, proceso.estadoSolicitud)}
        </span>
      </header>

      {message && <p className="evaluacion-tg__message" role="status">{message}</p>}
      {error && <p className="evaluacion-tg__error" role="alert">{error}</p>}

      {canScheduleDefense && (
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
            const [nextProceso, nextHistorial] = await Promise.all([getProcesoEvaluacion(solicitudId), getHistorialProcesoEvaluacion(solicitudId), onUpdated()])
            setProceso(nextProceso)
            setHistorial(nextHistorial)
            setMessage(`Se enviaron ${count} recordatorio(s).`)
          }).catch((e: unknown) => setError(getErrorMessage(e, 'No fue posible enviar recordatorios.'))).finally(() => setBusy(false))
        }} disabled={busy} title="Solo se envían a jurados que aceptaron y aún no evaluaron.">Enviar recordatorios</button>}
        {canSendToAdjustments && <button type="button" onClick={() => void runMutation(() => enviarAAjustes(solicitudId), 'El trabajo fue enviado a correcciones.')} disabled={busy}>Enviar a correcciones</button>}
        {canRegisterResult && <button type="button" onClick={() => setFormulario('resultado')} disabled={busy}>Registrar resultado</button>}
      </div>}

      {formulario === 'designar' && (
        <div className="evaluacion-tg__form-card">
          <h4>{reemplazando ? `Reemplazar a ${reemplazando.nombre}` : 'Agregar evaluador'}</h4>
          <div className="evaluacion-tg__form-grid">
            <label><span>Nombre *</span><input value={jurado.nombre} onChange={(e) => setJurado((v) => ({ ...v, nombre: e.target.value }))} /></label>
            <label className="evaluacion-tg__autocomplete"><span>Correo *</span><input type="email" value={jurado.correo} onChange={(e) => setJurado((v) => ({ ...v, correo: e.target.value }))} />
              {(bancoLoading || banco.length > 0) && <div className="evaluacion-tg__suggestions">{bancoLoading ? <p>Buscando…</p> : banco.map((item) => <button type="button" key={item.correo} onClick={() => selectBanco(item)}><strong>{item.nombre}</strong><span>{item.correo} · {item.participaciones} participación(es)</span></button>)}</div>}
            </label>
            <label><span>Institución *</span><input value={jurado.institucion} onChange={(e) => setJurado((v) => ({ ...v, institucion: e.target.value }))} /></label>
            <label><span>Idioma de la invitación</span><select value={jurado.idioma} onChange={(e) => setJurado((v) => ({ ...v, idioma: e.target.value as IdiomaJurado }))}><option value="ES">Español</option><option value="EN">Inglés</option></select></label>
            {!reemplazando && <><label><span>Fecha límite *</span><input type="date" value={fechaLimite} onChange={(e) => setFechaLimite(e.target.value)} /></label><label><span>Documento a evaluar *</span><select value={documentoId} onChange={(e) => setDocumentoId(e.target.value)}><option value="">Selecciona un documento</option>{documentos.map((doc) => <option key={doc.idDocumento} value={doc.idDocumento}>{doc.nombreArchivo}</option>)}</select></label></>}
          </div>
          <label className="evaluacion-tg__check"><input type="checkbox" checked={jurado.externo} onChange={(e) => setJurado((v) => ({ ...v, externo: e.target.checked }))} /> Evaluador externo a la UIS</label>
          {!reemplazando && <label className="evaluacion-tg__check"><input type="checkbox" checked={enviarInvitaciones} onChange={(e) => setEnviarInvitaciones(e.target.checked)} /> Enviar invitación al guardar</label>}
          <div className="evaluacion-tg__form-actions"><button type="button" onClick={submitJurado} disabled={busy}>{busy ? 'Guardando…' : reemplazando ? 'Reemplazar e invitar' : 'Guardar jurado'}</button><button type="button" className="secondary" onClick={() => { setFormulario(null); setReemplazando(null); setJurado(EMPTY_JURADO) }} disabled={busy}>Cancelar</button></div>
        </div>
      )}

      {formulario === 'sustentacion' && <div className="evaluacion-tg__form-card"><h4>Programar sustentación</h4><div className="evaluacion-tg__form-grid"><label><span>Fecha y hora *</span><input type="datetime-local" value={fechaSustentacion} onChange={(e) => setFechaSustentacion(e.target.value)} /></label><label><span>Modalidad *</span><select value={modalidad} onChange={(e) => setModalidad(e.target.value)}>{catalogos?.modalidades.map((item) => <option key={item.codigo} value={item.codigo}>{item.nombre}</option>)}</select></label>{modalidad === 'PRESENCIAL' && <label><span>Lugar *</span><input value={lugar} onChange={(e) => setLugar(e.target.value)} /></label>}{modalidad === 'VIRTUAL' && <label><span>Enlace *</span><input type="url" value={enlace} onChange={(e) => setEnlace(e.target.value)} /></label>}</div><label className="evaluacion-tg__check"><input type="checkbox" checked={notificarJurados} onChange={(e) => setNotificarJurados(e.target.checked)} /> Notificar a los jurados</label><div className="evaluacion-tg__form-actions"><button type="button" onClick={submitSustentacion} disabled={busy}>Programar</button><button type="button" className="secondary" onClick={() => setFormulario(null)}>Cancelar</button></div></div>}

      {formulario === 'resultado' && canRegisterResult && <div className="evaluacion-tg__form-card"><h4>Registrar resultado</h4><div className="evaluacion-tg__form-grid"><label><span>Resultado *</span><select value={resultado} onChange={(e) => setResultado(e.target.value)}>{catalogos?.resultados.map((item) => <option key={item.codigo} value={item.codigo}>{item.nombre}</option>)}</select></label><label><span>Acta</span><select value={actaId} onChange={(e) => setActaId(e.target.value)}><option value="">Sin acta asociada</option>{actas.map((acta) => <option key={acta.id} value={acta.id}>{acta.codigo} — {acta.nombre}</option>)}</select></label></div>{proceso.tipoSolicitudCodigo === 'CAND_DOCTORAL' && <p>La nota final será calculada por el backend a partir del promedio registrado por los jurados.</p>}<div className="evaluacion-tg__form-actions"><button type="button" disabled={!resultado || busy} onClick={() => void runMutation(() => registrarResultado(solicitudId, { resultadoCodigo: resultado, notaFinal: null, actaId: actaId ? Number(actaId) : null }), 'Resultado registrado y proceso cerrado.')}>Registrar resultado</button><button type="button" className="secondary" onClick={() => setFormulario(null)}>Cancelar</button></div></div>}

      <section className="evaluacion-tg__section" aria-labelledby="jurados-title"><div className="evaluacion-tg__section-heading"><div><h4 id="jurados-title">Jurados evaluadores</h4><span>{activeJurors.filter((item) => item.activo).length} activos</span></div>{canManageJurors && <button type="button" className="evaluacion-tg__add-evaluator" onClick={() => { setReemplazando(null); setJurado(EMPTY_JURADO); setFormulario('designar') }} disabled={busy}><span aria-hidden="true">＋</span> Agregar evaluador</button>}</div>{activeJurors.length === 0 ? <p>No se han agregado evaluadores.</p> : <div className="evaluacion-tg__table-shell"><table><thead><tr><th>Jurado</th><th>Institución</th><th>Invitación</th><th>Respuesta</th><th>Evaluaciones</th>{hasJurorActions && <th>Acciones</th>}</tr></thead><tbody>{activeJurors.map((item) => <tr key={item.id} className={!item.activo ? 'evaluacion-tg__inactive' : undefined}><td data-label="Jurado"><strong>{item.nombre}</strong><span>{item.correo}</span></td><td data-label="Institución">{item.institucion || '—'}</td><td data-label="Invitación"><span className={`evaluacion-tg__chip evaluacion-tg__chip--${item.estadoInvitacion.toLocaleLowerCase()}`}>{item.estadoInvitacionNombre || item.estadoInvitacion}</span></td><td data-label="Respuesta">{formatDate(item.fechaRespuesta, true)}</td><td data-label="Evaluaciones">{item.evaluaciones?.length ? <div className="evaluacion-tg__evaluations">{item.evaluaciones.map((evaluation) => <EvaluacionDetalle key={evaluation.id} evaluacion={evaluation} tipoSolicitudCodigo={proceso.tipoSolicitudCodigo} />)}</div> : 'Pendientes'}</td>{hasJurorActions && <td data-label="Acciones">{item.activo && <div className="evaluacion-tg__row-actions"><button type="button" disabled={busy} onClick={() => void runMutation(() => reenviarInvitacion(solicitudId, item.id), 'Invitación reenviada.')}>Reenviar</button><button type="button" disabled={busy} onClick={() => { setReemplazando(item); setJurado(EMPTY_JURADO); setFormulario('designar') }}>Reemplazar</button><button type="button" className="danger" disabled={busy} onClick={() => { if (window.confirm(`¿Retirar a ${item.nombre} del proceso?`)) void runMutation(() => retirarJurado(solicitudId, item.id), 'Jurado retirado.') }}>Retirar</button></div>}</td>}</tr>)}</tbody></table></div>}</section>

      {proceso.sustentacion && <section className="evaluacion-tg__section"><h4>Sustentación</h4><dl className="evaluacion-tg__summary"><div><dt>Fecha</dt><dd>{formatDate(proceso.sustentacion.fechaSustentacion, true)}</dd></div><div><dt>Modalidad</dt><dd>{proceso.sustentacion.modalidadNombre || proceso.sustentacion.modalidadCodigo}</dd></div><div><dt>Lugar o enlace</dt><dd>{proceso.sustentacion.lugar || proceso.sustentacion.enlace || '—'}</dd></div></dl></section>}

      <section className="evaluacion-tg__section">
        <h4>Línea de tiempo</h4>
        {historial.length === 0 ? <p>No hay cambios de estado registrados.</p> : (
          <ol className="evaluacion-tg__timeline">
            {historial.map((item, index) => (
              <li key={`${item.estadoNuevoSigla}-${item.fecha}-${index}`}>
                <span aria-hidden="true" />
                <div>
                  <strong>{formatEstadoNombre(item.estadoNuevo, item.estadoNuevoSigla)}</strong>
                  <small>{formatDate(item.fecha, true)}</small>
                  <div className="evaluacion-tg__timeline-meta">
                    {item.estadoAnteriorSigla && <span><b>Estado anterior:</b> {formatEstadoNombre(item.estadoAnterior, item.estadoAnteriorSigla)}</span>}
                    <span><b>Origen:</b> {item.origen}</span>
                    {item.responsable && <span><b>Responsable:</b> {item.responsable}</span>}
                    {item.minutosEnEstadoAnterior != null && <span><b>Tiempo en estado anterior:</b> {item.minutosEnEstadoAnterior} min</span>}
                  </div>
                  {item.detalle && <p>{item.detalle}</p>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </section>
  )
}

export default ProcesoEvaluacionPanel

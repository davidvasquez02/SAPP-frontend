import { useEffect, useRef, useState } from 'react'
import { ModuleLayout } from '../../components'
import {
  crearEvaluadorCandidato,
  desactivarEvaluadorCandidato,
  getEvaluadoresCandidatos,
  modificarEvaluadorCandidato,
  reactivarEvaluadorCandidato,
} from '../../api/evaluadorCandidatoService'
import type { EvaluadorCandidatoDto, EvaluadorCandidatoRequest } from '../../api/evaluadorCandidatoTypes'
import './BancoEvaluadoresPage.css'

const ITEMS_POR_PAGINA = 10

const EMPTY_FORM: EvaluadorCandidatoRequest = {
  nombre: '',
  tratamiento: '',
  tratamientoEn: '',
  correo: '',
  institucion: '',
  externo: true,
  idioma: 'ES',
  notas: '',
}

const BancoEvaluadoresPage = () => {
  const [candidatos, setCandidatos] = useState<EvaluadorCandidatoDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [mostrarRetirados, setMostrarRetirados] = useState(false)
  const [formulario, setFormulario] = useState<EvaluadorCandidatoRequest | null>(null)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [guardando, setGuardando] = useState(false)

  const [pagina, setPagina] = useState(1)
  const totalPaginas = Math.max(1, Math.ceil(candidatos.length / ITEMS_POR_PAGINA))
  const inicioPagina = (pagina - 1) * ITEMS_POR_PAGINA
  const candidatosPagina = candidatos.slice(inicioPagina, inicioPagina + ITEMS_POR_PAGINA)

  const solicitudRef = useRef(0)

  const cargar = async (query: string, mostrarRetirar: boolean) => {
    const solicitud = ++solicitudRef.current
    setError(null)
    try {
      const data = await getEvaluadoresCandidatos({
        busqueda: query.trim() || undefined,
        activo: mostrarRetirar ? undefined : true,
      })
      if (solicitud === solicitudRef.current) {
        setCandidatos(data)
        setPagina((actual) => Math.min(actual, Math.max(1, Math.ceil(data.length / ITEMS_POR_PAGINA))))
      }
    } catch (err) {
      if (solicitud === solicitudRef.current) {
        setError(err instanceof Error ? err.message : 'No fue posible cargar el banco de evaluadores.')
      }
    } finally {
      if (solicitud === solicitudRef.current) setIsLoading(false)
    }
  }

  useEffect(() => {
    const espera = setTimeout(() => void cargar(busqueda, mostrarRetirados), 300)
    return () => clearTimeout(espera)
  }, [busqueda, mostrarRetirados])

  const abrirNuevo = () => {
    setFormulario(EMPTY_FORM)
    setEditandoId(null)
    setError(null)
    setMensaje(null)
  }

  const abrirEditar = (candidato: EvaluadorCandidatoDto) => {
    setFormulario({
      nombre: candidato.nombre,
      tratamiento: candidato.tratamiento ?? '',
      tratamientoEn: candidato.tratamientoEn ?? '',
      correo: candidato.correo,
      institucion: candidato.institucion ?? '',
      externo: candidato.externo,
      idioma: candidato.idioma,
      notas: candidato.notas ?? '',
    })
    setEditandoId(candidato.id)
    setError(null)
    setMensaje(null)
  }

  const cerrarFormulario = () => {
    setFormulario(null)
    setEditandoId(null)
  }

  const guardar = async () => {
    if (!formulario || !formulario.nombre.trim() || !formulario.correo.trim()) {
      setError('Completa el nombre y el correo de la persona.')
      return
    }
    setGuardando(true)
    setError(null)
    setMensaje(null)
    try {
      if (editandoId != null) {
        await modificarEvaluadorCandidato(editandoId, formulario)
        setMensaje('Los datos fueron actualizados.')
      } else {
        await crearEvaluadorCandidato(formulario)
        setMensaje('La persona fue registrada en el banco de evaluadores.')
      }
      cerrarFormulario()
      await cargar(busqueda, mostrarRetirados)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible guardar los datos.')
    } finally {
      setGuardando(false)
    }
  }

  const retirar = async (candidato: EvaluadorCandidatoDto) => {
    setError(null)
    setMensaje(null)
    try {
      await desactivarEvaluadorCandidato(candidato.id)
      setMensaje(`${candidato.nombre} fue retirado del banco.`)
      await cargar(busqueda, mostrarRetirados)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible retirar a esta persona.')
    }
  }

  const reactivar = async (candidato: EvaluadorCandidatoDto) => {
    setError(null)
    setMensaje(null)
    try {
      await reactivarEvaluadorCandidato(candidato.id)
      setMensaje(`${candidato.nombre} fue reincorporado al banco.`)
      await cargar(busqueda, mostrarRetirados)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible reincorporar a esta persona.')
    }
  }

  return (
    <ModuleLayout title="Banco de evaluadores">
      <section className="banco-evaluadores">
        <header className="banco-evaluadores__header">
          <p>
            Registra personas interesadas en ser jurado de trabajo de grado, antes de que participen en ningún
            proceso. Al designar un jurado, estas personas aparecen junto a quienes ya han evaluado antes.
          </p>
          {!formulario && (
            <button type="button" className="banco-evaluadores__primary" onClick={abrirNuevo}>
              Registrar persona
            </button>
          )}
        </header>

        {error && <p className="banco-evaluadores__alert banco-evaluadores__alert--error" role="alert">{error}</p>}
        {mensaje && <p className="banco-evaluadores__alert banco-evaluadores__alert--success" role="status">{mensaje}</p>}

        {formulario && (
          <div className="banco-evaluadores__form-card">
            <h4>{editandoId != null ? 'Editar persona' : 'Registrar persona'}</h4>
            <div className="banco-evaluadores__form-grid">
              <label><span>Nombre *</span><input value={formulario.nombre} onChange={(e) => setFormulario((v) => v && { ...v, nombre: e.target.value })} /></label>
              <label><span>Tratamiento en español (opcional)</span><input value={formulario.tratamiento} onChange={(e) => setFormulario((v) => v && { ...v, tratamiento: e.target.value })} placeholder="Dr., Dra., MSc., Ing., etc. Por defecto: Profesor(a)" /></label>
              <label><span>Tratamiento en inglés (opcional)</span><input value={formulario.tratamientoEn ?? ''} onChange={(e) => setFormulario((v) => v && { ...v, tratamientoEn: e.target.value })} placeholder="Dr., Prof., etc. Por defecto: Professor" /></label>
              <label><span>Correo *</span><input type="email" value={formulario.correo} onChange={(e) => setFormulario((v) => v && { ...v, correo: e.target.value })} /></label>
              <label><span>Institución (opcional)</span><input value={formulario.institucion} onChange={(e) => setFormulario((v) => v && { ...v, institucion: e.target.value })} /></label>
              <label><span>Idioma</span><select value={formulario.idioma} onChange={(e) => setFormulario((v) => v && { ...v, idioma: e.target.value as 'ES' | 'EN' })}><option value="ES">Español</option><option value="EN">Inglés</option></select></label>
              <label className="banco-evaluadores__check"><input type="checkbox" checked={formulario.externo} onChange={(e) => setFormulario((v) => v && { ...v, externo: e.target.checked })} /> Externo a la UIS</label>
              <label className="banco-evaluadores__wide"><span>Notas (opcional)</span><textarea rows={2} value={formulario.notas} onChange={(e) => setFormulario((v) => v && { ...v, notas: e.target.value })} placeholder="De dónde se conoce, área de interés, etc." /></label>
            </div>
            <div className="banco-evaluadores__form-actions">
              <button type="button" onClick={() => void guardar()} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</button>
              <button type="button" className="secondary" onClick={cerrarFormulario} disabled={guardando}>Cancelar</button>
            </div>
          </div>
        )}

        <div className="banco-evaluadores__filters">
          <label><span>Buscar por nombre, correo o institución</span><input type="search" value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPagina(1) }} placeholder="Ej. Ana o Universidad Nacional" /></label>
          <label className="banco-evaluadores__check"><input type="checkbox" checked={mostrarRetirados} onChange={(e) => { setMostrarRetirados(e.target.checked); setPagina(1) }} /> Mostrar retirados</label>
        </div>

        {isLoading ? <p className="banco-evaluadores__status">Cargando banco de evaluadores...</p> : null}

        {!isLoading && candidatos.length === 0 ? (
          <p className="banco-evaluadores__status">No hay personas registradas con esos filtros.</p>
        ) : null}

        {!isLoading && candidatos.length > 0 ? (
          <div className="banco-evaluadores__table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Institución</th>
                  <th>Idioma</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {candidatosPagina.map((candidato) => (
                  <tr key={candidato.id} className={!candidato.activo ? 'banco-evaluadores__row--retirado' : undefined}>
                    <td>{candidato.tratamiento ? `${candidato.tratamiento} ` : ''}{candidato.nombre}</td>
                    <td>{candidato.correo}</td>
                    <td>{candidato.institucion || '—'}</td>
                    <td>{candidato.idioma}</td>
                    <td>
                      <span className={`banco-evaluadores__estado banco-evaluadores__estado--${candidato.activo ? 'activo' : 'retirado'}`}>
                        {candidato.activo ? 'Activo' : 'Retirado'}
                      </span>
                    </td>
                    <td className="banco-evaluadores__acciones">
                      <button type="button" onClick={() => abrirEditar(candidato)}>Editar</button>
                      {candidato.activo ? (
                        <button type="button" className="danger" onClick={() => void retirar(candidato)}>Retirar</button>
                      ) : (
                        <button type="button" onClick={() => void reactivar(candidato)}>Reincorporar</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {!isLoading && totalPaginas > 1 && (
          <nav className="banco-evaluadores__pagination" aria-label="Paginación del banco de evaluadores">
            <button type="button" disabled={pagina === 1} onClick={() => setPagina(pagina - 1)}>Anterior</button>
            <span aria-live="polite">Página {pagina} de {totalPaginas}</span>
            <button type="button" disabled={pagina === totalPaginas} onClick={() => setPagina(pagina + 1)}>Siguiente</button>
          </nav>
        )}
      </section>
    </ModuleLayout>
  )
}

export default BancoEvaluadoresPage

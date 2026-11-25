import { useEffect, useState } from 'react'
import type { AsignaturaExternaDto, MateriaDto, MateriaSeleccionada, MatriculaAcademicaVigenteDto } from '../../types'
import {
  getVentanaInclusionCancelacionVigente,
  solicitarInclusionCancelacion,
  type PeriodoAcademicoMatriculaVigenteDto,
} from '../../services/matriculaAcademicaService'
import MateriaExternaForm from '../MateriaExternaForm/MateriaExternaForm'
import MateriasSelector from '../MateriasSelector/MateriasSelector'
import './InclusionCancelacionPanel.css'

type InclusionCancelacionPanelProps = {
  matricula: MatriculaAcademicaVigenteDto
  materiasCatalogo: MateriaDto[]
  onSolicitudEnviada: () => void
}

const InclusionCancelacionPanel = ({ matricula, materiasCatalogo, onSolicitudEnviada }: InclusionCancelacionPanelProps) => {
  const [open, setOpen] = useState(false)
  const [checkingVentana, setCheckingVentana] = useState(false)
  const [ventana, setVentana] = useState<PeriodoAcademicoMatriculaVigenteDto | null>(null)
  const [incluir, setIncluir] = useState<MateriaSeleccionada[]>([])
  const [cancelarIds, setCancelarIds] = useState<Set<number>>(new Set())
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const materiasMatriculadas = matricula.asignaturas.filter((asignatura) => asignatura.estado.toUpperCase() === 'MATRICULADA')

  useEffect(() => {
    if (!open) return

    let cancelled = false
    setCheckingVentana(true)
    setError(null)
    getVentanaInclusionCancelacionVigente(matricula.periodoId)
      .then((fechaVigente) => {
        if (!cancelled) setVentana(fechaVigente)
      })
      .catch((caught) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : 'No fue posible verificar la ventana de inclusión y cancelación.')
      })
      .finally(() => {
        if (!cancelled) setCheckingVentana(false)
      })

    return () => { cancelled = true }
  }, [open, matricula.periodoId])

  const toggleCancelar = (asignaturaId: number) => {
    setCancelarIds((current) => {
      const next = new Set(current)
      if (next.has(asignaturaId)) next.delete(asignaturaId)
      else next.add(asignaturaId)
      return next
    })
  }

  const handleAddExterna = (externa: AsignaturaExternaDto) => {
    setIncluir((current) => [
      ...current,
      { id: -(Date.now() + current.length), nombre: externa.nombre, codigo: externa.codigo, nivel: null, addedAt: new Date().toISOString(), externa },
    ])
  }

  const puedeEnviar = ventana !== null && (incluir.length > 0 || cancelarIds.size > 0) && !enviando

  const cerrar = () => {
    setOpen(false)
    setIncluir([])
    setCancelarIds(new Set())
  }

  const enviar = async () => {
    if (!puedeEnviar) return

    try {
      setEnviando(true)
      setError(null)
      await solicitarInclusionCancelacion(matricula.id, {
        incluir: incluir.map((materia) => (materia.externa ? { externa: materia.externa } : { asignaturaId: materia.id })),
        cancelarAsignaturaIds: [...cancelarIds],
      })
      setMensaje('Solicitud registrada. Queda pendiente de la decisión de coordinación.')
      cerrar()
      onSolicitudEnviada()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No fue posible registrar la solicitud.')
    } finally {
      setEnviando(false)
    }
  }

  if (!open) {
    return (
      <div className="inclusion-cancelacion-panel">
        {mensaje ? <p className="inclusion-cancelacion-panel__message">{mensaje}</p> : null}
        <button type="button" className="inclusion-cancelacion-panel__toggle" onClick={() => {
          setCheckingVentana(true)
          setVentana(null)
          setError(null)
          setOpen(true)
          setMensaje(null)
        }}>
          Solicitar inclusión o cancelación de materias
        </button>
      </div>
    )
  }

  return (
    <section className="inclusion-cancelacion-panel inclusion-cancelacion-panel--open" aria-labelledby="inclusion-cancelacion-titulo">
      <h4 id="inclusion-cancelacion-titulo">Inclusión y cancelación de materias</h4>
      {checkingVentana ? <p role="status">Verificando la ventana de inclusión y cancelación…</p> : null}
      {error ? <p role="alert" className="inclusion-cancelacion-panel__error">{error}</p> : null}
      {!checkingVentana && !error && !ventana ? (
        <p className="inclusion-cancelacion-panel__error">No hay una ventana de inclusión y cancelación vigente para este periodo.</p>
      ) : null}
      {!checkingVentana && ventana ? (
        <>
          <p>Solicitudes hasta el <time dateTime={ventana.fechaFin}>{ventana.fechaFin.split('-').reverse().join('/')}</time>.</p>
          <div>
            <h5>Incluir materias nuevas</h5>
            <MateriasSelector materias={materiasCatalogo} selected={incluir} onAdd={(materia) => setIncluir((current) => current.some((item) => item.id === materia.id) ? current : [...current, { ...materia, addedAt: new Date().toISOString() }])} disabled={enviando} />
            <MateriaExternaForm disabled={enviando} onAdd={handleAddExterna} />
            {incluir.length > 0 ? (
              <ul className="inclusion-cancelacion-panel__list">
                {incluir.map((materia) => (
                  <li key={materia.id}>
                    {materia.nombre}
                    <button type="button" disabled={enviando} onClick={() => setIncluir((current) => current.filter((item) => item.id !== materia.id))}>Quitar</button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div>
            <h5>Cancelar materias matriculadas</h5>
            {materiasMatriculadas.length === 0 ? (
              <p>No tienes materias matriculadas para cancelar.</p>
            ) : (
              <ul className="inclusion-cancelacion-panel__list">
                {materiasMatriculadas.map((asignatura) => (
                  <li key={asignatura.asignaturaId}>
                    <label>
                      <input type="checkbox" disabled={enviando} checked={cancelarIds.has(asignatura.asignaturaId)} onChange={() => toggleCancelar(asignatura.asignaturaId)} />
                      {asignatura.asignaturaNombre}
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
      <div className="inclusion-cancelacion-panel__actions">
        <button type="button" disabled={enviando} onClick={cerrar}>Cerrar</button>
        {!checkingVentana && ventana ? (
          <button type="button" className="inclusion-cancelacion-panel__submit" disabled={!puedeEnviar} onClick={() => void enviar()}>{enviando ? 'Enviando…' : 'Enviar solicitud'}</button>
        ) : null}
      </div>
    </section>
  )
}

export default InclusionCancelacionPanel

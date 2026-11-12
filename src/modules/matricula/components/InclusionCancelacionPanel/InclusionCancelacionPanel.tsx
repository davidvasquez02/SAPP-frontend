import { useEffect, useState } from 'react'
import type { AsignaturaExternaDto, MateriaDto, MateriaSeleccionada, MatriculaAcademicaVigenteDto } from '../../types'
import {
  getVentanaInclusionCancelacionVigente,
  solicitarInclusionCancelacion,
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
  const [ventanaAbierta, setVentanaAbierta] = useState<boolean | null>(null)
  const [incluir, setIncluir] = useState<MateriaSeleccionada[]>([])
  const [cancelarIds, setCancelarIds] = useState<Set<number>>(new Set())
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const materiasMatriculadas = matricula.asignaturas.filter((asignatura) => asignatura.estado.toUpperCase() === 'MATRICULADA')

  useEffect(() => {
    if (!open || ventanaAbierta !== null) return

    let cancelled = false
    setCheckingVentana(true)
    setError(null)
    getVentanaInclusionCancelacionVigente()
      .then((ventana) => {
        if (!cancelled) setVentanaAbierta(ventana != null)
      })
      .catch((caught) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : 'No fue posible verificar la ventana de inclusión y cancelación.')
      })
      .finally(() => {
        if (!cancelled) setCheckingVentana(false)
      })

    return () => { cancelled = true }
  }, [open, ventanaAbierta])

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

  const puedeEnviar = (incluir.length > 0 || cancelarIds.size > 0) && !enviando

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
      setIncluir([])
      setCancelarIds(new Set())
      setOpen(false)
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
        <button type="button" className="inclusion-cancelacion-panel__toggle" onClick={() => { setOpen(true); setMensaje(null) }}>
          Solicitar inclusión o cancelación de materias
        </button>
      </div>
    )
  }

  return (
    <section className="inclusion-cancelacion-panel inclusion-cancelacion-panel--open">
      <h4>Inclusión y cancelación de materias</h4>
      {checkingVentana ? <p>Verificando la ventana de inclusión y cancelación…</p> : null}
      {error ? <p className="inclusion-cancelacion-panel__error">{error}</p> : null}
      {!checkingVentana && ventanaAbierta === false ? (
        <p className="inclusion-cancelacion-panel__error">No hay una ventana de inclusión y cancelación vigente para este periodo.</p>
      ) : null}
      {!checkingVentana && ventanaAbierta ? (
        <>
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
          <div className="inclusion-cancelacion-panel__actions">
            <button type="button" disabled={enviando} onClick={() => { setOpen(false); setIncluir([]); setCancelarIds(new Set()) }}>Cancelar</button>
            <button type="button" disabled={!puedeEnviar} onClick={() => void enviar()}>{enviando ? 'Enviando…' : 'Enviar solicitud'}</button>
          </div>
        </>
      ) : null}
    </section>
  )
}

export default InclusionCancelacionPanel

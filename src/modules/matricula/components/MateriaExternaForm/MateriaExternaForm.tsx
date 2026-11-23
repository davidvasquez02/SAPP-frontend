import { useEffect, useState } from 'react'
import { getOpcionesInstituciones } from '../../../../api/gruposInvestigacionGestionService'
import type { InstitucionGrupoDto } from '../../../../api/gruposInvestigacionGestionTypes'
import type { AsignaturaExternaDto } from '../../types'
import './MateriaExternaForm.css'

type MateriaExternaFormProps = {
  disabled?: boolean
  onAdd: (externa: AsignaturaExternaDto, escuelaNombre?: string) => void
}

const MateriaExternaForm = ({ disabled = false, onAdd }: MateriaExternaFormProps) => {
  const [open, setOpen] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [nombre, setNombre] = useState('')
  const [creditos, setCreditos] = useState('')
  const [esExterna, setEsExterna] = useState(false)
  const [escuelaId, setEscuelaId] = useState('')
  const [institucion, setInstitucion] = useState('')
  const [escuelas, setEscuelas] = useState<InstitucionGrupoDto[]>([])
  const [loadingEscuelas, setLoadingEscuelas] = useState(false)

  useEffect(() => {
    if (!open || esExterna || escuelas.length > 0) return

    const cargarEscuelas = async () => {
      setLoadingEscuelas(true)
      try {
        setEscuelas(await getOpcionesInstituciones('ESCUELA'))
      } catch {
        setEscuelas([])
      } finally {
        setLoadingEscuelas(false)
      }
    }

    void cargarEscuelas()
  }, [open, esExterna, escuelas.length])

  const creditosNumero = Number(creditos)
  const datosBasicosCompletos = codigo.trim() !== '' && nombre.trim() !== '' && Number.isInteger(creditosNumero) && creditosNumero > 0
  const canSubmit = datosBasicosCompletos && (esExterna ? institucion.trim() !== '' : escuelaId !== '')

  const reset = () => {
    setCodigo('')
    setNombre('')
    setCreditos('')
    setEsExterna(false)
    setEscuelaId('')
    setInstitucion('')
  }

  if (!open) {
    return (
      <button type="button" className="materia-externa-form__toggle" disabled={disabled} onClick={() => setOpen(true)}>
        Agregar materia de otra institución
      </button>
    )
  }

  return (
    <form
      className="materia-externa-form"
      onSubmit={(event) => {
        event.preventDefault()
        if (!canSubmit) return
        const escuela = esExterna ? undefined : escuelas.find((item) => item.id === Number(escuelaId))
        onAdd(
          {
            codigo: codigo.trim(),
            nombre: nombre.trim(),
            creditos: creditosNumero,
            ...(esExterna ? { institucion: institucion.trim() } : { escuelaId: Number(escuelaId) }),
          },
          escuela?.nombre,
        )
        reset()
        setOpen(false)
      }}
    >
      <label>
        <span>Código</span>
        <input value={codigo} disabled={disabled} required onChange={(event) => setCodigo(event.target.value)} />
      </label>
      <label>
        <span>Nombre</span>
        <input value={nombre} disabled={disabled} required onChange={(event) => setNombre(event.target.value)} />
      </label>
      <label>
        <span>Créditos</span>
        <input type="number" min="1" step="1" value={creditos} disabled={disabled} required onChange={(event) => setCreditos(event.target.value)} />
      </label>
      <label className="materia-externa-form__checkbox">
        <input
          type="checkbox"
          checked={esExterna}
          disabled={disabled}
          onChange={(event) => {
            setEsExterna(event.target.checked)
            setEscuelaId('')
            setInstitucion('')
          }}
        />
        <span>Es de otra universidad (no de la UIS)</span>
      </label>
      {esExterna ? (
        <label>
          <span>Institución</span>
          <input value={institucion} disabled={disabled} required onChange={(event) => setInstitucion(event.target.value)} />
        </label>
      ) : (
        <label>
          <span>Escuela</span>
          <select value={escuelaId} disabled={disabled || loadingEscuelas} required onChange={(event) => setEscuelaId(event.target.value)}>
            <option value="">{loadingEscuelas ? 'Cargando escuelas…' : 'Selecciona una escuela...'}</option>
            {escuelas.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nombre}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="materia-externa-form__actions">
        <button type="button" className="materia-externa-form__cancel" disabled={disabled} onClick={() => { reset(); setOpen(false) }}>
          Cancelar
        </button>
        <button type="submit" className="materia-externa-form__submit" disabled={disabled || !canSubmit}>
          Agregar
        </button>
      </div>
    </form>
  )
}

export default MateriaExternaForm

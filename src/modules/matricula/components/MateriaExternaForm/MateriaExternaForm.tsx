import { useState } from 'react'
import type { AsignaturaExternaDto } from '../../types'
import './MateriaExternaForm.css'

type MateriaExternaFormProps = {
  disabled?: boolean
  onAdd: (externa: AsignaturaExternaDto) => void
}

const MateriaExternaForm = ({ disabled = false, onAdd }: MateriaExternaFormProps) => {
  const [open, setOpen] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [nombre, setNombre] = useState('')
  const [creditos, setCreditos] = useState('')
  const [institucion, setInstitucion] = useState('')

  const creditosNumero = Number(creditos)
  const canSubmit = codigo.trim() !== '' && nombre.trim() !== '' && institucion.trim() !== '' && Number.isInteger(creditosNumero) && creditosNumero > 0

  const reset = () => {
    setCodigo('')
    setNombre('')
    setCreditos('')
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
        onAdd({ codigo: codigo.trim(), nombre: nombre.trim(), creditos: creditosNumero, institucion: institucion.trim() })
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
      <label>
        <span>Institución</span>
        <input value={institucion} disabled={disabled} required onChange={(event) => setInstitucion(event.target.value)} />
      </label>
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

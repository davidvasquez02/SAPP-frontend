import { useId } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import './FileSelectButton.css'

interface FileSelectButtonProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'children' | 'type'> {
  children: ReactNode
}

export const FileSelectButton = ({ children, id, disabled, ...inputProps }: FileSelectButtonProps) => {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <label className={`file-select-button${disabled ? ' file-select-button--disabled' : ''}`} htmlFor={inputId}>
      <input {...inputProps} id={inputId} type="file" disabled={disabled} />
      <span>{children}</span>
    </label>
  )
}

import type { MouseEventHandler, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import './BackButton.css'

type BackButtonProps = {
  children?: ReactNode
  className?: string
  disabled?: boolean
  onClick?: MouseEventHandler<HTMLButtonElement>
  state?: LinkProps['state']
  to?: LinkProps['to']
}

export const BackButton = ({
  children = 'Volver',
  className = '',
  disabled = false,
  onClick,
  state,
  to,
}: BackButtonProps) => {
  const classes = ['sapp-back-button', className].filter(Boolean).join(' ')
  const content = (
    <>
      <span className="sapp-back-button__icon" aria-hidden="true">←</span>
      <span>{children}</span>
    </>
  )

  if (to !== undefined) {
    return <Link className={classes} state={state} to={to}>{content}</Link>
  }

  return (
    <button className={classes} disabled={disabled} onClick={onClick} type="button">
      {content}
    </button>
  )
}

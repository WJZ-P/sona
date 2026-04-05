import type { ReactNode } from 'react'
import '@/styles/SonaButton.css'

export interface SonaButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary'
  onClick?: () => void
  disabled?: boolean
}

export function SonaButton({ children, variant = 'primary', onClick, disabled = false }: SonaButtonProps) {
  return (
    <button
      className={`sona-btn sona-btn--${variant}${disabled ? ' sona-btn--disabled' : ''}`}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      <span className="sona-btn-shine" />
      {children}
    </button>
  )
}

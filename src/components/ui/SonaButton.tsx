import type { CSSProperties, ReactNode } from 'react'
import '@/styles/SonaButton.css'

export interface SonaButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary'
  onClick?: () => void
  disabled?: boolean
  style?: CSSProperties
}

export function SonaButton({ children, variant = 'primary', onClick, disabled = false, style }: SonaButtonProps) {
  return (
    <button
      className={`sona-btn sona-btn--${variant}${disabled ? ' sona-btn--disabled' : ''}`}
      onClick={onClick}
      disabled={disabled}
      style={style}
      type="button"
    >
      <span className="sona-btn-shine" />
      {children}
    </button>
  )
}

import { useState, type ReactNode } from 'react'
import '@/styles/SonaInput.css'

export interface SonaInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  icon?: ReactNode
  type?: string
}

export function SonaInput({ value, onChange, placeholder, icon, type = 'text' }: SonaInputProps) {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <div className={`sona-input${isFocused ? ' sona-input--focused' : ''}`}>
      {icon && <span className="sona-input-icon">{icon}</span>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="sona-input-field"
      />
    </div>
  )
}

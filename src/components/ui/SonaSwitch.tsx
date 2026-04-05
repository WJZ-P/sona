import '@/styles/SonaSwitch.css'

export interface SonaSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export function SonaSwitch({ checked, onChange, disabled = false }: SonaSwitchProps) {
  return (
    <button
      className={`sona-switch${checked ? ' sona-switch--on' : ''}${disabled ? ' sona-switch--disabled' : ''}`}
      onClick={() => !disabled && onChange(!checked)}
      type="button"
      role="switch"
      aria-checked={checked}
    >
      <span className="sona-switch-thumb" />
    </button>
  )
}

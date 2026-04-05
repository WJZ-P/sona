import '@/styles/SonaCheckbox.css'

export interface SonaCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
}

export function SonaCheckbox({ checked, onChange, label, disabled = false }: SonaCheckboxProps) {
  return (
    <label className={`sona-checkbox${disabled ? ' sona-checkbox--disabled' : ''}`}>
      <span
        className={`sona-checkbox-box${checked ? ' sona-checkbox-box--checked' : ''}`}
        onClick={() => !disabled && onChange(!checked)}
      >
        <svg
          className={`sona-checkbox-icon${checked ? ' sona-checkbox-icon--visible' : ''}`}
          width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
      {label && <span className={`sona-checkbox-label${checked ? ' sona-checkbox-label--checked' : ''}`}>{label}</span>}
    </label>
  )
}

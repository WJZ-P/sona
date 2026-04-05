import { useState, useRef, useEffect } from 'react'
import '@/styles/SonaSelect.css'

export interface SonaSelectOption {
  value: string
  label: string
}

export interface SonaSelectProps {
  options: SonaSelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SonaSelect({ options, value, onChange, placeholder = '请选择...' }: SonaSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="sona-select" ref={dropdownRef}>
      <button
        className={`sona-select-trigger${isOpen ? ' sona-select-trigger--open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span className="sona-select-value">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg className={`sona-select-arrow${isOpen ? ' sona-select-arrow--open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="sona-select-dropdown">
          {options.map((option) => (
            <button
              key={option.value}
              className={`sona-select-option${value === option.value ? ' sona-select-option--active' : ''}`}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              type="button"
            >
              <span>{option.label}</span>
              {value === option.value && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

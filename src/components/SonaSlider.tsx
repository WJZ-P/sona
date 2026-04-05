import '@/styles/SonaSlider.css'

export interface SonaSliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
}

export function SonaSlider({ value, onChange, min = 0, max = 100 }: SonaSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className="sona-slider">
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="sona-slider-input"
      />
      <div className="sona-slider-track" />
      <div className="sona-slider-fill" style={{ width: `${percentage}%` }} />
      <div className="sona-slider-thumb" style={{ left: `calc(${percentage}% - 6px)` }} />
    </div>
  )
}

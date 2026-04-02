import { useState, useEffect } from 'react'
import '@/styles/App.css'
import { logger } from '.'
import { onPanelVisibilityChange, isPanelVisible, setPanelVisible } from '@/lib/inject'

export function App() {
  const [visible, setVisible] = useState(isPanelVisible())

  useEffect(() => {
    return onPanelVisibilityChange((v) => setVisible(v))
  }, [])

  if (!visible) return null

  return (
    <div className="sona-container">
      <div className="sona-panel">
        <div className="sona-header">
          <span className="sona-title">🎵 Sona</span>
          <button
            className="sona-close"
            onClick={() => {
              setPanelVisible(false)
              logger.info('Closed')
            }}
            title="Close"
          >
            ✕
          </button>
        </div>
        <div className="sona-content">
          <p className="sona-welcome">Welcome to Sona!</p>
          <p className="sona-desc">
            Your League of Legends client plugin is running.
          </p>
          <div className="sona-info">
            <InfoItem label="Plugin" value="Sona v0.1.0" />
            <InfoItem label="Framework" value="React + Vite" />
            <InfoItem label="Loader" value={`Pengu Loader ${typeof Pengu !== 'undefined' ? Pengu.version : 'N/A'}`} />
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="sona-info-item">
      <span className="sona-info-label">{label}</span>
      <span className="sona-info-value">{value}</span>
    </div>
  )
}

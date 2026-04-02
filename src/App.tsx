import { useState, useEffect } from 'react'
import '@/styles/App.css'
import { logger } from '.'
import { Modal } from '@/components/Modal'
import { onModalVisibilityChange, isModalVisible, closeModal } from '@/lib/inject'

export function App() {
  const [visible, setVisible] = useState(isModalVisible())

  useEffect(() => {
    return onModalVisibilityChange((v) => setVisible(v))
  }, [])

  const handleClose = () => {
    closeModal()
    logger.info('Modal closed')
  }

  return (
    <Modal
      open={visible}
      onClose={handleClose}
      title={<><span className="sona-modal-emoji">🎵</span> Sona</>}
      width={680}
      height={520}
    >
      <div className="sona-home">
        {/* Banner 区域 */}
        <div className="sona-home-banner">
          <div className="sona-home-banner-text">
            <h2 className="sona-home-heading">Welcome to Sona!</h2>
            <p className="sona-home-subtitle">
              Your League of Legends client enhancement plugin.
            </p>
          </div>
        </div>

        {/* 信息卡片 */}
        <div className="sona-home-content">
          <div className="sona-home-cards">
            <InfoCard
              icon="⚡"
              label="Plugin"
              value="Sona v0.1.0"
            />
            <InfoCard
              icon="⚛️"
              label="Framework"
              value="React + Vite"
            />
            <InfoCard
              icon="🐧"
              label="Loader"
              value={`Pengu Loader ${typeof Pengu !== 'undefined' ? Pengu.version : 'N/A'}`}
            />
          </div>

          <div className="sona-home-section">
            <h3 className="sona-home-section-title">About</h3>
            <p className="sona-home-section-text">
              Sona is a Pengu Loader plugin built with React and Vite. 
              It provides a modern, extensible framework for customizing 
              your League of Legends client experience.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function InfoCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="sona-info-card">
      <span className="sona-info-card-icon">{icon}</span>
      <div className="sona-info-card-text">
        <span className="sona-info-card-label">{label}</span>
        <span className="sona-info-card-value">{value}</span>
      </div>
    </div>
  )
}

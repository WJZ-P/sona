import { useState, useEffect } from 'react'
import '@/styles/App.css'
import { logger } from '.'
import { Modal } from '@/components/Modal'
import { HomePage } from '@/components/HomePage'
import { MusicIcon } from '@/components/icons'
import { onModalVisibilityChange, isModalVisible, closeModal } from '@/lib/inject'

export function App() {
  const [visible, setVisible] = useState(isModalVisible())

  useEffect(() => {
    return onModalVisibilityChange((v) => {
      const rootConnected = Boolean(document.getElementById('sona-root')?.isConnected)
      logger.debug('Modal visibility changed: %s (root in DOM: %s)', String(v), String(rootConnected))
      setVisible(v)
    })
  }, [])

  const handleClose = () => {
    closeModal()
    logger.info('Modal closed')
  }

  return (
    <Modal
      open={visible}
      onClose={handleClose}
      title={
        <span className="sona-modal-title-inner">
          <MusicIcon />
          Sona
        </span>
      }
      width={720}
      height={560}
    >
      <HomePage />
    </Modal>
  )
}

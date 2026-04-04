import { useState, useEffect } from 'react'
import '@/styles/App.css'
import { logger } from '.'
import { Modal } from '@/components/Modal'
import { Sidebar, type SidebarItem } from '@/components/Sidebar'
import { HomePage } from '@/components/HomePage'
import { SettingsPage } from '@/components/SettingsPage'
import { HomeIcon, GamepadIcon, SettingsIcon, InfoIcon } from '@/components/icons'
import { onModalVisibilityChange, isModalVisible, closeModal } from '@/lib/inject'

const sidebarItems: SidebarItem[] = [
  { id: 'home', icon: <HomeIcon />, label: '主页' },
  { id: 'tools', icon: <GamepadIcon />, label: '工具' },
  { id: 'settings', icon: <SettingsIcon />, label: '设置' },
  { id: 'about', icon: <InfoIcon />, label: '关于' },
]

function PageContent({ pageId }: { pageId: string }) {
  switch (pageId) {
    case 'home':
      return <HomePage />
    case 'tools':
      return <div className="sona-page-placeholder">工具页面（开发中）</div>
    case 'settings':
      return <SettingsPage />
    case 'about':
      return <div className="sona-page-placeholder">关于页面（开发中）</div>
    default:
      return <HomePage />
  }
}

export function App() {
  const [visible, setVisible] = useState(isModalVisible())
  const [activePageId, setActivePageId] = useState('home')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

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
      width={780}
      height={560}
    >
      <div className="sona-layout">
        <Sidebar
          items={sidebarItems}
          activeId={activePageId}
          onSelect={setActivePageId}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((v) => !v)}
        />
        <div className="sona-content">
          <PageContent pageId={activePageId} />
        </div>
      </div>
    </Modal>
  )
}

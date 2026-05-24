import { useState, useEffect, useMemo } from 'react'
import '@/styles/App.css'
import { logger } from '.'
import { Modal } from '@/components/ui/Modal'
import { Sidebar, type SidebarItem } from '@/components/ui/Sidebar'
import { HomePage } from '@/components/pages/HomePage'
import { ToolsPage } from '@/components/pages/ToolsPage'
import { BeautifyPage } from '@/components/pages/BeautifyPage'
import { SettingsPage } from '@/components/pages/SettingsPage'
import { AboutPage } from '@/components/pages/AboutPage'
import { DebugPage } from '@/components/pages/DebugPage'
import { UpdatePage } from '@/components/pages/UpdatePage'
import { HomeIcon, GamepadIcon, PaletteIcon, SettingsIcon, InfoIcon, BugIcon, ZapIcon } from '@/components/ui/icons'
import { onModalVisibilityChange, isModalVisible, closeModal } from '@/lib/modal'
import { store } from '@/lib/store'
import { getUpdateState, onUpdateStateChange, type UpdateState } from '@/lib/update-checker'
import { useI18n } from '@/i18n'
import type { TranslationKey } from '@/i18n'

const baseSidebarItemConfigs: Array<Omit<SidebarItem, 'label'> & { labelKey: TranslationKey }> = [
  { id: 'home', icon: <HomeIcon />, labelKey: 'nav.home' },
  { id: 'tools', icon: <GamepadIcon />, labelKey: 'nav.tools' },
  { id: 'beautify', icon: <PaletteIcon />, labelKey: 'nav.beautify' },
  { id: 'settings', icon: <SettingsIcon />, labelKey: 'nav.settings' },
  { id: 'about', icon: <InfoIcon />, labelKey: 'nav.about' },
]

const debugSidebarItemConfig: Omit<SidebarItem, 'label'> & { labelKey: TranslationKey } = {
  id: 'debug', icon: <BugIcon />, labelKey: 'nav.debug',
}

const updateSidebarItemConfig: Omit<SidebarItem, 'label'> & { labelKey: TranslationKey } = {
  id: 'update', icon: <ZapIcon />, labelKey: 'nav.updateAvailable',
}

function PageContent({ pageId }: { pageId: string }) {
  switch (pageId) {
    case 'update':
      return <UpdatePage />
    case 'home':
      return <HomePage />
    case 'tools':
      return <ToolsPage />
    case 'beautify':
      return <BeautifyPage />
    case 'settings':
      return <SettingsPage />
    case 'about':
      return <AboutPage />
    case 'debug':
      return <DebugPage />
    default:
      return <HomePage />
  }
}

export function App() {
  const { t } = useI18n()
  const [visible, setVisible] = useState(isModalVisible())
  const [activePageId, setActivePageId] = useState(() => (getUpdateState().status === 'available' ? 'update' : 'home'))
  const [sidebarCollapsed, setSidebarCollapsed] = useState(store.get('sidebarCollapsed'))
  const [devMode, setDevMode] = useState(store.get('developerMode'))
  const [updateState, setUpdateState] = useState<UpdateState>(() => getUpdateState())

  useEffect(() => {
    return onModalVisibilityChange((v) => {
      const rootConnected = Boolean(document.getElementById('sona-root')?.isConnected)
      logger.debug('Modal visibility changed: %s (root in DOM: %s)', String(v), String(rootConnected))
      setVisible(v)
      if (v && getUpdateState().status === 'available') {
        setActivePageId('update')
      }
    })
  }, [])

  // 监听开发者模式变化
  useEffect(() => {
    return store.onChange('developerMode', (v) => {
      setDevMode(v)
      // 如果关闭开发者模式时正在调试页，切回主页
      if (!v && activePageId === 'debug') {
        setActivePageId('home')
      }
    })
  }, [activePageId])

  useEffect(() => {
    return onUpdateStateChange((state) => {
      setUpdateState(state)
      if (state.status !== 'available' && activePageId === 'update') {
        setActivePageId('home')
      }
    })
  }, [activePageId])

  // 动态构建侧边栏项目
  const sidebarItems = useMemo(() => {
    const makeItem = (item: Omit<SidebarItem, 'label'> & { labelKey: TranslationKey }): SidebarItem => ({
      id: item.id,
      icon: item.icon,
      label: t(item.labelKey),
    })
    const baseItems = baseSidebarItemConfigs.map(makeItem)
    const items = updateState.status === 'available'
      ? [makeItem(updateSidebarItemConfig), ...baseItems]
      : baseItems
    return devMode ? [...items, makeItem(debugSidebarItemConfig)] : items
  }, [devMode, t, updateState.status])

  const handleClose = () => {
    closeModal()
    logger.info('Modal closed')
  }

  const handleToggleSidebar = () => {
    setSidebarCollapsed((v) => {
      const next = !v
      store.set('sidebarCollapsed', next)
      return next
    })
  }

  return (
    <Modal
      open={visible}
      onClose={handleClose}
      width={900}
      height={560}
    >
      <div className="sona-layout">
        <Sidebar
          items={sidebarItems}
          activeId={activePageId}
          onSelect={setActivePageId}
          collapsed={sidebarCollapsed}
          onToggle={handleToggleSidebar}
        />
        <div className="sona-content">
          <PageContent pageId={activePageId} />
        </div>
      </div>
    </Modal>
  )
}

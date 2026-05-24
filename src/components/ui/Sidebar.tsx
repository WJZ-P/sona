import { type ReactNode } from 'react'
import { MusicIcon, ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/icons'
import { useI18n } from '@/i18n'
import '@/styles/Sidebar.css'

declare const __PLUGIN_VERSION__: string

export interface SidebarItem {
  id: string
  icon: ReactNode
  label: string
}

export interface SidebarProps {
  items: SidebarItem[]
  activeId: string
  onSelect: (id: string) => void
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ items, activeId, onSelect, collapsed, onToggle }: SidebarProps) {
  const { t } = useI18n()

  return (
    <div className={`sona-sidebar${collapsed ? ' sona-sidebar--collapsed' : ''}`}>
      {/* Logo 区域 */}
      <div className="sona-sidebar-logo">
        <span className="sona-sidebar-logo-icon"><MusicIcon /></span>
        {!collapsed && (
          <span className="sona-sidebar-logo-title">
            <span className="sona-sidebar-logo-text">Sona</span>
            <span className="sona-sidebar-logo-version">v{__PLUGIN_VERSION__}</span>
          </span>
        )}
      </div>

      {/* 导航项 */}
      <nav className="sona-sidebar-nav">
        {items.map((item) => (
          <button
            key={item.id}
            className={`sona-sidebar-item${activeId === item.id ? ' sona-sidebar-item--active' : ''}`}
            onClick={() => onSelect(item.id)}
            title={collapsed ? item.label : undefined}
          >
            <span className="sona-sidebar-item-icon">{item.icon}</span>
            {!collapsed && <span className="sona-sidebar-item-label">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* 底部展开/收缩按钮 */}
      <div className="sona-sidebar-footer">
        <button className="sona-sidebar-toggle" onClick={onToggle} title={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}>
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </button>
      </div>
    </div>
  )
}

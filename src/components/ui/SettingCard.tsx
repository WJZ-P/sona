import type { ReactNode } from 'react'
import '@/styles/SettingCard.css'

export interface SettingCardProps {
  title: string
  description?: string
  children: ReactNode
  layout?: 'row' | 'stacked'
}

export function SettingCard({ title, description, children, layout = 'row' }: SettingCardProps) {
  return (
    <div className={`sona-setting-card${layout === 'stacked' ? ' sona-setting-card--stacked' : ''}`}>
      <div className="sona-setting-card-info">
        <h4 className="sona-setting-card-title">{title}</h4>
        {description && (
          <p className="sona-setting-card-desc">{description}</p>
        )}
      </div>
      <div className="sona-setting-card-action">
        {children}
      </div>
    </div>
  )
}

export interface SettingGroupProps {
  title: string
  children: ReactNode
}

export function SettingGroup({ title, children }: SettingGroupProps) {
  return (
    <div className="sona-setting-group">
      <h3 className="sona-setting-group-title">{title}</h3>
      <div className="sona-setting-group-list">
        {children}
      </div>
    </div>
  )
}

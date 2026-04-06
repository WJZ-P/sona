import { useState, useEffect } from 'react'
import { SettingCard, SettingGroup } from '@/components/ui/SettingCard'
import { SonaSwitch } from '@/components/ui/SonaSwitch'
import { store } from '@/lib/store'
import '@/styles/SettingsPage.css'

export function SettingsPage() {
  const [developerMode, setDeveloperMode] = useState(store.get('developerMode'))

  useEffect(() => {
    return store.onChange('developerMode', setDeveloperMode)
  }, [])

  return (
    <div className="sona-settings">
      <h2 className="sona-settings-title">设置</h2>

      <SettingGroup title="高级选项">
        <SettingCard
          title="开发者模式"
          description="启用调试面板，你最好知道你在做什么 ( ˘•ω•˘ )◞⚠"
        >
          <SonaSwitch
            checked={developerMode}
            onChange={(v) => { setDeveloperMode(v); store.set('developerMode', v) }}
          />
        </SettingCard>
      </SettingGroup>
    </div>
  )
}

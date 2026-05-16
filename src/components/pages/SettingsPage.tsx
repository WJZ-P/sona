import { useState, useEffect } from 'react'
import { SettingCard, SettingGroup } from '@/components/ui/SettingCard'
import { SonaSwitch } from '@/components/ui/SonaSwitch'
import { SonaSelect } from '@/components/ui/SonaSelect'
import { SonaButton } from '@/components/ui/SonaButton'
import { clearOpggCache } from '@/lib/opgg-api'
import { store } from '@/lib/store'
import '@/styles/SettingsPage.css'

const hotkeyOptions = [
  { value: 'F1', label: 'F1' },
  { value: 'F2', label: 'F2' },
  { value: 'F3', label: 'F3' },
  { value: 'F4', label: 'F4' },
  { value: 'F5', label: 'F5' },
]

export function SettingsPage() {
  const [developerMode, setDeveloperMode] = useState(store.get('developerMode'))
  const [hotkey, setHotkey] = useState(store.get('hotkey'))
  const [globalParticle, setGlobalParticle] = useState(store.get('globalParticle'))
  const [opggCacheStatus, setOpggCacheStatus] = useState('')

  useEffect(() => {
    const unsubs = [
      store.onChange('developerMode', setDeveloperMode),
      store.onChange('hotkey', setHotkey),
      store.onChange('globalParticle', setGlobalParticle),
    ]
    return () => unsubs.forEach((fn) => fn())
  }, [])

  return (
    <div className="sona-settings">
      <h2 className="sona-settings-title">设置</h2>

      <SettingGroup title="通用">
        <SettingCard
          title="面板快捷键"
          description="随时按下快捷键打开/关闭 Sona 面板。"
        >
          <SonaSelect
            options={hotkeyOptions}
            value={hotkey}
            onChange={(v) => { setHotkey(v); store.set('hotkey', v) }}
          />
        </SettingCard>
        <SettingCard
          title="全局粒子美化"
          description="为客户端添加星光粒子背景效果 ✨"
        >
          <SonaSwitch
            checked={globalParticle}
            onChange={(v) => { setGlobalParticle(v); store.set('globalParticle', v) }}
          />
        </SettingCard>
      </SettingGroup>


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
        <SettingCard
          title="清空 OP.GG 缓存"
          description="清除本地保存的 OP.GG 推荐出装、英雄 T 级和 Counter 数据；下次使用时会重新请求。"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SonaButton onClick={() => {
              const count = clearOpggCache()
              setOpggCacheStatus(count >= 0 ? `已清空 ${count} 条缓存` : '清空失败')
            }}>
              清空
            </SonaButton>
            {opggCacheStatus && <span className="sona-subtitle">{opggCacheStatus}</span>}
          </div>
        </SettingCard>
      </SettingGroup>
    </div>
  )
}

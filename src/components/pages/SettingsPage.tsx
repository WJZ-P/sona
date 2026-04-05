import { useState, useEffect } from 'react'
import { SettingCard, SettingGroup } from '@/components/ui/SettingCard'
import { SonaSwitch } from '@/components/ui/SonaSwitch'
import { store } from '@/lib/store'
import '@/styles/SettingsPage.css'

export function SettingsPage() {
  const [autoAccept, setAutoAccept] = useState(store.get('autoAcceptMatch'))
  const [unlockStatus, setUnlockStatus] = useState(store.get('unlockStatus'))
  const [developerMode, setDeveloperMode] = useState(store.get('developerMode'))

  // 同步外部变更（其他地方修改了 store）
  useEffect(() => {
    const unsubs = [
      store.onChange('autoAcceptMatch', setAutoAccept),
      store.onChange('unlockStatus', setUnlockStatus),
      store.onChange('developerMode', setDeveloperMode),
    ]
    return () => unsubs.forEach((fn) => fn())
  }, [])

  return (
    <div className="sona-settings">
      <h2 className="sona-settings-title">设置</h2>

      <SettingGroup title="客户端功能">
        <SettingCard
          title="自动接受对局"
          description="匹配到对局时自动点击接受，再也不会错过。"
        >
          <SonaSwitch
            checked={autoAccept}
            onChange={(v) => { setAutoAccept(v); store.set('autoAcceptMatch', v) }}
          />
        </SettingCard>

        <SettingCard
          title="解锁自定义签名"
          description="移除客户端对签名编辑的禁用限制，可自由修改个人签名。"
        >
          <SonaSwitch
            checked={unlockStatus}
            onChange={(v) => { setUnlockStatus(v); store.set('unlockStatus', v) }}
          />
        </SettingCard>
      </SettingGroup>

      <SettingGroup title="高级选项">
        <SettingCard
          title="开发者模式"
          description="启用调试面板和详细日志输出。你最好知道你在做什么 ( ˘•ω•˘ )◞⚠"
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

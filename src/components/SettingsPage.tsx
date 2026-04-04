import { useState } from 'react'
import { SettingCard, SettingGroup } from '@/components/SettingCard'
import { SonaSwitch } from '@/components/SonaSwitch'
import '@/styles/SettingsPage.css'

export function SettingsPage() {
  const [autoAccept, setAutoAccept] = useState(false)
  const [showAnimations, setShowAnimations] = useState(true)
  const [hideFriends, setHideFriends] = useState(false)
  const [developerMode, setDeveloperMode] = useState(false)
  const [muteClient, setMuteClient] = useState(false)

  return (
    <div className="sona-settings">
      <h2 className="sona-settings-title">设置</h2>

      <SettingGroup title="客户端功能">
        <SettingCard
          title="自动接受对局"
          description="匹配到对局时自动点击接受，再也不会错过。"
        >
          <SonaSwitch checked={autoAccept} onChange={setAutoAccept} />
        </SettingCard>

        <SettingCard
          title="大厅静音"
          description="Sona 激活时自动静音客户端音效和背景音乐。"
        >
          <SonaSwitch checked={muteClient} onChange={setMuteClient} />
        </SettingCard>
      </SettingGroup>

      <SettingGroup title="外观与视觉">
        <SettingCard
          title="启用魔法动效"
          description="显示 Sona 的星光粒子背景和海克斯悬停特效。"
        >
          <SonaSwitch checked={showAnimations} onChange={setShowAnimations} />
        </SettingCard>

        <SettingCard
          title="隐藏离线好友"
          description="在社交面板中隐藏当前不在线的好友。"
        >
          <SonaSwitch checked={hideFriends} onChange={setHideFriends} />
        </SettingCard>
      </SettingGroup>

      <SettingGroup title="高级选项">
        <SettingCard
          title="开发者模式"
          description="你最好知道你在做什么 ( ˘•ω•˘ )◞⚠"
        >
          <SonaSwitch checked={developerMode} onChange={setDeveloperMode} />
        </SettingCard>
      </SettingGroup>
    </div>
  )
}

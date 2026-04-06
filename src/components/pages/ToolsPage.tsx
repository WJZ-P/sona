import { useState, useEffect } from 'react'
import { SettingCard, SettingGroup } from '@/components/ui/SettingCard'
import { SonaButton } from '@/components/ui/SonaButton'
import { SonaSwitch } from '@/components/ui/SonaSwitch'
import { logger } from '@/index'
import { lcu } from '@/lib/lcu'
import { store } from '@/lib/store'
import '@/styles/SettingsPage.css'

/** 执行操作并只打印到控制台 */
async function run(label: string, fn: () => Promise<unknown>) {
  try {
    const result = await fn()
    logger.info('%s → %o', label, result)
  } catch (err) {
    logger.error('%s → %o', label, err)
  }
}

export function ToolsPage() {
  const [autoAccept, setAutoAccept] = useState(store.get('autoAcceptMatch'))
  const [unlockStatus, setUnlockStatus] = useState(store.get('unlockStatus'))
  const [benchNoCooldown, setBenchNoCooldown] = useState(store.get('benchNoCooldown'))

  useEffect(() => {
    const unsubs = [
      store.onChange('autoAcceptMatch', setAutoAccept),
      store.onChange('unlockStatus', setUnlockStatus),
      store.onChange('benchNoCooldown', setBenchNoCooldown),
    ]
    return () => unsubs.forEach((fn) => fn())
  }, [])

  return (
    <div className="sona-settings">
      <h2 className="sona-settings-title">工具</h2>

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
        <SettingCard
          title="大乱斗无CD换英雄"
          description="移除共享池英雄的切换冷却限制，随时换取心仪英雄。"
        >
          <SonaSwitch
            checked={benchNoCooldown}
            onChange={(v) => { setBenchNoCooldown(v); store.set('benchNoCooldown', v) }}
          />
        </SettingCard>
      </SettingGroup>

      <SettingGroup title="对局">
        <div className="sona-debug-actions">
          <SonaButton onClick={() => run('开始匹配', () => lcu.startMatchmaking())}>
            开始匹配
          </SonaButton>
          <SonaButton onClick={() => run('停止匹配', () => lcu.stopMatchmaking())}>
            停止匹配
          </SonaButton>
          <SonaButton onClick={() => run('接受对局', () => lcu.acceptMatch())}>
            接受对局
          </SonaButton>
          <SonaButton onClick={() => run('拒绝对局', () => lcu.declineMatch())}>
            拒绝对局
          </SonaButton>
        </div>
      </SettingGroup>

      <SettingGroup title="房间">
        <div className="sona-debug-actions">
          <SonaButton onClick={() => run('创建大乱斗', () => lcu.createLobby(450))}>
            创建大乱斗
          </SonaButton>
          <SonaButton onClick={() => run('创建单双排', () => lcu.createLobby(420))}>
            创建单双排
          </SonaButton>
          <SonaButton variant="secondary" onClick={() => run('退出房间', () => lcu.leaveLobby())}>
            退出房间
          </SonaButton>
        </div>
      </SettingGroup>
    </div>
  )
}

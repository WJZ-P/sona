import { useState, useEffect } from 'react'
import { SettingCard, SettingGroup } from '@/components/ui/SettingCard'
import { SonaButton } from '@/components/ui/SonaButton'
import { SonaSwitch } from '@/components/ui/SonaSwitch'
import { SonaSelect } from '@/components/ui/SonaSelect'
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

const effectOptions = [
  { value: 'none', label: '无（默认）' },
  { value: 'blurbehind', label: '毛玻璃' },
  { value: 'acrylic', label: '亚克力' },
  { value: 'unified', label: '混合' },
  { value: 'mica', label: '云母 (Win11)' },
  { value: 'transparent', label: '透明' },
]

export function ToolsPage() {
  const [autoAccept, setAutoAccept] = useState(store.get('autoAcceptMatch'))
  const [unlockStatus, setUnlockStatus] = useState(store.get('unlockStatus'))
  const [benchNoCooldown, setBenchNoCooldown] = useState(store.get('benchNoCooldown'))
  const [windowEffect, setWindowEffect] = useState(store.get('windowEffect'))
  const [champSelectAssist, setChampSelectAssist] = useState(store.get('champSelectAssist'))
  const [analyzeTeamPower, setAnalyzeTeamPower] = useState(store.get('analyzeTeamPower'))
  const [friendSmartGroup, setFriendSmartGroup] = useState(store.get('friendSmartGroup'))

  useEffect(() => {
    const unsubs = [
      store.onChange('autoAcceptMatch', setAutoAccept),
      store.onChange('unlockStatus', setUnlockStatus),
      store.onChange('benchNoCooldown', setBenchNoCooldown),
      store.onChange('windowEffect', setWindowEffect),
      store.onChange('champSelectAssist', setChampSelectAssist),
      store.onChange('analyzeTeamPower', setAnalyzeTeamPower),
      store.onChange('friendSmartGroup', setFriendSmartGroup),
    ]
    return () => unsubs.forEach((fn) => fn())
  }, [])


  const handleEffectChange = (value: string) => {
    setWindowEffect(value)
    store.set('windowEffect', value)
    if (value === 'none') {
      Effect.clear()
      logger.info('Window effect cleared')
    } else {
      Effect.apply(value as 'acrylic', { color: '#0006' })
      logger.info('Window effect applied: %s', value)
    }
  }

  return (
    <div className="sona-settings">
      <h2 className="sona-settings-title">工具</h2>

      <SettingGroup title="客户端功能">
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

      <SettingGroup title="对局相关">
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
          title="大乱斗无CD换英雄"
          description="移除共享池英雄的切换冷却限制，随时换取心仪英雄。"
        >
          <SonaSwitch
            checked={benchNoCooldown}
            onChange={(v) => { setBenchNoCooldown(v); store.set('benchNoCooldown', v) }}
          />
        </SettingCard>
        <SettingCard
          title="分析友方战力"
          description="进入英雄选择时，自动分析队友近期战绩并发送到队伍聊天框。"
        >
          <SonaSwitch
            checked={analyzeTeamPower}
            onChange={(v) => { setAnalyzeTeamPower(v); store.set('analyzeTeamPower', v) }}
          />
        </SettingCard>
        <SettingCard
          title="英雄选择阶段增强"
          description="英雄选择时显示粒子特效，底部自动显示近20场胜率和KDA，点击队友头像可查询近期战绩。"
        >
          <SonaSwitch
            checked={champSelectAssist}
            onChange={(v) => { setChampSelectAssist(v); store.set('champSelectAssist', v) }}
          />
        </SettingCard>
      </SettingGroup>

      <SettingGroup title="社交">
        <SettingCard
          title="开黑好友标记"
          description="开黑中的好友用同样颜色标记，看看谁在偷偷开黑！"
        >
          <SonaSwitch
            checked={friendSmartGroup}
            onChange={(v) => { setFriendSmartGroup(v); store.set('friendSmartGroup', v) }}
          />
        </SettingCard>
      </SettingGroup>


      <SettingGroup title="界面">
        <SettingCard
          title="窗口特效"
          description="为客户端窗口添加毛玻璃等视觉效果。Win10 拖动窗口时可能卡顿。但实际测试下来好像没啥效果？"
        >
          <div style={{ minWidth: 130 }}>
            <SonaSelect
              options={effectOptions}
              value={windowEffect}
              onChange={handleEffectChange}
            />
          </div>
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

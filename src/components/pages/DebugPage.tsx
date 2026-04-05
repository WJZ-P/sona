import { useState } from 'react'
import { SettingCard, SettingGroup } from '@/components/ui/SettingCard'
import { SonaButton } from '@/components/ui/SonaButton'
import { store } from '@/lib/store'
import { lcu } from '@/lib/lcu'
import { logger } from '@/index'
import '@/styles/SettingsPage.css'

export function DebugPage() {
  const [output, setOutput] = useState('')

  const runAndLog = async (label: string, fn: () => Promise<unknown>) => {
    setOutput(`⏳ ${label}...`)
    try {
      const result = await fn()
      logger.info('%s ↓ \n%o', label, result)
      const text = JSON.stringify(result, null, 2)
      setOutput(`✅ ${label}\n${text}`)
    } catch (err) {
      setOutput(`❌ ${label}\n${String(err)}`)
    }
  }

  return (
    <div className="sona-settings">
      <h2 className="sona-settings-title">调试面板</h2>

      <SettingGroup title="LCU API 测试">
        <div className="sona-debug-actions">
          <SonaButton onClick={() => runAndLog('获取召唤师信息', () => lcu.getSummonerInfo())}>
            获取召唤师信息
          </SonaButton>
          <SonaButton onClick={() => runAndLog('获取在线状态', () => lcu.getChatMe())}>
            获取在线状态
          </SonaButton>
          <SonaButton onClick={() => runAndLog('获取游戏流程', () => lcu.getGameflowPhase())}>
            游戏流程阶段
          </SonaButton>
          <SonaButton onClick={() => runAndLog('获取聊天会话', () => lcu.getChatConversations())}>
            聊天会话列表
          </SonaButton>
        </div>
      </SettingGroup>

      <SettingGroup title="客户端操作">
        <div className="sona-debug-actions">
          <SonaButton onClick={() => window.openDevTools()}>
            打开 DevTools
          </SonaButton>
          <SonaButton onClick={() => window.openPluginsFolder()}>
            打开插件目录
          </SonaButton>
          <SonaButton variant="secondary" onClick={() => window.reloadClient()}>
            重载客户端
          </SonaButton>
        </div>
      </SettingGroup>

      <SettingGroup title="Store 调试">
        <SettingCard title="当前配置快照" description="查看所有持久化配置的当前值">
          <SonaButton onClick={() => setOutput(JSON.stringify(store.getAll(), null, 2))}>
            查看
          </SonaButton>
        </SettingCard>
        <SettingCard title="重置所有配置" description="将所有配置恢复为默认值">
          <SonaButton variant="secondary" onClick={() => { store.resetAll(); setOutput('✅ 已重置所有配置') }}>
            重置
          </SonaButton>
        </SettingCard>
      </SettingGroup>

      {/* 输出区 */}
      {output && (
        <div className="sona-debug-output">
          <pre>{output}</pre>
        </div>
      )}
    </div>
  )
}

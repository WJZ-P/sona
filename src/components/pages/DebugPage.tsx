import { useState } from 'react'
import { SettingCard, SettingGroup } from '@/components/ui/SettingCard'
import { SonaButton } from '@/components/ui/SonaButton'
import { SonaInput } from '@/components/ui/SonaInput'
import { store } from '@/lib/store'
import { lcu } from '@/lib/lcu'
import { logger } from '@/index'
import '@/styles/SettingsPage.css'

export function DebugPage() {
  const [output, setOutput] = useState('')
  const [gameId, setGameId] = useState('')
  const [puuid, setPuuid] = useState('')
  const [chatMsg, setChatMsg] = useState('')
  const [riotId, setRiotId] = useState('')


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

      <SettingGroup title="英雄选择 (ARAM)">
        <div className="sona-debug-actions">
          <SonaButton onClick={() => runAndLog('ARAM 重随', () => lcu.reroll())}>
            重随英雄
          </SonaButton>
          <SonaButton onClick={() => runAndLog('英雄选择会话', () => lcu.getChampSelectSession())}>
            选人 Session
          </SonaButton>
          <SonaButton onClick={() => runAndLog('共享池英雄', () => lcu.getBenchChampions())}>
            Bench 英雄
          </SonaButton>
          <SonaButton onClick={() => runAndLog('可选英雄列表', () => lcu.getPickableChampionIds())}>
            可选英雄
          </SonaButton>
        </div>
        <p className="sona-subtitle">点击选取共享池对应槽位的英雄</p>
        <div className="sona-debug-actions">
          {Array.from({ length: 10 }, (_, i) => (
            <SonaButton key={i} style={{ minWidth: 40, padding: '6px 0' }} onClick={() => runAndLog(`Bench 换英雄 (槽位 ${i + 1})`, async () => {
              const bench = await lcu.getBenchChampions()
              if (i >= bench.length) throw new Error(`槽位 ${i + 1} 不存在，当前 Bench 共 ${bench.length} 个英雄`)
              const target = bench[i]
              logger.info('尝试换取槽位 %d 的英雄 → championId: %d', i + 1, target.championId)
              return lcu.benchSwap(target.championId)
            })}>
              {i + 1}
            </SonaButton>
          ))}
        </div>
      </SettingGroup>

      <SettingGroup title="信息查询">
        <div className="sona-debug-actions" style={{ alignItems: 'flex-end', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <SonaInput
              value={riotId}
              onChange={setRiotId}
              placeholder="名字#Tag (例: 疾风剑豪#77772)"
            />
          </div>
          <SonaButton onClick={() => {
            const parts = riotId.trim().split('#')
            if (parts.length !== 2 || !parts[0] || !parts[1]) { setOutput('❌ 格式: 名字#Tag'); return }
            runAndLog(`查询召唤师 ${riotId}`, () => lcu.getSummonerByRiotId(parts[0], parts[1]))
          }}>
            查询 PUUID
          </SonaButton>
        </div>
      </SettingGroup>

      <SettingGroup title="战绩查询">
        <div className="sona-debug-actions">
          <SonaButton onClick={() => runAndLog('获取战绩列表', () => lcu.getMatchHistory())}>
            我的战绩
          </SonaButton>
          <SonaButton onClick={() => runAndLog('最近一起玩的人', () => lcu.getRecentlyPlayedSummoners())}>
            最近队友
          </SonaButton>
        </div>
        <div className="sona-debug-actions" style={{ marginTop: 8, alignItems: 'flex-end', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <SonaInput
              value={puuid}
              onChange={setPuuid}
              placeholder="输入 PUUID 查他人战绩..."
            />
          </div>
          <SonaButton onClick={() => {
            if (!puuid.trim()) { setOutput('❌ 请输入 PUUID'); return }
            runAndLog(`战绩 (${puuid.slice(0, 8)}...)`, () => lcu.getMatchHistory(puuid.trim()))
          }}>
            查询战绩
          </SonaButton>
        </div>
        <div className="sona-debug-actions" style={{ marginTop: 8, alignItems: 'flex-end', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <SonaInput
              value={gameId}
              onChange={setGameId}
              placeholder="输入 Game ID..."
            />
          </div>
          <SonaButton onClick={() => {
            const id = Number(gameId)
            if (!id) { setOutput('❌ 请输入有效的 Game ID'); return }
            runAndLog(`对局详情 #${id}`, () => lcu.getMatchDetail(id))
          }}>
            对局详情
          </SonaButton>
          <SonaButton onClick={() => {
            const id = Number(gameId)
            if (!id) { setOutput('❌ 请输入有效的 Game ID'); return }
            runAndLog(`时间线 #${id}`, () => lcu.getMatchTimeline(id))
          }}>
            时间线
          </SonaButton>
        </div>
      </SettingGroup>

      <SettingGroup title="聊天调试">
        <div className="sona-debug-actions" style={{ gap: 8 }}>
          <div style={{ flex: 1 }}>
            <SonaInput
              value={chatMsg}
              onChange={setChatMsg}
              placeholder="输入要发送到选人聊天的消息..."
            />
          </div>
          <SonaButton onClick={() => {
            if (!chatMsg.trim()) { setOutput('❌ 请输入消息'); return }
            runAndLog(`发送聊天 (${chatMsg.length}字)`, () => lcu.sendChampSelectMessage(chatMsg))
          }}>
            发送
          </SonaButton>
        </div>
        <p className="sona-subtitle">字数: {chatMsg.length}</p>
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

      <SettingGroup title="游戏资源">
        <div className="sona-debug-actions">
          <SonaButton onClick={() => runAndLog('物品列表 (items.json)', () => lcu.getItems())}>
            物品图标
          </SonaButton>
          <SonaButton onClick={() => runAndLog('召唤师技能 (summoner-spells.json)', () => lcu.getSummonerSpells())}>
            技能图标
          </SonaButton>
          <SonaButton onClick={() => runAndLog('英雄摘要 (champion-summary.json)', () => lcu.getChampionSummary())}>
            英雄图标
          </SonaButton>
        </div>
        <div className="sona-debug-actions" style={{ marginTop: 8 }}>
          <SonaButton onClick={() => runAndLog('符文列表 (perks.json)', () => lcu.getPerks())}>
            符文列表
          </SonaButton>
          <SonaButton onClick={() => runAndLog('符文系 (perkstyles.json)', () => lcu.getPerkStyles())}>
            符文系
          </SonaButton>
          <SonaButton onClick={() => runAndLog('好友列表 (friends)', () => lcu.getFriends())}>
            好友列表
          </SonaButton>
        </div>
        <div className="sona-debug-actions" style={{ marginTop: 8 }}>
          <SonaButton onClick={() => runAndLog('队列列表 (queues)', () => lcu.getQueues())}>
            队列列表
          </SonaButton>
          <SonaButton onClick={() => runAndLog('游戏模式 (game-type-config)', () => lcu.getGameModes())}>
            游戏模式
          </SonaButton>
          <SonaButton onClick={() => runAndLog('地图信息 (maps)', () => lcu.getMaps())}>
            地图信息
          </SonaButton>
          <SonaButton onClick={() => runAndLog('地图资源 (maps.json)', () => lcu.getMapAssets())}>
            地图资源
          </SonaButton>
        </div>
      </SettingGroup>

      <SettingGroup title="房间 & 组队">
        <div className="sona-debug-actions">
          <SonaButton onClick={() => runAndLog('房间信息 (lobby)', async () => {
            const res = await fetch('/lol-lobby/v2/lobby'); return res.json()
          })}>
            房间信息
          </SonaButton>
          <SonaButton onClick={() => runAndLog('房间成员 (members)', async () => {
            const res = await fetch('/lol-lobby/v2/lobby/members'); return res.json()
          })}>
            成员列表
          </SonaButton>
          <SonaButton onClick={() => runAndLog('邀请列表 (invitations)', async () => {
            const res = await fetch('/lol-lobby/v2/lobby/invitations'); return res.json()
          })}>
            邀请列表
          </SonaButton>
        </div>
      </SettingGroup>

      <SettingGroup title="头像框 & Regalia">
        <div className="sona-debug-actions">
          <SonaButton onClick={() => runAndLog('Regalia v2', async () => {
            const res = await fetch('/lol-regalia/v2/current-summoner/regalia'); return res.json()
          })}>
            查看 Regalia
          </SonaButton>
          <SonaButton variant="secondary" onClick={() => runAndLog('去掉头像框 (crest=0)', async () => {
            const res = await fetch('/lol-regalia/v2/current-summoner/regalia', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ preferredCrestType: 'prestige', preferredBannerType: 'blank', selectedPrestigeCrest: 0 }),
            }); return res.json()
          })}>
            去掉头像框
          </SonaButton>
        </div>
      </SettingGroup>

      <SettingGroup title="区域 & 炫彩">
        <div className="sona-debug-actions">
          <SonaButton onClick={() => runAndLog('区域语言', async () => {
            const res = await fetch('/riotclient/region-locale'); return res.json()
          })}>
            区域语言
          </SonaButton>
          <SonaButton onClick={() => runAndLog('炫彩目录', async () => {
            const res = await fetch('/lol-store/v1/catalog?inventoryType=CHROMA'); return res.json()
          })}>
            炫彩目录
          </SonaButton>
          <SonaButton onClick={() => runAndLog('功能开关', async () => {
            const res = await fetch('/lol-platform-config/v3/namespaces/FeatureToggles'); return res.json()
          })}>
            功能开关
          </SonaButton>
        </div>
        <div className="sona-debug-actions" style={{ marginTop: 8 }}>
          <SonaButton onClick={() => runAndLog('配置命名空间', async () => {
            const res = await fetch('/lol-platform-config/v3/namespaces'); return res.json()
          })}>
            配置命名空间
          </SonaButton>
          <SonaButton onClick={() => runAndLog('Chromas 配置', async () => {
            const res = await fetch('/lol-platform-config/v3/namespaces/Chromas'); return res.json()
          })}>
            Chromas 配置
          </SonaButton>
          <SonaButton onClick={() => runAndLog('商店配置', async () => {
            const res = await fetch('/lol-platform-config/v3/namespaces/LcuStore'); return res.json()
          })}>
            商店配置
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

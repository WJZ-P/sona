import { useState, useEffect } from 'react'
import { SettingCard, SettingGroup } from '@/components/ui/SettingCard'
import { SonaButton } from '@/components/ui/SonaButton'
import { SonaInput } from '@/components/ui/SonaInput'
import { SonaSwitch } from '@/components/ui/SonaSwitch'
import { SonaSelect } from '@/components/ui/SonaSelect'
import { logger } from '@/index'
import { store } from '@/lib/store'
import '@/styles/SettingsPage.css'

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
  const [customProfileBg, setCustomProfileBg] = useState(store.get('customProfileBg'))
  const [rankQueue, setRankQueue] = useState(store.get('rankQueue'))
  const [rankTier, setRankTier] = useState(store.get('rankTier'))
  const [rankDivision, setRankDivision] = useState(store.get('rankDivision'))
  const [autoHonor, setAutoHonor] = useState(store.get('autoHonor'))
  const [replayGameId, setReplayGameId] = useState('')
  const [replayState, setReplayState] = useState<'idle' | 'downloading' | 'ready' | 'launching' | 'error'>('idle')

  useEffect(() => {
    const unsubs = [
      store.onChange('autoAcceptMatch', setAutoAccept),
      store.onChange('unlockStatus', setUnlockStatus),
      store.onChange('benchNoCooldown', setBenchNoCooldown),
      store.onChange('windowEffect', setWindowEffect),
      store.onChange('champSelectAssist', setChampSelectAssist),
      store.onChange('analyzeTeamPower', setAnalyzeTeamPower),
      store.onChange('friendSmartGroup', setFriendSmartGroup),
      store.onChange('customProfileBg', setCustomProfileBg),
      store.onChange('autoHonor', setAutoHonor),
      store.onChange('rankQueue', setRankQueue),
      store.onChange('rankTier', setRankTier),
      store.onChange('rankDivision', setRankDivision),
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

      <SettingGroup title="社交">
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
          title="卸下头像边框"
          description="移除头像框装饰，恢复干净的头像展示。"
        >
          <SonaButton onClick={async () => {
            try {
              await fetch('/lol-regalia/v2/current-summoner/regalia', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ preferredCrestType: 'prestige', preferredBannerType: 'blank', selectedPrestigeCrest: 0 }),
              })
              logger.info('头像边框已卸下 ✓')
            } catch (err) {
              logger.error('卸下头像边框失败:', err)
            }
          }}>
            卸下
          </SonaButton>
        </SettingCard>
        <SettingCard
          title="自定义生涯背景"
          description="增强生涯背景弹窗，可以选择任意皮肤作为生涯背景。"
        >
          <SonaSwitch
            checked={customProfileBg}
            onChange={(v) => { setCustomProfileBg(v); store.set('customProfileBg', v) }}
          />
        </SettingCard>
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

      <SettingGroup title="段位伪装">
        <p className="sona-subtitle" style={{ marginBottom: 10 }}>伪装好友列表中显示的段位信息，仅影响聊天名片展示，不影响生涯页面。</p>
        <div className="sona-debug-actions" style={{ alignItems: 'center' }}>
          <div style={{ minWidth: 140 }}>
            <SonaSelect
              options={[
                { value: 'RANKED_SOLO_5x5', label: '单排/双排' },
                { value: 'RANKED_FLEX_SR', label: '灵活组排' },
                { value: 'RANKED_TFT', label: '云顶之弈' },
                { value: 'RANKED_TFT_DOUBLE_UP', label: '云顶双人' },
                { value: 'RANKED_TFT_TURBO', label: '云顶激斗' },
              ]}
              value={rankQueue}
              onChange={setRankQueue}
            />
          </div>
          <div style={{ minWidth: 130 }}>
            <SonaSelect
              options={[
                { value: 'CHALLENGER', label: '最强王者' },
                { value: 'GRANDMASTER', label: '傲世宗师' },
                { value: 'MASTER', label: '超凡大师' },
                { value: 'DIAMOND', label: '璀璨钻石' },
                { value: 'EMERALD', label: '流光翡翠' },
                { value: 'PLATINUM', label: '华贵铂金' },
                { value: 'GOLD', label: '荣耀黄金' },
                { value: 'SILVER', label: '不屈白银' },
                { value: 'BRONZE', label: '英勇青铜' },
                { value: 'IRON', label: '坚韧黑铁' },
              ]}
              value={rankTier}
              onChange={setRankTier}
            />
          </div>
          <div style={{ minWidth: 80 }}>
            <SonaSelect
              options={[
                { value: 'I', label: 'I' },
                { value: 'II', label: 'II' },
                { value: 'III', label: 'III' },
                { value: 'IV', label: 'IV' },
              ]}
              value={rankDivision}
              onChange={setRankDivision}
            />
          </div>
          <SonaButton onClick={() => {
            store.set('rankQueue', rankQueue)
            store.set('rankTier', rankTier)
            store.set('rankDivision', rankDivision)
            store.set('rankDisguise', true)
          }}>
            应用
          </SonaButton>
          <SonaButton onClick={() => {
            store.set('rankDisguise', false)
          }}>
            恢复
          </SonaButton>
        </div>
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
        <SettingCard
          title="对局结束自动点赞"
          description="对局结束后，随机给队友点赞，再也不用手点啦。"
        >
          <SonaSwitch
            checked={autoHonor}
            onChange={(v) => { setAutoHonor(v); store.set('autoHonor', v) }}
          />
        </SettingCard>
      </SettingGroup>

      <SettingGroup title="回放">
        <p className="sona-subtitle" style={{ marginBottom: 10 }}>输入 Game ID 下载并观看对局回放。可从战绩面板复制 Game ID。</p>
        <div className="sona-debug-actions" style={{ alignItems: 'flex-end', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <SonaInput
              value={replayGameId}
              onChange={(v) => { setReplayGameId(v); setReplayState('idle') }}
              placeholder="输入 Game ID..."
            />
          </div>
          <SonaButton
            onClick={async () => {
              const id = Number(replayGameId)
              if (!id) return

              setReplayState('downloading')
              try {
                // 1. 查元数据
                const metaRes = await fetch(`/lol-replays/v1/metadata/${id}`)
                if (!metaRes.ok) {
                  logger.error('[Replay] 获取元数据失败:', metaRes.status)
                  setReplayState('error')
                  return
                }
                const meta = await metaRes.json() as { state: string; downloadProgress: number; gameId: number }

                // 2. 已就绪 → 直接观看
                if (meta.state === 'watch') {
                  setReplayState('launching')
                  const res = await fetch(`/lol-replays/v1/rofls/${id}/watch`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ componentType: 'replay', contextData: 'match-history' }),
                  })
                  setReplayState(res.ok ? 'ready' : 'error')
                  if (res.ok) logger.info('[Replay] 开始播放 #%d ✓', id)
                  else logger.error('[Replay] 播放失败:', await res.text())
                  return
                }

                // 3. 未下载 → 触发下载
                if (meta.state !== 'downloading') {
                  await fetch(`/lol-replays/v1/rofls/${id}/download`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ componentType: 'replay', contextData: 'match-history' }),
                  })
                }

                // 4. 轮询 metadata 等待下载完成
                for (let i = 0; i < 30; i++) {
                  await new Promise((r) => setTimeout(r, 2000))
                  const checkRes = await fetch(`/lol-replays/v1/metadata/${id}`)
                  if (!checkRes.ok) continue
                  const checkMeta = await checkRes.json() as { state: string; downloadProgress: number }
                  logger.info('[Replay] 下载中... %d%%', checkMeta.downloadProgress)

                  if (checkMeta.state === 'watch') {
                    setReplayState('launching')
                    const res = await fetch(`/lol-replays/v1/rofls/${id}/watch`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ componentType: 'replay', contextData: 'match-history' }),
                    })
                    setReplayState(res.ok ? 'ready' : 'error')
                    if (res.ok) logger.info('[Replay] 下载完成，开始播放 #%d ✓', id)
                    else logger.error('[Replay] 播放失败:', await res.text())
                    return
                  }
                }
                logger.warn('[Replay] 等待超时')
                setReplayState('error')
              } catch (err) {
                logger.error('[Replay] 异常:', err)
                setReplayState('error')
              }
            }}
          >
            {{ idle: '▶ 观看回放', downloading: '⏳ 下载中...', ready: '✓ 已启动', launching: '🚀 启动中...', error: '✗ 重试' }[replayState]}
          </SonaButton>
        </div>
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
    </div>
  )
}

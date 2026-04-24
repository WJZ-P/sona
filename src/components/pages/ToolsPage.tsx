import { useState, useEffect, useRef } from 'react'
import { SettingCard, SettingGroup } from '@/components/ui/SettingCard'
import { SonaButton } from '@/components/ui/SonaButton'
import { SonaInput } from '@/components/ui/SonaInput'
import { SonaSwitch } from '@/components/ui/SonaSwitch'
import { SonaSelect } from '@/components/ui/SonaSelect'
import { MatchHistoryModal } from '@/components/ui/MatchHistoryModal'
import { searchChampions, getChampionById, type ChampionInfo } from '@/lib/assets'
import { lcu } from '@/lib/lcu'
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

function BackupManager() {
  const [backupName, setBackupName] = useState('')
  const [backups, setBackups] = useState<{ name: string; timestamp: number }[]>([])
  const [status, setStatus] = useState('')

  const refreshList = async () => {
    const list = await lcu.listBackups()
    setBackups(list)
  }

  useEffect(() => { refreshList() }, [])

  const handleBackup = async () => {
    const name = backupName.trim()
    if (!name) { setStatus('❌ 请输入备份名称'); return }
    setStatus('⏳ 备份中...')
    const ok = await lcu.backupSettings(name)
    setStatus(ok ? '✅ 备份成功' : '❌ 备份失败')
    if (ok) { setBackupName(''); refreshList() }
  }

  const handleRestore = async (name: string) => {
    setStatus(`⏳ 恢复 "${name}" 中...`)
    const ok = await lcu.restoreSettings(name)
    setStatus(ok ? `✅ "${name}" 已恢复` : '❌ 恢复失败')
  }

  const handleDelete = async (name: string) => {
    const ok = await lcu.deleteBackup(name)
    if (ok) {
      setStatus(`已删除 "${name}"`)
      refreshList()
    }
  }

  const formatTime = (ts: number) => {
    if (!ts) return ''
    const d = new Date(ts)
    return d.toLocaleString(undefined, { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
  }

  return (
    <>
      <div className="sona-debug-actions" style={{ alignItems: 'flex-end', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <SonaInput
            value={backupName}
            onChange={(v) => { setBackupName(v); setStatus('') }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleBackup() }}
            placeholder="输入备份名称 (如: 排位设置)"
          />
        </div>
        <SonaButton variant="primary" onClick={handleBackup}>
          保存备份
        </SonaButton>
      </div>
      {status && <p className="sona-subtitle" style={{ marginTop: 6 }}>{status}</p>}
      {backups.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {backups.map((b) => (
            <div key={b.name} className="sona-backup-item">
              <div className="sona-backup-info">
                <span className="sona-backup-name">{b.name}</span>
                <span className="sona-backup-time">{formatTime(b.timestamp)}</span>
              </div>
              <div className="sona-backup-actions">
                <SonaButton onClick={() => handleRestore(b.name)}>恢复</SonaButton>
                <SonaButton onClick={() => handleDelete(b.name)}>删除</SonaButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export function ToolsPage() {
  const [autoAccept, setAutoAccept] = useState(store.get('autoAcceptMatch'))
  // 延迟值在 UI 里用字符串存，避免"删到空 → 变 NaN"、"输到一半"等中间态被推回 store
  const [autoAcceptDelayMin, setAutoAcceptDelayMin] = useState(String(store.get('autoAcceptDelayMin')))
  const [autoAcceptDelayMax, setAutoAcceptDelayMax] = useState(String(store.get('autoAcceptDelayMax')))
  const [unlockStatus, setUnlockStatus] = useState(store.get('unlockStatus'))
  const [unlockAvailability, setUnlockAvailability] = useState(store.get('unlockAvailability'))
  const [unlockChromas, setUnlockChromas] = useState(store.get('unlockChromas'))
  const [benchNoCooldown, setBenchNoCooldown] = useState(store.get('benchNoCooldown'))
  const [windowEffect, setWindowEffect] = useState(store.get('windowEffect'))
  const [champSelectAssist, setChampSelectAssist] = useState(store.get('champSelectAssist'))
  const [balanceBuffTooltip, setBalanceBuffTooltip] = useState(store.get('balanceBuffTooltip'))
  const [champSelectQuitButton, setChampSelectQuitButton] = useState(store.get('champSelectQuitButton'))
  const [analyzeTeamPower, setAnalyzeTeamPower] = useState(store.get('analyzeTeamPower'))
  const [friendSmartGroup, setFriendSmartGroup] = useState(store.get('friendSmartGroup'))
  const [customProfileBg, setCustomProfileBg] = useState(store.get('customProfileBg'))
  const [rankQueue, setRankQueue] = useState(store.get('rankQueue'))
  const [rankTier, setRankTier] = useState(store.get('rankTier'))
  const [rankDivision, setRankDivision] = useState(store.get('rankDivision'))
  const [autoHonor, setAutoHonor] = useState(store.get('autoHonor'))
  const [autoLockChampion, setAutoLockChampion] = useState(store.get('autoLockChampion'))
  const [champSearchText, setChampSearchText] = useState(() => {
    const savedId = store.get('autoLockChampionId')
    if (savedId > 0) {
      const c = getChampionById(savedId)
      return c ? `${c.title} ${c.name}` : String(savedId)
    }
    return ''
  })
  const [champSuggestions, setChampSuggestions] = useState<ChampionInfo[]>([])
  const [showChampSuggestions, setShowChampSuggestions] = useState(false)
  const [autoLockInstant, setAutoLockInstant] = useState(store.get('autoLockInstant'))
  const champSuggestRef = useRef<HTMLDivElement>(null)
  const [replayGameId, setReplayGameId] = useState('')
  const [replayState, setReplayState] = useState<'idle' | 'downloading' | 'ready' | 'launching' | 'error'>('idle')
  const [searchRiotId, setSearchRiotId] = useState('')
  const [searchError, setSearchError] = useState('')
  const [matchModalOpen, setMatchModalOpen] = useState(false)
  const [matchModalPuuid, setMatchModalPuuid] = useState('')
  const [matchModalName, setMatchModalName] = useState('')

  useEffect(() => {
    const unsubs = [
      store.onChange('autoAcceptMatch', setAutoAccept),
      store.onChange('autoAcceptDelayMin', (v) => setAutoAcceptDelayMin(String(v))),
      store.onChange('autoAcceptDelayMax', (v) => setAutoAcceptDelayMax(String(v))),
      store.onChange('unlockStatus', setUnlockStatus),
      store.onChange('unlockAvailability', setUnlockAvailability),
      store.onChange('unlockChromas', setUnlockChromas),
      store.onChange('benchNoCooldown', setBenchNoCooldown),
      store.onChange('windowEffect', setWindowEffect),
      store.onChange('champSelectAssist', setChampSelectAssist),
      store.onChange('balanceBuffTooltip', setBalanceBuffTooltip),
      store.onChange('champSelectQuitButton', setChampSelectQuitButton),
      store.onChange('analyzeTeamPower', setAnalyzeTeamPower),
      store.onChange('friendSmartGroup', setFriendSmartGroup),
      store.onChange('customProfileBg', setCustomProfileBg),
      store.onChange('autoHonor', setAutoHonor),
      store.onChange('autoLockChampion', setAutoLockChampion),
      store.onChange('rankQueue', setRankQueue),
      store.onChange('rankTier', setRankTier),
      store.onChange('rankDivision', setRankDivision),
    ]
    return () => unsubs.forEach((fn) => fn())
  }, [])

  // 点击外部关闭英雄联想下拉
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (champSuggestRef.current && !champSuggestRef.current.contains(e.target as Node)) {
        setShowChampSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
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

  const handleSearchMatch = async () => {
    const parts = searchRiotId.trim().split('#')
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      setSearchError('格式错误，请输入: 名字#Tag')
      return
    }
    setSearchError('')
    try {
      const summoner = await lcu.getSummonerByRiotId(parts[0], parts[1])
      if (!summoner?.puuid) {
        setSearchError('未找到该召唤师')
        return
      }
      setMatchModalPuuid(summoner.puuid)
      setMatchModalName(`${parts[0]}#${parts[1]}`)
      setMatchModalOpen(true)
    } catch {
      setSearchError('查询失败，请检查名字和Tag是否正确')
    }
  }

  return (
    <div className="sona-settings">
      <h2 className="sona-settings-title">工具</h2>

      <SettingGroup title="战绩查询">
        <p className="sona-subtitle" style={{ marginBottom: 10 }}>输入召唤师名#Tag 查询任意玩家的近期战绩。</p>
        <div className="sona-debug-actions" style={{ alignItems: 'flex-end', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <SonaInput
              value={searchRiotId}
              onChange={(v) => { setSearchRiotId(v); setSearchError('') }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearchMatch() }}
              placeholder="名字#Tag (例:丨一疾风剑豪一丨#77772)"
            />
          </div>
          <SonaButton variant="primary" onClick={handleSearchMatch}>
            查询战绩
          </SonaButton>
        </div>
        {searchError && <p className="sona-subtitle" style={{ color: '#e74c3c', marginTop: 6 }}>{searchError}</p>}
      </SettingGroup>

      <MatchHistoryModal
        open={matchModalOpen}
        onClose={() => setMatchModalOpen(false)}
        puuid={matchModalPuuid}
        playerName={matchModalName}
      />

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
        {autoAccept && (
          <SettingCard
            title="自动接受的随机延迟"
            description="在区间内随机延迟后再接受（上限 15000ms）。"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 80 }}>
                <SonaInput
                  value={autoAcceptDelayMin}
                  onChange={(v) => {
                    // 毫秒只收整数
                    const cleaned = v.replace(/[^\d]/g, '')
                    setAutoAcceptDelayMin(cleaned)
                    const n = parseInt(cleaned, 10)
                    store.set('autoAcceptDelayMin', Number.isFinite(n) ? n : 0)
                  }}
                  placeholder="最小"
                />
              </div>
              <span style={{ color: '#a09b8c', fontSize: 13 }}>—</span>
              <div style={{ width: 80 }}>
                <SonaInput
                  value={autoAcceptDelayMax}
                  onChange={(v) => {
                    const cleaned = v.replace(/[^\d]/g, '')
                    setAutoAcceptDelayMax(cleaned)
                    const n = parseInt(cleaned, 10)
                    store.set('autoAcceptDelayMax', Number.isFinite(n) ? n : 0)
                  }}
                  placeholder="最大"
                />
              </div>
              <span style={{ color: '#a09b8c', fontSize: 13 }}>毫秒</span>
            </div>
          </SettingCard>
        )}
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
          title="平衡性调整buff提示"
          description="游玩特定模式（大乱斗、无限火力）时，鼠标悬停在英雄头像上，显示对应的平衡性数值调整。"
        >
          <SonaSwitch
            checked={balanceBuffTooltip}
            onChange={(v) => { setBalanceBuffTooltip(v); store.set('balanceBuffTooltip', v) }}
          />
        </SettingCard>
        {/* 这个选人阶段退出，没找到合适的LCU接口，暂时加不了 */}
        {/* <SettingCard
          title="选人阶段退出按钮"
          description="非自定义对局的英雄选择里客户端不会显示退出按钮，Sona 帮你补一个。点击后会弹确认窗，秒退会扣逃跑分。"
        >
          <SonaSwitch
            checked={champSelectQuitButton}
            onChange={(v) => { setChampSelectQuitButton(v); store.set('champSelectQuitButton', v) }}
          />
        </SettingCard> */}
        <SettingCard
          title="对局结束自动点赞"
          description="对局结束后，随机给队友点赞，再也不用手点啦。"
        >
          <SonaSwitch
            checked={autoHonor}
            onChange={(v) => { setAutoHonor(v); store.set('autoHonor', v) }}
          />
        </SettingCard>
        <SettingCard
          title="秒抢英雄"
          description="进入可选英雄的模式时，轮到自己自动秒锁指定英雄。大乱斗等无需选人的模式不受影响。"
        >
          <SonaSwitch
            checked={autoLockChampion}
            onChange={(v) => { setAutoLockChampion(v); store.set('autoLockChampion', v) }}
          />
        </SettingCard>
        {autoLockChampion && (
          <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="sona-debug-actions" style={{ alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1, position: 'relative' }} ref={champSuggestRef}>
                <SonaInput
                  value={champSearchText}
                  onChange={(v) => {
                    setChampSearchText(v)
                    const results = searchChampions(v)
                    setChampSuggestions(results)
                    setShowChampSuggestions(results.length > 0)
                  }}
                  placeholder="输入英雄名/称号搜索 (如: 亚索)"
                />
                {showChampSuggestions && champSuggestions.length > 0 && (
                  <div className="sona-champ-suggest">
                    {champSuggestions.map((c) => (
                      <button
                        key={c.id}
                        className="sona-champ-suggest-item"
                        type="button"
                        onClick={() => {
                          setChampSearchText(`${c.title} ${c.name}`)
                          store.set('autoLockChampionId', c.id)
                          setShowChampSuggestions(false)
                          logger.info('[AutoLock] 目标英雄已设置: %s %s (ID: %d)', c.title, c.name, c.id)
                        }}
                      >
                        <img className="sona-champ-suggest-icon" src={`/lol-game-data/assets/v1/champion-icons/${c.id}.png`} alt="" />
                        <span className="sona-champ-suggest-title">{c.title}</span>
                        <span className="sona-champ-suggest-name">{c.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="sona-debug-actions" style={{ gap: 8 }}>
              <SonaButton
                variant={autoLockInstant ? 'primary' : undefined}
                onClick={() => { setAutoLockInstant(true); store.set('autoLockInstant', true) }}
              >
                秒选并锁定{autoLockInstant ? ' ✓' : ''}
              </SonaButton>
              <SonaButton
                variant={!autoLockInstant ? 'primary' : undefined}
                onClick={() => { setAutoLockInstant(false); store.set('autoLockInstant', false) }}
              >
                仅预选{!autoLockInstant ? ' ✓' : ''}
              </SonaButton>
            </div>
          </div>
        )}
      </SettingGroup>

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
          title="解锁在线状态切换"
          description="接管客户端的状态按钮，支持切换至隐身、手机在线等客户端默认不提供的状态。"
        >
          <SonaSwitch
            checked={unlockAvailability}
            onChange={(v) => { setUnlockAvailability(v); store.set('unlockAvailability', v) }}
          />
        </SettingCard>
        <SettingCard
          title="解锁炫彩分页（国服）"
          description="在生涯藏品页恢复被隐藏的「炫彩」子分页。修改开关后需要重启客户端才能生效。"
        >
          <SonaSwitch
            checked={unlockChromas}
            onChange={(v) => { setUnlockChromas(v); store.set('unlockChromas', v) }}
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

      <SettingGroup title="设置备份">
        <p className="sona-subtitle" style={{ marginBottom: 10 }}>备份当前客户端设置（快捷键、界面布局等），支持多个命名存档。</p>
        <BackupManager />
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

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
import { useI18n } from '@/i18n'
import '@/styles/SettingsPage.css'

function BackupManager() {
  const { t } = useI18n()
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
    if (!name) { setStatus(t('tools.backup.nameRequired')); return }
    setStatus(t('tools.backup.saving'))
    const ok = await lcu.backupSettings(name)
    setStatus(ok ? t('tools.backup.success') : t('tools.backup.failed'))
    if (ok) { setBackupName(''); refreshList() }
  }

  const handleRestore = async (name: string) => {
    setStatus(t('tools.backup.restoring', { name }))
    const ok = await lcu.restoreSettings(name)
    setStatus(ok ? t('tools.backup.restored', { name }) : t('tools.backup.restoreFailed'))
  }

  const handleDelete = async (name: string) => {
    const ok = await lcu.deleteBackup(name)
    if (ok) {
      setStatus(t('tools.backup.deleted', { name }))
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
            placeholder={t('tools.backup.placeholder')}
          />
        </div>
        <SonaButton variant="primary" onClick={handleBackup}>
          {t('tools.backup.save')}
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
                <SonaButton onClick={() => handleRestore(b.name)}>{t('common.restore')}</SonaButton>
                <SonaButton onClick={() => handleDelete(b.name)}>{t('common.delete')}</SonaButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function ChampionPriorityCards({
  championIds,
  emptyText,
  onRemove,
}: {
  championIds: number[]
  emptyText: string
  onRemove: (championId: number) => void
}) {
  if (championIds.length === 0) {
    return <p className="sona-subtitle" style={{ margin: 0 }}>{emptyText}</p>
  }

  return (
    <div className="sona-champ-priority-list">
      {championIds.map((championId, index) => {
        const champion = getChampionById(championId)
        return (
          <div className="sona-champ-priority-card" key={championId}>
            <span className="sona-champ-priority-index">{index + 1}</span>
            <img
              className="sona-champ-priority-icon"
              src={`/lol-game-data/assets/v1/champion-icons/${championId}.png`}
              alt=""
            />
            <span className="sona-champ-priority-name">
              {champion ? `${champion.title} ${champion.name}` : `英雄#${championId}`}
            </span>
            <button
              className="sona-champ-priority-remove"
              type="button"
              onClick={() => onRemove(championId)}
              aria-label="移除"
            >
              ×
            </button>
          </div>
        )
      })}
    </div>
  )
}

export function ToolsPage() {
  const { t } = useI18n()
  const [autoAccept, setAutoAccept] = useState(store.get('autoAcceptMatch'))
  // 延迟值在 UI 里用字符串存，避免"删到空 → 变 NaN"、"输到一半"等中间态被推回 store
  const [autoAcceptDelayMin, setAutoAcceptDelayMin] = useState(String(store.get('autoAcceptDelayMin')))
  const [autoAcceptDelayMax, setAutoAcceptDelayMax] = useState(String(store.get('autoAcceptDelayMax')))
  const [unlockStatus, setUnlockStatus] = useState(store.get('unlockStatus'))
  const [unlockAvailability, setUnlockAvailability] = useState(store.get('unlockAvailability'))
  const [unlockChromas, setUnlockChromas] = useState(store.get('unlockChromas'))
  const [benchNoCooldown, setBenchNoCooldown] = useState(store.get('benchNoCooldown'))
  const [hideTFT, setHideTFT] = useState(store.get('hideTFT'))
  const [hideRightNavText, setHideRightNavText] = useState(store.get('hideRightNavText'))
  const [gameModeFilter, setGameModeFilter] = useState(store.get('gameModeFilter'))
  const [windowEffect, setWindowEffect] = useState(store.get('windowEffect'))
  const [champSelectAssist, setChampSelectAssist] = useState(store.get('champSelectAssist'))
  const [opggBuildRecommendation, setOpggBuildRecommendation] = useState(store.get('opggBuildRecommendation'))
  const [smartBuildRecommendation, setSmartBuildRecommendation] = useState(store.get('smartBuildRecommendation'))
  const [balanceBuffTooltip, setBalanceBuffTooltip] = useState(store.get('balanceBuffTooltip'))
  const [champSelectQuitButton, setChampSelectQuitButton] = useState(store.get('champSelectQuitButton'))
  const [gameAnalysisPopup, setGameAnalysisPopup] = useState(store.get('gameAnalysisPopup'))
  const [autoReturnToLobby, setAutoReturnToLobby] = useState(store.get('autoReturnToLobby'))
  const [autoReturnMode, setAutoReturnMode] = useState(store.get('autoReturnMode'))
  const [analyzeTeamPower, setAnalyzeTeamPower] = useState(store.get('analyzeTeamPower'))
  const [analyzeTeamPowerMsgType, setAnalyzeTeamPowerMsgType] = useState(store.get('analyzeTeamPowerMsgType'))
  const [analyzeTeamPowerFetchCount, setAnalyzeTeamPowerFetchCount] = useState(store.get('analyzeTeamPowerFetchCount'))
  const [champSelectAssistFetchCount, setChampSelectAssistFetchCount] = useState(store.get('champSelectAssistFetchCount'))
  const [gameAnalysisFetchCount, setGameAnalysisFetchCount] = useState(store.get('gameAnalysisFetchCount'))
  const [sideIndicator, setSideIndicator] = useState(store.get('sideIndicator'))
  const [sideIndicatorMsgType, setSideIndicatorMsgType] = useState(store.get('sideIndicatorMsgType'))
  const [friendSmartGroup, setFriendSmartGroup] = useState(store.get('friendSmartGroup'))
  const [enhancedFriendGameStatus, setEnhancedFriendGameStatus] = useState(store.get('enhancedFriendGameStatus'))
  const [lobbyEnhancement, setLobbyEnhancement] = useState(store.get('lobbyEnhancement'))
  const [lobbyEnhancementFetchCount, setLobbyEnhancementFetchCount] = useState(store.get('lobbyEnhancementFetchCount'))
  const [customProfileBg, setCustomProfileBg] = useState(store.get('customProfileBg'))
  const [customBanner, setCustomBanner] = useState(store.get('customBanner'))
  const [rankQueue, setRankQueue] = useState(store.get('rankQueue'))
  const [rankTier, setRankTier] = useState(store.get('rankTier'))
  const [rankDivision, setRankDivision] = useState(store.get('rankDivision'))
  const [autoHonor, setAutoHonor] = useState(store.get('autoHonor'))
  const [autoLockChampion, setAutoLockChampion] = useState(store.get('autoLockChampion'))
  const [autoLockChampionIds, setAutoLockChampionIds] = useState(store.get('autoLockChampionIds'))
  const [champSearchText, setChampSearchText] = useState('')
  const [champSuggestions, setChampSuggestions] = useState<ChampionInfo[]>([])
  const [showChampSuggestions, setShowChampSuggestions] = useState(false)
  const [autoLockInstant, setAutoLockInstant] = useState(store.get('autoLockInstant'))
  const champSuggestRef = useRef<HTMLDivElement>(null)
  const [autoBanChampion, setAutoBanChampion] = useState(store.get('autoBanChampion'))
  const [autoBanChampionIds, setAutoBanChampionIds] = useState(store.get('autoBanChampionIds'))
  const [banChampSearchText, setBanChampSearchText] = useState('')
  const [banChampSuggestions, setBanChampSuggestions] = useState<ChampionInfo[]>([])
  const [showBanChampSuggestions, setShowBanChampSuggestions] = useState(false)
  const banChampSuggestRef = useRef<HTMLDivElement>(null)
  const [replayGameId, setReplayGameId] = useState('')
  const [replayState, setReplayState] = useState<'idle' | 'downloading' | 'ready' | 'launching' | 'error'>('idle')
  const [searchRiotId, setSearchRiotId] = useState('')
  const [searchError, setSearchError] = useState('')
  const [matchModalOpen, setMatchModalOpen] = useState(false)
  const [matchModalPuuid, setMatchModalPuuid] = useState('')
  const [matchModalName, setMatchModalName] = useState('')
  const recentOptions = [
    { value: '20', label: t('option.recent.20') },
    { value: '50', label: t('option.recent.50') },
    { value: '100', label: t('option.recent.100') },
  ]
  const visibilityOptions = [
    { value: 'celebration', label: t('option.visibility.self') },
    { value: 'chat', label: t('option.visibility.team') },
  ]
  const effectOptions = [
    { value: 'none', label: t('option.windowEffect.none') },
    { value: 'blurbehind', label: t('option.windowEffect.blurbehind') },
    { value: 'acrylic', label: t('option.windowEffect.acrylic') },
    { value: 'unified', label: t('option.windowEffect.unified') },
    { value: 'mica', label: t('option.windowEffect.mica') },
    { value: 'transparent', label: t('option.windowEffect.transparent') },
  ]

  useEffect(() => {
    const unsubs = [
      store.onChange('autoAcceptMatch', setAutoAccept),
      store.onChange('autoAcceptDelayMin', (v) => setAutoAcceptDelayMin(String(v))),
      store.onChange('autoAcceptDelayMax', (v) => setAutoAcceptDelayMax(String(v))),
      store.onChange('unlockStatus', setUnlockStatus),
      store.onChange('unlockAvailability', setUnlockAvailability),
      store.onChange('unlockChromas', setUnlockChromas),
      store.onChange('benchNoCooldown', setBenchNoCooldown),
      store.onChange('hideTFT', setHideTFT),
      store.onChange('gameModeFilter', setGameModeFilter),
      store.onChange('windowEffect', setWindowEffect),
      store.onChange('champSelectAssist', setChampSelectAssist),
      store.onChange('opggBuildRecommendation', setOpggBuildRecommendation),
      store.onChange('smartBuildRecommendation', setSmartBuildRecommendation),
      store.onChange('balanceBuffTooltip', setBalanceBuffTooltip),
      store.onChange('champSelectQuitButton', setChampSelectQuitButton),
      store.onChange('gameAnalysisPopup', setGameAnalysisPopup),
      store.onChange('autoReturnToLobby', setAutoReturnToLobby),
      store.onChange('autoReturnMode', setAutoReturnMode),
      store.onChange('analyzeTeamPower', setAnalyzeTeamPower),
      store.onChange('analyzeTeamPowerFetchCount', setAnalyzeTeamPowerFetchCount),
      store.onChange('champSelectAssistFetchCount', setChampSelectAssistFetchCount),
      store.onChange('gameAnalysisFetchCount', setGameAnalysisFetchCount),
      store.onChange('sideIndicator', setSideIndicator),
      store.onChange('friendSmartGroup', setFriendSmartGroup),
      store.onChange('enhancedFriendGameStatus', setEnhancedFriendGameStatus),
      store.onChange('lobbyEnhancement', setLobbyEnhancement),
      store.onChange('lobbyEnhancementFetchCount', setLobbyEnhancementFetchCount),
      store.onChange('customProfileBg', setCustomProfileBg),
      store.onChange('customBanner', setCustomBanner),
      store.onChange('autoHonor', setAutoHonor),
      store.onChange('autoLockChampion', setAutoLockChampion),
      store.onChange('autoLockChampionIds', setAutoLockChampionIds),
      store.onChange('autoBanChampion', setAutoBanChampion),
      store.onChange('autoBanChampionIds', setAutoBanChampionIds),
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
      if (banChampSuggestRef.current && !banChampSuggestRef.current.contains(e.target as Node)) {
        setShowBanChampSuggestions(false)
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
      setSearchError(t('tools.matchQuery.invalid'))
      return
    }
    setSearchError('')
    try {
      const summoner = await lcu.getSummonerByRiotId(parts[0], parts[1])
      if (!summoner?.puuid) {
        setSearchError(t('tools.matchQuery.notFound'))
        return
      }
      setMatchModalPuuid(summoner.puuid)
      setMatchModalName(`${parts[0]}#${parts[1]}`)
      setMatchModalOpen(true)
    } catch {
      setSearchError(t('tools.matchQuery.failed'))
    }
  }

  const addAutoLockChampion = (champion: ChampionInfo) => {
    if (autoLockChampionIds.includes(champion.id)) {
      setChampSearchText('')
      setShowChampSuggestions(false)
      return
    }

    const next = [...autoLockChampionIds, champion.id]
    setAutoLockChampionIds(next)
    store.set('autoLockChampionIds', next)
    setChampSearchText('')
    setShowChampSuggestions(false)
    logger.info('[AutoLock] 已加入目标英雄队列: %s %s (ID: %d)', champion.title, champion.name, champion.id)
  }

  const removeAutoLockChampion = (championId: number) => {
    const next = autoLockChampionIds.filter((id) => id !== championId)
    setAutoLockChampionIds(next)
    store.set('autoLockChampionIds', next)
  }

  const addAutoBanChampion = (champion: ChampionInfo) => {
    if (autoBanChampionIds.includes(champion.id)) {
      setBanChampSearchText('')
      setShowBanChampSuggestions(false)
      return
    }

    const next = [...autoBanChampionIds, champion.id]
    setAutoBanChampionIds(next)
    store.set('autoBanChampionIds', next)
    setBanChampSearchText('')
    setShowBanChampSuggestions(false)
    logger.info('[AutoBan] 已加入目标英雄队列: %s %s (ID: %d)', champion.title, champion.name, champion.id)
  }

  const removeAutoBanChampion = (championId: number) => {
    const next = autoBanChampionIds.filter((id) => id !== championId)
    setAutoBanChampionIds(next)
    store.set('autoBanChampionIds', next)
  }

  return (
    <div className="sona-settings">
      <h2 className="sona-settings-title">{t('tools.title')}</h2>

      <SettingGroup title={t('tools.group.matchQuery')}>
        <p className="sona-subtitle" style={{ marginBottom: 10 }}>{t('tools.matchQuery.description')}</p>
        <div className="sona-debug-actions" style={{ alignItems: 'flex-end', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <SonaInput
              value={searchRiotId}
              onChange={(v) => { setSearchRiotId(v); setSearchError('') }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearchMatch() }}
              placeholder={t('tools.matchQuery.placeholder')}
            />
          </div>
          <SonaButton variant="primary" onClick={handleSearchMatch}>
            {t('tools.matchQuery.search')}
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

      <SettingGroup title={t('tools.group.match')}>
        <SettingCard
          title={t('tools.autoAccept.title')}
          description={t('tools.autoAccept.description')}
        >
          <SonaSwitch
            checked={autoAccept}
            onChange={(v) => { setAutoAccept(v); store.set('autoAcceptMatch', v) }}
          />
        </SettingCard>
        {autoAccept && (
          <SettingCard
            title={t('tools.autoAcceptDelay.title')}
            description={t('tools.autoAcceptDelay.description')}
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
          title={t('tools.benchNoCooldown.title')}
          description={t('tools.benchNoCooldown.description')}
        >
          <SonaSwitch
            checked={benchNoCooldown}
            onChange={(v) => { setBenchNoCooldown(v); store.set('benchNoCooldown', v) }}
          />
        </SettingCard>
        <SettingCard
          title={t('tools.analyzeTeamPower.title')}
          description={t('tools.analyzeTeamPower.description')}
        >
          <SonaSelect
            value={String(analyzeTeamPowerFetchCount)}
            onChange={(v) => { setAnalyzeTeamPowerFetchCount(Number(v)); store.set('analyzeTeamPowerFetchCount', Number(v)) }}
            options={recentOptions}
          />
          <SonaSelect
            value={analyzeTeamPowerMsgType}
            onChange={(v) => { setAnalyzeTeamPowerMsgType(v); store.set('analyzeTeamPowerMsgType', v) }}
            options={visibilityOptions}
          />
          <SonaSwitch
            checked={analyzeTeamPower}
            onChange={(v) => { setAnalyzeTeamPower(v); store.set('analyzeTeamPower', v) }}
          />
        </SettingCard>
        <SettingCard
          title={t('tools.sideIndicator.title')}
          description={t('tools.sideIndicator.description')}
        >
          <SonaSelect
            value={sideIndicatorMsgType}
            onChange={(v) => { setSideIndicatorMsgType(v); store.set('sideIndicatorMsgType', v) }}
            options={visibilityOptions}
          />
          <SonaSwitch
            checked={sideIndicator}
            onChange={(v) => { setSideIndicator(v); store.set('sideIndicator', v) }}
          />
        </SettingCard>
        <SettingCard
          title={t('tools.champSelectAssist.title')}
          description={t('tools.champSelectAssist.description')}
        >
          <SonaSelect
            value={String(champSelectAssistFetchCount)}
            onChange={(v) => { setChampSelectAssistFetchCount(Number(v)); store.set('champSelectAssistFetchCount', Number(v)) }}
            options={recentOptions}
          />
          <SonaSwitch
            checked={champSelectAssist}
            onChange={(v) => { setChampSelectAssist(v); store.set('champSelectAssist', v) }}
          />
        </SettingCard>
        <SettingCard
          title={t('tools.opggBuildRecommendation.title')}
          description={t('tools.opggBuildRecommendation.description')}
        >
          <SonaSwitch
            checked={opggBuildRecommendation}
            onChange={(v) => { setOpggBuildRecommendation(v); store.set('opggBuildRecommendation', v) }}
          />
        </SettingCard>
        <SettingCard
          title={t('tools.smartBuildRecommendation.title')}
          description={t('tools.smartBuildRecommendation.description')}
        >
          <SonaSwitch
            checked={smartBuildRecommendation}
            onChange={(v) => { setSmartBuildRecommendation(v); store.set('smartBuildRecommendation', v) }}
          />
        </SettingCard>
        <SettingCard
          title={t('tools.balanceBuffTooltip.title')}
          description={t('tools.balanceBuffTooltip.description')}
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
          title={t('tools.gameAnalysisPopup.title')}
          description={t('tools.gameAnalysisPopup.description')}
        >
          <SonaSelect
            value={String(gameAnalysisFetchCount)}
            onChange={(v) => { setGameAnalysisFetchCount(Number(v)); store.set('gameAnalysisFetchCount', Number(v)) }}
            options={recentOptions}
          />
          <SonaSwitch
            checked={gameAnalysisPopup}
            onChange={(v) => { setGameAnalysisPopup(v); store.set('gameAnalysisPopup', v) }}
          />
        </SettingCard>
        <SettingCard
          title={t('tools.autoReturn.title')}
          description={t('tools.autoReturn.description')}
        >
          <SonaSelect
            value={autoReturnMode}
            onChange={(v) => { setAutoReturnMode(v); store.set('autoReturnMode', v) }}
            options={[
              { value: 'queue', label: t('option.autoReturn.queue') },
              { value: 'lobby', label: t('option.autoReturn.lobby') },
            ]}
          />
          <SonaSwitch
            checked={autoReturnToLobby}
            onChange={(v) => { setAutoReturnToLobby(v); store.set('autoReturnToLobby', v) }}
          />
        </SettingCard>
        <SettingCard
          title={t('tools.autoHonor.title')}
          description={t('tools.autoHonor.description')}
        >
          <SonaSwitch
            checked={autoHonor}
            onChange={(v) => { setAutoHonor(v); store.set('autoHonor', v) }}
          />
        </SettingCard>
        <SettingCard
          title={t('tools.autoLock.title')}
          description={t('tools.autoLock.description')}
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
                  placeholder={t('tools.autoLock.searchPlaceholder')}
                />
                {showChampSuggestions && champSuggestions.length > 0 && (
                  <div className="sona-champ-suggest">
                    {champSuggestions.map((c) => (
                      <button
                        key={c.id}
                        className="sona-champ-suggest-item"
                        type="button"
                        onClick={() => addAutoLockChampion(c)}
                      >
                        <img className="sona-champ-suggest-icon" src={`/lol-game-data/assets/v1/champion-icons/${c.id}.png`} alt="" />
                        <span className="sona-champ-suggest-title">{c.title}</span>
                        <span className="sona-champ-suggest-name">{c.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <SonaButton
                variant={autoLockInstant ? 'primary' : undefined}
                onClick={() => { setAutoLockInstant(true); store.set('autoLockInstant', true) }}
              >
                {t('tools.autoLock.lock')}{autoLockInstant ? ' ✓' : ''}
              </SonaButton>
              <SonaButton
                variant={!autoLockInstant ? 'primary' : undefined}
                onClick={() => { setAutoLockInstant(false); store.set('autoLockInstant', false) }}
              >
                {t('tools.autoLock.preselect')}{!autoLockInstant ? ' ✓' : ''}
              </SonaButton>
            </div>
            <ChampionPriorityCards
              championIds={autoLockChampionIds}
              emptyText={t('tools.autoLock.empty')}
              onRemove={removeAutoLockChampion}
            />
          </div>
        )}
        <SettingCard
          title={t('tools.autoBan.title')}
          description={t('tools.autoBan.description')}
        >
          <SonaSwitch
            checked={autoBanChampion}
            onChange={(v) => { setAutoBanChampion(v); store.set('autoBanChampion', v) }}
          />
        </SettingCard>
        {autoBanChampion && (
          <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="sona-debug-actions" style={{ alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1, position: 'relative' }} ref={banChampSuggestRef}>
                <SonaInput
                  value={banChampSearchText}
                  onChange={(v) => {
                    setBanChampSearchText(v)
                    const results = searchChampions(v)
                    setBanChampSuggestions(results)
                    setShowBanChampSuggestions(results.length > 0)
                  }}
                  placeholder={t('tools.autoBan.searchPlaceholder')}
                />
                {showBanChampSuggestions && (
                  <div className="sona-champ-suggest">
                    {banChampSuggestions.map((c) => (
                      <button
                        key={c.id}
                        className="sona-champ-suggest-item"
                        type="button"
                        onClick={() => addAutoBanChampion(c)}
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
            <ChampionPriorityCards
              championIds={autoBanChampionIds}
              emptyText={t('tools.autoBan.empty')}
              onRemove={removeAutoBanChampion}
            />
          </div>
        )}
      </SettingGroup>

      <SettingGroup title={t('tools.group.social')}>
        <SettingCard
          title={t('tools.unlockStatus.title')}
          description={t('tools.unlockStatus.description')}
        >
          <SonaSwitch
            checked={unlockStatus}
            onChange={(v) => { setUnlockStatus(v); store.set('unlockStatus', v) }}
          />
        </SettingCard>
        <SettingCard
          title={t('tools.unlockAvailability.title')}
          description={t('tools.unlockAvailability.description')}
        >
          <SonaSwitch
            checked={unlockAvailability}
            onChange={(v) => { setUnlockAvailability(v); store.set('unlockAvailability', v) }}
          />
        </SettingCard>
        <SettingCard
          title={t('tools.unlockChromas.title')}
          description={t('tools.unlockChromas.description')}
        >
          <SonaSwitch
            checked={unlockChromas}
            onChange={(v) => { setUnlockChromas(v); store.set('unlockChromas', v) }}
          />
        </SettingCard>
        <SettingCard
          title={t('tools.removeCrest.title')}
          description={t('tools.removeCrest.description')}
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
            {t('tools.unequip')}
          </SonaButton>
        </SettingCard>
        <SettingCard
          title={t('tools.removeIcon.title')}
          description={t('tools.removeIcon.description')}
        >
          <SonaButton onClick={async () => {
            try {
              await lcu.setProfileIcon(29)
              logger.info('头像已恢复为默认头像 ✓')
            } catch (err) {
              logger.error('恢复默认头像失败:', err)
            }
          }}>
            {t('tools.unequip')}
          </SonaButton>
        </SettingCard>
        <SettingCard
          title={t('tools.customProfileBg.title')}
          description={t('tools.customProfileBg.description')}
        >
          <SonaSwitch
            checked={customProfileBg}
            onChange={(v) => { setCustomProfileBg(v); store.set('customProfileBg', v) }}
          />
        </SettingCard>
        <SettingCard
          title={t('tools.customBanner.title')}
          description={t('tools.customBanner.description')}
        >
          <SonaSwitch
            checked={customBanner}
            onChange={(v) => { setCustomBanner(v); store.set('customBanner', v) }}
          />
        </SettingCard>
        <SettingCard
          title={t('tools.friendSmartGroup.title')}
          description={t('tools.friendSmartGroup.description')}
        >
          <SonaSwitch
            checked={friendSmartGroup}
            onChange={(v) => { setFriendSmartGroup(v); store.set('friendSmartGroup', v) }}
          />
        </SettingCard>
        <SettingCard
          title={t('tools.enhancedFriendStatus.title')}
          description={t('tools.enhancedFriendStatus.description')}
        >
          <SonaSwitch
            checked={enhancedFriendGameStatus}
            onChange={(v) => { setEnhancedFriendGameStatus(v); store.set('enhancedFriendGameStatus', v) }}
          />
        </SettingCard>
        <SettingCard
          title={t('tools.lobbyEnhancement.title')}
          description={t('tools.lobbyEnhancement.description')}
        >
          <SonaSelect
            value={String(lobbyEnhancementFetchCount)}
            onChange={(v) => { setLobbyEnhancementFetchCount(Number(v)); store.set('lobbyEnhancementFetchCount', Number(v)) }}
            options={recentOptions}
          />
          <SonaSwitch
            checked={lobbyEnhancement}
            onChange={(v) => { setLobbyEnhancement(v); store.set('lobbyEnhancement', v) }}
          />
        </SettingCard>
      </SettingGroup>

      <SettingGroup title={t('tools.group.interface')}>
        <SettingCard
          title={t('tools.gameModeFilter.title')}
          description={t('tools.gameModeFilter.description')}
        >
          <SonaSwitch
            checked={gameModeFilter}
            onChange={(v) => { setGameModeFilter(v); store.set('gameModeFilter', v) }}
          />
        </SettingCard>
        <SettingCard
          title={t('tools.hideTFT.title')}
          description={t('tools.hideTFT.description')}
        >
          <SonaSwitch
            checked={hideTFT}
            onChange={(v) => { setHideTFT(v); store.set('hideTFT', v) }}
          />
        </SettingCard>
        <SettingCard
          title={t('tools.hideRightNavText.title')}
          description={t('tools.hideRightNavText.description')}
        >
          <SonaSwitch
            checked={hideRightNavText}
            onChange={(v) => { setHideRightNavText(v); store.set('hideRightNavText', v) }}
          />
        </SettingCard>
        <SettingCard
          title={t('tools.windowEffect.title')}
          description={t('tools.windowEffect.description')}
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

      <SettingGroup title={t('tools.group.rankDisguise')}>
        <p className="sona-subtitle" style={{ marginBottom: 10 }}>{t('tools.rankDisguise.description')}</p>
        <div className="sona-debug-actions" style={{ alignItems: 'center' }}>
          <div style={{ minWidth: 140 }}>
            <SonaSelect
              options={[
                { value: 'RANKED_SOLO_5x5', label: t('rank.queue.RANKED_SOLO_5x5') },
                { value: 'RANKED_FLEX_SR', label: t('rank.queue.RANKED_FLEX_SR') },
                { value: 'RANKED_FLEX_TT', label: t('rank.queue.RANKED_FLEX_TT') },
                { value: 'RANKED_TFT', label: t('rank.queue.RANKED_TFT') },
                { value: 'RANKED_TFT_DOUBLE_UP', label: t('rank.queue.RANKED_TFT_DOUBLE_UP') },
                { value: 'RANKED_TFT_TURBO', label: t('rank.queue.RANKED_TFT_TURBO') },
              ]}
              value={rankQueue}
              onChange={setRankQueue}
            />
          </div>
          <div style={{ minWidth: 130 }}>
            <SonaSelect
              options={[
                { value: 'CHALLENGER', label: t('rank.CHALLENGER') },
                { value: 'GRANDMASTER', label: t('rank.GRANDMASTER') },
                { value: 'MASTER', label: t('rank.MASTER') },
                { value: 'DIAMOND', label: t('rank.DIAMOND') },
                { value: 'EMERALD', label: t('rank.EMERALD') },
                { value: 'PLATINUM', label: t('rank.PLATINUM') },
                { value: 'GOLD', label: t('rank.GOLD') },
                { value: 'SILVER', label: t('rank.SILVER') },
                { value: 'BRONZE', label: t('rank.BRONZE') },
                { value: 'IRON', label: t('rank.IRON') },
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
            {t('common.apply')}
          </SonaButton>
          <SonaButton onClick={() => {
            store.set('rankDisguise', false)
          }}>
            {t('common.restore')}
          </SonaButton>
        </div>
      </SettingGroup>

      <SettingGroup title={t('tools.group.replay')}>
        <p className="sona-subtitle" style={{ marginBottom: 10 }}>{t('tools.replay.description')}</p>
        <div className="sona-debug-actions" style={{ alignItems: 'flex-end', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <SonaInput
              value={replayGameId}
              onChange={(v) => { setReplayGameId(v); setReplayState('idle') }}
              placeholder={t('tools.replay.placeholder')}
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
            {{ idle: t('tools.replay.watch'), downloading: t('tools.replay.status.downloading'), ready: t('tools.replay.status.ready'), launching: t('tools.replay.status.launching'), error: t('tools.replay.status.error') }[replayState]}
          </SonaButton>
        </div>
      </SettingGroup>

      <SettingGroup title={t('tools.group.backup')}>
        <p className="sona-subtitle" style={{ marginBottom: 10 }}>{t('tools.backup.placeholder')}</p>
        <BackupManager />
      </SettingGroup>
    </div>
  )
}

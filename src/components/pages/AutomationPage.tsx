import { useState, useEffect, useRef } from 'react'
import { SettingCard, SettingGroup } from '@/components/ui/SettingCard'
import { SonaButton } from '@/components/ui/SonaButton'
import { SonaInput } from '@/components/ui/SonaInput'
import { SonaSwitch } from '@/components/ui/SonaSwitch'
import { SonaSelect } from '@/components/ui/SonaSelect'
import { searchChampions, getChampionById, type ChampionInfo } from '@/lib/assets'
import { logger } from '@/index'
import { store } from '@/lib/store'
import { useI18n } from '@/i18n'
import '@/styles/SettingsPage.css'


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

export function AutomationPage() {
  const { t } = useI18n()
  const [autoAccept, setAutoAccept] = useState(store.get('autoAcceptMatch'))
  // 延迟值在 UI 里用字符串存，避免"删到空 → 变 NaN"、"输到一半"等中间态被推回 store
  const [autoAcceptDelayMin, setAutoAcceptDelayMin] = useState(String(store.get('autoAcceptDelayMin')))
  const [autoAcceptDelayMax, setAutoAcceptDelayMax] = useState(String(store.get('autoAcceptDelayMax')))
  const [autoReturnToLobby, setAutoReturnToLobby] = useState(store.get('autoReturnToLobby'))
  const [autoReturnMode, setAutoReturnMode] = useState(store.get('autoReturnMode'))
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

  useEffect(() => {
    const unsubs = [
      store.onChange('autoAcceptMatch', setAutoAccept),
      store.onChange('autoAcceptDelayMin', (v) => setAutoAcceptDelayMin(String(v))),
      store.onChange('autoAcceptDelayMax', (v) => setAutoAcceptDelayMax(String(v))),
      store.onChange('autoReturnToLobby', setAutoReturnToLobby),
      store.onChange('autoReturnMode', setAutoReturnMode),
      store.onChange('autoHonor', setAutoHonor),
      store.onChange('autoLockChampion', setAutoLockChampion),
      store.onChange('autoLockChampionIds', setAutoLockChampionIds),
      store.onChange('autoLockInstant', setAutoLockInstant),
      store.onChange('autoBanChampion', setAutoBanChampion),
      store.onChange('autoBanChampionIds', setAutoBanChampionIds),
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
      <SettingGroup title={t('tools.group.automation')}>      
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
          <div className="sona-setting-switch-panel">
            <div className="sona-setting-panel-section">
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
            </div>
          </div>
        )}
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
          <div className="sona-setting-switch-panel">
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
          <div className="sona-setting-switch-panel">
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
    </div>
  )
}

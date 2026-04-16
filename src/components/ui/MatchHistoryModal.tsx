import { useState, useEffect, useRef, useCallback } from 'react'
import { Modal } from '@/components/ui/Modal'
import { lcu } from '@/lib/lcu'
import { getChampIcon, getItemIcon, getSpellIcon, getPerkIcon, getPerkStyleIcon, getQueueName, getMapName, getPlayableQueues } from '@/lib/assets'
import type { MatchGame } from '@/types/lcu'
import '@/styles/MatchHistoryModal.css'

// ==================== 数据解析 ====================

function formatK(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value)
}

/** 将 UTC 时间戳格式化为本地友好格式：今天/昨天/前天 HH:MM，更远则显示日期 */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()

  // 取本地日期的零点，用于比较天数差
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24))

  const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })

  if (diffDays === 0) return `今天 ${time}`
  if (diffDays === 1) return `昨天 ${time}`
  if (diffDays === 2) return `前天 ${time}`
  return date.toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' }) + ' ' + time
}

interface MatchRowData {
  gameId: number
  queueId: number
  win: boolean
  championId: number
  level: number
  kills: number
  deaths: number
  assists: number
  cs: number
  gold: number
  damage: number
  queueName: string
  mapName: string
  spell1Id: number
  spell2Id: number
  perk0: number
  perkSubStyle: number
  items: number[]
  gameCreation: number
}

function parseMatch(game: MatchGame, puuid: string): MatchRowData | null {
  const identity = game.participantIdentities.find((id) => id.player.puuid === puuid)
  if (!identity) return null
  const participant = game.participants.find((p) => p.participantId === identity.participantId)
  if (!participant) return null

  const s = participant.stats

  // mapId=12 的地图有多个皮肤变体，通过 gameModeMutators 区分
  let mapName = getMapName(game.mapId)
  if (game.mapId === 12) {
    const mutator = game.gameModeMutators?.[0]
    if (mutator === 'mapskin_ha_bilgewater') mapName = '屠夫之桥'
    else if (mutator === 'mapskin_map12_bloom') mapName = '莲华栈桥'
    else mapName = '嚎哭深渊'
  }

  return {
    gameId: game.gameId,
    queueId: game.queueId,
    win: s.win,
    championId: participant.championId,
    level: s.champLevel,
    kills: s.kills,
    deaths: s.deaths,
    assists: s.assists,
    cs: s.totalMinionsKilled + s.neutralMinionsKilled,
    gold: s.goldEarned,
    damage: s.totalDamageDealtToChampions,
    queueName: getQueueName(game.queueId),
    mapName,
    spell1Id: participant.spell1Id,
    spell2Id: participant.spell2Id,
    perk0: s.perk0,
    perkSubStyle: s.perkSubStyle,
    items: [s.item0, s.item1, s.item2, s.item3, s.item4, s.item5, s.item6],
    gameCreation: game.gameCreation,
  }
}

// ==================== 组件 ====================

function MatchRow({ match }: { match: MatchRowData }) {
  const statusClass = match.win ? 'smh-win' : 'smh-loss'
  const statusText = match.win ? '胜利' : '失败'
  const [copied, setCopied] = useState(false)

  const handleCopyGameId = () => {
    navigator.clipboard.writeText(String(match.gameId)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className={`smh-row ${statusClass}`}>
      <div className="smh-row-left">
        <div className="smh-champion">
          <div className="smh-champion-mask">
            <img className="smh-champion-icon" src={getChampIcon(match.championId)} alt="" />
          </div>
          <span className="smh-champion-level">{match.level}</span>
        </div>
        <div className="smh-row-info">
          <span className={`smh-status ${statusClass}`}>{statusText}</span>
          <span className="smh-gamemode">{match.queueName}</span>
          <div className="smh-spells">
            <img className="smh-spell" src={getSpellIcon(match.spell1Id)} alt="" />
            <img className="smh-spell" src={getSpellIcon(match.spell2Id)} alt="" />
            {match.perk0 > 0 && getPerkIcon(match.perk0) && (
              <>
                <img className="smh-perk smh-perk-primary" src={getPerkIcon(match.perk0)} alt="" />
                {match.perkSubStyle > 0 && getPerkStyleIcon(match.perkSubStyle) && (
                  <img className="smh-perk smh-perk-sub" src={getPerkStyleIcon(match.perkSubStyle)} alt="" />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="smh-row-center">
        <div className="smh-items">
          {match.items.map((id, idx) => (
            <div key={idx} className="smh-item-slot">
              {id > 0 && <img className="smh-item-icon" src={getItemIcon(id)} alt="" />}
            </div>
          ))}
        </div>
        <div className="smh-stats-line">
          <span className="smh-kda">
            <span className="smh-sprite-icon" style={{ WebkitMaskPositionY: '0%', width: '22px', height: '22px'}} />
            <span className={`smh-kda-num${match.kills >= match.deaths && match.kills >= match.assists ? ' smh-kda-highlight' : ''}`}>{match.kills}</span>
            {' / '}
            <span className={`smh-kda-num${match.deaths > match.kills && match.deaths > match.assists ? ' smh-kda-highlight' : ''}`}>{match.deaths}</span>
            {' / '}
            <span className={`smh-kda-num${match.assists > match.kills && match.assists > match.deaths ? ' smh-kda-highlight' : ''}`}>{match.assists}</span>
          </span>
          <span className="smh-cs">
            <span className="smh-stat-icon" style={{ WebkitMaskImage: 'url(/fe/lol-match-history/icon_minions.png)' }} />
            {match.cs}
          </span>
          <span className="smh-gold">
            <span className="smh-stat-icon" style={{ WebkitMaskImage: 'url(/fe/lol-match-history/icon_gold.png)' }} />
            {formatK(match.gold)}
          </span>
          <span className="smh-damage">
            🗡️ {formatK(match.damage)}
          </span>
        </div>
      </div>

      <div className="smh-row-right">
        <span className="smh-mapname">{match.mapName}</span>
        <span className="smh-date">{formatDate(match.gameCreation)}</span>
        <span className="smh-gameid" onClick={handleCopyGameId}>
          ID:{match.gameId}
          <span className={`smh-copy-icon ${copied ? 'smh-copied' : ''}`} />
        </span>
      </div>
    </div>
  )
}

export interface MatchHistoryModalProps {
  open: boolean
  onClose: () => void
  puuid: string
  playerName: string
  /** 可选：默认过滤的队列 ID，不传则不过滤 */
  queueId?: number
}

export function MatchHistoryModal({ open, onClose, puuid, playerName, queueId: defaultQueueId }: MatchHistoryModalProps) {
  const [allMatches, setAllMatches] = useState<MatchRowData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filterQueueId, setFilterQueueId] = useState<number>(defaultQueueId ?? 0)
  const [filterOpen, setFilterOpen] = useState(false)
  const loadedPuuid = useRef('')
  const listRef = useRef<HTMLDivElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)
  const GREEDY_FETCH = 100

  // 可玩队列缓存
  const [queueOptions, setQueueOptions] = useState<{ id: number; name: string }[]>([])
  useEffect(() => {
    setQueueOptions(getPlayableQueues())
  }, [])

  // 点击外部关闭下拉框
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // 过滤后的列表
  const matches = filterQueueId > 0
    ? allMatches.filter((m) => m.queueId === filterQueueId)
    : allMatches

  // 一次性贪婪拉取
  const loadAll = useCallback(async () => {
    setLoading(true)
    setError('')
    setAllMatches([])

    try {
      const resp = await lcu.getMatchHistory(puuid, 0, GREEDY_FETCH - 1)
      const games = resp.games?.games ?? []
      const parsed = games
        .map((g) => parseMatch(g, puuid))
        .filter((m): m is MatchRowData => m !== null)
      setAllMatches(parsed)
    } catch {
      setError('查询战绩失败')
    } finally {
      setLoading(false)
    }
  }, [puuid])

  // 初始加载 / 当 puuid 变化时重新加载
  useEffect(() => {
    if (!open || !puuid) return
    const key = `${puuid}-${defaultQueueId ?? 0}`
    if (key === loadedPuuid.current) return
    loadedPuuid.current = key
    setFilterQueueId(defaultQueueId ?? 0)
    loadAll()
  }, [open, puuid, defaultQueueId, loadAll])

  useEffect(() => {
    if (!open) loadedPuuid.current = ''
  }, [open])

  const currentFilterLabel = filterQueueId > 0
    ? (queueOptions.find(q => q.id === filterQueueId)?.name ?? getQueueName(filterQueueId))
    : '全部模式'

  return (
    <Modal open={open} onClose={onClose} width={860} height={620}>
      <div className="smh-container">
        <div className="smh-header">
          <span className="smh-title">❖ {playerName} 的近期战报</span>
          <div className="smh-filter" ref={filterRef}>
            <button
              className={`smh-filter-trigger${filterOpen ? ' smh-filter-trigger--open' : ''}`}
              onClick={() => setFilterOpen(!filterOpen)}
              type="button"
            >
              <span>{currentFilterLabel}</span>
              <svg className={`smh-filter-arrow${filterOpen ? ' smh-filter-arrow--open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {filterOpen && (
              <div className="smh-filter-dropdown">
                <button
                  className={`smh-filter-option${filterQueueId === 0 ? ' smh-filter-option--active' : ''}`}
                  onClick={() => { setFilterQueueId(0); setFilterOpen(false) }}
                  type="button"
                >
                  全部模式
                </button>
                {queueOptions.map((q) => (
                  <button
                    key={q.id}
                    className={`smh-filter-option${filterQueueId === q.id ? ' smh-filter-option--active' : ''}`}
                    onClick={() => { setFilterQueueId(q.id); setFilterOpen(false) }}
                    type="button"
                  >
                    {q.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="smh-list" ref={listRef}>
          {loading && <div className="smh-empty">加载中...</div>}
          {error && <div className="smh-empty smh-error">{error}</div>}
          {!loading && !error && matches.length === 0 && (
            <div className="smh-empty">{filterQueueId > 0 ? '该模式暂无战绩，试试切换模式' : '暂无战绩'}</div>
          )}
          {matches.map((m) => (
            <MatchRow key={m.gameId} match={m} />
          ))}
          {!loading && !error && matches.length > 0 && (
            <div className="smh-empty smh-no-more">— 共 {matches.length} 条战绩 —</div>
          )}
        </div>
      </div>
    </Modal>
  )
}

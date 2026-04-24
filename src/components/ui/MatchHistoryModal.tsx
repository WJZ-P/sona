import { useState, useEffect, useRef, useCallback } from 'react'
import { Modal } from '@/components/ui/Modal'
import { lcu, queueIdToTag } from '@/lib/lcu'
import { getChampIcon, getItemIcon, getSpellIcon, getPerkIcon, getPerkStyleIcon, getQueueName, getMapName, getPlayableQueues } from '@/lib/assets'
import type { SgpGameSummaryLol, SgpParticipantLol } from '@/types/sgp'
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

/** 从 SGP 对局数据中解析指定玩家的战绩行 */
function parseSgpMatch(game: SgpGameSummaryLol, puuid: string): MatchRowData | null {
  const json = game.json
  const participant = json.participants.find((p: SgpParticipantLol) => p.puuid === puuid)
  if (!participant) return null

  // mapId=12 的地图有多个皮肤变体，通过 gameModeMutators 区分
  let mapName = getMapName(json.mapId)
  if (json.mapId === 12) {
    const mutator = json.gameModeMutators?.[0]
    if (mutator === 'mapskin_ha_bilgewater') mapName = '屠夫之桥'
    else if (mutator === 'mapskin_map12_bloom') mapName = '莲华栈桥'
    else mapName = '嚎哭深渊'
  }

  // SGP 的符文结构：perks.styles[0] = 主系, styles[1] = 副系
  const primaryStyle = participant.perks?.styles?.[0]
  const subStyle = participant.perks?.styles?.[1]
  const perk0 = primaryStyle?.selections?.[0]?.perk ?? 0
  const perkSubStyle = subStyle?.style ?? 0

  return {
    gameId: json.gameId,
    queueId: json.queueId,
    win: participant.win,
    championId: participant.championId,
    level: participant.champLevel,
    kills: participant.kills,
    deaths: participant.deaths,
    assists: participant.assists,
    cs: participant.totalMinionsKilled + participant.neutralMinionsKilled,
    gold: participant.goldEarned,
    damage: participant.totalDamageDealtToChampions,
    queueName: getQueueName(json.queueId),
    mapName,
    spell1Id: participant.spell1Id,
    spell2Id: participant.spell2Id,
    perk0,
    perkSubStyle,
    items: [participant.item0, participant.item1, participant.item2, participant.item3, participant.item4, participant.item5, participant.item6],
    gameCreation: json.gameCreation,
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
            <span className="smh-sprite-icon" style={{ WebkitMaskImage: 'url(/fe/lol-match-history/icons.png)', WebkitMaskPositionY: '0%', width: '22px', height: '22px' }} />
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
          <span className={`smh-copy-icon ${copied ? 'smh-copied' : ''}`} style={{ WebkitMaskImage: 'url(/fe/lol-static-assets/images/game-id-clipboard-copy.svg)' }} />
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
  /** 可选：默认过滤的队列 ID，不传则查全部模式 */
  queueId?: number
}

/**
 * 战绩弹窗
 *
 * 使用 SGP 接口查询战绩，支持通过 tag 参数按队列模式服务端过滤。
 * 下拉切换模式时会重新请求 SGP，而非前端过滤。
 */
export function MatchHistoryModal({ open, onClose, puuid, playerName, queueId: defaultQueueId }: MatchHistoryModalProps) {
  const [matches, setMatches] = useState<MatchRowData[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [hasMore, setHasMore] = useState(true)
  const [filterQueueId, setFilterQueueId] = useState<number>(defaultQueueId ?? 0)
  const [filterOpen, setFilterOpen] = useState(false)
  const loadedKey = useRef('')
  const listRef = useRef<HTMLDivElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)
  const nextStartIndex = useRef(0)
  const cleanupScroll = useRef<(() => void) | null>(null)
  const INITIAL_FETCH = 100
  const MORE_FETCH = 20

  // 可玩队列缓存
  const [queueOptions, setQueueOptions] = useState<{ id: number; name: string }[]>([])
  useEffect(() => {
    const all = getPlayableQueues()
    setQueueOptions(all)
  }, [])

  // 点击外部关闭下拉框
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // 首次拉取战绩（SGP 服务端过滤）
  const loadMatches = useCallback(async (queueId: number) => {
    setLoading(true)
    setError('')
    setMatches([])
    setHasMore(true)
    nextStartIndex.current = 0

    try {
      const tag = queueIdToTag(queueId)
      const resp = await lcu.getSgpMatchHistory(puuid, {
        startIndex: 0,
        count: INITIAL_FETCH,
        tag: tag || undefined,
      })
      const games = resp.games ?? []
      const parsed = games
        .map((g) => parseSgpMatch(g, puuid))
        .filter((m): m is MatchRowData => m !== null)
      setMatches(parsed)
      nextStartIndex.current = INITIAL_FETCH
      // 返回数量少于请求数量，说明没有更多了
      if (games.length < INITIAL_FETCH) setHasMore(false)
    } catch {
      setError('查询战绩失败')
    } finally {
      setLoading(false)
    }
  }, [puuid])

  // 加载更多
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)

    try {
      const tag = queueIdToTag(filterQueueId)
      const resp = await lcu.getSgpMatchHistory(puuid, {
        startIndex: nextStartIndex.current,
        count: MORE_FETCH,
        tag: tag || undefined,
      })
      const games = resp.games ?? []
      const parsed = games
        .map((g) => parseSgpMatch(g, puuid))
        .filter((m): m is MatchRowData => m !== null)
      setMatches((prev) => [...prev, ...parsed])
      nextStartIndex.current += games.length
      if (games.length < MORE_FETCH) setHasMore(false)
    } catch {
      // 加载更多失败静默，不影响已展示数据
    } finally {
      setLoadingMore(false)
    }
  }, [puuid, filterQueueId, loadingMore, hasMore])

  // 用 ref 稳定回调，避免 loadMore 变化导致 scroll listener 反复重绑
  const loadMoreRef = useRef(loadMore)
  loadMoreRef.current = loadMore

  // 滚动到底部触发加载更多
  useEffect(() => {
    if (!open) return
    // 等 Modal DOM 渲染后再绑定
    const raf = requestAnimationFrame(() => {
      const el = listRef.current
      if (!el) return
      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = el
        if (scrollHeight - scrollTop - clientHeight < 60) {
          loadMoreRef.current()
        }
      }
      el.addEventListener('scroll', handleScroll, { passive: true })
      // 清理函数存在 closure 里
      cleanupScroll.current = () => el.removeEventListener('scroll', handleScroll)
    })

    return () => {
      cancelAnimationFrame(raf)
      cleanupScroll.current?.()
      cleanupScroll.current = null
    }
  }, [open])

  // 初始加载 / 当 puuid 或 defaultQueueId 变化时重新加载
  useEffect(() => {
    if (!open || !puuid) return
    const key = `${puuid}-${defaultQueueId ?? 0}`
    if (key === loadedKey.current) return
    loadedKey.current = key
    setFilterQueueId(defaultQueueId ?? 0)
    loadMatches(defaultQueueId ?? 0)
  }, [open, puuid, defaultQueueId, loadMatches])

  // 下拉切换模式 → 重新请求 SGP
  const handleFilterChange = (queueId: number) => {
    setFilterQueueId(queueId)
    setFilterOpen(false)
    loadedKey.current = `${puuid}-${queueId}`
    loadMatches(queueId)
  }

  useEffect(() => {
    if (!open) loadedKey.current = ''
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
                  onClick={() => handleFilterChange(0)}
                  type="button"
                >
                  全部模式
                </button>
                {queueOptions.map((q) => (
                  <button
                    key={q.id}
                    className={`smh-filter-option${filterQueueId === q.id ? ' smh-filter-option--active' : ''}`}
                    onClick={() => handleFilterChange(q.id)}
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
          {loadingMore && <div className="smh-empty">加载更多...</div>}
          {!loading && !error && matches.length > 0 && (
            <div className="smh-empty smh-no-more">
              {hasMore ? '↓ 下滑加载更多' : `— 共 ${matches.length} 条战绩 —`}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

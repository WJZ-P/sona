import { useState, useEffect, useCallback, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Modal } from '@/components/ui/Modal'
import { MatchHistoryModal } from '@/components/ui/MatchHistoryModal'
import { lcu, queueIdToTag } from '@/lib/lcu'
import { store } from '@/lib/store'
import { getChampIcon } from '@/lib/assets'
import { getRating } from '@/lib/features'
import type { GameflowSession, GameflowTeamPlayer } from '@/types/lcu'
import '@/styles/GameAnalysisModal.css'

// ==================== 类型 ====================

interface RecentGame {
  championId: number
  win: boolean
  kills: number
  deaths: number
  assists: number
}

const POSITION_ORDER: Record<string, number> = {
  top: 1,
  jungle: 2,
  mid: 3,
  bot: 4,
  utility: 5,
}

const sortTeamByPosition = (team: PlayerAnalysis[]): PlayerAnalysis[] => {
  return [...team].sort((a, b) => {
    const aPos = POSITION_ORDER[a.selectedPosition] ?? 99
    const bPos = POSITION_ORDER[b.selectedPosition] ?? 99
    return aPos - bPos
  })
}

interface PlayerAnalysis {
  puuid: string
  summonerId: number
  summonerName: string
  championId: number
  teamParticipantId: number
  selectedPosition: string
  winRate: number | null
  wins: number
  total: number
  kdaNum: number
  avgK: number
  avgD: number
  avgA: number
  rankText: string
  rankColor: string
  rating: string
  premadeGroup: string | null
  recentGames: RecentGame[]
  /** 主播模式下无法查询任何数据 */
  isBroadcaster: boolean
}

interface GameInfo {
  queueName: string
  gameMode: string
  mapName: string
  isBlueTeam: boolean
  queueId: number
}

// ==================== 段位颜色映射 ====================

const RANK_COLORS: Record<string, string> = {
  CHALLENGER: '#f1c40f',
  GRANDMASTER: '#e74c3c',
  MASTER: '#9b59b6',
  DIAMOND: '#3498db',
  EMERALD: '#00d084',
  PLATINUM: '#b8c4cc',
  GOLD: '#c8aa6e',
  SILVER: '#a09b8c',
  BRONZE: '#cd7f32',
  IRON: '#7e7e7e',
  UNRANKED: '#5c5b57',
}

const RANK_NAMES: Record<string, string> = {
  CHALLENGER: '最强王者',
  GRANDMASTER: '傲世宗师',
  MASTER: '超凡大师',
  DIAMOND: '璀璨钻石',
  EMERALD: '流光翡翠',
  PLATINUM: '华贵铂金',
  GOLD: '荣耀黄金',
  SILVER: '不屈白银',
  BRONZE: '英勇青铜',
  IRON: '坚韧黑铁',
}

const PREMADE_COLORS = ['#e8a424', '#4a9eff', '#5bbd72', '#e74c3c', '#c084fc']

/** 开黑组对应的卡片背景色（半透明） */
const PREMADE_BG_COLORS = [
  'rgba(232, 164, 36, 0.15)',
  'rgba(74, 158, 255, 0.15)',
  'rgba(91, 189, 114, 0.15)',
  'rgba(231, 76, 60, 0.15)',
  'rgba(192, 132, 252, 0.15)',
]

// ==================== 组件 ====================

export interface GameAnalysisModalProps {
  open: boolean
  onClose: () => void
  /** 调试用：传入 mock 数据直接展示，跳过 LCU 请求 */
  mockData?: {
    blueTeam: PlayerAnalysis[]
    redTeam: PlayerAnalysis[]
    gameInfo: GameInfo
  }
}

export function GameAnalysisModal({ open, onClose, mockData }: GameAnalysisModalProps) {
  const [blueTeam, setBlueTeam] = useState<PlayerAnalysis[]>([])
  const [redTeam, setRedTeam] = useState<PlayerAnalysis[]>([])
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [premadeGroups, setPremadeGroups] = useState<Map<string, string>>(new Map())

  const loadAnalysis = useCallback(async () => {
    setLoading(true)
    setError('')
    setBlueTeam([])
    setRedTeam([])
    setGameInfo(null)
    setPremadeGroups(new Map())

    // Mock 模式：直接使用传入的 mock 数据
    if (mockData) {
      setBlueTeam(sortTeamByPosition(mockData.blueTeam))
      setRedTeam(sortTeamByPosition(mockData.redTeam))
      setGameInfo(mockData.gameInfo)
      setLoading(false)
      return
    }

    try {
      const session = await lcu.getGameflowSession()
      const teamOne = session.gameData.teamOne ?? []
      const teamTwo = session.gameData.teamTwo ?? []

      // 判断自己所在队伍
      const localPuuid = (await lcu.getSummonerInfo()).puuid
      const isInTeamOne = teamOne.some(p => p.puuid === localPuuid)

      setGameInfo({
        queueName: session.gameData.queue.name,
        gameMode: session.gameData.queue.gameMode,
        mapName: session.map.name,
        isBlueTeam: isInTeamOne,
        queueId: session.gameData.queue.id,
      })

      // 开黑分组：按 teamParticipantId 聚合
      const groupIdMap = new Map<string, string>()
      const participantGroups = new Map<number, string[]>()
      const allPlayers = [...teamOne, ...teamTwo]
      for (const p of allPlayers) {
        const tid = p.teamParticipantId
        if (tid && tid > 0) {
          if (!participantGroups.has(tid)) participantGroups.set(tid, [])
          participantGroups.get(tid)!.push(p.puuid)
        }
      }
      let colorIdx = 0
      participantGroups.forEach((puuids, tid) => {
        if (puuids.length >= 2) {
          const color = PREMADE_COLORS[colorIdx % PREMADE_COLORS.length]
          colorIdx++
          const groupLabel = String.fromCharCode(65 + ((colorIdx - 1) % 26)) // A, B, C...
          for (const puuid of puuids) {
            groupIdMap.set(puuid, groupLabel)
          }
        }
      })
      setPremadeGroups(new Map(groupIdMap))

      // 获取队列 tag 用于战绩过滤
      const queueId = session.gameData.queue.id
      const tag = queueIdToTag(queueId)

      // 并行查询所有玩家数据
      const analyzeTeam = async (players: GameflowTeamPlayer[]): Promise<PlayerAnalysis[]> => {
        return Promise.all(players.map(async (p) => {
          const tid = p.teamParticipantId

          // 判断是否为主播模式（puuid 为空 或 nameVisibilityType 为 HIDDEN）
          const isBroadcaster = !p.puuid || p.nameVisibilityType === 'HIDDEN'

          // 默认占位
          const placeholder: PlayerAnalysis = {
            puuid: p.puuid,
            summonerId: p.summonerId,
            summonerName: isBroadcaster ? '未知' : p.summonerName,
            championId: p.championId,
            teamParticipantId: tid ?? 0,
            selectedPosition: p.selectedPosition ?? '',
            winRate: null,
            wins: 0,
            total: 0,
            kdaNum: 0,
            avgK: 0,
            avgD: 0,
            avgA: 0,
            rankText: isBroadcaster ? '' : '未定级',
            rankColor: isBroadcaster ? '' : RANK_COLORS.UNRANKED,
            rating: '',
            premadeGroup: groupIdMap.get(p.puuid) ?? null,
            recentGames: [],
            isBroadcaster,
          }

          // 主播模式：无法查询任何数据，直接返回占位
          if (isBroadcaster) return placeholder

          try {
            // summonerName 在 InProgress 阶段始终为空，需通过 puuid 查询获取 displayName
            const [summoner, ranked, sgpResp] = await Promise.all([
              lcu.getSummonerByPuuid(p.puuid).catch(() => null),
              lcu.getRankedStats(p.puuid).catch(() => null),
              lcu.getSgpMatchHistory(p.puuid, {
                startIndex: 0,
                count: store.get('gameAnalysisFetchCount') || 50,
                tag: tag || undefined,
              }).catch(() => null),
            ])

            const summonerName = summoner?.gameName ? `${summoner.gameName} #${summoner.tagLine}` : '未知'

            // 解析排位（取最高段位）
            let rankText = '未定级'
            let rankColor = RANK_COLORS.UNRANKED
            const TIER_ORDER = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER']
            const DIV_ORDER: Record<string, number> = { IV: 1, III: 2, II: 3, I: 4 }
            if (ranked && typeof ranked === 'object') {
              const r = ranked as Record<string, unknown>
              const queues = r.queueMap as Record<string, Record<string, unknown>> | undefined
              if (queues) {
                type QueueKey = 'RANKED_SOLO_5x5' | 'RANKED_FLEX_SR'
                const candidates: { key: QueueKey; label: string; tier: string; division: string }[] = []
                for (const [key, label] of [['RANKED_SOLO_5x5', '单双'], ['RANKED_FLEX_SR', '灵活']] as [QueueKey, string][]) {
                  const q = queues[key]
                  if (!q) continue
                  const tier = (q.tier as string) ?? ''
                  const division = (q.division as string) ?? ''
                  if (tier && tier !== 'UNRANKED') {
                    candidates.push({ key, label, tier, division })
                  }
                }
                if (candidates.length > 0) {
                  // 择最高段位
                  candidates.sort((a, b) => {
                    const ta = TIER_ORDER.indexOf(a.tier)
                    const tb = TIER_ORDER.indexOf(b.tier)
                    if (ta !== tb) return tb - ta
                    return (DIV_ORDER[a.division] ?? 0) - (DIV_ORDER[b.division] ?? 0)
                  })
                  const best = candidates[0]
                  rankText = (RANK_NAMES[best.tier] ?? best.tier) + (best.division && best.division !== 'NA' ? ` ${best.division}` : '') + ` ${best.label}`
                  rankColor = RANK_COLORS[best.tier] ?? RANK_COLORS.UNRANKED
                }
              }
            }

            // 解析战绩
            if (!sgpResp || !sgpResp.games?.length) {
              return { ...placeholder, summonerName, rankText, rankColor, rating: '' }
            }

            const games = sgpResp.games
            let wins = 0, totalK = 0, totalD = 0, totalA = 0
            const recentGames: RecentGame[] = []
            for (const game of games) {
              const participant = game.json.participants.find(pt => pt.puuid === p.puuid)
              if (!participant) continue
              if (participant.win) wins++
              totalK += participant.kills
              totalD += participant.deaths
              totalA += participant.assists
              if (recentGames.length < 5) {
                recentGames.push({
                  championId: participant.championId,
                  win: participant.win,
                  kills: participant.kills,
                  deaths: participant.deaths,
                  assists: participant.assists,
                })
              }
            }

            const total = games.length
            const winRate = total > 0 ? (wins / total) * 100 : 0
            const kdaNum = totalD === 0 ? totalK + totalA : (totalK + totalA) / totalD

            return {
              ...placeholder,
              summonerName,
              winRate,
              wins,
              total,
              kdaNum,
              avgK: total > 0 ? totalK / total : 0,
              avgD: total > 0 ? totalD / total : 0,
              avgA: total > 0 ? totalA / total : 0,
              rankText,
              rankColor,
              rating: getRating(winRate, kdaNum),
              recentGames,
            }
          } catch {
            return { ...placeholder, summonerName: '未知' }
          }
        }))
      }

      const [one, two] = await Promise.all([
        analyzeTeam(teamOne),
        analyzeTeam(teamTwo),
      ])

      setBlueTeam(sortTeamByPosition(isInTeamOne ? one : two))
      setRedTeam(sortTeamByPosition(isInTeamOne ? two : one))
    } catch (err) {
      setError('获取对局信息失败')
      console.error('[GameAnalysis] 加载失败:', err)
    } finally {
      setLoading(false)
    }
  }, [mockData])

  // 打开时加载
  useEffect(() => {
    if (open) loadAnalysis()
  }, [open, loadAnalysis])

  // 计算队伍平均胜率
  const avgWinRate = (team: PlayerAnalysis[]) => {
    const valid = team.filter(p => p.winRate != null)
    if (valid.length === 0) return null
    return Math.round(valid.reduce((sum, p) => sum + p.winRate!, 0) / valid.length)
  }

  const blueAvg = avgWinRate(blueTeam)
  const redAvg = avgWinRate(redTeam)

  return (
    <Modal open={open} onClose={onClose} width={1160} height={645} closable>
      <div className="sga-container">
        {/* Header */}
        <div className="sga-header">
          <div className="sga-header-left">
            <span className="sga-header-icon">❖</span>
            <span className="sga-header-title">对局分析</span>
          </div>
          {gameInfo && (
            <span className="sga-header-info">
              {gameInfo.mapName} · {gameInfo.queueName}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="sga-body">
          {loading && (
            <div className="sga-loading">
              <div className="sga-loading-spinner" />
              <span>正在分析对局数据...</span>
            </div>
          )}
          {error && <div className="sga-error">{error}</div>}
          {!loading && !error && (blueTeam.length > 0 || redTeam.length > 0) && (
            <div className="sga-teams">
              {/* 蓝色方 */}
              <div className="sga-team">
                <div className="sga-team-header sga-team-header--blue">
                  <span className="sga-team-name">蓝色方</span>
                  {blueAvg != null && (
                    <span className="sga-team-avg">
                      平均胜率 <span className={`sga-team-avg-num ${blueAvg > 50 ? 'sga-avg-green' : 'sga-avg-red'}`}>{blueAvg}%</span>
                    </span>
                  )}
                </div>
                <div className="sga-team-players">
                  {blueTeam.map((p, i) => (
                    <PlayerRow key={p.puuid || i} player={p} isRed={false} queueId={gameInfo?.queueId} />
                  ))}
                </div>
              </div>

              {/* 红色方 */}
              <div className="sga-team">
                <div className="sga-team-header sga-team-header--red">
                  <span className="sga-team-name">红色方</span>
                  {redAvg != null && (
                    <span className="sga-team-avg">
                      平均胜率 <span className={`sga-team-avg-num ${redAvg > 50 ? 'sga-avg-green' : 'sga-avg-red'}`}>{redAvg}%</span>
                    </span>
                  )}
                </div>
                <div className="sga-team-players">
                  {redTeam.map((p, i) => (
                    <PlayerRow key={p.puuid || i} player={p} isRed queueId={gameInfo?.queueId} />
                  ))}
                </div>
              </div>
            </div>
          )}
          {!loading && !error && blueTeam.length === 0 && redTeam.length === 0 && (
            <div className="sga-empty">暂无对局数据</div>
          )}
        </div>


      </div>
    </Modal>
  )
}

// ==================== 玩家行组件 ====================

function renderKdaValue(val: number, isMax: boolean) {
  const text = String(val)
  return isMax ? <span style={{ color: '#ff4444' }}>{text}</span> : text
}

function PlayerRow({ player, isRed, queueId }: { player: PlayerAnalysis; isRed: boolean; queueId?: number }) {
  const winRate = player.winRate
  // 胜率颜色
  const winColor = winRate != null
    ? (winRate >= 70 ? '#e8a424' : winRate >= 50 ? '#5bbd72' : winRate >= 30 ? '#e84057' : '#9b59b6')
    : '#5c5b57'
  const barColor = winRate != null
    ? (winRate >= 70 ? '#e8a424' : winRate >= 50 ? '#5bbd72' : winRate >= 30 ? '#e84057' : '#9b59b6')
    : '#3c2e16'
  const kdaStr = player.kdaNum >= 99 ? 'Perfect' : player.kdaNum.toFixed(1)
  const kdaColor = player.kdaNum >= 3 ? '#5bbd72' : '#e74c3c'

  // 开黑标记
  const premadeGroup = player.premadeGroup
  const premadeIdx = premadeGroup ? premadeGroup.charCodeAt(0) - 65 : -1
  const premadeColor = premadeIdx >= 0 ? (PREMADE_COLORS[premadeIdx] ?? '#c8aa6e') : undefined
  const premadeBg = premadeIdx >= 0 ? (PREMADE_BG_COLORS[premadeIdx] ?? undefined) : undefined

  // 主播模式不可点击
  const handleClick = () => {
    if (player.isBroadcaster || !player.puuid) return
    showMatchHistoryModal(player.puuid, player.summonerName || '???', queueId)
  }

  return (
    <div
      className={`sga-player-wrapper ${isRed ? 'sga-player-wrapper--red' : ''} ${player.isBroadcaster ? 'sga-player-wrapper--broadcaster' : ''}`}
      style={{
        ...(premadeBg ? { background: premadeBg } : {}),
        ...(player.isBroadcaster ? { cursor: 'default', opacity: 0.6 } : {}),
      }}
      onClick={handleClick}
    >
      <div
        className={`sga-player ${isRed ? 'sga-player--red' : 'sga-player--blue'}`}
      >
        {/* 英雄头像 */}
        <div className="sga-player-champ">
          {player.championId > 0 ? (
            <img className="sga-player-champ-img" src={getChampIcon(player.championId)} alt="" />
          ) : (
            <div className="sga-player-champ-placeholder" />
          )}
        </div>

        {/* 玩家信息 */}
        <div className="sga-player-info">
          <div className="sga-player-name-row">
            <span className="sga-player-name">{player.summonerName || '???'}</span>
            {player.isBroadcaster && (
              <span className="sga-broadcaster-badge">主播模式</span>
            )}
            {premadeGroup && (
              <span className="sga-premade-badge" style={{ background: premadeColor }}>
                {premadeGroup}
              </span>
            )}
          </div>
          <span className="sga-player-rank" style={{ color: player.rankColor || '#5c5b57' }}>
            {isRed && player.rating ? <span className="sga-player-rating">{player.rating} · </span> : null}
            {player.rankText || (player.isBroadcaster ? '主播模式' : '未定级')}
            {!isRed && player.rating ? <span className="sga-player-rating"> · {player.rating}</span> : null}
          </span>
        </div>

        {/* 胜率 */}
        <div className="sga-player-winrate">
          {winRate != null ? (
            <>
              <div className="sga-winrate-text">
                <span style={{ color: winColor, fontWeight: 'bold' }}>{winRate.toFixed(0)}%</span>
                <span className="sga-winrate-wl">
                <span className="sga-wl-win">{player.wins} 胜</span><span className="sga-wl-sep"> / </span><span className="sga-wl-loss">{player.total - player.wins} 负</span>
              </span>
              </div>
              <div className="sga-winrate-bar">
                <div className="sga-winrate-bar-fill" style={{ width: `${winRate}%`, background: barColor }} />
              </div>
            </>
          ) : (
            <span className="sga-no-data">{player.isBroadcaster ? '隐藏' : '无数据'}</span>
          )}
        </div>

        {/* KDA */}
        <div className="sga-player-kda">
          {winRate != null ? (
            <>
              <span style={{ color: kdaColor, fontWeight: 'bold' }}>{kdaStr}</span>
              <span className="sga-kda-label"> KDA</span>
            </>
          ) : (
            <span className="sga-no-data">—</span>
          )}
        </div>
      </div>

      {/* 近期战绩 */}
      {player.isBroadcaster ? (
        <div className="sga-recent sga-recent--broadcaster">
          <span className="sga-broadcaster-hint">玩家数据不可见</span>
        </div>
      ) : player.recentGames.length > 0 ? (
        <div className="sga-recent">
          {player.recentGames.map((g, i) => (
            <div key={i} className={`sga-recent-game ${g.win ? 'sga-recent-win' : 'sga-recent-loss'}`}>
              <img className="sga-recent-champ" src={getChampIcon(g.championId)} alt="" />
              <span className="sga-recent-kda">
                {renderKdaValue(g.kills, g.kills >= g.deaths && g.kills >= g.assists)}
                <span className="sga-kda-slash">/</span>
                {renderKdaValue(g.deaths, g.deaths >= g.kills && g.deaths >= g.assists)}
                <span className="sga-kda-slash">/</span>
                {renderKdaValue(g.assists, g.assists >= g.kills && g.assists >= g.deaths)}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

// ==================== 战绩弹窗独立渲染 ====================

let matchModalRoot: Root | null = null
let matchModalContainer: HTMLDivElement | null = null

function showMatchHistoryModal(puuid: string, playerName: string, queueId?: number) {
  if (!matchModalContainer) {
    matchModalContainer = document.createElement('div')
    matchModalContainer.id = 'sona-game-analysis-match-modal-root'
    document.body.appendChild(matchModalContainer)
    matchModalRoot = createRoot(matchModalContainer)
  }

  const close = () => {
    matchModalRoot?.render(
      createElement(MatchHistoryModal, { open: false, onClose: close, puuid: '', playerName: '' }),
    )
  }

  matchModalRoot!.render(
    createElement(MatchHistoryModal, { open: true, onClose: close, puuid, playerName, queueId }),
  )
}

import { useState, useEffect, useRef } from 'react'
import { Modal } from '@/components/ui/Modal'
import { lcu } from '@/lib/lcu'
import { getChampIcon, getItemIcon, getSpellIcon, getPerkIcon, getPerkStyleIcon, getQueueName, getMapName } from '@/lib/assets'
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
            <span className="smh-kda-num">{match.kills}</span>
            {' / '}
            <span className="smh-kda-num smh-deaths">{match.deaths}</span>
            {' / '}
            <span className="smh-kda-num">{match.assists}</span>
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
      </div>
    </div>
  )
}

export interface MatchHistoryModalProps {
  open: boolean
  onClose: () => void
  puuid: string
  playerName: string
}

export function MatchHistoryModal({ open, onClose, puuid, playerName }: MatchHistoryModalProps) {
  const [matches, setMatches] = useState<MatchRowData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const loadedPuuid = useRef('')

  useEffect(() => {
    if (!open || !puuid || puuid === loadedPuuid.current) return
    loadedPuuid.current = puuid
    setLoading(true)
    setError('')
    setMatches([])

    ;(async () => {
      try {
        const resp = await lcu.getMatchHistory(puuid, 0, 19)
        const games = resp.games?.games ?? []
        const parsed = games
          .map((g) => parseMatch(g, puuid))
          .filter((m): m is MatchRowData => m !== null)
        setMatches(parsed)
      } catch {
        setError('查询战绩失败')
      } finally {
        setLoading(false)
      }
    })()
  }, [open, puuid])

  useEffect(() => {
    if (!open) loadedPuuid.current = ''
  }, [open])

  return (
    <Modal open={open} onClose={onClose} width={860} height={620}>
      <div className="smh-container">
        <div className="smh-header">
          <span className="smh-title">❖ {playerName} 的近期战报</span>
        </div>
        <div className="smh-list">
          {loading && <div className="smh-empty">加载中...</div>}
          {error && <div className="smh-empty smh-error">{error}</div>}
          {!loading && !error && matches.length === 0 && (
            <div className="smh-empty">暂无战绩</div>
          )}
          {matches.map((m) => (
            <MatchRow key={m.gameId} match={m} />
          ))}
        </div>
      </div>
    </Modal>
  )
}

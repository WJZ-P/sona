import { useState, useEffect, useRef } from 'react'
import { Modal } from '@/components/ui/Modal'
import { lcu } from '@/lib/lcu'
import { getChampIcon, getItemIcon, getSpellIcon, getQueueName, getMapName } from '@/lib/assets'
import type { MatchGame } from '@/types/lcu'
import '@/styles/MatchHistoryModal.css'

// ==================== 数据解析 ====================

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatGold(gold: number): string {
  return gold >= 1000 ? `${(gold / 1000).toFixed(1)}k` : String(gold)
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
  duration: number
  queueName: string
  mapName: string
  spell1Id: number
  spell2Id: number
  items: number[]
  date: string
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
    duration: game.gameDuration,
    queueName: getQueueName(game.queueId),
    mapName,
    spell1Id: participant.spell1Id,
    spell2Id: participant.spell2Id,
    items: [s.item0, s.item1, s.item2, s.item3, s.item4, s.item5, s.item6],
    date: new Date(game.gameCreation).toLocaleDateString(),
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
        <div className="smh-kda-line">
          <span className="smh-kda">
            {match.kills} / <span className="smh-deaths">{match.deaths}</span> / {match.assists}
          </span>
          <span className="smh-cs">
            <span className="smh-stat-icon" style={{ backgroundImage: 'url(/fe/lol-match-history/icon_minions.png)' }} />
            {match.cs}
          </span>
          <span className="smh-gold">
            <span className="smh-stat-icon" style={{ backgroundImage: 'url(/fe/lol-match-history/icon_gold.png)' }} />
            {formatGold(match.gold)}
          </span>
        </div>
      </div>

      <div className="smh-row-right">
        <span className="smh-mapname">{match.mapName}</span>
        <span className="smh-duration">{formatDuration(match.duration)}</span>
        <span className="smh-date">{match.date}</span>
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

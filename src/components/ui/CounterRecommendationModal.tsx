import { Modal } from '@/components/ui/Modal'
import { getChampionById } from '@/lib/assets'
import '@/styles/CounterRecommendationModal.css'

export interface CounterRecommendationItem {
  championId: number
  score: number
  matchups: Array<{
    enemyId: number
    enemyWinRate: number
    play: number
  }>
}

export interface CounterRecommendationModalProps {
  open: boolean
  onClose: () => void
  enemyChampionId: number
  enemyLane: string
  suggestions: CounterRecommendationItem[]
}

function getChampionName(championId: number): string {
  const champion = getChampionById(championId)
  return champion ? `${champion.title}${champion.name ? ` ${champion.name}` : ''}` : `英雄${championId}`
}

function getChampionIcon(championId: number): string {
  return `/lol-game-data/assets/v1/champion-icons/${championId}.png`
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export function CounterRecommendationModal({
  open,
  onClose,
  enemyChampionId,
  enemyLane,
  suggestions,
}: CounterRecommendationModalProps) {
  const enemyName = enemyChampionId > 0 ? getChampionName(enemyChampionId) : '对方英雄'

  return (
    <Modal open={open} onClose={onClose} width={620} height="auto">
      <div className="scrm">
        <header className="scrm-header">
          <div className="scrm-enemy">
            {enemyChampionId > 0 && <img src={getChampionIcon(enemyChampionId)} alt="" />}
            <div>
              <div className="scrm-title">{enemyName}</div>
              <div className="scrm-subtitle">{enemyLane} Counter 推荐 · OP.GG global ranked</div>
            </div>
          </div>
        </header>

        <div className="scrm-list">
          {suggestions.length === 0 ? (
            <div className="scrm-empty">暂无可用推荐</div>
          ) : suggestions.map((suggestion, index) => {
            const matchup = suggestion.matchups
              .filter((item) => item.enemyId === enemyChampionId)
              .sort((left, right) => left.enemyWinRate - right.enemyWinRate)[0]
              ?? suggestion.matchups.sort((left, right) => left.enemyWinRate - right.enemyWinRate)[0]
            return (
              <div className="scrm-row" key={suggestion.championId}>
                <div className="scrm-rank">#{index + 1}</div>
                <img className="scrm-icon" src={getChampionIcon(suggestion.championId)} alt="" />
                <div className="scrm-main">
                  <div className="scrm-name">{getChampionName(suggestion.championId)}</div>
                  <div className="scrm-meta">
                    对方胜率 {matchup ? formatPercent(matchup.enemyWinRate) : '-'} · {matchup?.play ?? 0} 场
                  </div>
                </div>
                <div className="scrm-score">
                  <span>{formatPercent(Math.max(0, Math.min(1, suggestion.score)))}</span>
                  <small>压制</small>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}

import { logger } from '@/index'
import { lcu, LcuEventUri } from '@/lib/lcu'
import type { LCUEventMessage, GameflowPhase } from '@/lib/lcu'

// ==================== 对局结束自动点赞 ====================

const HONOR_CATEGORIES = ['HEART', 'COOL', 'SHOTCALLER'] as const

/** ballot 接口返回类型 */
interface HonorBallot {
  gameId: number
  eligibleAllies: Array<{
    botPlayer: boolean
    championId: number
    championName: string
    puuid: string
    summonerId: number
    role: string
  }>
  eligibleOpponents: Array<{
    botPlayer: boolean
    championId: number
    championName: string
    puuid: string
    summonerId: number
    role: string
  }>
  honoredPlayers: unknown[]
  votePool: {
    fromGamePlayed: number
    fromHighHonor: number
    fromRecentHonors: number
    fromRollover: number
    votes: number
  }
}

async function autoHonorTeammate() {
  try {
    const ballotRes = await fetch('/lol-honor-v2/v1/ballot')
    if (!ballotRes.ok) {
      logger.info('[AutoHonor] Hiện không có trận nào đang chờ vinh danh')
      return
    }

    const ballot = await ballotRes.json() as HonorBallot
    const allies = [...(ballot.eligibleAllies || [])]
    const opponents = [...(ballot.eligibleOpponents || [])]

    if (allies.length === 0 && opponents.length === 0) {
      logger.info('[AutoHonor] Không có người chơi nào để vinh danh')
      return
    }

    const votes = ballot.votePool?.votes ?? 1
    logger.info('[AutoHonor] Số phiếu khả dụng: %d, đồng đội: %d, đối thủ: %d', votes, allies.length, opponents.length)

    // 打散队友顺序，每人最多 1 票
    for (let i = allies.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[allies[i], allies[j]] = [allies[j], allies[i]]
    }
    // 打散对手顺序
    for (let i = opponents.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[opponents[i], opponents[j]] = [opponents[j], opponents[i]]
    }

    // 先给队友，多余的给对手
    const targets = [...allies, ...opponents].slice(0, votes)

    for (let i = 0; i < targets.length; i++) {
      const target = targets[i]
      const category = HONOR_CATEGORIES[Math.floor(Math.random() * HONOR_CATEGORIES.length)]
      const isAlly = i < allies.length

      const honorRes = await fetch('/lol-honor-v2/v1/honor-player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          puuid: target.puuid,
          summonerId: target.summonerId,
          gameId: ballot.gameId,
          honorCategory: category,
        }),
      })

      if (honorRes.ok) {
        logger.info('[AutoHonor] Phiếu thứ %d ✓ → [%s] đã trao cho %s%s', i + 1, category, target.championName, isAlly ? '' : ' (đối thủ)')
      } else {
        logger.error('[AutoHonor] Phiếu thứ %d thất bại:', i + 1, honorRes.status, await honorRes.text())
      }
    }

    logger.info('[AutoHonor] Tự động vinh danh hoàn tất, tổng cộng %d phiếu', targets.length)
  } catch (err) {
    logger.error('[AutoHonor] Lỗi tự động vinh danh:', err)
  }
}

let autoHonorUnsub: (() => void) | null = null

export function updateAutoHonor(enabled: boolean) {
  if (enabled && !autoHonorUnsub) {
    autoHonorUnsub = lcu.observe(LcuEventUri.GAMEFLOW_PHASE_CHANGE, (event: LCUEventMessage) => {
      const phase = event.data as GameflowPhase
      if (phase === 'PreEndOfGame') {
        autoHonorTeammate()
      }
    })
    logger.info('Auto honor enabled ✓')
  } else if (!enabled && autoHonorUnsub) {
    autoHonorUnsub()
    autoHonorUnsub = null
    logger.info('Auto honor disabled')
  }
}

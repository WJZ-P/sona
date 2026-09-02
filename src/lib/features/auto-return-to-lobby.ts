import { logger } from '@/index'
import { store } from '@/lib/store'
import { lcu, LcuEventUri } from '@/lib/lcu'
import type { LCUEventMessage, GameflowPhase } from '@/lib/lcu'
import { sleep } from '@/lib/utils'

// ==================== 对局结束自动返回房间 ====================

let autoReturnUnsub: (() => void) | null = null
let latestPhase: GameflowPhase | null = null
let queueAfterReturnPending = false
let lifecycleGeneration = 0

export function updateAutoReturnToLobby(enabled: boolean) {
  if (enabled && !autoReturnUnsub) {
    lifecycleGeneration += 1
    autoReturnUnsub = lcu.observe(LcuEventUri.GAMEFLOW_PHASE_CHANGE, async (event: LCUEventMessage) => {
      const phase = event.data as GameflowPhase
      const previousPhase = latestPhase
      latestPhase = phase
      if (previousPhase !== phase) lifecycleGeneration += 1

      if (phase === 'EndOfGame' && previousPhase !== 'EndOfGame') {
        queueAfterReturnPending = true

        if (!store.get('autoReturnToLobby')) {
          if (store.get('autoQueueAfterReturn')) {
            logger.info('[AutoReturn] 检测到对局结束，等待玩家手动返回房间后自动排队')
          }
          return
        }

        logger.info('[AutoReturn] 检测到对局结束，准备自动返回房间...')
        const operationGeneration = lifecycleGeneration

        // 延迟等待：刚进入结算时，服务器可能还在结算荣誉，给点缓冲时间
        await sleep(2000)

        // 玩家可能已手动返回，或等待期间关闭了自动返回；此时不再重复 playAgain。
        if (
          operationGeneration !== lifecycleGeneration
          || latestPhase !== 'EndOfGame'
          || !store.get('autoReturnToLobby')
        ) return

        try {
          await lcu.playAgain()
          logger.info('[AutoReturn] 已通过 play-again 重建房间（已保留原队伍结构）✓')
        } catch (err) {
          logger.error('[AutoReturn] 自动返回流程异常:', err)
        }
        return
      }

      if (phase === 'Lobby' && queueAfterReturnPending) {
        queueAfterReturnPending = false
        if (!store.get('autoQueueAfterReturn')) return

        logger.info('[AutoReturn] 已返回房间，准备启动匹配引擎...')
        const operationGeneration = lifecycleGeneration
        const MAX_RETRIES = 15
        for (let i = 1; i <= MAX_RETRIES; i++) {
          await sleep(1000)

          if (
            operationGeneration !== lifecycleGeneration
            || latestPhase !== 'Lobby'
            || !store.get('autoQueueAfterReturn')
          ) return

          try {
            await lcu.startMatchmaking()
            logger.info('[AutoReturn] 正在自动匹配... ✓ (第 %d 次尝试)', i)
            break
          } catch (err) {
            if (i < MAX_RETRIES) {
              logger.info('[AutoReturn] 开始排队失败（队友可能未就绪），1s 后重试... (%d/%d)', i, MAX_RETRIES)
            } else {
              logger.error('[AutoReturn] 开始排队失败，已达最大重试次数 %d:', MAX_RETRIES, err)
            }
          }
        }
      }
    })
    logger.info('Auto return/queue lifecycle enabled ✓')
  } else if (!enabled && autoReturnUnsub) {
    lifecycleGeneration += 1
    autoReturnUnsub()
    autoReturnUnsub = null
    latestPhase = null
    queueAfterReturnPending = false
    logger.info('Auto return/queue lifecycle disabled')
  } else if (!enabled) {
    lifecycleGeneration += 1
  }
}

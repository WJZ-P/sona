import { logger } from '@/index'
import { store } from '@/lib/store'
import { lcu, LcuEventUri } from '@/lib/lcu'
import type { LCUEventMessage, GameflowPhase } from '@/lib/lcu'
import { sleep } from '@/lib/utils'
import { getChampionById } from '@/lib/assets'

// ==================== 秒抢英雄 ====================

/**
 * 秒抢/预选成功后发送 celebration 消息到聊天框
 */
async function notifyAutoLockSuccess(championId: number, isLock: boolean) {
  const champInfo = getChampionById(championId)
  const champName = champInfo?.name || `英雄#${championId}`
  const action = isLock ? '自动锁定' : '自动预选'
  const msg = `${action}: ${champName}`
  try {
    await lcu.sendChampSelectMessage(msg, 'celebration')
  } catch {
    // 聊天室未就绪时静默忽略
  }
}

/**
 * 监听英雄选择的 actions 变化，当轮到自己的 pick action 处于 isInProgress 时秒锁
 * 仅在有 pick 动作的模式生效（排位/匹配等），大乱斗等无 pick 的模式不受影响
 */
async function tryAutoLockChampion() {
  const championId = store.get('autoLockChampionId')
  if (!championId || championId <= 0) {
    logger.warn('[AutoLock] 未设置目标英雄 ID')
    return
  }

  // 排位赛 BP 可能长达 5 分钟，300 次 × 1s 轮询足够覆盖
  for (let attempt = 0; attempt < 300; attempt++) {
    try {
      const session = await lcu.getChampSelectSession()

      const allActions = session.actions.flat(2)
      const myPickAction = allActions.find(
        (a) => a.actorCellId === session.localPlayerCellId && a.type === 'pick' && !a.completed
      )

      if (!myPickAction) {
        if (allActions.every((a) => a.type !== 'pick' || a.actorCellId !== session.localPlayerCellId)) {
          logger.info('[AutoLock] 当前模式无需选人（大乱斗等），跳过')
          return
        }
        await sleep(1000)
        continue
      }

      if (myPickAction.isInProgress) {
        // 关键：如果是 PLANNING（亮英雄）阶段，不能执行锁定，继续等待
        if (session.timer.phase === 'PLANNING') {
          await sleep(1000)
          continue
        }

        const instant = store.get('autoLockInstant')
        const actionUrl = `/lol-champ-select/v1/session/actions/${myPickAction.id}`

        if (instant) {
          logger.info('[AutoLock] 真正轮到选人了！秒锁英雄 ID: %d (actionId: %d)', championId, myPickAction.id)

          // 方案：PATCH 带 completed:true 一步到位完成选择+锁定
          const patchRes = await fetch(actionUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              actorCellId: session.localPlayerCellId,
              championId,
              completed: true,
              id: myPickAction.id,
              isAllyAction: true,
              type: 'pick',
            }),
          })

          if (patchRes.ok) {
            logger.info('[AutoLock] 秒锁成功 (PATCH completed:true) ✓')
            notifyAutoLockSuccess(championId, true)
          } else {
            // 备用方案：先 PATCH 选择，再 POST /select 锁定
            logger.warn('[AutoLock] PATCH 方案失败，尝试备用方案 /select')
            await fetch(actionUrl, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ championId }),
            })
            await sleep(200)
            const selectRes = await fetch(`${actionUrl}/select`, { method: 'POST' })
            if (selectRes.ok) {
              logger.info('[AutoLock] 秒锁成功 (select 备用) ✓')
              notifyAutoLockSuccess(championId, true)
            } else {
              logger.error('[AutoLock] 秒锁失败，可能英雄被抢或被 Ban')
            }
          }
        } else {
          logger.info('[AutoLock] 轮到选人，预选英雄 ID: %d（不锁定）', championId)
          await fetch(actionUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ championId }),
          })
          logger.info('[AutoLock] 预选成功 ✓')
          notifyAutoLockSuccess(championId, false)
        }

        return
      }

      await sleep(1000)
    } catch {
      // 轮询期间有人秒退（getChampSelectSession 会报 404），直接结束
      logger.error('[AutoLock] 轮询中断 (可能有人秒退了房间)')
      return
    }
  }

  logger.warn('[AutoLock] 等待超时 (5分钟)，未能秒锁')
}

let autoLockChampionUnsub: (() => void) | null = null

export function updateAutoLockChampion(enabled: boolean) {
  if (enabled && !autoLockChampionUnsub) {
    autoLockChampionUnsub = lcu.observe(LcuEventUri.GAMEFLOW_PHASE_CHANGE, (event: LCUEventMessage) => {
      const phase = event.data as GameflowPhase
      if (phase === 'ChampSelect') {
        tryAutoLockChampion()
      }
    })
    logger.info('Auto lock champion enabled ✓')
  } else if (!enabled && autoLockChampionUnsub) {
    autoLockChampionUnsub()
    autoLockChampionUnsub = null
    logger.info('Auto lock champion disabled')
  }
}

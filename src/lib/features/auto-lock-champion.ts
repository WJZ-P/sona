import { logger } from '@/index'
import { store } from '@/lib/store'
import { lcu, LcuEventUri } from '@/lib/lcu'
import type { LCUEventMessage, GameflowPhase, ChampSelectSession } from '@/lib/lcu'
import { sleep } from '@/lib/utils'
import { getChampionById, getQueue } from '@/lib/assets'
import { translate } from '@/i18n'

// ==================== 秒抢英雄 ====================

/**
 * 秒抢/预选成功后发送 celebration 消息到聊天框
 */
async function notifyAutoLockSuccess(championId: number, isLock: boolean) {
  const champInfo = getChampionById(championId)
  const champName = champInfo?.name || `英雄#${championId}`
  const action = isLock ? translate('champSelect.autoLock.lock') : translate('champSelect.autoLock.preselect')
  const msg = translate('champSelect.autoLock.message', { action, championName: champName })
  try {
    await lcu.sendChampSelectMessage(msg, 'celebration')
  } catch {
    // 聊天室未就绪时静默忽略
  }
}

function getConfiguredChampionIds(): number[] {
  return [...new Set(store.get('autoLockChampionIds').filter((id) => id > 0))]
}

function isRankedQueue(queueId: number): boolean {
  return getQueue(queueId)?.isRanked === true || queueId === 420 || queueId === 440
}

function normalizePosition(position: string | null | undefined): string {
  switch (position?.trim().toLowerCase()) {
    case 'middle': return 'mid'
    case 'bottom': return 'bot'
    case 'adc': return 'bot'
    case 'support': return 'utility'
    default: return position?.trim().toLowerCase() ?? ''
  }
}

function parseSelectedRoleAssignmentReason(selectedRole: string | null | undefined): string {
  const segments = selectedRole?.split('.') ?? []
  return segments.length === 4 ? segments[1].toUpperCase() : ''
}

async function getRankedAutofillReason(session: ChampSelectSession): Promise<string | null> {
  if (!isRankedQueue(session.queueId)) return null

  const localPlayer = session.myTeam.find((player) => player.cellId === session.localPlayerCellId)
  if (localPlayer?.isAutofilled === true) return 'champ-select:isAutofilled'

  // 部分客户端版本不回填 myTeam.isAutofilled。gameflow 的 selectedRole 格式为
  // CURRENT.ASSIGNMENT_REASON.PRIMARY.SECONDARY，可直接识别 AUTOFILL。
  const gameflow = await lcu.getGameflowSession().catch(() => null)
  if (gameflow) {
    const localPuuid = localPlayer?.puuid || (await lcu.getSummonerInfo().catch(() => null))?.puuid || ''
    const gameflowPlayer = [...(gameflow.gameData?.teamOne ?? []), ...(gameflow.gameData?.teamTwo ?? [])]
      .find((player) => player.puuid === localPuuid || player.summonerId === localPlayer?.summonerId)
    const assignmentReason = parseSelectedRoleAssignmentReason(gameflowPlayer?.selectedRole)
    if (assignmentReason === 'AUTOFILL') return 'gameflow:selectedRole'
  }

  // 最后一层兼容：将排位分配位置与排队前的两个偏好位置对比。只有两个偏好
  // 都是明确分路且实际位置都不匹配时才判为补位，避免拿不到数据时误停秒选。
  const lobby = await lcu.getLobby().catch(() => null)
  const assignedPosition = normalizePosition(localPlayer?.assignedPosition)
  const primary = normalizePosition(lobby?.localMember.firstPositionPreference)
  const secondary = normalizePosition(lobby?.localMember.secondPositionPreference)
  if (
    assignedPosition
    && primary
    && secondary
    && primary !== 'fill'
    && secondary !== 'fill'
    && assignedPosition !== primary
    && assignedPosition !== secondary
  ) {
    return `position-mismatch:${primary}/${secondary}->${assignedPosition}`
  }

  return null
}

async function getOptionalIdSet(loader: () => Promise<number[]>): Promise<Set<number> | null> {
  try {
    return new Set(await loader())
  } catch {
    return null
  }
}

function collectUnavailablePickIds(session: ChampSelectSession, actionChampionId: number): Set<number> {
  const unavailable = new Set<number>()

  session.actions.flat(2).forEach((action) => {
    if (action.type === 'ban' && action.completed && action.championId > 0) {
      unavailable.add(action.championId)
    }
  })

  ;[...session.bans.myTeamBans, ...session.bans.theirTeamBans].forEach((id) => {
    if (id > 0) unavailable.add(id)
  })

  if (!session.allowDuplicatePicks) {
    ;[...session.myTeam, ...session.theirTeam].forEach((player) => {
      if (player.championId > 0 && player.championId !== actionChampionId) {
        unavailable.add(player.championId)
      }
    })
  }

  session.myTeam.forEach((player) => {
    if (player.cellId !== session.localPlayerCellId && player.championPickIntent > 0) {
      unavailable.add(player.championPickIntent)
    }
  })

  return unavailable
}

async function resolveTargetChampionId(session: ChampSelectSession, actionChampionId = 0): Promise<number | null> {
  const championIds = getConfiguredChampionIds()
  if (championIds.length === 0) return null

  const [pickableIds, disabledIds] = await Promise.all([
    getOptionalIdSet(() => lcu.getPickableChampionIds()),
    getOptionalIdSet(() => lcu.getDisabledChampionIds()),
  ])
  const unavailableIds = collectUnavailablePickIds(session, actionChampionId)

  return championIds.find((id) => {
    if (unavailableIds.has(id)) return false
    if (disabledIds?.has(id)) return false
    if (pickableIds && !pickableIds.has(id)) return false
    return true
  }) ?? null
}

/**
 * 监听英雄选择的 actions 变化，当轮到自己的 pick action 处于 isInProgress 时秒锁
 * 仅在有 pick 动作的模式生效（排位/匹配等），大乱斗等无 pick 的模式不受影响
 */
async function tryAutoLockChampion() {
  if (getConfiguredChampionIds().length === 0) {
    logger.warn('[AutoLock] 未设置目标英雄队列')
    return
  }

  let lastPreselectedChampionId = 0
  let autofillCheckCompleted = false

  // 排位赛 BP 可能长达 5 分钟，300 次 × 1s 轮询足够覆盖
  for (let attempt = 0; attempt < 300; attempt++) {
    try {
      const session = await lcu.getChampSelectSession()

      // 排位补位时，实际分路不在玩家本来的选择内，继续执行预选或秒锁容易
      // 锁下不适合该位置的英雄。LCU 会在本地玩家条目上直接标记 isAutofilled。
      if (!autofillCheckCompleted) {
        const localPlayer = session.myTeam.find((player) => player.cellId === session.localPlayerCellId)
        // 排位的分路信息可能比首个 session 快照稍晚到达；等它就绪后只检查一次，
        // 避免在后续整段 BP 轮询里反复请求 gameflow / lobby。
        if (session.queueId <= 0 || (isRankedQueue(session.queueId) && !localPlayer?.assignedPosition)) {
          await sleep(250)
          continue
        }

        const autofillReason = await getRankedAutofillReason(session)
        if (autofillReason) {
          logger.info(
            '[AutoLock] 检测到本局被自动补位（assignedPosition=%s, reason=%s），跳过预选与秒锁',
            localPlayer?.assignedPosition || 'unknown',
            autofillReason,
          )
          return
        }
        autofillCheckCompleted = true
      }

      const allActions = session.actions.flat(2)
      if (allActions.length === 0) {
        await sleep(1000)
        continue
      }

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

      if (session.timer.phase === 'PLANNING') {
        const championId = await resolveTargetChampionId(session, myPickAction.championId)
        if (!championId) {
          await sleep(1000)
          continue
        }

        const localPlayer = session.myTeam.find((player) => player.cellId === session.localPlayerCellId)
        const alreadyPreselected = localPlayer?.championPickIntent === championId || myPickAction.championId === championId

        if (lastPreselectedChampionId !== championId && !alreadyPreselected) {
          const actionUrl = `/lol-champ-select/v1/session/actions/${myPickAction.id}`
          const patchRes = await fetch(actionUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ championId }),
          })

          if (patchRes.ok) {
            lastPreselectedChampionId = championId
            logger.info('[AutoLock] 预选阶段已亮出英雄 ID: %d (actionId: %d)', championId, myPickAction.id)
          } else {
            logger.warn('[AutoLock] 预选阶段亮英雄失败 (status=%d)', patchRes.status)
          }
        }

        await sleep(1000)
        continue
      }

      if (myPickAction.isInProgress) {
        const championId = await resolveTargetChampionId(session, myPickAction.championId)
        if (!championId) {
          logger.warn('[AutoLock] 目标英雄队列中没有当前可选英雄')
          return
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

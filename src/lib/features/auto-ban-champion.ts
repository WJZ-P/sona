import { logger } from '@/index'
import { store } from '@/lib/store'
import { lcu, LcuEventUri } from '@/lib/lcu'
import type { ChampSelectSession, GameflowPhase, LCUEventMessage } from '@/lib/lcu'
import { sleep } from '@/lib/utils'
import { getChampionById } from '@/lib/assets'
import { translate } from '@/i18n'

async function notifyAutoBanSuccess(championId: number) {
  const champInfo = getChampionById(championId)
  const champName = champInfo?.name || `英雄#${championId}`
  const msg = translate('champSelect.autoBan.message', { championName: champName })

  try {
    await lcu.sendChampSelectMessage(msg, 'celebration')
  } catch {
    // 聊天室未就绪时静默忽略。
  }
}

function getConfiguredChampionIds(): number[] {
  return [...new Set(store.get('autoBanChampionIds').filter((id) => id > 0))]
}

async function getOptionalIdSet(loader: () => Promise<number[]>): Promise<Set<number> | null> {
  try {
    return new Set(await loader())
  } catch {
    return null
  }
}

function collectUnavailableBanIds(session: ChampSelectSession): Set<number> {
  const unavailable = new Set<number>()

  session.actions.flat(2).forEach((action) => {
    if (action.type === 'ban' && action.completed && action.championId > 0) {
      unavailable.add(action.championId)
    }
  })

  ;[...session.bans.myTeamBans, ...session.bans.theirTeamBans].forEach((id) => {
    if (id > 0) unavailable.add(id)
  })

  session.myTeam.forEach((player) => {
    if (player.cellId !== session.localPlayerCellId && player.championPickIntent > 0) {
      unavailable.add(player.championPickIntent)
    }
  })

  return unavailable
}

async function resolveTargetChampionId(session: ChampSelectSession): Promise<number | null> {
  const championIds = getConfiguredChampionIds()
  if (championIds.length === 0) return null

  const [bannableIds, disabledIds] = await Promise.all([
    getOptionalIdSet(() => lcu.getBannableChampionIds()),
    getOptionalIdSet(() => lcu.getDisabledChampionIds()),
  ])
  const unavailableIds = collectUnavailableBanIds(session)

  return championIds.find((id) => {
    if (unavailableIds.has(id)) return false
    if (disabledIds?.has(id)) return false
    if (bannableIds && !bannableIds.has(id)) return false
    return true
  }) ?? null
}

async function tryAutoBanChampion() {
  if (getConfiguredChampionIds().length === 0) {
    logger.warn('[AutoBan] 未设置目标英雄队列')
    return
  }

  // Ban 阶段通常很早出现，保留 5 分钟轮询以兼容排位 BP 的完整流程。
  for (let attempt = 0; attempt < 300; attempt++) {
    try {
      const session = await lcu.getChampSelectSession()
      const allActions = session.actions.flat(2)
      if (allActions.length === 0) {
        await sleep(1000)
        continue
      }

      const myBanAction = allActions.find(
        (action) => action.actorCellId === session.localPlayerCellId && action.type === 'ban' && !action.completed,
      )

      if (!myBanAction) {
        if (allActions.every((action) => action.type !== 'ban' || action.actorCellId !== session.localPlayerCellId)) {
          logger.info('[AutoBan] 当前模式无需禁用英雄，跳过')
          return
        }

        await sleep(1000)
        continue
      }

      const selfSummoner = await lcu.getChampSelectSummoner(session.localPlayerCellId).catch(() => null)
      if (!selfSummoner) {
        await sleep(500)
        continue
      }

      if (!selfSummoner.isActingNow) {
        await sleep(500)
        continue
      }

      if (!myBanAction.isInProgress) {
        await sleep(500)
        continue
      }

      const championId = await resolveTargetChampionId(session)
      if (!championId) {
        logger.warn('[AutoBan] 目标英雄队列中没有当前可 Ban 英雄')
        return
      }

      const actionUrl = `/lol-champ-select/v1/session/actions/${myBanAction.id}`
      logger.info('[AutoBan] 轮到禁用英雄，目标英雄 ID: %d (actionId: %d)', championId, myBanAction.id)

      const patchRes = await fetch(actionUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          championId,
          completed: true,
          type: 'ban',
        }),
      })

      if (patchRes.ok) {
        logger.info('[AutoBan] 自动 Ban 成功 ✓')
        notifyAutoBanSuccess(championId)
      } else {
        logger.warn('[AutoBan] 自动 Ban 失败 (status=%d)，可能英雄不可 Ban 或已被处理', patchRes.status)
      }

      return
    } catch {
      logger.error('[AutoBan] 轮询中断 (可能有人秒退了房间)')
      return
    }
  }

  logger.warn('[AutoBan] 等待超时 (5分钟)，未能自动 Ban')
}

let autoBanChampionUnsub: (() => void) | null = null

export function updateAutoBanChampion(enabled: boolean) {
  if (enabled && !autoBanChampionUnsub) {
    autoBanChampionUnsub = lcu.observe(LcuEventUri.GAMEFLOW_PHASE_CHANGE, (event: LCUEventMessage) => {
      const phase = event.data as GameflowPhase
      if (phase === 'ChampSelect') {
        tryAutoBanChampion()
      }
    })
    logger.info('Auto ban champion enabled ✓')
  } else if (!enabled && autoBanChampionUnsub) {
    autoBanChampionUnsub()
    autoBanChampionUnsub = null
    logger.info('Auto ban champion disabled')
  }
}

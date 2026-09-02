import { logger } from '@/index'
import { store } from '@/lib/store'
import { lcu, LcuEventUri } from '@/lib/lcu'
import type { ChampSelectSession, GameflowPhase, LCUEventMessage } from '@/lib/lcu'
import type { ChampSelectAction } from '@/types/lcu'
import { sleep } from '@/lib/utils'
import { getChampionById, getQueue } from '@/lib/assets'
import { translate } from '@/i18n'

const AUTO_BAN_MAX_ATTEMPTS = 600
const AUTO_BAN_POLL_INTERVAL_MS = 500
const AUTO_BAN_CONFIRM_DELAYS = [80, 180]
const AUTO_BAN_WAIT_LOG_INTERVAL = 20

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

  const [rawBannableIds, disabledIds] = await Promise.all([
    getOptionalIdSet(() => lcu.getBannableChampionIds()),
    getOptionalIdSet(() => lcu.getDisabledChampionIds()),
  ])
  // Ban action 刚进入 isInProgress 时，这个接口偶尔会短暂返回空数组；空集合
  // 不应把全部候选都误判为不可 Ban，后续提交仍由 action API 做最终校验。
  const bannableIds = rawBannableIds && rawBannableIds.size > 0 ? rawBannableIds : null
  const unavailableIds = collectUnavailableBanIds(session)

  return championIds.find((id) => {
    if (unavailableIds.has(id)) return false
    if (disabledIds?.has(id)) return false
    if (bannableIds && !bannableIds.has(id)) return false
    return true
  }) ?? null
}

function findActionById(session: ChampSelectSession, actionId: number): ChampSelectAction | undefined {
  return session.actions.flat(2).find((action) => action.id === actionId)
}

async function confirmBanCompleted(actionId: number, championId: number): Promise<boolean | null> {
  let readSucceeded = false

  for (const delay of AUTO_BAN_CONFIRM_DELAYS) {
    await sleep(delay)
    try {
      const session = await lcu.getChampSelectSession()
      readSucceeded = true
      const action = findActionById(session, actionId)
      const appearsInBanList = session.bans.myTeamBans.includes(championId)
        || session.bans.theirTeamBans.includes(championId)
      if (appearsInBanList || (action?.completed && action.championId === championId)) return true
    } catch {
      // 会话刚结束或客户端短暂切换时保留 API 成功结果，不把回读失败当作 Ban 失败。
    }
  }

  return readSucceeded ? false : null
}

async function submitBanAction(action: ChampSelectAction, championId: number): Promise<boolean> {
  const actionUrl = `/lol-champ-select/v1/session/actions/${action.id}`

  try {
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
      const confirmed = await confirmBanCompleted(action.id, championId)
      if (confirmed !== false) return true
      logger.warn('[AutoBan] 单步 PATCH 返回成功但会话未确认完成，切换两步式兜底')
    } else {
      logger.warn('[AutoBan] 单步 PATCH 失败 (status=%d)，切换两步式兜底', patchRes.status)
    }
  } catch (error) {
    logger.warn('[AutoBan] 单步 PATCH 请求异常，切换两步式兜底:', error)
  }

  try {
    await lcu.lockChampion(championId, action.id)
    const confirmed = await confirmBanCompleted(action.id, championId)
    if (confirmed === false) {
      logger.warn('[AutoBan] 两步式提交完成，但会话仍未确认 Ban 结果')
      return false
    }
    return true
  } catch (error) {
    logger.warn('[AutoBan] 两步式提交失败:', error)
    return false
  }
}

let autoBanRunToken = 0
let autoBanRunPromise: Promise<void> | null = null

async function tryAutoBanChampion(runToken: number, reason: string) {
  if (getConfiguredChampionIds().length === 0) {
    logger.warn('[AutoBan] 未设置目标英雄队列')
    return
  }

  logger.info('[AutoBan] 开始监听本局 Ban action：%s', reason)

  // 选人事件负责及时唤醒，轮询负责兜住丢失的 WS 更新。
  for (let attempt = 0; attempt < AUTO_BAN_MAX_ATTEMPTS; attempt++) {
    if (runToken !== autoBanRunToken || !store.get('autoBanChampion')) return

    try {
      const session = await lcu.getChampSelectSession()
      const allActions = session.actions.flat(2)
      if (allActions.length === 0) {
        await sleep(AUTO_BAN_POLL_INTERVAL_MS)
        continue
      }

      const myBanActions = allActions.filter(
        (action) => action.actorCellId === session.localPlayerCellId && action.type === 'ban',
      )
      const myBanAction = myBanActions.find((action) => !action.completed)

      if (!myBanAction) {
        if (myBanActions.some((action) => action.completed)) {
          logger.info('[AutoBan] 本局 Ban action 已完成，无需重复处理')
          return
        }

        const queue = getQueue(session.queueId)
        if (queue?.gameTypeConfig.maxAllowableBans === 0 || session.benchEnabled) {
          logger.info('[AutoBan] 当前模式无需禁用英雄，跳过')
          return
        }

        if (session.timer.phase === 'FINALIZATION' || session.timer.phase === 'GAME_STARTING') {
          logger.info('[AutoBan] 选人已进入 %s，未发现本地 Ban action，停止等待', session.timer.phase)
          return
        }

        // 刚进入选人时，首批 session 更新可能只有 pick/reveal action，Ban action
        // 会稍后才补进来。这里不能提前结束，否则只能依赖玩家点击英雄产生下一次更新。
        if (attempt === 0 || attempt % AUTO_BAN_WAIT_LOG_INTERVAL === 0) {
          logger.debug(
            '[AutoBan] 等待本地 Ban action：attempt=%d phase=%s actions=%d numBans=%d',
            attempt + 1,
            session.timer.phase,
            allActions.length,
            session.bans.numBans,
          )
        }
        await sleep(AUTO_BAN_POLL_INTERVAL_MS)
        continue
      }

      if (!myBanAction.isInProgress) {
        await sleep(AUTO_BAN_POLL_INTERVAL_MS)
        continue
      }

      const championId = await resolveTargetChampionId(session)
      if (!championId) {
        // 可 Ban / 禁用英雄列表在阶段切换瞬间也可能尚未初始化，继续回读，
        // 避免必须手动点击任意英雄后才出现可用目标。
        if (attempt === 0 || attempt % AUTO_BAN_WAIT_LOG_INTERVAL === 0) {
          logger.warn('[AutoBan] 暂未解析到可 Ban 目标，等待客户端英雄列表就绪')
        }
        await sleep(AUTO_BAN_POLL_INTERVAL_MS)
        continue
      }

      logger.info('[AutoBan] 轮到禁用英雄，目标英雄 ID: %d (actionId: %d)', championId, myBanAction.id)

      if (await submitBanAction(myBanAction, championId)) {
        logger.info('[AutoBan] 自动 Ban 成功 ✓')
        void notifyAutoBanSuccess(championId)
        return
      } else {
        logger.warn('[AutoBan] 本次提交未完成，将等待下一次会话更新重试')
      }

      await sleep(AUTO_BAN_POLL_INTERVAL_MS)
    } catch (error) {
      const phase = await lcu.getGameflowPhase().catch(() => null)
      if (phase !== 'ChampSelect') {
        logger.info('[AutoBan] 已离开英雄选择，停止本局自动 Ban')
        return
      }
      if (attempt === 0 || attempt % 10 === 0) {
        logger.warn('[AutoBan] 会话读取暂时失败，继续重试:', error)
      }
      await sleep(AUTO_BAN_POLL_INTERVAL_MS)
    }
  }

  logger.warn('[AutoBan] 等待超时 (5分钟)，未能自动 Ban')
}

let autoBanChampionUnsub: (() => void) | null = null
let autoBanSessionUnsub: (() => void) | null = null

function stopAutoBanRun() {
  autoBanRunToken++
  autoBanRunPromise = null
}

function startAutoBanRun(reason: string) {
  if (!store.get('autoBanChampion') || autoBanRunPromise) return

  const runToken = ++autoBanRunToken
  const task = tryAutoBanChampion(runToken, reason)
  autoBanRunPromise = task
  void task.finally(() => {
    if (autoBanRunPromise === task) autoBanRunPromise = null
  })
}

function probeCurrentAutoBanPhase(reason: string) {
  void lcu.getGameflowPhase()
    .then((phase) => {
      if (phase === 'ChampSelect') startAutoBanRun(reason)
    })
    .catch((error) => logger.debug('[AutoBan] 当前阶段探测暂未就绪:', error))
}

export function updateAutoBanChampion(enabled: boolean) {
  if (enabled && !autoBanChampionUnsub) {
    autoBanChampionUnsub = lcu.observe(LcuEventUri.GAMEFLOW_PHASE_CHANGE, (event: LCUEventMessage) => {
      const phase = event.data as GameflowPhase
      if (phase === 'ChampSelect') {
        startAutoBanRun('gameflow-phase')
      } else {
        stopAutoBanRun()
      }
    })
    autoBanSessionUnsub = lcu.observe(LcuEventUri.CHAMP_SELECT, (event: LCUEventMessage) => {
      if (event.eventType === 'Delete') {
        stopAutoBanRun()
        return
      }
      startAutoBanRun('champ-select-session')
    })
    probeCurrentAutoBanPhase('enable-probe')
    logger.info('Auto ban champion enabled ✓')
  } else if (!enabled && autoBanChampionUnsub) {
    autoBanChampionUnsub()
    autoBanChampionUnsub = null
    autoBanSessionUnsub?.()
    autoBanSessionUnsub = null
    stopAutoBanRun()
    logger.info('Auto ban champion disabled')
  } else if (enabled) {
    probeCurrentAutoBanPhase('config-refresh')
  }
}

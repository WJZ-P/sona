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

/** 上一次目标解析失败的原因，变化时才打印，避免轮询刷屏。 */
let lastUnresolvedReason = ''

/**
 * 按配置顺序挑出第一个可 Ban 的英雄。
 *
 * 判定规则与 League Akari 的 getExpectedBans 一致：只看服务端的可 Ban 列表
 * （bannable-champion-ids）以及会话里的事实（已被 Ban、被队友预选）。
 * 不再使用 disabled-champion-ids：它是客户端给英雄格子置灰用的，跟随本地选择状态变化，
 * Ban 阶段刚开始时会把可 Ban 的英雄也算进去，导致要玩家先点一个英雄刷新状态后才会 Ban。
 */
async function resolveTargetChampionId(session: ChampSelectSession, banAction: ChampSelectAction): Promise<number | null> {
  const championIds = getConfiguredChampionIds()
  if (championIds.length === 0) return null

  const rawBannableIds = await getOptionalIdSet(() => lcu.getBannableChampionIds())
  // Ban 阶段刚开始时这个接口偶尔会短暂返回空数组；空集合不应把全部候选都误判为不可 Ban，
  // 提交时仍由 action API 做最终校验。
  const bannableIds = rawBannableIds && rawBannableIds.size > 0 ? rawBannableIds : null
  const unavailableIds = collectUnavailableBanIds(session)

  const reasons: string[] = []
  const target = championIds.find((id) => {
    // 自己这个 Ban action 当前悬停的英雄不应阻止自己 Ban 它。
    if (id === banAction.championId && !unavailableIds.has(id)) return true
    if (unavailableIds.has(id)) {
      reasons.push(`${id}:已被 Ban 或被队友预选`)
      return false
    }
    if (bannableIds && !bannableIds.has(id)) {
      reasons.push(`${id}:不在可 Ban 列表(共 ${bannableIds.size} 个)`)
      return false
    }
    return true
  }) ?? null

  const reason = target ? '' : reasons.join('，') || '没有候选英雄'
  if (reason && reason !== lastUnresolvedReason) {
    // 直接拼进字符串：客户端日志文件只记录格式串，不记录 %s 参数。
    logger.warn(`[AutoBan] 暂无可 Ban 目标：${reason}`)
  }
  lastUnresolvedReason = reason
  return target
}

/**
 * 判断是否已轮到本地 Ban action
 *
 * 判定规则与客户端 rcp-fe-lol-champ-select 的 sessionActions 保持一致：BAN_PICK 阶段里，
 * session.actions 中第一组还有未完成动作的 action set 就是当前动作组。客户端自身完全不读
 * isInProgress，界面已提示该 Ban 时这个字段不保证已经是 true，所以不能把它当作唯一依据，
 * 否则要等玩家点击英雄产生新的动作状态后才会开始 Ban。
 */
function isLocalBanTurn(session: ChampSelectSession, action: ChampSelectAction): boolean {
  // 排位等队列在 Ban 之前有「预选意向」(PLANNING) 阶段：服务端此时的当前动作组已经是
  // Ban 组，但提交 Ban 会被拒绝（UPDATE_ACTION_FAILURE）。自定义征召没有这个阶段，
  // 所以以前只有匹配/排位会出问题。
  if (session.timer.phase === 'PLANNING') return false
  if (action.isInProgress) return true
  if (session.timer.phase !== 'BAN_PICK') return false

  const currentActionSet = session.actions
    .map((actionSet) => actionSet.flat())
    .find((actionSet) => actionSet.some((item) => !item.completed))
  return currentActionSet?.some((item) => item.id === action.id) ?? false
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
/** 已经处理完（Ban 完成 / 本模式无需 Ban）的对局，避免每次选人事件都重新启动一轮检测。 */
let settledGameId = 0

function markSettled(session: ChampSelectSession) {
  if (session.gameId > 0) settledGameId = session.gameId
}

async function tryAutoBanChampion(runToken: number, reason: string) {
  if (getConfiguredChampionIds().length === 0) {
    logger.warn('[AutoBan] 未设置目标英雄队列')
    return
  }

  logger.info('[AutoBan] 开始监听本局 Ban action：%s', reason)
  lastUnresolvedReason = ''

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
          markSettled(session)
          return
        }

        const queue = getQueue(session.queueId)
        if (queue?.gameTypeConfig.maxAllowableBans === 0 || session.benchEnabled) {
          logger.info('[AutoBan] 当前模式无需禁用英雄，跳过')
          markSettled(session)
          return
        }

        if (session.timer.phase === 'FINALIZATION' || session.timer.phase === 'GAME_STARTING') {
          logger.info('[AutoBan] 选人已进入 %s，未发现本地 Ban action，停止等待', session.timer.phase)
          markSettled(session)
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

      if (!isLocalBanTurn(session, myBanAction)) {
        await sleep(AUTO_BAN_POLL_INTERVAL_MS)
        continue
      }

      const championId = await resolveTargetChampionId(session, myBanAction)
      if (!championId) {
        // 可 Ban 列表在阶段切换瞬间也可能尚未初始化，继续轮询；原因已在 resolveTargetChampionId 中打印。
        await sleep(AUTO_BAN_POLL_INTERVAL_MS)
        continue
      }

      logger.info(
        `[AutoBan] 轮到禁用英雄，目标英雄 ID: ${championId} (actionId: ${myBanAction.id}, isInProgress: ${myBanAction.isInProgress}, phase: ${session.timer.phase})`,
      )

      if (await submitBanAction(myBanAction, championId)) {
        logger.info('[AutoBan] 自动 Ban 成功 ✓')
        void notifyAutoBanSuccess(championId)
        markSettled(session)
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

function startAutoBanRun(reason: string, gameId = 0) {
  if (!store.get('autoBanChampion') || autoBanRunPromise) return
  if (gameId > 0 && gameId === settledGameId) return

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
        settledGameId = 0
        stopAutoBanRun()
      }
    })
    autoBanSessionUnsub = lcu.observe(LcuEventUri.CHAMP_SELECT, (event: LCUEventMessage) => {
      if (event.eventType === 'Delete') {
        stopAutoBanRun()
        return
      }
      startAutoBanRun('champ-select-session', (event.data as ChampSelectSession | null)?.gameId ?? 0)
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

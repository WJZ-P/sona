import { logger } from '@/index'
import { store } from '@/lib/store'
import { lcu, LcuEventUri } from '@/lib/lcu'
import type { LCUEventMessage, GameflowPhase, ReadyCheck } from '@/lib/lcu'

// ==================== 自动接受对局 ====================

const AUTO_ACCEPT_MAX_DELAY_MS = 15000

let autoAcceptUnsub: (() => void) | null = null
/** ready-check 事件取消订阅，用于监听玩家自己的拒绝（兜底保护） */
let readyCheckUnsub: (() => void) | null = null
/** 记录当次 ReadyCheck 已调度的定时器，phase 离开 ReadyCheck 要清掉防止误触 */
let autoAcceptTimer: ReturnType<typeof setTimeout> | null = null
/**
 * 本次 ReadyCheck 是否已经自动接受过。
 *
 * ReadyCheck 期间相关事件会持续推送，若每次都接受，玩家手动拒绝后会被立刻再次接受，
 * 与"允许接受后再拒绝"功能冲突。这里只在进入 ReadyCheck 时接受一次，
 * 离开 ReadyCheck（拒绝/超时/进入选人）后重置，使下一次匹配仍能自动接受。
 */
let hasAcceptedThisReadyCheck = false
/**
 * 用户在本次匹配会话中是否主动拒绝过。
 *
 * 玩家点拒绝后，客户端往往会立刻重新匹配并再次弹 ReadyCheck，
 * 若此时自动接受又秒接，玩家的"拒绝"意图会被反复覆盖（拒了又被接）。
 * 因此玩家一旦主动拒绝就暂停自动接受，直到玩家回到大厅（Lobby/None）
 * 重新发起匹配、或主动接受时再恢复。由"允许接受后再拒绝"功能通知。
 */
let userDeclinedThisSession = false

/**
 * 计算本次 accept 的延迟毫秒数：
 *   - minMs / maxMs 任一不是有限数、负数、或 max > 15000 → 视为无延迟（秒接）
 *   - min > max → 非法，秒接
 *   - min === max → 固定延迟
 *   - 否则 [min, max] 闭区间随机
 *
 * 这里严格校验：哪怕是"玩家手滑输了 99999"这种也不会真睡那么久，直接秒接兜底。
 */
function computeAcceptDelayMs(): number {
  const minMs = store.get('autoAcceptDelayMin')
  const maxMs = store.get('autoAcceptDelayMax')

  const isValidRange =
    Number.isFinite(minMs) && Number.isFinite(maxMs) &&
    minMs >= 0 && maxMs >= 0 &&
    maxMs <= AUTO_ACCEPT_MAX_DELAY_MS &&
    minMs <= maxMs &&
    maxMs > 0  // 全 0 = 用户没配 = 秒接

  if (!isValidRange) return 0

  // [min, max] 均匀随机
  return Math.round(minMs + Math.random() * (maxMs - minMs))
}

function scheduleAcceptMatch() {
  // 清理可能残留的上次调度（防御性）
  if (autoAcceptTimer) {
    clearTimeout(autoAcceptTimer)
    autoAcceptTimer = null
  }

  const delayMs = computeAcceptDelayMs()

  const doAccept = () => {
    autoAcceptTimer = null
    lcu.acceptMatch()
      .then(() => logger.info('Auto accepted match ✓ (delay=%dms)', delayMs))
      .catch((err) => logger.error('Auto accept failed:', err))
  }

  if (delayMs === 0) {
    doAccept()
  } else {
    logger.info('[AutoAccept] Chấp nhận sau độ trễ ngẫu nhiên %dms', delayMs)
    autoAcceptTimer = setTimeout(doAccept, delayMs)
  }
}

/**
 * 因玩家主动拒绝而暂停自动接受：
 *   - 同步取消待执行的延迟接受（关键：哪怕延迟还没到也立刻撤销）
 *   - 标记本轮已处理 + 本会话暂停，避免被重新匹配后秒接
 */
function suppressAutoAcceptForDecline(source: string) {
  const hadPending = autoAcceptTimer != null
  if (autoAcceptTimer) {
    clearTimeout(autoAcceptTimer)
    autoAcceptTimer = null
  }

  // 已处于暂停且无待执行定时器时不重复打日志
  if (userDeclinedThisSession && !hadPending) return

  userDeclinedThisSession = true
  hasAcceptedThisReadyCheck = true
  logger.info('[AutoAccept] Người chơi chủ động từ chối (%s), đã hủy lần chấp nhận đang chờ và tạm dừng tự động chấp nhận cho đến khi về sảnh', source)
}

/**
 * 通知：玩家主动拒绝了对局（来自"允许接受后再拒绝"功能的点击）。
 * 同步取消尚未触发的延迟接受，防止"延迟 3s、玩家 2s 点拒绝却仍被接受"。
 */
export function notifyUserManuallyDeclined() {
  suppressAutoAcceptForDecline('click')
}

/**
 * 通知：玩家主动接受了对局（来自"允许接受后再拒绝"功能）。
 * 解除"主动拒绝"暂停，使后续仍可自动接受。
 */
export function notifyUserManuallyAccepted() {
  if (userDeclinedThisSession) {
    userDeclinedThisSession = false
    logger.info('[AutoAccept] Phát hiện người chơi chủ động chấp nhận, tiếp tục tự động chấp nhận')
  }
}

export function updateAutoAccept(enabled: boolean) {
  if (enabled && !autoAcceptUnsub) {
    autoAcceptUnsub = lcu.observe(LcuEventUri.GAMEFLOW_PHASE_CHANGE, (event: LCUEventMessage) => {
      const phase = event.data as GameflowPhase
      if (phase === 'ReadyCheck') {
        // 每次 ReadyCheck 只接受一次；玩家本会话已主动拒绝过则不再自动接受
        if (!hasAcceptedThisReadyCheck && !userDeclinedThisSession) {
          hasAcceptedThisReadyCheck = true
          scheduleAcceptMatch()
        }
      } else {
        // 离开 ReadyCheck（玩家手动拒绝 / 自动超时 / 队友拒绝 / 进入选人）时重置单次标志，
        // 让下一次匹配仍可自动接受；并清掉可能残留的延迟定时器防止误触
        hasAcceptedThisReadyCheck = false
        if (autoAcceptTimer) {
          clearTimeout(autoAcceptTimer)
          autoAcceptTimer = null
        }
        // 回到大厅 / 空闲 = 新的匹配会话，解除"主动拒绝"暂停
        if (phase === 'Lobby' || phase === 'None') {
          userDeclinedThisSession = false
        }
      }
    })
    // 兜底保护：不依赖"允许接受后再拒绝"功能，只要本玩家响应变 Declined
    // （原生按钮 / 我们的按钮 / 任何途径），立即取消待执行接受并暂停
    readyCheckUnsub = lcu.observe(LcuEventUri.READY_CHECK, (event: LCUEventMessage) => {
      const rc = event.data as ReadyCheck | null
      if (rc?.playerResponse === 'Declined') {
        suppressAutoAcceptForDecline('ready-check')
      }
    })
    logger.info('Auto accept enabled ✓')
  } else if (!enabled && autoAcceptUnsub) {
    autoAcceptUnsub()
    autoAcceptUnsub = null
    if (readyCheckUnsub) {
      readyCheckUnsub()
      readyCheckUnsub = null
    }
    hasAcceptedThisReadyCheck = false
    userDeclinedThisSession = false
    if (autoAcceptTimer) {
      clearTimeout(autoAcceptTimer)
      autoAcceptTimer = null
    }
    logger.info('Auto accept disabled')
  }
}

/**
 * 允许接受对局后再拒绝
 *
 * 解禁 ReadyCheck 的接受/拒绝按钮，让玩家在已响应后仍能改变主意，且与"自动接受"不冲突。
 *
 * 设计要点：
 *   1. 状态来源——监听 /lol-matchmaking/v1/ready-check（LcuEventUri.READY_CHECK）ws 事件，
 *      读取 playerResponse（None/Accepted/Declined），即状态机上的 ready-check-data-player-response。
 *   2. 定向解禁——已接受(Accepted)只放开"拒绝"，已拒绝(Declined)只放开"接受"，
 *      未响应(None)保持原生（两个本就可点），避免"两个同时亮"的尴尬。
 *   3. 触发方式——纯事件驱动：READY_CHECK 事件在 15s 内每秒推送，每次推送都按最新状态解禁，
 *      不依赖 DOM 变化（置灰是 attribute/shadowRoot 变化，MutationObserver 时序不稳易漏触发）；
 *      正式进入 ChampSelect（或离开 ReadyCheck）即清理。
 *   4. 点击接管——按钮原生 handler 在已响应后不再处理点击，故给两个按钮各补一个 click，
 *      直接调用 lcu.acceptMatch()/declineMatch()，并通知自动接受模块（拒绝暂停、接受恢复）。
 */

import { logger } from '@/index'
import { lcu, LcuEventUri } from '@/lib/lcu'
import type { ReadyCheck, LCUEventMessage, GameflowPhase } from '@/lib/lcu'
import { notifyUserManuallyAccepted, notifyUserManuallyDeclined } from '@/lib/features/auto-accept'

const BUTTONS_CONTAINER_SELECTOR = '.ready-check-buttons-element'
const ACCEPT_BUTTON_SELECTOR = '.ready-check-button-accept'
const DECLINE_BUTTON_SELECTOR = '.ready-check-button-decline'
/** shadowRoot 内需要解禁的元素 */
const SHADOW_BUTTON_SELECTOR = '.lol-uikit-flat-button-wrapper, .lol-uikit-flat-button'
/** 已绑定点击事件的标记，避免重复绑定 */
const CLICK_BOUND_ATTR = 'data-sona-readycheck-bound'

type PlayerResponse = ReadyCheck['playerResponse']

/** ReadyCheck 阶段内的轮询间隔（ReadyCheck 仅 ~15s，轮询不会过久） */
const POLL_INTERVAL_MS = 300

/** 当前玩家在本次 ReadyCheck 的响应，决定解禁哪个按钮 */
let currentResponse: PlayerResponse = 'None'
/** gameflow 阶段订阅（离开 ReadyCheck 时清理） */
let phaseUnsub: (() => void) | null = null
/** ready-check 状态订阅（WS 快速通道：更新 playerResponse 并解禁） */
let readyCheckUnsub: (() => void) | null = null
/** ReadyCheck 阶段内的轮询定时器（兜底：首次冷启动 WS 订阅不生效时仍能工作） */
let pollTimer: ReturnType<typeof setInterval> | null = null

// ==================== 定向解禁 ====================

/** 解禁单个按钮：移除 light DOM 的 *-disabled 与 shadowRoot 内的 .disabled，返回移除数量 */
function unlockButton(container: Element, target: 'accept' | 'decline'): number {
  const el = container.querySelector(target === 'accept' ? ACCEPT_BUTTON_SELECTOR : DECLINE_BUTTON_SELECTOR)
  if (!el) return 0

  let removed = 0

  // light DOM：移除形如 ready-check-button-xxx-disabled 的灰态 class
  Array.from(el.classList).forEach((cls) => {
    if (cls.endsWith('-disabled')) {
      el.classList.remove(cls)
      removed++
    }
  })

  // shadowRoot：移除 wrapper / button 上的 disabled
  el.querySelectorAll('lol-uikit-flat-button').forEach((host) => {
    const root = (host as HTMLElement).shadowRoot
    if (!root) return
    root.querySelectorAll(SHADOW_BUTTON_SELECTOR).forEach((b) => {
      if (b.classList.contains('disabled')) {
        b.classList.remove('disabled')
        removed++
      }
    })
  })

  return removed
}

/**
 * 根据当前响应解禁"相反"的按钮：
 *   - 已接受 → 放开拒绝按钮
 *   - 已拒绝 → 放开接受按钮
 *   - 未响应 → 保持原生（不干预）
 */
function applyUnlock() {
  const container = document.querySelector(BUTTONS_CONTAINER_SELECTOR)
  if (!container) return

  if (currentResponse === 'Accepted') {
    const removed = unlockButton(container, 'decline')
    // 仅在真正移除时打日志，避免轮询每 300ms 刷屏
    if (removed > 0) logger.info('[ReadyCheckControl] Đã chấp nhận → Mở lại nút từ chối, xóa dấu vô hiệu hóa ở %d vị trí', removed)
  } else if (currentResponse === 'Declined') {
    const removed = unlockButton(container, 'accept')
    if (removed > 0) logger.info('[ReadyCheckControl] Đã từ chối → Mở lại nút chấp nhận, xóa dấu vô hiệu hóa ở %d vị trí', removed)
  }
}

// ==================== 点击事件接管 ====================

/** 记录已绑定的元素与 handler，停止时统一解绑 */
const boundClicks: Array<{ el: Element; handler: EventListener }> = []

function bindClickHandler(el: Element | null, kind: 'accept' | 'decline') {
  if (!el || el.hasAttribute(CLICK_BOUND_ATTR)) return
  el.setAttribute(CLICK_BOUND_ATTR, 'true')

  const handler: EventListener = () => {
    // 先通知自动接受：玩家手动操作优先，拒绝则暂停、接受则恢复自动接受
    if (kind === 'accept') {
      notifyUserManuallyAccepted()
    } else {
      notifyUserManuallyDeclined()
    }

    // 不拦截默认/冒泡，让原生逻辑（若仍有效）照常运行，我们只额外补一刀
    const action = kind === 'accept' ? lcu.acceptMatch() : lcu.declineMatch()
    action
      .then(() => logger.info('[ReadyCheckControl] Đã chủ động %s trận đấu ✓', kind === 'accept' ? 'chấp nhận' : 'từ chối'))
      .catch((err) => logger.error('[ReadyCheckControl] Gọi %s thất bại:', kind, err))
  }

  el.addEventListener('click', handler)
  boundClicks.push({ el, handler })
}

function bindClickHandlers(container: Element) {
  bindClickHandler(container.querySelector(ACCEPT_BUTTON_SELECTOR), 'accept')
  bindClickHandler(container.querySelector(DECLINE_BUTTON_SELECTOR), 'decline')
}

function unbindClickHandlers() {
  for (const { el, handler } of boundClicks) {
    el.removeEventListener('click', handler)
    el.removeAttribute(CLICK_BOUND_ATTR)
  }
  boundClicks.length = 0
}

// ==================== 触发与清理 ====================

/**
 * 确保接受/拒绝按钮已接管点击（幂等）。
 * 这是与"解禁"完全独立的职责——只负责绑定点击转发到 LCU 接口，
 * 不参与、也不触发任何解禁逻辑。
 */
function ensureClickHandlers() {
  const container = document.querySelector(BUTTONS_CONTAINER_SELECTOR)
  if (!container) return
  bindClickHandlers(container)
}

/**
 * 按最新玩家响应刷新：更新状态 + 接管点击 + 定向解禁。
 * WS 事件与轮询共用此入口。
 */
function refreshFromResponse(next: PlayerResponse) {
  if (next !== currentResponse) {
    currentResponse = next
    logger.info('[ReadyCheckControl] Trạng thái phản hồi của người chơi thay đổi → %s', currentResponse)
  }
  ensureClickHandlers()
  applyUnlock()
}

/** 轮询一次 ready-check 状态（REST，HTTP 请求不受 WS 订阅时机影响，冷启动也可用） */
async function pollReadyCheckOnce() {
  try {
    const rc = await lcu.getReadyCheck()
    refreshFromResponse(rc?.playerResponse ?? 'None')
  } catch {
    // ReadyCheck 不存在（如刚离开）等错误忽略
  }
}

/** 进入 ReadyCheck：启动轮询（兜底首次冷启动 WS 订阅不生效的情况） */
function startPolling() {
  if (pollTimer) return
  logger.info('[ReadyCheckControl] Vào ReadyCheck, bắt đầu thăm dò để mở lại nút (mỗi %dms)', POLL_INTERVAL_MS)
  void pollReadyCheckOnce()
  pollTimer = setInterval(() => void pollReadyCheckOnce(), POLL_INTERVAL_MS)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

/** 离开 ReadyCheck（进入 ChampSelect 等）时清理：停轮询、解绑点击、重置状态 */
function cleanup() {
  stopPolling()
  unbindClickHandlers()
  currentResponse = 'None'
}

// ==================== 生命周期 ====================

let registered = false

export function updateAllowDeclineAfterAccept(enabled: boolean) {
  logger.info('[ReadyCheckControl] Gọi updateAllowDeclineAfterAccept → enabled=%s, registered=%s', enabled, registered)
  if (enabled && !registered) {
    registered = true
    currentResponse = 'None'

    // WS 快速通道：READY_CHECK 事件可用时（热重启后）即时解禁，更灵敏
    readyCheckUnsub = lcu.observe(LcuEventUri.READY_CHECK, (event: LCUEventMessage) => {
      const rc = event.data as ReadyCheck | null
      refreshFromResponse(rc?.playerResponse ?? 'None')
    })

    // 可靠驱动：gameflow 阶段（冷启动也稳）。进入 ReadyCheck 启动轮询，离开即清理
    phaseUnsub = lcu.observe(LcuEventUri.GAMEFLOW_PHASE_CHANGE, (event: LCUEventMessage) => {
      const phase = event.data as GameflowPhase
      logger.info('[ReadyCheckControl] Giai đoạn gameflow thay đổi → %s', phase)
      if (phase === 'ReadyCheck') {
        startPolling()
      } else {
        cleanup()
      }
    })

    // 插件启用时可能已处于 ReadyCheck（热重启场景），立即补一次
    lcu.getGameflowPhase().then((phase) => {
      if (phase === 'ReadyCheck') startPolling()
    }).catch(() => { /* ignore */ })

    logger.info('[ReadyCheckControl] Allow decline after accept enabled ✓')
  } else if (!enabled && registered) {
    registered = false
    if (phaseUnsub) {
      phaseUnsub()
      phaseUnsub = null
    }
    if (readyCheckUnsub) {
      readyCheckUnsub()
      readyCheckUnsub = null
    }
    cleanup()
    logger.info('[ReadyCheckControl] Allow decline after accept disabled')
  }
}

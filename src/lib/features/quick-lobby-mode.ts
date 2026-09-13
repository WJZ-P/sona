/**
 * 快速大厅模式
 *
 * 背景：
 *   主页点击 Play 大按钮时，客户端会先展开"游戏模式选择"面板，玩家还得再点一次
 *   想要的模式才能进大厅。对于固定只玩某一种模式的玩家来说多了一步。
 *
 * 方案：
 *   给 `.play-button-content` 绑定 capture 阶段的点击监听：
 *     - 功能开启时，拦截原生展开行为（stopImmediatePropagation + preventDefault），
 *       直接 `lcu.createLobby(目标 queueId)` 进入设置好的目标队列大厅
 *     - 目标队列 ID 在点击时实时从 store 读取，改下拉无需重启功能
 *
 *   为什么用 capture：
 *     客户端的点击响应走冒泡委托，capture 阶段在按钮元素上先于冒泡触发，
 *     配合 stopPropagation 即可在事件抵达委托处理器前拦下，阻止原生展开。
 */

import { logger } from '@/index'
import { lcu, LcuEventUri, type LCUEventMessage } from '@/lib/lcu'
import { store } from '@/lib/store'
import { injector } from '@/lib/InjectorManager'
import type { GameflowPhase } from '@/types/lcu'

const PLAY_BUTTON_SELECTOR = '.play-button-container'
const BOUND_ATTR = 'data-sona-quick-lobby-bound'

let registered = false
let phaseUnsub: (() => void) | null = null
// 当前 gameflow 阶段缓存。点击拦截必须同步完成（preventDefault 不能等异步），
// 所以这里实时缓存阶段，点击时同步读取判断。初始留空表示未知 → 一律放行原生逻辑。
let currentPhase: GameflowPhase | '' = ''

async function handlePlayClick(e: Event) {
  if (!store.get('quickLobbyMode')) return

  // 只有完全空闲（None）时才接管。已在房间/匹配/选人等任何非 None 状态都放行原生逻辑，
  // 否则会把"返回房间"等原生点击行为一并拦掉，导致回不去。
  if (currentPhase !== 'None') return

  const queueId = store.get('quickLobbyQueueId')
  if (!queueId || queueId <= 0) {
    logger.warn('[QuickLobby] Chưa cấu hình hàng chờ mục tiêu, cho phép hành vi Play gốc')
    return
  }

  // 拦截原生"展开模式选择"，直接进目标队列大厅
  e.stopImmediatePropagation()
  e.stopPropagation()
  e.preventDefault()

  try {
    await lcu.createLobby(queueId)
    logger.info('[QuickLobby] Đã tạo sảnh nhanh → queueId=%d ✓', queueId)
  } catch (err) {
    logger.error('[QuickLobby] Tạo sảnh thất bại queueId=%d:', queueId, err)
  }
}

/** 绑定 Play 按钮点击监听（幂等） */
function tryBindPlayButton(): boolean {
  const btn = document.querySelector(PLAY_BUTTON_SELECTOR)
  if (!btn) return false
  if (btn.getAttribute(BOUND_ATTR) === 'true') return true

  btn.addEventListener('click', handlePlayClick, true)
  btn.setAttribute(BOUND_ATTR, 'true')
  logger.info('[QuickLobby] Đã gắn trình nghe nhấp nút Play ✓')
  return true
}

function unbindPlayButtons() {
  document.querySelectorAll(`[${BOUND_ATTR}]`).forEach((btn) => {
    btn.removeEventListener('click', handlePlayClick, true)
    btn.removeAttribute(BOUND_ATTR)
  })
}

/** 启用/禁用「快速大厅模式」 */
export function updateQuickLobbyMode(enabled: boolean) {
  if (enabled && !registered) {
    registered = true
    injector.register(tryBindPlayButton)

    // 实时跟踪 gameflow 阶段，供点击时同步判断
    phaseUnsub = lcu.observe(LcuEventUri.GAMEFLOW_PHASE_CHANGE, (event: LCUEventMessage) => {
      currentPhase = event.data as GameflowPhase
    })
    lcu.getGameflowPhase()
      .then((phase) => { currentPhase = phase })
      .catch(() => { /* ignore */ })

    logger.info('[QuickLobby] Đã bật chế độ sảnh nhanh ✓')
  } else if (!enabled && registered) {
    registered = false
    injector.unregister(tryBindPlayButton)
    unbindPlayButtons()
    if (phaseUnsub) {
      phaseUnsub()
      phaseUnsub = null
    }
    currentPhase = ''
    logger.info('[QuickLobby] Đã tắt chế độ sảnh nhanh')
  }
}

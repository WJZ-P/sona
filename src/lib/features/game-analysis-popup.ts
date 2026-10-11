import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { logger } from '@/index'
import { lcu, LcuEventUri } from '@/lib/lcu'
import type { LCUEventMessage, GameflowPhase } from '@/lib/lcu'
import { injector } from '@/lib/InjectorManager'
import { GameAnalysisModal } from '@/components/ui/GameAnalysisModal'

// ==================== 进入游戏自动弹窗战力分析 ====================

/** GameAnalysisModal 的独立 React root */
let gameAnalysisRoot: Root | null = null
let gameAnalysisContainer: HTMLDivElement | null = null
let gameAnalysisCloseTimer: number | null = null
let popupRequestToken = 0
let autoPopupAttempted = false

const MODAL_CLOSE_ANIMATION_MS = 240

function showGameAnalysisModal() {
  if (gameAnalysisCloseTimer != null) {
    window.clearTimeout(gameAnalysisCloseTimer)
    gameAnalysisCloseTimer = null
  }

  if (!gameAnalysisContainer) {
    gameAnalysisContainer = document.createElement('div')
    gameAnalysisContainer.id = 'sona-game-analysis-root'
    document.body.appendChild(gameAnalysisContainer)
    gameAnalysisRoot = createRoot(gameAnalysisContainer)
  }

  const close = () => {
    // 记住用户的关闭意图：本局即使 phase 再抖动（断线重连等）也不自动弹回来
    dismissedPopupGameId = lastPopupGameId
    const rootAtClose = gameAnalysisRoot
    rootAtClose?.render(
      createElement(GameAnalysisModal, { open: false, onClose: close }),
    )
    logger.info('[GameAnalysis] 战力分析弹窗已关闭 → dismissedGameId=%d', dismissedPopupGameId)

    if (gameAnalysisCloseTimer != null) window.clearTimeout(gameAnalysisCloseTimer)
    gameAnalysisCloseTimer = window.setTimeout(() => {
      gameAnalysisCloseTimer = null
      if (gameAnalysisRoot === rootAtClose) cleanupGameAnalysisModal()
    }, MODAL_CLOSE_ANIMATION_MS)
  }

  gameAnalysisRoot!.render(
    createElement(GameAnalysisModal, { open: true, onClose: close }),
  )
  logger.info('[GameAnalysis] 战力分析弹窗已显示')
}

function cleanupGameAnalysisModal() {
  if (gameAnalysisCloseTimer != null) {
    window.clearTimeout(gameAnalysisCloseTimer)
    gameAnalysisCloseTimer = null
  }
  if (gameAnalysisRoot) {
    gameAnalysisRoot.unmount()
    gameAnalysisRoot = null
  }
  if (gameAnalysisContainer) {
    gameAnalysisContainer.remove()
    gameAnalysisContainer = null
  }
}

// ---- 客户端内嵌按钮 ----

const GAME_ANALYSIS_BTN_ATTR = 'data-sona-game-analysis'

/**
 * 注入任务：在 game-in-progress-container 中注入"对局分析"按钮
 * 直接使用客户端原生的 <lol-uikit-flat-button>，自带官方金色边框、hover 动效、点击反馈
 */
function tryInjectGameAnalysisButton(): boolean {
  const container = document.querySelector('.game-in-progress-container')
  if (!container) return false

  // 已注入过，跳过
  if (container.querySelector(`[${GAME_ANALYSIS_BTN_ATTR}]`)) return true

  const btn = document.createElement('lol-uikit-flat-button')
  btn.setAttribute(GAME_ANALYSIS_BTN_ATTR, 'true')
  btn.textContent = '对局分析'
  // 布局（display / 间距）统一在 inject.css 里处理，两个按钮的注入先后不固定

  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    e.preventDefault()
    showGameAnalysisModal()
    logger.info('[GameAnalysis] 打开分析弹窗')
  })

  container.appendChild(btn)
  logger.info('[GameAnalysis] 客户端内嵌按钮已注入 ✓')
  return true
}

/** 清理客户端内嵌按钮 */
function cleanupGameAnalysisButton() {
  document.querySelectorAll(`[${GAME_ANALYSIS_BTN_ATTR}]`).forEach((el) => el.remove())
}

let gameAnalysisBtnRegistered = false

/** 跟踪当前游戏 ID，确保每局只弹一次 */
let lastPopupGameId = 0

/**
 * 用户手动关掉弹窗的那一局 gameId
 *
 * 非 InProgress 阶段会把 lastPopupGameId / autoPopupAttempted 清空，而游戏中断线
 * 重连走的是 InProgress → Reconnect → InProgress，回到 InProgress 时两个守卫都已
 * 失效，弹窗会自动弹回来——用户看到的就是"点了关闭没用"。这里按 gameId 记住用户
 * 的关闭意图：本局不再自动弹，换局（gameId 变化）自然失效，内嵌按钮仍可手动打开。
 */
let dismissedPopupGameId = 0

let gameAnalysisPopupUnsub: (() => void) | null = null

export function updateGameAnalysisPopup(enabled: boolean) {
  if (enabled && !gameAnalysisPopupUnsub) {
    gameAnalysisPopupUnsub = lcu.observe(LcuEventUri.GAMEFLOW_PHASE_CHANGE, (event: LCUEventMessage) => {
      const phase = event.data as GameflowPhase
      if (phase === 'InProgress') {
        const requestToken = ++popupRequestToken
        // 注册内嵌按钮注入
        if (!gameAnalysisBtnRegistered) {
          injector.register(tryInjectGameAnalysisButton)
          gameAnalysisBtnRegistered = true
        }
        // 查询当前 gameId 避免重连时重复弹窗
        lcu.getGameflowSession()
          .then((session) => {
            if (requestToken !== popupRequestToken || !gameAnalysisPopupUnsub) return
            const gid = session.gameData?.gameId ?? 0
            if (gid > 0 && gid === dismissedPopupGameId) {
              logger.info('[GameAnalysis] 本局已被用户手动关闭，跳过自动弹窗 → gameId=%d', gid)
              return
            }
            if (!autoPopupAttempted && gid > 0 && gid !== lastPopupGameId) {
              autoPopupAttempted = true
              lastPopupGameId = gid
              showGameAnalysisModal()
            }
          })
          .catch(() => {
            if (requestToken !== popupRequestToken || !gameAnalysisPopupUnsub || autoPopupAttempted) return
            // session 查询失败也尝试弹窗（可能是自定义等特殊情况）
            autoPopupAttempted = true
            showGameAnalysisModal()
          })
      } else {
        // 任何非 InProgress 阶段都撤销待处理请求并清理弹窗，避免在 Lobby / None
        // 等阶段残留，或被较晚返回的异步请求重新打开。
        popupRequestToken += 1
        lastPopupGameId = 0
        autoPopupAttempted = false
        // 取消按钮注入
        if (gameAnalysisBtnRegistered) {
          injector.unregister(tryInjectGameAnalysisButton)
          gameAnalysisBtnRegistered = false
        }
        cleanupGameAnalysisButton()
        cleanupGameAnalysisModal()
      }
    })
    logger.info('Game analysis popup enabled ✓')
  } else if (!enabled && gameAnalysisPopupUnsub) {
    popupRequestToken += 1
    gameAnalysisPopupUnsub()
    gameAnalysisPopupUnsub = null
    lastPopupGameId = 0
    autoPopupAttempted = false
    if (gameAnalysisBtnRegistered) {
      injector.unregister(tryInjectGameAnalysisButton)
      gameAnalysisBtnRegistered = false
    }
    cleanupGameAnalysisButton()
    cleanupGameAnalysisModal()
    logger.info('Game analysis popup disabled')
  }
}

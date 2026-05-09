import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { logger } from '@/index'
import { lcu, LcuEventUri } from '@/lib/lcu'
import type { LCUEventMessage, GameflowPhase } from '@/lib/lcu'
import { injector } from '@/lib/InjectorManager'
import { GameAnalysisModal } from '@/components/ui/GameAnalysisModal'
import { translate } from '@/lib/i18n'

// ==================== 进入游戏自动弹窗战力分析 ====================

/** GameAnalysisModal 的独立 React root */
let gameAnalysisRoot: Root | null = null
let gameAnalysisContainer: HTMLDivElement | null = null

function showGameAnalysisModal() {
  if (!gameAnalysisContainer) {
    gameAnalysisContainer = document.createElement('div')
    gameAnalysisContainer.id = 'sona-game-analysis-root'
    document.body.appendChild(gameAnalysisContainer)
    gameAnalysisRoot = createRoot(gameAnalysisContainer)
  }

  const close = () => {
    gameAnalysisRoot?.render(
      createElement(GameAnalysisModal, { open: false, onClose: close }),
    )
  }

  gameAnalysisRoot!.render(
    createElement(GameAnalysisModal, { open: true, onClose: close }),
  )
  logger.info('[GameAnalysis] 战力分析弹窗已显示')
}

function cleanupGameAnalysisModal() {
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
  btn.textContent = translate('injections.gameAnalysisButton')
  btn.style.marginTop = '12px'

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

let gameAnalysisPopupUnsub: (() => void) | null = null

export function updateGameAnalysisPopup(enabled: boolean) {
  if (enabled && !gameAnalysisPopupUnsub) {
    gameAnalysisPopupUnsub = lcu.observe(LcuEventUri.GAMEFLOW_PHASE_CHANGE, (event: LCUEventMessage) => {
      const phase = event.data as GameflowPhase
      if (phase === 'InProgress') {
        // 注册内嵌按钮注入
        if (!gameAnalysisBtnRegistered) {
          injector.register(tryInjectGameAnalysisButton)
          gameAnalysisBtnRegistered = true
        }
        // 查询当前 gameId 避免重连时重复弹窗
        lcu.getGameflowSession()
          .then((session) => {
            const gid = session.gameData?.gameId ?? 0
            if (gid > 0 && gid !== lastPopupGameId) {
              lastPopupGameId = gid
              showGameAnalysisModal()
            }
          })
          .catch(() => {
            // session 查询失败也尝试弹窗（可能是自定义等特殊情况）
            showGameAnalysisModal()
          })
      } else if (phase === 'WaitingForStats' || phase === 'PreEndOfGame' || phase === 'EndOfGame') {
        // 游戏已结束（WaitingForStats / PreEndOfGame / EndOfGame / None / Lobby 等）
        // 重置状态并关闭弹窗
        lastPopupGameId = 0
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
    gameAnalysisPopupUnsub()
    gameAnalysisPopupUnsub = null
    lastPopupGameId = 0
    if (gameAnalysisBtnRegistered) {
      injector.unregister(tryInjectGameAnalysisButton)
      gameAnalysisBtnRegistered = false
    }
    cleanupGameAnalysisButton()
    cleanupGameAnalysisModal()
    logger.info('Game analysis popup disabled')
  }
}

/**
 * 功能管理模块
 *
 * 监听 store 配置变化，自动开启/关闭对应的插件功能。
 * 在 index.tsx 的 load() 中调用 initFeatures() 即可。
 */

import { logger } from '@/index'
import { store } from '@/lib/store'
import { lcu, LcuEventUri } from '@/lib/lcu'
import type { LCUEventMessage, GameflowPhase } from '@/lib/lcu'
import { injector } from '@/lib/InjectorManager'

// ==================== 自动接受对局 ====================

let autoAcceptUnsub: (() => void) | null = null

function updateAutoAccept(enabled: boolean) {
  if (enabled && !autoAcceptUnsub) {
    autoAcceptUnsub = lcu.observe(LcuEventUri.GAMEFLOW_PHASE_CHANGE, (event: LCUEventMessage) => {
      const phase = event.data as GameflowPhase
      if (phase === 'ReadyCheck') {
        lcu.acceptMatch()
          .then(() => logger.info('Auto accepted match ✓'))
          .catch((err) => logger.error('Auto accept failed:', err))
      }
    })
    logger.info('Auto accept enabled ✓')
  } else if (!enabled && autoAcceptUnsub) {
    autoAcceptUnsub()
    autoAcceptUnsub = null
    logger.info('Auto accept disabled')
  }
}

// ==================== 调试：Gameflow 阶段日志 ====================

let debugGameflowUnsub: (() => void) | null = null

const PHASE_LABELS: Partial<Record<GameflowPhase, string>> = {
  ReadyCheck: '匹配确认',
  ChampSelect: '英雄选择',
  GameStart: '游戏启动',
  InProgress: '对局进行中',
  Reconnect: '重新连接',
  WaitingForStats: '等待结算',
  PreEndOfGame: '结算准备',
  EndOfGame: '对局结束',
}

function updateDebugGameflow(enabled: boolean) {
  if (enabled && !debugGameflowUnsub) {
    debugGameflowUnsub = lcu.observe(LcuEventUri.GAMEFLOW_PHASE_CHANGE, (event: LCUEventMessage) => {
      const phase = event.data as GameflowPhase
      const label = PHASE_LABELS[phase]

      logger.info('Gameflow phase → %s%s', phase, label ? ` (${label})` : '')

      if (!label) return

      lcu.getGameflowSession()
        .then((session) => {
          logger.info('=== %s ===', label)
          logger.info('游戏模式: %s | 队列: %s (ID: %d)', session.gameData.queue.gameMode, session.gameData.queue.name, session.gameData.queue.id)
          logger.info('对局 ID: %d | 自定义: %s', session.gameData.gameId, session.gameData.isCustomGame)
          logger.info('地图: %s (ID: %d)', session.map.name, session.map.id)
          logger.info('我方队伍:', session.gameData.teamOne)
          logger.info('对方队伍:', session.gameData.teamTwo)
          if (phase === 'InProgress') {
            logger.info('游戏客户端: running=%s, server=%s:%d', session.gameClient.running, session.gameClient.serverIp, session.gameClient.serverPort)
          }
          logger.info('完整 session: %o', session)
        })
        .catch((err) => logger.error('获取 %s 对局信息失败:', label, err))
    })
    logger.info('Debug gameflow logging enabled ✓')
  } else if (!enabled && debugGameflowUnsub) {
    debugGameflowUnsub()
    debugGameflowUnsub = null
    logger.info('Debug gameflow logging disabled')
  }
}

// ==================== 解锁自定义签名 ====================

function tryUnlockStatusInput(): boolean {
  const statusEl = document.querySelector('.lower-details .status.disabled')
  if (!statusEl) return true

  statusEl.classList.remove('disabled')
  logger.info('Status input unlocked ✓')
  return true
}

let statusUnlockRegistered = false

function updateUnlockStatus(enabled: boolean) {
  if (enabled && !statusUnlockRegistered) {
    injector.register(tryUnlockStatusInput)
    statusUnlockRegistered = true
    logger.info('Unlock status enabled ✓')
  } else if (!enabled && statusUnlockRegistered) {
    injector.unregister(tryUnlockStatusInput)
    statusUnlockRegistered = false
    logger.info('Unlock status disabled')
  }
}

// ==================== 大乱斗无CD换英雄 ====================

const BENCH_HIJACK_ATTR = 'data-sona-bench-hijacked'

/**
 * 从 champion-bench-item 的 background-image 中提取英雄 ID
 * URL 格式: url('/lol-game-data/assets/v1/champion-icons/102.png')
 */
function extractChampionId(item: Element): number | null {
  const iconEl = item.querySelector('.bench-champion-background') as HTMLElement | null
  if (!iconEl) return null
  const bg = iconEl.style.backgroundImage || ''
  const match = bg.match(/champion-icons\/(\d+)\.png/)
  return match ? Number(match[1]) : null
}

/**
 * 注入任务：
 * 1. 移除 on-cooldown 类名和遮罩（视觉）
 * 2. 接管点击事件，直接调 LCU API 换英雄（逻辑）
 */
function tryHijackBenchItems(): boolean {
  const container = document.querySelector('.bench-container')
  if (!container) return true

  // 视觉：移除 on-cooldown 类名和遮罩
  container.querySelectorAll('[class*="on-cooldown"]').forEach((el) => {
    const toRemove = Array.from(el.classList).filter((c) => c.startsWith('on-cooldown'))
    toRemove.forEach((c) => el.classList.remove(c))
    const mask = el.querySelector('.cooldown-mask')
    if (mask instanceof HTMLElement) mask.style.display = 'none'
  })

  // 逻辑：接管未被接管的 bench item 的点击事件
  container.querySelectorAll(`.champion-bench-item:not([${BENCH_HIJACK_ATTR}])`).forEach((item) => {
    // 跳过空位和锁定位
    if (item.classList.contains('empty-bench-item') || item.classList.contains('locked-out')) return

    item.setAttribute(BENCH_HIJACK_ATTR, 'true')

    item.addEventListener('click', (e) => {
      const championId = extractChampionId(item)
      if (!championId) return  // 无法识别英雄，放行原逻辑

      e.stopPropagation()
      e.stopImmediatePropagation()
      e.preventDefault()

      lcu.benchSwap(championId)
        .then(() => logger.info('Bench swap → champion %d ✓', championId))
        .catch((err) => logger.error('Bench swap failed:', err))
    }, true)
  })

  return true
}

let benchNoCooldownRegistered = false

function updateBenchNoCooldown(enabled: boolean) {
  if (enabled && !benchNoCooldownRegistered) {
    injector.register(tryHijackBenchItems)
    benchNoCooldownRegistered = true
    logger.info('Bench no-cooldown enabled ✓')
  } else if (!enabled && benchNoCooldownRegistered) {
    injector.unregister(tryHijackBenchItems)
    benchNoCooldownRegistered = false
    logger.info('Bench no-cooldown disabled')
  }
}

// ==================== 初始化 ====================

/**
 * 初始化所有功能
 * 根据 store 当前值启用功能，并监听后续变化
 */
export function initFeatures() {
  updateAutoAccept(store.get('autoAcceptMatch'))
  store.onChange('autoAcceptMatch', updateAutoAccept)

  updateDebugGameflow(store.get('developerMode'))
  store.onChange('developerMode', updateDebugGameflow)

  updateUnlockStatus(store.get('unlockStatus'))
  store.onChange('unlockStatus', updateUnlockStatus)

  updateBenchNoCooldown(store.get('benchNoCooldown'))
  store.onChange('benchNoCooldown', updateBenchNoCooldown)

  // 恢复窗口特效
  const savedEffect = store.get('windowEffect')
  if (savedEffect && savedEffect !== 'none') {
    Effect.apply(savedEffect as 'acrylic', { color: '#0006' })
    logger.info('Restored window effect: %s', savedEffect)
  }

  logger.info('Features initialized ✓')
}

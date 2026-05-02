/**
 * OP.GG 配装推荐基础框架
 *
 * 目标：
 * - 只在 ChampSelect 阶段启用
 * - 接管选好英雄后出现的 `.champion-select-ability-previews-show` 点击事件
 * - 先建立英雄 / 队列 / 版本上下文和占位面板，后续再接入 OP.GG 推荐数据
 */

import { logger } from '@/index'
import { injector } from '@/lib/InjectorManager'
import { getChampionById } from '@/lib/assets'
import { lcu, LcuEventUri, type ChampSelectSession, type LCUEventMessage } from '@/lib/lcu'
import type { GameflowPhase } from '@/types/lcu'

const TARGET_SELECTOR = '.toggle-ability-previews-button'
const HIJACK_ATTR = 'data-sona-opgg-build-hijacked'
const PANEL_ID = 'sona-opgg-build-panel'

interface RecommendationContext {
  championId: number
  queueId: number
  gameVersion: string
}

interface BuildRecommendation {
  coreItems: string[]
  runes: string[]
  augments: string[]
}

let phaseUnsub: (() => void) | null = null
let champSelectUnsub: (() => void) | null = null
let injectRegistered = false
let currentContext: RecommendationContext = {
  championId: 0,
  queueId: 0,
  gameVersion: '',
}
const boundElements: Array<{ el: HTMLElement; handler: EventListener; originalText: string }> = []
let outsideCloseHandler: ((event: MouseEvent) => void) | null = null

function getLocalChampionId(session: ChampSelectSession): number {
  const localPlayer = session.myTeam.find((player) => player.cellId === session.localPlayerCellId)
  return localPlayer?.championId ?? 0
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

async function refreshContext(session?: ChampSelectSession) {
  try {
    const currentSession = session ?? await lcu.getChampSelectSession()
    currentContext = {
      championId: getLocalChampionId(currentSession),
      queueId: currentSession.queueId ?? 0,
      gameVersion: currentContext.gameVersion,
    }

    if (!currentContext.gameVersion) {
      currentContext.gameVersion = await lcu.getGameVersion().catch(() => '')
    }

    logger.info(
      '[OPGG] ChampSelect context refreshed → championId=%d, queueId=%d, version=%s',
      currentContext.championId,
      currentContext.queueId,
      currentContext.gameVersion || 'unknown',
    )

    if (currentContext.championId > 0) {
      mount()
    } else {
      unmount(false)
    }
  } catch (err) {
    logger.warn('[OPGG] 刷新选人上下文失败:', err)
  }
}

async function loadRecommendation(_context: RecommendationContext): Promise<BuildRecommendation | null> {
  // TODO: 在这里接入 OP.GG 当前版本数据源，并按 championId / queueId 映射推荐装备、符文、海克斯。
  return null
}

function closePanel() {
  document.getElementById(PANEL_ID)?.remove()
  if (outsideCloseHandler) {
    document.removeEventListener('mousedown', outsideCloseHandler, true)
    outsideCloseHandler = null
  }
}

async function openRecommendationPanel(anchor: HTMLElement) {
  await refreshContext()

  const recommendation = await loadRecommendation(currentContext)
  const champion = getChampionById(currentContext.championId)
  const championName = champion ? `${champion.title} ${champion.name}` : '未识别英雄'
  const versionText = currentContext.gameVersion || '未知版本'
  const queueText = currentContext.queueId > 0 ? `队列 ${currentContext.queueId}` : '未知队列'

  closePanel()

  const manager = document.getElementById('lol-uikit-layer-manager-wrapper') ?? document.body
  const root = document.createElement('div')
  root.id = PANEL_ID
  root.style.cssText = [
    'position:fixed',
    'inset:0',
    'z-index:19002',
    'width:0',
    'height:0',
    'overflow:visible',
    'pointer-events:none',
  ].join(';')

  const container = document.createElement('div')
  container.style.cssText = [
    'position:absolute',
    'opacity:0',
    'visibility:hidden',
    'pointer-events:auto',
    'transition:opacity 0.16s ease-out',
  ].join(';')
  root.appendChild(container)

  const tooltip = document.createElement('lol-uikit-tooltip')
  tooltip.setAttribute('data-tooltip-position', 'top')
  container.appendChild(tooltip)

  const view = document.createElement('div')
  view.style.cssText = [
    'width:560px',
    'max-width:calc(100vw - 40px)',
    'background:#1a1c21',
    'direction:ltr',
    'color:#a09b8c',
    'font-family:var(--font-body), -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
    '-webkit-font-smoothing:subpixel-antialiased',
    'font-size:12px',
    'font-weight:400',
    'letter-spacing:.025em',
    'line-height:16px',
  ].join(';')
  tooltip.appendChild(view)

  const escapedChampionName = escapeHtml(championName)
  view.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #3c2e16;background:#1e2328b8;">
      <div>
        <div style="color:#c8aa6e;font-size:15px;font-weight:700;letter-spacing:2px;">配装推荐</div>
        <div style="margin-top:4px;color:#7e7e7e;font-size:12px;">OP.GG 推荐框架 · ${escapeHtml(versionText)} · ${escapeHtml(queueText)}</div>
      </div>
      <button type="button" data-sona-close style="width:28px;height:28px;border:1px solid transparent;background:#010a1399;color:#c8aa6e80;cursor:pointer;font-size:18px;line-height:24px;">×</button>
    </div>
    <div style="padding:18px 20px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <img src="/lol-game-data/assets/v1/champion-icons/${currentContext.championId}.png" alt="" style="width:48px;height:48px;border-radius:50%;border:1px solid #c8aa6e;background:#010a13;object-fit:cover;" />
        <div>
          <div style="color:#f0e6d2;font-size:16px;font-weight:700;">${escapedChampionName}</div>
          <div style="margin-top:3px;color:#785a28;font-size:12px;font-family:monospace;">championId=${currentContext.championId || 'N/A'}</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        ${renderPlaceholderSection('核心装备', recommendation?.coreItems)}
        ${renderPlaceholderSection('符文推荐', recommendation?.runes)}
        ${renderPlaceholderSection('海克斯推荐', recommendation?.augments)}
        ${renderPlaceholderSection('召唤师技能', null)}
      </div>
      <div style="margin-top:16px;padding:12px 14px;background:#1e232866;border:1px solid rgba(200,170,110,0.16);font-size:12px;line-height:1.7;color:#a09b8c;">
        已完成点击接管、当前英雄上下文解析和面板占位。下一步可以在 <span style="color:#c8aa6e;font-family:monospace;">loadRecommendation()</span> 接入 OP.GG 数据源。
      </div>
    </div>
  `

  view.querySelector('[data-sona-close]')?.addEventListener('click', closePanel)
  manager.appendChild(root)

  const rect = anchor.getBoundingClientRect()
  const width = container.offsetWidth
  const height = container.offsetHeight
  const margin = 8
  const left = Math.max(20, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - 20))
  const top = Math.max(20, rect.top - height - margin)

  container.style.left = `${left}px`
  container.style.top = `${top}px`
  container.style.visibility = 'visible'
  container.style.opacity = '1'

  outsideCloseHandler = (event: MouseEvent) => {
    const target = event.target as Node
    if (!root.contains(target) && !anchor.contains(target)) {
      closePanel()
    }
  }
  requestAnimationFrame(() => {
    if (outsideCloseHandler) document.addEventListener('mousedown', outsideCloseHandler, true)
  })
}

function renderPlaceholderSection(title: string, values: string[] | null | undefined): string {
  const content = values?.length
    ? values.map((value) => `<div style="margin-top:5px;color:#f0e6d2;">${escapeHtml(value)}</div>`).join('')
    : '<div style="margin-top:7px;color:#5c5b57;font-style:italic;">等待 OP.GG 数据接入</div>'

  return `
    <div style="min-height:86px;padding:12px;background:#010a1399;border:1px solid #3c2e16;">
      <div style="color:#c8aa6e;font-size:12px;font-weight:700;letter-spacing:1px;">${escapeHtml(title)}</div>
      ${content}
    </div>
  `
}

function tryHijackAbilityPreviewPanel(): boolean {
  const targets = document.querySelectorAll(`${TARGET_SELECTOR}:not([${HIJACK_ATTR}])`)
  if (targets.length === 0) {
    logger.info('[OPGG] 未找到技能预览面板元素')
    return false
  }

  targets.forEach((target) => {
    if (!(target instanceof HTMLElement)) return
    const originalText = target.innerText

    const handler = (event: Event) => {
      event.stopPropagation()
      event.stopImmediatePropagation()
      event.preventDefault()
      openRecommendationPanel(target)
    }

    target.setAttribute(HIJACK_ATTR, 'true')
    target.innerText = '配装推荐'
    target.style.cursor = 'pointer'
    target.addEventListener('click', handler, true)
    boundElements.push({ el: target, handler, originalText })
  })

  logger.info('[OPGG] 已接管技能预览面板点击 → %d 个元素', targets.length)
  return true
}

function mount() {
  if (!injectRegistered) {
    injector.register(tryHijackAbilityPreviewPanel)
    injectRegistered = true
    logger.info('[OPGG] 已检测到本地英雄，开始接管技能预览入口')
  }
}

function unmount(resetContext = true) {
  if (injectRegistered) {
    injector.unregister(tryHijackAbilityPreviewPanel)
    injectRegistered = false
  }

  for (const { el, handler, originalText } of boundElements) {
    el.removeEventListener('click', handler, true)
    el.removeAttribute(HIJACK_ATTR)
    el.innerText = originalText
    el.style.cursor = ''
  }
  boundElements.length = 0
  if (resetContext) {
    currentContext = { championId: 0, queueId: 0, gameVersion: currentContext.gameVersion }
  }
  closePanel()
}

export function updateOpggBuildRecommendation(enabled: boolean) {
  if (enabled && !phaseUnsub) {
    phaseUnsub = lcu.observe(LcuEventUri.GAMEFLOW_PHASE_CHANGE, (event: LCUEventMessage) => {
      const phase = event.data as GameflowPhase
      if (phase !== 'ChampSelect') {
        unmount()
      }
    })

    champSelectUnsub = lcu.observe(LcuEventUri.CHAMP_SELECT, (event: LCUEventMessage) => {
      if (event.eventType !== 'Create' && event.eventType !== 'Update') return
      refreshContext(event.data as ChampSelectSession)
    })

    lcu.getGameflowPhase().then((phase) => {
      if (phase === 'ChampSelect') {
        refreshContext()
      }
    }).catch(() => { /* ignore */ })

    logger.info('[OPGG] 配装推荐接管已启用 ✓')
  } else if (!enabled && phaseUnsub) {
    phaseUnsub()
    phaseUnsub = null
    if (champSelectUnsub) {
      champSelectUnsub()
      champSelectUnsub = null
    }
    unmount()
    logger.info('[OPGG] 配装推荐接管已禁用')
  }
}

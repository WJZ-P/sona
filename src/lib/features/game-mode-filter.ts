/**
 * 玩家对战模式可见性管理
 *
 * 在主页"玩家对战"分页（.parties-game-navs-list selectedindex=0）下，
 * 在导航栏末尾追加一组勾选小卡片，每个卡片对应一个 .game-type-card：
 *   - 勾选 → 显示该模式
 *   - 取消勾选 → 隐藏该模式
 *
 * 持久化：store.hiddenGameModes（key = data-game-mode 值）
 *
 * 注意：仅在玩家对战 tab（selectedindex=0）显示这些勾选项；切到人机/训练/创建/加入时
 *      勾选条会自动隐藏。
 */

import { logger } from '@/index'
import { injector } from '@/lib/InjectorManager'
import { store } from '@/lib/store'

// ==================== 常量 ====================

/** 勾选条容器 id（追加到 .parties-game-navs 末尾） */
const FILTER_BAR_ID = 'sona-game-mode-filter-bar'

/** 卡片元素的标记属性，避免重复处理 */
const CARD_PROCESSED_ATTR = 'data-sona-mode-filter'

/** card 被我们隐藏时打的标记 */
const CARD_HIDDEN_ATTR = 'data-sona-mode-hidden'

/** card 动画状态 */
const CARD_ANIMATION_STATE_ATTR = 'data-sona-mode-animation'

/** card 动画方向 */
const CARD_ANIMATION_DIRECTION_ATTR = 'data-sona-mode-direction'

/** 卡片隐藏动画时长，需与 CSS transition 保持一致 */
const CARD_HIDE_ANIMATION_MS = 240

/** 布局重排补间动画时长 */
const CARD_LAYOUT_ANIMATION_MS = 260

const CARD_GHOST_CLASS = 'sona-game-mode-card-ghost'

// ==================== 工具：从 .game-type-card 提取信息 ====================

interface GameModeInfo {
  /** data-game-mode 值，如 "CLASSIC" / "ARAM" / "CHERRY" / "TFT" / "KIWI" */
  mode: string
  /** 显示名（中文） */
  name: string
  /** 激活态图标 URL（用于勾选时） */
  activeIcon: string
  /** 灰色态图标 URL（用于未勾选时） */
  disabledIcon: string
}

/** 从 background-image: url('...') 中提取 url 部分 */
function extractBgUrl(el: HTMLElement | null): string {
  if (!el) return ''
  const bg = el.style.backgroundImage || ''
  const match = bg.match(/url\(['"]?([^'")]+)['"]?\)/)
  return match ? match[1] : ''
}

function extractCardInfo(card: HTMLElement): GameModeInfo | null {
  const mode = card.getAttribute('data-game-mode')
  if (!mode) return null

  const nameEl = card.querySelector('.parties-game-type-card-name') as HTMLElement | null
  const name = nameEl?.textContent?.trim() || mode

  const activeEl = card.querySelector('.icon-bg-filler') as HTMLElement | null
  const disabledEl = card.querySelector('.icon-bg-disabled') as HTMLElement | null
  const defaultEl = card.querySelector('.icon-bg-default') as HTMLElement | null

  // disabled 在某些模式上可能为空，回退到 default
  return {
    mode,
    name,
    activeIcon: extractBgUrl(activeEl) || extractBgUrl(defaultEl),
    disabledIcon: extractBgUrl(disabledEl) || extractBgUrl(defaultEl),
  }
}

// ==================== 主入口：注入勾选条 + 隐藏卡片 ====================

/** 注入任务 */
function tryInjectGameModeFilter(): boolean {
  // 1) 必须在主页 game-select 区域
  const navBar = document.querySelector('.parties-game-navs-list') as HTMLElement | null
  const navsHost = document.querySelector('.parties-game-navs') as HTMLElement | null
  const cardsHost = document.querySelector('.parties-game-type-select-wrapper') as HTMLElement | null

  if (!navBar || !navsHost || !cardsHost) {
    // 主页没渲染好（可能在其他 page），把可能存在的勾选条移除
    removeFilterBar()
    return true
  }

  // 2) 仅在"玩家对战"（selectedindex=0）下激活
  const selected = navBar.getAttribute('selectedindex') ?? '0'
  if (selected !== '0') {
    removeFilterBar()
    // 当前不在玩家对战 tab，把所有被我们隐藏的卡片恢复显示
    // （避免切回去后还是被隐藏 —— 但实际上 .game-type-card 在其他 tab 下整体不渲染，所以这里基本无副作用）
    return true
  }

  // 3) 收集所有 .game-type-card
  const cards = Array.from(cardsHost.querySelectorAll<HTMLElement>('.game-type-card'))
  if (cards.length === 0) return false  // 卡片还没渲染好，下一帧再来

  const infos: GameModeInfo[] = []
  for (const card of cards) {
    const info = extractCardInfo(card)
    if (info) infos.push(info)
  }
  if (infos.length === 0) return false

  // 4) 应用隐藏状态
  applyVisibility(cards)

  // 5) 注入或更新勾选条
  ensureFilterBar(navsHost, infos)

  return true
}

/** 根据 store.hiddenGameModes 应用 .game-type-card 的可见性 */
function applyVisibility(cards: HTMLElement[]) {
  const hidden = store.get('hiddenGameModes')
  const middleIndex = (cards.length - 1) / 2
  cards.forEach((card, index) => {
    card.setAttribute(CARD_ANIMATION_DIRECTION_ATTR, index <= middleIndex ? 'left' : 'right')
    const mode = card.getAttribute('data-game-mode') || ''
    const shouldHide = hidden[mode] === true
    if (shouldHide) {
      hideCard(card)
    } else {
      showCard(card)
    }
  })
}

function shouldCardBeHidden(card: HTMLElement): boolean {
  const mode = card.getAttribute('data-game-mode') || ''
  return store.get('hiddenGameModes')[mode] === true
}

function getLayoutCards(card: HTMLElement): HTMLElement[] {
  const host = card.closest('.parties-game-type-select-wrapper')
  if (!host) return []

  return Array.from(host.querySelectorAll<HTMLElement>('.game-type-card'))
}

function measureVisibleCards(cards: HTMLElement[], excludedCard?: HTMLElement): Map<HTMLElement, DOMRect> {
  const rects = new Map<HTMLElement, DOMRect>()
  cards.forEach((card) => {
    if (card === excludedCard || card.style.display === 'none') return
    rects.set(card, card.getBoundingClientRect())
  })
  return rects
}

function animateLayoutShift(beforeRects: Map<HTMLElement, DOMRect>, excludedCard?: HTMLElement) {
  beforeRects.forEach((beforeRect, card) => {
    if (card === excludedCard || !card.isConnected || card.style.display === 'none') return

    const afterRect = card.getBoundingClientRect()
    const deltaX = beforeRect.left - afterRect.left
    const deltaY = beforeRect.top - afterRect.top
    if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5) return

    card.animate(
      [
        { transform: `translate(${deltaX}px, ${deltaY}px)` },
        { transform: 'translate(0, 0)' },
      ],
      {
        duration: CARD_LAYOUT_ANIMATION_MS,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    )
  })
}

function createHideGhost(card: HTMLElement) {
  const rect = card.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return

  const direction = card.getAttribute(CARD_ANIMATION_DIRECTION_ATTR) === 'left' ? 'left' : 'right'
  const ghost = card.cloneNode(true) as HTMLElement
  ghost.classList.add(CARD_GHOST_CLASS)
  ghost.removeAttribute('id')
  ghost.removeAttribute(CARD_HIDDEN_ATTR)
  ghost.setAttribute(CARD_ANIMATION_STATE_ATTR, 'visible')
  ghost.setAttribute(CARD_ANIMATION_DIRECTION_ATTR, direction)

  Object.assign(ghost.style, {
    position: 'fixed',
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    margin: '0',
    pointerEvents: 'none',
    zIndex: '20',
  })

  document.body.appendChild(ghost)

  const translateX = direction === 'left' ? -32 : 32
  const animation = ghost.animate(
    [
      { opacity: 1, transform: 'translateX(0) scale(1)', filter: 'blur(0)' },
      { opacity: 0, transform: `translateX(${translateX}px) scale(0.96)`, filter: 'blur(2px)' },
    ],
    {
      duration: CARD_HIDE_ANIMATION_MS,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      fill: 'forwards',
    },
  )

  let cleaned = false
  const cleanup = () => {
    if (cleaned) return
    cleaned = true
    ghost.remove()
  }
  animation.onfinish = cleanup
  animation.oncancel = cleanup
  window.setTimeout(cleanup, CARD_HIDE_ANIMATION_MS + 80)
}

function showCard(card: HTMLElement) {
  card.setAttribute(CARD_PROCESSED_ATTR, 'true')

  if (card.style.display === 'none' || card.hasAttribute(CARD_HIDDEN_ATTR)) {
    const beforeRects = measureVisibleCards(getLayoutCards(card), card)
    card.style.display = ''
    card.removeAttribute(CARD_HIDDEN_ATTR)
    card.setAttribute(CARD_ANIMATION_STATE_ATTR, 'showing')
    card.getBoundingClientRect()
    animateLayoutShift(beforeRects, card)

    requestAnimationFrame(() => {
      if (!card.isConnected || card.hasAttribute(CARD_HIDDEN_ATTR)) return
      card.setAttribute(CARD_ANIMATION_STATE_ATTR, 'visible')
    })
    return
  }

  if (card.getAttribute(CARD_ANIMATION_STATE_ATTR) !== 'visible') {
    card.setAttribute(CARD_ANIMATION_STATE_ATTR, 'visible')
  }
}

function hideCard(card: HTMLElement) {
  card.setAttribute(CARD_PROCESSED_ATTR, 'true')
  if (card.hasAttribute(CARD_HIDDEN_ATTR) && card.style.display === 'none') return

  if (!shouldCardBeHidden(card)) return

  const beforeRects = measureVisibleCards(getLayoutCards(card), card)
  createHideGhost(card)
  card.style.display = ''
  card.setAttribute(CARD_HIDDEN_ATTR, 'true')
  card.removeAttribute(CARD_ANIMATION_STATE_ATTR)
  card.style.display = 'none'
  card.getBoundingClientRect()
  animateLayoutShift(beforeRects, card)
}

/** 创建（或更新）勾选条 */
function ensureFilterBar(navsHost: HTMLElement, infos: GameModeInfo[]) {
  let bar = document.getElementById(FILTER_BAR_ID) as HTMLDivElement | null

  // 比对当前 bar 内的 mode 列表，如果一致就只刷新勾选状态，不重建
  const currentSig = bar?.getAttribute('data-sona-mode-sig') ?? ''
  const nextSig = infos.map((i) => i.mode).join(',')

  // 插入位置：放在 .custom-game-tournament-code-container 的前面（即在 navs-list 之后）
  const tournamentContainer = navsHost.querySelector('.custom-game-tournament-code-container')

  if (!bar) {
    bar = document.createElement('div')
    bar.id = FILTER_BAR_ID
    bar.className = 'sona-game-mode-filter-bar'
    bar.setAttribute(CARD_PROCESSED_ATTR, 'true')
    if (tournamentContainer) {
      navsHost.insertBefore(bar, tournamentContainer)
    } else {
      navsHost.appendChild(bar)
    }
  } else {
    // 已存在但位置不对（不在 tournamentContainer 前面）→ 重新挪位
    if (tournamentContainer && bar.nextElementSibling !== tournamentContainer) {
      navsHost.insertBefore(bar, tournamentContainer)
    } else if (!bar.isConnected) {
      navsHost.appendChild(bar)
    }
  }

  if (currentSig !== nextSig) {
    bar.innerHTML = ''
    bar.setAttribute('data-sona-mode-sig', nextSig)
    for (const info of infos) {
      bar.appendChild(buildChip(info))
    }
  } else {
    // sig 一致，只更新已有 chip 的视觉状态
    refreshChipsState(bar)
  }
}

/** 构建单个勾选小卡片 */
function buildChip(info: GameModeInfo): HTMLDivElement {
  const hidden = store.get('hiddenGameModes')[info.mode] === true
  const checked = !hidden  // 勾选 = 显示

  const chip = document.createElement('div')
  chip.className = 'sona-mode-chip' + (checked ? ' sona-mode-chip--on' : ' sona-mode-chip--off')
  chip.setAttribute('data-mode', info.mode)
  chip.title = checked ? `Nhấn để ẩn: ${info.name}` : `Nhấn để hiện: ${info.name}`

  const icon = document.createElement('div')
  icon.className = 'sona-mode-chip__icon'
  icon.style.backgroundImage = `url('${checked ? info.activeIcon : info.disabledIcon}')`

  const name = document.createElement('div')
  name.className = 'sona-mode-chip__name'
  name.textContent = info.name

  chip.appendChild(icon)
  chip.appendChild(name)

  // 防止点击事件冒泡到客户端导航栏
  chip.addEventListener('mousedown', (e) => e.stopPropagation())
  chip.addEventListener('click', (e) => {
    e.stopPropagation()
    e.preventDefault()
    toggleMode(info.mode)
  })

  // 缓存 icon 双态 url，刷新状态时直接读取，不再 querySelector
  chip.dataset.activeIcon = info.activeIcon
  chip.dataset.disabledIcon = info.disabledIcon

  return chip
}

/** 切换某个模式的隐藏状态 */
function toggleMode(mode: string) {
  const map = { ...store.get('hiddenGameModes') }
  if (map[mode]) {
    delete map[mode]
    logger.info('[GameModeFilter] Hiện chế độ: %s', mode)
  } else {
    map[mode] = true
    logger.info('[GameModeFilter] Ẩn chế độ: %s', mode)
  }
  store.set('hiddenGameModes', map)
  // 立即触发一次刷新（注入器也会跟进，但即时反馈更好）
  tryInjectGameModeFilter()
}

/** 仅刷新已存在 chip 的视觉状态（勾选 / icon） */
function refreshChipsState(bar: HTMLElement) {
  const hiddenMap = store.get('hiddenGameModes')
  const chips = bar.querySelectorAll<HTMLDivElement>('.sona-mode-chip')
  chips.forEach((chip) => {
    const mode = chip.getAttribute('data-mode') || ''
    const checked = !(hiddenMap[mode] === true)
    chip.classList.toggle('sona-mode-chip--on', checked)
    chip.classList.toggle('sona-mode-chip--off', !checked)

    const iconEl = chip.querySelector('.sona-mode-chip__icon') as HTMLElement | null
    if (iconEl) {
      const activeIcon = chip.dataset.activeIcon || ''
      const disabledIcon = chip.dataset.disabledIcon || ''
      iconEl.style.backgroundImage = `url('${checked ? activeIcon : disabledIcon}')`
    }

    const nameText = chip.querySelector('.sona-mode-chip__name')?.textContent ?? mode
    chip.title = checked ? `Nhấn để ẩn: ${nameText}` : `Nhấn để hiện: ${nameText}`
  })
}

function removeFilterBar() {
  document.getElementById(FILTER_BAR_ID)?.remove()
}

/** 把所有被我们打了 CARD_HIDDEN_ATTR 标记的卡片恢复显示 */
function restoreAllCards() {
  const hidden = document.querySelectorAll<HTMLElement>(`.game-type-card[${CARD_HIDDEN_ATTR}]`)
  hidden.forEach((card) => {
    card.style.display = ''
    card.removeAttribute(CARD_HIDDEN_ATTR)
    card.removeAttribute(CARD_ANIMATION_STATE_ATTR)
    card.removeAttribute(CARD_ANIMATION_DIRECTION_ATTR)
  })

  document.querySelectorAll<HTMLElement>(`.game-type-card[${CARD_ANIMATION_STATE_ATTR}]`).forEach((card) => {
    card.style.display = ''
    card.removeAttribute(CARD_HIDDEN_ATTR)
    card.removeAttribute(CARD_ANIMATION_STATE_ATTR)
    card.removeAttribute(CARD_ANIMATION_DIRECTION_ATTR)
  })

  document.querySelectorAll<HTMLElement>(`.${CARD_GHOST_CLASS}`).forEach((ghost) => ghost.remove())
}

// ==================== 注册 ====================

let registered = false
let storeUnsub: (() => void) | null = null

/**
 * 切换玩家对战模式过滤功能开关
 * - 开启：注入勾选条 + 监听 hiddenGameModes 变化
 * - 关闭：移除勾选条、恢复所有被隐藏的卡片、取消监听（hiddenGameModes 配置保留）
 */
export function updateGameModeFilter(enabled: boolean) {
  if (enabled && !registered) {
    registered = true
    injector.register(tryInjectGameModeFilter)
    // store 变化时立即刷新（虽然 toggleMode 已经主动调过一次，这里兜住外部修改）
    storeUnsub = store.onChange('hiddenGameModes', () => {
      tryInjectGameModeFilter()
    })
    logger.info('[GameModeFilter] enabled ✓')
  } else if (!enabled && registered) {
    registered = false
    injector.unregister(tryInjectGameModeFilter)
    if (storeUnsub) {
      storeUnsub()
      storeUnsub = null
    }
    removeFilterBar()
    restoreAllCards()
    logger.info('[GameModeFilter] disabled')
  }
}

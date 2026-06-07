/**
 * 平衡性调整 buff 提示
 *
 * 游玩特定模式（大乱斗 / 无限火力 / 克隆大作战 / 极限闪击 / 斗魂竞技场 / 终极魔咒书）时，
 * 鼠标悬停在英雄头像（我方队伍 / 候选席 / 英雄选择网格卡片）上，显示对应的平衡数值调整。
 *
 * 设计思路：
 * - 复用客户端原生 <lol-uikit-tooltip> 组件获得原生风格
 * - hover 时直接从 DOM 元素的 background-image 提取 championId，实时查数据
 * - 无需缓存数组，不存在索引错位问题
 * - injector 守护注入点，客户端刷掉也会自动补回
 *
 * 数据源：Fandom LoL Wiki（字段用下划线命名，稀疏结构）
 */

import { logger } from '@/index'
import { lcu, LcuEventUri, type LCUEventMessage } from '@/lib/lcu'
import type { GameflowPhase } from '@/types/lcu'
import { injector } from '@/lib/InjectorManager'
import { getAllChampions, getChampionBalance, getQueueName, type BalanceMode, type ChampionBalanceStats } from '@/lib/assets'

// ==================== 图标资源（构建期内联为 base64） ====================

import iconDmgDealt from '@/../assets/balance-icons/dmg_dealt.png'
import iconDmgTaken from '@/../assets/balance-icons/dmg_taken.png'
import iconHealing from '@/../assets/balance-icons/healing.png'
import iconShielding from '@/../assets/balance-icons/shielding.png'
import iconTenacity from '@/../assets/balance-icons/tenacity.png'
import iconAbilityHaste from '@/../assets/balance-icons/ability_haste.png'
import iconAttackSpeed from '@/../assets/balance-icons/attack_speed.png'
import iconEnergyRegen from '@/../assets/balance-icons/energy_regen.png'
import iconManaRegen from '@/../assets/balance-icons/mana_regen.png'
import iconMovementSpeed from '@/../assets/balance-icons/movement_speed.png'

/** Wiki 字段名 → 图标资源 */
const ICON_MAP: Record<string, string> = {
  dmg_dealt: iconDmgDealt,
  dmg_taken: iconDmgTaken,
  healing: iconHealing,
  shielding: iconShielding,
  tenacity: iconTenacity,
  ability_haste: iconAbilityHaste,
  attack_speed: iconAttackSpeed,
  energy_regen: iconEnergyRegen,
  mana_regen: iconManaRegen,
  movement_speed: iconMovementSpeed,
}

/** Wiki 字段名 → 中文标签 */
const LABEL_MAP: Record<string, string> = {
  dmg_dealt: '造成伤害',
  dmg_taken: '承受伤害',
  healing: '治疗效果',
  shielding: '护盾效果',
  tenacity: '韧性',
  ability_haste: '技能急速',
  attack_speed: '成长攻速',
  energy_regen: '能量回复',
  mana_regen: '法力回复',
  movement_speed: '移动速度',
}

/** 显示顺序（固定顺序比字典序好看） */
const DISPLAY_ORDER: Array<keyof ChampionBalanceStats> = [
  'dmg_dealt',
  'dmg_taken',
  'healing',
  'shielding',
  'attack_speed',
  'ability_haste',
  'movement_speed',
  'tenacity',
  'mana_regen',
  'energy_regen',
]

// ==================== 模式映射 ====================

/**
 * LCU gameMode 字符串 → 平衡数据 key
 * 兼容各种变体（如 ARURF 走 urf 数据，KIWI 走 aram 数据）
 * 显示名直接用 getQueueName(queueId) 从 LCU 官方数据取，不在这里维护
 */
function getBalanceKey(gameMode: string): BalanceMode | null {
  const mode = gameMode.toLowerCase()
  // ARAM 类：极地大乱斗、海克斯大乱斗等所有大乱斗变种
  if (mode === 'aram' || mode === 'kiwi') return 'aram'
  // URF 类：URF / ARURF
  if (mode === 'urf' || mode === 'arurf') return 'urf'
  // 克隆大作战
  if (mode === 'oneforall' || mode === 'ofa') return 'ofa'
  // 极限闪击
  if (mode === 'nexusblitz' || mode === 'nb') return 'nb'
  // 斗魂竞技场（Arena）
  if (mode === 'cherry' || mode === 'arena') return 'ar'
  // 终极魔咒书
  if (mode === 'ultbook' || mode === 'usb') return 'usb'
  return null
}

// ==================== Tooltip UI ====================

class BalanceTooltip {
  private manager: HTMLElement
  private root: HTMLDivElement
  private container: HTMLDivElement
  private tooltip: HTMLElement
  private caption: HTMLDivElement
  private content: HTMLDivElement

  constructor(manager: HTMLElement) {
    this.manager = manager

    const root = document.createElement('div')
    // z-index 对齐 balance-buff-viewer 参考项目，压过客户端原生 tooltip（"点击以将你的选择替换为..."）
    root.setAttribute('style', 'position:absolute;top:0;left:0;width:0;height:0;overflow:visible;z-index:19001;')
    this.root = root

    const container = document.createElement('div')
    container.setAttribute('style', 'position:absolute;opacity:0;pointer-events:none;transition:opacity 0.2s;')
    root.appendChild(container)
    this.container = container

    // 复用客户端原生 tooltip Web Component，自带小三角指示器 + 原生样式
    const tooltip = document.createElement('lol-uikit-tooltip')
    tooltip.setAttribute('data-tooltip-position', 'right')
    container.appendChild(tooltip)
    this.tooltip = tooltip

    const view = document.createElement('div')
    view.setAttribute('style', 'background:#1a1c21;direction:ltr;width:240px;font-family:var(--font-body);-webkit-font-smoothing:subpixel-antialiased;color:#a09b8c;font-size:12px;font-weight:400;letter-spacing:.025em;line-height:16px;')
    tooltip.appendChild(view)

    const body = document.createElement('div')
    body.setAttribute('style', 'min-width:200px;padding:14px 18px;')
    view.appendChild(body)

    const caption = document.createElement('div')
    caption.setAttribute('style', 'margin-bottom:10px;color:#f0e6d2;font-size:13px;font-weight:700;letter-spacing:.075em;line-height:18px;text-transform:uppercase;border-bottom:1px solid #3c3c41;padding-bottom:6px;')
    body.appendChild(caption)
    this.caption = caption

    const content = document.createElement('div')
    body.appendChild(content)
    this.content = content
  }

  show(anchor: Element, position: 'right' | 'bottom', caption: string, contentHtml: string) {
    this.caption.textContent = caption
    this.content.innerHTML = contentHtml
    if (!this.root.isConnected) this.manager.appendChild(this.root)
    this.tooltip.setAttribute('data-tooltip-position', position)

    const rect = anchor.getBoundingClientRect()
    let left = 0
    let top = 0

    if (position === 'right') {
      left = rect.right + 5
      top = rect.bottom - (rect.height + this.container.offsetHeight) / 2
    } else {
      // bench 场景：完全盖住客户端原生 tooltip，那个没啥信息量
      top = rect.bottom
      left = rect.right - (rect.width + this.container.offsetWidth) / 2
    }

    this.container.style.left = `${left}px`
    this.container.style.top = `${top}px`
    this.container.style.opacity = '1'
  }

  hide() {
    this.container.style.opacity = '0'
  }

  destroy() {
    this.container.style.opacity = '0'
    this.root.remove()
  }
}

// ==================== 数据渲染 ====================

/** 1.1 → "+10%"；0.95 → "-5%" */
function ratioToText(n: number): string {
  const bonus = ((n - 1) * 100)
  const text = parseFloat(bonus.toFixed(2)) + '%'
  return n >= 1 ? '+' + text : text
}

/** ability_haste 按加数显示，其他按倍率 */
function isAbilityHasteField(key: string): boolean {
  return key === 'ability_haste'
}

/** 判断是否为 buff（绿色）还是 nerf（红色） */
function isBuff(key: string, value: number): boolean {
  if (key === 'dmg_taken') return value < 1   // 少受伤 = buff
  if (isAbilityHasteField(key)) return value >= 0 // 技能急速是加数，正值为 buff
  return value >= 1
}

/** 生成 buff 列表 HTML（Wiki 字段天然稀疏，传入的 stats 只有有调整的字段） */
function buildStatsHtml(stats: ChampionBalanceStats): string {
  // 按 DISPLAY_ORDER 排序
  const entries: Array<[string, number]> = []
  for (const key of DISPLAY_ORDER) {
    const value = stats[key]
    if (typeof value === 'number') {
      entries.push([key, value])
    }
  }

  if (entries.length === 0) {
    return '<div style="color:#746e64;font-style:italic;">无平衡调整（原版数值）</div>'
  }

  const rows = entries.map(([key, value]) => {
    const label = LABEL_MAP[key] ?? key
    const icon = ICON_MAP[key]
    const color = isBuff(key, value) ? '#5bbd72' : '#e84749'
    // ability_haste 按加数显示（+N），其他按倍率显示（+N%）
    const text = isAbilityHasteField(key)
      ? (value >= 0 ? `+${value}` : `${value}`)
      : ratioToText(value)
    const iconHtml = icon
      ? `<img src="${icon}" width="14" height="14" alt="" style="margin-right:6px;vertical-align:middle;" />`
      : ''
    return `
      <div style="display:flex;align-items:center;margin-bottom:4px;line-height:18px;">
        <span style="display:flex;align-items:center;flex:1;">
          ${iconHtml}<span>${label}</span>
        </span>
        <span style="color:${color};font-weight:bold;">${text}</span>
      </div>
    `
  })

  return rows.join('')
}

// ==================== 主模块状态 ====================

let tooltip: BalanceTooltip | null = null
/** 当前模式：dataKey 用于查平衡数据，displayName 直接用 getQueueName(queueId) 从 LCU 官方数据取 */
let currentMode: { dataKey: BalanceMode; displayName: string } | null = null
let phaseUnsub: (() => void) | null = null
let injectRegistered = false
/** 英雄选择网格 hover 观察者（监听卡片 card-hovered class 切换） */
let cardHoverObserver: MutationObserver | null = null
/** 网格诊断日志去重（状态变化才打，避免每帧刷屏） */
let lastCardDiag = ''
/** 上次 hover 的英雄 ID 去重 */
let lastHoverChampId = -2
/** 英雄本地化名字 → championId 映射（卡片上拿不到 id，只能靠名字反查） */
let nameToId: Map<string, number> | null = null

// ==================== 数据渲染（hover 时按需调用） ====================

function buildTooltipData(champId: number): { caption: string; content: string } | null {
  if (champId <= 0 || !currentMode) return null
  const balance = getChampionBalance(champId)
  if (!balance) return null

  // Wiki 数据稀疏：没调整的模式根本不存在
  const stats = balance.stats?.[currentMode.dataKey] ?? {}
  return {
    caption: `${currentMode.displayName} · 平衡调整`,
    content: buildStatsHtml(stats),
  }
}

// ==================== DOM 绑定（幂等） ====================

const BOUND_ATTR = 'data-sona-balance-hover'

/**
 * 从 summoner-container-wrapper 中提取英雄 ID
 * 支持两种方式：
 * 1. <img> 标签的 src 属性
 * 2. CSS background-image
 * URL 格式: /lol-game-data/assets/v1/champion-icons/102.png
 */
function extractChampionIdFromWrapper(wrapper: Element): number | null {
  // 优先从 <img> 标签提取
  const img = wrapper.querySelector('img[src*="champion-icons"]')
  if (img) {
    const src = img.getAttribute('src') || ''
    const match = src.match(/champion-icons\/(\d+)\.png/)
    if (match) {
      logger.debug('[BalanceBuff] extractFromWrapper: 从<img>提取 championId=%s (src=%s)', match[1], src)
      return Number(match[1])
    }
    logger.debug('[BalanceBuff] extractFromWrapper: 找到<img>但src不匹配 (src=%s)', src)
  } else {
    logger.debug('[BalanceBuff] extractFromWrapper: 未找到 img[src*=champion-icons]')
  }

  // fallback: 从 background-image 提取
  // 真正的图标在子元素 .portrait-icon / .fit-icon 上
  const iconContainer = wrapper.querySelector('.champion-icon-container') as HTMLElement | null
    ?? wrapper.querySelector('.champion-icon') as HTMLElement | null
  if (iconContainer) {
    // 1) 先查自身
    let bg = iconContainer.style.backgroundImage || ''
    // 2) 自身没有，在子元素中查找含 champion-icons 的 background-image
    if (!bg || !bg.includes('champion-icons')) {
      const bgEl = iconContainer.querySelector('[style*="champion-icons"]') as HTMLElement | null
      bg = bgEl?.style.backgroundImage || ''
    }
    logger.debug('[BalanceBuff] extractFromWrapper: 找到iconContainer (class=%s, bg=%s)', iconContainer.className, bg)
    const match = bg.match(/champion-icons\/(\d+)\.png/)
    if (match) {
      logger.debug('[BalanceBuff] extractFromWrapper: 从background-image提取 championId=%s', match[1])
      return Number(match[1])
    }
    logger.debug('[BalanceBuff] extractFromWrapper: iconContainer内background-image不匹配')
  } else {
    logger.debug('[BalanceBuff] extractFromWrapper: 未找到 .champion-icon-container 或 .champion-icon')
  }

  // 最终兜底：打印 wrapper 内所有 img 和带 background-image 的元素
  const allImgs = wrapper.querySelectorAll('img')
  if (allImgs.length > 0) {
    logger.debug('[BalanceBuff] extractFromWrapper: wrapper内所有img: %o', Array.from(allImgs).map(i => ({ src: i.getAttribute('src'), alt: i.getAttribute('alt') })))
  }
  logger.debug('[BalanceBuff] extractFromWrapper: 无法提取championId，wrapper.innerHTML片段=%s', wrapper.innerHTML.substring(0, 300))
  return null
}

/**
 * 从 champion-bench-item 中提取英雄 ID
 * 支持 <img> 标签和 background-image 两种方式
 */
function extractChampionIdFromBench(item: Element): number | null {
  // 优先从 <img> 标签提取
  const img = item.querySelector('img[src*="champion-icons"]')
  if (img) {
    const match = img.getAttribute('src')?.match(/champion-icons\/(\d+)\.png/)
    if (match) return Number(match[1])
  }

  // fallback: 从 background-image 提取
  const bg = item.querySelector('.bench-champion-background') as HTMLElement | null
  if (bg) {
    const style = bg.style.backgroundImage || ''
    const match = style.match(/champion-icons\/(\d+)\.png/)
    if (match) return Number(match[1])
  }

  return null
}

/**
 * 构建「英雄文本 → championId」映射，缓存复用。
 * 网格卡片显示的是英雄称号（title，如「皮城女警」），不是英雄名（name，如「凯特琳」），
 * 因此 name / title / alias 都建索引，卡片显示哪个都能命中。
 */
function buildNameToIdMap(): Map<string, number> {
  if (nameToId) return nameToId
  const map = new Map<string, number>()
  for (const champ of getAllChampions()) {
    if (champ.name) map.set(champ.name.trim(), champ.id)
    if (champ.title) map.set(champ.title.trim(), champ.id)
    if (champ.alias) map.set(champ.alias.trim(), champ.id)
  }
  nameToId = map
  return map
}

/**
 * 从英雄选择网格卡片里抠出英雄名字文本。
 * 卡片上拿不到 championId，但有英雄名字：先取整卡 textContent，再退而找子元素。
 */
function extractChampName(card: Element): string | null {
  const el = card as HTMLElement
  const direct = el.textContent?.trim()
  if (direct && direct.length > 1 && direct.length < 25) return direct
  for (const sel of ['[class*="name"]', '[class*="label"]', 'span', 'p']) {
    const text = el.querySelector<HTMLElement>(sel)?.textContent?.trim()
    if (text && text.length > 1 && text.length < 25) return text
  }
  return null
}

/** 卡片 → 英雄名字 → championId */
function resolveChampionIdByCard(card: Element): { championId: number | null; name: string | null } {
  const name = extractChampName(card)
  if (!name) return { championId: null, name: null }
  return { championId: buildNameToIdMap().get(name) ?? null, name }
}

function tryBindHover(): boolean {
  if (!tooltip || !currentMode) return true

  logger.debug('[BalanceBuff] tryBindHover: tooltip=%s, mode=%s', !!tooltip, currentMode.dataKey)

  // 我方队员 — 使用和 features.ts 相同的选择器确保覆盖所有位置
  const party = document.querySelector('.summoner-array.your-party')
  if (party) {
    const wrappers = party.querySelectorAll('.summoner-container-wrapper')
    logger.debug('[BalanceBuff] tryBindHover: 找到party, wrappers=%d个', wrappers.length)
    wrappers.forEach((el) => {
      if (el.hasAttribute(BOUND_ATTR)) return
      el.setAttribute(BOUND_ATTR, 'team')
      el.addEventListener('mouseenter', () => {
        // 从 DOM 实时提取 championId，不依赖索引对应
        const champId = extractChampionIdFromWrapper(el)
        logger.debug('[BalanceBuff] mouseenter: champId=%d', champId ?? -1)
        if (!champId || champId <= 0) return
        const data = buildTooltipData(champId)
        if (data) tooltip!.show(el, 'right', data.caption, data.content)
      })
      el.addEventListener('mouseleave', () => tooltip!.hide())
    })
  } else {
    logger.debug('[BalanceBuff] tryBindHover: 未找到 .summoner-array.your-party')
  }

  // 候选席
  const bench = document.querySelectorAll('.bench-container .champion-bench-item')
  logger.debug('[BalanceBuff] tryBindHover: bench元素=%d个', bench.length)
  bench.forEach((el) => {
    if (el.hasAttribute(BOUND_ATTR)) return
    el.setAttribute(BOUND_ATTR, 'bench')
    el.addEventListener('mouseenter', () => {
      const champId = extractChampionIdFromBench(el)
      logger.debug('[BalanceBuff] mouseenter bench: champId=%d', champId ?? -1)
      if (!champId || champId <= 0) return
      const data = buildTooltipData(champId)
      if (data) tooltip!.show(el, 'bottom', data.caption, data.content)
    })
    el.addEventListener('mouseleave', () => tooltip!.hide())
  })

  // 英雄选择网格：injector 只监听 childList，捕捉不到 card-hovered 这种 class 切换，
  // 所以在共同祖先 .champion-cards-component-wrapper 上单独挂 class 属性观察者
  ensureCardHoverObserver()

  return true
}

/**
 * 在 .champion-cards-component-wrapper 上挂 MutationObserver，
 * 监听子孙卡片 class 变化：当某张卡片出现 card-hovered 时，在其右侧显示平衡数值。
 * 幂等：wrapper 已绑定则跳过；wrapper 被客户端重建后会自动重挂。
 */
/** 诊断日志去重：同样的内容只打一次，状态变化时再打 */
function logCardDiag(message: string): void {
  if (message === lastCardDiag) return
  lastCardDiag = message
  logger.info('[BalanceBuff] %s', message)
}

function ensureCardHoverObserver(): void {
  if (!tooltip || !currentMode) {
    logCardDiag(`网格观察者未就绪 → tooltip=${!!tooltip}, currentMode=${currentMode ? currentMode.dataKey : 'null'}`)
    return
  }

  const wrapper = document.querySelector('.champion-cards-component-wrapper')
  if (!wrapper) {
    const cardCount = document.querySelectorAll('.champion-card-component').length
    // 有卡片却找不到 wrapper，说明选择器/结构对不上，是关键诊断信号
    if (cardCount > 0) {
      logCardDiag(`有 ${cardCount} 张 .champion-card-component 卡片，但未找到 .champion-cards-component-wrapper（请检查选择器）`)
    } else {
      logCardDiag('英雄网格尚未渲染（卡片数=0），等待 DOM 出现')
    }
    return
  }

  if (wrapper.hasAttribute(BOUND_ATTR)) return
  wrapper.setAttribute(BOUND_ATTR, 'cards-wrapper')

  buildNameToIdMap()

  const initialCards = wrapper.querySelectorAll('.champion-card-component').length
  logger.info(
    '[BalanceBuff] ✓ 已绑定英雄网格 card-hovered 观察者（wrapper 命中，初始卡片数=%d，模式=%s）',
    initialCards,
    currentMode.displayName,
  )

  cardHoverObserver?.disconnect()
  cardHoverObserver = new MutationObserver(() => {
    if (!tooltip || !currentMode) return
    // 直接读当前 hover 状态，天然规避「移出旧卡 / 移入新卡」的事件顺序问题
    const hovered = wrapper.querySelector('.champion-card-component.card-hovered')
    if (!hovered) {
      if (lastHoverChampId !== -2) {
        logger.info('[BalanceBuff] 网格 hover 离开 → 隐藏')
        lastHoverChampId = -2
      }
      tooltip.hide()
      return
    }

    // 卡片里拿不到 championId：抠出英雄名字，再用名字反查 id
    const { championId: champId, name } = resolveChampionIdByCard(hovered)

    if ((champId ?? -1) !== lastHoverChampId) {
      lastHoverChampId = champId ?? -1
      logger.info(
        '[BalanceBuff] 网格 hover → %s (championId=%d, hasData=%s)',
        name ?? '?',
        champId ?? -1,
        champId ? !!buildTooltipData(champId) : false,
      )
    }

    if (!champId || champId <= 0) {
      tooltip.hide()
      return
    }
    const data = buildTooltipData(champId)
    if (data) tooltip.show(hovered, 'right', data.caption, data.content)
    else tooltip.hide()
  })
  cardHoverObserver.observe(wrapper, { subtree: true, attributes: true, attributeFilter: ['class'] })
}

// ==================== 生命周期 ====================

async function mountForChampSelect() {
  logger.debug('[BalanceBuff] mountForChampSelect 开始')
  // 1. 探测当前模式：用 gameMode 映射平衡数据 key，用 queueId 拿官方中文名
  let gameMode = ''
  let queueId = 0
  try {
    const gf = await lcu.getGameflowSession()
    gameMode = gf.gameData?.queue?.gameMode || ''
    queueId = gf.gameData?.queue?.id || 0
    logger.debug('[BalanceBuff] getGameflowSession: gameMode=%s, queueId=%d', gameMode, queueId)
  } catch (e) {
    logger.debug('[BalanceBuff] getGameflowSession 失败: %o', e)
  }

  const modeKey = getBalanceKey(gameMode)
  if (!modeKey) {
    logger.info('[BalanceBuff] 当前模式 %s 不支持，跳过', gameMode)
    return
  }

  // 直接用 LCU 官方队列中文名，无需自己硬编码
  const displayName = queueId > 0 ? getQueueName(queueId) : gameMode
  currentMode = { dataKey: modeKey, displayName }
  logger.info('[BalanceBuff] 进入选人阶段 → %s (gameMode=%s, queueId=%d, dataKey=%s)', displayName, gameMode, queueId, modeKey)

  // 2. 创建 tooltip
  const manager = document.getElementById('lol-uikit-layer-manager-wrapper')
  if (!manager) {
    logger.warn('[BalanceBuff] 未找到 layer-manager-wrapper，延迟挂载')
    return
  }
  tooltip = new BalanceTooltip(manager)

  // 3. 预热「名字 → championId」映射（网格卡片靠名字识别英雄）
  buildNameToIdMap()

  // 4. 注册 DOM 绑定注入（injector 会自愈，换英雄后 DOM 变化时自动重新绑定）
  injector.register(tryBindHover)
  injectRegistered = true
}

function unmountForChampSelect() {
  logger.debug('[BalanceBuff] unmountForChampSelect 执行')
  if (injectRegistered) {
    injector.unregister(tryBindHover)
    injectRegistered = false
  }
  if (cardHoverObserver) {
    cardHoverObserver.disconnect()
    cardHoverObserver = null
  }
  lastCardDiag = ''
  lastHoverChampId = -2
  if (tooltip) {
    tooltip.destroy()
    tooltip = null
  }
  // 清理 DOM 标记
  document.querySelectorAll(`[${BOUND_ATTR}]`).forEach((el) => el.removeAttribute(BOUND_ATTR))
  currentMode = null
}

// ==================== 对外接口 ====================

/**
 * 启用/禁用「平衡性调整 buff 提示」
 * 监听 gameflow-phase：进入 ChampSelect 时 mount，离开时 unmount
 */
export function updateBalanceBuffTooltip(enabled: boolean) {
  logger.debug('[BalanceBuff] updateBalanceBuffTooltip: enabled=%s, phaseUnsub=%s', enabled, !!phaseUnsub)
  if (enabled && !phaseUnsub) {
    phaseUnsub = lcu.observe(LcuEventUri.GAMEFLOW_PHASE_CHANGE, (event: LCUEventMessage) => {
      const phase = event.data as GameflowPhase
      if (phase === 'ChampSelect') {
        // 防御：先清再挂
        unmountForChampSelect()
        mountForChampSelect()
      } else {
        unmountForChampSelect()
      }
    })

    // 插件启动时若已经在 ChampSelect 阶段，立即挂载
    lcu.getGameflowPhase().then((phase) => {
      logger.debug('[BalanceBuff] 启动时当前阶段=%s', phase)
      if (phase === 'ChampSelect') {
        unmountForChampSelect()
        mountForChampSelect()
      }
    }).catch(() => { /* ignore */ })

    logger.info('[BalanceBuff] 平衡性调整 buff 提示已启用 ✓')
  } else if (!enabled && phaseUnsub) {
    phaseUnsub()
    phaseUnsub = null
    unmountForChampSelect()
    logger.info('[BalanceBuff] 平衡性调整 buff 提示已禁用')
  }
}

/**
 * OP.GG 配装推荐基础框架
 *
 * 目标：
 * - 只在 ChampSelect 阶段启用
 * - 接管选好英雄后出现的 `.champion-select-ability-previews-show` 点击事件
 * - 根据英雄 / 队列 / 版本上下文拉取 OP.GG 推荐数据
 */

import { logger } from '@/index'
import { injector } from '@/lib/InjectorManager'
import { createElement } from 'react'
import { flushSync } from 'react-dom'
import { createRoot, type Root } from 'react-dom/client'
import { getQueue, getQueueName } from '@/lib/assets'
import { OpggBuildRecommendationPanel, type BuildRecommendation, type RecommendationContext } from '@/components/ui/OpggBuildRecommendationPanel'
import { lcu, LcuEventUri, type ChampSelectSession, type LCUEventMessage } from '@/lib/lcu'
import { store } from '@/lib/store'
import {
  opggApi,
  type OpggAugmentGroup,
  type OpggArenaModeChampion,
  type OpggChampion,
  type OpggMode,
  type OpggNormalModeChampion,
  type OpggPosition,
  type OpggTier,
} from '@/lib/opgg-api'
import type { GameflowPhase } from '@/types/lcu'

const TARGET_SELECTOR = '.toggle-ability-previews-button'
const HIJACK_ATTR = 'data-sona-opgg-build-hijacked'
const PANEL_ID = 'sona-opgg-build-panel'
const DEFAULT_OPGG_TIER: OpggTier = 'master_plus'
const SELECTABLE_OPGG_TIERS: OpggTier[] = [
  'all',
  'challenger',
  'grandmaster',
  'master_plus',
  'master',
  'diamond_plus',
  'diamond',
  'emerald_plus',
  'emerald',
  'platinum_plus',
  'platinum',
  'gold_plus',
  'gold',
  'silver',
  'bronze',
  'iron',
]

interface RecommendationCacheEntry {
  key: string
  context: RecommendationContext
  promise: Promise<BuildRecommendation | null>
  data?: BuildRecommendation | null
  error?: string
  updatedAt: number
}

const MAX_RECOMMENDATION_CACHE_SIZE = 8

let phaseUnsub: (() => void) | null = null
let champSelectUnsub: (() => void) | null = null
let injectRegistered = false
let currentContext: RecommendationContext = {
  championId: 0,
  queueId: 0,
  gameVersion: '',
  gameMode: '',
  position: 'none',
}
const boundElements: Array<{ el: HTMLElement; handler: EventListener; originalText: string }> = []
const recommendationCache = new Map<string, RecommendationCacheEntry>()
let outsideCloseHandler: ((event: MouseEvent) => void) | null = null
let activePanelKey = ''
let panelReactRoot: Root | null = null

function getLocalChampionId(session: ChampSelectSession): number {
  const localPlayer = session.myTeam.find((player) => player.cellId === session.localPlayerCellId)
  return localPlayer?.championId ?? 0
}

function getLocalPlayer(session: ChampSelectSession) {
  return session.myTeam.find((player) => player.cellId === session.localPlayerCellId)
}

function mapAssignedPosition(position: string | undefined): OpggPosition {
  switch (position) {
    case 'top':
      return 'top'
    case 'jungle':
      return 'jungle'
    case 'middle':
    case 'mid':
      return 'mid'
    case 'bottom':
    case 'bot':
      return 'adc'
    case 'utility':
    case 'support':
      return 'support'
    default:
      return 'none'
  }
}

async function resolveGameMode(queueId: number): Promise<string> {
  const queueMode = getQueue(queueId)?.gameMode
  if (queueMode) return queueMode

  const session = await lcu.getGameflowSession().catch(() => null)
  return session?.gameData?.queue?.gameMode || session?.map?.gameMode || ''
}

function resolveOpggMode(context: RecommendationContext): OpggMode {
  const mode = context.gameMode.toLowerCase()
  if (mode === 'aram' || mode === 'kiwi') return 'aram'
  if (mode === 'cherry' || mode === 'arena') return 'arena'
  if (mode === 'nexusblitz' || mode === 'nexus_blitz') return 'nexus_blitz'
  if (mode === 'urf' || mode === 'arurf') return 'urf'
  return 'ranked'
}

function isKiwiMode(context: RecommendationContext): boolean {
  return context.gameMode.toLowerCase() === 'kiwi'
}

function isArenaChampion(data: OpggChampion): data is OpggArenaModeChampion {
  return 'synergies' in data.data
}

function isNormalChampion(data: OpggChampion): data is OpggNormalModeChampion {
  return 'rune_pages' in data.data
}

function getAugmentGroups(data: OpggChampion): OpggAugmentGroup[] {
  return 'augment_group' in data.data && Array.isArray(data.data.augment_group)
    ? data.data.augment_group
    : []
}

function getRecommendationCacheKey(context: RecommendationContext): string {
  const mode = resolveOpggMode(context)
  const position = mode === 'ranked'
    ? (context.position === 'none' ? 'mid' : context.position)
    : 'none'
  const tier = getEffectiveOpggTier(context)

  return [
    context.championId,
    context.queueId,
    context.gameMode || 'unknown',
    mode,
    position,
    tier,
    'latest',
  ].join('|')
}

function normalizeOpggTier(value: string): OpggTier {
  return SELECTABLE_OPGG_TIERS.includes(value as OpggTier) ? value as OpggTier : DEFAULT_OPGG_TIER
}

function getSelectedOpggTier(): OpggTier {
  return normalizeOpggTier(store.get('opggBuildRecommendationTier'))
}

function getEffectiveOpggTier(context: RecommendationContext): OpggTier {
  return resolveOpggMode(context) === 'arena' ? 'all' : getSelectedOpggTier()
}

function ensureRecommendationPrefetch(context: RecommendationContext): RecommendationCacheEntry | null {
  if (context.championId <= 0) return null

  const snapshot = { ...context }
  const key = getRecommendationCacheKey(snapshot)
  const cached = recommendationCache.get(key)
  if (cached) return cached

  const entry: RecommendationCacheEntry = {
    key,
    context: snapshot,
    updatedAt: Date.now(),
    promise: Promise.resolve(null),
  }

  entry.promise = loadRecommendation(snapshot)
    .then((data) => {
      entry.data = data
      entry.updatedAt = Date.now()
      logger.info('[OPGG] 配装推荐缓存完成 → %s', key)
      return data
    })
    .catch((err) => {
      entry.error = err instanceof Error ? err.message : String(err)
      entry.data = null
      entry.updatedAt = Date.now()
      logger.warn('[OPGG] 配装推荐预拉取失败:', err)
      return null
    })

  recommendationCache.set(key, entry)
  trimRecommendationCache()
  logger.info('[OPGG] 开始后台预拉取配装推荐 → %s', key)
  return entry
}

function trimRecommendationCache() {
  if (recommendationCache.size <= MAX_RECOMMENDATION_CACHE_SIZE) return

  const entries = Array.from(recommendationCache.values())
    .sort((a, b) => a.updatedAt - b.updatedAt)
  for (const entry of entries.slice(0, recommendationCache.size - MAX_RECOMMENDATION_CACHE_SIZE)) {
    recommendationCache.delete(entry.key)
  }
}

async function refreshContext(session?: ChampSelectSession) {
  try {
    const currentSession = session ?? await lcu.getChampSelectSession()
    const localPlayer = getLocalPlayer(currentSession)
    const queueId = currentSession.queueId ?? 0
    currentContext = {
      championId: localPlayer?.championId ?? getLocalChampionId(currentSession),
      queueId,
      gameVersion: currentContext.gameVersion,
      gameMode: await resolveGameMode(queueId),
      position: mapAssignedPosition(localPlayer?.assignedPosition),
    }

    if (!currentContext.gameVersion) {
      currentContext.gameVersion = await lcu.getGameVersion().catch(() => '')
    }

    logger.info(
      '[OPGG] ChampSelect context refreshed → championId=%d, queueId=%d, gameMode=%s, position=%s, version=%s',
      currentContext.championId,
      currentContext.queueId,
      currentContext.gameMode || 'unknown',
      currentContext.position,
      currentContext.gameVersion || 'unknown',
    )

    if (currentContext.championId > 0) {
      mount()
      ensureRecommendationPrefetch(currentContext)
    } else {
      unmount(false)
    }
  } catch (err) {
    logger.warn('[OPGG] 刷新选人上下文失败:', err)
  }
}

async function loadRecommendation(context: RecommendationContext): Promise<BuildRecommendation | null> {
  if (context.championId <= 0) return null

  const mode = resolveOpggMode(context)
  const position = mode === 'ranked' ? (context.position === 'none' ? 'mid' : context.position) : 'none'
  const tier = getEffectiveOpggTier(context)
  const mainChampion = await getChampionWithVersionFallback({
    id: context.championId,
    mode,
    tier,
    position,
  })

  let warning: string | undefined
  let augmentGroups = getAugmentGroups(mainChampion)

  if (isKiwiMode(context) && augmentGroups.length === 0) {
    try {
      const arenaChampion = await getChampionWithVersionFallback({
        id: context.championId,
        mode: 'arena',
        tier: 'all',
      })
      augmentGroups = getAugmentGroups(arenaChampion)
    } catch (err) {
      warning = `KIWI 海克斯推荐请求失败：${err instanceof Error ? err.message : String(err)}`
      logger.warn('[OPGG] KIWI 海克斯推荐请求失败:', err)
    }
  }

  const normal = isNormalChampion(mainChampion) ? mainChampion : null
  const arena = isArenaChampion(mainChampion) ? mainChampion : null
  const data = mainChampion.data

  return {
    mode,
    modeLabel: getModeLabel(mode, context),
    version: mainChampion.meta.version,
    position,
    summary: getSummaryLines(mainChampion),
    summonerSpells: normal?.data.summoner_spells ?? [],
    starterItems: data.starter_items ?? [],
    boots: data.boots ?? [],
    coreItems: data.core_items ?? [],
    prismItems: arena?.data.prism_items ?? [],
    lastItems: data.last_items ?? [],
    runePages: normal?.data.runes ?? [],
    augments: augmentGroups.map((group) => ({
      rarity: group.rarity,
      items: group.augments.slice(0, 5).map((augment) => ({
        id: augment.id,
        pickRate: augment.pick_rate,
        averagePlace: augment.total_place / Math.max(augment.play, 1),
        firstPlace: augment.first_place / Math.max(augment.play, 1),
      })),
    })),
    meta: getRecommendationMeta(mainChampion),
    warning,
  }
}

function getRecommendationMeta(champion: OpggChampion): BuildRecommendation['meta'] {
  const stats = champion.data.summary.average_stats
  const tierData = 'tier_data' in stats ? stats.tier_data : undefined
  const rank = tierData?.rank && tierData.rank > 0 ? tierData.rank : stats.rank > 0 ? stats.rank : null
  const previousRank = tierData?.rank_prev && tierData.rank_prev > 0 ? tierData.rank_prev : null
  let totalRank: number | null = null

  if (isNormalChampion(champion)) {
    const trends = champion.data.trends
    totalRank = trends?.total_position_rank || trends?.total_rank || null
  }

  return {
    rank,
    previousRank,
    // 排名数字越小越强：从 #80 到 #60 记为上升 20。
    rankDelta: rank != null && previousRank != null ? previousRank - rank : null,
    totalRank,
    matchCount: champion.meta.match_count ?? null,
    version: champion.meta.version,
    updatedAt: champion.meta.analyzed_at ?? champion.meta.cached_at ?? '',
  }
}

async function getChampionWithVersionFallback(options: {
  id: number
  mode: OpggMode
  tier: OpggTier
  position?: OpggPosition
  version?: string
}): Promise<OpggChampion> {
  try {
    return await opggApi.getChampion({ ...options, region: 'global' })
  } catch (err) {
    if (!options.version) throw err
    logger.warn('[OPGG] 版本 %s 请求失败，回退到 OP.GG 最新版本:', options.version, err)
    return opggApi.getChampion({ ...options, region: 'global', version: undefined })
  }
}

function getModeLabel(mode: OpggMode, context: RecommendationContext): string {
  const queueName = context.queueId > 0 ? getQueueName(context.queueId) : ''
  if (isKiwiMode(context)) return queueName || '海克斯大乱斗'
  if (queueName) return queueName
  switch (mode) {
    case 'aram':
      return '极地大乱斗'
    case 'arena':
      return '斗魂竞技场'
    case 'urf':
      return '无限火力'
    case 'nexus_blitz':
      return '极限闪击'
    default:
      return '召唤师峡谷'
  }
}

function getSummaryLines(champion: OpggChampion): string[] {
  if (isArenaChampion(champion)) {
    const stats = champion.data.summary.average_stats
    return [
      `排名 #${stats.rank || '-'}`,
      `Tier ${stats.tier || '-'}`,
      `登场 ${(stats.pick_rate * 100).toFixed(1)}%`,
    ]
  }

  const stats = champion.data.summary.average_stats
  return [
    `总体胜率 ${(stats.win_rate * 100).toFixed(1)}%`,
    `登场 ${(stats.pick_rate * 100).toFixed(1)}%`,
    `Tier ${stats.tier || '-'}`,
  ]
}

function closePanel() {
  if (panelReactRoot) {
    panelReactRoot.unmount()
    panelReactRoot = null
  }
  document.getElementById(PANEL_ID)?.remove()
  activePanelKey = ''
  if (outsideCloseHandler) {
    document.removeEventListener('mousedown', outsideCloseHandler, true)
    outsideCloseHandler = null
  }
}

async function openRecommendationPanel(anchor: HTMLElement, contextOverride?: RecommendationContext) {
  if (contextOverride) {
    currentContext = { ...contextOverride }
  } else if (currentContext.championId <= 0) {
    await refreshContext()
  } else {
    void refreshContext()
  }

  const context = contextOverride ? { ...contextOverride } : { ...currentContext }
  const cacheEntry = ensureRecommendationPrefetch(context)
  const recommendation = cacheEntry?.data ?? null
  const loadError = cacheEntry?.error ?? ''
  const isLoading = Boolean(cacheEntry && cacheEntry.data === undefined && !cacheEntry.error)

  closePanel()
  activePanelKey = cacheEntry?.key ?? ''

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
    'width:1060px',
    'max-width:calc(100vw - 56px)',
    'background:#010a13',
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

  const reactRoot = createRoot(view)
  panelReactRoot = reactRoot
  const handleTierChange = (tier: OpggTier) => {
    const nextTier = normalizeOpggTier(tier)
    store.set('opggBuildRecommendationTier', nextTier)
    recommendationCache.delete(getRecommendationCacheKey(context))
    void openRecommendationPanel(anchor, context)
  }

  renderRecommendationPanel(reactRoot, context, recommendation, loadError, isLoading, getSelectedOpggTier(), handleTierChange)
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

  if (cacheEntry && isLoading) {
    cacheEntry.promise.then(() => {
      if (document.getElementById(PANEL_ID) !== root || activePanelKey !== cacheEntry.key || panelReactRoot !== reactRoot) return

      renderRecommendationPanel(
        reactRoot,
        cacheEntry.context,
        cacheEntry.data ?? null,
        cacheEntry.error ?? '',
        false,
        getSelectedOpggTier(),
        handleTierChange,
      )

      const updatedRect = anchor.getBoundingClientRect()
      const updatedWidth = container.offsetWidth
      const updatedHeight = container.offsetHeight
      const updatedLeft = Math.max(20, Math.min(updatedRect.left + updatedRect.width / 2 - updatedWidth / 2, window.innerWidth - updatedWidth - 20))
      const updatedTop = Math.max(20, updatedRect.top - updatedHeight - margin)
      container.style.left = `${updatedLeft}px`
      container.style.top = `${updatedTop}px`
    })
  }
}

export async function openOpggBuildRecommendationDebugPanel(anchor: HTMLElement, championId = 68) {
  const gameVersion = await lcu.getGameVersion().catch(() => currentContext.gameVersion)
  await openRecommendationPanel(anchor, {
    championId,
    queueId: 3100,
    gameVersion,
    gameMode: 'KIWI',
    position: 'none',
  })
}

function renderRecommendationPanel(
  root: Root,
  context: RecommendationContext,
  recommendation: BuildRecommendation | null,
  loadError: string,
  isLoading: boolean,
  selectedTier: OpggTier,
  onTierChange: (tier: OpggTier) => void,
): void {
  flushSync(() => {
    root.render(createElement(OpggBuildRecommendationPanel, {
      context,
      recommendation,
      loadError,
      isLoading,
      selectedTier,
      onTierChange,
      onClose: closePanel,
    }))
  })
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
      if (document.getElementById(PANEL_ID)) {
        closePanel()
        return
      }
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
    currentContext = {
      championId: 0,
      queueId: 0,
      gameVersion: currentContext.gameVersion,
      gameMode: '',
      position: 'none',
    }
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

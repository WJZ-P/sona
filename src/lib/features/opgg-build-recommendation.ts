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
import {
  getAugmentInfo,
  getChampionById,
  getItemIcon,
  getItemName,
  getPerkIcon,
  getPerkName,
  getPerkStyleIcon,
  getPerkStyleName,
  getQueue,
  getQueueName,
  getSpellIcon,
  getSpellName,
} from '@/lib/assets'
import { lcu, LcuEventUri, type ChampSelectSession, type LCUEventMessage } from '@/lib/lcu'
import {
  normalizeOpggVersion,
  opggApi,
  type OpggAugmentGroup,
  type OpggArenaModeChampion,
  type OpggChampion,
  type OpggItemBuild,
  type OpggMode,
  type OpggNormalModeChampion,
  type OpggPosition,
  type OpggRuneBuild,
  type OpggTier,
} from '@/lib/opgg-api'
import type { GameflowPhase } from '@/types/lcu'

const TARGET_SELECTOR = '.toggle-ability-previews-button'
const HIJACK_ATTR = 'data-sona-opgg-build-hijacked'
const PANEL_ID = 'sona-opgg-build-panel'

interface RecommendationContext {
  championId: number
  queueId: number
  gameVersion: string
  gameMode: string
  position: OpggPosition
}

interface BuildRecommendation {
  mode: OpggMode
  modeLabel: string
  version: string
  position: OpggPosition
  summary: string[]
  summonerSpells: OpggItemBuild[]
  starterItems: OpggItemBuild[]
  boots: OpggItemBuild[]
  coreItems: OpggItemBuild[]
  prismItems: OpggItemBuild[]
  lastItems: OpggItemBuild[]
  runePages: OpggRuneBuild[]
  augments: Array<{ rarity: number; items: Array<{ id: number; pickRate: number; averagePlace: number; firstPlace: number }> }>
  warning?: string
}

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

  return [
    context.championId,
    context.queueId,
    context.gameMode || 'unknown',
    mode,
    position,
    'latest',
  ].join('|')
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
  const mainChampion = await getChampionWithVersionFallback({
    id: context.championId,
    mode,
    tier: mode === 'arena' ? 'all' : 'platinum_plus',
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
      items: group.augments.slice(0, 4).map((augment) => ({
        id: augment.id,
        pickRate: augment.pick_rate,
        averagePlace: augment.total_place / Math.max(augment.play, 1),
        firstPlace: augment.first_place / Math.max(augment.play, 1),
      })),
    })),
    warning,
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
    `胜率 ${(stats.win_rate * 100).toFixed(1)}%`,
    `登场 ${(stats.pick_rate * 100).toFixed(1)}%`,
    `Tier ${stats.tier || '-'}`,
  ]
}

function formatPercent(value: number | undefined): string {
  if (!Number.isFinite(value)) return '-'
  return `${((value ?? 0) * 100).toFixed(1)}%`
}

function formatPlace(value: number | undefined): string {
  if (!Number.isFinite(value)) return '-'
  return `${(value ?? 0).toFixed(2)}名`
}

function closePanel() {
  document.getElementById(PANEL_ID)?.remove()
  activePanelKey = ''
  if (outsideCloseHandler) {
    document.removeEventListener('mousedown', outsideCloseHandler, true)
    outsideCloseHandler = null
  }
}

async function openRecommendationPanel(anchor: HTMLElement) {
  if (currentContext.championId <= 0) {
    await refreshContext()
  } else {
    void refreshContext()
  }

  const context = { ...currentContext }
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

  view.innerHTML = renderRecommendationPanelContent(context, recommendation, loadError, isLoading)

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

  if (cacheEntry && isLoading) {
    cacheEntry.promise.then(() => {
      if (document.getElementById(PANEL_ID) !== root || activePanelKey !== cacheEntry.key) return

      view.innerHTML = renderRecommendationPanelContent(
        cacheEntry.context,
        cacheEntry.data ?? null,
        cacheEntry.error ?? '',
        false,
      )
      view.querySelector('[data-sona-close]')?.addEventListener('click', closePanel)

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

function renderRecommendationPanelContent(
  context: RecommendationContext,
  recommendation: BuildRecommendation | null,
  loadError: string,
  isLoading: boolean,
): string {
  const champion = getChampionById(context.championId)
  const championName = champion ? `${champion.title} ${champion.name}` : '未识别英雄'
  const escapedChampionName = escapeHtml(championName)
  const versionText = recommendation?.version || normalizeOpggVersion(context.gameVersion) || context.gameVersion || '未知版本'
  const queueText = recommendation?.modeLabel || (context.queueId > 0 ? getQueueName(context.queueId) : '未知队列')

  return `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #3c2e16;background:#1e2328b8;">
      <div>
        <div style="color:#c8aa6e;font-size:15px;font-weight:700;letter-spacing:2px;">配装推荐</div>
        <div style="margin-top:4px;color:#7e7e7e;font-size:12px;">OP.GG · ${escapeHtml(versionText)} · ${escapeHtml(queueText)}</div>
      </div>
      <button type="button" data-sona-close style="width:28px;height:28px;border:1px solid transparent;background:#010a1399;color:#c8aa6e80;cursor:pointer;font-size:18px;line-height:24px;">×</button>
    </div>
    <div style="padding:18px 20px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <img src="/lol-game-data/assets/v1/champion-icons/${context.championId}.png" alt="" style="width:48px;height:48px;border-radius:50%;border:1px solid #c8aa6e;background:#010a13;object-fit:cover;" />
        <div>
          <div style="color:#f0e6d2;font-size:16px;font-weight:700;">${escapedChampionName}</div>
          <div style="margin-top:3px;color:#785a28;font-size:12px;font-family:monospace;">championId=${context.championId || 'N/A'} · ${escapeHtml(context.gameMode || 'unknown')} · ${escapeHtml(recommendation?.position ?? context.position)}</div>
        </div>
        <div style="margin-left:auto;display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;">
          ${renderSummaryChips(recommendation?.summary ?? [])}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        ${renderItemSection('出门装', recommendation?.starterItems, 2)}
        ${renderSpellSection('召唤师技能', recommendation?.summonerSpells, 2)}
        ${renderItemSection('核心装备', recommendation?.coreItems, 3)}
        ${renderItemSection('鞋子', recommendation?.boots, 2)}
        ${renderRuneSection('符文推荐', recommendation?.runePages)}
        ${renderItemSection(recommendation?.mode === 'arena' ? '棱彩装备' : '后期装备', recommendation?.mode === 'arena' ? recommendation?.prismItems : recommendation?.lastItems, 4)}
        ${isKiwiMode(context) || recommendation?.mode === 'arena' ? renderAugmentSection('海克斯推荐', recommendation?.augments) : ''}
      </div>
      ${isLoading ? renderMessage('正在后台加载 OP.GG 推荐数据，完成后会自动刷新。', false) : ''}
      ${loadError ? renderMessage(`OP.GG 请求失败：${loadError}`, true) : ''}
      ${recommendation?.warning ? renderMessage(recommendation.warning, true) : ''}
      ${!isLoading && !loadError && !recommendation ? renderMessage('暂无可用 OP.GG 推荐数据。', false) : ''}
    </div>
  `
}

function renderSummaryChips(values: string[]): string {
  return values.map((value) => `
    <span style="padding:3px 7px;background:#010a1399;border:1px solid rgba(200,170,110,0.22);color:#c8aa6e;font-size:11px;">${escapeHtml(value)}</span>
  `).join('')
}

function renderSection(title: string, content: string, minHeight = 92): string {
  return `
    <div style="min-height:${minHeight}px;padding:12px;background:#010a1399;border:1px solid #3c2e16;">
      <div style="color:#c8aa6e;font-size:12px;font-weight:700;letter-spacing:1px;">${escapeHtml(title)}</div>
      ${content || '<div style="margin-top:7px;color:#5c5b57;font-style:italic;">暂无数据</div>'}
    </div>
  `
}

function renderItemSection(title: string, builds: OpggItemBuild[] | undefined, itemLimit: number): string {
  const content = builds?.slice(0, 3).map((build, index) => `
    <div style="display:flex;align-items:center;gap:7px;margin-top:9px;">
      <div style="width:18px;color:#785a28;font-size:11px;">#${index + 1}</div>
      <div style="display:flex;gap:3px;min-width:0;">
        ${build.ids.slice(0, itemLimit).map((id) => renderIcon(getItemIcon(id), getItemName(id), 24)).join('')}
      </div>
      <div style="margin-left:auto;color:#7e7e7e;font-size:11px;white-space:nowrap;">${formatPercent(build.pick_rate)}</div>
    </div>
  `).join('')

  return renderSection(title, content ?? '')
}

function renderSpellSection(title: string, builds: OpggItemBuild[] | undefined, limit: number): string {
  const content = builds?.slice(0, limit).map((build, index) => `
    <div style="display:flex;align-items:center;gap:7px;margin-top:9px;">
      <div style="width:18px;color:#785a28;font-size:11px;">#${index + 1}</div>
      <div style="display:flex;gap:3px;">
        ${build.ids.map((id) => renderIcon(getSpellIcon(id), getSpellName(id), 24)).join('')}
      </div>
      <div style="margin-left:auto;color:#7e7e7e;font-size:11px;">${formatPercent(build.pick_rate)}</div>
    </div>
  `).join('')

  return renderSection(title, content ?? '')
}

function renderRuneSection(title: string, runes: OpggRuneBuild[] | undefined): string {
  const content = runes?.slice(0, 2).map((rune, index) => `
    <div style="display:flex;align-items:center;gap:7px;margin-top:9px;">
      <div style="width:18px;color:#785a28;font-size:11px;">#${index + 1}</div>
      ${renderIcon(getPerkStyleIcon(rune.primary_page_id), getPerkStyleName(rune.primary_page_id), 22)}
      ${rune.primary_rune_ids.slice(0, 4).map((id) => renderIcon(getPerkIcon(id), getPerkName(id), 22)).join('')}
      ${renderIcon(getPerkStyleIcon(rune.secondary_page_id), getPerkStyleName(rune.secondary_page_id), 22)}
      <div style="margin-left:auto;color:#7e7e7e;font-size:11px;white-space:nowrap;">${formatPercent(rune.pick_rate)}</div>
    </div>
  `).join('')

  return renderSection(title, content ?? '', 106)
}

function renderAugmentSection(title: string, groups: BuildRecommendation['augments'] | undefined): string {
  const content = groups?.map((group) => `
    <div style="margin-top:10px;">
      <div style="margin-bottom:5px;color:#785a28;font-size:11px;">${escapeHtml(getAugmentRarityLabel(group.rarity))}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
        ${group.items.map((augment) => {
    const info = getAugmentInfo(augment.id)
    return `
          <div style="display:flex;align-items:center;gap:6px;min-width:0;">
            ${renderIcon(info?.iconPath ?? '', info?.name ?? String(augment.id), 24, getAugmentBorder(info?.rarity))}
            <div style="min-width:0;">
              <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#f0e6d2;font-size:11px;">${escapeHtml(info?.name ?? String(augment.id))}</div>
              <div style="color:#7e7e7e;font-size:10px;">登场 ${formatPercent(augment.pickRate)} · 均排 ${formatPlace(augment.averagePlace)}</div>
            </div>
          </div>
        `
  }).join('')}
      </div>
    </div>
  `).join('')

  return `<div style="grid-column:1 / -1;">${renderSection(title, content ?? '', 120)}</div>`
}

function renderMessage(message: string, isWarning: boolean): string {
  return `
    <div style="margin-top:12px;padding:10px 12px;background:#1e232866;border:1px solid ${isWarning ? 'rgba(201,80,64,0.35)' : 'rgba(200,170,110,0.16)'};font-size:12px;line-height:1.6;color:${isWarning ? '#cdbe91' : '#a09b8c'};">
      ${escapeHtml(message)}
    </div>
  `
}

function renderIcon(src: string, title: string, size: number, border = '#3c2e16'): string {
  if (!src) {
    return `<span title="${escapeHtml(title)}" style="display:inline-flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border:1px solid ${border};background:#1e2328;color:#785a28;font-size:10px;">?</span>`
  }

  return `<img src="${escapeHtml(src)}" title="${escapeHtml(title)}" alt="" style="width:${size}px;height:${size}px;border:1px solid ${border};background:#1e2328;object-fit:cover;" />`
}

function getAugmentRarityLabel(rarity: number): string {
  if (rarity === 1) return '银色'
  if (rarity === 4) return '金色'
  if (rarity === 8) return '棱彩'
  return `稀有度 ${rarity}`
}

function getAugmentBorder(rarity: string | undefined): string {
  if (rarity === 'kPrismatic') return '#b788ff'
  if (rarity === 'kGold') return '#c8aa6e'
  if (rarity === 'kSilver') return '#a09b8c'
  return '#3c2e16'
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

/**
 * 英雄选择网格 T 级角标
 *
 * 在客户端英雄选择网格的 .champion-grid-champion-thumbnail 左上角展示全英雄梯度：
 * 常规模式使用 OP.GG，海克斯大乱斗（KIWI）使用 ARAM.GG 的专属 T1-T5 数据。
 * 跟随“英雄选择阶段增强”开关启用。
 */

import { logger } from '@/index'
import { injector } from '@/lib/InjectorManager'
import { getQueue } from '@/lib/assets'
import { lcu, LcuEventUri, type ChampSelectSession, type LCUEventMessage } from '@/lib/lcu'
import { aramggApi, type AramggChampionsStats } from '@/lib/aramgg-api'
import { opggApi, type OpggChampionsTier, type OpggMode, type OpggRankedDataItem, type OpggTier } from '@/lib/opgg-api'
import { store } from '@/lib/store'
import type { GameflowPhase } from '@/types/lcu'

import tierOpIcon from '@/../assets/tier/op.svg'
import tier1Icon from '@/../assets/tier/t1.svg'
import tier2Icon from '@/../assets/tier/t2.svg'
import tier3Icon from '@/../assets/tier/t3.svg'
import tier4Icon from '@/../assets/tier/t4.svg'
import tier5Icon from '@/../assets/tier/t5.svg'

const BADGE_TARGETS = [
  { selector: '.champion-grid-champion-thumbnail', size: 22, left: -2, top: 0 },
  { selector: '.champion-card-component-click-target', size: 22, left: -2, top: 0 },
  { selector: '.bench-champion-icon', size: 18, left: -2, top: -2 },
]
const PLAYER_ICON_BADGE_TARGET = { size: 20, left: -2, top: 'auto', bottom: -2 }
const BADGE_TARGET_SELECTOR = BADGE_TARGETS.map((target) => target.selector).join(',')
const BADGE_ATTR = 'data-sona-champ-tier-badge'
const POSITION_ATTR = 'data-sona-original-position'
const DEFAULT_OPGG_TIER: OpggTier = 'emerald_plus'
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

const TIER_ICON_MAP = new Map<number, string>([
  [0, tierOpIcon],
  [1, tier1Icon],
  [2, tier2Icon],
  [3, tier3Icon],
  [4, tier4Icon],
  [5, tier5Icon],
])

const TIER_LABEL_MAP = new Map<number, string>([
  [0, 'OP'],
  [1, 'T1'],
  [2, 'T2'],
  [3, 'T3'],
  [4, 'T4'],
  [5, 'T5'],
])
type TierDataMode = OpggMode | 'kiwi'

const PRELOAD_MODES: TierDataMode[] = ['ranked', 'aram', 'arena', 'kiwi', 'urf', 'nexus_blitz']

interface TierCacheEntry {
  data?: Map<number, ChampionTierStats>
  promise?: Promise<Map<number, ChampionTierStats>>
}

interface ChampionTierStats {
  tier: number | null
  winRate: number | null
}

let phaseUnsub: (() => void) | null = null
let champSelectUnsub: (() => void) | null = null
let injectRegistered = false
let tierByChampionId = new Map<number, ChampionTierStats>()
let currentSession: ChampSelectSession | null = null
let currentCacheKey = ''
let loadToken = 0
const tierCache = new Map<string, TierCacheEntry>()

function normalizeOpggTier(value: string): OpggTier {
  return SELECTABLE_OPGG_TIERS.includes(value as OpggTier) ? value as OpggTier : DEFAULT_OPGG_TIER
}

function resolveTierDataMode(gameMode: string): TierDataMode {
  const mode = gameMode.toLowerCase()
  if (mode === 'kiwi') return 'kiwi'
  if (mode === 'aram') return 'aram'
  if (mode === 'cherry' || mode === 'arena') return 'arena'
  if (mode === 'nexusblitz' || mode === 'nexus_blitz') return 'nexus_blitz'
  if (mode === 'urf' || mode === 'arurf') return 'urf'
  return 'ranked'
}

function getEffectiveTier(mode: TierDataMode): OpggTier {
  return mode === 'arena' || mode === 'kiwi' ? 'all' : normalizeOpggTier(store.get('opggBuildRecommendationTier'))
}

function getTierCacheKey(mode: TierDataMode, tier: OpggTier): string {
  return `${mode}|${tier}`
}

function getBestRankedStats(champion: OpggRankedDataItem): ChampionTierStats {
  const rankedPosition = champion.positions
    .filter((position) => Number.isFinite(position.stats?.tier_data?.tier))
    .sort((left, right) => left.stats.tier_data.tier - right.stats.tier_data.tier)[0]

  if (rankedPosition) {
    return {
      tier: rankedPosition.stats.tier_data.tier,
      winRate: toValidWinRate(rankedPosition.stats.win_rate),
    }
  }

  return {
    tier: toValidTier(champion.average_stats?.tier),
    winRate: toValidWinRate(champion.average_stats?.win_rate),
  }
}

function extractStatsFromChampion(champion: OpggChampionsTier['data'][number], mode: OpggMode): ChampionTierStats {
  if (mode === 'ranked') {
    return getBestRankedStats(champion as OpggRankedDataItem)
  }

  const averageStats = champion.average_stats
  if (!averageStats) return { tier: null, winRate: null }

  const winRate = 'win_rate' in averageStats
    ? toValidWinRate(averageStats.win_rate)
    : toValidWinRate(averageStats.play > 0 ? averageStats.win / averageStats.play : null)

  return {
    tier: toValidTier(averageStats.tier),
    winRate,
  }
}

function toValidTier(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 5 ? value : null
}

function toValidWinRate(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null
}

function buildTierMap(data: OpggChampionsTier, mode: OpggMode): Map<number, ChampionTierStats> {
  const result = new Map<number, ChampionTierStats>()

  for (const champion of data.data) {
    const stats = extractStatsFromChampion(champion, mode)
    if (stats.tier != null || stats.winRate != null) result.set(champion.id, stats)
  }

  return result
}

function buildAramggTierMap(data: AramggChampionsStats): Map<number, ChampionTierStats> {
  const result = new Map<number, ChampionTierStats>()

  for (const champion of data) {
    const championId = Number(champion.championId)
    const tier = Number(champion.tier)
    const winRate = champion.winRate
    if (!Number.isFinite(championId) || championId <= 0) continue

    const stats: ChampionTierStats = {
      tier: Number.isFinite(tier) && tier >= 1 && tier <= 5 ? tier : null,
      winRate: toValidWinRate(winRate),
    }
    if (stats.tier != null || stats.winRate != null) result.set(championId, stats)
  }

  return result
}

function ensureTierMap(mode: TierDataMode, tier = getEffectiveTier(mode)): Promise<Map<number, ChampionTierStats>> {
  const cacheKey = getTierCacheKey(mode, tier)
  const cached = tierCache.get(cacheKey)
  if (cached?.data) return Promise.resolve(cached.data)
  if (cached?.promise) return cached.promise

  const entry: TierCacheEntry = {}
  const source = mode === 'kiwi' ? 'ARAM.GG' : 'OP.GG'
  entry.promise = (mode === 'kiwi'
    ? aramggApi.getChampionsStats().then(buildAramggTierMap)
    : opggApi.getChampionsTier({ region: 'global', mode, tier }).then((data) => buildTierMap(data, mode)))
    .then((tierMap) => {
      entry.data = tierMap
      entry.promise = undefined
      logger.info('[ChampTier] 已缓存 %s 英雄 T 级 → mode=%s, tier=%s, count=%d', source, mode, tier, tierMap.size)
      return tierMap
    })
    .catch((err) => {
      entry.promise = undefined
      tierCache.delete(cacheKey)
      logger.warn('[ChampTier] %s 英雄 T 级预加载失败 → mode=%s, tier=%s:', source, mode, tier, err)
      throw err
    })

  tierCache.set(cacheKey, entry)
  return entry.promise
}

export function preloadChampSelectTierBadgeData() {
  const selectedTier = normalizeOpggTier(store.get('opggBuildRecommendationTier'))
  logger.info('[ChampTier] 开始预加载全模式英雄 T 级数据 → tier=%s', selectedTier)

  PRELOAD_MODES.forEach((mode) => {
    const tier = mode === 'arena' || mode === 'kiwi' ? 'all' : selectedTier
    void ensureTierMap(mode, tier).catch(() => { /* logged in ensureTierMap */ })
  })
}

async function resolveCurrentContext(session?: ChampSelectSession): Promise<{ mode: TierDataMode; gameMode: string; queueId: number }> {
  const currentSession = session ?? await lcu.getChampSelectSession().catch(() => null)
  const queueId = currentSession?.queueId ?? 0
  const queueMode = queueId > 0 ? getQueue(queueId)?.gameMode : ''

  if (queueMode) {
    return { mode: resolveTierDataMode(queueMode), gameMode: queueMode, queueId }
  }

  const gameflow = await lcu.getGameflowSession().catch(() => null)
  const gameMode = gameflow?.gameData?.queue?.gameMode || gameflow?.map?.gameMode || ''
  return { mode: resolveTierDataMode(gameMode), gameMode, queueId: queueId || gameflow?.gameData?.queue?.id || 0 }
}

async function loadTierData(session?: ChampSelectSession) {
  const token = ++loadToken
  const activeSession = session ?? await lcu.getChampSelectSession().catch(() => null)
  currentSession = activeSession
  const { mode, gameMode, queueId } = await resolveCurrentContext(activeSession ?? undefined)
  const tier = getEffectiveTier(mode)
  const cacheKey = getTierCacheKey(mode, tier)

  if (cacheKey === currentCacheKey && tierByChampionId.size > 0) {
    tryInjectTierBadges()
    return
  }

  currentCacheKey = cacheKey
  logger.info('[ChampTier] 读取英雄 T 级缓存 → mode=%s, tier=%s, gameMode=%s, queueId=%d', mode, tier, gameMode || 'unknown', queueId)

  try {
    const tierMap = await ensureTierMap(mode, tier)
    if (token !== loadToken) return

    tierByChampionId = tierMap
    tryInjectTierBadges()
  } catch (err) {
    if (token !== loadToken) return
    tierByChampionId = new Map()
  }
}

function extractChampionId(target: Element): number | null {
  const candidates = [
    target,
    target.parentElement,
    target.closest('.champion-card-component'),
    target.closest('.bench-champion'),
    target.closest('.champion-grid-champion'),
    target.closest('[data-champion-id]'),
    target.closest('[data-champion-id-value]'),
    target.closest('[data-champion-id-string]'),
  ].filter(Boolean) as Element[]

  for (const element of candidates) {
    for (const attr of ['data-champion-id', 'data-champion-id-value', 'data-champion-id-string', 'champion-id']) {
      const value = element.getAttribute(attr)
      if (value && /^\d+$/.test(value)) return Number(value)
    }
  }

  for (const element of candidates) {
    const image = element.querySelector('img[src*="champion-icons"]')
    const imageMatch = image?.getAttribute('src')?.match(/champion-icons\/(\d+)\.png/)
    if (imageMatch) return Number(imageMatch[1])

    const htmlMatch = (element as HTMLElement).outerHTML.match(/champion-icons\/(\d+)\.png/)
    if (htmlMatch) return Number(htmlMatch[1])

    const styled = element.querySelector('[style*="champion-icons"]') as HTMLElement | null
    const styleText = [
      (element as HTMLElement).style?.backgroundImage ?? '',
      styled?.style?.backgroundImage ?? '',
    ].join(' ')
    const styleMatch = styleText.match(/champion-icons\/(\d+)\.png/)
    if (styleMatch) return Number(styleMatch[1])
  }

  return null
}

function createBadge(tier: number, target: { size: number; left: number; top?: number | string; bottom?: number }): HTMLImageElement | null {
  const icon = TIER_ICON_MAP.get(tier)
  const label = TIER_LABEL_MAP.get(tier)
  if (!icon || !label) return null

  const badge = document.createElement('img')
  badge.setAttribute(BADGE_ATTR, 'true')
  badge.src = icon
  badge.alt = label
  badge.title = label
  badge.style.cssText = [
    'position:absolute',
    `left:${target.left}px`,
    target.top != null && target.top !== 'auto' ? `top:${target.top}px` : '',
    target.bottom != null ? `bottom:${target.bottom}px` : '',
    `width:${target.size}px`,
    `height:${target.size}px`,
    'z-index:8',
    'pointer-events:none',
    'filter:drop-shadow(0 1px 2px rgba(0,0,0,.95))',
  ].join(';')
  return badge
}

function ensurePositionContext(thumbnail: HTMLElement) {
  const position = window.getComputedStyle(thumbnail).position
  if (position !== 'static') return

  thumbnail.setAttribute(POSITION_ATTR, thumbnail.style.position)
  thumbnail.style.position = 'relative'
}

function getOwnBadge(element: HTMLElement): HTMLImageElement | null {
  return Array.from(element.children).find((child): child is HTMLImageElement => {
    return child instanceof HTMLImageElement && child.hasAttribute(BADGE_ATTR)
  }) ?? null
}

function tryInjectTierBadges(): boolean {
  if (tierByChampionId.size === 0) return true

  const targets = document.querySelectorAll(BADGE_TARGET_SELECTOR)
  targets.forEach((element) => {
    if (!(element instanceof HTMLElement)) return

    const targetConfig = BADGE_TARGETS.find((target) => element.matches(target.selector))
    if (!targetConfig) return

    const championId = extractChampionId(element)
    const stats = championId != null ? tierByChampionId.get(championId) : undefined
    const tier = stats?.tier
    const existing = getOwnBadge(element)

    if (!stats) {
      existing?.remove()
      return
    }

    if (tier == null) {
      existing?.remove()
    } else {
      const label = TIER_LABEL_MAP.get(tier)
      if (!(existing instanceof HTMLImageElement && existing.alt === label)) {
        existing?.remove()
        const badge = createBadge(tier, targetConfig)
        if (badge) {
          ensurePositionContext(element)
          element.appendChild(badge)
        }
      }
    }
  })

  tryInjectPlayerIconTierBadges()

  return true
}

function tryInjectPlayerIconTierBadges() {
  if (!currentSession?.myTeam) return

  const wrappers = document.querySelectorAll('.party.visible .summoner-wrapper.visible.left')
  wrappers.forEach((wrapper, index) => {
    const iconContainer = wrapper.querySelector('.champion-icon-container') as HTMLElement | null
    if (!iconContainer) return

    const player = currentSession?.myTeam[index]
    const championId = player ? getSelectedChampionId(player) : 0
    const existing = getOwnBadge(iconContainer)

    if (!championId) {
      existing?.remove()
      return
    }

    const tier = tierByChampionId.get(championId)?.tier
    if (tier == null) {
      existing?.remove()
      return
    }

    const label = TIER_LABEL_MAP.get(tier)
    if (existing instanceof HTMLImageElement && existing.alt === label) return

    existing?.remove()
    const badge = createBadge(tier, PLAYER_ICON_BADGE_TARGET)
    if (!badge) return

    ensurePositionContext(iconContainer)
    iconContainer.appendChild(badge)
  })
}

function getSelectedChampionId(player: ChampSelectSession['myTeam'][number]): number {
  return player.championId > 0 ? player.championId : player.championPickIntent > 0 ? player.championPickIntent : 0
}

function cleanupBadges() {
  document.querySelectorAll(`[${BADGE_ATTR}]`).forEach((badge) => badge.remove())

  document.querySelectorAll(`[${POSITION_ATTR}]`).forEach((element) => {
    if (element instanceof HTMLElement) {
      element.style.position = element.getAttribute(POSITION_ATTR) ?? ''
      element.removeAttribute(POSITION_ATTR)
    }
  })
}

function mount(session?: ChampSelectSession) {
  cleanupBadges()
  tierByChampionId = new Map()
  currentSession = session ?? null
  currentCacheKey = ''

  if (!injectRegistered) {
    injector.register(tryInjectTierBadges)
    injectRegistered = true
  }

  void loadTierData(session)
}

function unmount() {
  loadToken++
  currentCacheKey = ''
  tierByChampionId = new Map()
  currentSession = null

  if (injectRegistered) {
    injector.unregister(tryInjectTierBadges)
    injectRegistered = false
  }

  cleanupBadges()
}

export function updateChampSelectTierBadge(enabled: boolean) {
  if (enabled && !phaseUnsub) {
    phaseUnsub = lcu.observe(LcuEventUri.GAMEFLOW_PHASE_CHANGE, (event: LCUEventMessage) => {
      const phase = event.data as GameflowPhase
      if (phase === 'ChampSelect') {
        mount()
      } else {
        unmount()
      }
    })

    champSelectUnsub = lcu.observe(LcuEventUri.CHAMP_SELECT, (event: LCUEventMessage) => {
      if (event.eventType !== 'Create' && event.eventType !== 'Update') return
      currentSession = event.data as ChampSelectSession
      if (tierByChampionId.size === 0) {
        void loadTierData(event.data as ChampSelectSession)
      } else {
        tryInjectTierBadges()
      }
    })

    lcu.getGameflowPhase().then((phase) => {
      if (phase === 'ChampSelect') mount()
    }).catch(() => { /* ignore */ })

    logger.info('[ChampTier] 英雄选择 T 级角标已启用 ✓')
  } else if (!enabled && phaseUnsub) {
    phaseUnsub()
    phaseUnsub = null
    if (champSelectUnsub) {
      champSelectUnsub()
      champSelectUnsub = null
    }
    unmount()
    logger.info('[ChampTier] 英雄选择 T 级角标已禁用')
  }
}

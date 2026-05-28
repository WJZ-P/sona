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
import { Modal } from '@/components/ui/Modal'
import { getAllChampions, getAugmentInfo, getChampionById, getQueue, getQueueName } from '@/lib/assets'
import { OpggBuildRecommendationPanel, type BuildRecommendation, type RecommendationContext } from '@/components/ui/OpggBuildRecommendationPanel'
import { lcu, LcuEventUri, type ChampSelectSession, type ItemSet, type ItemSetBlock, type LCUEventMessage, type RunePage, type RunePagePayload } from '@/lib/lcu'
import { store } from '@/lib/store'
import { aramggApi, type AramggChampionRecommendation, type AramggChampionStatEntry, type AramggCoreItemBuild, type AramggMayhemAugments } from '@/lib/aramgg-api'
import {
  opggApi,
  type OpggAugmentGroup,
  type OpggArenaModeChampion,
  type OpggChampion,
  type OpggMode,
  type OpggNormalModeChampion,
  type OpggPosition,
  type OpggTier,
  type OpggItemBuild,
} from '@/lib/opgg-api'
import type { GameflowPhase } from '@/types/lcu'
import { translate } from '@/i18n'

const TARGET_SELECTOR = '.toggle-ability-previews-button'
const HIJACK_ATTR = 'data-sona-opgg-build-hijacked'
const PANEL_ID = 'sona-opgg-build-panel'
const IN_GAME_BUILD_BUTTON_ATTR = 'data-sona-opgg-ingame-build'
const DEFAULT_OPGG_TIER: OpggTier = 'master_plus'
const SONA_ITEM_SET_TITLE_PREFIX = '[Sona]'
const HEALTH_POTION_ID = 2003
const ITEM_SET_ASSOCIATED_MAPS = [11, 12, 30]
const RUNE_PAGES_EVENT_URI = '/lol-perks/v1/pages'
const CURRENT_RUNE_PAGE_EVENT_URI = '/lol-perks/v1/currentpage'
const RUNE_APPLY_SUPPRESS_MS = 1500
const SPELL_APPLY_SUPPRESS_MS = 1500
const SMART_LOADOUT_RESTORE_DEBOUNCE_MS = 500
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
let runePagesUnsub: (() => void) | null = null
let currentRunePageUnsub: (() => void) | null = null
let championLockPollTimer: number | null = null
let championLockPollAttempts = 0
let injectRegistered = false
let inGameBuildButtonRegistered = false
let currentContext: RecommendationContext = {
  championId: 0,
  queueId: 0,
  gameVersion: '',
  gameMode: '',
  position: 'none',
}
let currentChampionLocked = false
const boundElements: Array<{ el: HTMLElement; handler: EventListener; originalText: string }> = []
const recommendationCache = new Map<string, RecommendationCacheEntry>()
let outsideCloseHandler: ((event: MouseEvent) => void) | null = null
let activePanelKey = ''
let panelReactRoot: Root | null = null
let inGameModalRoot: Root | null = null
let inGameModalContainer: HTMLDivElement | null = null
let inGameModalRenderToken = 0
let lastAppliedItemSetKey = ''
let lastAppliedRuneKey = ''
let lastAppliedSpellKey = ''
let suppressRuneSaveUntil = 0
let suppressSpellSaveUntil = 0
let lastAutoAppliedRuneSignature = ''
let smartLoadoutRestoreTimer: number | null = null
let pendingSmartLoadoutContext: RecommendationContext | null = null
let lastObservedSpellKey = ''
let lastObservedSpellSignature = ''
const itemSetSyncInFlightKeys = new Set<string>()
const runeApplyInFlightKeys = new Set<string>()
const spellApplyInFlightKeys = new Set<string>()

function getLocalChampionId(session: ChampSelectSession): number {
  const localPlayer = session.myTeam.find((player) => player.cellId === session.localPlayerCellId)
  return localPlayer?.championId ?? 0
}

function getLocalPlayer(session: ChampSelectSession) {
  return session.myTeam.find((player) => player.cellId === session.localPlayerCellId)
}

function isLocalChampionLocked(session: ChampSelectSession): boolean {
  const localPlayer = getLocalPlayer(session)
  if (!localPlayer || localPlayer.championId <= 0) return false

  const localPickActions = session.actions
    .flat(2)
    .filter((action) => action.actorCellId === session.localPlayerCellId && action.type === 'pick')

  if (localPickActions.length === 0) {
    return true
  }

  // ARAM/KIWI can swap champions after the pick action is completed. In that case
  // the completed action may still point to the originally locked champion, while
  // localPlayer.championId has already changed to the swapped champion.
  return localPickActions.some((action) => action.completed)
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
  if (isKiwiMode(context)) return 'all'
  return resolveOpggMode(context) === 'arena' ? 'all' : getSelectedOpggTier()
}

function getSmartRuneModeKey(context: RecommendationContext): string | null {
  const rawMode = context.gameMode.toLowerCase()
  const opggMode = resolveOpggMode(context)
  if (rawMode === 'kiwi' || opggMode === 'arena') return null
  return opggMode
}

function getSmartRuneKey(context: RecommendationContext): string | null {
  const modeKey = getSmartRuneModeKey(context)
  if (!modeKey || context.championId <= 0) return null
  return `${context.championId}:${modeKey}`
}

function getSmartSpellModeKey(context: RecommendationContext): string | null {
  const rawMode = context.gameMode.toLowerCase()
  if (rawMode === 'kiwi') return 'kiwi'

  return resolveOpggMode(context)
}

function getSmartSpellKey(context: RecommendationContext): string | null {
  const modeKey = getSmartSpellModeKey(context)
  if (!modeKey || context.championId <= 0) return null
  return `${context.championId}:${modeKey}`
}

function isValidRunePage(page: Pick<RunePagePayload, 'primaryStyleId' | 'subStyleId' | 'selectedPerkIds'>): boolean {
  return page.primaryStyleId > 0
    && page.subStyleId > 0
    && Array.isArray(page.selectedPerkIds)
    && page.selectedPerkIds.length >= 6
}

function isValidSummonerSpells(spells: { spell1Id: number; spell2Id: number }): boolean {
  return spells.spell1Id > 0
    && spells.spell2Id > 0
    && spells.spell1Id !== spells.spell2Id
}

function getSummonerSpellSignature(spells: { spell1Id: number; spell2Id: number }): string {
  return `${spells.spell1Id}:${spells.spell2Id}`
}

function getRunePageSignature(page: Pick<RunePagePayload, 'primaryStyleId' | 'subStyleId' | 'selectedPerkIds'>): string {
  return `${page.primaryStyleId}:${page.subStyleId}:${page.selectedPerkIds.join(',')}`
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

function toItemSetEntry(id: number) {
  return {
    id: String(id),
    count: id === HEALTH_POTION_ID ? 2 : 1,
  }
}

function normalizeItemIds(ids: number[]): number[] {
  const seen = new Set<number>()
  const normalized: number[] = []

  for (const id of ids) {
    const itemId = Number(id)
    if (!Number.isFinite(itemId) || itemId <= 0 || seen.has(itemId)) continue
    seen.add(itemId)
    normalized.push(itemId)
  }

  return normalized
}

function flattenItemBuilds(builds: OpggItemBuild[]): number[] {
  return normalizeItemIds(builds.flatMap((build) => build.ids))
}

function getItemBuildWinRate(build: OpggItemBuild): number {
  return build.play > 0 ? build.win / build.play : 0
}

function sortItemBuildsByWinRate(builds: OpggItemBuild[]): OpggItemBuild[] {
  return [...builds].sort((a, b) => {
    const winRateDiff = getItemBuildWinRate(b) - getItemBuildWinRate(a)
    return winRateDiff || b.pick_rate - a.pick_rate || b.play - a.play
  })
}

function createItemSetBlock(type: string, itemIds: number[]): ItemSetBlock | null {
  const ids = normalizeItemIds(itemIds)
  if (ids.length === 0) return null

  return {
    type,
    items: ids.map(toItemSetEntry),
  }
}

function appendItemSetBlock(blocks: ItemSetBlock[], type: string, itemIds: number[]): void {
  const block = createItemSetBlock(type, itemIds)
  if (block) blocks.push(block)
}

function buildItemSetBlocks(recommendation: BuildRecommendation): ItemSetBlock[] {
  const blocks: ItemSetBlock[] = []
  const starterItems = sortItemBuildsByWinRate(recommendation.starterItems)
  const boots = sortItemBuildsByWinRate(recommendation.boots)
  const prismItems = sortItemBuildsByWinRate(recommendation.prismItems)
  const coreItems = sortItemBuildsByWinRate(recommendation.coreItems)
  const lastItems = sortItemBuildsByWinRate(recommendation.lastItems)

  starterItems.slice(0, 3).forEach((build, index) => {
    appendItemSetBlock(blocks, `${index + 1}. 出门装`, build.ids)
  })

  appendItemSetBlock(blocks, `${blocks.length + 1}. 鞋子`, flattenItemBuilds(boots))

  if (prismItems.length > 0) {
    appendItemSetBlock(blocks, `${blocks.length + 1}. 棱彩装备`, flattenItemBuilds(prismItems))
  }

  coreItems.slice(0, 5).forEach((build, index) => {
    appendItemSetBlock(blocks, `${blocks.length + 1}. 核心装 ${index + 1}`, build.ids)
  })

  appendItemSetBlock(blocks, `${blocks.length + 1}. 后续装备`, flattenItemBuilds(lastItems))

  return blocks
}

function getManagedItemSetUid(context: RecommendationContext): string {
  return `sona-${context.championId}`
}

function getChampionName(championId: number): string {
  const champion = getChampionById(championId)
  if (!champion) return `英雄 ${championId}`

  return [champion.title, champion.name].filter(Boolean).join(' ')
}

function getPositionLabel(position: OpggPosition): string {
  switch (position) {
    case 'top':
      return '上路'
    case 'jungle':
      return '打野'
    case 'mid':
      return '中路'
    case 'adc':
      return '下路'
    case 'support':
      return '辅助'
    default:
      return ''
  }
}

function getManagedItemSetTitle(context: RecommendationContext, recommendation: BuildRecommendation): string {
  const championName = getChampionName(context.championId)
  const positionLabel = getPositionLabel(context.position)
  const suffix = positionLabel ? `${recommendation.modeLabel}/${positionLabel}` : recommendation.modeLabel
  return `${SONA_ITEM_SET_TITLE_PREFIX} ${championName} - ${suffix}`
}

function getContextModeLabel(context: RecommendationContext): string {
  const modeLabel = getModeLabel(resolveOpggMode(context), context)
  const positionLabel = getPositionLabel(context.position)
  return positionLabel ? `${modeLabel}/${positionLabel}` : modeLabel
}

function getSmartRunePageName(context: RecommendationContext): string {
  return `${getChampionName(context.championId)} ${getModeLabel(resolveOpggMode(context), context)} - Sona`
}

function createManagedItemSet(context: RecommendationContext, recommendation: BuildRecommendation): ItemSet | null {
  const blocks = buildItemSetBlocks(recommendation)
  if (blocks.length === 0) return null

  return {
    uid: getManagedItemSetUid(context),
    title: getManagedItemSetTitle(context, recommendation),
    type: 'custom',
    mode: 'any',
    map: 'any',
    associatedChampions: [context.championId],
    associatedMaps: ITEM_SET_ASSOCIATED_MAPS,
    blocks,
    preferredItemSlots: [],
    sortrank: 0,
    startedFrom: 'blank',
  }
}

function isSameManagedItemSetContext(itemSet: ItemSet, nextItemSet: ItemSet): boolean {
  if (itemSet.uid === nextItemSet.uid) return true
  if (itemSet.title === nextItemSet.title) return true

  const nextChampionId = nextItemSet.associatedChampions[0]
  const isSonaManagedTitle = itemSet.title?.startsWith(SONA_ITEM_SET_TITLE_PREFIX) === true
  const isSameChampion = Array.isArray(itemSet.associatedChampions)
    && itemSet.associatedChampions.includes(nextChampionId)

  return isSonaManagedTitle && isSameChampion
}

function isCurrentRecommendationContext(context: RecommendationContext): boolean {
  return currentContext.championId === context.championId
    && currentContext.queueId === context.queueId
    && currentContext.gameMode === context.gameMode
    && currentContext.position === context.position
}

function saveCurrentSmartRunePage(page: RunePage): void {
  if (!store.get('smartBuildRecommendation')) return
  if (currentContext.championId <= 0 || !currentChampionLocked) return
  if (page.current === false && page.isActive === false) return
  if (!isValidRunePage(page)) return

  const runeKey = getSmartRuneKey(currentContext)
  if (!runeKey) return

  const signature = getRunePageSignature(page)
  if (signature === lastAutoAppliedRuneSignature && Date.now() < suppressRuneSaveUntil) {
    logger.debug('[OPGG] 跳过 Sona 自动恢复触发的符文保存 → key=%s', runeKey)
    return
  }

  const pages = { ...store.get('smartRunePages') }
  pages[runeKey] = {
    primaryStyleId: page.primaryStyleId,
    subStyleId: page.subStyleId,
    selectedPerkIds: [...page.selectedPerkIds],
    updatedAt: Date.now(),
  }
  store.set('smartRunePages', pages)
  logger.info('[OPGG] 已保存智能符文 → key=%s, page=%s, signature=%s', runeKey, getSmartRunePageName(currentContext), signature)
}

function saveCurrentSmartSummonerSpells(player: ChampSelectSession['myTeam'][number], context: RecommendationContext): void {
  if (!store.get('smartBuildRecommendation')) return
  if (Date.now() < suppressSpellSaveUntil) return
  if (!currentChampionLocked || context.championId <= 0) return

  const spellKey = getSmartSpellKey(context)
  if (!spellKey) return

  const spells = {
    spell1Id: player.spell1Id,
    spell2Id: player.spell2Id,
  }
  if (!isValidSummonerSpells(spells)) return

  const signature = getSummonerSpellSignature(spells)
  if (lastObservedSpellKey !== spellKey) {
    lastObservedSpellKey = spellKey
    lastObservedSpellSignature = signature
    return
  }
  if (lastObservedSpellSignature === signature) return

  lastObservedSpellSignature = signature
  const allSpells = { ...store.get('smartSummonerSpells') }
  allSpells[spellKey] = {
    ...spells,
    updatedAt: Date.now(),
  }
  store.set('smartSummonerSpells', allSpells)
  logger.info('[OPGG] 已保存智能召唤师技能 → key=%s, spells=%s', spellKey, signature)
}

function handleRunePageEvent(event: LCUEventMessage): void {
  if (event.eventType !== 'Create' && event.eventType !== 'Update') return
  const page = event.data as RunePage | null
  if (!page || typeof page !== 'object') return
  saveCurrentSmartRunePage(page)
}

function handleCurrentRunePageEvent(event: LCUEventMessage): void {
  if (event.eventType === 'Delete') return
  const page = event.data as RunePage | null
  if (!page || typeof page !== 'object') return
  saveCurrentSmartRunePage(page)
}

async function upsertRecommendedItemSet(context: RecommendationContext, recommendation: BuildRecommendation): Promise<void> {
  const nextItemSet = createManagedItemSet(context, recommendation)
  if (!nextItemSet) {
    logger.warn('[OPGG] 装备集生成失败：没有可写入的装备 block')
    return
  }

  const summoner = await lcu.getSummonerInfo()
  const wrapper = await lcu.getItemSets(summoner.summonerId)
  const existingItemSets = Array.isArray(wrapper?.itemSets) ? wrapper.itemSets : []
  const itemSets = existingItemSets.filter((itemSet) => !isSameManagedItemSetContext(itemSet, nextItemSet))

  await lcu.putItemSets(summoner.summonerId, {
    accountId: wrapper?.accountId ?? summoner.accountId ?? 0,
    itemSets: [...itemSets, nextItemSet],
    timestamp: Date.now(),
  })

  logger.info('[OPGG] 自动装备集已同步：%s，blocks=%d', nextItemSet.title, nextItemSet.blocks.length)
  const championName = getChampionName(context.championId)
  lcu.sendChampSelectMessage(translate('opgg.chat.buildReady', { championName }), 'celebration').catch((err) => {
    logger.warn('[OPGG] 自动装备集聊天提示发送失败:', err)
  })
}

function syncRecommendedItemSetWhenReady(entry: RecommendationCacheEntry): void {
  if (!store.get('smartBuildRecommendation')) return
  if (!currentChampionLocked) return

  const syncKey = getManagedItemSetUid(entry.context)
  if (lastAppliedItemSetKey === syncKey || itemSetSyncInFlightKeys.has(syncKey)) return

  itemSetSyncInFlightKeys.add(syncKey)
  entry.promise
    .then(async (recommendation) => {
      if (!recommendation || !store.get('smartBuildRecommendation')) return
      if (!currentChampionLocked) return
      if (!isCurrentRecommendationContext(entry.context)) return
      if (lastAppliedItemSetKey === syncKey) return
      await upsertRecommendedItemSet(entry.context, recommendation)
      lastAppliedItemSetKey = syncKey
    })
    .catch((err) => {
      logger.warn('[OPGG] 自动装备集同步失败:', err)
    })
    .finally(() => {
      itemSetSyncInFlightKeys.delete(syncKey)
    })
}

async function applySavedSmartRunePage(context: RecommendationContext): Promise<boolean> {
  if (!store.get('smartBuildRecommendation')) return false
  if (!currentChampionLocked) return false
  if (!isCurrentRecommendationContext(context)) return false

  const runeKey = getSmartRuneKey(context)
  if (!runeKey || lastAppliedRuneKey === runeKey || runeApplyInFlightKeys.has(runeKey)) return false

  const saved = store.get('smartRunePages')[runeKey]
  if (!saved || !isValidRunePage(saved)) return false

  runeApplyInFlightKeys.add(runeKey)
  try {
    lastAutoAppliedRuneSignature = getRunePageSignature(saved)
    suppressRuneSaveUntil = Date.now() + RUNE_APPLY_SUPPRESS_MS
    const pageName = getSmartRunePageName(context)
    await lcu.applyRunePage({
      name: pageName,
      primaryStyleId: saved.primaryStyleId,
      subStyleId: saved.subStyleId,
      selectedPerkIds: [...saved.selectedPerkIds],
    })
    lastAppliedRuneKey = runeKey
    logger.info('[OPGG] 已自动应用智能符文 → key=%s, page=%s, signature=%s', runeKey, pageName, lastAutoAppliedRuneSignature)
    return true
  } finally {
    runeApplyInFlightKeys.delete(runeKey)
  }
}

async function applySavedSmartSummonerSpells(context: RecommendationContext): Promise<boolean> {
  if (!store.get('smartBuildRecommendation')) return false
  if (!currentChampionLocked) return false
  if (!isCurrentRecommendationContext(context)) return false

  const spellKey = getSmartSpellKey(context)
  if (!spellKey || lastAppliedSpellKey === spellKey || spellApplyInFlightKeys.has(spellKey)) return false

  const saved = store.get('smartSummonerSpells')[spellKey]
  if (!saved || !isValidSummonerSpells(saved)) return false

  spellApplyInFlightKeys.add(spellKey)
  try {
    suppressSpellSaveUntil = Date.now() + SPELL_APPLY_SUPPRESS_MS
    await lcu.updateMySelection({
      spell1Id: saved.spell1Id,
      spell2Id: saved.spell2Id,
    })

    lastAppliedSpellKey = spellKey
    lastObservedSpellKey = spellKey
    lastObservedSpellSignature = getSummonerSpellSignature(saved)
    logger.info('[OPGG] 已自动恢复召唤师技能 → key=%s, spells=%s', spellKey, lastObservedSpellSignature)
    return true
  } finally {
    spellApplyInFlightKeys.delete(spellKey)
  }
}

async function applySavedSmartLoadout(context: RecommendationContext): Promise<void> {
  const [runeRestored, spellsRestored] = await Promise.all([
    applySavedSmartRunePage(context).catch((err) => {
      logger.warn('[OPGG] 智能符文自动恢复失败:', err)
      return false
    }),
    applySavedSmartSummonerSpells(context).catch((err) => {
      logger.warn('[OPGG] 智能召唤师技能自动恢复失败:', err)
      return false
    }),
  ])

  if (!runeRestored && !spellsRestored) return

  const championName = getChampionName(context.championId)
  const modeLabel = getContextModeLabel(context)
  const restoredText = runeRestored && spellsRestored
    ? translate('opgg.restored.runesAndSpells')
    : runeRestored ? translate('opgg.restored.runes') : translate('opgg.restored.spells')

  lcu.sendChampSelectMessage(translate('opgg.chat.restored', { championName, modeLabel, restoredText }), 'celebration').catch((err) => {
    logger.warn('[OPGG] 智能配置聊天提示发送失败:', err)
  })
}

function syncSavedSmartLoadoutWhenReady(context: RecommendationContext): void {
  if (!store.get('smartBuildRecommendation')) return
  if (!currentChampionLocked) return

  pendingSmartLoadoutContext = { ...context }
  if (smartLoadoutRestoreTimer != null) {
    window.clearTimeout(smartLoadoutRestoreTimer)
  }

  smartLoadoutRestoreTimer = window.setTimeout(() => {
    const snapshot = pendingSmartLoadoutContext
    pendingSmartLoadoutContext = null
    smartLoadoutRestoreTimer = null
    if (!snapshot) return

    applySavedSmartLoadout(snapshot).catch((err) => {
      logger.warn('[OPGG] 智能配置自动恢复失败:', err)
    })
  }, SMART_LOADOUT_RESTORE_DEBOUNCE_MS)
}

function stopChampionLockPolling() {
  if (championLockPollTimer != null) {
    window.clearTimeout(championLockPollTimer)
    championLockPollTimer = null
  }
  championLockPollAttempts = 0
}

function scheduleRefreshWhenChampionLocked(delay = 250) {
  if (championLockPollTimer != null) return

  championLockPollTimer = window.setTimeout(async () => {
    championLockPollTimer = null
    championLockPollAttempts++

    try {
      const phase = await lcu.getGameflowPhase().catch(() => null)
      if (phase !== 'ChampSelect') {
        stopChampionLockPolling()
        return
      }

      const session = await lcu.getChampSelectSession()
      if (isLocalChampionLocked(session)) {
        stopChampionLockPolling()
        await refreshContext(session)
        return
      }
    } catch {
      // ChampSelect session may not be ready immediately after phase changes.
    }

    if (championLockPollAttempts < 600) {
      scheduleRefreshWhenChampionLocked(500)
    } else {
      stopChampionLockPolling()
      logger.warn('[OPGG] 等待本地英雄锁定超时，未触发智能配置')
    }
  }, delay)
}

async function refreshContext(session?: ChampSelectSession) {
  try {
    const currentSession = session ?? await lcu.getChampSelectSession()
    const localPlayer = getLocalPlayer(currentSession)
    const queueId = currentSession.queueId ?? 0
    currentChampionLocked = isLocalChampionLocked(currentSession)
    currentContext = {
      championId: localPlayer?.championId ?? getLocalChampionId(currentSession),
      queueId,
      gameVersion: currentContext.gameVersion,
      gameMode: await resolveGameMode(queueId),
      position: mapAssignedPosition(localPlayer?.assignedPosition),
    }

    if (localPlayer) {
      saveCurrentSmartSummonerSpells(localPlayer, currentContext)
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
      if (store.get('opggBuildRecommendation')) {
        mount()
      } else {
        unmountPanel()
      }
      const cacheEntry = ensureRecommendationPrefetch(currentContext)
      if (cacheEntry && currentChampionLocked) {
        syncRecommendedItemSetWhenReady(cacheEntry)
      }
      if (currentChampionLocked) {
        syncSavedSmartLoadoutWhenReady(currentContext)
      }
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

  if (isKiwiMode(context)) {
    return loadAramggKiwiRecommendation(context, mode, position, tier)
  }

  const mainChampion = await getChampionWithVersionFallback({
    id: context.championId,
    mode,
    tier,
    position,
  })

  const augmentGroups = getAugmentGroups(mainChampion)

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
    matchups: normal ? mapOpggMatchups(normal.data.counters) : [],
    augments: mapOpggAugments(augmentGroups),
    meta: getRecommendationMeta(mainChampion),
  }
}

async function loadAramggKiwiRecommendation(
  context: RecommendationContext,
  mode: OpggMode,
  position: OpggPosition,
  tier: OpggTier,
): Promise<BuildRecommendation | null> {
  const [opggChampion, aramgg, mayhemAugments] = await Promise.all([
    getChampionWithVersionFallback({
      id: context.championId,
      mode,
      tier,
      position,
    }).catch((err) => {
      logger.warn('[OPGG] KIWI 基础配装请求失败，将只使用 ARAM.GG 数据:', err)
      return null
    }),
    aramggApi.getChampionRecommendation(context.championId),
    aramggApi.getMayhemAugmentsZhCn().catch((err) => {
      logger.warn('[ARAMGG] 海克斯稀有度请求失败，将尝试使用客户端资源兜底:', err)
      return {} as AramggMayhemAugments
    }),
  ])

  const normal = opggChampion && isNormalChampion(opggChampion) ? opggChampion : null
  const data = opggChampion?.data

  return {
    mode,
    modeLabel: getModeLabel(mode, context),
    version: aramgg.championStats?.version || opggChampion?.meta.version || context.gameVersion || '',
    position,
    summary: getAramggSummaryLines(aramgg),
    summonerSpells: normal?.data.summoner_spells ?? [],
    starterItems: [],
    boots: data?.boots ?? [],
    coreItems: mapAramggCoreItemBuilds(aramgg.coreItemBuilds),
    prismItems: [],
    lastItems: mapAramggItems(aramgg.items),
    runePages: [],
    matchups: [],
    augments: mapAramggAugments(aramgg.augments, mayhemAugments),
    meta: undefined,
  }
}

function getAramggSummaryLines(data: AramggChampionRecommendation): string[] {
  const stats = data.championStats
  return [
    `总体胜率 ${formatRate(toNumber(stats?.win_rate))}`,
    `登场 ${formatRate(toNumber(stats?.pick_rate))}`,
    `Tier ${stats?.tier || '-'}`,
  ]
}

function formatRate(value: number): string {
  return Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : '-'
}

function toNumber(value: unknown): number {
  const numberValue = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

function mapAramggCoreItemBuilds(builds: AramggCoreItemBuild[]): OpggItemBuild[] {
  return builds.map((build) => {
    const play = toNumber(build.games)
    const win = toNumber(build.wins)
    return {
      ids: build.itemIds.split(',').map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0),
      win,
      play,
      pick_rate: toNumber(build.pick_rate),
    }
  }).filter((build) => build.ids.length > 0)
}

function mapAramggItems(items: Record<string, AramggChampionStatEntry>): OpggItemBuild[] {
  return Object.entries(items)
    .map(([id, item]) => ({
      ids: [Number(id)].filter((value) => Number.isFinite(value) && value > 0),
      win: toNumber(item.num_win_games),
      play: toNumber(item.num_games),
      pick_rate: toNumber(item.pick_rate),
      tier: Number(item.tier),
    }))
    .filter((item) => item.ids.length > 0)
    .sort((a, b) => {
      const tierDiff = (Number.isFinite(a.tier) ? a.tier : 99) - (Number.isFinite(b.tier) ? b.tier : 99)
      return tierDiff || b.pick_rate - a.pick_rate
    })
    .map(({ tier: _tier, ...item }) => item)
}

function getAugmentRaritySortValue(rarity: number): number {
  if (rarity === 8) return 0
  if (rarity === 4) return 1
  if (rarity === 1) return 2
  return 99
}

function normalizeAugmentRarity(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return null

  const normalized = value.toLowerCase()
  if (normalized.includes('prismatic')) return 8
  if (normalized.includes('gold')) return 4
  if (normalized.includes('silver')) return 1

  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function normalizeMayhemAugmentRarity(value: unknown, mayhemAugments: AramggMayhemAugments): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return normalizeAugmentRarity(value)

  const knownRarities = new Set(Object.values(mayhemAugments).map((augment) => augment.rarity))
  if (knownRarities.has(4) || knownRarities.has(8)) return value

  // Some data dumps use 0/1/2 instead of Riot's 1/4/8 rarity values.
  if (value === 2) return 8
  if (value === 1) return 4
  if (value === 0) return 1
  return value
}

function mapOpggAugments(augmentGroups: OpggAugmentGroup[]): BuildRecommendation['augments'] {
  return augmentGroups
    .map((group) => ({
      rarity: group.rarity,
      items: group.augments.slice(0, 5).map((augment) => ({
        id: augment.id,
        pickRate: augment.pick_rate,
        averagePlace: augment.total_place / Math.max(augment.play, 1),
        firstPlace: augment.first_place / Math.max(augment.play, 1),
      })),
    }))
    .sort((a, b) => getAugmentRaritySortValue(a.rarity) - getAugmentRaritySortValue(b.rarity))
}

function getAramggAugmentRarity(augmentId: number, mayhemAugments: AramggMayhemAugments): number | null {
  return normalizeAugmentRarity(getAugmentInfo(augmentId)?.rarity)
    ?? normalizeMayhemAugmentRarity(mayhemAugments[String(augmentId)]?.rarity, mayhemAugments)
}

function mapOpggMatchups(counters: NonNullable<OpggNormalModeChampion['data']['counters']>): BuildRecommendation['matchups'] {
  return counters
    .map((counter) => ({
      championId: counter.champion_id,
      play: counter.play,
      win: counter.win,
      winRate: counter.play > 0 ? counter.win / counter.play : 0,
    }))
    .filter((counter) => counter.championId > 0 && counter.play > 0)
}

function mapAramggAugments(augments: Record<string, AramggChampionStatEntry>, mayhemAugments: AramggMayhemAugments): BuildRecommendation['augments'] {
  const groups = new Map<number, Array<{ id: number; pickRate: number; winRate: number }>>()

  Object.entries(augments).forEach(([id, augment]) => {
    const augmentId = Number(id)
    const rarity = getAramggAugmentRarity(augmentId, mayhemAugments)
    if (!Number.isFinite(augmentId) || rarity == null) return

    const items = groups.get(rarity) ?? []
    items.push({
      id: augmentId,
      pickRate: toNumber(augment.pick_rate),
      winRate: toNumber(augment.win_rate),
    })
    groups.set(rarity, items)
  })

  return Array.from(groups.entries())
    .sort(([a], [b]) => getAugmentRaritySortValue(a) - getAugmentRaritySortValue(b))
    .map(([rarity, items]) => ({
      rarity,
      items: items
        .sort((a, b) => b.winRate - a.winRate || b.pickRate - a.pickRate)
        .slice(0, 5)
        .map((augment) => ({
          id: augment.id,
          pickRate: augment.pickRate,
          winRate: augment.winRate,
        })),
    }))
}

function getRecommendationMeta(champion: OpggChampion): BuildRecommendation['meta'] {
  const stats = champion.data.summary.average_stats
  const tierData = 'tier_data' in stats ? stats.tier_data : undefined
  const rank = tierData?.rank && tierData.rank > 0 ? tierData.rank : stats.rank > 0 ? stats.rank : null
  const previousRank = tierData?.rank_prev && tierData.rank_prev > 0 ? tierData.rank_prev : null
  const totalRank = getAllChampions().length || null

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

function closeInGameBuildRecommendationModal() {
  if (!inGameModalRoot) return

  const close = () => closeInGameBuildRecommendationModal()
  inGameModalRoot.render(
    createElement(Modal, {
      open: false,
      onClose: close,
      width: 1120,
      height: 700,
      closable: false,
      children: createElement('div'),
    }),
  )

  window.setTimeout(() => {
    if (inGameModalRoot) {
      inGameModalRoot.unmount()
      inGameModalRoot = null
    }
    if (inGameModalContainer) {
      inGameModalContainer.remove()
      inGameModalContainer = null
    }
  }, 240)
}

function cleanupInGameBuildRecommendationModal() {
  if (inGameModalRoot) {
    inGameModalRoot.unmount()
    inGameModalRoot = null
  }
  if (inGameModalContainer) {
    inGameModalContainer.remove()
    inGameModalContainer = null
  }
}

function renderInGameBuildRecommendationModal(
  context: RecommendationContext,
  cacheEntry: RecommendationCacheEntry | null,
  token: number,
) {
  if (!inGameModalContainer) {
    inGameModalContainer = document.createElement('div')
    inGameModalContainer.id = 'sona-opgg-ingame-modal-root'
    document.body.appendChild(inGameModalContainer)
    inGameModalRoot = createRoot(inGameModalContainer)
  }

  const recommendation = cacheEntry?.data ?? null
  const loadError = cacheEntry?.error ?? ''
  const isLoading = Boolean(cacheEntry && cacheEntry.data === undefined && !cacheEntry.error)
  const close = () => closeInGameBuildRecommendationModal()
  const handleTierChange = (tier: OpggTier) => {
    const nextTier = normalizeOpggTier(tier)
    store.set('opggBuildRecommendationTier', nextTier)
    recommendationCache.delete(getRecommendationCacheKey(context))
    const nextEntry = ensureRecommendationPrefetch(context)
    const nextToken = ++inGameModalRenderToken
    renderInGameBuildRecommendationModal(context, nextEntry, nextToken)
    scheduleInGameModalRefresh(context, nextEntry, nextToken)
  }

  inGameModalRoot!.render(
    createElement(Modal, {
      open: true,
      onClose: close,
      width: 1120,
      height: 700,
      closable: false,
      children: createElement('div', { className: 'sona-opgg-modal-content' },
        createElement(OpggBuildRecommendationPanel, {
          context,
          recommendation,
          loadError,
          isLoading,
          selectedTier: getSelectedOpggTier(),
          onTierChange: handleTierChange,
          onClose: close,
        }),
      ),
    }),
  )

  scheduleInGameModalRefresh(context, cacheEntry, token)
}

function scheduleInGameModalRefresh(
  context: RecommendationContext,
  cacheEntry: RecommendationCacheEntry | null,
  token: number,
) {
  if (!cacheEntry || cacheEntry.data !== undefined || cacheEntry.error) return

  cacheEntry.promise.then(() => {
    if (token !== inGameModalRenderToken || !inGameModalRoot) return
    renderInGameBuildRecommendationModal(context, cacheEntry, token)
  }).catch(() => {
    if (token !== inGameModalRenderToken || !inGameModalRoot) return
    renderInGameBuildRecommendationModal(context, cacheEntry, token)
  })
}

async function resolveInGameRecommendationContext(): Promise<RecommendationContext> {
  const [session, summoner] = await Promise.all([
    lcu.getGameflowSession(),
    lcu.getSummonerInfo(),
  ])

  const selection = session.gameData?.playerChampionSelections?.find((item) => item.puuid === summoner.puuid)
  const players = [
    ...(session.gameData?.teamOne ?? []),
    ...(session.gameData?.teamTwo ?? []),
  ]
  const player = players.find((item) => item.puuid === summoner.puuid || item.obfuscatedPuuid === summoner.puuid)
  const championId = selection?.championId || player?.championId || currentContext.championId

  if (!championId) {
    throw new Error('无法识别当前英雄')
  }

  return {
    championId,
    queueId: session.gameData?.queue?.id ?? currentContext.queueId,
    gameVersion: currentContext.gameVersion || await lcu.getGameVersion().catch(() => ''),
    gameMode: session.gameData?.queue?.gameMode || session.map?.gameMode || currentContext.gameMode,
    position: mapAssignedPosition(player?.selectedPosition || player?.selectedRole || currentContext.position),
  }
}

export async function showOpggBuildRecommendationModal() {
  const context = await resolveInGameRecommendationContext()
  currentContext = { ...context }
  const cacheEntry = ensureRecommendationPrefetch(context)
  const token = ++inGameModalRenderToken
  renderInGameBuildRecommendationModal(context, cacheEntry, token)
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
    const cacheEntry = ensureRecommendationPrefetch(context)
    if (cacheEntry) syncRecommendedItemSetWhenReady(cacheEntry)
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

export async function openOpggBuildRecommendationDebugPanel(
  anchor: HTMLElement,
  championId = 68,
  contextOverride: Partial<Omit<RecommendationContext, 'championId' | 'gameVersion'>> = {},
) {
  const gameVersion = await lcu.getGameVersion().catch(() => currentContext.gameVersion)
  await openRecommendationPanel(anchor, {
    championId,
    queueId: contextOverride.queueId ?? 3100,
    gameVersion,
    gameMode: contextOverride.gameMode ?? 'KIWI',
    position: contextOverride.position ?? 'none',
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

function tryInjectInGameBuildButton(): boolean {
  const container = document.querySelector('.game-in-progress-container')
  if (!container) return false

  if (container.querySelector(`[${IN_GAME_BUILD_BUTTON_ATTR}]`)) return true

  const btn = document.createElement('lol-uikit-flat-button')
  btn.setAttribute(IN_GAME_BUILD_BUTTON_ATTR, 'true')
  btn.textContent = '配装推荐'
  btn.style.display = 'block'
  btn.style.marginTop = '12px'

  btn.addEventListener('click', (event) => {
    event.stopPropagation()
    event.preventDefault()
    showOpggBuildRecommendationModal().catch((err) => {
      logger.warn('[OPGG] 游戏内配装推荐弹窗打开失败:', err)
      if (typeof Toast !== 'undefined') {
        Toast.error('配装推荐打开失败，请稍后再试')
      }
    })
  })

  const gameAnalysisBtn = container.querySelector('[data-sona-game-analysis]')
  if (gameAnalysisBtn?.parentElement === container) {
    gameAnalysisBtn.insertAdjacentElement('afterend', btn)
  } else {
    container.appendChild(btn)
  }

  logger.info('[OPGG] 游戏内配装推荐按钮已注入 ✓')
  return true
}

function registerInGameBuildButton() {
  if (inGameBuildButtonRegistered) return

  injector.register(tryInjectInGameBuildButton)
  inGameBuildButtonRegistered = true
}

function unregisterInGameBuildButton() {
  if (inGameBuildButtonRegistered) {
    injector.unregister(tryInjectInGameBuildButton)
    inGameBuildButtonRegistered = false
  }

  document.querySelectorAll(`[${IN_GAME_BUILD_BUTTON_ATTR}]`).forEach((element) => element.remove())
  cleanupInGameBuildRecommendationModal()
}

function mount() {
  if (!injectRegistered) {
    injector.register(tryHijackAbilityPreviewPanel)
    injectRegistered = true
    logger.info('[OPGG] 已检测到本地英雄，开始接管技能预览入口')
  }
}

function unmountPanel() {
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
  closePanel()
}

function unmount(resetContext = true) {
  stopChampionLockPolling()
  unmountPanel()
  if (resetContext) {
    currentContext = {
      championId: 0,
      queueId: 0,
      gameVersion: currentContext.gameVersion,
      gameMode: '',
      position: 'none',
    }
  }
  currentChampionLocked = false
  lastAppliedItemSetKey = ''
  lastAppliedRuneKey = ''
  lastAppliedSpellKey = ''
  lastAutoAppliedRuneSignature = ''
  suppressRuneSaveUntil = 0
  suppressSpellSaveUntil = 0
  if (smartLoadoutRestoreTimer != null) {
    window.clearTimeout(smartLoadoutRestoreTimer)
    smartLoadoutRestoreTimer = null
  }
  pendingSmartLoadoutContext = null
  lastObservedSpellKey = ''
  lastObservedSpellSignature = ''
  itemSetSyncInFlightKeys.clear()
  runeApplyInFlightKeys.clear()
  spellApplyInFlightKeys.clear()
}

function startOpggListeners() {
  if (phaseUnsub) return

  phaseUnsub = lcu.observe(LcuEventUri.GAMEFLOW_PHASE_CHANGE, (event: LCUEventMessage) => {
    const phase = event.data as GameflowPhase
    if (phase === 'ChampSelect') {
      unregisterInGameBuildButton()
      logger.info('[OPGG] 进入 ChampSelect，等待本地英雄锁定')
      scheduleRefreshWhenChampionLocked()
    } else if (phase === 'InProgress') {
      unmount()
      registerInGameBuildButton()
    } else {
      unregisterInGameBuildButton()
      unmount()
    }
  })

  champSelectUnsub = lcu.observe(LcuEventUri.CHAMP_SELECT, (event: LCUEventMessage) => {
    if (event.eventType !== 'Create' && event.eventType !== 'Update') return
    const session = event.data as ChampSelectSession
    if (isLocalChampionLocked(session)) {
      stopChampionLockPolling()
      refreshContext(session)
    } else {
      scheduleRefreshWhenChampionLocked(500)
    }
  })

  runePagesUnsub = lcu.observe(RUNE_PAGES_EVENT_URI, handleRunePageEvent)
  currentRunePageUnsub = lcu.observe(CURRENT_RUNE_PAGE_EVENT_URI, handleCurrentRunePageEvent)

  lcu.getGameflowPhase().then((phase) => {
    if (phase === 'ChampSelect') {
      scheduleRefreshWhenChampionLocked()
    } else if (phase === 'InProgress') {
      registerInGameBuildButton()
    }
  }).catch(() => { /* ignore */ })

  logger.info('[OPGG] 配装推荐接管已启用 ✓')
}

export function updateOpggBuildRecommendation(enabled: boolean) {
  if (enabled && !phaseUnsub) {
    startOpggListeners()
  } else if (enabled && phaseUnsub) {
    lcu.getGameflowPhase().then((phase) => {
      if (phase === 'ChampSelect') {
        scheduleRefreshWhenChampionLocked()
      } else if (phase === 'InProgress') {
        registerInGameBuildButton()
      }
    }).catch(() => { /* ignore */ })
  } else if (!enabled) {
    if (!phaseUnsub) return

    phaseUnsub()
    phaseUnsub = null
    unregisterInGameBuildButton()
    if (champSelectUnsub) {
      champSelectUnsub()
      champSelectUnsub = null
    }
    if (runePagesUnsub) {
      runePagesUnsub()
      runePagesUnsub = null
    }
    if (currentRunePageUnsub) {
      currentRunePageUnsub()
      currentRunePageUnsub = null
    }
    unmount()
    logger.info('[OPGG] 配装推荐接管已禁用')
  }
}

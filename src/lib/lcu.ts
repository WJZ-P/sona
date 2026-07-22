/**
 * LCUManager - Sona 的 LCU 接口管理器
 *
 * 在 Pengu Loader 环境中，插件运行在 League Client 内置浏览器中，
 * 可以直接通过 fetch 请求 LCU API（无需 port/token/https）。
 * WebSocket 事件则通过 PenguContext.socket.observe 来监听。
 *
 * @see https://pengu.lol/guide/lcu-request
 * @see https://pengu.lol/runtime-api
 */

import type {
  SummonerInfo,
  LobbyConfig,
  Lobby,
  MatchSearchState,
  MatchSearchResult,
  ReadyCheck,
  GameflowPhase,
  GameflowSession,
  ChampSelectSession,
  ChampSelectPlayerDetail,
  ChatConversation,
  ChatMessage,
  ChatMe,
  Availability,
  SendChatMessageBody,
  QueueId,
  LCUEventMessage,
  MatchHistoryResponse,
  MatchDetail,
  MatchGame,
  Participant,
  ParticipantIdentity,
  MatchTeam,
  ChatFriend,
  SpectatorLaunchPayload,
  SummonerSpellData,
  ChampionSummaryData,
  GameQueue,
  ChampSelectSummoner,
  RewardsGrant,
} from '@/types/lcu'
import { SGP_SERVERS, TENCENT_MATCH_HISTORY_INTEROP } from '@/types/sgp'
import type { SgpEntitlementsToken, SgpGameSummaryLol, SgpMatchHistoryLol, SgpParticipantLol, SgpPerks, SgpTeam } from '@/types/sgp'
import { store } from '@/lib/store'

// Re-export types for convenience
export type { SummonerInfo, LobbyConfig, Lobby, GameflowPhase, GameflowSession, LCUEventMessage, ChatConversation, ChatMessage, ChatMe, Availability, SendChatMessageBody, ReadyCheck, ChampSelectSession, ChampSelectPlayerDetail, MatchHistoryResponse, MatchDetail, ChatFriend, SpectatorLaunchPayload, ChampSelectSummoner, RewardsGrant }
export type { RewardItem, RewardGroup, RewardGrantInfo, RewardSelectionStrategyConfig } from '@/types/lcu'
export type { SgpEntitlementsToken, SgpMatchHistoryLol } from '@/types/sgp'
export { SGP_SERVERS, TENCENT_MATCH_HISTORY_INTEROP, TENCENT_SERVER_NAMES, queueIdToTag } from '@/types/sgp'

export { LcuEventUri, QueueId } from '@/types/lcu'

/** SGP summoner-ledge 按名查询返回的关键字段（仅取解析所需，容错处理） */
interface SgpSummonerLite {
  puuid?: string
  gameName?: string
  tagLine?: string
  name?: string
}

type GameSettingsBackup = {
  general?: unknown
  input?: unknown
  timestamp: number
}

// ==================== 底层请求方法 ====================

/**
 * 发起 LCU REST API 请求
 * @param endpoint API 端点 (e.g. '/lol-summoner/v1/current-summoner')
 * @param options fetch 配置项
 */
async function request<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`[LCU] 请求失败: ${options.method ?? 'GET'} ${url} → ${response.status} ${response.statusText}`)
  }

  // 204 No Content 等情况不需要解析 body
  const text = await response.text()
  return text ? (JSON.parse(text) as T) : (undefined as unknown as T)
}

function get<T = unknown>(endpoint: string): Promise<T> {
  return request<T>(endpoint, { method: 'GET' })
}

function post<T = unknown>(endpoint: string, body?: unknown): Promise<T> {
  return request<T>(endpoint, {
    method: 'POST',
    body: body != null ? JSON.stringify(body) : undefined,
  })
}

function put<T = unknown>(endpoint: string, body?: unknown): Promise<T> {
  return request<T>(endpoint, {
    method: 'PUT',
    body: body != null ? JSON.stringify(body) : undefined,
  })
}

export interface RunePagePayload {
  name: string
  primaryStyleId: number
  subStyleId: number
  selectedPerkIds: number[]
  current: boolean
}

export interface RunePage extends RunePagePayload {
  id: number
  isActive?: boolean
  isDeletable?: boolean
  isEditable?: boolean
  order?: number
}

export interface ItemSetEntry {
  id: string
  count: number
}

export interface ItemSetBlock {
  type: string
  items: ItemSetEntry[]
}

export interface ItemSet {
  uid: string
  title: string
  type: string
  mode: string
  map: string
  associatedChampions: number[]
  associatedMaps: number[]
  blocks: ItemSetBlock[]
  preferredItemSlots: unknown[]
  sortrank: number
  startedFrom: string
}

export interface ItemSetWrapper {
  accountId: number
  itemSets: ItemSet[]
  timestamp: number
}

export interface RegaliaBannerInventoryItem {
  assetPath: string
  id: string
  idSecondary: string
  isSelectable: boolean
  isTencentOnly: boolean
  localizedDescription: string
  localizedName: string
  regaliaType: string
}

export interface RegaliaBannerInventoryEntry {
  isOwned: boolean
  items: RegaliaBannerInventoryItem[]
  purchaseDate?: string
}

export type RegaliaBannerInventory = RegaliaBannerInventoryEntry[]

function isRegaliaBannerInventoryEntry(value: unknown): value is RegaliaBannerInventoryEntry {
  return Boolean(value && typeof value === 'object' && Array.isArray((value as { items?: unknown }).items))
}

function normalizeRegaliaBannerInventory(raw: unknown): RegaliaBannerInventory {
  if (Array.isArray(raw)) {
    return raw.filter(isRegaliaBannerInventoryEntry)
  }

  // 国服不同版本可能返回数组，也可能返回以库存项 ID 为 key 的对象；对上层统一成数组。
  if (raw && typeof raw === 'object') {
    return Object.values(raw).filter(isRegaliaBannerInventoryEntry)
  }

  return []
}

export interface RegaliaInfo {
  bannerType: string
  crestType: string
  highestRankedEntry: unknown | null
  lastSeasonHighestRank: unknown | null
  preferredBannerType: string
  preferredCrestType: string
  profileIconId: number
  selectedPrestigeCrest: number
  summonerLevel: number
}

export interface RegaliaUpdatePayload {
  preferredCrestType: string
  preferredBannerType: string
  selectedPrestigeCrest: number
}

export interface ChallengePlayerPreferencesPayload {
  bannerAccent?: string
  challengeIds?: Array<string | number>
}

function patch<T = unknown>(endpoint: string, body?: unknown): Promise<T> {
  return request<T>(endpoint, {
    method: 'PATCH',
    body: body != null ? JSON.stringify(body) : undefined,
  })
}

function del<T = unknown>(endpoint: string): Promise<T> {
  return request<T>(endpoint, { method: 'DELETE' })
}

// ==================== SGP Server ID 映射 ====================

/**
 * platformId / issuer 子域名 → SGP_SERVERS key 的映射表
 *
 * 解决 platformId 与 SGP_SERVERS key 不一致的问题：
 * - EUW1 (platformId) → EUW (SGP_SERVERS key)
 * - EUN / EUNE → EUN1 (北欧东欧服)
 * - RU1 → RU
 * - NA → NA1 (命令行 --region 可能不含数字)
 *
 * 参考 LeagueAkari 的 region/rsoPlatformId 与 SGP_SERVERS 配置对比
 * @see resources/builtin-config/sgp/league-servers.json
 */
const PLATFORM_ID_TO_SGP_KEY: Record<string, string> = {
  // 外服 platformId 含数字后缀但 SGP_SERVERS key 不含
  EUW1: 'EUW',
  EUN: 'EUN1',
  EUNE: 'EUN1',
  EUN1: 'EUN1',
  RU1: 'RU',
  // 命令行 --region 可能不含数字但 SGP_SERVERS key 含数字
  NA: 'NA1',
  OCE: 'OC1',
  // 以下 platformId 与 SGP_SERVERS key 一致，但显式列出以防遗漏
  BR1: 'BR1',
  JP1: 'JP1',
  KR: 'KR',
  LA1: 'LA1',
  LA2: 'LA2',
  OC1: 'OC1',
  TR1: 'TR1',
  TW2: 'TW2',
  SG2: 'SG2',
  PH2: 'PH2',
  VN2: 'VN2',
  TH2: 'TH2',
  PBE: 'PBE',
}

function normalizeSgpServerKey(rawCode: string): string {
  const code = rawCode.toUpperCase()
  const mapped = PLATFORM_ID_TO_SGP_KEY[code] ?? code
  return SGP_SERVERS[mapped] ? mapped : ''
}

/** 国服 platformId 集合（需要加 TENCENT_ 前缀） */
const TENCENT_PLATFORM_IDS = new Set([
  'HN1', 'HN2', 'HN3', 'HN4', 'HN5', 'HN6', 'HN7', 'HN8', 'HN9',
  'HN10', 'HN11', 'HN12', 'HN13', 'HN14', 'HN15', 'HN16', 'HN17', 'HN18', 'HN19',
  'WT1', 'WT2', 'WT3', 'WT4', 'WT5', 'WT6', 'WT7',
  'EDU1',
  'BGP1', 'BGP2',
  'NJ100', 'GZ100', 'CQ100', 'TJ100', 'TJ101',
  'PBE', 'PREPBE',
])

// ==================== LCUManager 类 ====================

type EventCallback = (message: LCUEventMessage) => void

/**
 * LCUManager - 集中管理 LCU 的 REST API 和 WebSocket 事件
 *
 * 使用方式：
 * ```ts
 * import { lcu } from '@/lib/lcu'
 *
 * // REST API
 * const summoner = await lcu.getSummonerInfo()
 *
 * // WebSocket 事件监听
 * lcu.observe('/lol-gameflow/v1/gameflow-phase', (event) => {
 *   console.log('Gameflow phase:', event.data)
 * })
 * ```
 */
class LCUManager {
  private eventListeners = new Map<string, Set<EventCallback>>()
  /** 当前 socket 上已经实际调用过 observe 的 URI 集合 */
  private observedUris = new Set<string>()
  private penguContext: PenguContext | null = null

  // -------------------- SGP Token 缓存 --------------------

  /**
   * Entitlements Token 缓存
   *
   * 通过 WS 事件 `/entitlements/v1/token` 自动保活：
   * LCU 会在 token 即将过期时主动推送新 token，无需自己算过期时间。
   * 初始值通过主动拉取填充，后续由 WS 事件驱动更新。
   */
  private _entitlementsToken: SgpEntitlementsToken | null = null

  /**
   * League Session Token 缓存
   *
   * 通过 WS 事件 `/lol-league-session/v1/league-session-token` 自动保活。
   */
  private _leagueSessionToken: string | null = null

  /** SGP Token 是否已就绪（两个 token 都已拿到） */
  get isSgpTokenReady(): boolean {
    return this._entitlementsToken !== null && this._leagueSessionToken !== null
  }

  /** 获取缓存的 Entitlements Token（不会发起网络请求） */
  get cachedEntitlementsToken(): SgpEntitlementsToken | null {
    return this._entitlementsToken
  }

  /** 获取缓存的 League Session Token（不会发起网络请求） */
  get cachedLeagueSessionToken(): string | null {
    return this._leagueSessionToken
  }


  // -------------------- 初始化 --------------------

  /**
   * 绑定 PenguContext，用于 WebSocket 事件监听
   * 应在 init(context) 生命周期中调用
   */
  bindContext(context: PenguContext) {
    this.penguContext = context

    // context / socket 变了，但已有业务回调仍然有效：
    // 这里只清空"底层 socket 已订阅 URI"状态，然后把现有回调重新挂到新 socket 上。
    const uris = Array.from(this.eventListeners.keys())
    this.observedUris.clear()

    console.log('[LCUManager] bindContext() → replay %d observed uri(s)', uris.length)
    uris.forEach((uri) => this.observeUriOnSocket(uri))

    // 绑定 context 后立即初始化 SGP Token 保活
    this._initSgpTokenKeepAlive()
  }

  /**
   * SGP Token 保活机制
   *
   * 参考 LeagueAkari 的 _maintainEntitlementsToken / _maintainLeagueSessionToken 实现。
   *
   * 策略：
   * 1. 启动时主动拉取一次 token 填充缓存
   * 2. 监听 LCU WebSocket 事件，token 变化时自动更新缓存
   *    - `/entitlements/v1/token` → Entitlements Token
   *    - `/lol-league-session/v1/league-session-token` → League Session Token
   * 3. LCU 会在 token 即将过期时主动推送新 token，无需自己算过期时间
   */
  private _initSgpTokenKeepAlive() {
    // 1. 主动拉取初始 token
    this._fetchInitialTokens()

    // 2. 监听 WS 事件保活
    this.observe('/entitlements/v1/token', (event) => {
      const token = event.data as SgpEntitlementsToken | null
      if (token) {
        this._entitlementsToken = token
        console.log('[LCUManager] Entitlements Token 已通过 WS 事件更新')
      } else {
        this._entitlementsToken = null
        console.log('[LCUManager] Entitlements Token 已清空（WS 事件）')
      }
    })

    this.observe('/lol-league-session/v1/league-session-token', (event) => {
      const token = event.data as string | null
      if (token) {
        this._leagueSessionToken = token
        console.log('[LCUManager] League Session Token 已通过 WS 事件更新')
      } else {
        this._leagueSessionToken = null
        console.log('[LCUManager] League Session Token 已清空（WS 事件）')
      }
    })
  }

  /** 主动拉取初始 token 填充缓存 */
  private async _fetchInitialTokens() {
    try {
      const [entToken, sessionToken] = await Promise.all([
        this.getEntitlementsToken().catch((e) => {
          console.warn('[LCUManager] 初始拉取 Entitlements Token 失败:', e)
          return null
        }),
        this.getLeagueSessionToken().catch((e) => {
          console.warn('[LCUManager] 初始拉取 League Session Token 失败:', e)
          return null
        }),
      ])
      if (entToken) {
        this._entitlementsToken = entToken
        console.log('[LCUManager] 初始 Entitlements Token 已获取')
      }
      if (sessionToken) {
        this._leagueSessionToken = sessionToken
        console.log('[LCUManager] 初始 League Session Token 已获取')
      }
    } catch (error) {
      console.warn('[LCUManager] 初始拉取 SGP Token 异常:', error)
    }
  }


  // -------------------- 底层请求 (公开) --------------------

  /** 通用 REST 请求 */
  request = request
  get = get
  post = post
  put = put
  patch = patch
  delete = del

  // ==================== 召唤师 ====================

  /** 获取当前登录的召唤师信息 */
  getSummonerInfo(): Promise<SummonerInfo> {
    return get<SummonerInfo>('/lol-summoner/v1/current-summoner')
  }

  /** 通过 summoner ID 获取召唤师信息 */
  getSummonerById(summonerId: number): Promise<SummonerInfo> {
    return get<SummonerInfo>(`/lol-summoner/v1/summoners/${summonerId}`)
  }

  /** 通过 puuid 获取召唤师信息 */
  getSummonerByPuuid(puuid: string): Promise<SummonerInfo> {
    return get<SummonerInfo>(`/lol-summoner/v2/summoners/puuid/${puuid}`)
  }

  /** 通过 gameName + tagLine (Riot ID) 获取召唤师信息 */
  getSummonerByRiotId(gameName: string, tagLine: string): Promise<SummonerInfo> {
    return get<SummonerInfo>(`/lol-summoner/v1/alias/lookup?gameName=${encodeURIComponent(gameName)}&tagLine=${encodeURIComponent(tagLine)}`)
  }

  /**
   * 按 Riot ID 解析召唤师 puuid（支持国服跨大区）
   *
   * 解析顺序：
   * 1. 先用 LCU `alias/lookup` 查本区（外服 / 国服本区命中即返回，最快）
   * 2. 仅国服：本区查不到时，借助"所有腾讯大区共享同一 JWT"特性，并发查询
   *    所有互通大区的 SGP `summoner-ledge` 按名接口，再用返回的 tagLine 精确匹配
   *
   * 拿到 puuid 后即可走 `getSgpMatchHistory`（国服互通，可跨区出战绩）。
   *
   * @returns 命中的 puuid；查不到返回空字符串
   */
  async resolveSummonerPuuidByRiotId(gameName: string, tagLine: string): Promise<string> {
    const name = gameName.trim()
    const tag = tagLine.trim()
    if (!name || !tag) return ''

    // 1. 本区精确查询
    const local = await this.getSummonerByRiotId(name, tag).catch((err) => {
      console.warn('[CrossRegion] 本区 alias/lookup 失败:', err)
      return null
    })
    console.log('[CrossRegion] 本区 alias/lookup 结果:', local?.puuid ? `puuid=${local.puuid}` : '无')
    if (local?.puuid) return local.puuid

    // 2. 仅国服支持跨大区搜集
    const sgpServerId = (await this.getSgpServerId().catch(() => '')).toUpperCase()
    console.log('[CrossRegion] 当前 SGP 服务器:', sgpServerId || '(未解析到)')
    if (!sgpServerId.startsWith('TENCENT_')) {
      console.log('[CrossRegion] 非国服，跳过跨大区搜集')
      return ''
    }

    const token = this._entitlementsToken ?? await this.getEntitlementsToken().catch((err) => {
      console.warn('[CrossRegion] 获取 Entitlements Token 失败:', err)
      return null
    })
    if (!token?.accessToken) {
      console.warn('[CrossRegion] 无可用 accessToken，无法跨大区查询')
      return ''
    }
    this._entitlementsToken = token

    const wantTag = tag.toLowerCase()
    const wantName = name.toLowerCase()
    console.log('[CrossRegion] 开始跨大区搜集 → 目标 %s#%s，大区数 %d', name, tag, TENCENT_MATCH_HISTORY_INTEROP.length)

    const results = await Promise.allSettled(
      TENCENT_MATCH_HISTORY_INTEROP.map((regionKey) =>
        this._getSgpSummonerByName(regionKey, name, token.accessToken),
      ),
    )

    let matched = ''
    results.forEach((r, idx) => {
      const regionKey = TENCENT_MATCH_HISTORY_INTEROP[idx]
      if (r.status !== 'fulfilled') {
        console.warn('[CrossRegion] [%s] 查询异常:', regionKey, r.reason)
        return
      }
      if (!r.value) {
        console.log('[CrossRegion] [%s] 无返回 / 非 200', regionKey)
        return
      }
      const sTag = (r.value.tagLine ?? '').trim().toLowerCase()
      const sName = (r.value.gameName ?? r.value.name ?? '').trim().toLowerCase()
      console.log('[CrossRegion] [%s] 命中召唤师: name=%s tag=%s puuid=%s', regionKey, sName || '(空)', sTag || '(空)', r.value.puuid || '(空)')
      if (!matched && r.value.puuid && ((sTag && sTag === wantTag) || (!sTag && sName === wantName))) {
        matched = r.value.puuid
        console.log('[CrossRegion] ✓ 匹配成功 → 大区 %s，puuid=%s', regionKey, matched)
      }
    })

    if (!matched) console.log('[CrossRegion] ✗ 全大区均未匹配到 %s#%s', name, tag)
    return matched
  }

  /** 调用指定腾讯大区的 SGP `summoner-ledge` 按召唤师名查询 */
  private async _getSgpSummonerByName(
    regionKey: string,
    gameName: string,
    accessToken: string,
  ): Promise<SgpSummonerLite | null> {
    const server = SGP_SERVERS[regionKey]
    const base = server?.common ?? server?.matchHistory
    if (!base) return null

    const regionCode = regionKey.replace(/^TENCENT_/, '')
    const url = `${base}/summoner-ledge/v1/regions/${regionCode}/summoners/name/${encodeURIComponent(gameName)}`

    const resp = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'LeagueOfLegendsClient/14.13.596.7996 (rcp-be-lol-summoner)',
      },
    })

    const text = await resp.text().catch(() => '')
    console.log('[CrossRegion] [%s] %s → %d %s | body: %s', regionKey, url, resp.status, resp.statusText, text.slice(0, 800) || '(空)')

    if (!resp.ok) return null
    if (!text) return null

    try {
      return JSON.parse(text) as SgpSummonerLite
    } catch (err) {
      console.warn('[CrossRegion] [%s] JSON 解析失败:', regionKey, err)
      return null
    }
  }

  /** 设置当前召唤师头像 */
  setProfileIcon(profileIconId: number): Promise<unknown> {
    return put('/lol-summoner/v1/current-summoner/icon', { profileIconId })
  }

  /** 获取指定召唤师的客户端装备集 wrapper */
  getItemSets(summonerId: number): Promise<ItemSetWrapper> {
    return get<ItemSetWrapper>(`/lol-item-sets/v1/item-sets/${summonerId}/sets`)
  }

  /** 覆盖写入指定召唤师的客户端装备集 wrapper */
  putItemSets(summonerId: number, wrapper: ItemSetWrapper): Promise<ItemSetWrapper> {
    return put<ItemSetWrapper>(`/lol-item-sets/v1/item-sets/${summonerId}/sets`, wrapper)
  }

  /** 生成基础观战 payload；好友 presence 中有 spectatorKey 时应优先补上。 */
  createSpectatorLaunchPayload(puuid: string, overrides: Partial<SpectatorLaunchPayload> = {}): SpectatorLaunchPayload {
    return {
      allowObserveMode: 'ALL',
      dropInSpectateGameId: '',
      gameQueueType: '',
      puuid,
      ...overrides,
    }
  }

  /**
   * 从好友 presence 中拼出观战 payload。
   *
   * spectatorKey 就在 `/lol-chat/v1/friends` 返回的 friend.lol.spectatorKey 里；
   * 这个 key 只对正在游戏且允许观战的好友有值。
   */
  async getSpectatorLaunchPayloadByPuuid(puuid: string): Promise<SpectatorLaunchPayload | null> {
    const friends = await this.getFriends()
    const target = friends.find((friend) => friend.puuid.toLowerCase() === puuid.toLowerCase())
    if (!target?.lol?.spectatorKey) return null

    return this.createSpectatorLaunchPayload(target.puuid, {
      gameQueueType: target.lol.gameQueueType || target.lol.gameMode || '',
      spectatorKey: target.lol.spectatorKey,
    })
  }

  /**
   * 观战指定玩家。
   *
   * Akari 的 LCU helper 只传 puuid；实际客户端在部分场景需要 spectatorKey，
   * 可以传入完整 payload（从 getSpectatorLaunchPayloadByPuuid 获取）。
   */
  launchSpectator(payload: string | SpectatorLaunchPayload): Promise<unknown> {
    return post(
      '/lol-spectator/v1/spectate/launch',
      typeof payload === 'string' ? this.createSpectatorLaunchPayload(payload) : payload,
    )
  }


  /** 获取当前玩家的排位数据 */
  getCurrentRankedStats(): Promise<unknown> {
    return get('/lol-ranked/v1/current-ranked-stats')
  }

  /** 通过 puuid 获取排位数据 */
  getRankedStats(puuid: string): Promise<unknown> {
    return get(`/lol-ranked/v1/ranked-stats/${puuid}`)
  }

  // ==================== 房间/大厅 ====================

  /** 获取当前房间信息 */
  getLobby(): Promise<Lobby> {
    return get<Lobby>('/lol-lobby/v2/lobby')
  }

  /** 通过队列 ID 创建房间 */
  createLobby(queueId: QueueId | number): Promise<unknown> {
    return post('/lol-lobby/v2/lobby', { queueId })
  }

  /** 通过自定义配置创建房间 */
  createCustomLobby(config: LobbyConfig): Promise<unknown> {
    return post('/lol-lobby/v2/lobby', config)
  }

  /** 退出当前房间 */
  leaveLobby(): Promise<unknown> {
    return del('/lol-lobby/v2/lobby')
  }

  /**
   * 秒退英雄选择阶段（dodge ChampSelect）
   *
   * 实现：直接 `DELETE /lol-lobby/v2/lobby` 解散/离开当前房间。离开房间会把玩家
   * 从英雄选择阶段一并拽出，等效于 dodge。
   *
   * 为什么不用 `POST /lol-lobby-team-builder/champ-select/v1/session/quit`：
   *   该端点实测不生效（点了没有任何反应），故弃用。
   *
   * 错误处理：
   *   - 204 No Content：成功
   *   - 404 Not Found：本就不在房间 / 房间已不存在，按幂等成功处理
   *
   * 注：这会吃逃跑惩罚（降低排位或禁止匹配一段时间），由调用方自行确认场景。
   */
  dodgeChampSelect(): Promise<unknown> {
    return del('/lol-lobby/v2/lobby').catch((err: unknown) => {
      if (err instanceof Error && /→\s*404\b/.test(err.message)) {
        return undefined
      }
      throw err
    })
  }

  /**
   * 通过 LeagueAkari 使用的登录会话代理调用立即秒退。
   *
   * 该方法目前只用于 Debug 页验证，不替换上面的旧实现。调用后会产生正常的
   * 秒退惩罚，因此调用方必须先确认当前处于 ChampSelect 并取得用户确认。
   */
  dodgeChampSelectViaQuitV2(): Promise<unknown> {
    const args = ['', 'teambuilder-draft', 'quitV2', '']
    const params = new URLSearchParams({
      destination: 'lcdsServiceProxy',
      method: 'call',
      args: JSON.stringify(args),
    })

    return post(`/lol-login/v1/session/invoke?${params.toString()}`, { data: args })
  }

  // ==================== 匹配 ====================

  /** 开始匹配 */
  startMatchmaking(): Promise<unknown> {
    return post('/lol-lobby/v2/lobby/matchmaking/search')
  }

  /** 停止匹配 */
  stopMatchmaking(): Promise<unknown> {
    return del('/lol-lobby/v2/lobby/matchmaking/search')
  }

  /** 获取当前匹配搜索状态 */
  async getMatchSearchState(): Promise<MatchSearchState> {
    const result = await get<MatchSearchResult>('/lol-lobby/v2/lobby/matchmaking/search-state')
    return result.searchState
  }

  /** 接受对局 (Ready Check) */
  acceptMatch(): Promise<unknown> {
    return post('/lol-matchmaking/v1/ready-check/accept')
  }

  /** 拒绝对局 (Ready Check) */
  declineMatch(): Promise<unknown> {
    return post('/lol-matchmaking/v1/ready-check/decline')
  }

  /** 获取 Ready Check 状态 */
  getReadyCheck(): Promise<ReadyCheck> {
    return get<ReadyCheck>('/lol-matchmaking/v1/ready-check')
  }

  // ==================== 游戏流程 ====================

  /** 获取当前游戏流程阶段 */
  getGameflowPhase(): Promise<GameflowPhase> {
    return get<GameflowPhase>('/lol-gameflow/v1/gameflow-phase')
  }

  /** 获取游戏流程会话详情 */
  getGameflowSession(): Promise<GameflowSession> {
    return get<GameflowSession>('/lol-gameflow/v1/session')
  }

  /** 提前退出游戏（关闭游戏窗口） */
  earlyExitGame(): Promise<unknown> {
    return post('/lol-gameflow/v1/early-exit')
  }

  /** 投降 */
  surrender(): Promise<unknown> {
    return post('/lol-gameflow/v1/surrender')
  }

  /** 再来一局（对局结束后返回房间并自动排队） */
  playAgain(): Promise<unknown> {
    return post('/lol-lobby/v2/play-again')
  }

  // ==================== 英雄选择 ====================

  /** 获取英雄选择会话 */
  getChampSelectSession(): Promise<ChampSelectSession> {
    return get<ChampSelectSession>('/lol-champ-select/v1/session')
  }

  /** 获取英雄选择阶段指定格子的召唤师状态 */
  getChampSelectSummoner(cellId: number): Promise<ChampSelectSummoner> {
    return get<ChampSelectSummoner>(`/lol-champ-select/v1/summoners/${cellId}`)
  }

  /** 获取当前可选的英雄 ID 列表 */
  getPickableChampionIds(): Promise<number[]> {
    return get<number[]>('/lol-champ-select/v1/pickable-champion-ids')
  }

  /** 获取当前可禁用的英雄 ID 列表 */
  getBannableChampionIds(): Promise<number[]> {
    return get<number[]>('/lol-champ-select/v1/bannable-champion-ids')
  }

  /** 获取当前不可用的英雄 ID 列表 */
  getDisabledChampionIds(): Promise<number[]> {
    return get<number[]>('/lol-champ-select/v1/disabled-champion-ids')
  }

  /**
   * 锁定英雄（完成选人/禁人动作）
   *
   * 流程：从当前 session 中找到属于自己的、正在进行中的 action，
   * 先 PATCH 设置英雄，再 POST complete 锁定。
   *
   * @param championId 要锁定的英雄 ID
   * @param actionId 可选，直接指定 action ID（不传则自动查找当前正在进行的 action）
   */
  async lockChampion(championId: number, actionId?: number): Promise<void> {
    let targetActionId = actionId

    if (targetActionId == null) {
      const session = await this.getChampSelectSession()
      const myAction = session.actions
        .flat(2)
        .find((a) => a.actorCellId === session.localPlayerCellId && a.isInProgress && !a.completed)

      if (!myAction) {
        throw new Error('[LCU] 找不到当前正在进行的选人/禁人动作')
      }
      targetActionId = myAction.id
    }

    // 先选择英雄
    await patch(`/lol-champ-select/v1/session/actions/${targetActionId}`, { championId })
    // 再锁定确认
    await post(`/lol-champ-select/v1/session/actions/${targetActionId}/complete`)
  }

  /**
   * 仅选择英雄（不锁定）
   * 只执行 PATCH 设置英雄，不执行 complete 锁定
   */
  async pickChampion(championId: number, actionId?: number): Promise<void> {
    let targetActionId = actionId

    if (targetActionId == null) {
      const session = await this.getChampSelectSession()
      const myAction = session.actions
        .flat(2)
        .find((a) => a.actorCellId === session.localPlayerCellId && a.isInProgress && !a.completed)

      if (!myAction) {
        throw new Error('[LCU] 找不到当前正在进行的选人动作')
      }
      targetActionId = myAction.id
    }

    await patch(`/lol-champ-select/v1/session/actions/${targetActionId}`, { championId })
  }

  /**
   * 修改自己的选人信息（皮肤、召唤师技能等）
   * @param selection 选择参数
   */
  updateMySelection(selection: { selectedSkinId?: number; spell1Id?: number; spell2Id?: number; wardSkinId?: number }): Promise<unknown> {
    return patch('/lol-champ-select/v1/session/my-selection', selection)
  }

  /**
   * ARAM 重随英雄
   * 消耗重随点数，随机获得一个新英雄
   */
  reroll(): Promise<unknown> {
    return post('/lol-champ-select/v1/session/my-selection/reroll')
  }

  /**
   * 从 ARAM 共享池（Bench）中拿取英雄
   * 将自己当前的英雄放回池子，换取池中指定的英雄
   * @param championId 要从池中拿取的英雄 ID
   */
  benchSwap(championId: number): Promise<unknown> {
    return post(`/lol-champ-select/v1/session/bench/swap/${championId}`)
  }

  /**
   * 获取当前 ARAM 共享池中的英雄列表
   * 从 session 的 benchChampions 字段提取
   */
  async getBenchChampions(): Promise<{ championId: number; isPriority: boolean }[]> {
    const session = await this.getChampSelectSession()
    return session.benchChampions
  }

  /**
   * 获取本局选人阶段所有玩家的详细信息
   * 包含召唤师信息、排位数据、近期战绩
   * @returns 我方和敌方玩家信息数组
   */
  async getChampSelectPlayers(): Promise<{
    myTeam: ChampSelectPlayerDetail[]
    theirTeam: ChampSelectPlayerDetail[]
  }> {
    const session = await this.getChampSelectSession()

    const fetchDetail = async (player: { summonerId: number; championId: number; assignedPosition: string }): Promise<ChampSelectPlayerDetail> => {
      try {
        const summoner = await this.getSummonerById(player.summonerId)
        const [ranked, matchHistory] = await Promise.all([
          this.getRankedStats(summoner.puuid).catch(() => null),
          this.getMatchHistory(summoner.puuid, 0, 19).catch(() => null),
        ])
        return {
          summonerId: player.summonerId,
          championId: player.championId,
          assignedPosition: player.assignedPosition,
          gameName: summoner.gameName,
          tagLine: summoner.tagLine,
          summonerLevel: summoner.summonerLevel,
          puuid: summoner.puuid,
          profileIconId: summoner.profileIconId,
          ranked,
          recentMatches: matchHistory,
        }
      } catch {
        return {
          summonerId: player.summonerId,
          championId: player.championId,
          assignedPosition: player.assignedPosition,
          gameName: 'Unknown',
          tagLine: '',
          summonerLevel: 0,
          puuid: '',
          profileIconId: 0,
          ranked: null,
          recentMatches: null,
        }
      }
    }

    const [myTeam, theirTeam] = await Promise.all([
      Promise.all(session.myTeam.map(fetchDetail)),
      Promise.all(session.theirTeam.map(fetchDetail)),
    ])

    return { myTeam, theirTeam }
  }

  // ==================== 聊天 ====================

  /** 获取当前用户的聊天状态信息 */
  getChatMe(): Promise<ChatMe> {
    return get<ChatMe>('/lol-chat/v1/me')
  }

  /**
   * 更改玩家在线状态
   * @param availability 在线状态: 'chat'(在线) | 'away'(离开) | 'dnd'(勿扰) | 'offline'(隐身) | 'mobile'(手机在线)
   * @param statusMessage 可选，自定义签名
   */
  setAvailability(availability: Availability, statusMessage?: string): Promise<ChatMe> {
    const body: Partial<ChatMe> = { availability }
    if (statusMessage != null) {
      body.statusMessage = statusMessage
    }
    return put<ChatMe>('/lol-chat/v1/me', body)
  }

  /** 设置自定义签名 */
  setStatusMessage(statusMessage: string): Promise<ChatMe> {
    return put<ChatMe>('/lol-chat/v1/me', { statusMessage })
  }

  /** 获取聊天对话列表 */
  getChatConversations(): Promise<ChatConversation[]> {
    return get<ChatConversation[]>('/lol-chat/v1/conversations')
  }

  /** 获取指定会话的消息记录 */
  getChatMessages(conversationId: string): Promise<ChatMessage[]> {
    return get<ChatMessage[]>(`/lol-chat/v1/conversations/${conversationId}/messages`)
  }

  /**
   * 向指定会话发送消息
   *
   * 注意：LCU API 单条消息最大长度为 2696 个字符（含空格），超出会被截断或拒绝。
   * 该限制为 API 层限制，客户端前端 UI 的 200 字限制仅为前端校验。
   *
   * @param conversationId 会话 ID
   * @param message 消息内容（字符串或完整请求体）
   */
  sendChatMessage(conversationId: string, message: string | SendChatMessageBody): Promise<ChatMessage> {
    const body: SendChatMessageBody = typeof message === 'string'
      ? { body: message, type: 'chat' }
      : message
    return post<ChatMessage>(`/lol-chat/v1/conversations/${conversationId}/messages`, body)
  }

  /**
   * 获取当前英雄选择阶段的聊天会话
   * 从所有会话中找到 type 为 'championSelect' 的会话
   * @returns 英雄选择聊天会话，如果不在选人阶段则返回 null
   */
  async getChampSelectConversation(): Promise<ChatConversation | null> {
    const conversations = await this.getChatConversations()
    return conversations.find((c) => c.type === 'championSelect') ?? null
  }

  /**
   * 在英雄选择界面发送消息（一步到位）
   * 自动找到选人聊天会话并发送消息
   * @param message 消息内容
   * @param type 消息类型: 'chat'(所有人可见)、'celebration'(仅自己可见/黄色)、'system'(仅自己可见/系统样式)
   * @throws 如果当前不在选人阶段（找不到 championSelect 会话）
   */
  async sendChampSelectMessage(message: string, type?: 'chat' | 'celebration' | 'system' |'information' | string): Promise<ChatMessage> {
    const conversation = await this.getChampSelectConversation()
    if (!conversation) {
      throw new Error('[LCU] 当前不在英雄选择阶段，找不到 championSelect 会话')
    }
    return this.sendChatMessage(conversation.id, { body: message, type: type ?? 'chat' })
  }

  // ==================== 队列信息 ====================

  /** 获取所有可用队列（含中文名、游戏模式、地图等） */
  getQueues(): Promise<GameQueue[]> {
    return get<GameQueue[]>('/lol-game-queues/v1/queues')
  }

  /** 获取当前游戏模式信息 */
  getCurrentGamemode(): Promise<unknown> {
    return get('/lol-lobby/v1/parties/gamemode')
  }

  /** 获取所有游戏模式 */
  getGameModes(): Promise<unknown[]> {
    return get<unknown[]>('/lol-game-queues/v1/game-type-config')
  }

  /** 获取所有地图信息 */
  getMaps(): Promise<unknown[]> {
    return get<unknown[]>('/lol-maps/v1/maps')
  }

  /** 获取地图资源数据（含地图皮肤/突变模式本地化名称） */
  getMapAssets(): Promise<unknown[]> {
    return get<unknown[]>('/lol-game-data/assets/v1/maps.json')
  }

  // ==================== 战绩 ====================

  /**
   * 获取战绩列表
   * @param puuid 不传则查当前玩家，传入则查指定玩家
   * @param begIndex 起始索引，默认 0
   * @param endIndex 结束索引，默认 19（共 20 条）
   */
  getMatchHistory(puuid?: string, begIndex = 0, endIndex = 19): Promise<MatchHistoryResponse> {
    const base = puuid
      ? `/lol-match-history/v1/products/lol/${puuid}/matches`
      : '/lol-match-history/v1/products/lol/current-summoner/matches'
    return get(`${base}?begIndex=${begIndex}&endIndex=${endIndex}`)
  }

  /**
   * 获取单局对局详情
   * @param gameId 对局 ID
   */
  getMatchDetail(gameId: number): Promise<MatchDetail> {
    return get<MatchDetail>(`/lol-match-history/v1/games/${gameId}`)
  }

  /**
   * 获取单局时间线数据
   * @param gameId 对局 ID
   */
  getMatchTimeline(gameId: number): Promise<unknown> {
    return get(`/lol-match-history/v1/game-timelines/${gameId}`)
  }

  /** 获取最近一起玩过的召唤师 */
  getRecentlyPlayedSummoners(): Promise<unknown> {
    return get('/lol-match-history/v1/recently-played-summoners')
  }

  // ==================== 奖励领取（通行证 / Grants） ====================

  /**
   * 获取奖励授予列表（grants）
   *
   * @param status 过滤状态，常用 `'PENDING_SELECTION'`（待选择的多选一/几选几奖励）。
   *   不传则返回全部状态的 grant。
   *
   * 返回的每个 grant 含：
   * - `info.id`：grantId，领取/选择时所需
   * - `info.rewardGroupId` / `rewardGroup.id`：奖励组 id
   * - `rewardGroup.rewards[].id`：单个奖励的 reward id（select 时提交它）
   * - `rewardGroup.selectionStrategyConfig`：几选几（为 null 表示直接发放，无需选择）
   */
  getRewardGrants(status?: string): Promise<RewardsGrant[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : ''
    return get<RewardsGrant[]>(`/lol-rewards/v1/grants${query}`)
  }

  /**
   * 按需领取：选择并领取某个 grant 内的指定奖励
   *
   * 仅对 `PENDING_SELECTION`（多选一/几选几）类奖励有效。
   *
   * @param grantId       grant 的 id（来自 `RewardsGrant.info.id`）
   * @param rewardGroupId 奖励组 id（来自 `rewardGroup.id`）
   * @param rewardIds     想要领取的 reward id 列表（来自 `rewardGroup.rewards[].id`），
   *                      数量需满足 `selectionStrategyConfig` 的 min/max 限制
   */
  selectGrantReward(grantId: string, rewardGroupId: string, rewardIds: string[]): Promise<unknown> {
    return post(`/lol-rewards/v1/grants/${grantId}/select`, {
      grantId,
      rewardGroupId,
      selections: rewardIds,
    })
  }

  /**
   * 标记 grant 为已查看（去掉客户端红点提示），**不等于领取**。
   * @param grantIds grant id 列表
   */
  viewRewardGrants(grantIds: string[]): Promise<unknown> {
    return patch('/lol-rewards/v1/grants/view', grantIds)
  }

  // ==================== SGP Token ====================

  /**
   * 获取 Entitlements Token（SGP 战绩查询所需）
   *
   * 返回值说明：
   * - `accessToken`: JWT，用于 `Authorization: Bearer {accessToken}` 请求 SGP 战绩/对局详情接口
   * - `token`: Entitlements JWT（格式不同，部分 SGP 接口可能需要）
   * - `issuer`: 签发者 URL，如 `http://hn1-k8s-bcs-internal.lol.qq.com:28088`
   *   可从中解析当前区服（hn1 = 艾欧尼亚、hn10 = 黑色玫瑰 等）
   * - `subject`: 玩家 PUUID
   * - `entitlements`: 权限列表（通常为空数组）
   *
   * Akari 通过 WS 事件 `/entitlements/v1/token` 自动刷新，我们这里按需拉取。
   */
  getEntitlementsToken(): Promise<SgpEntitlementsToken> {
    return get('/entitlements/v1/token')
  }

  /**
   * 获取 League Session Token（SGP 通用查询所需）
   *
   * 返回纯 JWT 字符串，用于 `Authorization: Bearer {token}` 请求 SGP 通用接口（召唤师/排位等）。
   */
  getLeagueSessionToken(): Promise<string> {
    return get('/lol-league-session/v1/league-session-token')
  }

  /**
   * 从 Entitlements Token 的 issuer 推断当前 SGP 服务器 ID
   *
   * 解析策略（多源 fallback）：
   * 1. 优先使用 `/lol-chat/v1/me` 的 `platformId`，这是 Pengu 环境中最接近 Akari
   *    `--region` / `--rso_platform_id` 的来源。
   * 2. Fallback：从 Entitlements Token 的 issuer 解析。
   * 3. 所有解析结果都必须命中 `SGP_SERVERS` 配置，否则继续 fallback。
   *
   * 已知问题（对比 LeagueAkari）：
   * - LeagueAkari 从 LeagueClient.exe 命令行参数 `--region` / `--rso_platform_id` 获取，
   *   这是官方数据源，最可靠。但 Pengu Loader 插件无法访问命令行参数。
   * - 国服部分大区 issuer 不含 `k8s`（如联盟一区 NJ100），旧正则会匹配失败。
   * - 外服 issuer 子域名可能与 SGP_SERVERS key 不一致（如 EUW1 → EUW、EUNE → EUN1）。
   */
  async getSgpServerId(): Promise<string> {
    // Akari 以客户端启动参数为准；Pengu 内优先使用 ChatMe.platformId 近似它。
    const fromPlatformId = await this._parseSgpServerIdFromPlatformId()
    if (fromPlatformId) return fromPlatformId

    // Fallback: 从 issuer 解析。外服 issuer 有时是 euc1/apne1/usw2/apse1 这类路由集群，
    // 这些 regional key 只保留 match-history 能力，不代表精确 platform。
    const fromIssuer = this._parseSgpServerIdFromIssuer()
    if (fromIssuer) return fromIssuer

    return ''
  }

  /** 从 issuer URL 解析 SGP 服务器 ID */
  private _parseSgpServerIdFromIssuer(): string {
    const tokenRes = this._entitlementsToken
    if (!tokenRes) return ''

    const issuer = tokenRes.issuer ?? ''

    // 国服: 匹配 lol.qq.com 域名下的 issuer
    // 已知格式：
    //   http://hn1-k8s-bcs-internal.lol.qq.com:28088  (含 k8s)
    //   http://nj100-bcs-internal.lol.qq.com:28088     (不含 k8s)
    // 提取第一个子域名段（即服务器代码），忽略中间的 -k8s 等段
    const tencentMatch = issuer.match(/https?:\/\/([a-z0-9]+)(?:-[a-z0-9]+)*\.lol\.qq\.com/)
    if (tencentMatch) {
      const serverCode = tencentMatch[1].toUpperCase() // e.g. "HN1", "NJ100"
      return normalizeSgpServerKey(`TENCENT_${serverCode}`)
    }

    // 外服: 匹配 pvp.net 域名
    // 已知格式：
    //   https://euw1-red.lol.sgp.pvp.net
    //   https://euw-red.lol.sgp.pvp.net
    //   https://na-red.lol.sgp.pvp.net
    //   https://kr-red.lol.sgp.pvp.net
    const externalMatch = issuer.match(/https?:\/\/([a-z0-9]+)-[a-z0-9]+\.lol\.sgp\.pvp\.net/)
      ?? issuer.match(/https?:\/\/([a-z0-9]+)-[a-z0-9]+\.(?:lol\.)?sgp\.pvp\.net/)
      ?? issuer.match(/https?:\/\/([a-z0-9]+)-/)
    if (externalMatch) {
      const rawCode = externalMatch[1].toUpperCase()
      // issuer 子域名可能与 SGP_SERVERS key 不一致，需要映射
      return normalizeSgpServerKey(rawCode)
    }

    return ''
  }

  /** 从 /lol-chat/v1/me 的 platformId 解析 SGP 服务器 ID（fallback） */
  private async _parseSgpServerIdFromPlatformId(): Promise<string> {
    try {
      const me = await this.getChatMe()
      const platformId = me.platformId?.toUpperCase() ?? ''
      if (!platformId) return ''

      // 国服 platformId: HN1, HN10, NJ100, TJ100 等
      // 需要加 TENCENT_ 前缀
      if (TENCENT_PLATFORM_IDS.has(platformId)) {
        return normalizeSgpServerKey(`TENCENT_${platformId}`)
      }

      // 外服 platformId: EUW1, NA1, KR, JP1 等
      // 可能与 SGP_SERVERS key 不一致，需要映射
      return normalizeSgpServerKey(platformId)
    } catch {
      return ''
    }
  }

  /**
   * 通过 SGP 查询战绩列表
   *
   * 相比 LCU 接口的优势：
   * - 支持 `tag` 参数按队列模式过滤（如 `q_450` 只查大乱斗）
   * - 无浏览器缓存问题
   * - 国服跨区查询
   * - 突破 LCU 100 场上限
   *
   * @param puuid 玩家 PUUID
   * @param options 查询参数
   * @param options.startIndex 起始索引（默认 0，注意：SGP 用 startIndex 而非 LCU 的 begIndex）
   * @param options.count 获取数量（默认 100，注意：SGP 用 count 而非 LCU 的 endIndex）
   * @param options.tag 按队列模式过滤，如 `q_450`（大乱斗），不传则查全部模式。使用 `queueIdToTag()` 生成。
   */
  async getSgpMatchHistory(puuid: string, options?: {
    startIndex?: number
    count?: number
    tag?: string
  }): Promise<SgpMatchHistoryLol> {
    const debugContext: {
      platformId: string
      sgpServerId: string
      matchHistoryBaseUrl: string
      requestUrl: string
      issuer: string
    } = {
      platformId: '',
      sgpServerId: '',
      matchHistoryBaseUrl: '',
      requestUrl: '',
      issuer: this._entitlementsToken?.issuer ?? '',
    }

    try {
      const chatMe = await this.getChatMe().catch(() => null)
      debugContext.platformId = chatMe?.platformId ?? ''

      const token = this._entitlementsToken ?? await this.getEntitlementsToken()
      if (!this._entitlementsToken) {
        this._entitlementsToken = token
      }
      debugContext.issuer = token.issuer ?? debugContext.issuer

      const sgpServerId = await this.getSgpServerId()
      debugContext.sgpServerId = sgpServerId
      const server = SGP_SERVERS[sgpServerId.toUpperCase()]
      debugContext.matchHistoryBaseUrl = server?.matchHistory ?? ''
      if (!server?.matchHistory) {
        throw new Error(`[SGP] 找不到服务器配置: ${sgpServerId}`)
      }

      const params = new URLSearchParams()
      params.set('startIndex', String(options?.startIndex ?? 0))
      params.set('count', String(options?.count ?? 100))
      if (options?.tag) {
        params.set('tag', options.tag)
      }

      const url = `${server.matchHistory}/match-history-query/v1/products/lol/player/${puuid}/SUMMARY?${params}`
      debugContext.requestUrl = url

      const resp = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token.accessToken}`,
          'User-Agent': 'LeagueOfLegendsClient/14.13.596.7996 (rcp-be-lol-match-history)',
        },
      })

      if (!resp.ok) {
        const body = await resp.text().catch(() => '')
        throw new Error(`[SGP] 请求失败: ${resp.status} ${resp.statusText} ${body.slice(0, 1000)}`)
      }

      return resp.json()
    } catch (err) {
      console.error('[SGP] 战绩查询失败，回退到客户端原生战绩接口', {
        platformId: debugContext.platformId || 'unknown',
        sgpServerId: debugContext.sgpServerId || 'unknown',
        matchHistoryBaseUrl: debugContext.matchHistoryBaseUrl || 'unknown',
        issuer: debugContext.issuer || 'unknown',
        puuid,
        startIndex: options?.startIndex ?? 0,
        count: options?.count ?? 100,
        tag: options?.tag ?? '',
        requestUrl: debugContext.requestUrl || 'not-built',
        errorName: err instanceof Error ? err.name : typeof err,
        errorMessage: err instanceof Error ? err.message : String(err),
        error: err,
      })
      return this.getNativeMatchHistoryAsSgp(puuid, options)
    }
  }

  private async getNativeMatchHistoryAsSgp(puuid: string, options?: {
    startIndex?: number
    count?: number
    tag?: string
  }): Promise<SgpMatchHistoryLol> {
    const startIndex = Math.max(0, options?.startIndex ?? 0)
    const count = Math.max(1, options?.count ?? 100)
    const queueId = this.parseQueueIdFromSgpTag(options?.tag)

    // LCU 原生接口不支持 tag。带队列过滤时从最近 100 场中本地过滤后再模拟 SGP 分页。
    const begIndex = queueId ? 0 : startIndex
    const endIndex = queueId
      ? 99
      : startIndex + count - 1
    const native = await this.getMatchHistory(puuid, begIndex, endIndex)
    const nativeGames = native.games?.games ?? []
    const filteredGames = queueId
      ? nativeGames.filter((game) => game.queueId === queueId).slice(startIndex, startIndex + count)
      : nativeGames

    return {
      games: filteredGames.map((game) => this.mapNativeMatchGameToSgpGame(game)),
    }
  }

  private parseQueueIdFromSgpTag(tag: string | undefined): number | null {
    const match = tag?.match(/^q_(\d+)$/)
    if (!match) return null

    const queueId = Number.parseInt(match[1], 10)
    return Number.isFinite(queueId) && queueId > 0 ? queueId : null
  }

  private mapNativeMatchGameToSgpGame(game: MatchGame): SgpGameSummaryLol {
    const identitiesByParticipantId = new Map<number, ParticipantIdentity>()
    game.participantIdentities.forEach((identity) => {
      identitiesByParticipantId.set(identity.participantId, identity)
    })

    const participants = game.participants.map((participant) => {
      return this.mapNativeParticipantToSgpParticipant(participant, identitiesByParticipantId.get(participant.participantId), game.gameDuration)
    })

    return {
      metadata: {
        product: 'lol',
        tags: [`q_${game.queueId}`],
        participants: participants.map((participant) => participant.puuid).filter(Boolean),
        timestamp: new Date(game.gameCreation).toISOString(),
        data_version: '',
        info_type: 'SUMMARY',
        match_id: `${game.platformId}_${game.gameId}`,
        private: false,
      },
      json: {
        endOfGameResult: game.endOfGameResult,
        gameCreation: game.gameCreation,
        gameDuration: game.gameDuration,
        gameEndTimestamp: game.gameCreation + game.gameDuration * 1000,
        gameId: game.gameId,
        gameMode: game.gameMode,
        gameModeMutators: game.gameModeMutators ?? [],
        gameName: '',
        gameStartTimestamp: game.gameCreation,
        gameType: game.gameType,
        gameVersion: game.gameVersion,
        mapId: game.mapId,
        participants,
        platformId: game.platformId,
        queueId: game.queueId,
        seasonId: game.seasonId,
        teams: game.teams.map((team) => this.mapNativeTeamToSgpTeam(team)),
        tournamentCode: '',
      },
    }
  }

  private mapNativeTeamToSgpTeam(team: MatchTeam): SgpTeam {
    return {
      bans: [],
      objectives: {
        baron: { first: team.firstBaron, kills: team.baronKills },
        champion: { first: team.firstBlood, kills: 0 },
        dragon: { first: team.firstDargon, kills: team.dragonKills },
        horde: { first: false, kills: team.hordeKills },
        inhibitor: { first: team.firstInhibitor, kills: team.inhibitorKills },
        riftHerald: { first: false, kills: team.riftHeraldKills },
        tower: { first: team.firstTower, kills: team.towerKills },
      },
      teamId: team.teamId,
      win: team.win === 'Win',
    }
  }

  private mapNativeParticipantToSgpParticipant(
    participant: Participant,
    identity: ParticipantIdentity | undefined,
    gameDuration: number,
  ): SgpParticipantLol {
    const stats = participant.stats
    const player = identity?.player
    const timePlayed = gameDuration || 0
    const perks: SgpPerks = {
      statPerks: {
        defense: 0,
        flex: 0,
        offense: 0,
      },
      styles: [
        {
          description: 'primaryStyle',
          style: stats.perkPrimaryStyle || 0,
          selections: [
            { perk: stats.perk0 || 0, var1: stats.perk0Var1 || 0, var2: stats.perk0Var2 || 0, var3: stats.perk0Var3 || 0 },
            { perk: stats.perk1 || 0, var1: stats.perk1Var1 || 0, var2: stats.perk1Var2 || 0, var3: stats.perk1Var3 || 0 },
            { perk: stats.perk2 || 0, var1: stats.perk2Var1 || 0, var2: stats.perk2Var2 || 0, var3: stats.perk2Var3 || 0 },
            { perk: stats.perk3 || 0, var1: stats.perk3Var1 || 0, var2: stats.perk3Var2 || 0, var3: stats.perk3Var3 || 0 },
          ],
        },
        {
          description: 'subStyle',
          style: stats.perkSubStyle || 0,
          selections: [
            { perk: stats.perk4 || 0, var1: stats.perk4Var1 || 0, var2: stats.perk4Var2 || 0, var3: stats.perk4Var3 || 0 },
            { perk: stats.perk5 || 0, var1: stats.perk5Var1 || 0, var2: stats.perk5Var2 || 0, var3: stats.perk5Var3 || 0 },
          ],
        },
      ],
    }

    const challenges = {
      damagePerMinute: timePlayed > 0 ? (stats.totalDamageDealtToChampions / timePlayed) * 60 : 0,
      goldPerMinute: timePlayed > 0 ? (stats.goldEarned / timePlayed) * 60 : 0,
      kda: stats.deaths > 0 ? (stats.kills + stats.assists) / stats.deaths : stats.kills + stats.assists,
      visionScorePerMinute: timePlayed > 0 ? (stats.visionScore / timePlayed) * 60 : 0,
    } as SgpParticipantLol['challenges']

    return {
      PlayerBehavior: { PlayerBehavior_IsHeroInCombat: 0 },
      PlayerScore0: stats.playerScore0 || 0,
      PlayerScore1: stats.playerScore1 || 0,
      PlayerScore2: stats.playerScore2 || 0,
      PlayerScore3: stats.playerScore3 || 0,
      PlayerScore4: stats.playerScore4 || 0,
      PlayerScore5: stats.playerScore5 || 0,
      PlayerScore6: stats.playerScore6 || 0,
      PlayerScore7: stats.playerScore7 || 0,
      PlayerScore8: stats.playerScore8 || 0,
      PlayerScore9: stats.playerScore9 || 0,
      PlayerScore10: 0,
      PlayerScore11: 0,
      assists: stats.assists,
      challenges,
      champExperience: 0,
      champLevel: stats.champLevel,
      championId: participant.championId,
      championName: '',
      championTransform: 0,
      damageDealtToBuildings: stats.damageDealtToTurrets,
      damageDealtToEpicMonsters: 0,
      damageDealtToObjectives: stats.damageDealtToObjectives,
      damageDealtToTurrets: stats.damageDealtToTurrets,
      damageSelfMitigated: stats.damageSelfMitigated,
      deaths: stats.deaths,
      detectorWardsPlaced: stats.visionWardsBoughtInGame,
      doubleKills: stats.doubleKills,
      dragonKills: 0,
      eligibleForProgression: true,
      firstBloodAssist: stats.firstBloodAssist,
      firstBloodKill: stats.firstBloodKill,
      firstTowerAssist: stats.firstTowerAssist,
      firstTowerKill: stats.firstTowerKill,
      gameEndedInEarlySurrender: stats.gameEndedInEarlySurrender,
      gameEndedInSurrender: stats.gameEndedInSurrender,
      goldEarned: stats.goldEarned,
      goldSpent: stats.goldSpent,
      individualPosition: participant.timeline?.lane || '',
      inhibitorKills: stats.inhibitorKills,
      item0: stats.item0,
      item1: stats.item1,
      item2: stats.item2,
      item3: stats.item3,
      item4: stats.item4,
      item5: stats.item5,
      item6: stats.item6,
      killingSprees: stats.killingSprees,
      kills: stats.kills,
      lane: participant.timeline?.lane || '',
      largestCriticalStrike: stats.largestCriticalStrike,
      largestKillingSpree: stats.largestKillingSpree,
      largestMultiKill: stats.largestMultiKill,
      longestTimeSpentLiving: stats.longestTimeSpentLiving,
      magicDamageDealt: stats.magicDamageDealt,
      magicDamageDealtToChampions: stats.magicDamageDealtToChampions,
      magicDamageTaken: stats.magicalDamageTaken,
      missions: {},
      neutralMinionsKilled: stats.neutralMinionsKilled,
      participantId: participant.participantId,
      pentaKills: stats.pentaKills,
      perks,
      physicalDamageDealt: stats.physicalDamageDealt,
      physicalDamageDealtToChampions: stats.physicalDamageDealtToChampions,
      physicalDamageTaken: stats.physicalDamageTaken,
      placement: stats.subteamPlacement,
      playerAugment1: stats.playerAugment1,
      playerAugment2: stats.playerAugment2,
      playerAugment3: stats.playerAugment3,
      playerAugment4: stats.playerAugment4,
      playerAugment5: stats.playerAugment5,
      playerAugment6: stats.playerAugment6,
      playerSubteamId: stats.playerSubteamId,
      profileIcon: player?.profileIcon ?? 0,
      puuid: player?.puuid ?? '',
      quadraKills: stats.quadraKills,
      riotIdGameName: player?.gameName ?? player?.summonerName ?? '',
      riotIdTagline: player?.tagLine ?? '',
      role: participant.timeline?.role || '',
      roleBoundItem: stats.roleBoundItem,
      sightWardsBoughtInGame: stats.sightWardsBoughtInGame,
      spell1Id: participant.spell1Id,
      spell2Id: participant.spell2Id,
      subteamPlacement: stats.subteamPlacement,
      summonerId: player?.summonerId ?? 0,
      summonerLevel: 0,
      summonerName: player?.summonerName ?? player?.gameName ?? '',
      teamEarlySurrendered: stats.teamEarlySurrendered,
      teamId: participant.teamId,
      teamPosition: participant.timeline?.lane || '',
      timeCCingOthers: stats.timeCCingOthers,
      timePlayed,
      totalDamageDealt: stats.totalDamageDealt,
      totalDamageDealtToChampions: stats.totalDamageDealtToChampions,
      totalDamageShieldedOnTeammates: 0,
      totalDamageTaken: stats.totalDamageTaken,
      totalHeal: stats.totalHeal,
      totalHealsOnTeammates: 0,
      totalMinionsKilled: stats.totalMinionsKilled,
      totalTimeCCDealt: stats.totalTimeCrowdControlDealt,
      totalTimeSpentDead: 0,
      totalUnitsHealed: stats.totalUnitsHealed,
      tripleKills: stats.tripleKills,
      trueDamageDealt: stats.trueDamageDealt,
      trueDamageDealtToChampions: stats.trueDamageDealtToChampions,
      trueDamageTaken: stats.trueDamageTaken,
      turretKills: stats.turretKills,
      turretTakedowns: stats.turretKills,
      turretsLost: 0,
      unrealKills: stats.unrealKills,
      visionScore: stats.visionScore,
      visionWardsBoughtInGame: stats.visionWardsBoughtInGame,
      wardsKilled: stats.wardsKilled,
      wardsPlaced: stats.wardsPlaced,
      win: stats.win,
      allInPings: 0,
      assistMePings: 0,
      baronKills: 0,
      basicPings: 0,
      commandPings: 0,
      consumablesPurchased: 0,
      dangerPings: 0,
      enemyMissingPings: 0,
      enemyVisionPings: 0,
      getBackPings: 0,
      holdPings: 0,
      inhibitorTakedowns: stats.inhibitorKills,
      inhibitorsLost: 0,
      itemsPurchased: 0,
      needVisionPings: 0,
      nexusKills: 0,
      nexusLost: 0,
      nexusTakedowns: 0,
      objectivesStolen: 0,
      objectivesStolenAssists: 0,
      onMyWayPings: 0,
      pushPings: 0,
      retreatPings: 0,
      spell1Casts: 0,
      spell2Casts: 0,
      spell3Casts: 0,
      spell4Casts: 0,
      summoner1Casts: 0,
      summoner2Casts: 0,
      totalAllyJungleMinionsKilled: stats.neutralMinionsKilledTeamJungle,
      totalEnemyJungleMinionsKilled: stats.neutralMinionsKilledEnemyJungle,
      visionClearedPings: 0,
    }
  }

  // ==================== 好友 ====================

  /**
   * 获取好友列表
   * 包含每个好友的在线状态、游戏状态、gameId 等
   */
  getFriends(): Promise<ChatFriend[]> {
    return get<ChatFriend[]>('/lol-chat/v1/friends')
  }

  // ==================== 游戏资源 ====================

  /** 获取当前客户端的游戏版本号（如 "14.7.580.1234"） */
  getGameVersion(): Promise<string> {
    return get<string>('/lol-patch/v1/game-version')
  }

  /** 获取所有物品数据（含 iconPath / description） */
  getItems(): Promise<Array<{ id: number; iconPath: string; name: string; description?: string; shortDescription?: string; longDescription?: string; price?: number; priceTotal?: number }>> {
    return get('/lol-game-data/assets/v1/items.json')
  }

  /** 获取所有召唤师技能数据（含 iconPath） */
  getSummonerSpells(): Promise<SummonerSpellData[]> {
    return get('/lol-game-data/assets/v1/summoner-spells.json')
  }

  /** 获取所有英雄摘要数据（含 squarePortraitPath） */
  getChampionSummary(): Promise<ChampionSummaryData[]> {
    return get('/lol-game-data/assets/v1/champion-summary.json')
  }

  /** 获取所有符文数据（含 iconPath / description，对应单个符文 ID） */
  getPerks(): Promise<Array<{ id: number; iconPath: string; name: string; shortDesc?: string; longDesc?: string; description?: string }>> {
    return get('/lol-game-data/assets/v1/perks.json')
  }

  /** 获取所有符文系样式（对应 perkPrimaryStyle / perkSubStyle） */
  getPerkStyles(): Promise<{ styles: Array<{ id: number; iconPath: string; name: string }> }> {
    return get('/lol-game-data/assets/v1/perkstyles.json')
  }

  /** 获取斗魂竞技场 / 海克斯模式强化符文数据 */
  getAugments(): Promise<Array<{ id: number; nameTRA: string; simpleNameTRA: string; augmentSmallIconPath: string; rarity: string }>> {
    return get('/lol-game-data/assets/v1/cherry-augments.json')
  }

  // ==================== 旗帜 / 挑战身份 ====================

  /** 获取当前账号拥有的挑战旗帜库存 */
  async getRegaliaBannerInventory(): Promise<RegaliaBannerInventory> {
    const raw = await get<unknown>('/lol-regalia/v3/inventory/REGALIA_BANNER')
    return normalizeRegaliaBannerInventory(raw)
  }

  /** 获取当前召唤师的 Regalia 装饰配置 */
  getRegalia(): Promise<RegaliaInfo> {
    return get<RegaliaInfo>('/lol-regalia/v2/current-summoner/regalia')
  }

  /** 更新当前召唤师的 Regalia 装饰配置 */
  updateRegalia(payload: RegaliaUpdatePayload): Promise<void> {
    return put<void>('/lol-regalia/v2/current-summoner/regalia', payload)
  }

  /** 更新挑战身份偏好，例如展示旗帜、挑战 token 等 */
  updateChallengePlayerPreferences(payload: ChallengePlayerPreferencesPayload): Promise<void> {
    return post<void>('/lol-challenges/v1/update-player-preferences', payload)
  }

  /** 应用挑战旗帜 */
  applyRegaliaBanner(bannerId: string): Promise<void> {
    return this.updateChallengePlayerPreferences({ bannerAccent: bannerId })
  }

  /** 获取玩家符文页 */
  getRunePages(): Promise<RunePage[]> {
    return get<RunePage[]>('/lol-perks/v1/pages')
  }

  /** 创建符文页 */
  createRunePage(page: RunePagePayload): Promise<RunePage> {
    return post<RunePage>('/lol-perks/v1/pages', page)
  }

  /** 更新指定符文页 */
  updateRunePage(id: number, page: RunePagePayload): Promise<RunePage> {
    return put<RunePage>(`/lol-perks/v1/pages/${id}`, page)
  }

  /** 删除指定符文页 */
  deleteRunePage(id: number): Promise<void> {
    return del<void>(`/lol-perks/v1/pages/${id}`)
  }

  /** 创建或更新 Sona 管理的符文页，并设为当前使用页 */
  async applyRunePage(page: Omit<RunePagePayload, 'current'>): Promise<RunePage> {
    const payload: RunePagePayload = {
      ...page,
      current: true,
    }
    const pages = await this.getRunePages()
    const isEditable = (p: RunePage) => p.isEditable !== false
    const isSonaManaged = (p: RunePage) => /\s-\s*Sona$/i.test(p.name)
    const cleanupDuplicateSonaPages = async (keepId: number) => {
      await Promise.allSettled(
        pages
          .filter((p) => p.id !== keepId && isSonaManaged(p) && p.isDeletable !== false)
          .map((p) => this.deleteRunePage(p.id)),
      )
    }

    const existing = pages.find((p) => p.name === page.name && p.isEditable !== false)
    if (existing) {
      const updated = await this.updateRunePage(existing.id, payload)
      await cleanupDuplicateSonaPages(existing.id)
      return updated
    }

    const managed = pages.find((p) => isSonaManaged(p) && isEditable(p))
    if (managed) {
      const updated = await this.updateRunePage(managed.id, payload)
      await cleanupDuplicateSonaPages(managed.id)
      return updated
    }

    try {
      return await this.createRunePage(payload)
    } catch (err) {
      const fallback = pages.find((p) => p.current && p.isEditable !== false) ?? pages.find((p) => p.isEditable !== false)
      if (fallback) {
        return this.updateRunePage(fallback.id, payload)
      }
      throw err
    }
  }


  // ==================== 通知 ====================


  /**
   * 发送客户端原生通知（右下角弹窗）
   * @param title 通知标题
   * @param details 通知内容
   */
  sendNotification(title: string, details: string): Promise<unknown> {
    return post('/player-notifications/v1/notifications', {
      detailKey: 'pre_translated_details',
      titleKey: 'pre_translated_title',
      backgroundUrl: '',
      data: { title, details },
      iconUrl: '/lol-game-data/assets/v1/profile-icons/3867.jpg',// https://heimerdinger.lol/index.php/icon/sona-champie-icon-5s8jq
      source: 'sona',
      state: 'toast',
      type: 'string',
    })
  }

  // ==================== 客户端设置备份/恢复 ====================

  private async getPuuid(): Promise<string> {
    const session = await get<{ puuid: string }>('/lol-login/v1/session')
    if (!session.puuid) throw new Error('未获取到 PUUID')
    return session.puuid
  }

  private loadAllBackups(puuid: string): Record<string, GameSettingsBackup> {
    const allBackups = store.get('gameSettingsBackups')
    return allBackups[puuid] ?? {}
  }

  private saveAllBackups(puuid: string, data: Record<string, GameSettingsBackup>) {
    store.set('gameSettingsBackups', {
      ...store.get('gameSettingsBackups'),
      [puuid]: data,
    })
  }

  /** 获取常规游戏设置（画质、声音、HUD 等，对应 game.cfg） */
  getGameSettings(): Promise<unknown> {
    return get('/lol-game-settings/v1/game-settings')
  }

  /** 获取热键设置（对应 PersistedSettings.json 的热键部分） */
  getInputSettings(): Promise<unknown> {
    return get('/lol-game-settings/v1/input-settings')
  }

  /**
   * 创建命名备份（同时拉取常规设置 + 热键设置）
   * @param name 用户自定义的备份名称
   */
  async backupSettings(name: string): Promise<boolean> {
    try {
      const puuid = await this.getPuuid()
      const [general, input] = await Promise.all([
        this.getGameSettings(),
        this.getInputSettings(),
      ])
      const all = this.loadAllBackups(puuid)
      all[name] = { general, input, timestamp: Date.now() }
      this.saveAllBackups(puuid, all)
      return true
    } catch {
      return false
    }
  }

  /**
   * 恢复指定名称的备份并写入磁盘
   * @param name 备份名称
   */
  async restoreSettings(name: string): Promise<boolean> {
    try {
      const puuid = await this.getPuuid()
      const all = this.loadAllBackups(puuid)
      const backup = all[name]
      if (!backup) throw new Error(`备份 "${name}" 不存在`)

      // 第 1 步：恢复常规设置 (game-settings)
      if (backup.general) {
        await patch('/lol-game-settings/v1/game-settings', backup.general)
      }

      // 第 2 步：恢复热键设置 (input-settings)
      if (backup.input) {
        await patch('/lol-game-settings/v1/input-settings', backup.input)
      }

      // 第 3 步：强制写入磁盘
      await post('/lol-game-settings/v1/save')
      return true
    } catch {
      return false
    }
  }

  /**
   * 删除指定名称的备份
   * @param name 备份名称
   */
  async deleteBackup(name: string): Promise<boolean> {
    try {
      const puuid = await this.getPuuid()
      const all = this.loadAllBackups(puuid)
      if (!(name in all)) return false
      delete all[name]
      this.saveAllBackups(puuid, all)
      return true
    } catch {
      return false
    }
  }

  /**
   * 获取所有备份列表（按时间倒序）
   */
  async listBackups(): Promise<{ name: string; timestamp: number }[]> {
    try {
      const puuid = await this.getPuuid()
      const all = this.loadAllBackups(puuid)
      return Object.entries(all)
        .map(([name, data]) => ({ name, timestamp: data.timestamp ?? 0 }))
        .sort((a, b) => b.timestamp - a.timestamp)
    } catch {
      return []
    }
  }

  // ==================== WebSocket 事件 ====================

  private observeUriOnSocket(uri: string) {
    if (!this.penguContext) {
      console.warn('[LCUManager] PenguContext 未绑定，无法监听事件。请先调用 lcu.bindContext(context)')
      return
    }

    if (this.observedUris.has(uri)) {
      console.log('[LCUManager] URI 已订阅到底层 socket，跳过重复 observe: %s', uri)
      return
    }

    this.observedUris.add(uri)
    console.log('[LCUManager] 向当前 socket 订阅 URI: %s', uri)
    this.penguContext.socket.observe(uri, (data) => {
      console.log('[LCUManager] WS 收到事件 → uri=%s, data=%o', uri, data)
      const message = data as LCUEventMessage
      const cbs = this.eventListeners.get(uri)
      cbs?.forEach((cb) => cb(message))
    })
  }

  /**
   * 监听 LCU WebSocket 事件
   *
   * 基于 Pengu Loader 的 context.socket.observe 实现。
   * 支持同一 URI 注册多个回调。
   *
   * @param uri 事件 URI (e.g. '/lol-gameflow/v1/gameflow-phase')
   * @param callback 事件回调
   * @returns 取消监听的函数
   *
   * @example
   * ```ts
   * const unsubscribe = lcu.observe('/lol-gameflow/v1/gameflow-phase', (event) => {
   *   console.log('Phase changed:', event.data)
   * })
   *
   * // 稍后取消监听
   * unsubscribe()
   * ```
   */
  observe(uri: string, callback: EventCallback): () => void {
    console.log('[LCUManager] observe() called → uri=%s, hasContext=%s', uri, String(Boolean(this.penguContext)))
    console.log('[LCUManager] eventListeners has uri? %s, listeners count: %d', this.eventListeners.has(uri), this.eventListeners.get(uri)?.size ?? 0)

    let listeners = this.eventListeners.get(uri)
    if (!listeners) {
      listeners = new Set()
      this.eventListeners.set(uri, listeners)
    }

    listeners.add(callback)
    this.observeUriOnSocket(uri)

    // 返回取消监听函数
    return () => {
      const currentListeners = this.eventListeners.get(uri)
      currentListeners?.delete(callback)
      if (currentListeners && currentListeners.size === 0) {
        this.eventListeners.delete(uri)
      }
    }
  }


  /**
   * 断开所有 WebSocket 事件监听
   * 应在插件卸载时调用
   */
  disconnect() {
    if (this.penguContext) {
      this.penguContext.socket.disconnect()
    }
    this.eventListeners.clear()
    this.observedUris.clear()
  }

}

// ==================== 单例导出 ====================

/** LCU 管理器单例 */
export const lcu = new LCUManager()

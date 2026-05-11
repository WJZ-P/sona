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
  ChatFriend,
  SpectatorLaunchPayload,
  SummonerSpellData,
  ChampionSummaryData,
  GameQueue,
} from '@/types/lcu'
import { SGP_SERVERS } from '@/types/sgp'
import type { SgpEntitlementsToken } from '@/types/sgp'

// Re-export types for convenience
export type { SummonerInfo, LobbyConfig, Lobby, GameflowPhase, GameflowSession, LCUEventMessage, ChatConversation, ChatMessage, ChatMe, Availability, SendChatMessageBody, ReadyCheck, ChampSelectSession, ChampSelectPlayerDetail, MatchHistoryResponse, MatchDetail, ChatFriend, SpectatorLaunchPayload }
export type { SgpEntitlementsToken, SgpMatchHistoryLol } from '@/types/sgp'
export { SGP_SERVERS, TENCENT_MATCH_HISTORY_INTEROP, TENCENT_SERVER_NAMES, queueIdToTag } from '@/types/sgp'

export { LcuEventUri, QueueId } from '@/types/lcu'

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
 * - RU1 → RU
 * - NA → NA1 (命令行 --region 可能不含数字)
 *
 * 参考 LeagueAkari 的 region/rsoPlatformId 与 SGP_SERVERS 配置对比
 * @see resources/builtin-config/sgp/league-servers.json
 */
const PLATFORM_ID_TO_SGP_KEY: Record<string, string> = {
  // 外服 platformId 含数字后缀但 SGP_SERVERS key 不含
  EUW1: 'EUW',
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

  /** 设置当前召唤师头像 */
  setProfileIcon(profileIconId: number): Promise<unknown> {
    return put('/lol-summoner/v1/current-summoner/icon', { profileIconId })
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
   * 走客户端自己的 TeamBuilder 底层退房接口——这是从自定义房间抓包得到的
   * 真正被客户端调用的端点，比 LCDS 代理（`/lol-login/v1/session/invoke`）更干净：
   *   - 无需 URL encode args / 构造 LCDS 调用签名
   *   - 无需 body（纯 POST）
   *   - 路径本身就清晰表达了语义
   *
   * 注：这会吃逃跑惩罚（降低排位或禁止匹配一段时间），由调用方自行确认场景。
   */
  dodgeChampSelect(): Promise<unknown> {
    // 纯 POST，无 body
    return post('/lol-lobby-team-builder/champ-select/v1/session/quit')
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

  /** 获取当前可选的英雄 ID 列表 */
  getPickableChampionIds(): Promise<number[]> {
    return get<number[]>('/lol-champ-select/v1/pickable-champion-ids')
  }

  /** 获取当前可禁用的英雄 ID 列表 */
  getBannableChampionIds(): Promise<number[]> {
    return get<number[]>('/lol-champ-select/v1/bannable-champion-ids')
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
   * 3. 所有解析结果都必须命中 Akari 同款 `SGP_SERVERS` 配置，否则继续 fallback。
   *
   * 已知问题（对比 LeagueAkari）：
   * - LeagueAkari 从 LeagueClient.exe 命令行参数 `--region` / `--rso_platform_id` 获取，
   *   这是官方数据源，最可靠。但 Pengu Loader 插件无法访问命令行参数。
   * - 国服部分大区 issuer 不含 `k8s`（如联盟一区 NJ100），旧正则会匹配失败。
   * - 外服 issuer 子域名可能与 SGP_SERVERS key 不一致（如 EUW1 → EUW）。
   */
  async getSgpServerId(): Promise<string> {
    // Akari 以客户端启动参数为准；Pengu 内优先使用 ChatMe.platformId 近似它。
    const fromPlatformId = await this._parseSgpServerIdFromPlatformId()
    if (fromPlatformId) return fromPlatformId

    // Fallback: 从 issuer 解析。外服 issuer 有时是 euc1/apne1/usw2/apse1 这类路由集群，
    // 不是 SGP_SERVERS key；normalizeSgpServerKey 会过滤掉这些不受支持的结果。
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
  }): Promise<import('@/types/sgp').SgpMatchHistoryLol> {
    const token = this._entitlementsToken ?? await this.getEntitlementsToken()
    if (!this._entitlementsToken) {
      this._entitlementsToken = token
    }
    const sgpServerId = await this.getSgpServerId()
    const server = SGP_SERVERS[sgpServerId.toUpperCase()]
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

    const resp = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token.accessToken}`,
        'User-Agent': 'LeagueOfLegendsClient/14.13.596.7996 (rcp-be-lol-match-history)',
      },
    })

    if (!resp.ok) {
      const body = await resp.text().catch(() => '')
      throw new Error(`[SGP] 请求失败: ${resp.status} ${resp.statusText} ${body}`)
    }

    return resp.json()
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

  /** 创建或更新同名符文页，并设为当前使用页 */
  async applyRunePage(page: Omit<RunePagePayload, 'current'>): Promise<RunePage> {
    const payload: RunePagePayload = {
      ...page,
      current: true,
    }
    const pages = await this.getRunePages()
    const existing = pages.find((p) => p.name === page.name && p.isEditable !== false)
    if (existing) {
      return this.updateRunePage(existing.id, payload)
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

  private loadAllBackups(puuid: string): Record<string, { general?: unknown; input?: unknown; timestamp: number }> {
    const raw = localStorage.getItem(`sona_backups_${puuid}`)
    if (!raw) return {}
    try { return JSON.parse(raw) } catch { return {} }
  }

  private saveAllBackups(puuid: string, data: Record<string, unknown>) {
    localStorage.setItem(`sona_backups_${puuid}`, JSON.stringify(data))
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

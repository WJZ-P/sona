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
  ChatFriend,
  SummonerSpellData,
  ChampionSummaryData,
  GameQueue,
} from '@/types/lcu'

// Re-export types for convenience
export type { SummonerInfo, LobbyConfig, Lobby, GameflowPhase, GameflowSession, LCUEventMessage, ChatConversation, ChatMessage, ChatMe, Availability, SendChatMessageBody, ReadyCheck, ChampSelectPlayerDetail, MatchHistoryResponse, ChatFriend }

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

function patch<T = unknown>(endpoint: string, body?: unknown): Promise<T> {
  return request<T>(endpoint, {
    method: 'PATCH',
    body: body != null ? JSON.stringify(body) : undefined,
  })
}

function del<T = unknown>(endpoint: string): Promise<T> {
  return request<T>(endpoint, { method: 'DELETE' })
}

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


  // -------------------- 初始化 --------------------

  /**
   * 绑定 PenguContext，用于 WebSocket 事件监听
   * 应在 init(context) 生命周期中调用
   */
  bindContext(context: PenguContext) {
    this.penguContext = context

    // context / socket 变了，但已有业务回调仍然有效：
    // 这里只清空“底层 socket 已订阅 URI”状态，然后把现有回调重新挂到新 socket 上。
    const uris = Array.from(this.eventListeners.keys())
    this.observedUris.clear()

    console.log('[LCUManager] bindContext() → replay %d observed uri(s)', uris.length)
    uris.forEach((uri) => this.observeUriOnSocket(uri))
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
        .flat()
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
        .flat()
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
   * @throws 如果当前不在选人阶段（找不到 championSelect 会话）
   */
  async sendChampSelectMessage(message: string): Promise<ChatMessage> {
    const conversation = await this.getChampSelectConversation()
    if (!conversation) {
      throw new Error('[LCU] 当前不在英雄选择阶段，找不到 championSelect 会话')
    }
    return this.sendChatMessage(conversation.id, message)
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
  getMatchDetail(gameId: number): Promise<unknown> {
    return get(`/lol-match-history/v1/games/${gameId}`)
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

  /** 获取所有物品数据（含 iconPath） */
  getItems(): Promise<Array<{ id: number; iconPath: string; name: string }>> {
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

  /** 获取所有符文数据（含 iconPath，对应单个符文 ID） */
  getPerks(): Promise<Array<{ id: number; iconPath: string; name: string }>> {
    return get('/lol-game-data/assets/v1/perks.json')
  }

  /** 获取所有符文系样式（对应 perkPrimaryStyle / perkSubStyle） */
  getPerkStyles(): Promise<{ styles: Array<{ id: number; iconPath: string; name: string }> }> {
    return get('/lol-game-data/assets/v1/perkstyles.json')
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

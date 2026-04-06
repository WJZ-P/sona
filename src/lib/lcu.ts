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
  ChatConversation,
  ChatMessage,
  ChatMe,
  Availability,
  SendChatMessageBody,
  QueueId,
  LCUEventMessage,
} from '@/types/lcu'

// Re-export types for convenience
export type { SummonerInfo, LobbyConfig, Lobby, GameflowPhase, GameflowSession, LCUEventMessage, ChatConversation, ChatMessage, ChatMe, Availability, SendChatMessageBody, ReadyCheck }
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
  private penguContext: PenguContext | null = null

  // -------------------- 初始化 --------------------

  /**
   * 绑定 PenguContext，用于 WebSocket 事件监听
   * 应在 init(context) 生命周期中调用
   */
  bindContext(context: PenguContext) {
    this.penguContext = context
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
   * 修改自己的选人信息（皮肤、召唤师技能等）
   * @param selection 选择参数
   */
  updateMySelection(selection: { selectedSkinId?: number; spell1Id?: number; spell2Id?: number; wardSkinId?: number }): Promise<unknown> {
    return patch('/lol-champ-select/v1/session/my-selection', selection)
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

  /** 获取所有可用队列 */
  getQueues(): Promise<unknown[]> {
    return get<unknown[]>('/lol-game-queues/v1/queues')
  }

  /** 获取当前游戏模式信息 */
  getCurrentGamemode(): Promise<unknown> {
    return get('/lol-lobby/v1/parties/gamemode')
  }

  // ==================== WebSocket 事件 ====================

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
    if (!this.penguContext) {
      console.warn('[LCUManager] PenguContext 未绑定，无法监听事件。请先调用 lcu.bindContext(context)')
      return () => {}
    }

    let listeners = this.eventListeners.get(uri)
    if (!listeners) {
      listeners = new Set()
      this.eventListeners.set(uri, listeners)

      // 首次注册此 URI 时，通过 Pengu 的 socket 订阅
      this.penguContext.socket.observe(uri, (data) => {
        const message = data as LCUEventMessage
        const cbs = this.eventListeners.get(uri)
        cbs?.forEach((cb) => cb(message))
      })
    }

    listeners.add(callback)

    // 返回取消监听函数
    return () => {
      listeners!.delete(callback)
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
  }
}

// ==================== 单例导出 ====================

/** LCU 管理器单例 */
export const lcu = new LCUManager()

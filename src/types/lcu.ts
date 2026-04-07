/**
 * LCU (League Client Update) 接口类型定义
 *
 * 基于 LCU Swagger 定义 (客户端版本 26.05) 和 LeagueAkari 类型定义校验
 * @see https://lcu.kebs.dev/swagger.html
 */

// ==================== 召唤师相关 ====================

/** ARAM 重随点数 */
export interface RerollPoints {
  currentPoints: number
  maxRolls: number
  numberOfRolls: number
  pointsCostToRoll: number
  pointsToReroll: number
}

/** 当前召唤师信息 — GET /lol-summoner/v1/current-summoner */
export interface SummonerInfo {
  accountId: number
  displayName: string
  gameName: string
  tagLine: string
  internalName: string
  nameChangeFlag: boolean
  percentCompleteForNextLevel: number
  privacy: 'PUBLIC' | 'PRIVATE' | (string & {})
  profileIconId: number
  puuid: string
  rerollPoints: RerollPoints
  summonerId: number
  summonerLevel: number
  unnamed: boolean
  xpSinceLastLevel: number
  xpUntilNextLevel: number
}

// ==================== 房间/大厅相关 ====================

/** 房间配置（用于 POST /lol-lobby/v2/lobby 创建房间） */
export interface LobbyConfig {
  queueId?: number
  gameConfig?: {
    gameMode: string
    mapId: number
    gameType?: string
  }
  customGameLobby?: {
    configuration: {
      gameMode: string
      gameMutator: string
      gameServerRegion: string
      mapId: number
      mutators: { id: number }
      spectatorPolicy: string
      teamSize: number
    }
    lobbyName: string
    lobbyPassword: string
  }
  isCustom?: boolean
}

/** 房间游戏配置 — GET /lol-lobby/v2/lobby 中的 gameConfig 字段 */
export interface LobbyGameConfig {
  allowablePremadeSizes: number[]
  customLobbyName: string
  customMutatorName: string
  customSpectatorPolicy: string
  customSpectators: unknown[]
  customTeam100: unknown[]
  customTeam200: unknown[]
  gameMode: string
  isCustom: boolean
  isLobbyFull: boolean
  isTeamBuilderManaged: boolean
  mapId: number
  maxHumanPlayers: number
  maxLobbySize: number
  maxTeamSize: number
  pickType: string
  premadeSizeAllowed: boolean
  queueId: number
  shouldForceScarcePositionSelection: boolean
  showPositionSelector: boolean
  showQuickPlaySlotSelection: boolean
}

/** 房间信息 — GET /lol-lobby/v2/lobby */
export interface Lobby {
  canStartActivity: boolean
  gameConfig: LobbyGameConfig
  invitations: LobbyInvitation[]
  localMember: LobbyMember
  members: LobbyMember[]
  mucJwtDto: {
    channelClaim: string
    domain: string
    jwt: string
    targetRegion: string
  }
  multiUserChatId: string
  multiUserChatPassword: string
  partyId: string
  partyType: string
  restrictions: unknown[]
  scarcePositions: string[]
  warnings: unknown[]
}

/** 房间邀请 */
export interface LobbyInvitation {
  invitationId: string
  invitationType: string
  state: string
  timestamp: string
  toSummonerId: number
  toSummonerName: string
}

/** 房间成员 — GET /lol-lobby/v2/lobby/members */
export interface LobbyMember {
  allowedChangeActivity: boolean
  allowedInviteOthers: boolean
  allowedKickOthers: boolean
  allowedStartActivity: boolean
  allowedToggleInvite: boolean
  autoFillEligible: boolean
  autoFillProtectedForPromos: boolean
  autoFillProtectedForSoloing: boolean
  autoFillProtectedForStreaking: boolean
  botChampionId: number
  botDifficulty: string
  botId: string
  firstPositionPreference: string
  intraSubteamPosition: number
  isBot: boolean
  isLeader: boolean
  isSpectator: boolean
  puuid: string
  ready: boolean
  secondPositionPreference: string
  showGhostedBanner: boolean
  subteamIndex: number
  summonerIconId: number
  summonerId: number
  summonerInternalName: string
  summonerLevel: number
  summonerName: string
  teamId: number
}

// ==================== 匹配相关 ====================

/** 匹配搜索状态 */
export type MatchSearchState = 'Invalid' | 'AbandonedLowPriorityQueue' | 'Canceled' | 'Searching' | 'Found' | 'Error'

/** Dodge（逃跑）数据 */
export interface DodgeData {
  dodgerId: number
  state: string
}

/** 低优先权惩罚数据 */
export interface LowPriorityData {
  bustedLeaverAccessToken: string
  penalizedSummonerIds: number[]
  penaltyTime: number
  penaltyTimeRemaining: number
  reason: string
}

/** 匹配搜索状态详情 — GET /lol-matchmaking/v1/search */
export interface MatchSearchResult {
  dodgeData: DodgeData
  errors: unknown[]
  estimatedQueueTime: number
  isCurrentlyInQueue: boolean
  lobbyId: string
  lowPriorityData: LowPriorityData
  queueId: number
  readyCheck: ReadyCheck
  searchState: MatchSearchState
  timeInQueue: number
}

/** Ready Check（匹配准备确认）状态 — GET /lol-matchmaking/v1/ready-check */
export interface ReadyCheck {
  declinerIds: number[]
  dodgeWarning: string
  playerResponse: 'None' | 'Accepted' | 'Declined'
  state: 'Invalid' | 'InProgress' | 'EveryoneReady' | 'StrangerNotReady' | 'PartyNotReady'
  suppressUx: boolean
  timer: number
}

// ==================== 游戏流程相关 ====================

/** 游戏流程阶段 — GET /lol-gameflow/v1/gameflow-phase */
export type GameflowPhase =
  | 'None'
  | 'Lobby'
  | 'Matchmaking'
  | 'ReadyCheck'
  | 'ChampSelect'
  | 'GameStart'
  | 'InProgress'
  | 'Reconnect'
  | 'WaitingForStats'
  | 'PreEndOfGame'
  | 'EndOfGame'
  | 'WatchInProgress'
  | 'TerminatedInError'

/** 游戏客户端连接信息 */
export interface GameClient {
  running: boolean
  visible: boolean
  serverIp: string
  serverPort: number
  observerServerIp: string
  observerServerPort: number
}

/** 游戏流程会话 — GET /lol-gameflow/v1/session */
export interface GameflowSession {
  phase: GameflowPhase
  gameClient: GameClient
  gameData: {
    gameId: number
    isCustomGame: boolean
    queue: {
      id: number
      type: string
      gameMode: string
      name: string
    }
    teamOne: GameflowTeamPlayer[]
    teamTwo: GameflowTeamPlayer[]
    playerChampionSelections: PlayerChampionSelection[]
  }
  gameDodge: {
    dodgeIds: number[]
    phase: string
    state: string
  }
  map: {
    id: number
    name: string
    assets: Record<string, string>
  }
}

/** 游戏流程中的队伍玩家 */
export interface GameflowTeamPlayer {
  championId: number
  puuid: string
  selectedPosition: string
  selectedRole: string
  summonerId: number
  summonerName: string
}

/** 玩家英雄选择信息 */
export interface PlayerChampionSelection {
  championId: number
  selectedSkinIndex: number
  spell1Id: number
  spell2Id: number
  summonerInternalName: string
}

// ==================== 英雄选择相关 ====================

/** 英雄选择会话 — GET /lol-champ-select/v1/session */
export interface ChampSelectSession {
  actions: ChampSelectAction[][]
  allowBattleBoost: boolean
  allowDuplicatePicks: boolean
  allowRerolling: boolean
  allowSkinSelection: boolean
  benchChampions: BenchChampion[] // ARAM 模式，共享池中的英雄
  benchEnabled: boolean
  gameId: number
  localPlayerCellId: number
  myTeam: ChampSelectPlayer[]
  theirTeam: ChampSelectPlayer[]
  timer: {
    adjustedTimeLeftInPhase: number
    internalNowInEpochMs: number
    phase: 'PLANNING' | 'BAN_PICK' | 'FINALIZATION' | 'GAME_STARTING' | (string & {})
    totalTimeInPhase: number
  }
  trades: ChampSelectTrade[]
  bans: {
    myTeamBans: number[]
    theirTeamBans: number[]
    numBans: number
  }
  skipChampionSelect: boolean
}

/** 替补席英雄（ARAM 模式） */
export interface BenchChampion {
  championId: number
  isPriority: boolean
}

/** 英雄交易状态 */
export interface ChampSelectTrade {
  cellId: number
  id: number
  state: 'INVALID' | 'AVAILABLE' | 'BUSY' | 'RECEIVED' | 'SENT' | (string & {})
}

/** 英雄选择操作 */
export interface ChampSelectAction {
  actorCellId: number
  championId: number
  completed: boolean
  id: number
  isInProgress: boolean
  type: 'pick' | 'ban' | 'ten_bans_reveal' | (string & {})
}

/** 英雄选择中的玩家 */
export interface ChampSelectPlayer {
  assignedPosition: string
  cellId: number
  championId: number
  championPickIntent: number
  selectedSkinId: number
  spell1Id: number
  spell2Id: number
  summonerId: number
  team: number
}

/** 选人阶段玩家详细信息（组合查询结果） */
export interface ChampSelectPlayerDetail {
  summonerId: number
  championId: number
  assignedPosition: string
  gameName: string
  tagLine: string
  summonerLevel: number
  puuid: string
  profileIconId: number
  ranked: unknown
  recentMatches: unknown
}

// ==================== 队列相关 ====================

/** 常用队列ID */
export enum QueueId {
  /** 云顶之弈 (普通) */
  TFT_NORMAL = 1090,
  /** 云顶之弈 (排位) */
  TFT_RANKED = 1100,
  /** 云顶之弈 (超级激斗) */
  TFT_HYPER_ROLL = 1130,
  /** 云顶之弈 (双人作战) */
  TFT_DOUBLE_UP = 1160,
  /** 单/双排位 */
  RANKED_SOLO = 420,
  /** 灵活排位 */
  RANKED_FLEX = 440,
  /** 匹配模式 */
  NORMAL_BLIND = 430,
  /** 征召模式 */
  NORMAL_DRAFT = 400,
  /** 极地大乱斗 */
  ARAM = 450,
}

// ==================== WebSocket 事件相关 ====================

/** LCU WebSocket 事件消息 */
export interface LCUEventMessage {
  uri: string
  eventType: 'Create' | 'Update' | 'Delete'
  data: unknown
}

/** 常用 LCU 事件 URI */
export enum LcuEventUri {
  /** 匹配准备就绪（接受/拒绝） */
  READY_CHECK = '/lol-matchmaking/v1/ready-check',
  /** 游戏流程阶段 */
  GAMEFLOW_PHASE = '/lol-gameflow/v1/session',
  /** 英雄选择阶段 */
  CHAMP_SELECT = '/lol-champ-select/v1/session',
  /** TFT 战斗通行证更新（可用于检测对局结束） */
  TFT_BATTLE_PASS = '/lol-tft-pass/v1/battle-pass',
  /** 游戏流程阶段变化（仅 phase 字符串） */
  GAMEFLOW_PHASE_CHANGE = '/lol-gameflow/v1/gameflow-phase',
  /** 大厅/房间状态 */
  LOBBY = '/lol-lobby/v2/lobby',
}

// ==================== 聊天相关 ====================

/** 聊天对话 — GET /lol-chat/v1/conversations */
export interface ChatConversation {
  gameName: string
  gameTag: string
  id: string
  inviterId: string
  isMuted: boolean
  lastMessage: unknown
  multiUserChatJWT: string
  name: string
  password: string
  pid: string
  targetRegion: string
  type: 'chat' | 'customGame' | 'championSelect' | 'postGame' | (string & {})
  unreadMessageCount: number
}

/** 聊天消息 — GET/POST /lol-chat/v1/conversations/{id}/messages */
export interface ChatMessage {
  body: string
  fromId: string
  fromObfuscatedSummonerId: number
  fromPid: string
  fromSummonerId: number
  id: string
  isHistorical: boolean
  timestamp: string
  type: 'chat' | 'celebration' | 'system' | (string & {})
}

/** 发送聊天消息的请求体 */
export interface SendChatMessageBody {
  body: string
  type?: 'chat' | 'celebration' | (string & {})
}

/** 玩家在线状态 */
export type Availability = 'chat' | 'away' | 'dnd' | 'offline' | 'mobile' | (string & {})

/** 当前用户聊天状态 — GET /lol-chat/v1/me */
export interface ChatMe {
  availability: Availability
  gameName: string
  gameTag: string
  icon: number
  id: string
  lol: Record<string, string>
  name: string
  obfuscatedSummonerId: number
  patchline: string
  pid: string
  platformId: string
  product: string
  productName: string
  puuid: string
  statusMessage: string
  summary: string
  summonerId: number
}

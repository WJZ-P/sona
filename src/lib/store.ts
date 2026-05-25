/**
 * Sona 插件配置管理
 *
 * 基于 Pengu Loader 的 DataStore API 实现持久化存储。
 * 所有配置项集中管理，带类型安全和默认值。
 *
 * 使用方式：
 * ```ts
 * import { store } from '@/lib/store'
 *
 * // 读取
 * const value = store.get('autoAcceptMatch')
 *
 * // 写入（自动持久化）
 * store.set('autoAcceptMatch', true)
 *
 * // 监听变化
 * store.onChange('autoAcceptMatch', (value) => { ... })
 * ```
 */

// ==================== 配置项定义 ====================

/** 所有配置项及其类型 */
export interface SonaConfig {
  /** 自动接受对局 */
  autoAcceptMatch: boolean
  /** 自动接受对局的随机延迟：最小值（毫秒），0 或非法值视为无延迟 */
  autoAcceptDelayMin: number
  /** 自动接受对局的随机延迟：最大值（毫秒），上限 15000；非法则秒接 */
  autoAcceptDelayMax: number
  /** 开发者模式 */
  developerMode: boolean
  /** 解锁自定义签名 */
  unlockStatus: boolean
  /** 解锁在线状态切换（接管客户端状态按钮，支持"隐身/手机在线"等） */
  unlockAvailability: boolean
  /** 大乱斗无CD换英雄 */
  benchNoCooldown: boolean
  /** 侧边栏收缩状态 */
  sidebarCollapsed: boolean
  /** 在线状态 */
  availability: string
  /** 自定义签名（按 puuid 独立存储，切换账号互不影响） */
  statusMessage: Record<string, string>
  /** 面板快捷键 */
  hotkey: string
  /** 界面语言：auto=跟随客户端 html lang */
  locale: 'auto' | 'zh-CN' | 'en-US'
  /** 窗口视觉特效 */
  windowEffect: string
  /** 英雄选择玩家头像交互（点击队友头像展示历史数据） */
  champSelectAssist: boolean
  /** OP.GG 配装推荐（接管选好英雄后的技能预览面板点击） */
  opggBuildRecommendation: boolean
  /** 智能配装（后续扩展符文、召唤师技能持久化） */
  smartBuildRecommendation: boolean
  /** 智能符文：按英雄与模式保存的用户符文页 */
  smartRunePages: Record<string, {
    primaryStyleId: number
    subStyleId: number
    selectedPerkIds: number[]
    updatedAt: number
  }>
  /** 智能召唤师技能：按英雄与模式保存的技能组合 */
  smartSummonerSpells: Record<string, {
    spell1Id: number
    spell2Id: number
    updatedAt: number
  }>
  /** 游戏设置备份：按 puuid 保存多个命名备份 */
  gameSettingsBackups: Record<string, Record<string, {
    general?: unknown
    input?: unknown
    timestamp: number
  }>>
  /** OP.GG 配装推荐段位过滤 */
  opggBuildRecommendationTier: string
  /** 分析友方战力（进入选人自动查战绩并发送到聊天框） */
  analyzeTeamPower: boolean
  /** 分析友方战力消息类型: chat=队友可见, celebration=仅自己可见 */
  analyzeTeamPowerMsgType: string
  /** 战绩查询局数（20/50/100），默认50 */
  analyzeTeamPowerFetchCount: number
  /** 队友战绩分析展示风格：legacy=老版幽默评价，strength=新版综合评分 */
  analyzeTeamPowerDisplayMode: 'legacy' | 'strength'  
  /** 英雄选择增强查询局数（20/50/100），默认50 */
  champSelectAssistFetchCount: number
  /** 全局战力分析查询局数（20/50/100），默认50 */
  gameAnalysisFetchCount: number
  /** 选人阶段红蓝方提示（进入英雄选择时在聊天框提示当前阵营） */
  sideIndicator: boolean
  /** 红蓝方提示消息类型: chat=队友可见, celebration=仅自己可见 */
  sideIndicatorMsgType: string
  /** 全局粒子美化效果 */
  globalParticle: boolean
  /** 壁纸模式：隐藏主页活动中心，并清空右侧栏背景 */
  beautifyWallpaperMode: boolean
  /** 主页背景图片：assets 目录下的相对路径 */
  beautifyHomepageBackgroundAssetPath: string | null
  /** 主页壁纸资源：从美化资源区复制引用的 assets 相对路径列表 */
  beautifyHomepageBackgroundAssetPaths: string[]
  /** 主页壁纸随机启动：每次启动客户端随机应用一张壁纸 */
  beautifyHomepageBackgroundRandom: boolean
  /** 上一次随机应用的主页壁纸资源路径，用于避免连续重复 */
  beautifyHomepageBackgroundLastRandomAssetPath: string | null
  /** 主页壁纸取景参数：key 为 assets 相对路径 */
  beautifyHomepageBackgroundAdjustments: Record<string, {
    scale: number
    offsetX: number
    offsetY: number
  }>
  /** 主页壁纸毛玻璃模糊强度（px） */
  beautifyHomepageBackgroundBlur: number
  /** 主页壁纸底色不透明度（0-100） */
  beautifyHomepageBackgroundOpacity: number
  /** 美化毛玻璃模糊强度（px） */
  beautifyGlassBlur: number
  /** 美化毛玻璃背景不透明度（0-100） */
  beautifyGlassOpacity: number
  /** 美化资源：用户手动录入的 assets 相对路径列表 */
  beautifyAssetPaths: string[]
  /** 自定义头像开关 */
  customAvatarMode: boolean
  /** 自定义头像资源：从美化资源区复制引用的 assets 相对路径列表 */
  customAvatarAssetPaths: string[]
  /** 当前应用的自定义头像资源路径 */
  customAvatarActiveAssetPath: string | null
  /** 自定义头像取景参数：key 为 assets 相对路径 */
  customAvatarAdjustments: Record<string, {
    scale: number
    offsetX: number
    offsetY: number
  }>
  /** 好友可见自定义头像缓存：key 为 PUUID，value 为远端图片直链 */
  customAvatarRemoteCache: Record<string, string>
  /** 好友智能分组（开黑好友用同样颜色的border-right展示） */
  friendSmartGroup: boolean
  /** 增强游戏中好友状态（显示模式、英雄和实时对局时长） */
  enhancedFriendGameStatus: boolean
  /** 组队界面增强（点击成员头像查看战绩，并显示近期表现） */
  lobbyEnhancement: boolean
  /** 组队界面增强查询局数（20/50/100），默认50 */
  lobbyEnhancementFetchCount: number
  /** 自定义生涯背景 */
  customProfileBg: boolean
  /** 无视他人生涯隐私（XHR 响应改写，需重启生效） */
  ignoreProfilePrivacy: boolean
  /** 自定义挑战旗帜 */
  customBanner: boolean
  /** 自定义挑战旗帜选择（仅本地显示） */
  customBannerSelection: {
    id: string
    name: string
    assetPath: string
    bannerType: string
    bannerRank: string
  } | null
  /** 隐藏客户端云顶之弈入口 */
  hideTFT: boolean
  /** 玩家对战模式过滤勾选条（开关） */
  gameModeFilter: boolean
  /** 隐藏的玩家对战游戏模式（key 为 data-game-mode 值，true 表示隐藏） */
  hiddenGameModes: Record<string, boolean>
  /** 隐藏主页右侧导航栏文字（仅保留图标） */
  hideRightNavText: boolean
  /** 对局结束自动点赞 */
  autoHonor: boolean
  /** 段位伪装开关 */
  rankDisguise: boolean
  /** 伪装队列 */
  rankQueue: string
  /** 伪装段位 */
  rankTier: string
  /** 段位伪装子段位 */
  rankDivision: string
  /** 秒抢英雄开关 */
  autoLockChampion: boolean
  /** 秒抢目标英雄优先级队列 */
  autoLockChampionIds: number[]
  /** 秒抢时是否直接锁定（false 则只选择不锁定） */
  autoLockInstant: boolean
  /** 自动禁用英雄开关 */
  autoBanChampion: boolean
  /** 自动禁用目标英雄优先级队列 */
  autoBanChampionIds: number[]
  /** 平衡性调整 buff 提示（游玩特定模式时悬停头像显示数值调整） */
  balanceBuffTooltip: boolean
  /** 国服解锁炫彩分页（生涯藏品页显示"炫彩"tab，需重启客户端） */
  unlockChromas: boolean
  /** 选人阶段退出按钮（非自定义对局的英雄选择里补上"退出对局"按钮） */
  champSelectQuitButton: boolean
  /** 进入游戏后自动弹窗显示全局战力分析 */
  gameAnalysisPopup: boolean
  /** 对局结束后自动返回房间 */
  autoReturnToLobby: boolean
  /** 自动返回模式: queue=自动排队, lobby=仅返回房间 */
  autoReturnMode: string
}



/** 配置项默认值 */
const DEFAULT_CONFIG: SonaConfig = {
  autoAcceptMatch: false,
  autoAcceptDelayMin: 0,
  autoAcceptDelayMax: 0,
  developerMode: false,
  unlockStatus: true,
  unlockAvailability: false,
  benchNoCooldown: false,
  sidebarCollapsed: false,
  availability: 'chat',
  statusMessage: {},
  hotkey: 'F1',
  locale: 'auto',
  windowEffect: 'none',
  champSelectAssist: false,
  opggBuildRecommendation: false,
  smartBuildRecommendation: true,
  smartRunePages: {},
  smartSummonerSpells: {},
  gameSettingsBackups: {},
  opggBuildRecommendationTier: 'emerald_plus',
  analyzeTeamPower: false,
  analyzeTeamPowerMsgType: 'celebration',
  analyzeTeamPowerFetchCount: 50,
  analyzeTeamPowerDisplayMode: 'legacy',
  champSelectAssistFetchCount: 50,
  gameAnalysisFetchCount: 50,
  sideIndicator: false,
  sideIndicatorMsgType: 'celebration',
  globalParticle: false,
  beautifyWallpaperMode: false,
  beautifyHomepageBackgroundAssetPath: null,
  beautifyHomepageBackgroundAssetPaths: [],
  beautifyHomepageBackgroundRandom: false,
  beautifyHomepageBackgroundLastRandomAssetPath: null,
  beautifyHomepageBackgroundAdjustments: {},
  beautifyHomepageBackgroundBlur: 0,
  beautifyHomepageBackgroundOpacity: 0,
  beautifyGlassBlur: 14,
  beautifyGlassOpacity: 28,
  beautifyAssetPaths: [],
  customAvatarMode: false,
  customAvatarAssetPaths: [],
  customAvatarActiveAssetPath: null,
  customAvatarAdjustments: {},
  customAvatarRemoteCache: {},
  friendSmartGroup: false,
  enhancedFriendGameStatus: true,
  lobbyEnhancement: true,
  lobbyEnhancementFetchCount: 50,
  hideTFT: false,
  gameModeFilter: true,
  hiddenGameModes: {},
  hideRightNavText: false,
  customProfileBg: false,
  ignoreProfilePrivacy: true,
  customBanner: false,
  customBannerSelection: null,
  autoHonor: false,
  rankDisguise: false,
  rankQueue: 'RANKED_SOLO_5x5',
  rankTier: 'CHALLENGER',
  rankDivision: 'I',
  autoLockChampion: false,
  autoLockChampionIds: [],
  autoLockInstant: true,
  autoBanChampion: false,
  autoBanChampionIds: [],
  balanceBuffTooltip: false,
  unlockChromas: true,
  champSelectQuitButton: false,
  gameAnalysisPopup: false,
  autoReturnToLobby: false,
  autoReturnMode: 'queue',
}



// ==================== Store 实现 ====================

/** DataStore 键前缀，避免与其他插件冲突 */
const KEY_PREFIX = 'sona:'

type ConfigKey = keyof SonaConfig
type ChangeListener<K extends ConfigKey = ConfigKey> = (value: SonaConfig[K], key: K) => void

class SonaStore {
  private listeners = new Map<ConfigKey, Set<ChangeListener>>()
  private cache: SonaConfig

  constructor() {
    // 启动时把所有配置加载到内存缓存中
    const loaded = { ...DEFAULT_CONFIG }
    for (const key of Object.keys(DEFAULT_CONFIG) as ConfigKey[]) {
      (loaded as Record<string, unknown>)[key] = this.readFromDisk(key)
    }
    this.cache = loaded
  }

  /**
   * 获取配置值
   */
  get<K extends ConfigKey>(key: K): SonaConfig[K] {
    return this.cache[key]
  }

  /**
   * 设置配置值（自动持久化 + 触发监听）
   */
  set<K extends ConfigKey>(key: K, value: SonaConfig[K]) {
    const old = this.cache[key]
    if (old === value) return

    this.cache[key] = value
    DataStore.set(`${KEY_PREFIX}${key}`, value)

    // 触发变化监听
    const keyListeners = this.listeners.get(key)
    if (keyListeners) {
      keyListeners.forEach((fn) => {
        try {
          (fn as ChangeListener<K>)(value, key)
        } catch {
          // ignore listener errors
        }
      })
    }
  }

  /**
   * 切换布尔值配置
   */
  toggle<K extends ConfigKey>(key: K): SonaConfig[K] {
    const current = this.get(key)
    if (typeof current !== 'boolean') return current
    const next = !current as SonaConfig[K]
    this.set(key, next)
    return next
  }

  /**
   * 监听配置变化
   * @returns 取消监听的函数
   */
  onChange<K extends ConfigKey>(key: K, fn: ChangeListener<K>): () => void {
    let keyListeners = this.listeners.get(key)
    if (!keyListeners) {
      keyListeners = new Set()
      this.listeners.set(key, keyListeners)
    }
    keyListeners.add(fn as ChangeListener)

    return () => {
      keyListeners!.delete(fn as ChangeListener)
    }
  }

  /**
   * 重置所有配置为默认值
   */
  resetAll() {
    for (const key of Object.keys(DEFAULT_CONFIG) as ConfigKey[]) {
      this.set(key, DEFAULT_CONFIG[key])
    }
  }

  /**
   * 重置单个配置为默认值
   */
  reset<K extends ConfigKey>(key: K) {
    this.set(key, DEFAULT_CONFIG[key])
  }

  /**
   * 获取所有配置的快照
   */
  getAll(): SonaConfig {
    const result = { ...DEFAULT_CONFIG }
    for (const key of Object.keys(DEFAULT_CONFIG) as ConfigKey[]) {
      result[key] = this.get(key) as never
    }
    return result
  }

  // ---- 内部方法 ----

  private readFromDisk<K extends ConfigKey>(key: K): SonaConfig[K] {
    const stored = DataStore.get<SonaConfig[K]>(`${KEY_PREFIX}${key}`)
    return stored !== undefined ? stored : DEFAULT_CONFIG[key]
  }
}

// ==================== 单例导出 ====================

/** Sona 配置管理器单例 */
export const store = new SonaStore()

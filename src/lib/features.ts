/**
 * 功能管理模块
 *
 * 监听 store 配置变化，自动开启/关闭对应的插件功能。
 * 在 index.tsx 的 load() 中调用 initFeatures() 即可。
 */

import { logger } from '@/index'
import { store } from '@/lib/store'
import { lcu, LcuEventUri } from '@/lib/lcu'
import type { LCUEventMessage, GameflowPhase } from '@/lib/lcu'
import { injector } from '@/lib/InjectorManager'
import { sleep } from '@/lib/utils'

// ==================== 自动接受对局 ====================

let autoAcceptUnsub: (() => void) | null = null

function updateAutoAccept(enabled: boolean) {
  if (enabled && !autoAcceptUnsub) {
    autoAcceptUnsub = lcu.observe(LcuEventUri.GAMEFLOW_PHASE_CHANGE, (event: LCUEventMessage) => {
      const phase = event.data as GameflowPhase
      if (phase === 'ReadyCheck') {
        lcu.acceptMatch()
          .then(() => logger.info('Auto accepted match ✓'))
          .catch((err) => logger.error('Auto accept failed:', err))
      }
    })
    logger.info('Auto accept enabled ✓')
  } else if (!enabled && autoAcceptUnsub) {
    autoAcceptUnsub()
    autoAcceptUnsub = null
    logger.info('Auto accept disabled')
  }
}

// ==================== 调试：Gameflow 阶段日志 ====================

let debugGameflowUnsub: (() => void) | null = null

const PHASE_LABELS: Partial<Record<GameflowPhase, string>> = {
  ReadyCheck: '匹配确认',
  ChampSelect: '英雄选择',
  GameStart: '游戏启动',
  InProgress: '对局进行中',
  Reconnect: '重新连接',
  WaitingForStats: '等待结算',
  PreEndOfGame: '结算准备',
  EndOfGame: '对局结束',
}

function updateDebugGameflow(enabled: boolean) {
  if (enabled && !debugGameflowUnsub) {
    debugGameflowUnsub = lcu.observe(LcuEventUri.GAMEFLOW_PHASE_CHANGE, (event: LCUEventMessage) => {
      const phase = event.data as GameflowPhase
      const label = PHASE_LABELS[phase]

      logger.info('Gameflow phase → %s%s', phase, label ? ` (${label})` : '')

      if (!label) return

      lcu.getGameflowSession()
        .then((session) => {
          logger.info('=== %s ===', label)
          logger.info('游戏模式: %s | 队列: %s (ID: %d)', session.gameData.queue.gameMode, session.gameData.queue.name, session.gameData.queue.id)
          logger.info('对局 ID: %d | 自定义: %s', session.gameData.gameId, session.gameData.isCustomGame)
          logger.info('地图: %s (ID: %d)', session.map.name, session.map.id)
          logger.info('我方队伍:', session.gameData.teamOne)
          logger.info('对方队伍:', session.gameData.teamTwo)
          if (phase === 'InProgress') {
            logger.info('游戏客户端: running=%s, server=%s:%d', session.gameClient.running, session.gameClient.serverIp, session.gameClient.serverPort)
          }
          logger.info('完整 session: %o', session)

          // 英雄选择阶段：拉取 champ select session 打印队友信息
          if (phase === 'ChampSelect') {
            lcu.getChampSelectSession()
              .then((champSelect) => {
                logger.info('--- 英雄选择详情 ---')
                logger.info('本地玩家 cellId: %d', champSelect.localPlayerCellId)
                champSelect.myTeam.forEach((p, i) => {
                  logger.info('我方 #%d → summonerId: %d, championId: %d, cellId: %d, position: %s', i + 1, p.summonerId, p.championId, p.cellId, p.assignedPosition || '无')
                })
                champSelect.theirTeam.forEach((p, i) => {
                  logger.info('对方 #%d → summonerId: %d, championId: %d, cellId: %d, position: %s', i + 1, p.summonerId, p.championId, p.cellId, p.assignedPosition || '无')
                })
                logger.info('完整 champSelect: %o', champSelect)
              })
              .catch((err) => logger.error('获取英雄选择详情失败:', err))
          }
        })
        .catch((err) => logger.error('获取 %s 对局信息失败:', label, err))
    })
    logger.info('Debug gameflow logging enabled ✓')
  } else if (!enabled && debugGameflowUnsub) {
    debugGameflowUnsub()
    debugGameflowUnsub = null
    logger.info('Debug gameflow logging disabled')
  }
}

// ==================== 解锁自定义签名 ====================

function tryUnlockStatusInput(): boolean {
  const statusEl = document.querySelector('.lower-details .status.disabled')
  if (!statusEl) return true

  statusEl.classList.remove('disabled')
  logger.info('Status input unlocked ✓')
  return true
}

let statusUnlockRegistered = false

function updateUnlockStatus(enabled: boolean) {
  if (enabled && !statusUnlockRegistered) {
    injector.register(tryUnlockStatusInput)
    statusUnlockRegistered = true
    logger.info('Unlock status enabled ✓')
  } else if (!enabled && statusUnlockRegistered) {
    injector.unregister(tryUnlockStatusInput)
    statusUnlockRegistered = false
    logger.info('Unlock status disabled')
  }
}

// ==================== 大乱斗无CD换英雄 ====================

const BENCH_HIJACK_ATTR = 'data-sona-bench-hijacked'

/**
 * 从 champion-bench-item 的 background-image 中提取英雄 ID
 * URL 格式: url('/lol-game-data/assets/v1/champion-icons/102.png')
 */
function extractChampionId(item: Element): number | null {
  const iconEl = item.querySelector('.bench-champion-background') as HTMLElement | null
  if (!iconEl) return null
  const bg = iconEl.style.backgroundImage || ''
  const match = bg.match(/champion-icons\/(\d+)\.png/)
  return match ? Number(match[1]) : null
}

/**
 * 注入任务：
 * 1. 移除 on-cooldown 类名和遮罩（视觉）
 * 2. 接管点击事件，直接调 LCU API 换英雄（逻辑）
 */
function tryHijackBenchItems(): boolean {
  const container = document.querySelector('.bench-container')
  if (!container) return true

  // 视觉：移除 on-cooldown 类名和遮罩
  container.querySelectorAll('[class*="on-cooldown"]').forEach((el) => {
    const toRemove = Array.from(el.classList).filter((c) => c.startsWith('on-cooldown'))
    toRemove.forEach((c) => el.classList.remove(c))
    const mask = el.querySelector('.cooldown-mask')
    if (mask instanceof HTMLElement) mask.style.display = 'none'
  })

  // 逻辑：接管未被接管的 bench item 的点击事件
  container.querySelectorAll(`.champion-bench-item:not([${BENCH_HIJACK_ATTR}])`).forEach((item) => {
    // 跳过空位和锁定位
    if (item.classList.contains('empty-bench-item') || item.classList.contains('locked-out')) return

    item.setAttribute(BENCH_HIJACK_ATTR, 'true')

    item.addEventListener('click', (e) => {
      const championId = extractChampionId(item)
      if (!championId) return  // 无法识别英雄，放行原逻辑

      e.stopPropagation()
      e.stopImmediatePropagation()
      e.preventDefault()

      lcu.benchSwap(championId)
        .then(() => logger.info('Bench swap → champion %d ✓', championId))
        .catch((err) => logger.error('Bench swap failed:', err))
    }, true)
  })

  return true
}

let benchNoCooldownRegistered = false

function updateBenchNoCooldown(enabled: boolean) {
  if (enabled && !benchNoCooldownRegistered) {
    injector.register(tryHijackBenchItems)
    benchNoCooldownRegistered = true
    logger.info('Bench no-cooldown enabled ✓')
  } else if (!enabled && benchNoCooldownRegistered) {
    injector.unregister(tryHijackBenchItems)
    benchNoCooldownRegistered = false
    logger.info('Bench no-cooldown disabled')
  }
}

// ==================== 共享：查询队友胜率 ====================

interface TeammateStats {
  floor: number
  summonerId: number
  puuid: string
  gameName: string
  tagLine: string
  winRate: number | null  // null = 查询失败或无战绩
  wins: number
  total: number
  avgK: number
  avgD: number
  avgA: number
  kdaNum: number
}

/**
 * 查询当前选人阶段所有队友的近期战绩
 * 按当前游戏模式（queueId）过滤，目标采样数 TARGET_SAMPLE 条同模式对局
 * 每次拉 PAGE_SIZE 条，若连续 MAX_RAW 条原始对局都无匹配则放弃
 * 返回 { isBlue, stats[] }
 */
async function fetchTeamStats(): Promise<{ isBlue: boolean; gameId: number; stats: TeammateStats[] }> {
  const session = await lcu.getChampSelectSession()
  const myTeam = session.myTeam.filter((p) => p.summonerId > 0)
  const localPlayer = session.myTeam.find((p) => p.cellId === session.localPlayerCellId)
  const isBlue = localPlayer ? localPlayer.cellId < 5 : true

  // 获取当前队列 ID 用于过滤
  let currentQueueId = 0
  try {
    const gfSession = await lcu.getGameflowSession()
    currentQueueId = gfSession.gameData.queue.id
    logger.info('[TeamStats] 当前队列 ID: %d (%s)', currentQueueId, gfSession.gameData.queue.name)
  } catch {
    logger.warn('[TeamStats] 无法获取队列 ID，将使用全部对局')
  }

  const PAGE_SIZE = 20
  const TARGET_SAMPLE = 100  // 目标同模式采样数
  const MAX_RAW = 100        // 连续无匹配的原始对局上限

  const stats: TeammateStats[] = []

  for (let i = 0; i < myTeam.length; i++) {
    const player = myTeam[i]
    try {
      const summoner = await lcu.getSummonerById(player.summonerId)

      // 深度分页拉取 + 按模式过滤
      const filteredGames: Array<{ kills: number; deaths: number; assists: number; win: boolean }> = []
      let cursor = 0
      let rawSinceLastMatch = 0

      while (filteredGames.length < TARGET_SAMPLE) {
        const history = await lcu.getMatchHistory(summoner.puuid, cursor, cursor + PAGE_SIZE)
        const chunk = history.games?.games ?? []

        if (chunk.length === 0) {
          logger.info('[TeamStats] %s 战绩已触底 (cursor=%d)', summoner.gameName, cursor)
          break
        }

        for (const game of chunk) {
          // 按 queueId 过滤（如果获取到了当前队列 ID）
          if (currentQueueId > 0 && game.queueId !== currentQueueId) {
            rawSinceLastMatch++
            continue
          }

          const identity = game.participantIdentities.find((id) => id.player.puuid === summoner.puuid)
          if (!identity) continue
          const participant = game.participants.find((p) => p.participantId === identity.participantId)
          if (!participant) continue

          filteredGames.push({
            kills: participant.stats.kills,
            deaths: participant.stats.deaths,
            assists: participant.stats.assists,
            win: participant.stats.win,
          })
          rawSinceLastMatch = 0
        }

        cursor += PAGE_SIZE

        // 连续 MAX_RAW 条原始对局都没匹配到同模式，放弃继续
        if (rawSinceLastMatch >= MAX_RAW) {
          logger.info('[TeamStats] %s 连续 %d 条无匹配模式，停止深度拉取', summoner.gameName, rawSinceLastMatch)
          break
        }
      }

      if (filteredGames.length === 0) {
        stats.push({ floor: i + 1, summonerId: player.summonerId, puuid: summoner.puuid, gameName: summoner.gameName, tagLine: summoner.tagLine, winRate: null, wins: 0, total: 0, avgK: 0, avgD: 0, avgA: 0, kdaNum: 0 })
        continue
      }

      let wins = 0, totalKills = 0, totalDeaths = 0, totalAssists = 0
      for (const g of filteredGames) {
        if (g.win) wins++
        totalKills += g.kills
        totalDeaths += g.deaths
        totalAssists += g.assists
      }

      const total = filteredGames.length
      logger.info('[TeamStats] %s → 采样 %d 场同模式对局 (cursor到 %d)', summoner.gameName, total, cursor)

      stats.push({
        floor: i + 1,
        summonerId: player.summonerId,
        puuid: summoner.puuid,
        gameName: summoner.gameName,
        tagLine: summoner.tagLine,
        winRate: (wins / total) * 100,
        wins,
        total,
        avgK: totalKills / total,
        avgD: totalDeaths / total,
        avgA: totalAssists / total,
        kdaNum: totalDeaths === 0 ? totalKills + totalAssists : (totalKills + totalAssists) / totalDeaths,
      })
    } catch {
      stats.push({ floor: i + 1, summonerId: player.summonerId, puuid: '', gameName: '?', tagLine: '', winRate: null, wins: 0, total: 0, avgK: 0, avgD: 0, avgA: 0, kdaNum: 0 })
    }
  }

  return { isBlue, gameId: session.gameId, stats }
}

// ==================== 选人阶段头像胜率特效 (champSelectAssist) ====================

import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { ChampSelectIconEffect, getTierConfig } from '@/components/ui/ChampSelectIconEffect'
import { MatchHistoryModal } from '@/components/ui/MatchHistoryModal'

const SONA_TIER_ATTR = 'data-sona-tier'
const SONA_STATS_ATTR = 'data-sona-stats'
const SONA_CLICK_ATTR = 'data-sona-click'

/** 每个楼层的完整战绩缓存 */
let floorStats: TeammateStats[] = []
/** 当前对局 ID，用于判断 DOM 上的数据是否属于本局 */
let currentGameId = 0
/** 当前选人阶段的队列 ID，用于打开战绩弹窗时自动过滤 */
let currentChampSelectQueueId = 0

/** 战绩弹窗的独立 React root */
let matchModalRoot: Root | null = null
let matchModalContainer: HTMLDivElement | null = null

function showMatchHistoryModal(puuid: string, playerName: string, queueId?: number) {
  if (!matchModalContainer) {
    matchModalContainer = document.createElement('div')
    matchModalContainer.id = 'sona-match-history-modal-root'
    document.body.appendChild(matchModalContainer)
    matchModalRoot = createRoot(matchModalContainer)
  }

  const close = () => {
    matchModalRoot?.render(
      createElement(MatchHistoryModal, { open: false, onClose: close, puuid: '', playerName: '' }),
    )
  }

  matchModalRoot!.render(
    createElement(MatchHistoryModal, { open: true, onClose: close, puuid, playerName, queueId }),
  )
}

function cleanupMatchModal() {
  if (matchModalRoot) {
    matchModalRoot.unmount()
    matchModalRoot = null
  }
  if (matchModalContainer) {
    matchModalContainer.remove()
    matchModalContainer = null
  }
}

/** 已挂载的 React root */
const mountedRoots: { root: Root; container: HTMLDivElement }[] = []

/** 注入任务：给选人头像附加粒子特效 + 右侧战绩信息 */
function tryInjectChampSelectTier(): boolean {
  //  这里选择wrapper要额外加一个left，因为对方玩家的信息是看不到的，处理不了
  const wrappers = document.querySelectorAll('.party.visible .summoner-wrapper.visible.left')
  if (wrappers.length === 0 || floorStats.length === 0) return true

  wrappers.forEach((wrapper, i) => {
    const iconContainer = wrapper.querySelector('.champion-icon-container') as HTMLElement | null
    if (!iconContainer) return

    const stat = floorStats[i]
    if (!stat || stat.winRate == null) return
    const winRate = stat.winRate
    const injectKey = `${currentGameId}-${i}`

    // ---- 粒子特效 ----
    const existingParticle = iconContainer.querySelector('[data-sona-particle]')
    if (existingParticle && iconContainer.getAttribute(SONA_TIER_ATTR) !== injectKey) {
      const idx = mountedRoots.findIndex((r) => r.container === existingParticle)
      if (idx >= 0) { mountedRoots[idx].root.unmount(); mountedRoots.splice(idx, 1) }
      existingParticle.remove()
      iconContainer.removeAttribute(SONA_TIER_ATTR)
    }
    if (!iconContainer.querySelector('[data-sona-particle]')) {
      iconContainer.setAttribute(SONA_TIER_ATTR, injectKey)
      iconContainer.style.position = 'relative'
      iconContainer.style.overflow = 'visible'
      iconContainer.style.borderRadius = '50%'

      const config = getTierConfig(winRate)
      if (config.boxShadow) iconContainer.style.boxShadow = config.boxShadow

      const mountDiv = document.createElement('div')
      mountDiv.setAttribute('data-sona-particle', 'true')
      iconContainer.prepend(mountDiv)

      const rect = iconContainer.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height) + 40

      const root = createRoot(mountDiv)
      root.render(createElement(ChampSelectIconEffect, { winRate, width: size, height: size }))
      mountedRoots.push({ root, container: mountDiv })

      logger.info('头像粒子特效 → %d楼 胜率%s%% → %s', i + 1, winRate.toFixed(1), config.id)
    }

    // ---- 头像点击 → 弹出战绩弹窗 ----
    if (!iconContainer.hasAttribute(SONA_CLICK_ATTR) && stat.puuid) {
      iconContainer.setAttribute(SONA_CLICK_ATTR, 'true')
      iconContainer.style.cursor = 'pointer'
      const floorIndex = i
      iconContainer.addEventListener('click', (e) => {
        // 放行 swap 按钮等内部交互元素的点击
        const target = e.target as HTMLElement
        if (target.closest('.swap-button-component, .swap-button-btn')) return

        e.stopPropagation()
        e.preventDefault()
        const current = floorStats[floorIndex]
        if (current?.puuid) {
          showMatchHistoryModal(current.puuid, `${current.gameName}#${current.tagLine}`, currentChampSelectQueueId || undefined)
        }
      }, true)
    }

    // ---- player-details 下方战绩文字 ----
    const playerDetails = wrapper.querySelector('.player-details') as HTMLElement | null
    if (playerDetails) {
      const existingStats = playerDetails.querySelector(`[${SONA_STATS_ATTR}]`)
      if (existingStats && existingStats.getAttribute(SONA_STATS_ATTR) !== injectKey) {
        existingStats.remove()
      }

      if (!playerDetails.querySelector(`[${SONA_STATS_ATTR}]`)) {
        playerDetails.style.position = 'relative'
        playerDetails.style.overflow = 'visible'
        const summonerContainer = playerDetails.closest('.summoner-container') as HTMLElement | null
        if (summonerContainer) summonerContainer.style.overflow = 'visible'

        const kdaStr = stat.kdaNum >= 99 ? 'Perfect' : stat.kdaNum.toFixed(1)
        const winColor = winRate >= 55 ? '#5bbd72' : winRate >= 45 ? '#c8aa6e' : '#e74c3c'

        const statsDiv = document.createElement('div')
        statsDiv.setAttribute(SONA_STATS_ATTR, injectKey)
        statsDiv.style.cssText = 'position:absolute;left:0;top:100%;display:flex;align-items:center;font-size:11px;line-height:1;white-space:nowrap;margin-top:2px;'

        const winSpan = document.createElement('span')
        winSpan.style.cssText = `color:${winColor};font-weight:bold;display:inline-block;min-width:90px;`
        winSpan.textContent = `${winRate.toFixed(0)}% (${stat.wins}W/${stat.total - stat.wins}L)`

        const kdaColor = stat.kdaNum >= 5 ? '#5bbd72' : stat.kdaNum >= 3 ? '#c8aa6e' : '#e74c3c'
        const kdaSpan = document.createElement('span')
        kdaSpan.style.cssText = `color:${kdaColor};margin-left:8px;font-weight:bold;text-shadow:0 0 4px rgba(200,170,110,0.6);`
        kdaSpan.textContent = `KDA ${kdaStr}`

        statsDiv.appendChild(winSpan)
        statsDiv.appendChild(kdaSpan)
        playerDetails.appendChild(statsDiv)
      }
    }
  })

  return true
}



let tierInjectionRegistered = false

function registerTierInjection() {
  if (!tierInjectionRegistered) {
    injector.register(tryInjectChampSelectTier)
    tierInjectionRegistered = true
  }
}

function unregisterTierInjection() {
  if (tierInjectionRegistered) {
    injector.unregister(tryInjectChampSelectTier)
    tierInjectionRegistered = false
  }
  floorStats = []
  currentGameId = 0
  currentChampSelectQueueId = 0
  mountedRoots.forEach(({ root, container }) => {
    root.unmount()
    container.remove()
  })
  mountedRoots.length = 0
  document.querySelectorAll(`[${SONA_TIER_ATTR}]`).forEach((el) => {
    const htmlEl = el as HTMLElement
    htmlEl.style.filter = ''
    htmlEl.style.boxShadow = ''
    htmlEl.removeAttribute(SONA_TIER_ATTR)
  })
  document.querySelectorAll(`[${SONA_STATS_ATTR}]`).forEach((el) => el.remove())
  document.querySelectorAll(`[${SONA_CLICK_ATTR}]`).forEach((el) => {
    el.removeAttribute(SONA_CLICK_ATTR)
    ;(el as HTMLElement).style.cursor = ''
  })
  cleanupMatchModal()
}


/** 查询胜率并启动头像特效注入 */
async function applyChampSelectIconEffects() {
  try {
    // 先清理上一局的残留
    unregisterTierInjection()

    // 获取当前队列 ID，供战绩弹窗过滤
    try {
      const gfSession = await lcu.getGameflowSession()
      currentChampSelectQueueId = gfSession.gameData.queue.id
    } catch {
      currentChampSelectQueueId = 0
    }

    const { gameId, stats } = await fetchTeamStats()
    currentGameId = gameId
    floorStats = stats
    registerTierInjection()

    logger.info('头像特效数据就绪，%d 位队友，队列 ID: %d', stats.length, currentChampSelectQueueId)
  } catch (err) {
    logger.error('头像特效查询失败:', err)
  }
}

let champSelectAssistUnsub: (() => void) | null = null

function updateChampSelectAssist(enabled: boolean) {
  if (enabled && !champSelectAssistUnsub) {
    champSelectAssistUnsub = lcu.observe(LcuEventUri.GAMEFLOW_PHASE_CHANGE, (event: LCUEventMessage) => {
      const phase = event.data as GameflowPhase
      if (phase === 'ChampSelect') {
        // 立即清理上一局残留，确保新局开始时是干净的
        unregisterTierInjection()
        applyChampSelectIconEffects()
      } else {
        unregisterTierInjection()
      }
    })
    logger.info('Champ select assist enabled ✓')
  } else if (!enabled && champSelectAssistUnsub) {
    champSelectAssistUnsub()
    champSelectAssistUnsub = null
    unregisterTierInjection()
    logger.info('Champ select assist disabled')
  }
}

// ==================== 选人阶段辅助信息 ====================

/**
 * 根据胜率和 KDA 给出 LOL 风格幽默评价
 */
function getRating(winRate: number, kda: number): string {
  if (winRate >= 75 && kda >= 4.5) return '👑 峡谷通天代'
  if (winRate >= 70) return '🚀 降维来炸鱼'
  if (winRate >= 65) return '🔥 绝对真大腿'
  if (winRate >= 60) return '⚔️ 绝活哥出列'
  if (winRate >= 56) return '✨ 稳健老司机'
  if (winRate >= 52) return '🛡️ 上分好帮手'
  if (winRate >= 48) return '🎲 峡谷摇摆人'
  if (winRate >= 45) return '🫠 默默抗压中'
  if (winRate >= 41) return '🍂 随缘在补位'
  if (winRate >= 37) return '💀 连败渡劫中'
  if (winRate >= 33) return '🤡 敌方突破口'
  if (winRate >= 28) return '💸 峡谷提款机'
  if (winRate >= 20) return '🏳️ 投降发起人'
  return '☠️ 演员已就位'
}

async function analyzeTeammates() {
  try {
    const { isBlue, stats } = await fetchTeamStats()
    const sideText = isBlue ? '🔵 蓝方 (左下方)' : '🔴 红方 (右上方)'

    logger.info('┌─── 队友战绩分析 ───')
    logger.info('│ 阵营: %s', sideText)

    const chatLines: string[] = [`Sona助手 ♫\n 本局${sideText} — 队友卡池一览(本模式近100局):\n`]

    for (const s of stats) {
      const floor = `${s.floor}楼`
      if (s.winRate == null) {
        logger.info('│ %s — %s#%s — 无近期战绩或查询失败', floor, s.gameName, s.tagLine)
        chatLines.push(`${floor}: 🆕 萌新上线 (无战绩)`)
        continue
      }

      const winRate = s.winRate.toFixed(1)
      const kdaStr = s.kdaNum >= 99 ? 'Perfect' : s.kdaNum.toFixed(2)
      const rating = getRating(s.winRate, s.kdaNum)

      logger.info(
        '│ %s — %s#%s — 近%d场 胜率: %s%% (%d胜%d负) | KDA: %s (%.1f/%.1f/%.1f) | %s',
        floor, s.gameName, s.tagLine,
        s.total, winRate, s.wins, s.total - s.wins,
        kdaStr, s.avgK, s.avgD, s.avgA, rating,
      )

      chatLines.push(`${floor}: ${rating} | 胜率${winRate}% | KDA ${kdaStr}`)
    }

    logger.info('└────────────────────')

    // 等待聊天室就绪后发送
    if (store.get('analyzeTeamPower')) {
      const msg = chatLines.join('\n')
      for (let attempt = 0; attempt < 10; attempt++) {
        try {
          await lcu.sendChampSelectMessage(msg)
          logger.info('队友分析已发送到聊天框 ✓')
          break
        } catch {
          if (attempt < 9) {
            await sleep(1000)
          } else {
            logger.warn('聊天发送失败，聊天室始终未就绪')
          }
        }
      }
    }
  } catch (err) {
    logger.error('队友战绩分析失败:', err)
  }
}

let analyzeTeamPowerUnsub: (() => void) | null = null

function updateAnalyzeTeamPower(enabled: boolean) {
  if (enabled && !analyzeTeamPowerUnsub) {
    analyzeTeamPowerUnsub = lcu.observe(LcuEventUri.GAMEFLOW_PHASE_CHANGE, (event: LCUEventMessage) => {
      const phase = event.data as GameflowPhase
      if (phase === 'ChampSelect') {
        analyzeTeammates()
      }
    })
    logger.info('Analyze team power enabled ✓')
  } else if (!enabled && analyzeTeamPowerUnsub) {
    analyzeTeamPowerUnsub()
    analyzeTeamPowerUnsub = null
    logger.info('Analyze team power disabled')
  }
}

// ==================== 全局粒子美化效果 ====================

const GLOBAL_CANVAS_ID = 'sona-global-particle-canvas'

/** 全局粒子的动画清理函数 */
let globalParticleAnimCleanup: (() => void) | null = null

/** 获取客户端主视图宿主，粒子必须挂载在这里才能正确显示 */
function getGlobalParticleHost(): HTMLElement | null {
  return document.getElementById('rcp-fe-viewport-root')
    ?? null
}

/**
 * 注入任务：确保全局粒子 canvas 存在并运行
 * 必须等待客户端主视图宿主就绪后才挂载，避免首启时被 loading/iframe 层遮挡
 */
function tryInjectGlobalParticle(): boolean {
  const host = getGlobalParticleHost()
  if (!host) return false

  const existing = document.getElementById(GLOBAL_CANVAS_ID)
  if (existing instanceof HTMLCanvasElement && existing.isConnected) return true
  
  // 有旧动画残留先清掉
  if (globalParticleAnimCleanup) {
    globalParticleAnimCleanup()
    globalParticleAnimCleanup = null
  }

  // 创建并挂载 canvas 到主视图宿主
  const canvas = document.createElement('canvas')
  canvas.id = GLOBAL_CANVAS_ID
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:821;'
  host.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  if (!ctx) return false


  let animId = 0
  let initialized = false
  const particles: Array<{
    x: number; y: number; size: number
    speedY: number; speedX: number; opacity: number; isGold: boolean
  }> = []

  const resize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }

  const initParticles = () => {
    if (initialized || canvas.width === 0) return
    initialized = true
    for (let i = 0; i < 300; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5 + 0.5,
        speedY: Math.random() * 0.4 + 0.1,
        speedX: (Math.random() - 0.5) * 0.2,
        opacity: Math.random() * 0.3 + 0.1,
        isGold: Math.random() > 0.7,
      })
    }
  }

  const render = () => {
    if (!initialized) { resize(); initParticles() }
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const p of particles) {
      p.y -= p.speedY
      p.x += p.speedX
      p.opacity += (Math.random() - 0.5) * 0.02
      if (p.opacity < 0.1) p.opacity = 0.1
      if (p.opacity > 0.5) p.opacity = 0.5
      if (p.y < 0) { p.y = canvas.height; p.x = Math.random() * canvas.width }
      if (p.isGold) { ctx.shadowBlur = 4; ctx.shadowColor = `rgba(200, 170, 110, ${p.opacity})` }
      else { ctx.shadowBlur = 3; ctx.shadowColor = `rgba(0, 180, 255, ${p.opacity * 0.8})` }
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = p.isGold ? `rgba(220, 190, 130, ${p.opacity})` : `rgba(80, 200, 255, ${p.opacity * 0.85})`
      ctx.fill()
    }
    ctx.shadowBlur = 0
    ctx.shadowColor = 'transparent'
    animId = requestAnimationFrame(render)
  }

  resize()
  window.addEventListener('resize', resize)
  animId = requestAnimationFrame(render)

  globalParticleAnimCleanup = () => {
    cancelAnimationFrame(animId)
    window.removeEventListener('resize', resize)
    canvas.remove()
  }

  logger.info('Global particle canvas injected ✓')
  return true
}


let globalParticleRegistered = false

function updateGlobalParticle(enabled: boolean) {
  if (enabled && !globalParticleRegistered) {
    injector.register(tryInjectGlobalParticle)
    globalParticleRegistered = true
    logger.info('Global particle effect enabled ✓')
  } else if (!enabled && globalParticleRegistered) {
    injector.unregister(tryInjectGlobalParticle)
    globalParticleRegistered = false
    if (globalParticleAnimCleanup) {
      globalParticleAnimCleanup()
      globalParticleAnimCleanup = null
    }
    logger.info('Global particle effect disabled')
  }
}


// ==================== 好友智能分组 ====================

const SONA_FRIEND_GROUP_ATTR = 'data-sona-friend-group'
const SONA_FRIEND_CHECKED_ATTR = 'data-sona-friend-checked'

/** 用于给同一对局分配相同颜色 */
const GAME_COLORS = [
  '#e8a424', '#4a9eff', '#5bbd72', '#e74c3c', '#c084fc', '#f97316', '#14b8a6', '#ec4899',
  '#8b5cf6', '#06b6d4', '#eab308', '#ef4444', '#22d3ee', '#a3e635', '#fb923c', '#f472b6',
]


/** gameId → 颜色 映射缓存 */
let gameColorMap = new Map<string, string>()
let colorIndex = 0

/** 好友 name → { gameId, gameStatus } 映射缓存（由按需查询填充） */
let friendInfoMap = new Map<string, { gameId: number; gameStatus: string }>()



function getGameColor(gameId: string): string {
  if (!gameColorMap.has(gameId)) {
    gameColorMap.set(gameId, GAME_COLORS[colorIndex % GAME_COLORS.length])
    colorIndex++
  }
  return gameColorMap.get(gameId)!
}

/** 异步查询所有好友的游戏状态，建立 name → gameInfo 映射（带重试） */
async function refreshFriendInfoMap(retries = 5) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const friends = await lcu.getFriends()
      const newMap = new Map<string, { gameId: number; gameStatus: string }>()

      for (const f of friends) {
        const name = f.gameName || f.name
        if (!name) continue

        const gameId = f.lol?.gameId ?? f.gameId
        const gameStatus = f.lol?.gameStatus ?? f.gameStatus

        if (gameId && gameId > 0 && gameStatus && gameStatus !== 'outOfGame') {
          newMap.set(name, { gameId, gameStatus })
        }
      }

      friendInfoMap = newMap
      logger.info('[FriendGroup] 刷新好友游戏状态 → %d 人在游戏中 (attempt %d)', newMap.size, attempt)
      return
    } catch (err) {
      if (attempt < retries) {
        logger.debug('[FriendGroup] 好友接口未就绪，%ds 后重试 (%d/%d)', 2, attempt + 1, retries)
        await sleep(2000)
      } else {
        logger.error('[FriendGroup] 查询好友状态失败:', err)
      }
    }
  }
}

/**
 * 注入任务：扫描好友列表，标记游戏中好友开黑好友用同样颜色的border-right展示
 *
 * DOM 结构：
 * - 好友列表容器: .lol-social-lower-pane-container
 * - 每个好友: lol-social-roster-member（离线时额外有 .offline）
 *   - .member-name → 好友名字（不含 tag）
 *   - span.status-message.game-status.dnd → 游戏中状态
 *   - parentElement 是列表中可移动的 div
 *
 * 好友列表视觉从上到下 = DOM 从下到上（逆序）
 * 所以"移动到底部" = 视觉上排在最前面
 */
function tryInjectFriendSmartGroup(): boolean {
  const container = document.querySelector('.lol-social-lower-pane-container')
  if (!container) return true

  const allMembers = container.querySelectorAll('[class*="lol-social-roster-member"]')
  if (allMembers.length === 0) return true

  // 第一轮：收集 gameId → 好友元素列表
  const gameIdToElements = new Map<string, HTMLElement[]>()

  allMembers.forEach((member) => {
    const el = member as HTMLElement

    const isOffline = el.className.includes('offline')
    const isInGame = !isOffline && !!el.querySelector('span.status-message.game-status.dnd')

    if (!isInGame) {
      // 不在游戏中或离线，清除旧标记
      if (el.hasAttribute(SONA_FRIEND_GROUP_ATTR)) {
        el.removeAttribute(SONA_FRIEND_GROUP_ATTR)
        el.style.borderRight = ''
      }
      el.removeAttribute(SONA_FRIEND_CHECKED_ATTR)
      return
    }

    // 从 DOM 获取好友名字
    const nameEl = el.querySelector('.member-name')
    const memberName = nameEl?.textContent?.trim() ?? ''
    if (!memberName) return

    // 从缓存中匹配 gameId
    const info = friendInfoMap.get(memberName)
    const gameId = info ? String(info.gameId) : undefined

    if (gameId) {
      if (!gameIdToElements.has(gameId)) gameIdToElements.set(gameId, [])
      gameIdToElements.get(gameId)!.push(el)
    } else {
      // 没有 gameId（选人中等），清除可能的旧标记
      if (el.hasAttribute(SONA_FRIEND_GROUP_ATTR)) {
        el.removeAttribute(SONA_FRIEND_GROUP_ATTR)
        el.style.borderRight = ''
      }
    }
  })

  // 第二轮：只对同一 gameId 有 2+ 好友的组（真正开黑）加颜色标记
  gameIdToElements.forEach((elements, gameId) => {
    if (elements.length < 2) {
      // 独自玩的，清除可能的旧标记
      elements.forEach((el) => {
        if (el.hasAttribute(SONA_FRIEND_GROUP_ATTR)) {
          el.removeAttribute(SONA_FRIEND_GROUP_ATTR)
          el.style.borderRight = ''
        }
      })
      return
    }

    const color = getGameColor(gameId)
    elements.forEach((el) => {
      el.setAttribute(SONA_FRIEND_GROUP_ATTR, gameId)
      el.style.borderRight = `4px solid ${color}`
    })
  })


  return true
}


let friendSmartGroupRegistered = false

function updateFriendSmartGroup(enabled: boolean) {
  if (enabled && !friendSmartGroupRegistered) {
    friendSmartGroupRegistered = true
    // 先拉好友数据，就绪后再注册注入
    refreshFriendInfoMap().then(() => {
      if (friendSmartGroupRegistered) {
        injector.register(tryInjectFriendSmartGroup)
        logger.info('Friend smart group enabled ✓')
      }
    })
  } else if (!enabled && friendSmartGroupRegistered) {
    injector.unregister(tryInjectFriendSmartGroup)
    friendSmartGroupRegistered = false
    friendInfoMap.clear()

    gameColorMap.clear()

    colorIndex = 0
    document.querySelectorAll(`[${SONA_FRIEND_GROUP_ATTR}]`).forEach((el) => {
      const htmlEl = el as HTMLElement
      htmlEl.removeAttribute(SONA_FRIEND_GROUP_ATTR)
      htmlEl.removeAttribute(SONA_FRIEND_CHECKED_ATTR)
      htmlEl.style.borderRight = ''
    })
    logger.info('Friend smart group disabled')
  }
}


// ==================== 对局结束自动点赞 ====================

const HONOR_CATEGORIES = ['HEART', 'COOL', 'SHOTCALLER'] as const

/** ballot 接口返回类型 */
interface HonorBallot {
  gameId: number
  eligibleAllies: Array<{
    botPlayer: boolean
    championId: number
    championName: string
    puuid: string
    summonerId: number
    role: string
  }>
  eligibleOpponents: Array<{
    botPlayer: boolean
    championId: number
    championName: string
    puuid: string
    summonerId: number
    role: string
  }>
  honoredPlayers: unknown[]
  votePool: {
    fromGamePlayed: number
    fromHighHonor: number
    fromRecentHonors: number
    fromRollover: number
    votes: number
  }
}

async function autoHonorTeammate() {
  try {
    const ballotRes = await fetch('/lol-honor-v2/v1/ballot')
    if (!ballotRes.ok) {
      logger.info('[AutoHonor] 当前没有待点赞的对局')
      return
    }

    const ballot = await ballotRes.json() as HonorBallot
    const allies = [...(ballot.eligibleAllies || [])]
    const opponents = [...(ballot.eligibleOpponents || [])]

    if (allies.length === 0 && opponents.length === 0) {
      logger.info('[AutoHonor] 没有可点赞的玩家')
      return
    }

    const votes = ballot.votePool?.votes ?? 1
    logger.info('[AutoHonor] 可用票数: %d, 队友: %d, 对手: %d', votes, allies.length, opponents.length)

    // 打散队友顺序，每人最多 1 票
    for (let i = allies.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[allies[i], allies[j]] = [allies[j], allies[i]]
    }
    // 打散对手顺序
    for (let i = opponents.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[opponents[i], opponents[j]] = [opponents[j], opponents[i]]
    }

    // 先给队友，多余的给对手
    const targets = [...allies, ...opponents].slice(0, votes)

    for (let i = 0; i < targets.length; i++) {
      const target = targets[i]
      const category = HONOR_CATEGORIES[Math.floor(Math.random() * HONOR_CATEGORIES.length)]
      const isAlly = i < allies.length

      const honorRes = await fetch('/lol-honor-v2/v1/honor-player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          puuid: target.puuid,
          summonerId: target.summonerId,
          gameId: ballot.gameId,
          honorCategory: category,
        }),
      })

      if (honorRes.ok) {
        logger.info('[AutoHonor] 第%d票 ✓ → [%s] 给了 %s%s', i + 1, category, target.championName, isAlly ? '' : ' (对手)')
      } else {
        logger.error('[AutoHonor] 第%d票失败:', i + 1, honorRes.status, await honorRes.text())
      }
    }

    logger.info('[AutoHonor] 自动点赞完成，共 %d 票', targets.length)
  } catch (err) {
    logger.error('[AutoHonor] 自动点赞异常:', err)
  }
}

let autoHonorUnsub: (() => void) | null = null

function updateAutoHonor(enabled: boolean) {
  if (enabled && !autoHonorUnsub) {
    autoHonorUnsub = lcu.observe(LcuEventUri.GAMEFLOW_PHASE_CHANGE, (event: LCUEventMessage) => {
      const phase = event.data as GameflowPhase
      if (phase === 'PreEndOfGame') {
        autoHonorTeammate()
      }
    })
    logger.info('Auto honor enabled ✓')
  } else if (!enabled && autoHonorUnsub) {
    autoHonorUnsub()
    autoHonorUnsub = null
    logger.info('Auto honor disabled')
  }
}


// ==================== 秒抢英雄 ====================

/**
 * 监听英雄选择的 actions 变化，当轮到自己的 pick action 处于 isInProgress 时秒锁
 * 仅在有 pick 动作的模式生效（排位/匹配等），大乱斗等无 pick 的模式不受影响
 */
async function tryAutoLockChampion() {
  const championId = store.get('autoLockChampionId')
  if (!championId || championId <= 0) {
    logger.warn('[AutoLock] 未设置目标英雄 ID')
    return
  }

  // 排位赛 BP 可能长达 5 分钟，300 次 × 1s 轮询足够覆盖
  for (let attempt = 0; attempt < 300; attempt++) {
    try {
      const session = await lcu.getChampSelectSession()

      const allActions = session.actions.flat()
      const myPickAction = allActions.find(
        (a) => a.actorCellId === session.localPlayerCellId && a.type === 'pick' && !a.completed
      )

      if (!myPickAction) {
        if (allActions.every((a) => a.type !== 'pick' || a.actorCellId !== session.localPlayerCellId)) {
          logger.info('[AutoLock] 当前模式无需选人（大乱斗等），跳过')
          return
        }
        await sleep(1000)
        continue
      }

      if (myPickAction.isInProgress) {
        // 关键：如果是 PLANNING（亮英雄）阶段，不能执行锁定，继续等待
        if (session.timer.phase === 'PLANNING') {
          await sleep(1000)
          continue
        }

        const instant = store.get('autoLockInstant')
        const actionUrl = `/lol-champ-select/v1/session/actions/${myPickAction.id}`

        if (instant) {
          logger.info('[AutoLock] 真正轮到选人了！秒锁英雄 ID: %d (actionId: %d)', championId, myPickAction.id)

          // 方案：PATCH 带 completed:true 一步到位完成选择+锁定
          const patchRes = await fetch(actionUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              actorCellId: session.localPlayerCellId,
              championId,
              completed: true,
              id: myPickAction.id,
              isAllyAction: true,
              type: 'pick',
            }),
          })

          if (patchRes.ok) {
            logger.info('[AutoLock] 秒锁成功 (PATCH completed:true) ✓')
          } else {
            // 备用方案：先 PATCH 选择，再 POST /select 锁定
            logger.warn('[AutoLock] PATCH 方案失败，尝试备用方案 /select')
            await fetch(actionUrl, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ championId }),
            })
            await sleep(200)
            const selectRes = await fetch(`${actionUrl}/select`, { method: 'POST' })
            if (selectRes.ok) {
              logger.info('[AutoLock] 秒锁成功 (select 备用) ✓')
            } else {
              logger.error('[AutoLock] 秒锁失败，可能英雄被抢或被 Ban')
            }
          }
        } else {
          logger.info('[AutoLock] 轮到选人，预选英雄 ID: %d（不锁定）', championId)
          await fetch(actionUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ championId }),
          })
          logger.info('[AutoLock] 预选成功 ✓')
        }

        return
      }

      await sleep(1000)
    } catch {
      // 轮询期间有人秒退（getChampSelectSession 会报 404），直接结束
      logger.error('[AutoLock] 轮询中断 (可能有人秒退了房间)')
      return
    }
  }

  logger.warn('[AutoLock] 等待超时 (5分钟)，未能秒锁')
}

let autoLockChampionUnsub: (() => void) | null = null

function updateAutoLockChampion(enabled: boolean) {
  if (enabled && !autoLockChampionUnsub) {
    autoLockChampionUnsub = lcu.observe(LcuEventUri.GAMEFLOW_PHASE_CHANGE, (event: LCUEventMessage) => {
      const phase = event.data as GameflowPhase
      if (phase === 'ChampSelect') {
        tryAutoLockChampion()
      }
    })
    logger.info('Auto lock champion enabled ✓')
  } else if (!enabled && autoLockChampionUnsub) {
    autoLockChampionUnsub()
    autoLockChampionUnsub = null
    logger.info('Auto lock champion disabled')
  }
}


// ==================== 段位伪装 ====================

async function applyRankDisguise() {
  const queue = store.get('rankQueue')
  const tier = store.get('rankTier')
  const division = store.get('rankDivision')

  try {
    const res = await fetch('/lol-chat/v1/me')
    if (!res.ok) { logger.error('[RankDisguise] 获取聊天状态失败'); return }
    const me = await res.json()
    me.lol.rankedLeagueTier = tier
    me.lol.rankedLeagueDivision = division
    me.lol.rankedLeagueQueue = queue
    const putRes = await fetch('/lol-chat/v1/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(me),
    })
    if (putRes.ok) {
      logger.info('[RankDisguise] 段位伪装已应用 ✓ %s %s %s', queue, tier, division)
    } else {
      logger.error('[RankDisguise] 应用失败:', await putRes.text())
    }
  } catch (err) {
    logger.error('[RankDisguise] 应用异常:', err)
  }
}

async function removeRankDisguise() {
  try {
    const res = await fetch('/lol-chat/v1/me')
    if (!res.ok) return
    const me = await res.json()
    me.lol.rankedLeagueTier = ''
    me.lol.rankedLeagueDivision = ''
    me.lol.rankedLeagueQueue = ''
    const putRes = await fetch('/lol-chat/v1/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(me),
    })
    if (putRes.ok) logger.info('[RankDisguise] 已恢复真实段位 ✓')
  } catch (err) {
    logger.error('[RankDisguise] 恢复失败:', err)
  }
}

function updateRankDisguise(enabled: boolean) {
  if (enabled) {
    applyRankDisguise()
  } else {
    removeRankDisguise()
  }
}




import { ProfileBackgroundPicker } from '@/components/ui/ProfileBackgroundPicker'

// ==================== 生涯背景自定义 ====================

const SONA_PROFILE_BG_ATTR = 'data-sona-profile-bg-hijacked'

/** 生涯背景弹窗的独立 React root */
let profileBgRoot: Root | null = null
let profileBgContainer: HTMLDivElement | null = null

function showProfileBgPicker() {
  if (!profileBgContainer) {
    profileBgContainer = document.createElement('div')
    profileBgContainer.id = 'sona-profile-bg-root'
    document.body.appendChild(profileBgContainer)
    profileBgRoot = createRoot(profileBgContainer)
  }

  const close = () => {
    profileBgRoot?.render(
      createElement(ProfileBackgroundPicker, { open: false, onClose: close }),
    )
  }

  profileBgRoot!.render(
    createElement(ProfileBackgroundPicker, { open: true, onClose: close }),
  )
}

function cleanupProfileBg() {
  if (profileBgRoot) {
    profileBgRoot.unmount()
    profileBgRoot = null
  }
  if (profileBgContainer) {
    profileBgContainer.remove()
    profileBgContainer = null
  }
}

/**
 * 注入任务：在生涯界面接管原生皮肤选择按钮的点击事件
 * 检测 style-profile-skin-picker-button，拦截点击后拉起自定义 Modal
 */
function tryHijackProfileSkinButton(): boolean {
  const btn = document.querySelector('.style-profile-skin-picker-button') as HTMLElement | null
  if (!btn) return true

  if (btn.hasAttribute(SONA_PROFILE_BG_ATTR)) return true

  btn.setAttribute(SONA_PROFILE_BG_ATTR, 'true')

  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    e.stopImmediatePropagation()
    e.preventDefault()
    showProfileBgPicker()
    logger.info('[ProfileBg] 拦截原生按钮点击，打开自定义弹窗')
  }, true)

  logger.info('[ProfileBg] 已接管皮肤选择按钮 ✓')
  return true
}

let profileBgRegistered = false

function updateCustomProfileBg(enabled: boolean) {
  if (enabled && !profileBgRegistered) {
    injector.register(tryHijackProfileSkinButton)
    profileBgRegistered = true
    logger.info('Custom profile background enabled ✓')
  } else if (!enabled && profileBgRegistered) {
    injector.unregister(tryHijackProfileSkinButton)
    profileBgRegistered = false
    cleanupProfileBg()
    // 清除接管标记，让原生行为恢复
    document.querySelectorAll(`[${SONA_PROFILE_BG_ATTR}]`).forEach((el) => {
      el.removeAttribute(SONA_PROFILE_BG_ATTR)
    })
    logger.info('Custom profile background disabled')
  }
}


// ==================== 初始化 ====================


/**
 * 初始化所有功能
 * 根据 store 当前值启用功能，并监听后续变化
 */
export function initFeatures() {
  updateAutoAccept(store.get('autoAcceptMatch'))
  store.onChange('autoAcceptMatch', updateAutoAccept)

  updateDebugGameflow(store.get('developerMode'))
  store.onChange('developerMode', updateDebugGameflow)

  updateUnlockStatus(store.get('unlockStatus'))
  store.onChange('unlockStatus', updateUnlockStatus)

  updateBenchNoCooldown(store.get('benchNoCooldown'))
  store.onChange('benchNoCooldown', updateBenchNoCooldown)

  updateAnalyzeTeamPower(store.get('analyzeTeamPower'))
  store.onChange('analyzeTeamPower', updateAnalyzeTeamPower)

  updateChampSelectAssist(store.get('champSelectAssist'))
  store.onChange('champSelectAssist', updateChampSelectAssist)

  updateGlobalParticle(store.get('globalParticle'))
  store.onChange('globalParticle', updateGlobalParticle)

  updateFriendSmartGroup(store.get('friendSmartGroup'))
  store.onChange('friendSmartGroup', updateFriendSmartGroup)

  updateCustomProfileBg(store.get('customProfileBg'))
  store.onChange('customProfileBg', updateCustomProfileBg)

  updateAutoHonor(store.get('autoHonor'))
  store.onChange('autoHonor', updateAutoHonor)

  // 段位伪装：启动时自动应用，配置变化时重新应用
  updateRankDisguise(store.get('rankDisguise'))
  store.onChange('rankDisguise', updateRankDisguise)
  // 队列/段位/子段位变化时，如果开关开着就重新应用
  store.onChange('rankQueue', () => { if (store.get('rankDisguise')) applyRankDisguise() })
  store.onChange('rankTier', () => { if (store.get('rankDisguise')) applyRankDisguise() })
  store.onChange('rankDivision', () => { if (store.get('rankDisguise')) applyRankDisguise() })

  updateAutoLockChampion(store.get('autoLockChampion'))
  store.onChange('autoLockChampion', updateAutoLockChampion)

  // 恢复窗口特效
  const savedEffect = store.get('windowEffect')
  if (savedEffect && savedEffect !== 'none') {
    Effect.apply(savedEffect as 'acrylic', { color: '#0006' })
    logger.info('Restored window effect: %s', savedEffect)
  }

  logger.info('Features initialized ✓')
}

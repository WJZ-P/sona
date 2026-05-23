import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { logger } from '@/index'
import { MatchHistoryModal } from '@/components/ui/MatchHistoryModal'
import { injector } from '@/lib/InjectorManager'
import { lcu, LcuEventUri, queueIdToTag } from '@/lib/lcu'
import type { LCUEventMessage, Lobby } from '@/lib/lcu'
import { calculateSonaPlayerStrengthScore, shouldSkipSonaStrengthGame } from '@/lib/player-strength-score'
import { store } from '@/lib/store'

const SONA_LOBBY_HISTORY_ATTR = 'data-sona-lobby-history'
const SONA_LOBBY_STATS_ATTR = 'data-sona-lobby-stats'
const SONA_LOBBY_STATS_TEXT_ATTR = 'data-sona-lobby-stats-text'
const INTERACTIVE_SELECTOR = [
  'button',
  'a',
  'input',
  'textarea',
  'select',
  '[role="button"]',
  'lol-uikit-flat-button',
  'lol-uikit-icon-button',
].join(',')
const CLICKABLE_BOTTOM_HEIGHT = 120

interface LobbyMemberInfo {
  puuid: string
  summonerId: number
  name: string
}

interface LobbyMemberStats {
  winRate: number
  kda: number
  score: number | null
  total: number
}

interface BoundIdentity {
  element: HTMLElement
  previousPosition: string
  clickHandler: (event: MouseEvent) => void
  moveHandler: (event: MouseEvent) => void
  leaveHandler: () => void
}

let lobbyMemberHistoryRegistered = false
let lobbyMemberHistoryInjected = false
let lobbyMemberHistoryUnsub: (() => void) | null = null
let lobbyMemberHistoryMap = new Map<string, LobbyMemberInfo>()
let lobbyMemberHistoryQueueId = 0
let lobbyMemberStatsMap = new Map<string, LobbyMemberStats>()
let lobbyMemberStatsInFlight: Promise<void> | null = null
let lobbyMemberNameMap = new Map<string, string>()
let boundIdentities: BoundIdentity[] = []
let matchModalRoot: Root | null = null
let matchModalContainer: HTMLDivElement | null = null

function showMatchHistoryModal(puuid: string, playerName: string, queueId?: number) {
  if (!matchModalContainer) {
    matchModalContainer = document.createElement('div')
    matchModalContainer.id = 'sona-lobby-member-match-history-root'
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

function cleanupMatchHistoryModal() {
  if (matchModalRoot) {
    matchModalRoot.unmount()
    matchModalRoot = null
  }
  if (matchModalContainer) {
    matchModalContainer.remove()
    matchModalContainer = null
  }
}

async function getDisplayNameByPuuid(puuid: string, fallback: string): Promise<string> {
  const cached = lobbyMemberNameMap.get(puuid)
  if (cached) return cached

  try {
    const summoner = await lcu.getSummonerByPuuid(puuid)
    const name = summoner.gameName && summoner.tagLine
      ? `${summoner.gameName}#${summoner.tagLine}`
      : fallback
    lobbyMemberNameMap.set(puuid, name)
    return name
  } catch {
    return fallback
  }
}

function indexLobby(lobby: Lobby | null) {
  const nextMap = new Map<string, LobbyMemberInfo>()
  lobbyMemberHistoryQueueId = lobby?.gameConfig?.queueId ?? 0

  for (const member of lobby?.members ?? []) {
    const info: LobbyMemberInfo = {
      puuid: member.puuid,
      summonerId: member.summonerId,
      name: member.summonerName || `召唤师 ${member.summonerId}`,
    }

    if (member.puuid) nextMap.set(`puuid:${member.puuid}`, info)
    if (member.summonerId) nextMap.set(`summoner:${member.summonerId}`, info)
  }

  lobbyMemberHistoryMap = nextMap
}

async function refreshLobbyMemberStats() {
  if (lobbyMemberStatsInFlight) return lobbyMemberStatsInFlight

  lobbyMemberStatsInFlight = doRefreshLobbyMemberStats()
    .finally(() => {
      lobbyMemberStatsInFlight = null
    })

  return lobbyMemberStatsInFlight
}

async function doRefreshLobbyMemberStats() {
  const members = [...new Map(
    [...lobbyMemberHistoryMap.values()]
      .filter((member) => member.puuid)
      .map((member) => [member.puuid, member] as const),
  ).values()]
  const tag = queueIdToTag(lobbyMemberHistoryQueueId)
  const nextStats = new Map<string, LobbyMemberStats>()

  await Promise.all(members.map(async (member) => {
    try {
      const resp = await lcu.getSgpMatchHistory(member.puuid, {
        startIndex: 0,
        count: store.get('lobbyEnhancementFetchCount') || 50,
        tag: tag || undefined,
      })
      const games = resp.games ?? []
      let total = 0
      let wins = 0
      let kills = 0
      let assists = 0
      let deaths = 0

      for (const game of games) {
        const participant = game.json.participants.find((item) => item.puuid === member.puuid)
        if (!participant) continue
        if (shouldSkipSonaStrengthGame(game, member.puuid)) continue
        total++
        if (participant.win) wins++
        kills += participant.kills
        assists += participant.assists
        deaths += participant.deaths
      }

      if (total === 0) return

      const strengthScore = calculateSonaPlayerStrengthScore(games, member.puuid)
      nextStats.set(member.puuid, {
        winRate: wins / total,
        kda: deaths === 0 ? kills + assists : (kills + assists) / deaths,
        score: strengthScore?.score ?? null,
        total,
      })
    } catch (err) {
      logger.debug('[LobbyHistory] 拉取成员战绩失败: %s', member.name, err)
    }
  }))

  if (!lobbyMemberHistoryRegistered) return

  lobbyMemberStatsMap = nextStats
  tryInjectLobbyMemberHistory()
}

async function refreshLobbyMemberHistoryMap() {
  try {
    const lobby = await lcu.getLobby()
    if (!lobbyMemberHistoryRegistered) return

    indexLobby(lobby)
    tryInjectLobbyMemberHistory()
    void refreshLobbyMemberStats()
  } catch {
    indexLobby(null)
    lobbyMemberStatsMap.clear()
  }
}

function getRegaliaMemberInfo(regalia: HTMLElement): LobbyMemberInfo | null {
  const puuid = regalia.getAttribute('puuid') || ''
  const summonerId = Number(regalia.getAttribute('summoner-id') || 0)

  return lobbyMemberHistoryMap.get(`puuid:${puuid}`) ??
    lobbyMemberHistoryMap.get(`summoner:${summonerId}`) ??
    null
}

function isBottomClickableArea(element: HTMLElement, event: MouseEvent): boolean {
  const rect = element.getBoundingClientRect()
  return event.clientY >= rect.bottom - CLICKABLE_BOTTOM_HEIGHT
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(INTERACTIVE_SELECTOR))
}

function getRateColor(rate: number): string {
  if (rate >= 0.6) return '#5bbd72'
  if (rate >= 0.5) return '#c8aa6e'
  return '#e74c3c'
}

function getKdaColor(kda: number): string {
  if (kda >= 4) return '#5bbd72'
  if (kda >= 2.5) return '#c8aa6e'
  return '#e74c3c'
}

function getScoreColor(score: number): string {
  if (score >= 14.5) return '#5bbd72'
  if (score >= 11.2) return '#c8aa6e'
  return '#e74c3c'
}

function ensureStatsOverlay(identity: HTMLElement): HTMLDivElement {
  let overlay = identity.querySelector(`[${SONA_LOBBY_STATS_ATTR}]`) as HTMLDivElement | null
  if (overlay) return overlay

  overlay = document.createElement('div')
  overlay.setAttribute(SONA_LOBBY_STATS_ATTR, 'true')
  overlay.style.cssText = [
    'position:absolute',
    'top:12px',
    'left:50%',
    'transform:translateX(-50%)',
    'display:flex',
    'align-items:center',
    'gap:4px',
    'padding:3px 7px',
    'background:rgba(1,10,19,0.72)',
    'border:1px solid rgba(200,170,110,0.28)',
    'border-radius:3px',
    'font-size:10.5px',
    'line-height:1',
    'font-weight:700',
    'white-space:nowrap',
    'pointer-events:none',
    'box-shadow:0 2px 8px rgba(0,0,0,0.28)',
  ].join(';')

  identity.appendChild(overlay)
  return overlay
}

function renderStatsOverlay(identity: HTMLElement, stats: LobbyMemberStats | undefined) {
  const overlay = ensureStatsOverlay(identity)
  const nextText = stats
    ? [
        `胜率 ${Math.round(stats.winRate * 100)}%`,
        `KDA ${stats.kda >= 99 ? 'Perfect' : stats.kda.toFixed(2)}`,
        `评分 ${stats.score != null ? stats.score.toFixed(1) : '--'}`,
      ].join('|')
    : '战绩加载中...'

  if (overlay.getAttribute(SONA_LOBBY_STATS_TEXT_ATTR) === nextText) {
    return
  }
  overlay.setAttribute(SONA_LOBBY_STATS_TEXT_ATTR, nextText)

  if (!stats) {
    overlay.innerHTML = '<span style="color:#a09b8c">战绩加载中...</span>'
    return
  }

  overlay.innerHTML = [
    `<span style="color:${getRateColor(stats.winRate)}">胜率 ${Math.round(stats.winRate * 100)}%</span>`,
    `<span style="color:#5c5b57">|</span>`,
    `<span style="color:${getKdaColor(stats.kda)}">KDA ${stats.kda >= 99 ? 'Perfect' : stats.kda.toFixed(2)}</span>`,
    `<span style="color:#5c5b57">|</span>`,
    `<span style="color:${stats.score != null ? getScoreColor(stats.score) : '#a09b8c'}">评分 ${stats.score != null ? stats.score.toFixed(1) : '--'}</span>`,
  ].join('')
}

function bindIdentityClick(identity: HTMLElement, info: LobbyMemberInfo) {
  if (identity.hasAttribute(SONA_LOBBY_HISTORY_ATTR)) {
    renderStatsOverlay(identity, lobbyMemberStatsMap.get(info.puuid))
    return
  }

  const previousPosition = identity.style.position
  identity.setAttribute(SONA_LOBBY_HISTORY_ATTR, 'true')
  if (!identity.style.position) {
    identity.style.position = 'relative'
  }
  renderStatsOverlay(identity, lobbyMemberStatsMap.get(info.puuid))

  const clickHandler = (event: MouseEvent) => {
    if (isInteractiveTarget(event.target)) return
    if (!isBottomClickableArea(identity, event)) return
    if (!info.puuid) return

    event.preventDefault()
    event.stopPropagation()
    void getDisplayNameByPuuid(info.puuid, info.name).then((displayName) => {
      showMatchHistoryModal(info.puuid, displayName, lobbyMemberHistoryQueueId || undefined)
    })
  }

  const moveHandler = (event: MouseEvent) => {
    identity.style.cursor = isBottomClickableArea(identity, event) && !isInteractiveTarget(event.target)
      ? 'pointer'
      : ''
  }

  const leaveHandler = () => {
    identity.style.cursor = ''
  }

  identity.addEventListener('click', clickHandler)
  identity.addEventListener('mousemove', moveHandler)
  identity.addEventListener('mouseleave', leaveHandler)
  boundIdentities.push({ element: identity, previousPosition, clickHandler, moveHandler, leaveHandler })
}

function tryInjectLobbyMemberHistory(): boolean {
  const regaliaElements = document.querySelectorAll('lol-regalia-parties-v2-element[puuid], lol-regalia-parties-v2-element[summoner-id]')
  if (regaliaElements.length === 0) return true

  regaliaElements.forEach((node) => {
    const regalia = node as HTMLElement
    const info = getRegaliaMemberInfo(regalia)
    if (!info?.puuid) return

    const identity = regalia.querySelector('.player-identity-container') as HTMLElement | null
    if (!identity) return

    bindIdentityClick(identity, info)
  })

  return true
}

function cleanupBoundIdentities() {
  boundIdentities.forEach(({ element, previousPosition, clickHandler, moveHandler, leaveHandler }) => {
    element.removeEventListener('click', clickHandler)
    element.removeEventListener('mousemove', moveHandler)
    element.removeEventListener('mouseleave', leaveHandler)
    element.removeAttribute(SONA_LOBBY_HISTORY_ATTR)
    element.style.cursor = ''
    element.style.position = previousPosition
    element.querySelectorAll(`[${SONA_LOBBY_STATS_ATTR}]`).forEach((node) => node.remove())
  })
  boundIdentities = []
}

export function updateLobbyMemberMatchHistory(enabled: boolean) {
  if (enabled && !lobbyMemberHistoryRegistered) {
    lobbyMemberHistoryRegistered = true

    injector.register(tryInjectLobbyMemberHistory)
    lobbyMemberHistoryInjected = true

    lobbyMemberHistoryUnsub = lcu.observe(LcuEventUri.LOBBY, (event: LCUEventMessage) => {
      if (event.eventType === 'Delete') {
        indexLobby(null)
        lobbyMemberStatsMap.clear()
        cleanupBoundIdentities()
        return
      }

      void refreshLobbyMemberHistoryMap()
    })

    void refreshLobbyMemberHistoryMap().then(() => {
      if (lobbyMemberHistoryRegistered) {
        logger.info('Lobby member match history enabled ✓')
      }
    })
  } else if (!enabled && lobbyMemberHistoryRegistered) {
    if (lobbyMemberHistoryInjected) {
      injector.unregister(tryInjectLobbyMemberHistory)
      lobbyMemberHistoryInjected = false
    }
    if (lobbyMemberHistoryUnsub) {
      lobbyMemberHistoryUnsub()
      lobbyMemberHistoryUnsub = null
    }

    lobbyMemberHistoryRegistered = false
    indexLobby(null)
    lobbyMemberStatsMap.clear()
    lobbyMemberNameMap.clear()
    cleanupBoundIdentities()
    cleanupMatchHistoryModal()

    logger.info('Lobby member match history disabled')
  }
}

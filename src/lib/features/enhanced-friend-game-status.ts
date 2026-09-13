import { logger } from '@/index'
import { getQueueName } from '@/lib/assets'
import { injector } from '@/lib/InjectorManager'
import { lcu } from '@/lib/lcu'
import type { ChatFriend } from '@/lib/lcu'
import { sleep } from '@/lib/utils'

const FRIENDS_URI = '/lol-chat/v1/friends'
const SONA_FRIEND_STATUS_ATTR = 'data-sona-enhanced-friend-status'
const SONA_FRIEND_STATUS_ORIGINAL_ATTR = 'data-sona-enhanced-friend-status-original'

interface EnhancedFriendStatusInfo {
  displayName: string
  startedAt: number
  queueId: number
  fallbackQueueName: string
  isTft: boolean
}

let enhancedFriendStatusRegistered = false
let enhancedFriendStatusInjected = false
let enhancedFriendStatusUnsub: (() => void) | null = null
let enhancedFriendStatusRefreshTimer: number | null = null
let enhancedFriendStatusTickTimer: number | null = null
let enhancedFriendStatusRefreshInFlight: Promise<void> | null = null
let enhancedFriendStatusMap = new Map<string, EnhancedFriendStatusInfo>()

function getFriendDisplayName(friend: ChatFriend): string {
  return friend.gameName || friend.name
}

function getFriendStatusKeys(friend: ChatFriend): string[] {
  const keys = new Set<string>()
  const name = getFriendDisplayName(friend)

  if (name) keys.add(name)
  if (friend.gameName && friend.gameTag) keys.add(`${friend.gameName}#${friend.gameTag}`)
  if (friend.puuid) keys.add(`puuid:${friend.puuid}`)

  return [...keys]
}

function isTftStatus(friend: ChatFriend): boolean {
  return friend.lol?.gameMode === 'TFT' || friend.lol?.gameQueueType?.includes('TFT') || friend.lol?.iconOverride === 'companion'
}

function buildFriendStatusInfo(friend: ChatFriend): EnhancedFriendStatusInfo | null {
  const gameId = Number(friend.lol?.gameId || 0)
  const startedAt = Number(friend.lol?.timeStamp || 0)
  const queueId = Number(friend.lol?.queueId || 0)
  const gameStatus = friend.lol?.gameStatus

  if (!gameId || !startedAt || gameStatus !== 'inGame') {
    return null
  }

  const isTft = isTftStatus(friend)
  return {
    displayName: getFriendDisplayName(friend),
    startedAt,
    queueId,
    fallbackQueueName: friend.lol?.gameQueueType || friend.lol?.gameMode || 'Đang trong trận',
    isTft,
  }
}

async function refreshEnhancedFriendStatusMap(retries = 5) {
  if (enhancedFriendStatusRefreshInFlight) return enhancedFriendStatusRefreshInFlight

  enhancedFriendStatusRefreshInFlight = doRefreshEnhancedFriendStatusMap(retries)
    .finally(() => {
      enhancedFriendStatusRefreshInFlight = null
    })

  return enhancedFriendStatusRefreshInFlight
}

async function doRefreshEnhancedFriendStatusMap(retries = 5) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const friends = await lcu.getFriends()
      if (!enhancedFriendStatusRegistered) return

      const nextMap = new Map<string, EnhancedFriendStatusInfo>()
      for (const friend of friends) {
        const info = buildFriendStatusInfo(friend)
        if (!info) continue

        for (const key of getFriendStatusKeys(friend)) {
          nextMap.set(key, info)
        }
      }

      enhancedFriendStatusMap = nextMap
      logger.info('[FriendStatus] Làm mới trạng thái bạn bè đang trong trận → %d mục chỉ mục (attempt %d)', nextMap.size, attempt)
      tryInjectEnhancedFriendStatus()
      return
    } catch (err) {
      if (attempt < retries) {
        await sleep(2000)
      } else {
        logger.error('[FriendStatus] Truy vấn trạng thái bạn bè thất bại:', err)
      }
    }
  }
}

function scheduleEnhancedFriendStatusRefresh(delay = 250) {
  if (!enhancedFriendStatusRegistered) return

  if (enhancedFriendStatusRefreshTimer != null) {
    window.clearTimeout(enhancedFriendStatusRefreshTimer)
  }

  enhancedFriendStatusRefreshTimer = window.setTimeout(() => {
    enhancedFriendStatusRefreshTimer = null
    void refreshEnhancedFriendStatusMap(0)
  }, delay)
}

function formatDuration(startedAt: number): string {
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000))
  const minutes = Math.floor(elapsedSeconds / 60)
  const seconds = elapsedSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatStatusText(info: EnhancedFriendStatusInfo): string {
  const queueName = info.queueId > 0 ? getQueueName(info.queueId) : info.fallbackQueueName
  return `${queueName} · ${formatDuration(info.startedAt)}`
}

function getMemberStatusInfo(member: HTMLElement): EnhancedFriendStatusInfo | null {
  const name = member.querySelector('.member-name')?.textContent?.trim()
  if (!name) return null

  return enhancedFriendStatusMap.get(name) ?? null
}

function restoreStatusMessage(statusEl: HTMLElement) {
  if (!statusEl.hasAttribute(SONA_FRIEND_STATUS_ATTR)) return

  const original = statusEl.getAttribute(SONA_FRIEND_STATUS_ORIGINAL_ATTR)
  if (original != null) {
    statusEl.innerText = original
  }
  statusEl.removeAttribute(SONA_FRIEND_STATUS_ATTR)
  statusEl.removeAttribute(SONA_FRIEND_STATUS_ORIGINAL_ATTR)
}

function tryInjectEnhancedFriendStatus(): boolean {
  const container = document.querySelector('.lol-social-lower-pane-container')
  if (!container) return true

  const allMembers = container.querySelectorAll('[class*="lol-social-roster-member"]')
  if (allMembers.length === 0) return true

  allMembers.forEach((member) => {
    const el = member as HTMLElement
    const statusEl = el.querySelector('span.status-message') as HTMLElement | null
    if (!statusEl) return

    const info = getMemberStatusInfo(el)
    if (!info) {
      restoreStatusMessage(statusEl)
      return
    }

    if (!statusEl.hasAttribute(SONA_FRIEND_STATUS_ATTR)) {
      statusEl.setAttribute(SONA_FRIEND_STATUS_ORIGINAL_ATTR, statusEl.innerText)
      statusEl.setAttribute(SONA_FRIEND_STATUS_ATTR, 'true')
    }

    statusEl.innerText = formatStatusText(info)
  })

  return true
}

function startEnhancedFriendStatusTick() {
  if (enhancedFriendStatusTickTimer != null) return

  enhancedFriendStatusTickTimer = window.setInterval(() => {
    if (!enhancedFriendStatusRegistered) return
    tryInjectEnhancedFriendStatus()
  }, 1000)
}

function stopEnhancedFriendStatusTick() {
  if (enhancedFriendStatusTickTimer != null) {
    window.clearInterval(enhancedFriendStatusTickTimer)
    enhancedFriendStatusTickTimer = null
  }
}

export function updateEnhancedFriendGameStatus(enabled: boolean) {
  if (enabled && !enhancedFriendStatusRegistered) {
    enhancedFriendStatusRegistered = true

    injector.register(tryInjectEnhancedFriendStatus)
    enhancedFriendStatusInjected = true
    startEnhancedFriendStatusTick()

    enhancedFriendStatusUnsub = lcu.observe(FRIENDS_URI, () => {
      scheduleEnhancedFriendStatusRefresh()
    })

    void refreshEnhancedFriendStatusMap().then(() => {
      if (enhancedFriendStatusRegistered) {
        logger.info('Enhanced friend game status enabled ✓')
      }
    })
  } else if (!enabled && enhancedFriendStatusRegistered) {
    if (enhancedFriendStatusInjected) {
      injector.unregister(tryInjectEnhancedFriendStatus)
      enhancedFriendStatusInjected = false
    }
    if (enhancedFriendStatusUnsub) {
      enhancedFriendStatusUnsub()
      enhancedFriendStatusUnsub = null
    }
    if (enhancedFriendStatusRefreshTimer != null) {
      window.clearTimeout(enhancedFriendStatusRefreshTimer)
      enhancedFriendStatusRefreshTimer = null
    }
    stopEnhancedFriendStatusTick()

    enhancedFriendStatusRegistered = false
    enhancedFriendStatusMap.clear()

    document.querySelectorAll(`[${SONA_FRIEND_STATUS_ATTR}]`).forEach((node) => {
      restoreStatusMessage(node as HTMLElement)
    })

    logger.info('Enhanced friend game status disabled')
  }
}

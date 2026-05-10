import { logger } from '@/index'
import { lcu } from '@/lib/lcu'
import { injector } from '@/lib/InjectorManager'
import { sleep } from '@/lib/utils'

// ==================== 好友智能分组 ====================

const SONA_FRIEND_GROUP_ATTR = 'data-sona-friend-group'
const SONA_FRIEND_CHECKED_ATTR = 'data-sona-friend-checked'
const FRIENDS_URI = '/lol-chat/v1/friends'

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
let friendRefreshTimer: number | null = null
let friendRefreshInFlight: Promise<void> | null = null

function getGameColor(gameId: string): string {
  if (!gameColorMap.has(gameId)) {
    gameColorMap.set(gameId, GAME_COLORS[colorIndex % GAME_COLORS.length])
    colorIndex++
  }
  return gameColorMap.get(gameId)!
}

/** 异步查询所有好友的游戏状态，建立 name → gameInfo 映射（带重试） */
async function refreshFriendInfoMap(retries = 5) {
  if (friendRefreshInFlight) return friendRefreshInFlight

  friendRefreshInFlight = doRefreshFriendInfoMap(retries)
    .finally(() => {
      friendRefreshInFlight = null
    })

  return friendRefreshInFlight
}

async function doRefreshFriendInfoMap(retries = 5) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const friends = await lcu.getFriends()
      if (!friendSmartGroupRegistered) return

      const newMap = new Map<string, { gameId: number; gameStatus: string }>()

      for (const f of friends) {
        const name = f.gameName || f.name
        if (!name) continue

        // lol.gameId / lol.gameStatus 是字符串形式，需要转 number
        // （XMPP presence 字段约定所有值都是 string）
        const gameIdStr = f.lol?.gameId
        const gameId = gameIdStr ? Number(gameIdStr) : 0
        const gameStatus = f.lol?.gameStatus ?? ''

        if (gameId > 0 && gameStatus && gameStatus !== 'outOfGame') {
          newMap.set(name, { gameId, gameStatus })
        }
      }

      friendInfoMap = newMap
      logger.info('[FriendGroup] 刷新好友游戏状态 → %d 人在游戏中 (attempt %d)', newMap.size, attempt)
      tryInjectFriendSmartGroup()
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

function scheduleFriendInfoRefresh(delay = 250) {
  if (!friendSmartGroupRegistered) return

  if (friendRefreshTimer != null) {
    window.clearTimeout(friendRefreshTimer)
  }

  friendRefreshTimer = window.setTimeout(() => {
    friendRefreshTimer = null
    void refreshFriendInfoMap(0)
  }, delay)
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
let friendSmartGroupInjected = false
let friendSmartGroupUnsub: (() => void) | null = null

export function updateFriendSmartGroup(enabled: boolean) {
  if (enabled && !friendSmartGroupRegistered) {
    friendSmartGroupRegistered = true

    injector.register(tryInjectFriendSmartGroup)
    friendSmartGroupInjected = true

    friendSmartGroupUnsub = lcu.observe(FRIENDS_URI, () => {
      scheduleFriendInfoRefresh()
    })

    void refreshFriendInfoMap().then(() => {
      if (friendSmartGroupRegistered) {
        logger.info('Friend smart group enabled ✓')
      }
    })
  } else if (!enabled && friendSmartGroupRegistered) {
    if (friendSmartGroupInjected) {
      injector.unregister(tryInjectFriendSmartGroup)
      friendSmartGroupInjected = false
    }
    if (friendSmartGroupUnsub) {
      friendSmartGroupUnsub()
      friendSmartGroupUnsub = null
    }
    if (friendRefreshTimer != null) {
      window.clearTimeout(friendRefreshTimer)
      friendRefreshTimer = null
    }
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

import { injector } from '@/lib/InjectorManager'
import { logger } from '@/index'
import { lcu } from '@/lib/lcu'
import { resolvePluginAssetUrl } from '@/lib/plugin-resolver'
import { getSonaAvatarUrls, uploadSonaAvatar } from '@/lib/sona-service'
import { store } from '@/lib/store'
import { translate } from '@/i18n'
import type { ChatFriend } from '@/lib/lcu'

const OWN_SOCIAL_AVATAR_SELECTOR = '.lol-social-avatar.identity-icon img.icon-image'
const FRIEND_ROSTER_SCROLL_SELECTOR = '.roster-scrollable.ember-view'
const FRIEND_MEMBER_AVATAR_SELECTOR = '.lol-social-avatar.member-icon img.icon-image'
const REGALIA_PARTY_ANY_HOST_SELECTOR = 'lol-regalia-parties-v2-element'
const REGALIA_HOVERCARD_HOST_SELECTOR = 'lol-regalia-hovercard-v2-element'
const REGALIA_PROFILE_HOST_SELECTOR = 'lol-regalia-profile-v2-element'
const REGALIA_AVATAR_SELECTOR = 'lol-regalia-crest-v2-element'
const REGALIA_PROFILE_AVATAR_SELECTOR = 'lol-regalia-crest-v2-element.regalia-profile-crest-element'
const PROFILE_ICON_ATTR = 'profile-icon-url'
const MEMBER_TYPE_ATTR = 'member-type'
const PUUID_ATTR = 'puuid'
const DATA_PUUID_ATTR = 'data-puuid'
const SOCIAL_MEMBER_SELECTOR = '[class*="lol-social-roster-member"]'
const SOCIAL_MEMBER_NAME_SELECTOR = '.member-name'
const FRIENDS_URI = '/lol-chat/v1/friends'

let customAvatarRegistered = false
let customAvatarObserver: MutationObserver | null = null
let customAvatarRaf = 0
let ownPuuidCache = ''
let ownPuuidPromise: Promise<string> | null = null
let friendPuuidMapPromise: Promise<void> | null = null
let friendPuuidMapUpdatedAt = 0
let friendAvatarUnsub: (() => void) | null = null
let friendAvatarRefreshTimer: number | null = null
const friendImageObservers = new Map<HTMLImageElement, MutationObserver>()
const regaliaElementObservers = new Map<Element, MutationObserver>()
const regaliaPartyHostObservers = new Map<Element, MutationObserver>()
const regaliaHovercardHostObservers = new Map<Element, MutationObserver>()
const regaliaShadowRootObservers = new Map<ShadowRoot, MutationObserver>()

const patchedFriendImages = new Set<HTMLImageElement>()
const patchedRegaliaElements = new Set<Element>()
const originalFriendImageSrc = new WeakMap<HTMLImageElement, string | null>()
const originalRegaliaProfileIconUrl = new WeakMap<Element, string | null>()
const patchedFriendImagePuuid = new WeakMap<HTMLImageElement, string>()
const patchedRegaliaElementPuuid = new WeakMap<Element, string>()
const remoteAvatarCache = new Map<string, string | null>(
  Object.entries(store.get('customAvatarRemoteCache')),
)
const friendPuuidByName = new Map<string, string>()
const knownFriendPuuids = new Set<string>()

function getAssetUrl(assetPath: string): string {
  return resolvePluginAssetUrl(assetPath)
}

function getCurrentAvatarUrl(): string {
  const [assetPath] = store.get('customAvatarAssetPaths')
  return assetPath ? getAssetUrl(assetPath) : ''
}

function normalizePuuid(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase()
}

function normalizeFriendNameKey(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase()
}

function getPuuidFromElement(element: Element | null): string {
  if (!element) return ''

  const direct = normalizePuuid(element.getAttribute(PUUID_ATTR) || element.getAttribute(DATA_PUUID_ATTR))
  if (direct) return direct

  const parent = element.closest(`[${PUUID_ATTR}], [${DATA_PUUID_ATTR}]`)
  return normalizePuuid(parent?.getAttribute(PUUID_ATTR) || parent?.getAttribute(DATA_PUUID_ATTR))
}

function getHostForElementInShadow(element: Element): Element | null {
  const root = element.getRootNode()
  return root instanceof ShadowRoot ? root.host : null
}

function getRegaliaElementPuuid(element: Element): string {
  const shadowHost = getHostForElementInShadow(element)
  const directHostPuuid = getPuuidFromElement(shadowHost)
  if (directHostPuuid) return directHostPuuid

  const profileHost = element.closest(REGALIA_PROFILE_HOST_SELECTOR)
  return getPuuidFromElement(profileHost)
}

function indexFriendPuuid(friend: ChatFriend) {
  const puuid = normalizePuuid(friend.puuid)
  if (!puuid) return

  const keys = [
    friend.gameName,
  ]

  keys.forEach((key) => {
    const normalized = normalizeFriendNameKey(key)
    if (normalized) friendPuuidByName.set(normalized, puuid)
  })
}

function getFriendImagePuuid(image: HTMLImageElement): string {
  const attrPuuid = getPuuidFromElement(image)
  if (attrPuuid) return attrPuuid

  const member = image.closest(SOCIAL_MEMBER_SELECTOR)
  const name = normalizeFriendNameKey(member?.querySelector(SOCIAL_MEMBER_NAME_SELECTOR)?.textContent)
  if (!name) return ''

  const cached = friendPuuidByName.get(name)
  if (cached) return cached

  return ''
}

interface FriendAvatarCandidate {
  image: HTMLImageElement
  memberName: string
  puuid: string
}

function queryFriendRosterMembers(): Element[] {
  const members = new Set<Element>()

  document
    .querySelectorAll(`${FRIEND_ROSTER_SCROLL_SELECTOR} ${SOCIAL_MEMBER_SELECTOR}`)
    .forEach((member) => members.add(member))

  document.querySelectorAll(FRIEND_ROSTER_SCROLL_SELECTOR).forEach((scrollRoot) => {
    scrollRoot.querySelectorAll('.ember-view').forEach((containerParent) => {
      const listContainer = containerParent.firstElementChild
      if (!listContainer) return

      Array.from(listContainer.children).forEach((card) => {
        const member = card.matches(SOCIAL_MEMBER_SELECTOR)
          ? card
          : card.querySelector(SOCIAL_MEMBER_SELECTOR)
        if (member) members.add(member)
      })
    })
  })

  return [...members]
}

function queryFriendAvatarCandidates(): FriendAvatarCandidate[] {
  return queryFriendRosterMembers().map((member) => {
    const memberName = member.querySelector(SOCIAL_MEMBER_NAME_SELECTOR)?.textContent?.trim() ?? ''
    const puuid = friendPuuidByName.get(normalizeFriendNameKey(memberName)) ?? ''
    const image = member.querySelector<HTMLImageElement>(FRIEND_MEMBER_AVATAR_SELECTOR)

    if (!image) return null
    return { image, memberName, puuid }
  }).filter((candidate): candidate is FriendAvatarCandidate => Boolean(candidate))
}

function persistRemoteAvatarCacheEntry(puuid: string, avatarUrl: string | null) {
  const current = { ...store.get('customAvatarRemoteCache') }
  if (avatarUrl) {
    current[puuid] = avatarUrl
  } else {
    delete current[puuid]
  }
  store.set('customAvatarRemoteCache', current)
}

function persistRemoteAvatarCacheEntries(avatarUrls: Record<string, string>, queriedPuuids: string[]) {
  const current = { ...store.get('customAvatarRemoteCache') }

  queriedPuuids.forEach((puuid) => {
    const avatarUrl = avatarUrls[puuid]
    if (avatarUrl) {
      remoteAvatarCache.set(puuid, avatarUrl)
      current[puuid] = avatarUrl
    } else {
      remoteAvatarCache.set(puuid, null)
      delete current[puuid]
    }
  })

  store.set('customAvatarRemoteCache', current)
}

async function syncRemoteAvatarsForPuuids(puuids: string[], reason: string) {
  const uniquePuuids = [...new Set(puuids.map(normalizePuuid).filter(Boolean))]
  if (uniquePuuids.length === 0) return

  logger.info('[CustomAvatarSync] 批量查询头像缓存：%s，共 %d 个 PUUID', reason, uniquePuuids.length)
  try {
    const avatarUrls = await getSonaAvatarUrls(uniquePuuids)
    persistRemoteAvatarCacheEntries(avatarUrls, uniquePuuids)
    logger.info('[CustomAvatarSync] 批量头像查询完成：命中 %d/%d', Object.keys(avatarUrls).length, uniquePuuids.length)
    scheduleApplyCustomAvatar()
  } catch (err) {
    logger.error('[CustomAvatarSync] 批量头像查询失败：%s', reason, err)
  }
}

function updateFriendPuuidIndexes(friends: ChatFriend[]): Set<string> {
  const nextPuuids = new Set<string>()
  friendPuuidByName.clear()

  friends.forEach((friend) => {
    const puuid = normalizePuuid(friend.puuid)
    if (puuid) nextPuuids.add(puuid)
    indexFriendPuuid(friend)
  })

  friendPuuidMapUpdatedAt = Date.now()
  scheduleApplyCustomAvatar()
  return nextPuuids
}

function getFriendFromWsData(data: unknown): ChatFriend | null {
  if (!data || typeof data !== 'object') return null

  const friend = data as ChatFriend
  return normalizePuuid(friend.puuid) ? friend : null
}

function refreshFriendAvatarCache(forceAll: boolean, reason: string) {
  if (friendPuuidMapPromise) return friendPuuidMapPromise

  friendPuuidMapPromise = lcu.getFriends()
    .then(async (friends) => {
      const nextPuuids = updateFriendPuuidIndexes(friends)
      const targetPuuids = forceAll
        ? [...nextPuuids]
        : [...nextPuuids].filter((puuid) => !knownFriendPuuids.has(puuid))

      knownFriendPuuids.clear()
      nextPuuids.forEach((puuid) => knownFriendPuuids.add(puuid))

      //logger.info('[CustomAvatarSync] 好友列表刷新：%s，好友 PUUID %d 个，待查询 %d 个', reason, nextPuuids.size, targetPuuids.length)
      await syncRemoteAvatarsForPuuids(targetPuuids, reason)
    })
    .catch((err) => {
      friendPuuidMapUpdatedAt = 0
      logger.error('[CustomAvatarSync] 刷新好友列表失败：%s', reason, err)
    })
    .finally(() => {
      friendPuuidMapPromise = null
    })

  return friendPuuidMapPromise
}

function scheduleFriendAvatarRefresh(reason: string, forceAll = false, delay = 500) {
  if (friendAvatarRefreshTimer != null) {
    window.clearTimeout(friendAvatarRefreshTimer)
  }

  friendAvatarRefreshTimer = window.setTimeout(() => {
    friendAvatarRefreshTimer = null
    void refreshFriendAvatarCache(forceAll, reason)
  }, delay)
}

function getAvatarUrlForPuuid(puuid: string): string | null | undefined {
  const normalizedPuuid = normalizePuuid(puuid)
  if (!normalizedPuuid) return null

  if (normalizedPuuid === getOwnPuuid()) {
    return getCurrentAvatarUrl() || null
  }

  if (remoteAvatarCache.has(normalizedPuuid)) {
    return remoteAvatarCache.get(normalizedPuuid)
  }

  return undefined
}

function getOwnPuuid(): string {
  if (ownPuuidCache) return ownPuuidCache

  ownPuuidPromise ??= lcu.getSummonerInfo()
    .then((summoner) => {
      ownPuuidCache = summoner.puuid.toLowerCase()
      scheduleApplyCustomAvatar()
      return ownPuuidCache
    })
    .catch(() => {
      ownPuuidPromise = null
      return ''
    })

  return ''
}

function observeFriendImage(image: HTMLImageElement) {
  if (friendImageObservers.has(image)) return

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.attributeName === 'src') {
        scheduleApplyCustomAvatar()
        return
      }
    }
  })

  observer.observe(image, {
    attributes: true,
    attributeFilter: ['src'],
  })
  friendImageObservers.set(image, observer)
}

function observeRegaliaAvatarElement(element: Element) {
  if (regaliaElementObservers.has(element)) return

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.attributeName === PROFILE_ICON_ATTR) {
        scheduleApplyCustomAvatar()
        return
      }
    }
  })

  observer.observe(element, {
    attributes: true,
    attributeFilter: [PROFILE_ICON_ATTR],
  })
  regaliaElementObservers.set(element, observer)
}

function observeRegaliaPartyHost(host: Element) {
  if (regaliaPartyHostObservers.has(host)) return

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.attributeName === MEMBER_TYPE_ATTR || mutation.attributeName === PUUID_ATTR || mutation.attributeName === DATA_PUUID_ATTR) {
        scheduleApplyCustomAvatar()
        return
      }
    }
  })

  observer.observe(host, {
    attributes: true,
    attributeFilter: [MEMBER_TYPE_ATTR, PUUID_ATTR, DATA_PUUID_ATTR],
  })
  regaliaPartyHostObservers.set(host, observer)
}

function observeRegaliaHovercardHost(host: Element) {
  if (regaliaHovercardHostObservers.has(host)) return

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.attributeName === PUUID_ATTR || mutation.attributeName === DATA_PUUID_ATTR) {
        scheduleApplyCustomAvatar()
        return
      }
    }
  })

  observer.observe(host, {
    attributes: true,
    attributeFilter: [PUUID_ATTR, DATA_PUUID_ATTR],
  })
  regaliaHovercardHostObservers.set(host, observer)
}

function restoreFriendAvatar(image: HTMLImageElement): boolean {
  if (!patchedFriendImages.has(image)) return false

  const original = originalFriendImageSrc.get(image)
  if (original == null) image.removeAttribute('src')
  else image.setAttribute('src', original)
  patchedFriendImages.delete(image)
  patchedFriendImagePuuid.delete(image)
  return true
}

function patchFriendAvatar(image: HTMLImageElement, avatarUrl: string, puuid: string): boolean {
  observeFriendImage(image)

  if (!originalFriendImageSrc.has(image)) {
    originalFriendImageSrc.set(image, image.getAttribute('src'))
  }

  if (image.getAttribute('src') === avatarUrl) return false

  image.setAttribute('src', avatarUrl)
  patchedFriendImages.add(image)
  patchedFriendImagePuuid.set(image, puuid)
  return true
}

function restoreRegaliaAvatar(element: Element): boolean {
  if (!patchedRegaliaElements.has(element)) return false

  const original = originalRegaliaProfileIconUrl.get(element)
  if (original == null) element.removeAttribute(PROFILE_ICON_ATTR)
  else element.setAttribute(PROFILE_ICON_ATTR, original)
  ;(element as unknown as { profileIconUrl?: string }).profileIconUrl = original ?? ''
  patchedRegaliaElements.delete(element)
  patchedRegaliaElementPuuid.delete(element)
  return true
}

function patchRegaliaAvatar(element: Element, avatarUrl: string, puuid: string): boolean {
  observeRegaliaAvatarElement(element)

  if (!originalRegaliaProfileIconUrl.has(element)) {
    originalRegaliaProfileIconUrl.set(element, element.getAttribute(PROFILE_ICON_ATTR))
  }

  if (element.getAttribute(PROFILE_ICON_ATTR) === avatarUrl) return false

  element.setAttribute(PROFILE_ICON_ATTR, avatarUrl)
  ;(element as unknown as { profileIconUrl?: string }).profileIconUrl = avatarUrl
  patchedRegaliaElements.add(element)
  patchedRegaliaElementPuuid.set(element, puuid)
  return true
}

function observeRegaliaShadowRoot(shadowRoot: ShadowRoot) {
  if (regaliaShadowRootObservers.has(shadowRoot)) return

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' || mutation.attributeName === PROFILE_ICON_ATTR) {
        scheduleApplyCustomAvatar()
        return
      }
    }
  })

  observer.observe(shadowRoot, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [PROFILE_ICON_ATTR],
  })

  regaliaShadowRootObservers.set(shadowRoot, observer)
}

interface RegaliaAvatarCandidate {
  element: Element
  puuid: string
}

function queryRegaliaAvatarElements(): RegaliaAvatarCandidate[] {
  const candidates = new Map<Element, RegaliaAvatarCandidate>()

  const addCandidate = (element: Element, puuid: string) => {
    const normalizedPuuid = normalizePuuid(puuid)
    if (!normalizedPuuid) return
    candidates.set(element, { element, puuid: normalizedPuuid })
  }

  document.querySelectorAll(REGALIA_PROFILE_AVATAR_SELECTOR).forEach((element) => {
    addCandidate(element, getRegaliaElementPuuid(element))
  })

  document.querySelectorAll<HTMLElement>(REGALIA_PARTY_ANY_HOST_SELECTOR).forEach((host) => {
    observeRegaliaPartyHost(host)
    const hostPuuid = getPuuidFromElement(host)
    if (!hostPuuid) return

    const shadowRoot = host.shadowRoot
    if (!shadowRoot) return

    observeRegaliaShadowRoot(shadowRoot)
    shadowRoot.querySelectorAll(REGALIA_AVATAR_SELECTOR).forEach((element) => {
      addCandidate(element, hostPuuid)
    })
  })

  document.querySelectorAll<HTMLElement>(REGALIA_HOVERCARD_HOST_SELECTOR).forEach((host) => {
    observeRegaliaHovercardHost(host)
    const hostPuuid = getPuuidFromElement(host)
    if (!hostPuuid) return

    const shadowRoot = host.shadowRoot
    if (!shadowRoot) return

    observeRegaliaShadowRoot(shadowRoot)
    shadowRoot.querySelectorAll(REGALIA_AVATAR_SELECTOR).forEach((element) => {
      addCandidate(element, hostPuuid)
    })
  })

  document.querySelectorAll<HTMLElement>(REGALIA_PROFILE_HOST_SELECTOR).forEach((host) => {
    observeRegaliaHovercardHost(host)
    const hostPuuid = getPuuidFromElement(host)
    if (!hostPuuid) return

    const shadowRoot = host.shadowRoot
    if (!shadowRoot) return

    observeRegaliaShadowRoot(shadowRoot)
    shadowRoot.querySelectorAll(REGALIA_AVATAR_SELECTOR).forEach((element) => {
      addCandidate(element, hostPuuid)
    })
  })

  return [...candidates.values()]
}

function applyCustomAvatar(): boolean {
  let changed = false

  const ownPuuid = getOwnPuuid()
  const ownAvatarUrl = getCurrentAvatarUrl()
  if (ownPuuid && ownAvatarUrl) {
    document.querySelectorAll<HTMLImageElement>(OWN_SOCIAL_AVATAR_SELECTOR).forEach((image) => {
      changed = patchFriendAvatar(image, ownAvatarUrl, ownPuuid) || changed
    })
  }

  queryFriendAvatarCandidates().forEach(({ image, puuid }) => {
    if (!puuid) return

    const avatarUrl = getAvatarUrlForPuuid(puuid)
    if (avatarUrl) {
      const patched = patchFriendAvatar(image, avatarUrl, puuid)
      changed = patched || changed
    } else if (avatarUrl === null && patchedFriendImagePuuid.get(image) === puuid) {
      const restored = restoreFriendAvatar(image)
      changed = restored || changed
    }
  })

  queryRegaliaAvatarElements().forEach(({ element, puuid }) => {
    const avatarUrl = getAvatarUrlForPuuid(puuid)
    if (avatarUrl) {
      changed = patchRegaliaAvatar(element, avatarUrl, puuid) || changed
    } else if (avatarUrl === null && patchedRegaliaElementPuuid.get(element) === puuid) {
      changed = restoreRegaliaAvatar(element) || changed
    }
  })

  return changed || patchedFriendImages.size > 0 || patchedRegaliaElements.size > 0
}

function scheduleApplyCustomAvatar() {
  if (customAvatarRaf) return

  customAvatarRaf = requestAnimationFrame(() => {
    customAvatarRaf = 0
    applyCustomAvatar()
  })
}

function startCustomAvatarObserver() {
  if (customAvatarObserver) return

  customAvatarObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        scheduleApplyCustomAvatar()
        return
      }
    }
  })

  customAvatarObserver.observe(document.body, {
    childList: true,
    subtree: true,
  })
}

function restorePatchedAvatars() {
  Array.from(patchedFriendImages).forEach((image) => {
    restoreFriendAvatar(image)
  })
  patchedFriendImages.clear()

  Array.from(patchedRegaliaElements).forEach((element) => {
    restoreRegaliaAvatar(element)
  })
  patchedRegaliaElements.clear()
}

function enableCustomAvatar() {
  if (!customAvatarRegistered) {
    injector.register(applyCustomAvatar)
    customAvatarRegistered = true
  }

  startCustomAvatarObserver()
  if (!friendAvatarUnsub) {
    friendAvatarUnsub = lcu.observe(FRIENDS_URI, (event) => {
      const friend = getFriendFromWsData(event.data)
      const puuid = normalizePuuid(friend?.puuid)
      if (friend && puuid && !knownFriendPuuids.has(puuid)) {
        indexFriendPuuid(friend)
        knownFriendPuuids.add(puuid)
        logger.info('[CustomAvatarSync] 好友 WS 捕获新增 PUUID，直接查询单个头像：%s', puuid)
        void syncRemoteAvatarsForPuuids([puuid], 'friends-ws-direct')
        return
      }

      scheduleFriendAvatarRefresh('friends-ws-update')
    })
  }
  void refreshFriendAvatarCache(true, 'client-startup')
  applyCustomAvatar()
}

function disableCustomAvatar() {
  if (customAvatarRegistered) {
    injector.unregister(applyCustomAvatar)
    customAvatarRegistered = false
  }

  if (customAvatarObserver) {
    customAvatarObserver.disconnect()
    customAvatarObserver = null
  }
  friendImageObservers.forEach((observer) => observer.disconnect())
  friendImageObservers.clear()
  regaliaElementObservers.forEach((observer) => observer.disconnect())
  regaliaElementObservers.clear()
  regaliaPartyHostObservers.forEach((observer) => observer.disconnect())
  regaliaPartyHostObservers.clear()
  regaliaHovercardHostObservers.forEach((observer) => observer.disconnect())
  regaliaHovercardHostObservers.clear()
  regaliaShadowRootObservers.forEach((observer) => observer.disconnect())
  regaliaShadowRootObservers.clear()
  if (friendAvatarUnsub) {
    friendAvatarUnsub()
    friendAvatarUnsub = null
  }
  if (friendAvatarRefreshTimer != null) {
    window.clearTimeout(friendAvatarRefreshTimer)
    friendAvatarRefreshTimer = null
  }
  friendPuuidByName.clear()
  knownFriendPuuids.clear()
  friendPuuidMapPromise = null
  friendPuuidMapUpdatedAt = 0

  if (customAvatarRaf) {
    cancelAnimationFrame(customAvatarRaf)
    customAvatarRaf = 0
  }

  restorePatchedAvatars()
}

export function updateBeautifyCustomAvatar() {
  enableCustomAvatar()
}

export async function syncCustomAvatarAssetPath(assetPath: string) {
  const ownPuuid = getOwnPuuid() || await lcu.getSummonerInfo()
    .then((summoner) => {
      ownPuuidCache = normalizePuuid(summoner.puuid)
      return ownPuuidCache
    })

  if (!ownPuuid) {
    throw new Error('无法获取当前玩家 PUUID。')
  }

  const assetResponse = await fetch(getAssetUrl(assetPath))
  if (!assetResponse.ok) {
    throw new Error(`读取头像资源失败：${assetResponse.status} ${assetResponse.statusText}`)
  }

  const image = await assetResponse.blob()
  const avatarUrl = await uploadSonaAvatar(ownPuuid, image)
  remoteAvatarCache.set(ownPuuid, avatarUrl)
  persistRemoteAvatarCacheEntry(ownPuuid, avatarUrl)
  scheduleApplyCustomAvatar()
  await lcu.sendNotification(translate('notification.avatarSync.title'), translate('notification.avatarSync.details')).catch(() => {})

  return avatarUrl
}

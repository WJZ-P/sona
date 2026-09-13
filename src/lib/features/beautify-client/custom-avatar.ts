import { injector } from '@/lib/InjectorManager'
import { logger } from '@/index'
import { lcu, LcuEventUri } from '@/lib/lcu'
import { resolvePluginAssetUrl } from '@/lib/plugin-resolver'
import { store } from '@/lib/store'
import { translate } from '@/i18n'
import { uploadImageToHostingService } from '@/lib/image-hosting-service'
import {
  clearAvatarUrlFromStatusMessage,
  decodeAvatarStatusPayload,
  hasCurrentAvatarStatusPayload,
  stripAvatarStatusPayload,
  writeAvatarUrlToStatusMessage,
} from '@/lib/features/beautify-client/avatar-status-sync'
import { getPuuid } from '@/lib/assets'
import type { ChatFriend } from '@/lib/lcu'

const OWN_SOCIAL_AVATAR_SELECTOR = '.lol-social-avatar.identity-icon img.icon-image'
const FRIEND_ROSTER_SCROLL_SELECTOR = '.roster-scrollable.ember-view'
const FRIEND_MEMBER_AVATAR_SELECTOR = '.lol-social-avatar.member-icon img.icon-image'
const REGALIA_PARTY_ANY_HOST_SELECTOR = 'lol-regalia-parties-v2-element'
const REGALIA_HOVERCARD_HOST_SELECTOR = 'lol-regalia-hovercard-v2-element'
const REGALIA_PROFILE_HOST_SELECTOR = 'lol-regalia-profile-v2-element'
const REGALIA_AVATAR_SELECTOR = 'lol-regalia-crest-v2-element'
const REGALIA_PROFILE_AVATAR_SELECTOR = 'lol-regalia-crest-v2-element.regalia-profile-crest-element'
const REGALIA_SUMMONER_ICON_SELECTOR = '.lol-regalia-summoner-icon'
const TFT_SELF_CARD_SELECTOR = '.tft-player-card.tft-player-card-self'
const TFT_ICON_IMAGE_SELECTOR = '.icon-wrapper .icon-image'
const PROFILE_ICON_ATTR = 'profile-icon-url'
const MEMBER_TYPE_ATTR = 'member-type'
const PUUID_ATTR = 'puuid'
const DATA_PUUID_ATTR = 'data-puuid'
const VOICE_PUUID_ATTR = 'voice-puuid'
const SOCIAL_MEMBER_SELECTOR = 'lol-social-roster-member, [class*="lol-social-roster-member"]'
const SOCIAL_MEMBER_NAME_SELECTOR = '.member-name'
const SOCIAL_MEMBER_FRIEND_ID_ATTRS = ['data-friend-id', 'friend-id', 'data-id', 'id']
const FRIENDS_URI = '/lol-chat/v1/friends'
const LEGACY_IMAGE_HOSTS = new Set(['i.ibb.co', 'ibb.co'])
const REMOTE_AVATAR_LOAD_RETRY_DELAYS = [0, 350, 900]
const REMOTE_AVATAR_LOAD_TIMEOUT = 10_000

let customAvatarRegistered = false
let customAvatarObserver: MutationObserver | null = null
let customAvatarRaf = 0
let ownPuuidCache = ''
let ownPuuidPromise: Promise<string> | null = null
let friendPuuidMapPromise: Promise<void> | null = null
let friendPuuidMapUpdatedAt = 0
let friendAvatarUnsub: (() => void) | null = null
let ownStatusUnsub: (() => void) | null = null
let friendAvatarRefreshTimer: number | null = null
let ownStatusRestorePromise: Promise<void> | null = null
let legacyAvatarMigrationPromise: Promise<void> | null = null
let lastFriendAvatarScanSignature = ''
const friendImageObservers = new Map<HTMLImageElement, MutationObserver>()
const tftIconObservers = new Map<HTMLElement, MutationObserver>()
const regaliaElementObservers = new Map<Element, MutationObserver>()
const regaliaPartyHostObservers = new Map<Element, MutationObserver>()
const regaliaHovercardHostObservers = new Map<Element, MutationObserver>()
const regaliaShadowRootObservers = new Map<ShadowRoot, MutationObserver>()

const patchedFriendImages = new Set<HTMLImageElement>()
const patchedTftIcons = new Set<HTMLElement>()
const patchedRegaliaElements = new Set<Element>()
const originalFriendImageSrc = new WeakMap<HTMLImageElement, string | null>()
const originalFriendImageReferrerPolicy = new WeakMap<HTMLImageElement, string | null>()
const originalTftIconBackgroundImage = new WeakMap<HTMLElement, string | null>()
const originalRegaliaProfileIconUrl = new WeakMap<Element, string | null>()
const originalRegaliaSummonerIconBackgroundImage = new WeakMap<Element, string | null>()
const patchedFriendImagePuuid = new WeakMap<HTMLImageElement, string>()
const patchedRegaliaElementPuuid = new WeakMap<Element, string>()
const remoteAvatarCache = new Map<string, string | null>(
  Object.entries(store.get('customAvatarRemoteCache')),
)
const friendPuuidByName = new Map<string, string>()
const friendPuuidByChatId = new Map<string, string>()
const knownFriendPuuids = new Set<string>()

function getAssetUrl(assetPath: string): string {
  return resolvePluginAssetUrl(assetPath)
}

function loadRemoteAvatarOnce(avatarUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    let settled = false
    const timeout = window.setTimeout(() => {
      if (settled) return
      settled = true
      image.onload = null
      image.onerror = null
      reject(new Error('Hết thời gian tải ảnh đại diện từ xa'))
    }, REMOTE_AVATAR_LOAD_TIMEOUT)

    const finish = (error?: Error) => {
      if (settled) return
      settled = true
      window.clearTimeout(timeout)
      image.onload = null
      image.onerror = null
      if (error) reject(error)
      else resolve()
    }

    image.referrerPolicy = 'no-referrer'
    image.onload = () => finish()
    image.onerror = () => finish(new Error('Không thể tải ảnh đại diện từ liên kết trực tiếp'))
    image.src = avatarUrl
  })
}

async function assertRemoteAvatarLoadable(avatarUrl: string): Promise<void> {
  let lastError: unknown = null
  for (const delay of REMOTE_AVATAR_LOAD_RETRY_DELAYS) {
    if (delay > 0) await new Promise<void>((resolve) => window.setTimeout(resolve, delay))
    try {
      await loadRemoteAvatarOnce(avatarUrl)
      return
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Không thể tải ảnh đại diện từ liên kết trực tiếp')
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

function getDirectPuuidFromElement(element: Element | null): string {
  if (!element) return ''
  return normalizePuuid(element.getAttribute(PUUID_ATTR) || element.getAttribute(DATA_PUUID_ATTR))
}

function getVoicePuuidFromRegaliaAvatarElement(element: Element): string {
  return normalizePuuid(element.getAttribute(VOICE_PUUID_ATTR))
}

function isArenaVoiceRegaliaAvatarElement(element: Element): boolean {
  return !getDirectPuuidFromElement(element) && Boolean(getVoicePuuidFromRegaliaAvatarElement(element))
}

function getRegaliaAvatarCandidatePuuid(element: Element, fallbackPuuid = ''): string {
  const directPuuid = getDirectPuuidFromElement(element)
  if (directPuuid) return directPuuid

  const voicePuuid = getVoicePuuidFromRegaliaAvatarElement(element)
  if (voicePuuid) return voicePuuid

  return normalizePuuid(fallbackPuuid) || getRegaliaElementPuuid(element)
}

function indexFriendPuuid(friend: ChatFriend) {
  const puuid = normalizePuuid(friend.puuid)
  if (!puuid) return

  const chatId = normalizeFriendNameKey(friend.id)
  if (chatId) friendPuuidByChatId.set(chatId, puuid)

  const keys = [
    friend.gameName,
    friend.name,
    friend.gameName && friend.gameTag ? `${friend.gameName}#${friend.gameTag}` : '',
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
  if (!member) return ''
  for (const attributeName of SOCIAL_MEMBER_FRIEND_ID_ATTRS) {
    const friendId = normalizeFriendNameKey(member.getAttribute(attributeName))
    if (!friendId) continue

    const mapped = friendPuuidByChatId.get(friendId)
    if (mapped) return mapped

    if (friendId.endsWith('@pvp.net')) {
      const puuidFromChatId = normalizePuuid(friendId.slice(0, -'@pvp.net'.length))
      if (puuidFromChatId) return puuidFromChatId
    }
  }

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
    const image = member.querySelector<HTMLImageElement>(FRIEND_MEMBER_AVATAR_SELECTOR)
      || member.querySelector<HTMLImageElement>('.lol-social-avatar.member-icon img, .lol-social-avatar img.icon-image')

    if (!image) return null
    const puuid = getPuuidFromElement(member)
      || getFriendImagePuuid(image)
      || friendPuuidByName.get(normalizeFriendNameKey(memberName))
      || ''
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

function updateFriendPuuidIndexes(friends: ChatFriend[]): Set<string> {
  const nextPuuids = new Set<string>()
  friendPuuidByName.clear()
  friendPuuidByChatId.clear()

  friends.forEach((friend) => {
    const puuid = normalizePuuid(friend.puuid)
    if (puuid) nextPuuids.add(puuid)
    indexFriendPuuid(friend)
    updateRemoteAvatarFromFriendStatus(friend, true)
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

function getFriendStatusMessage(friend: ChatFriend): string {
  return friend.statusMessage || ''
}

function hasFriendStatusMessage(friend: ChatFriend): boolean {
  return 'statusMessage' in friend
}

function isFriendOffline(friend: ChatFriend): boolean {
  return friend.availability === 'offline'
}

function updateRemoteAvatarFromFriendStatus(friend: ChatFriend, allowClear: boolean): boolean {
  const puuid = normalizePuuid(friend.puuid)
  if (!puuid) return false
  if (!hasFriendStatusMessage(friend)) return false

  const avatarUrl = decodeAvatarStatusPayload(getFriendStatusMessage(friend))
  if (!avatarUrl) {
    // WS presence 事件可能只携带局部字段或瞬时空签名；只允许完整好友列表刷新清理缓存。
    if (!allowClear) return false
    // 离线好友的 presence 通常不携带签名。此时保留上次解析到的头像缓存，
    // 只有在线好友明确没有隐藏 URL 时，才认为对方取消了自定义头像。
    if (isFriendOffline(friend)) return false
    if (!remoteAvatarCache.has(puuid) && !store.get('customAvatarRemoteCache')[puuid]) return false

    remoteAvatarCache.delete(puuid)
    persistRemoteAvatarCacheEntry(puuid, null)
    return true
  }

  if (remoteAvatarCache.get(puuid) === avatarUrl) return false

  remoteAvatarCache.set(puuid, avatarUrl)
  persistRemoteAvatarCacheEntry(puuid, avatarUrl)
  return true
}

function getSavedOwnRemoteAvatarUrl(): string {
  const ownPuuid = getOwnPuuid()
  if (!ownPuuid) return ''

  const avatarUrl = remoteAvatarCache.get(ownPuuid) || store.get('customAvatarRemoteCache')[ownPuuid] || ''
  return typeof avatarUrl === 'string' ? avatarUrl : ''
}

function isLegacyImageHostingUrl(value: string): boolean {
  try {
    return LEGACY_IMAGE_HOSTS.has(new URL(value).hostname.toLowerCase())
  } catch {
    return false
  }
}

function getSavedOwnVisibleStatusMessage(): string {
  const savedStatusMessage = store.get('statusMessage')
  return stripAvatarStatusPayload(savedStatusMessage[getPuuid()] || savedStatusMessage[getOwnPuuid()] || '')
}

function shouldRestoreOwnAvatarStatus(statusMessage: string | null | undefined): boolean {
  if (store.get('customAvatarAssetPaths').length === 0) return false

  const savedAvatarUrl = getSavedOwnRemoteAvatarUrl()
  if (!savedAvatarUrl) return false

  return decodeAvatarStatusPayload(statusMessage) !== savedAvatarUrl
    || !hasCurrentAvatarStatusPayload(statusMessage, savedAvatarUrl)
}

function ensureOwnAvatarStatusPayload(statusMessage?: string | null) {
  if (ownStatusRestorePromise) return ownStatusRestorePromise

  const savedAvatarUrl = getSavedOwnRemoteAvatarUrl()
  if (!savedAvatarUrl) return Promise.resolve()
  if (isLegacyImageHostingUrl(savedAvatarUrl)) return Promise.resolve()

  ownStatusRestorePromise = (async () => {
    if (statusMessage !== undefined) {
      if (!shouldRestoreOwnAvatarStatus(statusMessage)) return
      await writeAvatarUrlToStatusMessage(savedAvatarUrl, getSavedOwnVisibleStatusMessage())
      return
    }

    const chatMe = await lcu.getChatMe()
    if (shouldRestoreOwnAvatarStatus(chatMe.statusMessage)) {
      await writeAvatarUrlToStatusMessage(savedAvatarUrl, getSavedOwnVisibleStatusMessage())
    }
  })()
    .catch((err) => {
      logger.warn('[CustomAvatarSync] Khôi phục thông tin đồng bộ ảnh đại diện trong tiểu sử thất bại:', err)
    })
    .finally(() => {
      ownStatusRestorePromise = null
    })

  return ownStatusRestorePromise
}

function migrateLegacyOwnAvatarIfNeeded() {
  if (legacyAvatarMigrationPromise) return legacyAvatarMigrationPromise

  const [assetPath] = store.get('customAvatarAssetPaths')
  if (!assetPath) return Promise.resolve()

  legacyAvatarMigrationPromise = (async () => {
    const ownPuuid = getOwnPuuid() || await lcu.getSummonerInfo()
      .then((summoner) => {
        ownPuuidCache = normalizePuuid(summoner.puuid)
        return ownPuuidCache
      })
    if (!ownPuuid) return

    const savedAvatarUrl = remoteAvatarCache.get(ownPuuid)
      || store.get('customAvatarRemoteCache')[ownPuuid]
      || ''
    if (!isLegacyImageHostingUrl(savedAvatarUrl)) return

    await syncCustomAvatarAssetPath(assetPath)
    logger.info('[CustomAvatarSync] Đã chuyển ảnh đại diện từ dịch vụ lưu ảnh cũ sang dịch vụ hiện tại.')
  })()
    .catch((err) => {
      logger.warn('[CustomAvatarSync] Chuyển ảnh đại diện từ dịch vụ lưu ảnh cũ thất bại:', err)
    })
    .finally(() => {
      legacyAvatarMigrationPromise = null
    })

  return legacyAvatarMigrationPromise
}

function refreshFriendAvatarCache(forceAll: boolean, reason: string) {
  if (friendPuuidMapPromise) return friendPuuidMapPromise

  friendPuuidMapPromise = lcu.getFriends()
    .then((friends) => {
      const nextPuuids = updateFriendPuuidIndexes(friends)
      const advertisedAvatarCount = friends.reduce(
        (count, friend) => count + (decodeAvatarStatusPayload(friend.statusMessage) ? 1 : 0),
        0,
      )

      knownFriendPuuids.clear()
      nextPuuids.forEach((puuid) => knownFriendPuuids.add(puuid))

      logger.info(
        '[CustomAvatarSync] Làm mới danh sách bạn bè: %s, %d PUUID bạn bè, %d có ảnh đại diện, forceAll=%s',
        reason,
        nextPuuids.size,
        advertisedAvatarCount,
        forceAll,
      )
    })
    .catch((err) => {
      friendPuuidMapUpdatedAt = 0
      logger.error('[CustomAvatarSync] Làm mới danh sách bạn bè thất bại: %s', reason, err)
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

function observeTftIcon(icon: HTMLElement) {
  if (tftIconObservers.has(icon)) return

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.attributeName === 'style') {
        scheduleApplyCustomAvatar()
        return
      }
    }
  })

  observer.observe(icon, {
    attributes: true,
    attributeFilter: ['style'],
  })
  tftIconObservers.set(icon, observer)
}

function queryTftSelfIcons(): HTMLElement[] {
  const icons: HTMLElement[] = []
  document.querySelectorAll(TFT_SELF_CARD_SELECTOR).forEach((card) => {
    card.querySelectorAll<HTMLElement>(TFT_ICON_IMAGE_SELECTOR).forEach((icon) => icons.push(icon))
  })
  return icons
}

function patchTftSelfAvatar(icon: HTMLElement, avatarUrl: string): boolean {
  observeTftIcon(icon)

  if (!originalTftIconBackgroundImage.has(icon)) {
    originalTftIconBackgroundImage.set(icon, icon.style.backgroundImage || null)
  }

  patchedTftIcons.add(icon)

  const nextBackgroundImage = toCssUrl(avatarUrl)
  if (icon.style.backgroundImage === nextBackgroundImage) return false

  icon.style.backgroundImage = nextBackgroundImage
  return true
}

function restoreTftSelfAvatar(icon: HTMLElement): boolean {
  if (!patchedTftIcons.has(icon)) return false

  const original = originalTftIconBackgroundImage.get(icon)
  icon.style.backgroundImage = original ?? ''
  originalTftIconBackgroundImage.delete(icon)
  patchedTftIcons.delete(icon)
  return true
}

function observeRegaliaAvatarElement(element: Element) {
  if (regaliaElementObservers.has(element)) return

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (
        mutation.attributeName === PROFILE_ICON_ATTR
        || mutation.attributeName === PUUID_ATTR
        || mutation.attributeName === DATA_PUUID_ATTR
        || mutation.attributeName === VOICE_PUUID_ATTR
      ) {
        scheduleApplyCustomAvatar()
        return
      }
    }
  })

  observer.observe(element, {
    attributes: true,
    attributeFilter: [PROFILE_ICON_ATTR, PUUID_ATTR, DATA_PUUID_ATTR, VOICE_PUUID_ATTR],
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
  const originalReferrerPolicy = originalFriendImageReferrerPolicy.get(image)
  if (originalReferrerPolicy == null) image.removeAttribute('referrerpolicy')
  else image.setAttribute('referrerpolicy', originalReferrerPolicy)
  patchedFriendImages.delete(image)
  patchedFriendImagePuuid.delete(image)
  return true
}

function patchFriendAvatar(image: HTMLImageElement, avatarUrl: string, puuid: string): boolean {
  observeFriendImage(image)

  if (!originalFriendImageSrc.has(image)) {
    originalFriendImageSrc.set(image, image.getAttribute('src'))
    originalFriendImageReferrerPolicy.set(image, image.getAttribute('referrerpolicy'))
  }

  let changed = false
  if (/^https?:\/\//i.test(avatarUrl) && image.getAttribute('referrerpolicy') !== 'no-referrer') {
    image.setAttribute('referrerpolicy', 'no-referrer')
    changed = true
  }
  if (image.getAttribute('src') === avatarUrl) return changed

  image.setAttribute('src', avatarUrl)
  patchedFriendImages.add(image)
  patchedFriendImagePuuid.set(image, puuid)
  return true
}

function restoreRegaliaAvatar(element: Element): boolean {
  if (!patchedRegaliaElements.has(element)) return false

  let changed = false

  if (originalRegaliaProfileIconUrl.has(element)) {
    const original = originalRegaliaProfileIconUrl.get(element)
    if (original == null) element.removeAttribute(PROFILE_ICON_ATTR)
    else element.setAttribute(PROFILE_ICON_ATTR, original)
    ;(element as unknown as { profileIconUrl?: string }).profileIconUrl = original ?? ''
    originalRegaliaProfileIconUrl.delete(element)
    changed = true
  }

  if (originalRegaliaSummonerIconBackgroundImage.has(element)) {
    const icon = getRegaliaSummonerIconElement(element)
    const original = originalRegaliaSummonerIconBackgroundImage.get(element)
    if (icon) icon.style.backgroundImage = original ?? ''
    originalRegaliaSummonerIconBackgroundImage.delete(element)
    changed = true
  }

  patchedRegaliaElements.delete(element)
  patchedRegaliaElementPuuid.delete(element)
  return changed
}

function patchRegaliaAvatar(element: Element, avatarUrl: string, puuid: string): boolean {
  observeRegaliaAvatarElement(element)

  if (isArenaVoiceRegaliaAvatarElement(element)) {
    return patchRegaliaArenaAvatar(element, avatarUrl, puuid)
  }

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

function getRegaliaSummonerIconElement(element: Element): HTMLElement | null {
  const shadowRoot = (element as HTMLElement).shadowRoot
  if (!shadowRoot) return null

  observeRegaliaShadowRoot(shadowRoot)
  return shadowRoot.querySelector<HTMLElement>(REGALIA_SUMMONER_ICON_SELECTOR)
}

function toCssUrl(value: string): string {
  return `url("${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}")`
}

function patchRegaliaArenaAvatar(element: Element, avatarUrl: string, puuid: string): boolean {
  const icon = getRegaliaSummonerIconElement(element)
  if (!icon) {
    requestAnimationFrame(scheduleApplyCustomAvatar)
    return false
  }

  if (!originalRegaliaSummonerIconBackgroundImage.has(element)) {
    originalRegaliaSummonerIconBackgroundImage.set(element, icon.style.backgroundImage || null)
  }

  const nextBackgroundImage = toCssUrl(avatarUrl)
  patchedRegaliaElements.add(element)
  patchedRegaliaElementPuuid.set(element, puuid)

  if (icon.style.backgroundImage === nextBackgroundImage) return false

  icon.style.backgroundImage = nextBackgroundImage
  return true
}

function observeRegaliaShadowRoot(shadowRoot: ShadowRoot) {
  if (regaliaShadowRootObservers.has(shadowRoot)) return

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (
        mutation.type === 'childList'
        || mutation.attributeName === PROFILE_ICON_ATTR
        || mutation.attributeName === PUUID_ATTR
        || mutation.attributeName === DATA_PUUID_ATTR
        || mutation.attributeName === VOICE_PUUID_ATTR
        || mutation.attributeName === 'style'
      ) {
        scheduleApplyCustomAvatar()
        return
      }
    }
  })

  observer.observe(shadowRoot, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [PROFILE_ICON_ATTR, PUUID_ATTR, DATA_PUUID_ATTR, VOICE_PUUID_ATTR, 'style'],
  })

  regaliaShadowRootObservers.set(shadowRoot, observer)
}

interface RegaliaAvatarCandidate {
  element: Element
  puuid: string
}

function queryRegaliaAvatarElements(): RegaliaAvatarCandidate[] {
  const candidates = new Map<Element, RegaliaAvatarCandidate>()
  const visitedRoots = new Set<ParentNode>()

  const addCandidate = (element: Element, puuid: string) => {
    const normalizedPuuid = normalizePuuid(puuid)
    if (!normalizedPuuid) return
    candidates.set(element, { element, puuid: normalizedPuuid })
  }

  const scanRoot = (root: ParentNode, fallbackPuuid = '') => {
    if (visitedRoots.has(root)) return
    visitedRoots.add(root)

    if (root instanceof ShadowRoot) {
      observeRegaliaShadowRoot(root)
    }

    root.querySelectorAll(REGALIA_AVATAR_SELECTOR).forEach((element) => {
      addCandidate(element, getRegaliaAvatarCandidatePuuid(element, fallbackPuuid))
    })

    root.querySelectorAll<HTMLElement>('*').forEach((host) => {
      const shadowRoot = host.shadowRoot
      if (!shadowRoot) return

      if (host.matches(REGALIA_PARTY_ANY_HOST_SELECTOR)) {
        observeRegaliaPartyHost(host)
      } else if (host.matches(REGALIA_HOVERCARD_HOST_SELECTOR) || host.matches(REGALIA_PROFILE_HOST_SELECTOR)) {
        observeRegaliaHovercardHost(host)
      }

      scanRoot(shadowRoot, getPuuidFromElement(host) || fallbackPuuid)
    })
  }

  document.querySelectorAll(`${REGALIA_AVATAR_SELECTOR}[${VOICE_PUUID_ATTR}]`).forEach((element) => {
    addCandidate(element, getRegaliaAvatarCandidatePuuid(element))
  })

  scanRoot(document)

  return [...candidates.values()]
}

function applyCustomAvatar(): boolean {
  let changed = false

  const ownPuuid = getOwnPuuid()
  const ownAvatarUrl = getCurrentAvatarUrl()
  if (ownPuuid) {
    if (ownAvatarUrl) {
      document.querySelectorAll<HTMLImageElement>(OWN_SOCIAL_AVATAR_SELECTOR).forEach((image) => {
        changed = patchFriendAvatar(image, ownAvatarUrl, ownPuuid) || changed
      })
    } else {
      changed = restoreOwnPatchedAvatars(ownPuuid) || changed
    }
  }

  queryTftSelfIcons().forEach((icon) => {
    if (ownAvatarUrl) {
      changed = patchTftSelfAvatar(icon, ownAvatarUrl) || changed
    } else {
      changed = restoreTftSelfAvatar(icon) || changed
    }
  })

  const friendCandidates = queryFriendAvatarCandidates()
  let mappedFriendCandidates = 0
  let matchedRemoteAvatars = 0
  friendCandidates.forEach(({ image, puuid }) => {
    if (!puuid) return
    mappedFriendCandidates++

    const avatarUrl = getAvatarUrlForPuuid(puuid)
    if (avatarUrl) {
      matchedRemoteAvatars++
      const patched = patchFriendAvatar(image, avatarUrl, puuid)
      changed = patched || changed
    } else if (avatarUrl === null && patchedFriendImagePuuid.get(image) === puuid) {
      const restored = restoreFriendAvatar(image)
      changed = restored || changed
    }
  })
  const friendScanSignature = `${friendCandidates.length}:${mappedFriendCandidates}:${matchedRemoteAvatars}:${patchedFriendImages.size}`
  if (friendScanSignature !== lastFriendAvatarScanSignature) {
    lastFriendAvatarScanSignature = friendScanSignature
    logger.debug(
      '[CustomAvatarSync] Quét thanh bạn bè: ứng viên=%d, PUUID đã ánh xạ=%d, ảnh đại diện khớp=%d, đã thay thế=%d',
      friendCandidates.length,
      mappedFriendCandidates,
      matchedRemoteAvatars,
      patchedFriendImages.size,
    )
  }

  queryRegaliaAvatarElements().forEach(({ element, puuid }) => {
    const avatarUrl = getAvatarUrlForPuuid(puuid)
    if (avatarUrl) {
      changed = patchRegaliaAvatar(element, avatarUrl, puuid) || changed
    } else if (avatarUrl === null && patchedRegaliaElementPuuid.get(element) === puuid) {
      changed = restoreRegaliaAvatar(element) || changed
    }
  })

  return changed || patchedFriendImages.size > 0 || patchedTftIcons.size > 0 || patchedRegaliaElements.size > 0
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

  Array.from(patchedTftIcons).forEach((icon) => {
    restoreTftSelfAvatar(icon)
  })
  patchedTftIcons.clear()

  Array.from(patchedRegaliaElements).forEach((element) => {
    restoreRegaliaAvatar(element)
  })
  patchedRegaliaElements.clear()
}

function restoreOwnPatchedAvatars(ownPuuid: string): boolean {
  const normalizedOwnPuuid = normalizePuuid(ownPuuid)
  if (!normalizedOwnPuuid) return false

  let changed = false
  Array.from(patchedFriendImages).forEach((image) => {
    if (patchedFriendImagePuuid.get(image) === normalizedOwnPuuid) {
      changed = restoreFriendAvatar(image) || changed
    }
  })
  Array.from(patchedRegaliaElements).forEach((element) => {
    if (patchedRegaliaElementPuuid.get(element) === normalizedOwnPuuid) {
      changed = restoreRegaliaAvatar(element) || changed
    }
  })

  return changed
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
      if (friend && updateRemoteAvatarFromFriendStatus(friend, false)) {
        scheduleApplyCustomAvatar()
      }
      if (friend && puuid && !knownFriendPuuids.has(puuid)) {
        indexFriendPuuid(friend)
        knownFriendPuuids.add(puuid)
        logger.info('[CustomAvatarSync] WS bạn bè phát hiện PUUID mới: %s', puuid)
      }

      scheduleFriendAvatarRefresh('friends-ws-update')
    })
  }
  if (!ownStatusUnsub) {
    ownStatusUnsub = lcu.observe(LcuEventUri.CHAT_ME, (event) => {
      const data = event.data as { statusMessage?: string | null } | null
      void ensureOwnAvatarStatusPayload(data?.statusMessage)
    })
  }
  void refreshFriendAvatarCache(true, 'client-startup')
  void ensureOwnAvatarStatusPayload()
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
  tftIconObservers.forEach((observer) => observer.disconnect())
  tftIconObservers.clear()
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
  if (ownStatusUnsub) {
    ownStatusUnsub()
    ownStatusUnsub = null
  }
  if (friendAvatarRefreshTimer != null) {
    window.clearTimeout(friendAvatarRefreshTimer)
    friendAvatarRefreshTimer = null
  }
  friendPuuidByName.clear()
  friendPuuidByChatId.clear()
  knownFriendPuuids.clear()
  lastFriendAvatarScanSignature = ''
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
  if (store.get('customAvatarAssetPaths').length === 0) {
    const ownPuuid = getOwnPuuid()
    if (ownPuuid) restoreOwnPatchedAvatars(ownPuuid)
    scheduleApplyCustomAvatar()
    void clearAvatarUrlFromStatusMessage().catch((err) => {
      logger.warn('[CustomAvatarSync] Xóa thông tin đồng bộ ảnh đại diện trong tiểu sử thất bại:', err)
    })
  } else {
    void migrateLegacyOwnAvatarIfNeeded()
    void ensureOwnAvatarStatusPayload()
  }
}

export async function syncCustomAvatarAssetPath(assetPath: string) {
  try {
    const ownPuuid = getOwnPuuid() || await lcu.getSummonerInfo()
      .then((summoner) => {
        ownPuuidCache = normalizePuuid(summoner.puuid)
        return ownPuuidCache
      })

    if (!ownPuuid) {
      throw new Error('Không thể lấy PUUID của người chơi hiện tại.')
    }

    const assetResponse = await fetch(getAssetUrl(assetPath))
    if (!assetResponse.ok) {
      throw new Error(`Đọc tài nguyên ảnh đại diện thất bại: ${assetResponse.status} ${assetResponse.statusText}`)
    }

    const image = await assetResponse.blob()
    const sourceFileName = assetPath.replace(/\\/g, '/').split('/').filter(Boolean).at(-1) || 'image.png'
    const avatarUrl = await uploadImageToHostingService(image, sourceFileName)
    await assertRemoteAvatarLoadable(avatarUrl)

    // CHAT_ME 的写入事件会触发 ensureOwnAvatarStatusPayload。必须先把目标 URL
    // 登记到缓存，否则监听器会拿旧 URL 把刚写入的新 payload 覆盖回去。
    const previousAvatarUrl = remoteAvatarCache.get(ownPuuid)
    remoteAvatarCache.set(ownPuuid, avatarUrl)
    persistRemoteAvatarCacheEntry(ownPuuid, avatarUrl)
    try {
      await writeAvatarUrlToStatusMessage(avatarUrl, getSavedOwnVisibleStatusMessage())
    } catch (error) {
      if (previousAvatarUrl) {
        remoteAvatarCache.set(ownPuuid, previousAvatarUrl)
        persistRemoteAvatarCacheEntry(ownPuuid, previousAvatarUrl)
      } else {
        remoteAvatarCache.delete(ownPuuid)
        persistRemoteAvatarCacheEntry(ownPuuid, null)
      }
      throw error
    }

    logger.info('[CustomAvatarSync] Đã thay thế payload ảnh đại diện mới và xác minh thành công bằng cách đọc lại sau độ trễ.')
    scheduleApplyCustomAvatar()
    await lcu.sendNotification(translate('notification.avatarSync.title'), translate('notification.avatarSync.details')).catch(() => {})

    return avatarUrl
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await lcu.sendNotification(
      translate('notification.avatarSyncFailed.title'),
      translate('notification.avatarSyncFailed.details', { error: message }),
    ).catch(() => {})
    throw err
  }
}

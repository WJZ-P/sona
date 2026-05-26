import { injector } from '@/lib/InjectorManager'
import { logger } from '@/index'
import { lcu, LcuEventUri } from '@/lib/lcu'
import { resolvePluginAssetUrl } from '@/lib/plugin-resolver'
import { store } from '@/lib/store'
import { translate } from '@/i18n'
import {
  clearAvatarUrlFromStatusMessage,
  decodeAvatarStatusPayload,
  stripAvatarStatusPayload,
  uploadAvatarToImgbb,
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
const PROFILE_ICON_ATTR = 'profile-icon-url'
const MEMBER_TYPE_ATTR = 'member-type'
const PUUID_ATTR = 'puuid'
const DATA_PUUID_ATTR = 'data-puuid'
const VOICE_PUUID_ATTR = 'voice-puuid'
const SOCIAL_MEMBER_SELECTOR = '[class*="lol-social-roster-member"]'
const SOCIAL_MEMBER_NAME_SELECTOR = '.member-name'
const FRIENDS_URI = '/lol-chat/v1/friends'
const AVATAR_OUTPUT_SIZE = 96
const FALLBACK_PROFILE_ICON_ID = 0
const DEFAULT_AVATAR_ADJUSTMENT = { scale: 1, offsetX: 0, offsetY: 0 }

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
let defaultProfileIconUrlPromise: Promise<string> | null = null
let localAvatarObjectUrl: string | null = null
let localAvatarCacheKey = ''
const localAvatarBuildPromises = new Map<string, Promise<string>>()
const failedLocalAvatarCacheKeys = new Set<string>()
const friendImageObservers = new Map<HTMLImageElement, MutationObserver>()
const regaliaElementObservers = new Map<Element, MutationObserver>()
const regaliaPartyHostObservers = new Map<Element, MutationObserver>()
const regaliaHovercardHostObservers = new Map<Element, MutationObserver>()
const regaliaShadowRootObservers = new Map<ShadowRoot, MutationObserver>()

const patchedFriendImages = new Set<HTMLImageElement>()
const patchedRegaliaElements = new Set<Element>()
const originalFriendImageSrc = new WeakMap<HTMLImageElement, string | null>()
const originalFriendImageStyle = new WeakMap<HTMLImageElement, {
  borderRadius: string
  objectFit: string
  objectPosition: string
}>()
const originalRegaliaProfileIconUrl = new WeakMap<Element, string | null>()
const originalRegaliaSummonerIconBackgroundImage = new WeakMap<Element, string | null>()
const originalRegaliaProfileIconProperty = new WeakMap<Element, string | null>()
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

function getProfileIconUrl(profileIconId: number): string {
  return `/lol-game-data/assets/v1/profile-icons/${profileIconId}.jpg`
}

function getDefaultProfileIconUrl(): Promise<string> {
  const fallbackProfileIconUrl = getProfileIconUrl(FALLBACK_PROFILE_ICON_ID)

  defaultProfileIconUrlPromise ??= lcu.getSummonerInfo()
    .then((summoner) => {
      ownPuuidCache = normalizePuuid(summoner.puuid)
      return summoner.profileIconId ? getProfileIconUrl(summoner.profileIconId) : fallbackProfileIconUrl
    })
    .catch((err) => {
      defaultProfileIconUrlPromise = null
      logger.warn('[CustomAvatarSync] 获取默认头像失败:', err)
      return fallbackProfileIconUrl
    })

  return defaultProfileIconUrlPromise
}

function getCurrentAvatarAssetPath(): string {
  const assetPaths = store.get('customAvatarAssetPaths')
  const activePath = store.get('customAvatarActiveAssetPath')
  return activePath && assetPaths.includes(activePath) ? activePath : assetPaths[0] ?? ''
}

function getAvatarAdjustment(assetPath: string) {
  return store.get('customAvatarAdjustments')[assetPath] ?? DEFAULT_AVATAR_ADJUSTMENT
}

function getLocalAvatarCacheKey(assetPath: string): string {
  const adjustment = getAvatarAdjustment(assetPath)
  return `${assetPath}:${adjustment.scale}:${adjustment.offsetX}:${adjustment.offsetY}`
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function getAvatarOffsetLimit(imageWidth: number, imageHeight: number, scale: number) {
  const aspectRatio = imageWidth / imageHeight
  const coverWidthRatio = (aspectRatio >= 1 ? aspectRatio : 1) * scale
  const coverHeightRatio = (aspectRatio >= 1 ? 1 : 1 / aspectRatio) * scale

  return {
    maxOffsetX: Math.max(0, ((coverWidthRatio - 1) / 2) * 100),
    maxOffsetY: Math.max(0, ((coverHeightRatio - 1) / 2) * 100),
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    image.src = src
  })
}

async function loadImageFromAsset(assetPath: string): Promise<HTMLImageElement> {
  const response = await fetch(getAssetUrl(assetPath))
  if (!response.ok) {
    throw new Error(`Failed to load avatar asset: ${response.status} ${response.statusText}`)
  }

  const objectUrl = URL.createObjectURL(await response.blob())
  try {
    return await loadImage(objectUrl)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export async function createCustomAvatarImageBlob(assetPath: string): Promise<Blob> {
  const adjustment = getAvatarAdjustment(assetPath)
  const image = await loadImageFromAsset(assetPath)
  const canvas = document.createElement('canvas')
  canvas.width = AVATAR_OUTPUT_SIZE
  canvas.height = AVATAR_OUTPUT_SIZE
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Unable to create avatar canvas.')

  const baseSize = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight)
  const drawWidth = image.naturalWidth * baseSize * adjustment.scale
  const drawHeight = image.naturalHeight * baseSize * adjustment.scale
  const { maxOffsetX, maxOffsetY } = getAvatarOffsetLimit(image.naturalWidth, image.naturalHeight, adjustment.scale)
  const offsetX = clampNumber(adjustment.offsetX, -maxOffsetX, maxOffsetX)
  const offsetY = clampNumber(adjustment.offsetY, -maxOffsetY, maxOffsetY)
  const drawX = (canvas.width - drawWidth) / 2 + (offsetX / 100) * canvas.width
  const drawY = (canvas.height - drawHeight) / 2 + (offsetY / 100) * canvas.height
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.drawImage(image, drawX, drawY, drawWidth, drawHeight)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result)
      else reject(new Error('Unable to export avatar canvas.'))
    }, 'image/png')
  })
}

function clearLocalAvatarObjectUrl() {
  if (localAvatarObjectUrl) {
    URL.revokeObjectURL(localAvatarObjectUrl)
    localAvatarObjectUrl = null
  }
  localAvatarCacheKey = ''
}

function buildLocalAvatarUrl(assetPath: string, cacheKey: string): Promise<string> {
  if (failedLocalAvatarCacheKeys.has(cacheKey)) return Promise.resolve(localAvatarObjectUrl ?? '')

  const existingPromise = localAvatarBuildPromises.get(cacheKey)
  if (existingPromise) return existingPromise

  const buildPromise = createCustomAvatarImageBlob(assetPath)
    .then((blob) => {
      if (!store.get('customAvatarMode')) return ''
      if (getCurrentAvatarAssetPath() !== assetPath) return ''
      if (getLocalAvatarCacheKey(assetPath) !== cacheKey) return ''

      clearLocalAvatarObjectUrl()
      localAvatarObjectUrl = URL.createObjectURL(blob)
      localAvatarCacheKey = cacheKey
      failedLocalAvatarCacheKeys.delete(cacheKey)
      return localAvatarObjectUrl
    })
    .catch((err) => {
      failedLocalAvatarCacheKeys.add(cacheKey)
      logger.warn('[CustomAvatarSync] 生成本地裁切头像失败:', err)
      return localAvatarObjectUrl ?? ''
    })
    .finally(() => {
      localAvatarBuildPromises.delete(cacheKey)
      if (getCurrentAvatarAssetPath() === assetPath && getLocalAvatarCacheKey(assetPath) === cacheKey && !failedLocalAvatarCacheKeys.has(cacheKey)) {
        scheduleApplyCustomAvatar()
      }
    })

  localAvatarBuildPromises.set(cacheKey, buildPromise)
  return buildPromise
}

function getCurrentAvatarUrl(): string {
  const assetPath = getCurrentAvatarAssetPath()
  if (!assetPath) return ''

  const cacheKey = getLocalAvatarCacheKey(assetPath)
  if (localAvatarObjectUrl && localAvatarCacheKey === cacheKey) {
    return localAvatarObjectUrl
  }

  void buildLocalAvatarUrl(assetPath, cacheKey)
  return localAvatarObjectUrl ?? ''
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

function updateFriendPuuidIndexes(friends: ChatFriend[]): Set<string> {
  const nextPuuids = new Set<string>()
  friendPuuidByName.clear()

  friends.forEach((friend) => {
    const puuid = normalizePuuid(friend.puuid)
    if (puuid) nextPuuids.add(puuid)
    indexFriendPuuid(friend)
    updateRemoteAvatarFromFriendStatus(friend)
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

function updateRemoteAvatarFromFriendStatus(friend: ChatFriend): boolean {
  const puuid = normalizePuuid(friend.puuid)
  if (!puuid) return false
  if (!hasFriendStatusMessage(friend)) return false

  const avatarUrl = decodeAvatarStatusPayload(getFriendStatusMessage(friend))
  if (!avatarUrl) {
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

function getSavedOwnVisibleStatusMessage(): string {
  const savedStatusMessage = store.get('statusMessage')
  return stripAvatarStatusPayload(savedStatusMessage[getPuuid()] || savedStatusMessage[getOwnPuuid()] || '')
}

function shouldRestoreOwnAvatarStatus(statusMessage: string | null | undefined): boolean {
  if (store.get('customAvatarAssetPaths').length === 0) return false

  const savedAvatarUrl = getSavedOwnRemoteAvatarUrl()
  if (!savedAvatarUrl) return false

  return decodeAvatarStatusPayload(statusMessage) !== savedAvatarUrl
}

function ensureOwnAvatarStatusPayload(statusMessage?: string | null) {
  if (ownStatusRestorePromise) return ownStatusRestorePromise

  const savedAvatarUrl = getSavedOwnRemoteAvatarUrl()
  if (!savedAvatarUrl) return Promise.resolve()

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
      logger.warn('[CustomAvatarSync] 恢复简介头像同步信息失败:', err)
    })
    .finally(() => {
      ownStatusRestorePromise = null
    })

  return ownStatusRestorePromise
}

function refreshFriendAvatarCache(forceAll: boolean, reason: string) {
  if (friendPuuidMapPromise) return friendPuuidMapPromise

  friendPuuidMapPromise = lcu.getFriends()
    .then((friends) => {
      const nextPuuids = updateFriendPuuidIndexes(friends)

      knownFriendPuuids.clear()
      nextPuuids.forEach((puuid) => knownFriendPuuids.add(puuid))

      logger.info('[CustomAvatarSync] 好友列表刷新：%s，好友 PUUID %d 个，forceAll=%s', reason, nextPuuids.size, forceAll)
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

  const originalStyle = originalFriendImageStyle.get(image)
  if (originalStyle) {
    image.style.objectFit = originalStyle.objectFit
    image.style.objectPosition = originalStyle.objectPosition
    image.style.borderRadius = originalStyle.borderRadius
    originalFriendImageStyle.delete(image)
  }

  patchedFriendImages.delete(image)
  patchedFriendImagePuuid.delete(image)
  return true
}

function patchFriendAvatar(image: HTMLImageElement, avatarUrl: string, puuid: string): boolean {
  observeFriendImage(image)

  if (!originalFriendImageSrc.has(image)) {
    originalFriendImageSrc.set(image, image.getAttribute('src'))
  }
  if (!originalFriendImageStyle.has(image)) {
    originalFriendImageStyle.set(image, {
      borderRadius: image.style.borderRadius,
      objectFit: image.style.objectFit,
      objectPosition: image.style.objectPosition,
    })
  }

  image.style.objectFit = 'cover'
  image.style.objectPosition = 'center'
  image.style.borderRadius = '50%'

  if (image.getAttribute('src') === avatarUrl) return false

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
    const regaliaElement = element as unknown as { profileIconUrl?: string }
    const originalProperty = originalRegaliaProfileIconProperty.get(element)
    if (original == null) element.removeAttribute(PROFILE_ICON_ATTR)
    else element.setAttribute(PROFILE_ICON_ATTR, original)
    if (originalProperty == null) {
      delete regaliaElement.profileIconUrl
    } else {
      regaliaElement.profileIconUrl = originalProperty
    }
    element.dispatchEvent(new CustomEvent('profile-icon-url-changed', { bubbles: true, composed: true }))
    originalRegaliaProfileIconUrl.delete(element)
    originalRegaliaProfileIconProperty.delete(element)
    changed = true
  }

  if (originalRegaliaSummonerIconBackgroundImage.has(element)) {
    const icon = getRegaliaSummonerIconElement(element, false)
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
    originalRegaliaProfileIconProperty.set(
      element,
      (element as unknown as { profileIconUrl?: string }).profileIconUrl ?? null,
    )
  }

  if (element.getAttribute(PROFILE_ICON_ATTR) === avatarUrl) return false

  element.setAttribute(PROFILE_ICON_ATTR, avatarUrl)
  ;(element as unknown as { profileIconUrl?: string }).profileIconUrl = avatarUrl
  patchedRegaliaElements.add(element)
  patchedRegaliaElementPuuid.set(element, puuid)
  return true
}

function getRegaliaSummonerIconElement(element: Element, shouldObserve = true): HTMLElement | null {
  const shadowRoot = (element as HTMLElement).shadowRoot
  if (!shadowRoot) return null

  if (shouldObserve) observeRegaliaShadowRoot(shadowRoot)
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

function queryRegaliaAvatarElements(shouldObserve = true): RegaliaAvatarCandidate[] {
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

    if (root instanceof ShadowRoot && shouldObserve) {
      observeRegaliaShadowRoot(root)
    }

    root.querySelectorAll(REGALIA_AVATAR_SELECTOR).forEach((element) => {
      addCandidate(element, getRegaliaAvatarCandidatePuuid(element, fallbackPuuid))
    })

    root.querySelectorAll<HTMLElement>('*').forEach((host) => {
      const shadowRoot = host.shadowRoot
      if (!shadowRoot) return

      if (shouldObserve && host.matches(REGALIA_PARTY_ANY_HOST_SELECTOR)) {
        observeRegaliaPartyHost(host)
      } else if (shouldObserve && (host.matches(REGALIA_HOVERCARD_HOST_SELECTOR) || host.matches(REGALIA_PROFILE_HOST_SELECTOR))) {
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

function patchRegaliaAvatarUrl(element: Element, avatarUrl: string) {
  element.setAttribute(PROFILE_ICON_ATTR, avatarUrl)
  ;(element as unknown as { profileIconUrl?: string }).profileIconUrl = avatarUrl
  element.dispatchEvent(new CustomEvent('profile-icon-url-changed', { bubbles: true, composed: true }))
}

function applyDefaultOwnAvatarUrl(defaultAvatarUrl: string): boolean {
  const ownPuuid = getOwnPuuid()
  if (!defaultAvatarUrl || !ownPuuid) return false

  let changed = false
  document.querySelectorAll<HTMLImageElement>(OWN_SOCIAL_AVATAR_SELECTOR).forEach((image) => {
    if (image.getAttribute('src') !== defaultAvatarUrl) {
      image.setAttribute('src', defaultAvatarUrl)
      changed = true
    }
    image.style.objectFit = 'cover'
    image.style.objectPosition = 'center'
    image.style.borderRadius = '50%'
  })

  queryRegaliaAvatarElements(false).forEach(({ element, puuid }) => {
    if (normalizePuuid(puuid) !== ownPuuid) return
    if (element.getAttribute(PROFILE_ICON_ATTR) !== defaultAvatarUrl) {
      patchRegaliaAvatarUrl(element, defaultAvatarUrl)
      changed = true
    }
  })

  return changed
}

function restorePatchedAvatarsToDefault() {
  restorePatchedAvatars()
  void getDefaultProfileIconUrl().then((defaultAvatarUrl) => {
    if (store.get('customAvatarMode')) return
    applyDefaultOwnAvatarUrl(defaultAvatarUrl)
  })
}

function restoreOwnAvatarsToDefault() {
  clearLocalAvatarObjectUrl()
  const ownPuuid = getOwnPuuid()
  if (ownPuuid) restoreOwnPatchedAvatars(ownPuuid)

  void getDefaultProfileIconUrl().then((defaultAvatarUrl) => {
    if (!store.get('customAvatarMode')) return
    if (getCurrentAvatarAssetPath()) return
    applyDefaultOwnAvatarUrl(defaultAvatarUrl)
  })
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
      if (friend && updateRemoteAvatarFromFriendStatus(friend)) {
        scheduleApplyCustomAvatar()
      }
      if (friend && puuid && !knownFriendPuuids.has(puuid)) {
        indexFriendPuuid(friend)
        knownFriendPuuids.add(puuid)
        logger.info('[CustomAvatarSync] 好友 WS 捕获新增 PUUID：%s', puuid)
        return
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
  knownFriendPuuids.clear()
  friendPuuidMapPromise = null
  friendPuuidMapUpdatedAt = 0

  if (customAvatarRaf) {
    cancelAnimationFrame(customAvatarRaf)
    customAvatarRaf = 0
  }

  restorePatchedAvatarsToDefault()
}

export function updateBeautifyCustomAvatar() {
  if (!store.get('customAvatarMode')) {
    clearLocalAvatarObjectUrl()
    disableCustomAvatar()
    void clearAvatarUrlFromStatusMessage().catch((err) => {
      logger.warn('[CustomAvatarSync] 清理简介头像同步信息失败:', err)
    })
    return
  }

  enableCustomAvatar()
  const currentAssetPath = getCurrentAvatarAssetPath()
  if (!currentAssetPath) {
    restoreOwnAvatarsToDefault()
    scheduleApplyCustomAvatar()
    void clearAvatarUrlFromStatusMessage().catch((err) => {
      logger.warn('[CustomAvatarSync] 清理简介头像同步信息失败:', err)
    })
  } else {
    getCurrentAvatarUrl()
    scheduleApplyCustomAvatar()
    void ensureOwnAvatarStatusPayload()
  }
}

export async function syncCustomAvatarAssetPath(assetPath: string, imageOverride?: Blob) {
  const ownPuuid = getOwnPuuid() || await lcu.getSummonerInfo()
    .then((summoner) => {
      ownPuuidCache = normalizePuuid(summoner.puuid)
      return ownPuuidCache
    })

  if (!ownPuuid) {
    throw new Error('无法获取当前玩家 PUUID。')
  }

  const assetResponse = imageOverride ? null : await fetch(getAssetUrl(assetPath))
  if (assetResponse && !assetResponse.ok) {
    throw new Error(`读取头像资源失败：${assetResponse.status} ${assetResponse.statusText}`)
  }

  const image = imageOverride ?? await assetResponse!.blob()
  const avatarUrl = await uploadAvatarToImgbb(image)
  remoteAvatarCache.set(ownPuuid, avatarUrl)
  persistRemoteAvatarCacheEntry(ownPuuid, avatarUrl)
  await writeAvatarUrlToStatusMessage(avatarUrl, getSavedOwnVisibleStatusMessage())
  scheduleApplyCustomAvatar()
  await lcu.sendNotification(translate('notification.avatarSync.title'), translate('notification.avatarSync.details')).catch(() => {})

  return avatarUrl
}

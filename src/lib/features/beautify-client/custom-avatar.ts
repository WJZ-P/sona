import { injector } from '@/lib/InjectorManager'
import { lcu } from '@/lib/lcu'
import { resolvePluginAssetUrl } from '@/lib/plugin-resolver'
import { store } from '@/lib/store'

const FRIEND_AVATAR_SELECTOR = 'lol-uikit-radial-progress img.icon-image'
const REGALIA_PARTY_ANY_HOST_SELECTOR = 'lol-regalia-parties-v2-element'
const REGALIA_PARTY_HOST_SELECTOR = 'lol-regalia-parties-v2-element[member-type="current-player"]'
const REGALIA_HOVERCARD_HOST_SELECTOR = 'lol-regalia-hovercard-v2-element'
const REGALIA_PROFILE_HOST_SELECTOR = 'lol-regalia-profile-v2-element'
const REGALIA_AVATAR_SELECTOR = 'lol-regalia-crest-v2-element'
const REGALIA_PROFILE_AVATAR_SELECTOR = 'lol-regalia-crest-v2-element.regalia-profile-crest-element'
const PROFILE_ICON_ATTR = 'profile-icon-url'
const MEMBER_TYPE_ATTR = 'member-type'
const PUUID_ATTR = 'puuid'

let customAvatarRegistered = false
let customAvatarObserver: MutationObserver | null = null
let customAvatarRaf = 0
let ownPuuidCache = ''
let ownPuuidPromise: Promise<string> | null = null
const friendImageObservers = new Map<HTMLImageElement, MutationObserver>()
const regaliaElementObservers = new Map<Element, MutationObserver>()
const regaliaPartyHostObservers = new Map<Element, MutationObserver>()
const regaliaHovercardHostObservers = new Map<Element, MutationObserver>()
const regaliaShadowRootObservers = new Map<ShadowRoot, MutationObserver>()

const patchedFriendImages = new Set<HTMLImageElement>()
const patchedRegaliaElements = new Set<Element>()
const originalFriendImageSrc = new WeakMap<HTMLImageElement, string | null>()
const originalRegaliaProfileIconUrl = new WeakMap<Element, string | null>()

function getAssetUrl(assetPath: string): string {
  return resolvePluginAssetUrl(assetPath)
}

function getCurrentAvatarUrl(): string {
  const [assetPath] = store.get('customAvatarAssetPaths')
  return assetPath ? getAssetUrl(assetPath) : ''
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

function isOwnPuuidHost(host: Element): boolean {
  const hostPuuid = host.getAttribute(PUUID_ATTR)?.toLowerCase()
  if (!hostPuuid) return false

  const ownPuuid = getOwnPuuid()
  if (!ownPuuid) return false

  return hostPuuid === ownPuuid
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
      if (mutation.attributeName === MEMBER_TYPE_ATTR) {
        scheduleApplyCustomAvatar()
        return
      }
    }
  })

  observer.observe(host, {
    attributes: true,
    attributeFilter: [MEMBER_TYPE_ATTR],
  })
  regaliaPartyHostObservers.set(host, observer)
}

function observeRegaliaHovercardHost(host: Element) {
  if (regaliaHovercardHostObservers.has(host)) return

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.attributeName === PUUID_ATTR) {
        scheduleApplyCustomAvatar()
        return
      }
    }
  })

  observer.observe(host, {
    attributes: true,
    attributeFilter: [PUUID_ATTR],
  })
  regaliaHovercardHostObservers.set(host, observer)
}

function patchFriendAvatar(image: HTMLImageElement, avatarUrl: string): boolean {
  observeFriendImage(image)

  if (!originalFriendImageSrc.has(image)) {
    originalFriendImageSrc.set(image, image.getAttribute('src'))
  }

  if (image.getAttribute('src') === avatarUrl) return false

  image.setAttribute('src', avatarUrl)
  patchedFriendImages.add(image)
  return true
}

function patchRegaliaAvatar(element: Element, avatarUrl: string): boolean {
  observeRegaliaAvatarElement(element)

  if (!originalRegaliaProfileIconUrl.has(element)) {
    originalRegaliaProfileIconUrl.set(element, element.getAttribute(PROFILE_ICON_ATTR))
  }

  if (element.getAttribute(PROFILE_ICON_ATTR) === avatarUrl) return false

  element.setAttribute(PROFILE_ICON_ATTR, avatarUrl)
  ;(element as unknown as { profileIconUrl?: string }).profileIconUrl = avatarUrl
  patchedRegaliaElements.add(element)
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

function queryRegaliaAvatarElements(): Element[] {
  const elements = new Set<Element>()

  document.querySelectorAll(REGALIA_PROFILE_AVATAR_SELECTOR).forEach((element) => {
    elements.add(element)
  })

  document.querySelectorAll<HTMLElement>(REGALIA_PARTY_ANY_HOST_SELECTOR).forEach((host) => {
    observeRegaliaPartyHost(host)
    if (!host.matches(REGALIA_PARTY_HOST_SELECTOR)) return

    const shadowRoot = host.shadowRoot
    if (!shadowRoot) return

    observeRegaliaShadowRoot(shadowRoot)
    shadowRoot.querySelectorAll(REGALIA_AVATAR_SELECTOR).forEach((element) => {
      elements.add(element)
    })
  })

  document.querySelectorAll<HTMLElement>(REGALIA_HOVERCARD_HOST_SELECTOR).forEach((host) => {
    observeRegaliaHovercardHost(host)
    if (!isOwnPuuidHost(host)) return

    const shadowRoot = host.shadowRoot
    if (!shadowRoot) return

    observeRegaliaShadowRoot(shadowRoot)
    shadowRoot.querySelectorAll(REGALIA_AVATAR_SELECTOR).forEach((element) => {
      elements.add(element)
    })
  })

  document.querySelectorAll<HTMLElement>(REGALIA_PROFILE_HOST_SELECTOR).forEach((host) => {
    const shadowRoot = host.shadowRoot
    if (!shadowRoot) return

    observeRegaliaShadowRoot(shadowRoot)
    shadowRoot.querySelectorAll(REGALIA_AVATAR_SELECTOR).forEach((element) => {
      elements.add(element)
    })
  })

  return [...elements]
}

function applyCustomAvatar(): boolean {
  const avatarUrl = getCurrentAvatarUrl()
  if (!avatarUrl) return false

  let changed = false

  document.querySelectorAll<HTMLImageElement>(FRIEND_AVATAR_SELECTOR).forEach((image) => {
    changed = patchFriendAvatar(image, avatarUrl) || changed
  })

  queryRegaliaAvatarElements().forEach((element) => {
    changed = patchRegaliaAvatar(element, avatarUrl) || changed
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
  patchedFriendImages.forEach((image) => {
    const original = originalFriendImageSrc.get(image)
    if (original == null) image.removeAttribute('src')
    else image.setAttribute('src', original)
  })
  patchedFriendImages.clear()

  patchedRegaliaElements.forEach((element) => {
    const original = originalRegaliaProfileIconUrl.get(element)
    if (original == null) element.removeAttribute(PROFILE_ICON_ATTR)
    else element.setAttribute(PROFILE_ICON_ATTR, original)
    ;(element as unknown as { profileIconUrl?: string }).profileIconUrl = original ?? ''
  })
  patchedRegaliaElements.clear()
}

function enableCustomAvatar() {
  if (!customAvatarRegistered) {
    injector.register(applyCustomAvatar)
    customAvatarRegistered = true
  }

  startCustomAvatarObserver()
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

  if (customAvatarRaf) {
    cancelAnimationFrame(customAvatarRaf)
    customAvatarRaf = 0
  }

  restorePatchedAvatars()
}

export function updateBeautifyCustomAvatar() {
  if (getCurrentAvatarUrl()) {
    enableCustomAvatar()
  } else {
    disableCustomAvatar()
  }
}

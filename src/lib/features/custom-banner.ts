import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { logger } from '@/index'
import { CustomBannerPicker } from '@/components/ui/CustomBannerPicker'
import { injector } from '@/lib/InjectorManager'
import { lcu } from '@/lib/lcu'
import { store } from '@/lib/store'

// ==================== 自定义旗帜 ====================

const SONA_CUSTOM_BANNER_ATTR = 'data-sona-custom-banner-button'
const TARGET_TAGS = new Set([
  'lol-regalia-identity-customizer-element',
  'lol-regalia-banner-v2-element',
  'lol-regalia-parties-v2-element',
])
const PATCH_TRIGGER_ATTRS = new Set([
  'banner-id',
  'banner-type',
  'banner-rank',
  'summoner-id',
  'member-type',
])
const ORIGINAL_ATTRS = ['banner-id', 'banner-type', 'banner-rank'] as const

interface LocalCustomBannerSelection {
  id: string
  name: string
  assetPath: string
  bannerType: string
  bannerRank: string
}

let customBannerRoot: Root | null = null
let customBannerContainer: HTMLDivElement | null = null
let customBannerRegistered = false
let ownSummonerIdPromise: Promise<string> | null = null
let ownSummonerIdCache = ''
let hookInstalled = false
let patchEnabled = false
let originalSetAttribute: typeof Element.prototype.setAttribute | null = null
let originalRemoveAttribute: typeof Element.prototype.removeAttribute | null = null

const patchedElements = new Map<Element, Partial<Record<(typeof ORIGINAL_ATTRS)[number], string | null>>>()
const pendingElements = new WeakSet<Element>()

function getStoredSelection(): LocalCustomBannerSelection | null {
  const stored = store.get('customBannerSelection')
  if (!stored?.assetPath || !stored.id || !stored.name) return null

  return {
    id: String(stored.id),
    name: String(stored.name),
    assetPath: String(stored.assetPath),
    bannerType: stored.bannerType || 'blank',
    bannerRank: stored.bannerRank || '',
  }
}

function saveStoredSelection(selection: LocalCustomBannerSelection) {
  store.set('customBannerSelection', selection)
}

async function getOwnSummonerId(): Promise<string> {
  if (ownSummonerIdCache) return ownSummonerIdCache

  ownSummonerIdPromise ??= lcu.getSummonerInfo()
    .then((summoner) => {
      ownSummonerIdCache = String(summoner.summonerId)
      return ownSummonerIdCache
    })
    .catch((err) => {
      ownSummonerIdPromise = null
      logger.warn('[CustomBanner] 获取当前召唤师 ID 失败: %o', err)
      return ''
    })

  return ownSummonerIdPromise
}

function getElementTagName(element: Element): string {
  return element.tagName.toLowerCase()
}

function isTargetElement(element: Element): boolean {
  return TARGET_TAGS.has(getElementTagName(element))
}

function getRootHost(element: Element): Element | null {
  const root = element.getRootNode()
  return root instanceof ShadowRoot ? root.host : null
}

function getOwnerElement(element: Element): Element {
  const host = getRootHost(element)
  if (host && isTargetElement(host)) return host
  return element
}

function hasDifferentSummonerId(element: Element, ownSummonerId: string): boolean {
  const summonerId = element.getAttribute('summoner-id')
  return Boolean(ownSummonerId && summonerId && summonerId !== ownSummonerId)
}

function shouldPatchElement(element: Element, ownSummonerId: string): boolean {
  if (!isTargetElement(element)) return false

  const owner = getOwnerElement(element)
  const memberType = owner.getAttribute('member-type')
  if (memberType && memberType !== 'current-player') return false

  if (hasDifferentSummonerId(owner, ownSummonerId)) return false
  if (owner !== element && hasDifferentSummonerId(element, ownSummonerId)) return false

  return true
}

function rememberOriginalAttrs(element: Element) {
  if (patchedElements.has(element)) return

  const attrs: Partial<Record<(typeof ORIGINAL_ATTRS)[number], string | null>> = {}
  ORIGINAL_ATTRS.forEach((attr) => {
    attrs[attr] = element.getAttribute(attr)
  })
  patchedElements.set(element, attrs)
}

function restoreOriginalAttr(element: Element, attr: (typeof ORIGINAL_ATTRS)[number]) {
  const originalValue = patchedElements.get(element)?.[attr]
  if (originalValue == null) {
    originalRemoveAttribute?.call(element, attr)
  } else {
    originalSetAttribute?.call(element, attr, originalValue)
  }
}

async function patchRegaliaElement(element: Element, selection: LocalCustomBannerSelection) {
  const ownSummonerId = await getOwnSummonerId()
  if (!shouldPatchElement(element, ownSummonerId)) return

  rememberOriginalAttrs(element)

  originalSetAttribute?.call(element, 'banner-id', selection.id)
  originalSetAttribute?.call(element, 'banner-type', selection.bannerType || 'blank')
  if (selection.bannerRank) {
    originalSetAttribute?.call(element, 'banner-rank', selection.bannerRank)
  } else {
    restoreOriginalAttr(element, 'banner-rank')
  }
}

function schedulePatchElement(element: Element) {
  if (!patchEnabled) return
  if (!isTargetElement(element)) return
  if (pendingElements.has(element)) return

  pendingElements.add(element)
  queueMicrotask(() => {
    pendingElements.delete(element)
    const selection = getStoredSelection()
    if (!selection) return
    void patchRegaliaElement(element, selection)
  })
}

function installRegaliaAttributeHook() {
  if (hookInstalled) return
  hookInstalled = true

  originalSetAttribute = Element.prototype.setAttribute
  originalRemoveAttribute = Element.prototype.removeAttribute

  Element.prototype.setAttribute = function patchedSetAttribute(name: string, value: string) {
    originalSetAttribute!.call(this, name, value)

    const attr = name.toLowerCase()
    if (PATCH_TRIGGER_ATTRS.has(attr) && isTargetElement(this)) {
      schedulePatchElement(this)
    }
  }

  Element.prototype.removeAttribute = function patchedRemoveAttribute(name: string) {
    originalRemoveAttribute!.call(this, name)

    const attr = name.toLowerCase()
    if (PATCH_TRIGGER_ATTRS.has(attr) && isTargetElement(this)) {
      schedulePatchElement(this)
    }
  }
}

function getSelectedCustomBanner(): LocalCustomBannerSelection | null {
  return getStoredSelection()
}

function getSelectedCustomBannerKey(): string | null {
  const selection = getSelectedCustomBanner()
  if (!selection) return null
  return `${selection.id}:${selection.bannerRank || ''}`
}

function selectCustomBanner(selection: LocalCustomBannerSelection) {
  saveStoredSelection(selection)
  void applySelectedCustomBanner()
}

async function applySelectedCustomBanner() {
  const selection = getStoredSelection()
  if (!selection) return

  installRegaliaAttributeHook()
  patchEnabled = true

  const selector = Array.from(TARGET_TAGS).join(',')
  const elements = Array.from(document.querySelectorAll(selector))
  await Promise.all(elements.map((element) => patchRegaliaElement(element, selection)))
}

function restoreCustomBannerPatch() {
  patchEnabled = false

  patchedElements.forEach((attrs, element) => {
    ORIGINAL_ATTRS.forEach((attr) => {
      const originalValue = attrs[attr]
      if (originalValue == null) {
        originalRemoveAttribute?.call(element, attr)
      } else {
        originalSetAttribute?.call(element, attr, originalValue)
      }
    })
  })

  patchedElements.clear()
}

function showCustomBannerPicker() {
  if (!customBannerContainer) {
    customBannerContainer = document.createElement('div')
    customBannerContainer.id = 'sona-custom-banner-root'
    document.body.appendChild(customBannerContainer)
    customBannerRoot = createRoot(customBannerContainer)
  }

  const close = () => {
    customBannerRoot?.render(
      createElement(CustomBannerPicker, {
        open: false,
        onClose: close,
        selectedBannerKey: getSelectedCustomBannerKey(),
        onApplyBanner: selectCustomBanner,
      }),
    )
  }

  customBannerRoot!.render(
    createElement(CustomBannerPicker, {
      open: true,
      onClose: close,
      selectedBannerKey: getSelectedCustomBannerKey(),
      onApplyBanner: selectCustomBanner,
    }),
  )
}

function cleanupCustomBanner() {
  if (customBannerRoot) {
    customBannerRoot.unmount()
    customBannerRoot = null
  }
  if (customBannerContainer) {
    customBannerContainer.remove()
    customBannerContainer = null
  }

  document.querySelectorAll(`[${SONA_CUSTOM_BANNER_ATTR}]`).forEach((el) => el.remove())
  restoreCustomBannerPatch()
}

function createNativeButton(): HTMLElement {
  const button = document.createElement('lol-uikit-flat-button') as HTMLElement
  button.setAttribute(SONA_CUSTOM_BANNER_ATTR, 'true')
  button.textContent = '自定义旗帜'
  button.style.marginLeft = '12px'
  button.style.verticalAlign = 'middle'
  button.style.height = '24px'
  button.style.padding = '5px 12px'
  button.style.marginTop = '-6px' //  看起来不居中，往上挪一点

  button.addEventListener('click', (event) => {
    event.stopPropagation()
    event.stopImmediatePropagation()
    event.preventDefault()
    showCustomBannerPicker()
    logger.info('[CustomBanner] 打开自定义旗帜弹窗')
  }, true)

  return button
}

function tryInjectCustomBannerButton(): boolean {
  void applySelectedCustomBanner()

  const titles = document.querySelectorAll('.challenges-identity-customizer-title')
  if (titles.length === 0) return false

  titles.forEach((title) => {
    if (title.querySelector(`[${SONA_CUSTOM_BANNER_ATTR}]`)) return

    const titleEl = title as HTMLElement
    if (!titleEl.style.display) titleEl.style.display = 'flex'
    if (!titleEl.style.alignItems) titleEl.style.alignItems = 'center'

    title.appendChild(createNativeButton())
    logger.info('[CustomBanner] 已注入自定义旗帜按钮 ✓')
  })

  return true
}

export function updateCustomBanner(enabled: boolean) {
  if (enabled && !customBannerRegistered) {
    injector.register(tryInjectCustomBannerButton)
    customBannerRegistered = true
    logger.info('Custom banner enabled ✓')
  } else if (!enabled && customBannerRegistered) {
    injector.unregister(tryInjectCustomBannerButton)
    customBannerRegistered = false
    cleanupCustomBanner()
    logger.info('Custom banner disabled')
  }
}

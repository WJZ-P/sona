import { injector } from '@/lib/InjectorManager'
import type { BeautifyGlassConfig } from '@/lib/features/beautify-client/social-sidebar-glass'
import { resolvePluginAssetUrl } from '@/lib/plugin-resolver'

const VIEWPORT_ROOT_SELECTOR = 'section#rcp-fe-viewport-root'
const HOMEPAGE_BACKGROUND_STYLE_ID = 'sona-homepage-background-style'
const HOMEPAGE_VIDEO_ATTR = 'data-sona-homepage-background-video'
const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'ogg', 'ogv', 'mov', 'm4v'])

export interface HomepageBackgroundAdjustment {
  scale: number
  offsetX: number
  offsetY: number
}

function getAssetUrl(assetPath: string): string {
  return resolvePluginAssetUrl(assetPath, 'wallpapers')
}

function isVideoAsset(assetPath: string): boolean {
  const ext = assetPath.split('.').pop()?.toLowerCase()
  return Boolean(ext && VIDEO_EXTENSIONS.has(ext))
}

function escapeCssUrl(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

let currentAssetPath: string | null = null
let adjustments: Record<string, HomepageBackgroundAdjustment> = {}
let glassConfig: BeautifyGlassConfig = {
  blur: 0,
  opacity: 0,
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function ensureHomepageBackgroundStyle() {
  if (!currentAssetPath) return

  const assetUrl = escapeCssUrl(getAssetUrl(currentAssetPath))
  const isVideo = isVideoAsset(currentAssetPath)
  const blur = clamp(glassConfig.blur, 0, 40)
  const opacity = clamp(glassConfig.opacity, 0, 100) / 100
  const adjustment = adjustments[currentAssetPath] ?? { scale: 1, offsetX: 0, offsetY: 0 }
  const scale = clamp(adjustment.scale, 1, 3)
  const offsetX = clamp(adjustment.offsetX, -100, 100)
  const offsetY = clamp(adjustment.offsetY, -100, 100)
  const backgroundSize = scale === 1 ? 'cover' : `${Number((scale * 100).toFixed(2))}% auto`
  const backgroundPositionX = `calc(50% + ${Number(offsetX.toFixed(2))}%)`
  const backgroundPositionY = `calc(50% + ${Number(offsetY.toFixed(2))}%)`
  let style = document.getElementById(HOMEPAGE_BACKGROUND_STYLE_ID)
  if (!style) {
    style = document.createElement('style')
    style.id = HOMEPAGE_BACKGROUND_STYLE_ID
    document.head.appendChild(style)
  }

  style.textContent = `
    ${VIEWPORT_ROOT_SELECTOR} {
      position: relative !important;
      ${isVideo ? 'z-index: 0 !important;' : ''}
      ${isVideo ? 'background: transparent !important;' : `background-image: url("${assetUrl}") !important;`}
      ${isVideo ? '' : `background-size: ${backgroundSize} !important;`}
      ${isVideo ? '' : `background-position: ${backgroundPositionX} ${backgroundPositionY} !important;`}
      background-repeat: no-repeat !important;
    }

    ${VIEWPORT_ROOT_SELECTOR} > video[${HOMEPAGE_VIDEO_ATTR}] {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform: translate(${offsetX}%, ${offsetY}%) scale(${scale});
      transform-origin: center center;
      pointer-events: none;
      z-index: -1;
    }

    ${VIEWPORT_ROOT_SELECTOR}::before {
      content: "";
      position: absolute;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      background: rgba(1, 10, 19, ${opacity});
      backdrop-filter: blur(${blur}px);
      -webkit-backdrop-filter: blur(${blur}px);
    }
  `
}

function ensureHomepageBackgroundVideo() {
  const viewportRoot = document.querySelector<HTMLElement>(VIEWPORT_ROOT_SELECTOR)
  if (!viewportRoot || !currentAssetPath || !isVideoAsset(currentAssetPath)) {
    removeHomepageBackgroundVideo()
    return
  }

  const assetUrl = getAssetUrl(currentAssetPath)
  let video = viewportRoot.querySelector<HTMLVideoElement>(`video[${HOMEPAGE_VIDEO_ATTR}]`)
  if (!video) {
    video = document.createElement('video')
    video.setAttribute(HOMEPAGE_VIDEO_ATTR, 'true')
    video.muted = true
    video.loop = true
    video.autoplay = true
    video.playsInline = true
    video.preload = 'metadata'
    viewportRoot.prepend(video)
  }

  if (video.getAttribute('src') !== assetUrl) {
    video.src = assetUrl
  }
  void video.play().catch(() => {})
}

function removeHomepageBackgroundVideo() {
  document
    .querySelector<HTMLVideoElement>(`${VIEWPORT_ROOT_SELECTOR} > video[${HOMEPAGE_VIDEO_ATTR}]`)
    ?.remove()
}

function tryApplyHomepageBackground(): boolean {
  ensureHomepageBackgroundStyle()
  ensureHomepageBackgroundVideo()

  return true
}

let registered = false

export function updateBeautifyHomepageBackground(assetPath: string | null) {
  currentAssetPath = assetPath

  if (assetPath && !registered) {
    registered = true
    injector.register(tryApplyHomepageBackground)
    tryApplyHomepageBackground()
  } else if (assetPath && registered) {
    tryApplyHomepageBackground()
  } else if (!assetPath && registered) {
    registered = false
    injector.unregister(tryApplyHomepageBackground)
    document.getElementById(HOMEPAGE_BACKGROUND_STYLE_ID)?.remove()
    removeHomepageBackgroundVideo()
  } else if (!assetPath) {
    document.getElementById(HOMEPAGE_BACKGROUND_STYLE_ID)?.remove()
    removeHomepageBackgroundVideo()
  }
}

export function updateBeautifyHomepageBackgroundGlassConfig(config: BeautifyGlassConfig) {
  glassConfig = config
  if (registered) {
    ensureHomepageBackgroundStyle()
  }
}

export function updateBeautifyHomepageBackgroundAdjustments(nextAdjustments: Record<string, HomepageBackgroundAdjustment>) {
  adjustments = nextAdjustments
  if (registered) {
    ensureHomepageBackgroundStyle()
  }
}

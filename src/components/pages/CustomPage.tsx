import { useEffect, useRef, useState, type DragEvent, type PointerEvent, type WheelEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { SettingCard, SettingGroup } from '@/components/ui/SettingCard'
import { SonaButton } from '@/components/ui/SonaButton'
import { SonaInput } from '@/components/ui/SonaInput'
import { SonaSlider } from '@/components/ui/SonaSlider'
import { SonaSwitch } from '@/components/ui/SonaSwitch'
import { createCustomAvatarImageBlob, syncCustomAvatarAssetPath } from '@/lib/features/beautify-client/custom-avatar'
import { getPluginAssetsFolderPath, resolvePluginAssetUrl } from '@/lib/plugin-resolver'
import { store } from '@/lib/store'
import { useI18n } from '@/i18n'
import '@/styles/SettingsPage.css'
import { SonaSelect } from '@/components/ui/SonaSelect'
import { logger } from '@/index'

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'ico'])
const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'ogg', 'ogv', 'mov', 'm4v'])
const DRAG_SCROLL_EDGE_SIZE = 76
const DRAG_SCROLL_MAX_SPEED = 20
const DEFAULT_WALLPAPER_ADJUSTMENT = { scale: 1, offsetX: 0, offsetY: 0 }
const WALLPAPER_FRAME_ASPECT_RATIO = 16 / 9
const WALLPAPER_SCALE_MIN = 1
const WALLPAPER_SCALE_MAX = 3
const WALLPAPER_WHEEL_SCALE_STEP = 0.08
const CUSTOM_AVATAR_SYNC_DELAY_MS = 10000
const DEFAULT_AVATAR_ADJUSTMENT = { scale: 1, offsetX: 0, offsetY: 0 }
const AVATAR_SCALE_MIN = 1
const AVATAR_SCALE_MAX = 3
const AVATAR_WHEEL_SCALE_STEP = 0.08

interface WallpaperAdjustment {
  scale: number
  offsetX: number
  offsetY: number
}

interface WallpaperDragStart {
  clientX: number
  clientY: number
  offsetX: number
  offsetY: number
}

interface WallpaperMediaSize {
  width: number
  height: number
}

interface AvatarAdjustment {
  scale: number
  offsetX: number
  offsetY: number
}

interface AvatarDragStart {
  clientX: number
  clientY: number
  offsetX: number
  offsetY: number
}

interface PendingSharedAssetRemoval {
  assetPath: string
  source: 'wallpaper' | 'avatar'
}

function isImageFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase()
  return Boolean(ext && IMAGE_EXTENSIONS.has(ext))
}

function isVideoFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase()
  return Boolean(ext && VIDEO_EXTENSIONS.has(ext))
}

function isSupportedMediaFile(fileName: string): boolean {
  return isImageFile(fileName) || isVideoFile(fileName)
}

function normalizeAssetPath(value: string): string {
  let normalized = value
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\\/g, '/')

  const lowerPath = normalized.toLowerCase()
  const sonaAssetsMarker = '/sona/assets/'
  const sonaAssetsIndex = lowerPath.lastIndexOf(sonaAssetsMarker)
  if (sonaAssetsIndex >= 0) {
    normalized = normalized.slice(sonaAssetsIndex + sonaAssetsMarker.length)
  }

  return normalized
    .replace(/^\.\/+/, '')
    .replace(/^assets\/+/i, '')
    .replace(/^\/+/, '')
}

function getAssetUrl(assetPath: string): string {
  return resolvePluginAssetUrl(assetPath)
}

function getVideoPosterAssetPath(assetPath: string): string {
  return assetPath.replace(/\.[^.\\/]+$/, '.png')
}

function getWallpaperPreviewLeft(adjustment: WallpaperAdjustment): string {
  return `calc(50% + ${Number(adjustment.offsetX.toFixed(2))}%)`
}

function getWallpaperPreviewTop(adjustment: WallpaperAdjustment): string {
  return `calc(50% + ${Number(adjustment.offsetY.toFixed(2))}%)`
}

function getAvatarPreviewLeft(adjustment: AvatarAdjustment): string {
  return `calc(50% + ${Number(adjustment.offsetX.toFixed(2))}%)`
}

function getAvatarPreviewTop(adjustment: AvatarAdjustment): string {
  return `calc(50% + ${Number(adjustment.offsetY.toFixed(2))}%)`
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function getWallpaperOffsetLimit(
  frameSize: { width: number; height: number } | undefined,
  mediaSize: WallpaperMediaSize | undefined,
  scale: number,
) {
  if (!frameSize?.width || !frameSize.height || !mediaSize?.width || !mediaSize.height) {
    return { maxOffsetX: 100, maxOffsetY: 100 }
  }

  const frameRatio = frameSize.width / frameSize.height
  const mediaRatio = mediaSize.width / mediaSize.height
  const coverWidthRatio = (mediaRatio >= frameRatio ? mediaRatio / frameRatio : 1) * scale
  const coverHeightRatio = (mediaRatio >= frameRatio ? 1 : frameRatio / mediaRatio) * scale

  return {
    maxOffsetX: Math.max(0, ((coverWidthRatio - 1) / 2) * 100),
    maxOffsetY: Math.max(0, ((coverHeightRatio - 1) / 2) * 100),
  }
}

function clampWallpaperAdjustment(
  adjustment: WallpaperAdjustment,
  frameSize: { width: number; height: number } | undefined,
  mediaSize: WallpaperMediaSize | undefined,
): WallpaperAdjustment {
  const { maxOffsetX, maxOffsetY } = getWallpaperOffsetLimit(frameSize, mediaSize, adjustment.scale)
  return {
    ...adjustment,
    offsetX: clampNumber(adjustment.offsetX, -maxOffsetX, maxOffsetX),
    offsetY: clampNumber(adjustment.offsetY, -maxOffsetY, maxOffsetY),
  }
}

function getAvatarOffsetLimit(size: { width: number; height: number } | undefined, scale: number) {
  if (!size?.width || !size.height) {
    return { maxOffsetX: 100, maxOffsetY: 100 }
  }

  const aspectRatio = size.width / size.height
  const coverWidthRatio = (aspectRatio >= 1 ? aspectRatio : 1) * scale
  const coverHeightRatio = (aspectRatio >= 1 ? 1 : 1 / aspectRatio) * scale

  return {
    maxOffsetX: Math.max(0, ((coverWidthRatio - 1) / 2) * 100),
    maxOffsetY: Math.max(0, ((coverHeightRatio - 1) / 2) * 100),
  }
}

function clampAvatarAdjustment(adjustment: AvatarAdjustment, size: { width: number; height: number } | undefined): AvatarAdjustment {
  const { maxOffsetX, maxOffsetY } = getAvatarOffsetLimit(size, adjustment.scale)
  return {
    ...adjustment,
    offsetX: clampNumber(adjustment.offsetX, -maxOffsetX, maxOffsetX),
    offsetY: clampNumber(adjustment.offsetY, -maxOffsetY, maxOffsetY),
  }
}

export function CustomPage() {
  const { t } = useI18n()
  const scrollRef = useRef<HTMLDivElement>(null)
  const wallpaperFrameRef = useRef<HTMLDivElement>(null)
  const wallpaperDragStartRef = useRef<WallpaperDragStart | null>(null)
  const dragScrollFrameRef = useRef<number | null>(null)
  const dragPointerYRef = useRef<number | null>(null)
  const avatarSyncTimerRef = useRef<number | null>(null)
  const avatarAdjustFrameRef = useRef<HTMLDivElement>(null)
  const avatarDragStartRef = useRef<AvatarDragStart | null>(null)
  const [assetPathInput, setAssetPathInput] = useState('')
  const [beautifyWallpaperMode, setBeautifyWallpaperMode] = useState(() => store.get('beautifyWallpaperMode'))
  const [homepageBackgroundAssetPath, setHomepageBackgroundAssetPath] = useState(() => store.get('beautifyHomepageBackgroundAssetPath'))
  const [homepageBackgroundRandom, setHomepageBackgroundRandom] = useState(() => store.get('beautifyHomepageBackgroundRandom'))
  const [homepageBackgroundAssetPaths, setHomepageBackgroundAssetPaths] = useState(() => {
    const paths = store.get('beautifyHomepageBackgroundAssetPaths')
    const activePath = store.get('beautifyHomepageBackgroundAssetPath')
    return activePath && !paths.includes(activePath) ? [activePath, ...paths] : paths
  })
  const [homepageBackgroundAdjustments, setHomepageBackgroundAdjustments] = useState(() => store.get('beautifyHomepageBackgroundAdjustments'))
  const [homepageBackgroundBlur, setHomepageBackgroundBlur] = useState(() => store.get('beautifyHomepageBackgroundBlur'))
  const [homepageBackgroundOpacity, setHomepageBackgroundOpacity] = useState(() => store.get('beautifyHomepageBackgroundOpacity'))
  const [glassBlur, setGlassBlur] = useState(() => store.get('beautifyGlassBlur'))
  const [glassOpacity, setGlassOpacity] = useState(() => store.get('beautifyGlassOpacity'))
  const [assetPaths, setAssetPaths] = useState(() => store.get('beautifyAssetPaths'))
  const [customAvatarMode, setCustomAvatarMode] = useState(() => store.get('customAvatarMode'))
  const [customAvatarAssetPaths, setCustomAvatarAssetPaths] = useState(() => store.get('customAvatarAssetPaths'))
  const [customAvatarActiveAssetPath, setCustomAvatarActiveAssetPath] = useState(() => store.get('customAvatarActiveAssetPath'))
  const [customAvatarAdjustments, setCustomAvatarAdjustments] = useState(() => store.get('customAvatarAdjustments'))
  const [avatarImageSizes, setAvatarImageSizes] = useState<Record<string, { width: number; height: number }>>({})
  const [wallpaperMediaSizes, setWallpaperMediaSizes] = useState<Record<string, WallpaperMediaSize>>({})
  const [assetMessage, setAssetMessage] = useState(() => t('beautify.assets.instructions'))
  const [editingWallpaperAssetPath, setEditingWallpaperAssetPath] = useState<string | null>(null)
  const [editingAvatarAssetPath, setEditingAvatarAssetPath] = useState<string | null>(null)
  const [pendingSharedAssetRemoval, setPendingSharedAssetRemoval] = useState<PendingSharedAssetRemoval | null>(null)
  const [draftWallpaperAdjustment, setDraftWallpaperAdjustment] = useState<WallpaperAdjustment>(DEFAULT_WALLPAPER_ADJUSTMENT)
  const [draftAvatarAdjustment, setDraftAvatarAdjustment] = useState<AvatarAdjustment>(DEFAULT_AVATAR_ADJUSTMENT)
  const [isHomepageBackgroundDropActive, setIsHomepageBackgroundDropActive] = useState(false)
  const [showHomepageBackgroundInput, setShowHomepageBackgroundInput] = useState(false)
  const [isAvatarDropActive, setIsAvatarDropActive] = useState(false)
  const [showAvatarInput, setShowAvatarInput] = useState(false)

  const saveAssetPaths = (paths: string[]) => {
    setAssetPaths(paths)
    store.set('beautifyAssetPaths', paths)
  }

  const saveCustomAvatarAssetPaths = (paths: string[]) => {
    setCustomAvatarAssetPaths(paths)
    store.set('customAvatarAssetPaths', paths)
  }

  const saveCustomAvatarActiveAssetPath = (assetPath: string | null) => {
    setCustomAvatarActiveAssetPath(assetPath)
    store.set('customAvatarActiveAssetPath', assetPath)
  }

  const saveCustomAvatarAdjustments = (adjustments: Record<string, AvatarAdjustment>) => {
    setCustomAvatarAdjustments(adjustments)
    store.set('customAvatarAdjustments', adjustments)
  }

  const saveHomepageBackgroundAssetPath = (assetPath: string | null) => {
    setHomepageBackgroundAssetPath(assetPath)
    store.set('beautifyHomepageBackgroundAssetPath', assetPath)
  }

  const saveHomepageBackgroundAssetPaths = (paths: string[]) => {
    setHomepageBackgroundAssetPaths(paths)
    store.set('beautifyHomepageBackgroundAssetPaths', paths)
  }

  const toggleHomepageBackgroundRandom = (enabled: boolean) => {
    setHomepageBackgroundRandom(enabled)
    store.set('beautifyHomepageBackgroundRandom', enabled)
  }

  const saveHomepageBackgroundAdjustments = (adjustments: Record<string, WallpaperAdjustment>) => {
    setHomepageBackgroundAdjustments(adjustments)
    store.set('beautifyHomepageBackgroundAdjustments', adjustments)
  }

  const toggleBeautifyWallpaperMode = (enabled: boolean) => {
    setBeautifyWallpaperMode(enabled)
    store.set('beautifyWallpaperMode', enabled)
  }

  const toggleCustomAvatarMode = (enabled: boolean) => {
    if (!enabled) {
      cancelScheduledCustomAvatarSync()
      setIsAvatarDropActive(false)
      setAssetMessage(t('beautify.assets.instructions'))
    } else {
      const currentPath = customAvatarActiveAssetPath ?? customAvatarAssetPaths[0]
      if (currentPath) {
        scheduleCustomAvatarSync(currentPath)
      } else {
        cancelScheduledCustomAvatarSync()
        setAssetMessage(t('beautify.assets.instructions'))
      }
    }
    setCustomAvatarMode(enabled)
    store.set('customAvatarMode', enabled)
  }

  const updateGlassBlur = (value: number) => {
    setGlassBlur(value)
    store.set('beautifyGlassBlur', value)
  }

  const updateGlassOpacity = (value: number) => {
    setGlassOpacity(value)
    store.set('beautifyGlassOpacity', value)
  }

  const updateHomepageBackgroundBlur = (value: number) => {
    setHomepageBackgroundBlur(value)
    store.set('beautifyHomepageBackgroundBlur', value)
  }

  const updateHomepageBackgroundOpacity = (value: number) => {
    setHomepageBackgroundOpacity(value)
    store.set('beautifyHomepageBackgroundOpacity', value)
  }

  const addHomepageBackgroundInputPath = () => {
    if (addHomepageBackgroundAssetPath(assetPathInput)) {
      setAssetPathInput('')
      setShowHomepageBackgroundInput(true)
    }
  }

  const addCustomAvatarInputPath = () => {
    if (addCustomAvatarAssetPath(assetPathInput)) {
      setAssetPathInput('')
      setShowAvatarInput(true)
    }
  }

  const requestSharedAssetRemoval = (assetPath: string, source: PendingSharedAssetRemoval['source']) => {
    if (!homepageBackgroundAssetPaths.includes(assetPath) || !customAvatarAssetPaths.includes(assetPath)) {
      return true
    }

    setPendingSharedAssetRemoval({ assetPath, source })
    return false
  }

  const removeAssetPathEverywhere = (assetPath: string) => {
    const nextPaths = assetPaths.filter((path) => path !== assetPath)
    const nextHomepageBackgroundAssetPaths = homepageBackgroundAssetPaths.filter((path) => path !== assetPath)
    const nextHomepageBackgroundAdjustments = { ...homepageBackgroundAdjustments }
    delete nextHomepageBackgroundAdjustments[assetPath]
    saveAssetPaths(nextPaths)
    saveHomepageBackgroundAssetPaths(nextHomepageBackgroundAssetPaths)
    saveHomepageBackgroundAdjustments(nextHomepageBackgroundAdjustments)
    const nextCustomAvatarAssetPaths = customAvatarAssetPaths.filter((path) => path !== assetPath)
    const nextCustomAvatarAdjustments = { ...customAvatarAdjustments }
    delete nextCustomAvatarAdjustments[assetPath]
    saveCustomAvatarAssetPaths(nextCustomAvatarAssetPaths)
    saveCustomAvatarAdjustments(nextCustomAvatarAdjustments)
    if (customAvatarActiveAssetPath === assetPath) {
      saveCustomAvatarActiveAssetPath(nextCustomAvatarAssetPaths[0] ?? null)
    }
    if (store.get('beautifyHomepageBackgroundLastRandomAssetPath') === assetPath) {
      store.set('beautifyHomepageBackgroundLastRandomAssetPath', null)
    }
    if (homepageBackgroundAssetPath === assetPath) {
      saveHomepageBackgroundAssetPath(nextHomepageBackgroundAssetPaths[0] ?? null)
    }
  }

  const applyHomepageBackgroundAssetPath = (assetPath: string) => {
    if (!assetPaths.includes(assetPath) && !homepageBackgroundAssetPaths.includes(assetPath)) {
      setAssetMessage(t('beautify.status.wallpaperListOnly'))
      return
    }
    if (!assetPaths.includes(assetPath)) {
      saveAssetPaths([...assetPaths, assetPath])
    }

    saveHomepageBackgroundAssetPath(assetPath)
    setAssetMessage(t('beautify.status.wallpaperApplied', { path: assetPath }))
  }

  const addHomepageBackgroundAssetPath = (assetPath: string) => {
    const nextPath = normalizeAssetPath(assetPath)

    if (!nextPath) {
      setAssetMessage(t('beautify.status.assetInputRequired'))
      return false
    }
    if (nextPath.includes('..')) {
      setAssetMessage(t('beautify.status.assetPathInvalid'))
      return false
    }
    if (/^[a-z]+:\/\//i.test(nextPath)) {
      setAssetMessage(t('beautify.status.assetUrlRejected'))
      return false
    }
    if (!isSupportedMediaFile(nextPath)) {
      setAssetMessage(t('beautify.status.wallpaperMediaOnly'))
      return false
    }

    if (!assetPaths.includes(nextPath)) {
      saveAssetPaths([...assetPaths, nextPath])
    }
    if (!homepageBackgroundAssetPaths.includes(nextPath)) {
      saveHomepageBackgroundAssetPaths([...homepageBackgroundAssetPaths, nextPath])
    }
    saveHomepageBackgroundAssetPath(nextPath)
    setAssetMessage(t('beautify.status.wallpaperAdded', { path: nextPath }))
    return true
  }

  const removeHomepageBackgroundAssetPathConfirmed = (assetPath: string) => {
    removeAssetPathEverywhere(assetPath)
    setAssetMessage(t('beautify.status.wallpaperRemoved', { path: assetPath }))
  }

  const removeHomepageBackgroundAssetPath = (assetPath: string) => {
    if (!requestSharedAssetRemoval(assetPath, 'wallpaper')) return

    removeHomepageBackgroundAssetPathConfirmed(assetPath)
  }

  const openHomepageBackgroundAdjustModal = (assetPath: string) => {
    setEditingWallpaperAssetPath(assetPath)
    setDraftWallpaperAdjustment(clampWallpaperAdjustment(
      homepageBackgroundAdjustments[assetPath] ?? DEFAULT_WALLPAPER_ADJUSTMENT,
      wallpaperFrameRef.current?.getBoundingClientRect(),
      wallpaperMediaSizes[assetPath],
    ))
    wallpaperDragStartRef.current = null
  }

  const closeHomepageBackgroundAdjustModal = () => {
    setEditingWallpaperAssetPath(null)
    wallpaperDragStartRef.current = null
  }

  const saveHomepageBackgroundAdjustment = () => {
    if (!editingWallpaperAssetPath) return

    const frameSize = wallpaperFrameRef.current?.getBoundingClientRect()
    const size = wallpaperMediaSizes[editingWallpaperAssetPath]
    const nextAdjustment = clampWallpaperAdjustment(draftWallpaperAdjustment, frameSize, size)
    const nextAdjustments = {
      ...homepageBackgroundAdjustments,
      [editingWallpaperAssetPath]: nextAdjustment,
    }
    saveHomepageBackgroundAdjustments(nextAdjustments)
    setAssetMessage(t('beautify.status.wallpaperSaved', { path: editingWallpaperAssetPath }))
    closeHomepageBackgroundAdjustModal()
  }

  const resetHomepageBackgroundAdjustment = () => {
    setDraftWallpaperAdjustment(DEFAULT_WALLPAPER_ADJUSTMENT)
  }

  const updateWallpaperMediaSize = (assetPath: string, width: number, height: number) => {
    if (!width || !height) return

    const nextSize = { width, height }
    setWallpaperMediaSizes((current) => {
      const currentSize = current[assetPath]
      if (currentSize?.width === width && currentSize.height === height) return current
      return {
        ...current,
        [assetPath]: nextSize,
      }
    })

    if (editingWallpaperAssetPath === assetPath) {
      setDraftWallpaperAdjustment((current) =>
        clampWallpaperAdjustment(current, wallpaperFrameRef.current?.getBoundingClientRect(), nextSize)
      )
    }
  }

  const openCustomAvatarAdjustModal = (assetPath: string) => {
    setEditingAvatarAssetPath(assetPath)
    setDraftAvatarAdjustment(clampAvatarAdjustment(customAvatarAdjustments[assetPath] ?? DEFAULT_AVATAR_ADJUSTMENT, avatarImageSizes[assetPath]))
    avatarDragStartRef.current = null
  }

  const closeCustomAvatarAdjustModal = () => {
    setEditingAvatarAssetPath(null)
    avatarDragStartRef.current = null
  }

  const saveCustomAvatarAdjustment = () => {
    if (!editingAvatarAssetPath) return

    const savedAssetPath = editingAvatarAssetPath
    const nextAdjustments = {
      ...customAvatarAdjustments,
      [savedAssetPath]: draftAvatarAdjustment,
    }
    saveCustomAvatarAdjustments(nextAdjustments)
    setAssetMessage(t('beautify.status.avatarApplied', { path: savedAssetPath }))
    closeCustomAvatarAdjustModal()
    if ((customAvatarActiveAssetPath ?? customAvatarAssetPaths[0]) === savedAssetPath) {
      scheduleCustomAvatarSync(savedAssetPath)
    }
  }

  const resetCustomAvatarAdjustment = () => {
    setDraftAvatarAdjustment(DEFAULT_AVATAR_ADJUSTMENT)
  }

  const updateAvatarImageSize = (assetPath: string, image: HTMLImageElement) => {
    const width = image.naturalWidth
    const height = image.naturalHeight
    if (!width || !height) return

    setAvatarImageSizes((current) => {
      const currentSize = current[assetPath]
      if (currentSize?.width === width && currentSize.height === height) return current
      return {
        ...current,
        [assetPath]: { width, height },
      }
    })

    if (editingAvatarAssetPath === assetPath) {
      setDraftAvatarAdjustment((current) => clampAvatarAdjustment(current, { width, height }))
    }
  }

  const getAvatarPreviewStageStyle = (assetPath: string, adjustment: AvatarAdjustment) => {
    const size = avatarImageSizes[assetPath]
    const aspectRatio = size ? size.width / size.height : 1
    const isWide = aspectRatio >= 1
    const scale = adjustment.scale

    return {
      left: getAvatarPreviewLeft(adjustment),
      top: getAvatarPreviewTop(adjustment),
      width: isWide ? `${Number((aspectRatio * 100 * scale).toFixed(4))}%` : `${Number((100 * scale).toFixed(4))}%`,
      height: isWide ? `${Number((100 * scale).toFixed(4))}%` : `${Number(((100 / aspectRatio) * scale).toFixed(4))}%`,
      transform: 'translate(-50%, -50%)',
    }
  }

  const getWallpaperPreviewStageStyle = (assetPath: string, adjustment: WallpaperAdjustment) => {
    const size = wallpaperMediaSizes[assetPath]
    const aspectRatio = size ? size.width / size.height : WALLPAPER_FRAME_ASPECT_RATIO
    const isWiderThanFrame = aspectRatio >= WALLPAPER_FRAME_ASPECT_RATIO
    const scale = adjustment.scale

    return {
      left: getWallpaperPreviewLeft(adjustment),
      top: getWallpaperPreviewTop(adjustment),
      width: isWiderThanFrame
        ? `${Number(((aspectRatio / WALLPAPER_FRAME_ASPECT_RATIO) * 100 * scale).toFixed(4))}%`
        : `${Number((100 * scale).toFixed(4))}%`,
      height: isWiderThanFrame
        ? `${Number((100 * scale).toFixed(4))}%`
        : `${Number(((WALLPAPER_FRAME_ASPECT_RATIO / aspectRatio) * 100 * scale).toFixed(4))}%`,
      transform: 'translate(-50%, -50%)',
    }
  }

  const handleWallpaperFramePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    wallpaperDragStartRef.current = {
      clientX: event.clientX,
      clientY: event.clientY,
      offsetX: draftWallpaperAdjustment.offsetX,
      offsetY: draftWallpaperAdjustment.offsetY,
    }
  }

  const handleWallpaperFramePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const dragStart = wallpaperDragStartRef.current
    const frame = wallpaperFrameRef.current
    if (!dragStart || !frame || !editingWallpaperAssetPath) return

    const rect = frame.getBoundingClientRect()
    const offsetX = dragStart.offsetX + ((event.clientX - dragStart.clientX) / rect.width) * 100
    const offsetY = dragStart.offsetY + ((event.clientY - dragStart.clientY) / rect.height) * 100
    const size = wallpaperMediaSizes[editingWallpaperAssetPath]
    const { maxOffsetX, maxOffsetY } = getWallpaperOffsetLimit(rect, size, draftWallpaperAdjustment.scale)

    setDraftWallpaperAdjustment((current) => ({
      ...current,
      offsetX: clampNumber(offsetX, -maxOffsetX, maxOffsetX),
      offsetY: clampNumber(offsetY, -maxOffsetY, maxOffsetY),
    }))
  }

  const handleWallpaperFramePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    wallpaperDragStartRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const handleWallpaperFrameWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    const direction = event.deltaY < 0 ? 1 : -1
    if (!editingWallpaperAssetPath) return

    const size = wallpaperMediaSizes[editingWallpaperAssetPath]
    const frameSize = wallpaperFrameRef.current?.getBoundingClientRect()
    setDraftWallpaperAdjustment((current) =>
      clampWallpaperAdjustment(
        {
          ...current,
          scale: Number(clampNumber(current.scale + direction * WALLPAPER_WHEEL_SCALE_STEP, WALLPAPER_SCALE_MIN, WALLPAPER_SCALE_MAX).toFixed(2)),
        },
        frameSize,
        size,
      )
    )
  }

  const handleAvatarFramePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    avatarDragStartRef.current = {
      clientX: event.clientX,
      clientY: event.clientY,
      offsetX: draftAvatarAdjustment.offsetX,
      offsetY: draftAvatarAdjustment.offsetY,
    }
  }

  const handleAvatarFramePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const dragStart = avatarDragStartRef.current
    const frame = avatarAdjustFrameRef.current
    if (!dragStart || !frame || !editingAvatarAssetPath) return

    const rect = frame.getBoundingClientRect()
    const offsetX = dragStart.offsetX + ((event.clientX - dragStart.clientX) / rect.width) * 100
    const offsetY = dragStart.offsetY + ((event.clientY - dragStart.clientY) / rect.height) * 100
    const { maxOffsetX, maxOffsetY } = getAvatarOffsetLimit(avatarImageSizes[editingAvatarAssetPath], draftAvatarAdjustment.scale)

    setDraftAvatarAdjustment((current) => ({
      ...current,
      offsetX: clampNumber(offsetX, -maxOffsetX, maxOffsetX),
      offsetY: clampNumber(offsetY, -maxOffsetY, maxOffsetY),
    }))
  }

  const handleAvatarFramePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    avatarDragStartRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const handleAvatarFrameWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    const direction = event.deltaY < 0 ? 1 : -1
    setDraftAvatarAdjustment((current) => ({
      ...clampAvatarAdjustment({
        ...current,
        scale: Number(clampNumber(current.scale + direction * AVATAR_WHEEL_SCALE_STEP, AVATAR_SCALE_MIN, AVATAR_SCALE_MAX).toFixed(2)),
      }, editingAvatarAssetPath ? avatarImageSizes[editingAvatarAssetPath] : undefined),
    }))
  }

  const syncCustomAvatarAssetPathToCloud = async (assetPath: string) => {
    try {
      const currentPath = store.get('customAvatarActiveAssetPath') ?? store.get('customAvatarAssetPaths')[0]
      if (!store.get('customAvatarMode')) return
      if (currentPath !== assetPath) return

      const blob = await createCustomAvatarImageBlob(assetPath)
      const nextPath = store.get('customAvatarActiveAssetPath') ?? store.get('customAvatarAssetPaths')[0]
      if (!store.get('customAvatarMode')) return
      if (nextPath !== assetPath) return

      await syncCustomAvatarAssetPath(assetPath, blob)
      if (!store.get('customAvatarMode')) return
      if ((store.get('customAvatarActiveAssetPath') ?? store.get('customAvatarAssetPaths')[0]) !== assetPath) return

      setAssetMessage(t('beautify.status.avatarSynced', { path: assetPath }))
    } catch (err) {
      if (store.get('customAvatarMode') && (store.get('customAvatarActiveAssetPath') ?? store.get('customAvatarAssetPaths')[0]) === assetPath) {
        setAssetMessage(t('beautify.status.avatarSyncFailed', { error: err instanceof Error ? err.message : String(err) }))
      }
    }
  }

  const cancelScheduledCustomAvatarSync = () => {
    if (avatarSyncTimerRef.current != null) {
      window.clearInterval(avatarSyncTimerRef.current)
      avatarSyncTimerRef.current = null
    }
  }

  const scheduleCustomAvatarSync = (assetPath: string) => {
    cancelScheduledCustomAvatarSync()
    const totalSeconds = Math.max(1, Math.ceil(CUSTOM_AVATAR_SYNC_DELAY_MS / 1000))
    let remainingSeconds = totalSeconds
    setAssetMessage(`${t('beautify.avatar.waitingSync')} ${remainingSeconds}s`)
    avatarSyncTimerRef.current = window.setInterval(() => {
      remainingSeconds -= 1
      if (remainingSeconds > 0) {
        setAssetMessage(`${t('beautify.avatar.waitingSync')} ${remainingSeconds}s`)
        return
      }

      cancelScheduledCustomAvatarSync()
      setAssetMessage(t('beautify.avatar.syncing'))
      void syncCustomAvatarAssetPathToCloud(assetPath)
    }, 1000)
  }

  const addCustomAvatarAssetPath = (assetPath: string) => {
    const nextPath = normalizeAssetPath(assetPath)

    if (!nextPath) {
      setAssetMessage(t('beautify.status.assetInputRequired'))
      return false
    }
    if (nextPath.includes('..')) {
      setAssetMessage(t('beautify.status.assetPathInvalid'))
      return false
    }
    if (/^[a-z]+:\/\//i.test(nextPath)) {
      setAssetMessage(t('beautify.status.assetUrlRejected'))
      return false
    }
    if (!isImageFile(nextPath)) {
      setAssetMessage(t('beautify.status.avatarImageOnly'))
      return false
    }
    if (customAvatarAssetPaths.includes(nextPath)) {
      setAssetMessage(t('beautify.status.avatarDuplicate'))
      return false
    }

    if (!assetPaths.includes(nextPath)) {
      saveAssetPaths([...assetPaths, nextPath])
    }

    const shouldSync = customAvatarAssetPaths.length === 0
    saveCustomAvatarAssetPaths([...customAvatarAssetPaths, nextPath])
    if (shouldSync) {
      saveCustomAvatarActiveAssetPath(nextPath)
    }
    setAssetMessage(t('beautify.status.avatarAdded', { path: nextPath }))
    if (shouldSync) {
      scheduleCustomAvatarSync(nextPath)
    }
    return true
  }

  const removeCustomAvatarAssetPathConfirmed = (assetPath: string) => {
    const nextPaths = customAvatarAssetPaths.filter((path) => path !== assetPath)
    const isActivePath = (customAvatarActiveAssetPath ?? customAvatarAssetPaths[0]) === assetPath
    const nextActivePath = isActivePath ? nextPaths[0] ?? null : customAvatarActiveAssetPath
    removeAssetPathEverywhere(assetPath)
    if (nextPaths.length === 0) {
      saveCustomAvatarActiveAssetPath(null)
      cancelScheduledCustomAvatarSync()
      setAssetMessage(t('beautify.assets.instructions'))
    }
    setAssetMessage(t('beautify.status.avatarRemoved', { path: assetPath }))
    if (isActivePath && nextActivePath) {
      scheduleCustomAvatarSync(nextActivePath)
    } else if (isActivePath) {
      cancelScheduledCustomAvatarSync()
      setAssetMessage(t('beautify.assets.instructions'))
    }
  }

  const removeCustomAvatarAssetPath = (assetPath: string) => {
    if (!requestSharedAssetRemoval(assetPath, 'avatar')) return

    removeCustomAvatarAssetPathConfirmed(assetPath)
  }

  const closeSharedAssetRemovalModal = () => {
    setPendingSharedAssetRemoval(null)
  }

  const confirmSharedAssetRemoval = () => {
    const pending = pendingSharedAssetRemoval
    if (!pending) return

    setPendingSharedAssetRemoval(null)
    if (pending.source === 'wallpaper') {
      removeHomepageBackgroundAssetPathConfirmed(pending.assetPath)
    } else {
      removeCustomAvatarAssetPathConfirmed(pending.assetPath)
    }
  }

  const applyCustomAvatarAssetPath = (assetPath: string) => {
    if (!customAvatarAssetPaths.includes(assetPath)) return

    if ((customAvatarActiveAssetPath ?? customAvatarAssetPaths[0]) === assetPath) {
      setAssetMessage(t('beautify.status.avatarCurrent', { path: assetPath }))
      scheduleCustomAvatarSync(assetPath)
      return
    }

    saveCustomAvatarActiveAssetPath(assetPath)
    setAssetMessage(t('beautify.status.avatarApplied', { path: assetPath }))
    scheduleCustomAvatarSync(assetPath)
  }

  const stopDragAutoScroll = () => {
    dragPointerYRef.current = null
    setIsHomepageBackgroundDropActive(false)
    setIsAvatarDropActive(false)
    if (dragScrollFrameRef.current != null) {
      cancelAnimationFrame(dragScrollFrameRef.current)
      dragScrollFrameRef.current = null
    }
  }

  const runDragAutoScroll = () => {
    dragScrollFrameRef.current = null

    const scrollEl = scrollRef.current
    const pointerY = dragPointerYRef.current
    if (!scrollEl || pointerY == null) return

    const rect = scrollEl.getBoundingClientRect()
    let speed = 0

    if (pointerY < rect.top + DRAG_SCROLL_EDGE_SIZE) {
      const intensity = (rect.top + DRAG_SCROLL_EDGE_SIZE - pointerY) / DRAG_SCROLL_EDGE_SIZE
      speed = -DRAG_SCROLL_MAX_SPEED * Math.min(intensity, 1)
    } else if (pointerY > rect.bottom - DRAG_SCROLL_EDGE_SIZE) {
      const intensity = (pointerY - (rect.bottom - DRAG_SCROLL_EDGE_SIZE)) / DRAG_SCROLL_EDGE_SIZE
      speed = DRAG_SCROLL_MAX_SPEED * Math.min(intensity, 1)
    }

    if (speed !== 0) {
      scrollEl.scrollTop += speed
    }

    dragScrollFrameRef.current = requestAnimationFrame(runDragAutoScroll)
  }

  const updateDragAutoScroll = (clientY: number) => {
    dragPointerYRef.current = clientY
    if (dragScrollFrameRef.current == null) {
      dragScrollFrameRef.current = requestAnimationFrame(runDragAutoScroll)
    }
  }

  const handleAvatarDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    setIsAvatarDropActive(true)
    updateDragAutoScroll(event.clientY)
  }

  const handleAvatarDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsAvatarDropActive(false)
    }
  }

  const handleHomepageBackgroundDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    setIsHomepageBackgroundDropActive(true)
    updateDragAutoScroll(event.clientY)
  }

  const handleHomepageBackgroundDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsHomepageBackgroundDropActive(false)
    }
  }

  const handleHomepageBackgroundDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsHomepageBackgroundDropActive(false)
    stopDragAutoScroll()
    const assetPath = event.dataTransfer.getData('text/plain')
    addHomepageBackgroundAssetPath(assetPath)
  }

  const handleAvatarDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsAvatarDropActive(false)
    stopDragAutoScroll()
    const assetPath = event.dataTransfer.getData('text/plain')
    addCustomAvatarAssetPath(assetPath)
  }
  const effectOptions = [
    { value: 'none', label: t('option.windowEffect.none') },
    { value: 'blurbehind', label: t('option.windowEffect.blurbehind') },
    { value: 'acrylic', label: t('option.windowEffect.acrylic') },
    { value: 'unified', label: t('option.windowEffect.unified') },
    { value: 'mica', label: t('option.windowEffect.mica') },
    { value: 'transparent', label: t('option.windowEffect.transparent') },
  ]

  const [gameModeFilter, setGameModeFilter] = useState(store.get('gameModeFilter'))
  const [hideTFT, setHideTFT] = useState(store.get('hideTFT'))
  const [hideRightNavText, setHideRightNavText] = useState(store.get('hideRightNavText'))
  const [windowEffect, setWindowEffect] = useState(store.get('windowEffect'))
  const [unlockChromas, setUnlockChromas] = useState(store.get('unlockChromas'))

  const handleEffectChange = (value: string) => {
    setWindowEffect(value)
    store.set('windowEffect', value)
    if (value === 'none') {
      Effect.clear()
      logger.info('Window effect cleared')
    } else {
      Effect.apply(value as 'acrylic', { color: '#0006' })
      logger.info('Window effect applied: %s', value)
    }
  }

  const [globalParticle, setGlobalParticle] = useState(store.get('globalParticle'))
    useEffect(() => {
      const unsubs = [
        store.onChange('globalParticle', setGlobalParticle),
      ]
      return () => unsubs.forEach((fn) => fn())
    }, [])

  return (
    <div
      className="sona-settings"
      ref={scrollRef}
      onDragEnd={stopDragAutoScroll}
      onDrop={stopDragAutoScroll}
    >
      <SettingGroup title={t('beautify.group.client')}>

        <SettingCard
          title={t('tools.gameModeFilter.title')}
          description={t('tools.gameModeFilter.description')}        
        >
          <SonaSwitch
            checked={gameModeFilter}
            onChange={(v) => { setGameModeFilter(v); store.set('gameModeFilter', v) }}
          />
        </SettingCard>
        <SettingCard
          title={t('tools.unlockChromas.title')}
          description={t('tools.unlockChromas.description')}        
        >
          <SonaSwitch
            checked={unlockChromas}
            onChange={(v) => { setUnlockChromas(v); store.set('unlockChromas', v) }}
          />
        </SettingCard>        
        <SettingCard
          title={t('tools.hideTFT.title')}
          description={t('tools.hideTFT.description')}
        >
          <SonaSwitch
            checked={hideTFT}
            onChange={(v) => { setHideTFT(v); store.set('hideTFT', v) }}
          />
        </SettingCard>
        <SettingCard
          title={t('tools.hideRightNavText.title')}
          description={t('tools.hideRightNavText.description')}
        >
          <SonaSwitch
            checked={hideRightNavText}
            onChange={(v) => { setHideRightNavText(v); store.set('hideRightNavText', v) }}
          />
        </SettingCard>     
        <SettingCard
          title={t('tools.windowEffect.title')}
          description={t('tools.windowEffect.description')}
        >
          <div style={{ minWidth: 130 }}>
            <SonaSelect
              options={effectOptions}
              value={windowEffect}
              onChange={handleEffectChange}
            />
          </div>
        </SettingCard>
        <SettingCard
          title={t('settings.globalParticle.title')}
          description={t('settings.globalParticle.description')}
        >
          <SonaSwitch
            checked={globalParticle}
            onChange={(v) => { setGlobalParticle(v); store.set('globalParticle', v) }}
          />
        </SettingCard>             
      </SettingGroup>

      <SettingGroup title={t('beautify.group.wallpaper')}>
        <SettingCard
          title={t('beautify.wallpaperMode.title')}
          description={t('beautify.wallpaperMode.description')}
        >
          <SonaSwitch
            checked={beautifyWallpaperMode}
            onChange={toggleBeautifyWallpaperMode}
          />
        </SettingCard>
        {beautifyWallpaperMode && (
          <div className="sona-setting-switch-panel">
            <div className="sona-setting-panel-section">
              <SettingCard
                title={t('beautify.glass.title')}
                description={t('beautify.glass.description')}
              >
                <div className="sona-glass-settings">
                  <SonaSlider
                    label={t('beautify.slider.blur')}
                    value={glassBlur}
                    min={0}
                    max={30}
                    unit="px"
                    onChange={updateGlassBlur}
                  />
                  <SonaSlider
                    label={t('beautify.slider.opacity')}
                    value={glassOpacity}
                    min={0}
                    max={80}
                    unit="%"
                    onChange={updateGlassOpacity}
                  />
                </div>
              </SettingCard>
              <div
                className={[
                  'sona-wallpaper-dropzone',
                  homepageBackgroundAssetPaths.length === 0 ? 'sona-wallpaper-dropzone--empty' : '',
                  isHomepageBackgroundDropActive ? 'sona-wallpaper-dropzone--active' : '',
                ].filter(Boolean).join(' ')}
                onDragOver={handleHomepageBackgroundDragOver}
                onDragLeave={handleHomepageBackgroundDragLeave}
                onDrop={handleHomepageBackgroundDrop}
              >
                {homepageBackgroundAssetPaths.length > 0 ? (
                  <div className="sona-wallpaper-grid">
                    {homepageBackgroundAssetPaths.map((assetPath) => {
                      const isApplied = homepageBackgroundAssetPath === assetPath

                      return (
                        <div
                          className={[
                            'sona-wallpaper-card',
                            isApplied ? 'sona-wallpaper-card--applied' : '',
                          ].filter(Boolean).join(' ')}
                          key={assetPath}
                          role="button"
                          tabIndex={0}
                          onClick={() => applyHomepageBackgroundAssetPath(assetPath)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              applyHomepageBackgroundAssetPath(assetPath)
                            }
                          }}
                          aria-label={`${t('common.apply')} ${assetPath}`}
                        >
                          <button
                            className="sona-asset-card-remove"
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              removeHomepageBackgroundAssetPath(assetPath)
                            }}
                            onKeyDown={(event) => event.stopPropagation()}
                            aria-label={`${t('common.remove')} ${assetPath}`}
                          >
                            ×
                          </button>
                          <button
                            className="sona-wallpaper-card-edit"
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              openHomepageBackgroundAdjustModal(assetPath)
                            }}
                            onKeyDown={(event) => event.stopPropagation()}
                            aria-label={`${t('beautify.wallpaper.adjust')} ${assetPath}`}
                          >
                            {t('beautify.wallpaper.adjust')}
                          </button>
                          {isVideoFile(assetPath) ? (
                            <div className="sona-wallpaper-video-preview">
                              <img
                                src={getAssetUrl(getVideoPosterAssetPath(assetPath))}
                                alt=""
                                onError={(event) => {
                                  event.currentTarget.classList.remove('sona-wallpaper-video-poster--loaded')
                                  event.currentTarget.parentElement?.classList.add('sona-wallpaper-video-preview--empty')
                                }}
                                onLoad={(event) => {
                                  event.currentTarget.classList.add('sona-wallpaper-video-poster--loaded')
                                  event.currentTarget.parentElement?.classList.remove('sona-wallpaper-video-preview--empty')
                                }}
                              />
                              <span>{t('beautify.media.video')}</span>
                            </div>
                          ) : (
                            <img src={getAssetUrl(assetPath)} alt={assetPath} />
                          )}
                          <span className="sona-wallpaper-card-name">{assetPath}</span>
                          <span className="sona-wallpaper-card-action">{t('beautify.wallpaper.clickApply')}</span>
                        </div>
                      )
                    })}
                    <button
                      className="sona-wallpaper-add-card"
                      type="button"
                      onClick={() => setShowHomepageBackgroundInput((show) => !show)}
                      aria-label={showHomepageBackgroundInput ? t('common.cancel') : t('beautify.assets.add')}
                    >
                      <span
                        className={[
                          'sona-wallpaper-add-card-plus',
                          showHomepageBackgroundInput ? 'sona-wallpaper-add-mark--minus' : '',
                        ].filter(Boolean).join(' ')}
                        aria-hidden="true"
                      />
                      <span>{showHomepageBackgroundInput ? t('common.cancel') : t('beautify.assets.add')}</span>
                    </button>
                  </div>
                ) : (
                  <div className="sona-avatar-dropzone-placeholder">
                    <button
                      className="sona-wallpaper-add-trigger"
                      type="button"
                      onClick={() => setShowHomepageBackgroundInput((show) => !show)}
                      aria-label={showHomepageBackgroundInput ? t('common.cancel') : t('beautify.assets.add')}
                    >
                      <span
                        className={showHomepageBackgroundInput ? 'sona-wallpaper-add-mark--minus' : ''}
                        aria-hidden="true"
                      />
                    </button>
                    <div>{showHomepageBackgroundInput ? t('common.cancel') : t('beautify.wallpaper.dropHint')}</div>
                  </div>
                )}
              </div>
              {showHomepageBackgroundInput && (
                <SettingCard
                  title={t('beautify.assets.inputTitle')}
                  description={t('beautify.assets.inputDescription')}
                >
                  <div className="sona-wallpaper-add-form">
                    <div className="sona-asset-path-row">
                      <SonaInput
                        value={assetPathInput}
                        onChange={setAssetPathInput}
                        placeholder={t('beautify.assets.examplePlaceholder')}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') addHomepageBackgroundInputPath()
                        }}
                      />
                      <SonaButton onClick={addHomepageBackgroundInputPath}>
                        {t('beautify.assets.add')}
                      </SonaButton>
                      <SonaButton onClick={() => window.openPluginsFolder(getPluginAssetsFolderPath())}>
                        {t('beautify.assets.openFolder')}
                      </SonaButton>
                    </div>
                    <p className="sona-asset-browser-status">{assetMessage}</p>
                  </div>
                </SettingCard>
              )}
              <SettingCard
                title={t('beautify.wallpaper.random.title')}
                description={t('beautify.wallpaper.random.description')}
              >
                <SonaSwitch
                  checked={homepageBackgroundRandom}
                  onChange={toggleHomepageBackgroundRandom}
                />
              </SettingCard>
              <SettingCard title={t('beautify.wallpaper.effect')}>
                <div className="sona-glass-settings">
                  <SonaSlider
                    label={t('beautify.slider.blur')}
                    value={homepageBackgroundBlur}
                    min={0}
                    max={30}
                    unit="px"
                    onChange={updateHomepageBackgroundBlur}
                  />
                  <SonaSlider
                    label={t('beautify.slider.opacity')}
                    value={homepageBackgroundOpacity}
                    min={0}
                    max={80}
                    unit="%"
                    onChange={updateHomepageBackgroundOpacity}
                  />
                </div>
              </SettingCard>
            </div>
          </div>
        )}
      </SettingGroup>

      <SettingGroup title={t('beautify.group.avatar')}>
        <SettingCard
          title={t('beautify.avatarMode.title')}
          description={t('beautify.avatarMode.description')}
        >
          <SonaSwitch
            checked={customAvatarMode}
            onChange={toggleCustomAvatarMode}
          />
        </SettingCard>
        {customAvatarMode && (
          <div className="sona-setting-switch-panel">
            <div className="sona-setting-panel-section">
              <div
                className={[
                  'sona-avatar-dropzone',
                  customAvatarAssetPaths.length === 0 ? 'sona-avatar-dropzone--empty' : '',
                  isAvatarDropActive ? 'sona-avatar-dropzone--active' : '',
                ].filter(Boolean).join(' ')}
                onDragOver={handleAvatarDragOver}
                onDragLeave={handleAvatarDragLeave}
                onDrop={handleAvatarDrop}
              >
                {customAvatarAssetPaths.length > 0 ? (
                  <div className="sona-avatar-grid">
                    {customAvatarAssetPaths.map((assetPath) => {
                      const isApplied = (customAvatarActiveAssetPath ?? customAvatarAssetPaths[0]) === assetPath
                      const adjustment = customAvatarAdjustments[assetPath] ?? DEFAULT_AVATAR_ADJUSTMENT

                      return (
                        <div
                          className={[
                            'sona-avatar-card',
                            isApplied ? 'sona-avatar-card--applied' : '',
                          ].filter(Boolean).join(' ')}
                          key={assetPath}
                          role="button"
                          tabIndex={0}
                          onClick={() => applyCustomAvatarAssetPath(assetPath)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              applyCustomAvatarAssetPath(assetPath)
                            }
                          }}
                          aria-label={`${t('common.apply')} ${assetPath}`}
                        >
                          <button
                            className="sona-asset-card-remove"
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              removeCustomAvatarAssetPath(assetPath)
                            }}
                            onKeyDown={(event) => event.stopPropagation()}
                            aria-label={`${t('common.remove')} ${assetPath}`}
                          >
                            ×
                          </button>
                          <button
                            className="sona-wallpaper-card-edit"
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              openCustomAvatarAdjustModal(assetPath)
                            }}
                            onKeyDown={(event) => event.stopPropagation()}
                            aria-label={`${t('beautify.wallpaper.adjust')} ${assetPath}`}
                          >
                            {t('beautify.wallpaper.adjust')}
                          </button>
                          <div className="sona-avatar-card-preview">
                            <div
                              className="sona-avatar-preview-stage"
                              style={getAvatarPreviewStageStyle(assetPath, adjustment)}
                            >
                              <img
                                src={getAssetUrl(assetPath)}
                                alt={assetPath}
                                onLoad={(event) => updateAvatarImageSize(assetPath, event.currentTarget)}
                              />
                            </div>
                          </div>
                          <span className="sona-avatar-card-name">{assetPath}</span>
                          <span className="sona-avatar-card-action">{t('beautify.wallpaper.clickApply')}</span>
                        </div>
                      )
                    })}
                    <button
                      className="sona-wallpaper-add-card"
                      type="button"
                      onClick={() => setShowAvatarInput((show) => !show)}
                      aria-label={showAvatarInput ? t('common.cancel') : t('beautify.assets.add')}
                    >
                      <span
                        className={[
                          'sona-wallpaper-add-card-plus',
                          showAvatarInput ? 'sona-wallpaper-add-mark--minus' : '',
                        ].filter(Boolean).join(' ')}
                        aria-hidden="true"
                      />
                      <span>{showAvatarInput ? t('common.cancel') : t('beautify.assets.add')}</span>
                    </button>
                  </div>
                ) : (
                  <div className="sona-avatar-dropzone-placeholder">
                    <button
                      className="sona-wallpaper-add-trigger"
                      type="button"
                      onClick={() => setShowAvatarInput((show) => !show)}
                      aria-label={showAvatarInput ? t('common.cancel') : t('beautify.assets.add')}
                    >
                      <span
                        className={showAvatarInput ? 'sona-wallpaper-add-mark--minus' : ''}
                        aria-hidden="true"
                      />
                    </button>
                    <div>{showAvatarInput ? t('common.cancel') : t('beautify.avatar.dropHint')}</div>
                  </div>
                )}
              </div>
              {showAvatarInput && (
                <SettingCard
                  title={t('beautify.avatar.inputTitle')}
                  description={t('beautify.avatar.inputDescription')}
                >
                  <div className="sona-wallpaper-add-form">
                    <div className="sona-asset-path-row">
                      <SonaInput
                        value={assetPathInput}
                        onChange={setAssetPathInput}
                        placeholder={t('beautify.assets.examplePlaceholder')}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') addCustomAvatarInputPath()
                        }}
                      />
                      <SonaButton onClick={addCustomAvatarInputPath}>
                        {t('beautify.assets.add')}
                      </SonaButton>
                      <SonaButton onClick={() => window.openPluginsFolder(getPluginAssetsFolderPath())}>
                        {t('beautify.assets.openFolder')}
                      </SonaButton>
                    </div>
                    <p className="sona-asset-browser-status">{assetMessage}</p>
                  </div>
                </SettingCard>
              )}
            </div>
          </div>
        )}
      </SettingGroup>

      <Modal
        open={Boolean(editingWallpaperAssetPath)}
        onClose={closeHomepageBackgroundAdjustModal}
        width={900}
        height={560}
      >
        <div className="sona-wallpaper-adjust-modal">
          <div className="sona-wallpaper-adjust-header">
            <h3>{t('beautify.wallpaper.adjustTitle')}</h3>
            <span>{editingWallpaperAssetPath}</span>
          </div>

          {editingWallpaperAssetPath && (
            <div className="sona-wallpaper-adjust-content">
              <div
                className="sona-wallpaper-adjust-frame"
                ref={wallpaperFrameRef}
                onPointerDown={handleWallpaperFramePointerDown}
                onPointerMove={handleWallpaperFramePointerMove}
                onPointerUp={handleWallpaperFramePointerEnd}
                onPointerCancel={handleWallpaperFramePointerEnd}
                onWheel={handleWallpaperFrameWheel}
              >
                <div
                  className="sona-wallpaper-preview-stage"
                  style={getWallpaperPreviewStageStyle(editingWallpaperAssetPath, draftWallpaperAdjustment)}
                >
                  {isVideoFile(editingWallpaperAssetPath) ? (
                    <video
                      src={getAssetUrl(editingWallpaperAssetPath)}
                      muted
                      loop
                      autoPlay
                      playsInline
                      onLoadedMetadata={(event) =>
                        updateWallpaperMediaSize(
                          editingWallpaperAssetPath,
                          event.currentTarget.videoWidth,
                          event.currentTarget.videoHeight,
                        )
                      }
                    />
                  ) : (
                    <img
                      src={getAssetUrl(editingWallpaperAssetPath)}
                      alt={editingWallpaperAssetPath}
                      onLoad={(event) =>
                        updateWallpaperMediaSize(
                          editingWallpaperAssetPath,
                          event.currentTarget.naturalWidth,
                          event.currentTarget.naturalHeight,
                        )
                      }
                    />
                  )}
                </div>
                <div className="sona-wallpaper-adjust-frame-guide" />
              </div>

              <div className="sona-wallpaper-adjust-controls">
                <div className="sona-wallpaper-adjust-hint">
                  {t('beautify.wallpaper.adjustHint')}
                </div>
              </div>
            </div>
          )}

          <div className="sona-wallpaper-adjust-actions">
            <SonaButton onClick={resetHomepageBackgroundAdjustment}>
              {t('common.reset')}
            </SonaButton>
            <SonaButton onClick={closeHomepageBackgroundAdjustModal}>
              {t('common.cancel')}
            </SonaButton>
            <SonaButton onClick={saveHomepageBackgroundAdjustment}>
              {t('beautify.wallpaper.saveCrop')}
            </SonaButton>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(pendingSharedAssetRemoval)}
        onClose={closeSharedAssetRemovalModal}
        width={460}
        height="auto"
        maskClosable
        closable={false}
      >
        <div className="sona-confirm-modal">
          <div className="sona-confirm-modal-header">
            <h3>{t('beautify.confirm.assetUsedTitle')}</h3>
          </div>
          <p className="sona-confirm-modal-message">
            {pendingSharedAssetRemoval
              ? t('beautify.confirm.assetUsedByWallpaperAndAvatar', { path: pendingSharedAssetRemoval.assetPath })
              : ''}
          </p>
          <div className="sona-confirm-modal-actions">
            <SonaButton onClick={confirmSharedAssetRemoval}>
              {t('common.confirm')}
            </SonaButton>
            <SonaButton onClick={closeSharedAssetRemovalModal}>
              {t('common.cancel')}
            </SonaButton>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(editingAvatarAssetPath)}
        onClose={closeCustomAvatarAdjustModal}
        width={620}
        height={560}
      >
        <div className="sona-wallpaper-adjust-modal">
          <div className="sona-wallpaper-adjust-header">
            <h3>{t('beautify.avatar.adjustTitle')}</h3>
            <span>{editingAvatarAssetPath}</span>
          </div>

          {editingAvatarAssetPath && (
            <div className="sona-wallpaper-adjust-content">
              <div
                className="sona-avatar-adjust-frame"
                ref={avatarAdjustFrameRef}
                onPointerDown={handleAvatarFramePointerDown}
                onPointerMove={handleAvatarFramePointerMove}
                onPointerUp={handleAvatarFramePointerEnd}
                onPointerCancel={handleAvatarFramePointerEnd}
                onWheel={handleAvatarFrameWheel}
              >
                <div
                  className="sona-avatar-preview-stage"
                  style={getAvatarPreviewStageStyle(editingAvatarAssetPath, draftAvatarAdjustment)}
                >
                  <img
                    src={getAssetUrl(editingAvatarAssetPath)}
                    alt={editingAvatarAssetPath}
                    onLoad={(event) => updateAvatarImageSize(editingAvatarAssetPath, event.currentTarget)}
                  />
                </div>
                <div className="sona-avatar-adjust-mask" />
              </div>

              <div className="sona-wallpaper-adjust-controls">
                <div className="sona-wallpaper-adjust-hint">
                  {t('beautify.avatar.adjustHint')}
                </div>
              </div>
            </div>
          )}

          <div className="sona-wallpaper-adjust-actions">
            <SonaButton onClick={resetCustomAvatarAdjustment}>
              {t('common.reset')}
            </SonaButton>
            <SonaButton onClick={closeCustomAvatarAdjustModal}>
              {t('common.cancel')}
            </SonaButton>
            <SonaButton onClick={saveCustomAvatarAdjustment}>
              {t('beautify.wallpaper.saveCrop')}
            </SonaButton>
          </div>
        </div>
      </Modal>
    </div>
  )
}

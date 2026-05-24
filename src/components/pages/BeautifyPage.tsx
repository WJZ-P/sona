import { useRef, useState, type DragEvent, type PointerEvent, type WheelEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { SettingCard, SettingGroup } from '@/components/ui/SettingCard'
import { SonaButton } from '@/components/ui/SonaButton'
import { SonaInput } from '@/components/ui/SonaInput'
import { SonaSlider } from '@/components/ui/SonaSlider'
import { SonaSwitch } from '@/components/ui/SonaSwitch'
import { syncCustomAvatarAssetPath } from '@/lib/features/beautify-client/custom-avatar'
import { getPluginAssetsFolderPath, resolvePluginAssetUrl } from '@/lib/plugin-resolver'
import { store } from '@/lib/store'
import { useI18n } from '@/i18n'
import '@/styles/SettingsPage.css'

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'ico'])
const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'ogg', 'ogv', 'mov', 'm4v'])
const ASSET_DRAG_MIME = 'application/x-sona-asset-path'
const DRAG_SCROLL_EDGE_SIZE = 76
const DRAG_SCROLL_MAX_SPEED = 20
const DEFAULT_WALLPAPER_ADJUSTMENT = { scale: 1, offsetX: 0, offsetY: 0 }
const WALLPAPER_SCALE_MIN = 1
const WALLPAPER_SCALE_MAX = 3
const WALLPAPER_WHEEL_SCALE_STEP = 0.08

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
  return value
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\.\/+/, '')
    .replace(/^assets\/+/i, '')
    .replace(/^\/+/, '')
}

function getAssetUrl(assetPath: string): string {
  return resolvePluginAssetUrl(assetPath)
}

function getWallpaperBackgroundSize(adjustment: WallpaperAdjustment): string {
  return adjustment.scale === 1 ? 'cover' : `${Number((adjustment.scale * 100).toFixed(2))}% auto`
}

function getWallpaperBackgroundPosition(adjustment: WallpaperAdjustment): string {
  return `calc(50% + ${Number(adjustment.offsetX.toFixed(2))}%) calc(50% + ${Number(adjustment.offsetY.toFixed(2))}%)`
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function BeautifyPage() {
  const { t } = useI18n()
  const scrollRef = useRef<HTMLDivElement>(null)
  const wallpaperFrameRef = useRef<HTMLDivElement>(null)
  const wallpaperDragStartRef = useRef<WallpaperDragStart | null>(null)
  const dragScrollFrameRef = useRef<number | null>(null)
  const dragPointerYRef = useRef<number | null>(null)
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
  const [customAvatarAssetPaths, setCustomAvatarAssetPaths] = useState(() => store.get('customAvatarAssetPaths'))
  const [assetMessage, setAssetMessage] = useState(() => t('beautify.assets.instructions'))
  const [editingWallpaperAssetPath, setEditingWallpaperAssetPath] = useState<string | null>(null)
  const [draftWallpaperAdjustment, setDraftWallpaperAdjustment] = useState<WallpaperAdjustment>(DEFAULT_WALLPAPER_ADJUSTMENT)
  const [isHomepageBackgroundDropActive, setIsHomepageBackgroundDropActive] = useState(false)
  const [isAvatarDropActive, setIsAvatarDropActive] = useState(false)

  const saveAssetPaths = (paths: string[]) => {
    setAssetPaths(paths)
    store.set('beautifyAssetPaths', paths)
  }

  const saveCustomAvatarAssetPaths = (paths: string[]) => {
    setCustomAvatarAssetPaths(paths)
    store.set('customAvatarAssetPaths', paths)
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

  const addAssetPath = () => {
    const nextPath = normalizeAssetPath(assetPathInput)

    if (!nextPath) {
      setAssetMessage(t('beautify.status.assetInputRequired'))
      return
    }
    if (nextPath.includes('..')) {
      setAssetMessage(t('beautify.status.assetPathInvalid'))
      return
    }
    if (/^[a-z]+:\/\//i.test(nextPath)) {
      setAssetMessage(t('beautify.status.assetUrlRejected'))
      return
    }
    if (!isSupportedMediaFile(nextPath)) {
      setAssetMessage(t('beautify.status.assetUnsupported'))
      return
    }
    if (assetPaths.includes(nextPath)) {
      setAssetMessage(t('beautify.status.assetDuplicate'))
      return
    }

    const nextPaths = [...assetPaths, nextPath]
    saveAssetPaths(nextPaths)
    setAssetPathInput('')
    setAssetMessage(t('beautify.status.assetAdded', { path: nextPath }))
  }

  const removeAssetPath = (assetPath: string) => {
    const nextPaths = assetPaths.filter((path) => path !== assetPath)
    const nextHomepageBackgroundAssetPaths = homepageBackgroundAssetPaths.filter((path) => path !== assetPath)
    const nextHomepageBackgroundAdjustments = { ...homepageBackgroundAdjustments }
    delete nextHomepageBackgroundAdjustments[assetPath]
    saveAssetPaths(nextPaths)
    saveHomepageBackgroundAssetPaths(nextHomepageBackgroundAssetPaths)
    saveHomepageBackgroundAdjustments(nextHomepageBackgroundAdjustments)
    saveCustomAvatarAssetPaths(customAvatarAssetPaths.filter((path) => path !== assetPath))
    if (store.get('beautifyHomepageBackgroundLastRandomAssetPath') === assetPath) {
      store.set('beautifyHomepageBackgroundLastRandomAssetPath', null)
    }
    if (homepageBackgroundAssetPath === assetPath) {
      saveHomepageBackgroundAssetPath(nextHomepageBackgroundAssetPaths[0] ?? null)
    }
    setAssetMessage(t('beautify.status.assetRemoved', { path: assetPath }))
  }

  const applyHomepageBackgroundAssetPath = (assetPath: string) => {
    if (!assetPaths.includes(assetPath)) {
      setAssetMessage(t('beautify.status.wallpaperListOnly'))
      return
    }

    saveHomepageBackgroundAssetPath(assetPath)
    setAssetMessage(t('beautify.status.wallpaperApplied', { path: assetPath }))
  }

  const addHomepageBackgroundAssetPath = (assetPath: string) => {
    if (!assetPaths.includes(assetPath)) {
      setAssetMessage(t('beautify.status.wallpaperAddListOnly'))
      return
    }
    if (!isSupportedMediaFile(assetPath)) {
      setAssetMessage(t('beautify.status.wallpaperMediaOnly'))
      return
    }

    if (!homepageBackgroundAssetPaths.includes(assetPath)) {
      saveHomepageBackgroundAssetPaths([...homepageBackgroundAssetPaths, assetPath])
    }
    applyHomepageBackgroundAssetPath(assetPath)
  }

  const removeHomepageBackgroundAssetPath = (assetPath: string) => {
    const nextPaths = homepageBackgroundAssetPaths.filter((path) => path !== assetPath)
    const nextAdjustments = { ...homepageBackgroundAdjustments }
    delete nextAdjustments[assetPath]
    saveHomepageBackgroundAssetPaths(nextPaths)
    saveHomepageBackgroundAdjustments(nextAdjustments)
    if (store.get('beautifyHomepageBackgroundLastRandomAssetPath') === assetPath) {
      store.set('beautifyHomepageBackgroundLastRandomAssetPath', null)
    }
    if (homepageBackgroundAssetPath === assetPath) {
      saveHomepageBackgroundAssetPath(nextPaths[0] ?? null)
    }
    setAssetMessage(t('beautify.status.wallpaperRemoved', { path: assetPath }))
  }

  const openHomepageBackgroundAdjustModal = (assetPath: string) => {
    setEditingWallpaperAssetPath(assetPath)
    setDraftWallpaperAdjustment(homepageBackgroundAdjustments[assetPath] ?? DEFAULT_WALLPAPER_ADJUSTMENT)
    wallpaperDragStartRef.current = null
  }

  const closeHomepageBackgroundAdjustModal = () => {
    setEditingWallpaperAssetPath(null)
    wallpaperDragStartRef.current = null
  }

  const saveHomepageBackgroundAdjustment = () => {
    if (!editingWallpaperAssetPath) return

    const nextAdjustments = {
      ...homepageBackgroundAdjustments,
      [editingWallpaperAssetPath]: draftWallpaperAdjustment,
    }
    saveHomepageBackgroundAdjustments(nextAdjustments)
    setAssetMessage(t('beautify.status.wallpaperSaved', { path: editingWallpaperAssetPath }))
    closeHomepageBackgroundAdjustModal()
  }

  const resetHomepageBackgroundAdjustment = () => {
    setDraftWallpaperAdjustment(DEFAULT_WALLPAPER_ADJUSTMENT)
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
    if (!dragStart || !frame) return

    const rect = frame.getBoundingClientRect()
    const offsetX = dragStart.offsetX - ((event.clientX - dragStart.clientX) / rect.width) * 100
    const offsetY = dragStart.offsetY - ((event.clientY - dragStart.clientY) / rect.height) * 100

    setDraftWallpaperAdjustment((current) => ({
      ...current,
      offsetX: clampNumber(offsetX, -100, 100),
      offsetY: clampNumber(offsetY, -100, 100),
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
    setDraftWallpaperAdjustment((current) => ({
      ...current,
      scale: Number(clampNumber(current.scale + direction * WALLPAPER_WHEEL_SCALE_STEP, WALLPAPER_SCALE_MIN, WALLPAPER_SCALE_MAX).toFixed(2)),
    }))
  }

  const syncCustomAvatarAssetPathToCloud = async (assetPath: string) => {
    try {
      await syncCustomAvatarAssetPath(assetPath)
      setAssetMessage(t('beautify.status.avatarSynced', { path: assetPath }))
    } catch (err) {
      setAssetMessage(t('beautify.status.avatarSyncFailed', { error: err instanceof Error ? err.message : String(err) }))
    }
  }

  const addCustomAvatarAssetPath = (assetPath: string) => {
    if (!assetPaths.includes(assetPath)) {
      setAssetMessage(t('beautify.status.avatarListOnly'))
      return
    }
    if (!isImageFile(assetPath)) {
      setAssetMessage(t('beautify.status.avatarImageOnly'))
      return
    }
    if (customAvatarAssetPaths.includes(assetPath)) {
      setAssetMessage(t('beautify.status.avatarDuplicate'))
      return
    }

    const shouldSync = customAvatarAssetPaths.length === 0
    saveCustomAvatarAssetPaths([...customAvatarAssetPaths, assetPath])
    setAssetMessage(t('beautify.status.avatarAdded', { path: assetPath }))
    if (shouldSync) {
      void syncCustomAvatarAssetPathToCloud(assetPath)
    }
  }

  const removeCustomAvatarAssetPath = (assetPath: string) => {
    const nextPaths = customAvatarAssetPaths.filter((path) => path !== assetPath)
    const nextActivePath = nextPaths[0]
    const shouldSyncNext = customAvatarAssetPaths[0] === assetPath && Boolean(nextActivePath)
    saveCustomAvatarAssetPaths(nextPaths)
    setAssetMessage(t('beautify.status.avatarRemoved', { path: assetPath }))
    if (shouldSyncNext && nextActivePath) {
      void syncCustomAvatarAssetPathToCloud(nextActivePath)
    }
  }

  const applyCustomAvatarAssetPath = (assetPath: string) => {
    if (!customAvatarAssetPaths.includes(assetPath)) return

    if (customAvatarAssetPaths[0] === assetPath) {
      setAssetMessage(t('beautify.status.avatarCurrent', { path: assetPath }))
      void syncCustomAvatarAssetPathToCloud(assetPath)
      return
    }

    const nextPaths = [
      assetPath,
      ...customAvatarAssetPaths.filter((path) => path !== assetPath),
    ]
    saveCustomAvatarAssetPaths(nextPaths)
    setAssetMessage(t('beautify.status.avatarApplied', { path: assetPath }))
    void syncCustomAvatarAssetPathToCloud(assetPath)
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

  const handleAssetDragStart = (event: DragEvent<HTMLDivElement>, assetPath: string) => {
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData(ASSET_DRAG_MIME, assetPath)
    event.dataTransfer.setData('text/plain', assetPath)
    updateDragAutoScroll(event.clientY)
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
    const assetPath = event.dataTransfer.getData(ASSET_DRAG_MIME) || event.dataTransfer.getData('text/plain')
    addHomepageBackgroundAssetPath(assetPath)
  }

  const handleAvatarDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsAvatarDropActive(false)
    stopDragAutoScroll()
    const assetPath = event.dataTransfer.getData(ASSET_DRAG_MIME) || event.dataTransfer.getData('text/plain')
    addCustomAvatarAssetPath(assetPath)
  }

  const handlePageDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer.types.includes(ASSET_DRAG_MIME) && !event.dataTransfer.types.includes('text/plain')) return

    event.preventDefault()
    updateDragAutoScroll(event.clientY)
  }

  return (
    <div
      className="sona-settings"
      ref={scrollRef}
      onDragOver={handlePageDragOver}
      onDragEnd={stopDragAutoScroll}
      onDrop={stopDragAutoScroll}
    >
      <h2 className="sona-settings-title">{t('beautify.title')}</h2>

      <SettingGroup title={t('beautify.group.client')}>
        <SettingCard
          title={t('beautify.wallpaperMode.title')}
          description={t('beautify.wallpaperMode.description')}
        >
          <SonaSwitch
            checked={beautifyWallpaperMode}
            onChange={toggleBeautifyWallpaperMode}
          />
        </SettingCard>
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
      </SettingGroup>

      {assetPaths.length > 0 && (
        <>
          <SettingGroup title={t('beautify.group.wallpaper')}>
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
                          <video
                            src={getAssetUrl(assetPath)}
                            muted
                            preload="metadata"
                            playsInline
                          />
                        ) : (
                          <img src={getAssetUrl(assetPath)} alt={assetPath} />
                        )}
                        <span className="sona-wallpaper-card-name">{assetPath}</span>
                        <span className="sona-wallpaper-card-action">{t('beautify.wallpaper.clickApply')}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="sona-avatar-dropzone-placeholder">
                  <div className="sona-avatar-dropzone-plus">+</div>
                  <div>{t('beautify.wallpaper.dropHint')}</div>
                </div>
              )}
            </div>
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
          </SettingGroup>

          <SettingGroup title={t('beautify.group.avatar')}>
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
                    const isApplied = customAvatarAssetPaths[0] === assetPath

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
                        <img src={getAssetUrl(assetPath)} alt={assetPath} />
                        <span className="sona-avatar-card-name">{assetPath}</span>
                        <span className="sona-avatar-card-action">{t('beautify.wallpaper.clickApply')}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="sona-avatar-dropzone-placeholder">
                  <div className="sona-avatar-dropzone-plus">+</div>
                  <div>{t('beautify.avatar.dropHint')}</div>
                </div>
              )}
            </div>
          </SettingGroup>
        </>
      )}

      <SettingGroup title={t('beautify.group.assets')}>
        <div className="sona-asset-browser">
          <div className="sona-asset-browser-header">
            <span className="sona-asset-browser-title">{t('beautify.assets.browserTitle')}</span>
            {assetPaths.length > 0 && <span className="sona-asset-browser-hint">{t('beautify.assets.dragHint')}</span>}
          </div>
          <p className="sona-asset-browser-status">{assetMessage}</p>
          {assetPaths.length > 0 ? (
            <div className="sona-asset-grid">
              {assetPaths.map((assetPath) => (
                <div
                  className="sona-asset-card"
                  key={assetPath}
                  draggable
                  onDragStart={(event) => handleAssetDragStart(event, assetPath)}
                >
                  <button
                    className="sona-asset-card-remove"
                    type="button"
                    onClick={() => removeAssetPath(assetPath)}
                    aria-label={`${t('common.remove')} ${assetPath}`}
                  >
                    ×
                  </button>
                  {isVideoFile(assetPath) ? (
                    <video
                      src={getAssetUrl(assetPath)}
                      muted
                      preload="metadata"
                      playsInline
                    />
                  ) : (
                    <img src={getAssetUrl(assetPath)} alt={assetPath} />
                  )}
                  <span>{assetPath}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="sona-asset-empty">{t('beautify.assets.empty')}</p>
          )}
        </div>
        <SettingCard
          title={t('beautify.assets.folderTitle')}
          description={t('beautify.assets.folderDescription')}
        >
          <SonaButton onClick={() => window.openPluginsFolder(getPluginAssetsFolderPath())}>
            {t('beautify.assets.openFolder')}
          </SonaButton>
        </SettingCard>
        <SettingCard
          title={t('beautify.assets.inputTitle')}
          description={t('beautify.assets.inputDescription')}
        >
          <div className="sona-asset-path-row">
            <SonaInput
              value={assetPathInput}
              onChange={setAssetPathInput}
              placeholder={t('beautify.assets.examplePlaceholder')}
              onKeyDown={(event) => {
                if (event.key === 'Enter') addAssetPath()
              }}
            />
            <SonaButton onClick={addAssetPath}>
              {t('beautify.assets.add')}
            </SonaButton>
          </div>
        </SettingCard>
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
                style={isVideoFile(editingWallpaperAssetPath)
                  ? undefined
                  : {
                      backgroundImage: `url("${getAssetUrl(editingWallpaperAssetPath)}")`,
                      backgroundSize: getWallpaperBackgroundSize(draftWallpaperAdjustment),
                      backgroundPosition: getWallpaperBackgroundPosition(draftWallpaperAdjustment),
                      backgroundRepeat: 'no-repeat',
                    }}
              >
                {isVideoFile(editingWallpaperAssetPath) && (
                  <video
                    src={getAssetUrl(editingWallpaperAssetPath)}
                    muted
                    loop
                    autoPlay
                    playsInline
                    style={{
                      transform: `translate(${draftWallpaperAdjustment.offsetX}%, ${draftWallpaperAdjustment.offsetY}%) scale(${draftWallpaperAdjustment.scale})`,
                    }}
                  />
                )}
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
    </div>
  )
}

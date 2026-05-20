import { useRef, useState, type DragEvent } from 'react'
import { SettingCard, SettingGroup } from '@/components/ui/SettingCard'
import { SonaButton } from '@/components/ui/SonaButton'
import { SonaInput } from '@/components/ui/SonaInput'
import { store } from '@/lib/store'
import '@/styles/SettingsPage.css'

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'ico'])
const ASSET_DRAG_MIME = 'application/x-sona-asset-path'
const DRAG_SCROLL_EDGE_SIZE = 76
const DRAG_SCROLL_MAX_SPEED = 20

function isImageFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase()
  return Boolean(ext && IMAGE_EXTENSIONS.has(ext))
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
  return `//plugins/sona/assets/${assetPath.split('/').map(encodeURIComponent).join('/')}`
}

export function BeautifyPage() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const dragScrollFrameRef = useRef<number | null>(null)
  const dragPointerYRef = useRef<number | null>(null)
  const [assetPathInput, setAssetPathInput] = useState('')
  const [assetPaths, setAssetPaths] = useState(() => store.get('beautifyAssetPaths'))
  const [customAvatarAssetPaths, setCustomAvatarAssetPaths] = useState(() => store.get('customAvatarAssetPaths'))
  const [assetMessage, setAssetMessage] = useState('请输入 assets 目录下的相对路径，例： 你在 assets中放了一张 avatar.png 图片，那么请输入 avatar.png。\n如果你在assets中创建了一个文件夹并命名为icons，在其中放了一张 avatar.png 那么请输入 icons/avatar.png。')
  const [isAvatarDropActive, setIsAvatarDropActive] = useState(false)

  const saveAssetPaths = (paths: string[]) => {
    setAssetPaths(paths)
    store.set('beautifyAssetPaths', paths)
  }

  const saveCustomAvatarAssetPaths = (paths: string[]) => {
    setCustomAvatarAssetPaths(paths)
    store.set('customAvatarAssetPaths', paths)
  }

  const addAssetPath = () => {
    const nextPath = normalizeAssetPath(assetPathInput)

    if (!nextPath) {
      setAssetMessage('请输入资源路径。')
      return
    }
    if (nextPath.includes('..')) {
      setAssetMessage('路径不能包含 ..。')
      return
    }
    if (/^[a-z]+:\/\//i.test(nextPath)) {
      setAssetMessage('请输入 assets 目录内的相对路径，不要输入完整 URL。')
      return
    }
    if (!isImageFile(nextPath)) {
      setAssetMessage('目前只支持录入图片资源：png/jpg/jpeg/webp/gif/svg/bmp/ico。')
      return
    }
    if (assetPaths.includes(nextPath)) {
      setAssetMessage('这个资源已经录入过了。')
      return
    }

    const nextPaths = [...assetPaths, nextPath]
    saveAssetPaths(nextPaths)
    setAssetPathInput('')
    setAssetMessage(`已录入资源：${nextPath}`)
  }

  const removeAssetPath = (assetPath: string) => {
    const nextPaths = assetPaths.filter((path) => path !== assetPath)
    saveAssetPaths(nextPaths)
    saveCustomAvatarAssetPaths(customAvatarAssetPaths.filter((path) => path !== assetPath))
    setAssetMessage(`已移除资源：${assetPath}`)
  }

  const addCustomAvatarAssetPath = (assetPath: string) => {
    if (!assetPaths.includes(assetPath)) {
      setAssetMessage('只能添加资源列表中已录入的图片。')
      return
    }
    if (customAvatarAssetPaths.includes(assetPath)) {
      setAssetMessage('这张图片已经在自定义头像列表里了。')
      return
    }

    saveCustomAvatarAssetPaths([...customAvatarAssetPaths, assetPath])
    setAssetMessage(`已添加到自定义头像：${assetPath}`)
  }

  const removeCustomAvatarAssetPath = (assetPath: string) => {
    saveCustomAvatarAssetPaths(customAvatarAssetPaths.filter((path) => path !== assetPath))
    setAssetMessage(`已从自定义头像移除：${assetPath}`)
  }

  const stopDragAutoScroll = () => {
    dragPointerYRef.current = null
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
      <h2 className="sona-settings-title">美化</h2>

      {assetPaths.length > 0 && (
        <SettingGroup title="自定义头像">
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
                {customAvatarAssetPaths.map((assetPath) => (
                  <div className="sona-avatar-card" key={assetPath}>
                    <button
                      className="sona-asset-card-remove"
                      type="button"
                      onClick={() => removeCustomAvatarAssetPath(assetPath)}
                      aria-label={`移除 ${assetPath}`}
                    >
                      ×
                    </button>
                    <img src={getAssetUrl(assetPath)} alt={assetPath} />
                    <span>{assetPath}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="sona-avatar-dropzone-placeholder">
                <div className="sona-avatar-dropzone-plus">+</div>
                <div>从下方资源列表拖动图片到这里，以添加自定义头像</div>
              </div>
            )}
          </div>
        </SettingGroup>
      )}

      <SettingGroup title="资源管理">
        <div className="sona-asset-browser">
          <div className="sona-asset-browser-header">
            <span className="sona-asset-browser-title">资源列表</span>
            {assetPaths.length > 0 && <span className="sona-asset-browser-hint">拖动图片到上方功能区即可复制使用</span>}
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
                    aria-label={`移除 ${assetPath}`}
                  >
                    ×
                  </button>
                  <img src={getAssetUrl(assetPath)} alt={assetPath} />
                  <span>{assetPath}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="sona-asset-empty">还没有录入资源。</p>
          )}
        </div>
        <SettingCard
          title="资源目录"
          description="打开 Sona 的 assets 目录，你的自定义图片、视频等资源应该放在这里。"
        >
          <SonaButton onClick={() => window.openPluginsFolder('sona/assets')}>
            打开 assets 目录
          </SonaButton>
        </SettingCard>
        <SettingCard
          title="录入资源"
          description="输入相对于 assets 目录的图片路径，Sona 会保存到资源列表并展示预览。"
        >
          <div className="sona-asset-path-row">
            <SonaInput
              value={assetPathInput}
              onChange={setAssetPathInput}
              placeholder="例如 avatar.png"
              onKeyDown={(event) => {
                if (event.key === 'Enter') addAssetPath()
              }}
            />
            <SonaButton onClick={addAssetPath}>
              录入
            </SonaButton>
          </div>
        </SettingCard>
      </SettingGroup>
    </div>
  )
}

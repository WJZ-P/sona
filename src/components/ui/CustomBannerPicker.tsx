import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { lcu, type RegaliaBannerInventoryEntry, type RegaliaBannerInventoryItem } from '@/lib/lcu'
import { logger } from '@/index'
import '@/styles/CustomBannerPicker.css'

interface BannerItem {
  id: string
  idSecondary: string
  name: string
  assetPath: string
  regaliaType: string
  isOwned: boolean
  isSelectable: boolean
  isTencentOnly: boolean
  purchaseDate: string
  groupIndex: number
}

export interface CustomBannerPickerProps {
  open: boolean
  onClose: () => void
  selectedBannerId: string | null
  onApplyBanner: (banner: { id: string; name: string; assetPath: string; bannerType: string }) => void
}

function getBannerName(item: RegaliaBannerInventoryItem): string {
  if (item.localizedName.trim()) return item.localizedName

  const filename = item.assetPath
    .split('/')
    .pop()
    ?.replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

  return filename || `Banner ${item.id}`
}

function flattenInventory(inventory: RegaliaBannerInventoryEntry[]): BannerItem[] {
  return inventory.flatMap((entry, groupIndex) => {
    return entry.items
      .filter((item) => item.assetPath)
      .map((item) => ({
        id: String(item.id),
        idSecondary: item.idSecondary,
        name: getBannerName(item),
        assetPath: item.assetPath,
        regaliaType: item.regaliaType,
        isOwned: entry.isOwned,
        isSelectable: item.isSelectable,
        isTencentOnly: item.isTencentOnly,
        purchaseDate: entry.purchaseDate ?? '',
        groupIndex,
      }))
  })
}

function getBannerSortValue(banner: BannerItem): number {
  if (!banner.isOwned) return 2
  if (!banner.isSelectable) return 1
  return 0
}

export function CustomBannerPicker({ open, onClose, selectedBannerId, onApplyBanner }: CustomBannerPickerProps) {
  const [banners, setBanners] = useState<BannerItem[]>([])
  const [loading, setLoading] = useState(false)
  const [appliedId, setAppliedId] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState('')

  useEffect(() => {
    if (!open) return

    setLoading(true)
    setStatusMsg('')

    ;(async () => {
      try {
        const inventory = await lcu.getRegaliaBannerInventory()

        const items = flattenInventory(inventory).sort((a, b) => {
          return getBannerSortValue(a) - getBannerSortValue(b)
            || Number(a.id) - Number(b.id)
            || a.name.localeCompare(b.name)
        })

        setBanners(items)
        setAppliedId(selectedBannerId)
        logger.info('[CustomBanner] 加载了 %d 个旗帜', items.length)
      } catch (err) {
        logger.error('[CustomBanner] 加载旗帜失败:', err)
        setBanners([])
        setStatusMsg('❌ 加载旗帜数据失败')
      } finally {
        setLoading(false)
      }
    })()
  }, [open, selectedBannerId])

  const handleApply = (banner: BannerItem) => {
    setStatusMsg(`正在应用 ${banner.name}...`)
    try {
      onApplyBanner({
        id: banner.id,
        name: banner.name,
        assetPath: banner.assetPath,
        bannerType: 'blank',
      })
      setAppliedId(banner.id)
      setStatusMsg(`✅ 已本地应用 [${banner.name}]`)
      logger.info('[CustomBanner] 本地旗帜已设置为 %s (id=%s)', banner.name, banner.id)
    } catch (err) {
      logger.error('[CustomBanner] 本地设置旗帜失败:', err)
      setStatusMsg('❌ 本地设置旗帜失败')
    }

    window.setTimeout(() => setStatusMsg(''), 3000)
  }

  return (
    <Modal open={open} onClose={onClose} width={1080} height={700}>
      <div className="scb-container">
        <div className="scb-header">
          <span className="scb-title">自定义旗帜</span>
        </div>

        <div className="scb-toolbar">
          <span className="scb-count">{banners.length} 个旗帜</span>
          <span className="scb-hint">仅修改本地显示，其他玩家不可见。</span>
          {statusMsg && <span className="scb-status">{statusMsg}</span>}
        </div>

        <div className="scb-grid-wrap">
          {loading && <div className="scb-empty">加载中...</div>}
          {!loading && banners.length === 0 && (
            <div className="scb-empty">没有找到相关旗帜</div>
          )}
          <div className="scb-grid">
            {banners.map((banner) => {
              const isApplied = appliedId === banner.id
              const badgeText = isApplied ? '使用中' : !banner.isOwned ? '未拥有' : !banner.isSelectable ? '不可选' : ''

              return (
                <button
                  key={`${banner.groupIndex}-${banner.id}-${banner.idSecondary}`}
                  className={`scb-card ${isApplied ? 'scb-card--applied' : ''}`}
                  type="button"
                  onClick={() => handleApply(banner)}
                  title={`${banner.name} · ID ${banner.id}`}
                >
                  <span className="scb-card-img-wrap">
                    <img
                      className="scb-card-img"
                      src={banner.assetPath}
                      alt={banner.name}
                      loading="lazy"
                    />
                    <span className="scb-card-hover">本地应用</span>
                    {badgeText && <span className="scb-card-badge">{badgeText}</span>}
                  </span>
                  <span className="scb-card-name">{banner.name}</span>
                  <span className="scb-card-meta">ID {banner.id}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </Modal>
  )
}

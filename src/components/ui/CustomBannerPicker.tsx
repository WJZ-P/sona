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
  bannerRank: string
  selectionKey: string
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
  selectedBannerKey: string | null
  onApplyBanner: (banner: { id: string; name: string; assetPath: string; bannerType: string; bannerRank: string }) => void
}

const RANK_NAME_MAP: Record<string, string> = {
  IRON: 'Sắt',
  BRONZE: 'Đồng',
  SILVER: 'Bạc',
  GOLD: 'Vàng',
  PLATINUM: 'Bạch Kim',
  EMERALD: 'Lục Bảo',
  DIAMOND: 'Kim Cương',
  MASTER: 'Cao Thủ',
  GRANDMASTER: 'Đại Cao Thủ',
  CHALLENGER: 'Thách Đấu',
}

function normalizeRankText(value: string): string {
  return value.trim().replace(/[\s_-]+/g, '').toUpperCase()
}

function getBannerRank(item: RegaliaBannerInventoryItem): string {
  const id = String(item.id)
  if (id !== '2') return ''

  const candidates = [
    item.idSecondary,
    item.localizedName,
    item.assetPath.split('/').pop() ?? '',
  ]

  for (const candidate of candidates) {
    const normalized = normalizeRankText(candidate)
    const rank = Object.keys(RANK_NAME_MAP).find((key) => normalized.includes(key))
    if (rank) return rank
  }

  return ''
}

function getBannerName(item: RegaliaBannerInventoryItem, bannerRank: string): string {
  if (bannerRank) return `${RANK_NAME_MAP[bannerRank] ?? bannerRank} - Cờ hiệu`
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
      .map((item) => {
        const id = String(item.id)
        const bannerRank = getBannerRank(item)
        const selectionKey = `${id}:${bannerRank}`

        return {
          id,
          idSecondary: item.idSecondary,
          name: getBannerName(item, bannerRank),
          assetPath: item.assetPath,
          bannerRank,
          selectionKey,
          regaliaType: item.regaliaType,
          isOwned: entry.isOwned,
          isSelectable: item.isSelectable,
          isTencentOnly: item.isTencentOnly,
          purchaseDate: entry.purchaseDate ?? '',
          groupIndex,
        }
      })
  })
}

export function CustomBannerPicker({ open, onClose, selectedBannerKey, onApplyBanner }: CustomBannerPickerProps) {
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
          return Number(b.id) - Number(a.id)
            || a.name.localeCompare(b.name)
        })

        setBanners(items)
        setAppliedId(selectedBannerKey)
        logger.info('[CustomBanner] Đã tải %d cờ hiệu', items.length)
      } catch (err) {
        logger.error('[CustomBanner] Không thể tải cờ hiệu:', err)
        setBanners([])
        setStatusMsg('❌ Không thể tải dữ liệu cờ hiệu')
      } finally {
        setLoading(false)
      }
    })()
  }, [open, selectedBannerKey])

  const handleApply = (banner: BannerItem) => {
    setStatusMsg(`Đang áp dụng ${banner.name}...`)
    try {
      onApplyBanner({
        id: banner.id,
        name: banner.name,
        assetPath: banner.assetPath,
        bannerType: 'blank',
        bannerRank: banner.bannerRank,
      })
      setAppliedId(banner.selectionKey)
      setStatusMsg(`✅ Đã áp dụng cục bộ [${banner.name}]`)
      logger.info('[CustomBanner] Đã đặt cờ hiệu cục bộ thành %s (id=%s)', banner.name, banner.id)
    } catch (err) {
      logger.error('[CustomBanner] Không thể đặt cờ hiệu cục bộ:', err)
      setStatusMsg('❌ Không thể đặt cờ hiệu cục bộ')
    }

    window.setTimeout(() => setStatusMsg(''), 3000)
  }

  return (
    <Modal open={open} onClose={onClose} width={1080} height={700}>
      <div className="scb-container">
        <div className="scb-header">
          <div className="scb-header-main">
            <span className="scb-title">Tùy chỉnh cờ hiệu</span>
            <span className="scb-hint">{banners.length} cờ hiệu, chỉ thay đổi hiển thị cục bộ, người chơi khác không thấy.</span>
          </div>
          {statusMsg && <span className="scb-status">{statusMsg}</span>}
        </div>

        <div className="scb-grid-wrap">
          {loading && <div className="scb-empty">Đang tải...</div>}
          {!loading && banners.length === 0 && (
            <div className="scb-empty">Không tìm thấy cờ hiệu phù hợp</div>
          )}
          <div className="scb-grid">
            {banners.map((banner) => {
              const isApplied = appliedId === banner.selectionKey

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
                    <span className="scb-card-hover">Nhấn để áp dụng</span>
                    {isApplied && <span className="scb-card-badge">Đang sử dụng</span>}
                  </span>
                  <span className="scb-card-name">{banner.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </Modal>
  )
}

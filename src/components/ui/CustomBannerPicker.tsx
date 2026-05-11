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
  IRON: '坚韧黑铁',
  BRONZE: '英勇青铜',
  SILVER: '不屈白银',
  GOLD: '荣耀黄金',
  PLATINUM: '华贵铂金',
  EMERALD: '流光翡翠',
  DIAMOND: '璀璨钻石',
  MASTER: '超凡大师',
  GRANDMASTER: '傲世宗师',
  CHALLENGER: '最强王者',
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
  if (bannerRank) return `${RANK_NAME_MAP[bannerRank] ?? bannerRank} 旗帜`
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
        logger.info('[CustomBanner] 加载了 %d 个旗帜', items.length)
      } catch (err) {
        logger.error('[CustomBanner] 加载旗帜失败:', err)
        setBanners([])
        setStatusMsg('❌ 加载旗帜数据失败')
      } finally {
        setLoading(false)
      }
    })()
  }, [open, selectedBannerKey])

  const handleApply = (banner: BannerItem) => {
    setStatusMsg(`正在应用 ${banner.name}...`)
    try {
      onApplyBanner({
        id: banner.id,
        name: banner.name,
        assetPath: banner.assetPath,
        bannerType: 'blank',
        bannerRank: banner.bannerRank,
      })
      setAppliedId(banner.selectionKey)
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
          <div className="scb-header-main">
            <span className="scb-title">自定义旗帜</span>
            <span className="scb-hint">{banners.length} 个旗帜，仅修改本地显示，其他玩家不可见。</span>
          </div>
          {statusMsg && <span className="scb-status">{statusMsg}</span>}
        </div>

        <div className="scb-grid-wrap">
          {loading && <div className="scb-empty">加载中...</div>}
          {!loading && banners.length === 0 && (
            <div className="scb-empty">没有找到相关旗帜</div>
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
                    <span className="scb-card-hover">点击应用</span>
                    {isApplied && <span className="scb-card-badge">使用中</span>}
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

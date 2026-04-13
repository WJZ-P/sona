import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Modal } from '@/components/ui/Modal'
import { lcu } from '@/lib/lcu'
import { logger } from '@/index'
import '@/styles/ProfileBackgroundPicker.css'

// ==================== 类型 ====================

/** LCU skins-minimal 接口返回的单个皮肤数据 */
interface LcuSkinMinimal {
  id: number
  name: string
  championId: number
  isBase: boolean
  disabled: boolean
  lastSelected: boolean
  stillObtainable: boolean
  chromaPath: string
  splashPath: string
  tilePath: string
  ownership: {
    owned: boolean
    loyaltyReward: boolean
    xboxGPReward: boolean
    rental: Record<string, unknown>
  }
  skinAugments: {
    augments: unknown[]
  }
}

/** 组件内部使用的皮肤项 */
interface SkinItem {
  id: number
  name: string
  championId: number
  champName: string
  tilePath: string
}

// ==================== 组件 ====================

export interface ProfileBackgroundPickerProps {
  open: boolean
  onClose: () => void
}

export function ProfileBackgroundPicker({ open, onClose }: ProfileBackgroundPickerProps) {
  const [skins, setSkins] = useState<SkinItem[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [appliedId, setAppliedId] = useState<number | null>(null)
  const [statusMsg, setStatusMsg] = useState('')

  // 加载皮肤数据
  useEffect(() => {
    if (!open) return
    setLoading(true)
    setSkins([])
    setStatusMsg('')

    ;(async () => {
      try {
        const me = await lcu.getSummonerInfo()
        const summonerId = (me as { summonerId: number }).summonerId

        // 获取当前背景
        try {
          const res = await fetch('/lol-summoner/v1/current-summoner/summoner-profile')
          if (res.ok) {
            const profile = await res.json()
            if (profile.backgroundSkinId) setAppliedId(profile.backgroundSkinId)
          }
        } catch { /* ignore */ }

        // 英雄摘要
        const champions = await lcu.getChampionSummary()
        const champMap = new Map<number, { name: string }>()
        for (const c of champions) {
          if (c.id > 0) champMap.set(c.id, { name: c.name })
        }

        // 所有皮肤（不过滤拥有权）
        const skinsRes = await fetch(`/lol-champions/v1/inventories/${summonerId}/skins-minimal`)
        if (!skinsRes.ok) throw new Error(`获取皮肤失败 ${skinsRes.status}`)
        const allSkins = await skinsRes.json() as LcuSkinMinimal[]

        const items: SkinItem[] = []
        for (const s of allSkins) {
          if (!s.tilePath) continue
          const champ = champMap.get(s.championId)
          if (!champ) continue
          items.push({
            id: s.id,
            name: s.name,
            championId: s.championId,
            champName: champ.name,
            tilePath: s.tilePath,
          })
        }

        items.sort((a, b) => a.champName.localeCompare(b.champName, undefined) || a.id - b.id)
        setSkins(items)
        logger.info('[ProfileBg] 加载了 %d 款皮肤', items.length)
      } catch (err) {
        logger.error('[ProfileBg] 加载皮肤失败:', err)
        setStatusMsg('❌ 加载皮肤数据失败')
      } finally {
        setLoading(false)
      }
    })()
  }, [open])

  // 搜索过滤
  const filtered = useMemo(() => {
    if (!search.trim()) return skins
    const q = search.toLowerCase()
    return skins.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.champName.toLowerCase().includes(q)
    )
  }, [skins, search])

  // 分页懒加载
  const PAGE_SIZE = 25
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const gridWrapRef = useRef<HTMLDivElement>(null)

  // 搜索变化时重置分页
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [search])

  const visibleSkins = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount])
  const hasMore = visibleCount < filtered.length

  const handleScroll = useCallback(() => {
    const el = gridWrapRef.current
    if (!el || !hasMore) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filtered.length))
    }
  }, [hasMore, filtered.length])

  // 点击皮肤 → 直接应用
  const handleApply = async (skin: SkinItem) => {
    setStatusMsg(`正在应用 ${skin.name}...`)
    try {
      const res = await fetch('/lol-summoner/v1/current-summoner/summoner-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'backgroundSkinId', value: skin.id }),
      })
      if (res.ok) {
        setAppliedId(skin.id)
        setStatusMsg(`✅ 已应用 [${skin.name}]`)
        logger.info('[ProfileBg] 背景已设置为 %s (id=%d)', skin.name, skin.id)
      } else {
        setStatusMsg(`❌ 设置失败 ${res.status}`)
      }
    } catch (err) {
      setStatusMsg('❌ 请求失败')
      logger.error('[ProfileBg] 设置背景失败:', err)
    }
    setTimeout(() => setStatusMsg(''), 3000)
  }

  return (
    <Modal open={open} onClose={onClose} width={1100} height={620}>
      <div className="spbg-container">
        {/* 标题 */}
        <div className="spbg-header">
          <span className="spbg-title">自定义生涯背景</span>
        </div>

        {/* 搜索栏 + 状态提示 */}
        <div className="spbg-toolbar">
          <input
            className="spbg-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索英雄或皮肤..."
          />
          <span className="spbg-count">{filtered.length} 款皮肤</span>
          {statusMsg && <span className="spbg-status">{statusMsg}</span>}
        </div>

        {/* 皮肤网格 */}
        <div className="spbg-grid-wrap" ref={gridWrapRef} onScroll={handleScroll}>
          {loading && <div className="spbg-empty">加载中...</div>}
          {!loading && filtered.length === 0 && (
            <div className="spbg-empty">没有找到相关皮肤</div>
          )}
          <div className="spbg-grid">
            {visibleSkins.map((skin) => {
              const isApplied = appliedId === skin.id
              return (
                <div
                  key={skin.id}
                  className={`spbg-card ${isApplied ? 'spbg-applied' : ''}`}
                  onClick={() => handleApply(skin)}
                >
                  <div className="spbg-card-img-wrap">
                    <img
                      className="spbg-card-img"
                      src={skin.tilePath}
                      alt={skin.name}
                      loading="lazy"
                    />
                    <div className="spbg-card-hover">点击应用</div>
                    {isApplied && <div className="spbg-card-badge">使用中</div>}
                  </div>
                  <p className="spbg-card-name">{skin.name}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Modal>
  )
}

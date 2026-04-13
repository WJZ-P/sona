import { useState, useEffect, useMemo } from 'react'
import { lcu } from '@/lib/lcu'
import { logger } from '@/index'
import '@/styles/ProfileBackgroundPicker.css'

// ==================== 类型 ====================

interface SkinItem {
  id: number
  name: string
  championId: number
  champName: string
  alias: string
  num: number
}

// ==================== 辅助函数 ====================

function skinNum(skinId: number, championId: number): number {
  return skinId - championId * 1000
}

function getSkinTile(championId: number, num: number): string {
  return `/lol-game-data/assets/v1/champion-tiles/${championId}/${championId}000.jpg`
    .replace(/\d+\.jpg$/, `${championId * 1000 + num}.jpg`)
}

// ==================== 组件 ====================

export function ProfileBackgroundPicker() {
  const [skins, setSkins] = useState<SkinItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [appliedId, setAppliedId] = useState<number | null>(null)
  const [statusMsg, setStatusMsg] = useState('')

  // 挂载即加载数据
  useEffect(() => {
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
        const champMap = new Map<number, { name: string; alias: string }>()
        for (const c of champions) {
          if (c.id > 0) champMap.set(c.id, { name: c.name, alias: c.alias })
        }

        // 所有皮肤
        const skinsRes = await fetch(`/lol-champions/v1/inventories/${summonerId}/skins-minimal`)
        if (!skinsRes.ok) throw new Error(`获取皮肤失败 ${skinsRes.status}`)
        const allSkins = await skinsRes.json() as Array<{
          id: number; name: string; championId: number
          ownership?: { owned?: boolean }
        }>

        const owned: SkinItem[] = []
        for (const s of allSkins) {
          if (!s.ownership?.owned) continue
          const champ = champMap.get(s.championId)
          if (!champ) continue
          owned.push({
            id: s.id,
            name: s.name,
            championId: s.championId,
            champName: champ.name,
            alias: champ.alias,
            num: skinNum(s.id, s.championId),
          })
        }

        owned.sort((a, b) => a.champName.localeCompare(b.champName, 'zh-CN') || a.id - b.id)
        setSkins(owned)
        logger.info('[ProfileBg] 加载了 %d 款皮肤', owned.length)
      } catch (err) {
        logger.error('[ProfileBg] 加载皮肤失败:', err)
        setStatusMsg('❌ 加载皮肤数据失败')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // 搜索过滤
  const filtered = useMemo(() => {
    if (!search.trim()) return skins
    const q = search.toLowerCase()
    return skins.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.champName.toLowerCase().includes(q)
    )
  }, [skins, search])

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
    <div className="spbg-container">
      {/* 提示条 */}
      <div className="spbg-notice">
        <span className="spbg-notice-icon">✦</span>
        <span>{statusMsg || 'Sona 自定义生涯背景 —— 点击任意皮肤即可应用'}</span>
      </div>

      {/* 搜索栏 */}
      <div className="spbg-toolbar">
        <input
          className="spbg-search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索英雄或皮肤..."
        />
        <span className="spbg-count">{filtered.length} 款皮肤</span>
      </div>

      {/* 皮肤网格 */}
      <div className="spbg-grid-wrap">
        {loading && <div className="spbg-empty">加载中...</div>}
        {!loading && filtered.length === 0 && (
          <div className="spbg-empty">没有找到相关皮肤</div>
        )}
        <div className="spbg-grid">
          {filtered.map((skin) => {
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
                    src={getSkinTile(skin.championId, skin.num)}
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
  )
}

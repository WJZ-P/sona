import { logger } from '@/index'
import { store } from '@/lib/store'

// ==================== 段位伪装 ====================

export async function applyRankDisguise() {
  const queue = store.get('rankQueue')
  const tier = store.get('rankTier')
  const division = store.get('rankDivision')

  try {
    const res = await fetch('/lol-chat/v1/me')
    if (!res.ok) { logger.error('[RankDisguise] Lấy trạng thái trò chuyện thất bại'); return }
    const me = await res.json()
    me.lol.rankedLeagueTier = tier
    me.lol.rankedLeagueDivision = division
    me.lol.rankedLeagueQueue = queue
    const putRes = await fetch('/lol-chat/v1/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(me),
    })
    if (putRes.ok) {
      logger.info('[RankDisguise] Đã áp dụng ngụy trang rank ✓ %s %s %s', queue, tier, division)
    } else {
      logger.error('[RankDisguise] Áp dụng thất bại:', await putRes.text())
    }
  } catch (err) {
    logger.error('[RankDisguise] Lỗi khi áp dụng:', err)
  }
}

async function removeRankDisguise() {
  try {
    const res = await fetch('/lol-chat/v1/me')
    if (!res.ok) return
    const me = await res.json()
    me.lol.rankedLeagueTier = ''
    me.lol.rankedLeagueDivision = ''
    me.lol.rankedLeagueQueue = ''
    const putRes = await fetch('/lol-chat/v1/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(me),
    })
    if (putRes.ok) logger.info('[RankDisguise] Đã khôi phục rank thật ✓')
  } catch (err) {
    logger.error('[RankDisguise] Khôi phục thất bại:', err)
  }
}

export function updateRankDisguise(enabled: boolean) {
  if (enabled) {
    applyRankDisguise()
  } else {
    removeRankDisguise()
  }
}

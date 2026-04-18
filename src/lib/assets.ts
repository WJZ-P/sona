/**
 * 全局游戏资源映射
 *
 * 通过 LCU JSON 接口动态获取装备/召唤师技能/队列/地图的映射。
 * 在 index.tsx 的 load() 中调用 initAssets() 初始化，
 * 之后任何模块都可以直接 import 使用查询函数。
 *
 * 英雄头像可以直接用 /lol-game-data/assets/v1/champion-icons/{id}.png 拼接，
 * 不需要额外映射。
 */

import { lcu } from '@/lib/lcu'
import { logger } from '@/index'
import type { GameQueue } from '@/types/lcu'

/** 路径小写化，LCU 资源路径不区分大小写但统一小写更安全 */
function normalizePath(raw: string): string {
  return raw.toLowerCase()
}

// ==================== 映射表 ====================

const itemMap = new Map<number, string>()
const spellMap = new Map<number, string>()
const perkMap = new Map<number, string>()
const perkStyleMap = new Map<number, string>()
const queueMap = new Map<number, GameQueue>()
const mapDataMap = new Map<number, { id: number; name: string; gameModeName: string; [key: string]: unknown }>()

/** 英雄信息：id → { id, name(英雄名), title(称号), alias(英文名) } */
export interface ChampionInfo {
  id: number
  /** 英雄名字，如 "安妮" */
  name: string
  /** 英雄称号，如 "黑暗之女" */
  title: string
  /** 英文名，如 "Annie" */
  alias: string
}
const championMap = new Map<number, ChampionInfo>()

let initialized = false

// ==================== 初始化 ====================

/**
 * 拉取装备/召唤师技能/队列/地图数据，构建全局映射。
 * 应在插件 load() 时调用一次，失败不阻塞启动。
 */
export async function initAssets() {
  if (initialized) return

  // 每个资源独立 catch，失败不影响其他；最多重试 3 次（每次间隔 3 秒）
  await tryInit(0)
}

/**
 * 尝试初始化（失败的资源自动重试）
 * @param attempt 当前重试次数
 */
async function tryInit(attempt: number) {
  const MAX_RETRY = 3
  const RETRY_DELAY = 2000

  const [items, spells, queues, maps, perks, perkStyles, champions] = await Promise.all([
    lcu.getItems().catch((e) => { logger.warn('[Assets] getItems 失败:', e); return [] }),
    lcu.getSummonerSpells().catch((e) => { logger.warn('[Assets] getSummonerSpells 失败:', e); return [] }),
    lcu.getQueues().catch((e) => { logger.warn('[Assets] getQueues 失败:', e); return [] }),
    lcu.getMapAssets().catch((e) => { logger.warn('[Assets] getMapAssets 失败:', e); return [] }),
    lcu.getPerks().catch((e) => { logger.warn('[Assets] getPerks 失败:', e); return [] }),
    lcu.getPerkStyles().catch((e) => { logger.warn('[Assets] getPerkStyles 失败:', e); return { styles: [] } }),
    lcu.getChampionSummary().catch((e) => { logger.warn('[Assets] getChampionSummary 失败:', e); return [] }),
  ])

  // 只填充获取到的数据（失败的返回空数组，for 循环自然跳过）
  for (const item of items) {
    if (item.id > 0 && item.iconPath) itemMap.set(item.id, normalizePath(item.iconPath))
  }
  for (const spell of spells) {
    if (spell.id > 0 && spell.iconPath) spellMap.set(spell.id, normalizePath(spell.iconPath))
  }
  for (const queue of queues) {
    queueMap.set(queue.id, queue)
  }
  for (const map of maps as Array<{ id: number; name: string; gameModeName: string }>) {
    if (map.id != null) mapDataMap.set(map.id, map)
  }
  for (const perk of perks) {
    if (perk.id > 0 && perk.iconPath) perkMap.set(perk.id, normalizePath(perk.iconPath))
  }
  for (const style of perkStyles.styles) {
    if (style.id > 0 && style.iconPath) perkStyleMap.set(style.id, normalizePath(style.iconPath))
  }
  for (const champ of champions) {
    if (champ.id > 0) {
      championMap.set(champ.id, {
        id: champ.id,
        name: champ.description || '',
        title: champ.name || '',
        alias: champ.alias,
      })
    }
  }

  logger.info(
    '[Assets] 资源映射初始化 (attempt %d) → 装备 %d, 技能 %d, 符文 %d, 符文系 %d, 队列 %d, 地图 %d, 英雄 %d',
    attempt + 1,
    itemMap.size, spellMap.size, perkMap.size, perkStyleMap.size, queueMap.size, mapDataMap.size, championMap.size,
  )

  // 判断是否有关键资源缺失，决定是否重试
  const missing = [
    itemMap.size === 0 && 'items',
    spellMap.size === 0 && 'spells',
    queueMap.size === 0 && 'queues',
    championMap.size === 0 && 'champions',
  ].filter(Boolean)

  if (missing.length > 0 && attempt < MAX_RETRY) {
    logger.warn('[Assets] 关键资源缺失: %s，%d 秒后重试 (%d/%d)', missing.join(','), RETRY_DELAY / 1000, attempt + 1, MAX_RETRY)
    setTimeout(() => tryInit(attempt + 1), RETRY_DELAY)
    return
  }

  initialized = true
  if (missing.length > 0) {
    logger.error('[Assets] 重试 %d 次后仍有资源缺失: %s', MAX_RETRY, missing.join(','))
  } else {
    logger.info('[Assets] 资源映射初始化完成 ✓')
  }
}

// ==================== 查询 ====================

/** 获取英雄头像路径（直接用 ID 拼接即可） */
export function getChampIcon(id: number): string {
  return `/lol-game-data/assets/v1/champion-icons/${id}.png`
}

/** 获取装备图标路径 */
export function getItemIcon(id: number): string {
  return itemMap.get(id) ?? ''
}

/** 获取召唤师技能图标路径 */
export function getSpellIcon(id: number): string {
  return spellMap.get(id) ?? ''
}

/** 获取单个符文图标路径（基石符文等） */
export function getPerkIcon(id: number): string {
  return perkMap.get(id) ?? ''
}

/** 获取符文系图标路径（主系/副系） */
export function getPerkStyleIcon(id: number): string {
  return perkStyleMap.get(id) ?? ''
}

/** 通过 queueId 获取队列名称（中文），如 "极地大乱斗"、"排位赛 单排/双排" */
export function getQueueName(queueId: number): string {
  return queueMap.get(queueId)?.name ?? `队列${queueId}`
}

/** 通过 queueId 获取完整队列数据 */
export function getQueue(queueId: number): GameQueue | undefined {
  return queueMap.get(queueId)
}

/** 通过 mapId 获取地图名称，如 "召唤师峡谷"、"嚎哭深渊" */
export function getMapName(mapId: number): string {
  return mapDataMap.get(mapId)?.name ?? `地图${mapId}`
}

/** 通过 mapId 获取游戏模式名称，如 "经典"、"极地大乱斗" */
export function getGameModeName(mapId: number): string {
  return mapDataMap.get(mapId)?.gameModeName ?? ''
}

/** 资源映射是否已就绪 */
export function isAssetsReady(): boolean {
  return initialized
}

/** 获取所有英雄列表 */
export function getAllChampions(): ChampionInfo[] {
  return Array.from(championMap.values()).filter(c => c.id > 0)
}

/** 通过 ID 获取英雄信息 */
export function getChampionById(id: number): ChampionInfo | undefined {
  return championMap.get(id)
}

/**
 * 模糊搜索英雄（名字、称号、英文名）
 * @param keyword 搜索关键词
 * @param limit 最大返回数量，默认 8
 */
export function searchChampions(keyword: string, limit = 8): ChampionInfo[] {
  if (!keyword.trim()) return []
  const kw = keyword.trim().toLowerCase()
  const results: ChampionInfo[] = []

  championMap.forEach((c) => {
    if (c.id <= 0) return
    if (
      c.name.toLowerCase().includes(kw) ||
      c.title.toLowerCase().includes(kw) ||
      c.alias.toLowerCase().includes(kw)
    ) {
      results.push(c)
    }
  })

  // 精确匹配名字的排前面
  results.sort((a, b) => {
    const aExact = a.name.toLowerCase() === kw ? 0 : 1
    const bExact = b.name.toLowerCase() === kw ? 0 : 1
    return aExact - bExact
  })

  return results.slice(0, limit)
}

/**
 * 获取当前可玩的队列列表（用于战绩模式过滤下拉框）
 *
 * 过滤条件：
 * - 基础：id > 0、非自定义、isEnabled、queueAvailability = Available
 * - 排除 gameMode:
 *   - TUTORIAL         — 新手教程（通用）
 *   - TUTORIAL_MODULE_1 — 新手教程 第一部分
 *   - TUTORIAL_MODULE_2 — 新手教程 第二部分
 *   - TUTORIAL_MODULE_3 — 新手教程 第三部分
 *   - PRACTICETOOL     — 训练模式
 *   - SWIFTPLAY        — 入门级人机
 *   - TFT              — 云顶之弈（所有云顶模式）
 * - 排除 type:
 *   - CHERRY_UNRANKED  — 非排位斗魂竞技场（未公开队列）
 */
export function getPlayableQueues(): { id: number; name: string }[] {
  const EXCLUDED_MODES = new Set([
    'TUTORIAL',
    'TUTORIAL_MODULE_1',
    'TUTORIAL_MODULE_2',
    'TUTORIAL_MODULE_3',
    'PRACTICETOOL',
    'SWIFTPLAY',
    'TFT',
  ])

  const EXCLUDED_TYPES = new Set([
    'CHERRY_UNRANKED',
  ])

  const result: { id: number; name: string }[] = []
  queueMap.forEach((q) => {
    if (q.id <= 0 || q.isCustom) return
    if (!q.isEnabled || q.queueAvailability !== 'Available') return
    if (EXCLUDED_MODES.has(q.gameMode)) return
    if (EXCLUDED_TYPES.has(q.type)) return
    result.push({ id: q.id, name: q.name || q.shortName || `队列${q.id}` })
  })
  // 按名称排序
  result.sort((a, b) => a.name.localeCompare(b.name, 'zh'))
  return result
}

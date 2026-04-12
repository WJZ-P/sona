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
const queueMap = new Map<number, GameQueue>()
const mapDataMap = new Map<number, { id: number; name: string; gameModeName: string; [key: string]: unknown }>()

let initialized = false

// ==================== 初始化 ====================

/**
 * 拉取装备/召唤师技能/队列/地图数据，构建全局映射。
 * 应在插件 load() 时调用一次，失败不阻塞启动。
 */
export async function initAssets() {
  if (initialized) return
  try {
    const [items, spells, queues, maps] = await Promise.all([
      lcu.getItems(),
      lcu.getSummonerSpells(),
      lcu.getQueues(),
      lcu.getMapAssets().catch(() => []),
    ])

    for (const item of items) {
      if (item.id > 0 && item.iconPath) {
        itemMap.set(item.id, normalizePath(item.iconPath))
      }
    }

    for (const spell of spells) {
      if (spell.id > 0 && spell.iconPath) {
        spellMap.set(spell.id, normalizePath(spell.iconPath))
      }
    }

    for (const queue of queues) {
      queueMap.set(queue.id, queue)
    }

    for (const map of maps as Array<{ id: number; name: string; gameModeName: string }>) {
      if (map.id != null) {
        mapDataMap.set(map.id, map)
      }
    }

    initialized = true
    logger.info(
      '[Assets] 资源映射初始化完成 → 装备 %d, 技能 %d, 队列 %d, 地图 %d',
      itemMap.size, spellMap.size, queueMap.size, mapDataMap.size,
    )
  } catch (err) {
    logger.error('[Assets] 资源映射初始化失败:', err)
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

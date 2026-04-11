/**
 * 全局游戏资源映射
 *
 * 通过 LCU JSON 接口动态获取装备/召唤师技能的 id → iconPath 映射。
 * 在 index.tsx 的 load() 中调用 initAssets() 初始化，
 * 之后任何模块都可以直接 import { getItemIcon, getSpellIcon } 使用。
 *
 * 英雄头像可以直接用 /lol-game-data/assets/v1/champion-icons/{id}.png 拼接，
 * 不需要额外映射。
 */

import { lcu } from '@/lib/lcu'
import { logger } from '@/index'

/** 路径小写化，LCU 资源路径不区分大小写但统一小写更安全 */
function normalizePath(raw: string): string {
  return raw.toLowerCase()
}

// ==================== 映射表 ====================

const itemMap = new Map<number, string>()
const spellMap = new Map<number, string>()

let initialized = false

// ==================== 初始化 ====================

/**
 * 拉取装备和召唤师技能的 JSON，构建 id → iconPath 映射。
 * 应在插件 load() 时调用一次，失败不阻塞启动。
 */
export async function initAssets() {
  if (initialized) return
  try {
    const [items, spells] = await Promise.all([
      lcu.getItems(),
      lcu.getSummonerSpells(),
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

    initialized = true
    logger.info('[Assets] 资源映射初始化完成 → 装备 %d 项, 技能 %d 项', itemMap.size, spellMap.size)
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

/** 资源映射是否已就绪 */
export function isAssetsReady(): boolean {
  return initialized
}

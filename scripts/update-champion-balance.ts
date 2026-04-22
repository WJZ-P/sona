/**
 * 英雄平衡数据更新脚本（Node 环境）
 *
 * 从 Fandom LoL Wiki 的 Module:ChampionData/data 拉取官方 Lua 数据，
 * 解析后提取特殊模式的平衡调整数值，写入 src/data/champion-balance.json。
 *
 * 数据源：Fandom MediaWiki API（action=query，不走 Cloudflare Challenge）
 * 数据特点：字段天然稀疏——没调整就不存在，直接忽略
 *
 * 退出码：
 *   0 - 有更新（数据已写入）
 *   1 - 无变化或失败（调用方无需发版本）
 *
 * 使用方式：
 *   npx tsx scripts/update-champion-balance.ts
 */

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import luaparse from 'luaparse'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const WIKI_API_URL =
  'https://leagueoflegends.fandom.com/api.php?action=query&prop=revisions&titles=Module:ChampionData/data&rvprop=content&rvslots=main&format=json'
const OUTPUT_PATH = path.resolve(__dirname, '..', 'src', 'data', 'champion-balance.json')

/** 支持的模式（Wiki 原始 key） */
const GAME_MODES = ['aram', 'urf', 'ofa', 'nb', 'ar', 'usb'] as const

/** 我们关心的平衡属性（Wiki 原始字段名） */
const STAT_PROPS = [
  'dmg_dealt',
  'dmg_taken',
  'healing',
  'shielding',
  'ability_haste',
  'mana_regen',
  'energy_regen',
  'attack_speed',
  'movement_speed',
  'tenacity',
] as const

// ==================== Lua AST 解析工具 ====================

type LuaField = {
  key?: { raw?: string }
  value: LuaValue
}
type LuaValue = {
  type?: string
  value?: number | string
  raw?: string
  operator?: string
  argument?: { value: number }
  fields?: LuaField[]
}

/** 按 key 查找 table 的 field */
function getField(fields: LuaField[] | undefined, key: string): LuaValue | undefined {
  if (!Array.isArray(fields)) return undefined
  const quoted = `"${key}"`
  for (const f of fields) {
    if (f.key?.raw === quoted) return f.value
  }
  return undefined
}

/** 提取数值（处理负数的 UnaryExpression） */
function getFieldNumber(fields: LuaField[] | undefined, key: string): number | undefined {
  const field = getField(fields, key)
  if (!field) return undefined
  if (typeof field.value === 'number') return field.value
  if (field.operator === '-' && typeof field.argument?.value === 'number') return -field.argument.value
  return undefined
}

/** 提取字符串（去掉双引号） */
function getFieldString(fields: LuaField[] | undefined, key: string): string | undefined {
  const field = getField(fields, key)
  if (!field?.raw) return undefined
  return field.raw.replace(/^"|"$/g, '')
}

// ==================== 主流程 ====================

function sha1(text: string): string {
  return crypto.createHash('sha1').update(text).digest('hex')
}

async function fetchLuaSource(): Promise<string> {
  console.log(`[update-balance] 从 Fandom Wiki API 拉取: ${WIKI_API_URL}`)
  const res = await fetch(WIKI_API_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; SonaBot/1.0; +https://github.com/WJZ-P/sona)',
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const json = await res.json() as {
    query: { pages: Record<string, { revisions: Array<{ slots: { main: { '*': string } } }> }> }
  }
  const pages = json.query.pages
  const pageId = Object.keys(pages)[0]
  const content = pages[pageId].revisions[0].slots.main['*']

  // 剥掉开头的注释，只保留 return { ... }
  const returnIdx = content.indexOf('return {')
  if (returnIdx < 0) throw new Error('未找到 "return {" 起始标记')
  return content.substring(returnIdx)
}

async function main() {
  const lua = await fetchLuaSource()
  console.log(`[update-balance] 原始 Lua 长度: ${lua.length} bytes`)

  // 解析 AST
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ast = luaparse.parse(lua) as any
  const table = ast.body[0].arguments[0]
  console.log(`[update-balance] 顶层英雄数: ${table.fields.length}`)

  // 遍历每个英雄
  const champions: Record<string, unknown> = {}
  let count = 0

  for (const rootField of table.fields as LuaField[]) {
    const champFields = rootField.value.fields
    if (!champFields) continue

    const id = getFieldNumber(champFields, 'id')
    const apiname = getFieldString(champFields, 'apiname')
    if (!id || id <= 0 || !apiname) continue

    const stats = getField(champFields, 'stats')
    if (!stats?.fields) continue

    // 收集各个模式的平衡调整
    const modeStats: Record<string, Record<string, number>> = {}

    for (const mode of GAME_MODES) {
      const modeNode = getField(stats.fields, mode)
      if (!modeNode?.fields) continue

      const propMap: Record<string, number> = {}
      for (const prop of STAT_PROPS) {
        const value = getFieldNumber(modeNode.fields, prop)
        // 只收录"有调整"的字段：数值存在、且不是默认 1
        // Wiki 的数据天然稀疏（没有调整就没这字段），但有些会显式写 = 1，过滤掉
        if (value != null && value !== 1) {
          propMap[prop] = value
        }
      }

      if (Object.keys(propMap).length > 0) {
        modeStats[mode] = propMap
      }
    }

    champions[String(id)] = {
      id,
      alias: apiname,
      stats: modeStats,
    }
    count++
  }

  // 计算核心数据哈希（不含 _meta）
  const championsJson = JSON.stringify(champions)
  const hash = sha1(championsJson)

  // 比对旧文件
  let oldHash = ''
  if (fs.existsSync(OUTPUT_PATH)) {
    try {
      const oldData = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'))
      oldHash = oldData?._meta?.sha1 ?? ''
    } catch {
      oldHash = ''
    }
  }

  if (hash === oldHash) {
    console.log(`[update-balance] 数据未变化 (sha1=${hash.slice(0, 8)})，跳过更新`)
    process.exit(1)
  }

  // 写入新文件
  const output = {
    _meta: {
      source: 'fandom-wiki',
      sourceUrl: 'https://leagueoflegends.fandom.com/wiki/Module:ChampionData/data',
      updatedAt: new Date().toISOString(),
      sha1: hash,
      championCount: count,
    },
    champions,
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n', 'utf-8')

  console.log(`[update-balance] ✓ 更新完成：${count} 个英雄`)
  console.log(`[update-balance]   旧 hash: ${oldHash.slice(0, 8) || '(empty)'}`)
  console.log(`[update-balance]   新 hash: ${hash.slice(0, 8)}`)
  console.log(`[update-balance]   写入: ${OUTPUT_PATH}`)
  process.exit(0)
}

main().catch((err) => {
  console.error('[update-balance] 失败:', err)
  process.exit(1)
})

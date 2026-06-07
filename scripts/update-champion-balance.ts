/**
 * 英雄平衡数据更新脚本（Node 环境）
 *
 * 从 LoL Wiki 的 Module:ChampionData/data 拉取官方 Lua 数据，
 * 解析后提取特殊模式的平衡调整数值，写入 src/data/champion-balance.json。
 *
 * 数据源：https://wiki.leagueoflegends.com/en-us/Module:ChampionData/data
 *        （直接抓 HTML 页面，提取 `-- <pre>` 标记内的 Lua return 表）
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
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import luaparse from 'luaparse'
import { ProxyAgent, setGlobalDispatcher } from 'undici'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const WIKI_DATA_URL = 'https://wiki.leagueoflegends.com/en-us/Module:ChampionData/data'
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

/** 解码 HTML 实体（&amp; 放最后，避免二次解码） */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
}

/**
 * 从 wiki 页面 HTML 中提取 Lua return 表。
 * 数据被包在 `-- <pre> ... -- </pre>` 注释标记内（HTML 中 `<` 被转义成 `&lt;`）。
 */
function extractLuaTable(html: string): string {
  // 先锚定到 `-- <pre>` 标记，避免误命中页面其它脚本里的 "return {"
  let preIdx = html.indexOf('&lt;pre')
  if (preIdx < 0) preIdx = html.indexOf('<pre')
  const searchFrom = preIdx >= 0 ? preIdx : 0

  const startIdx = html.indexOf('return {', searchFrom)
  if (startIdx < 0) throw new Error('未找到 "return {" 起始标记')

  // 结束标记：lua 注释 `-- </pre>`（HTML 中 `<` 转义），找不到再退回真正的 </pre> 标签
  let endIdx = html.indexOf('&lt;/pre', startIdx)
  if (endIdx < 0) endIdx = html.indexOf('</pre', startIdx)
  if (endIdx < 0) endIdx = html.length

  // 回退到结束注释前的 `--`，去掉尾部的 `-- </pre>`
  const dashIdx = html.lastIndexOf('--', endIdx)
  if (dashIdx > startIdx) endIdx = dashIdx

  return decodeHtmlEntities(html.substring(startIdx, endIdx)).replace(/\r\n/g, '\n').trimEnd()
}

/** 读取 Windows 系统代理（WinINET），node 的 fetch 默认不会走系统代理 */
function detectWinInetProxy(): string {
  if (process.platform !== 'win32') return ''
  try {
    const base =
      'reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings"'
    const enable = execSync(`${base} /v ProxyEnable`, { encoding: 'utf-8' })
    if (!/ProxyEnable\s+REG_DWORD\s+0x1/i.test(enable)) return ''

    const server = execSync(`${base} /v ProxyServer`, { encoding: 'utf-8' })
    const match = server.match(/ProxyServer\s+REG_SZ\s+(.+)/i)
    if (!match) return ''

    let value = match[1].trim()
    // 形如 "http=host:port;https=host:port" 时优先取 https/http
    if (value.includes('=')) {
      const map = Object.fromEntries(value.split(';').map((s) => s.split('=')))
      value = map['https'] || map['http'] || ''
    }
    if (!value) return ''
    return /^https?:\/\//i.test(value) ? value : `http://${value}`
  } catch {
    return ''
  }
}

/** 解析代理：优先环境变量，其次 Windows 系统代理 */
function resolveProxy(): string {
  return (
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.http_proxy ||
    process.env.ALL_PROXY ||
    process.env.all_proxy ||
    detectWinInetProxy()
  )
}

async function fetchLuaSource(): Promise<string> {
  // Cloudflare 会按 TLS 指纹拦截 node 直连；若存在代理则让 fetch 走代理
  const proxyUrl = resolveProxy()
  if (proxyUrl) {
    setGlobalDispatcher(new ProxyAgent(proxyUrl))
    console.log(`[update-balance] 使用代理: ${proxyUrl}`)
  }

  console.log(`[update-balance] 从 LoL Wiki 拉取: ${WIKI_DATA_URL}`)
  const res = await fetch(WIKI_DATA_URL, {
    headers: {
      // Cloudflare 会拦截“伪装浏览器”的 UA，反而放行 curl/wget 这类简单 UA
      'Accept': '*/*',
      'User-Agent': 'curl/8.13.0',
    },
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const html = await res.text()
  return extractLuaTable(html)
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
      source: 'lol-wiki',
      sourceUrl: 'https://wiki.leagueoflegends.com/en-us/Module:ChampionData/data',
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

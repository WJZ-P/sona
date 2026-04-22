/**
 * 英雄平衡数据更新脚本（Node 环境）
 *
 * 从 Meraki Analytics CDN 拉取最新英雄数据，
 * 提取 ARAM / URF 平衡数值并写入 src/data/champion-balance.json。
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

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const MERAKI_URL = 'https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/champions.json'
const OUTPUT_PATH = path.resolve(__dirname, '..', 'src', 'data', 'champion-balance.json')

type MerakiStatValue = { flat?: number; percent?: number; perLevel?: number; percentPerLevel?: number }
type MerakiChampion = {
  id: number
  key: string
  name: string
  stats?: Record<string, MerakiStatValue>
}

function flat(stat: MerakiStatValue | undefined, fallback = 1): number {
  return stat?.flat ?? fallback
}

function sha1(text: string): string {
  return crypto.createHash('sha1').update(text).digest('hex')
}

async function main() {
  console.log(`[update-balance] 拉取 Meraki CDN: ${MERAKI_URL}`)

  const res = await fetch(MERAKI_URL)
  if (!res.ok) {
    console.error(`[update-balance] 请求失败: HTTP ${res.status}`)
    process.exit(1)
  }

  const rawText = await res.text()
  const data = JSON.parse(rawText) as Record<string, MerakiChampion>

  // 构建英雄平衡表
  const champions: Record<string, unknown> = {}
  let count = 0

  for (const champ of Object.values(data)) {
    if (!champ?.id || champ.id <= 0) continue
    const s = champ.stats ?? {}
    champions[String(champ.id)] = {
      id: champ.id,
      alias: champ.key,
      aram: {
        damageDealt: flat(s.aramDamageDealt),
        damageTaken: flat(s.aramDamageTaken),
        healing: flat(s.aramHealing),
        shielding: flat(s.aramShielding),
        tenacity: flat(s.aramTenacity),
        abilityHaste: flat(s.aramAbilityHaste),
        attackSpeed: flat(s.aramAttackSpeed),
        energyRegen: flat(s.aramEnergyRegen),
      },
      urf: {
        damageDealt: flat(s.urfDamageDealt),
        damageTaken: flat(s.urfDamageTaken),
        healing: flat(s.urfHealing),
        shielding: flat(s.urfShielding),
      },
    }
    count++
  }

  // 计算核心数据哈希（不含 _meta，避免时间戳干扰）
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
      source: 'meraki-analytics',
      sourceUrl: MERAKI_URL,
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

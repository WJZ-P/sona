export interface AramggRequestOptions {
  signal?: AbortSignal
  timeoutMs?: number
}

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }
type JsonObject = { [key: string]: JsonValue }

export interface AramggMayhemAugment {
  description: string
  displayName: string
  enabled: boolean
  iconLarge: string
  iconSmall: string
  id: number
  name: string
  rarity: number
  spellDataValues: Record<string, number>
  tooltip: string
}

/** aram-mayhem-augments.zh_cn.json: keyed by augment id */
export type AramggMayhemAugments = Record<string, AramggMayhemAugment>

export interface AramggAugmentTopChampionStats {
  champion_rank: string
  tier: string
  win_rate: string
  num_games: string
  pick_rate: string
  champion_id: string
}

export interface AramggAugmentStageStats {
  tier: string
  augment_stage: string
  win_rate: string
  num_games: string
  pick_rate: string
}

/** augments-stats-raw.json tuple[1] JSON payload after parsing */
export interface AramggAugmentStatsPayload {
  top_champions: AramggAugmentTopChampionStats[]
  tier: string
  augment_stage_stats: AramggAugmentStageStats[]
  num_win_games: string
  win_rate: string
  num_games: string
  pick_rate: string
}

/**
 * augments-stats-raw.json raw row:
 * [augmentId, JSON.stringify(stats), patchVersion, updatedDate, marker]
 */
export type AramggAugmentStatsRawRow = [
  augmentId: string,
  statsJson: string,
  patchVersion: string,
  updatedDate: string,
  marker: string,
]

export type AramggAugmentStatsRaw = AramggAugmentStatsRawRow[]

export interface AramggAugmentStatsEntry {
  augmentId: number
  rawAugmentId: string
  stats: AramggAugmentStatsPayload
  patchVersion: string
  updatedDate: string
  marker: string
}

export interface AramggChampionStats {
  championId?: string
  tier?: string
  num_win_games?: string
  win_rate?: string
  num_games?: string
  pick_rate?: string
  version?: string
  date?: string
}

export interface AramggChampionStatEntry {
  tier: string
  num_win_games: string
  win_rate: string
  num_games: string
  pick_rate: string
  average_index?: string
}

export interface AramggCoreItemBuild {
  win_rate: string
  itemIds: string
  pick_rate: string
  games: string
  wins: string
}

export interface AramggChampionRecommendation {
  championStats: AramggChampionStats | null
  augments: Record<string, AramggChampionStatEntry>
  coreItemBuilds: AramggCoreItemBuild[]
  items: Record<string, AramggChampionStatEntry>
}

export class AramggApiError extends Error {
  readonly url: string
  readonly status?: number
  readonly statusText?: string
  readonly body?: unknown

  constructor(message: string, options: { url: string; status?: number; statusText?: string; body?: unknown }) {
    super(message)
    this.name = 'AramggApiError'
    this.url = options.url
    this.status = options.status
    this.statusText = options.statusText
    this.body = options.body
  }
}

const WINDOWS_1252_REVERSE = new Map<string, number>([
  ['€', 0x80],
  ['‚', 0x82],
  ['ƒ', 0x83],
  ['„', 0x84],
  ['…', 0x85],
  ['†', 0x86],
  ['‡', 0x87],
  ['ˆ', 0x88],
  ['‰', 0x89],
  ['Š', 0x8a],
  ['‹', 0x8b],
  ['Œ', 0x8c],
  ['Ž', 0x8e],
  ['‘', 0x91],
  ['’', 0x92],
  ['“', 0x93],
  ['”', 0x94],
  ['•', 0x95],
  ['–', 0x96],
  ['—', 0x97],
  ['˜', 0x98],
  ['™', 0x99],
  ['š', 0x9a],
  ['›', 0x9b],
  ['œ', 0x9c],
  ['ž', 0x9e],
  ['Ÿ', 0x9f],
])

function isObject(value: JsonValue): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function firstArrayObject(value: JsonValue): JsonObject | null {
  if (!Array.isArray(value)) return null
  const first = value[0]
  return isObject(first) ? first : null
}

function looksLikeUtf8Mojibake(value: string): boolean {
  return /[ÃÂÄÅÆÇÈÉæçèéåäöï¼]|[€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]/.test(value)
}

function fixUtf8Mojibake(value: string): string {
  if (!looksLikeUtf8Mojibake(value)) return value

  try {
    const encoder = new TextEncoder()
    const bytes: number[] = []

    for (const char of value) {
      const code = char.codePointAt(0) ?? 0
      const windows1252Byte = WINDOWS_1252_REVERSE.get(char)
      if (windows1252Byte != null) {
        bytes.push(windows1252Byte)
      } else if (code <= 0xff) {
        bytes.push(code)
      } else {
        bytes.push(...encoder.encode(char))
      }
    }

    return new TextDecoder('utf-8').decode(Uint8Array.from(bytes))
  } catch {
    return value
  }
}

function unescapeLooseText(value: string): string {
  return value
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
}

function fixJsonStrings(value: JsonValue): JsonValue {
  if (typeof value === 'string') return fixUtf8Mojibake(value)
  if (Array.isArray(value)) return value.map((item) => fixJsonStrings(item))
  if (!isObject(value)) return value

  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, fixJsonStrings(child)]),
  )
}

function parseNestedJsonStrings(value: JsonValue, depth = 0): JsonValue {
  if (depth > 4) return value

  if (typeof value === 'string') {
    const fixed = fixUtf8Mojibake(value)
    const trimmed = fixed.trim()
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return fixed

    for (const candidate of [trimmed, unescapeLooseText(trimmed)]) {
      try {
        return parseNestedJsonStrings(fixJsonStrings(JSON.parse(candidate) as JsonValue), depth + 1)
      } catch {
        // Try the next representation. Flight text may contain escaped JSON strings.
      }
    }

    return fixed
  }

  if (Array.isArray(value)) return value.map((item) => parseNestedJsonStrings(item, depth))
  if (!isObject(value)) return value

  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, parseNestedJsonStrings(child, depth)]),
  )
}

function normalizeJsonValue(value: JsonValue): JsonValue {
  return parseNestedJsonStrings(fixJsonStrings(value))
}

function parseJsonPayload(payload: string): JsonValue {
  return normalizeJsonValue(JSON.parse(payload) as JsonValue)
}

function isJsonLikePayload(payload: string): boolean {
  return payload.startsWith('{') || payload.startsWith('[') || payload.startsWith('"')
}

function readBalancedArrayLiteral(text: string, startIndex: number): string | null {
  if (text[startIndex] !== '[') return null

  let depth = 0
  let quote: '"' | "'" | '`' | null = null
  let escaped = false

  for (let i = startIndex; i < text.length; i++) {
    const char = text[i]

    if (quote) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === quote) {
        quote = null
      }
      continue
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char
      continue
    }

    if (char === '[') {
      depth++
    } else if (char === ']') {
      depth--
      if (depth === 0) return text.slice(startIndex, i + 1)
    }
  }

  return null
}

/**
 * 从 Next.js HTML 中提取 self.__next_f.push(...) 拼接出的 RSC 文本流。
 *
 * ARAMGG 在普通 GET 下可能返回完整 HTML，而不是纯 RSC stream。后续解析只关心
 * push 数组的第二项字符串，因此这里先把这些 chunk 还原成纯 RSC 文本。
 */
export function extractRscFromHtml(htmlRawText: string): string {
  let rscStream = ''
  const pushCallRegex = /(?:self\.__next_f|\(self\.__next_f\s*=\s*self\.__next_f\s*\|\|\s*\[\]\))\.push\s*\(/g
  let match: RegExpExecArray | null

  while ((match = pushCallRegex.exec(htmlRawText)) !== null) {
    const arrayStart = htmlRawText.indexOf('[', pushCallRegex.lastIndex)
    if (arrayStart < 0) break

    const arrayLiteral = readBalancedArrayLiteral(htmlRawText, arrayStart)
    if (!arrayLiteral) continue

    pushCallRegex.lastIndex = arrayStart + arrayLiteral.length

    try {
      const parsedArray = JSON.parse(arrayLiteral) as unknown
      if (Array.isArray(parsedArray) && typeof parsedArray[1] === 'string') {
        rscStream += parsedArray[1]
      }
    } catch {
      // Ignore malformed/non-JSON push calls and keep scanning later chunks.
    }
  }

  return rscStream
}

function normalizeRscInput(text: string): string {
  const extracted = extractRscFromHtml(text)
  return extracted || text
}

function isStatEntry(value: JsonValue): value is JsonObject {
  return isObject(value)
    && value.tier != null
    && value.win_rate != null
    && value.num_games != null
    && value.pick_rate != null
}

function isAugmentStatsMap(value: JsonValue): value is JsonObject {
  if (!isObject(value)) return false
  const keys = Object.keys(value)
  if (keys.length === 0 || !keys.every((key) => /^\d+$/.test(key))) return false
  const first = value[keys[0]]
  return isStatEntry(first) && isObject(first) && first.average_index == null
}

function isItemStatsMap(value: JsonValue): value is JsonObject {
  if (!isObject(value)) return false
  const keys = Object.keys(value)
  if (keys.length === 0 || !keys.every((key) => /^\d+$/.test(key))) return false
  const first = value[keys[0]]
  return isStatEntry(first) && isObject(first) && first.average_index != null
}

function isCoreItemBuildArray(value: JsonValue): value is JsonObject[] {
  const first = firstArrayObject(value)
  return Array.isArray(value)
    && value.length === 3
    && first != null
    && first.itemIds != null
    && first.win_rate != null
    && first.pick_rate != null
    && first.games != null
    && first.wins != null
    && value.every((build) => isObject(build) && typeof build.itemIds === 'string' && build.itemIds.split(',').filter(Boolean).length === 3)
}

function toStatMap(value: JsonObject): Record<string, AramggChampionStatEntry> {
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, entry as unknown as AramggChampionStatEntry]))
}

function toCoreItemBuilds(value: JsonObject[]): AramggCoreItemBuild[] {
  return value.map((build) => ({
    win_rate: String(build.win_rate ?? ''),
    itemIds: String(build.itemIds ?? ''),
    pick_rate: String(build.pick_rate ?? ''),
    games: String(build.games ?? ''),
    wins: String(build.wins ?? ''),
  }))
}

function mergeChampionStats(target: AramggChampionRecommendation, stats: AramggChampionStats) {
  target.championStats = {
    ...(target.championStats ?? {}),
    ...stats,
  }
}

function collectChampionRecommendationData(value: JsonValue, target: AramggChampionRecommendation) {
  if (isObject(value)) {
    if (
      value.num_win_games != null
      && value.win_rate != null
      && value.num_games != null
      && value.pick_rate != null
      && value.augments != null
      && value.items != null
    ) {
      mergeChampionStats(target, {
        tier: value.tier != null ? String(value.tier) : undefined,
        num_win_games: String(value.num_win_games),
        win_rate: String(value.win_rate),
        num_games: String(value.num_games),
        pick_rate: String(value.pick_rate),
        version: value.version != null ? String(value.version) : undefined,
        date: value.date != null ? String(value.date) : undefined,
      })
    }

    if (value.augments != null && isAugmentStatsMap(value.augments)) {
      target.augments = toStatMap(value.augments)
    } else if (isAugmentStatsMap(value)) {
      target.augments = toStatMap(value)
    }

    if (value.items != null && isItemStatsMap(value.items)) {
      target.items = toStatMap(value.items)
    } else if (isItemStatsMap(value)) {
      target.items = toStatMap(value)
    }

    Object.values(value).forEach((child) => collectChampionRecommendationData(child, target))
    return
  }

  if (isCoreItemBuildArray(value)) {
    target.coreItemBuilds = toCoreItemBuilds(value)
    return
  }

  if (Array.isArray(value)) {
    value.forEach((child) => collectChampionRecommendationData(child, target))
  }
}

function collectEscapedCoreItemBuildArrays(rscText: string, target: AramggChampionRecommendation) {
  const candidates = new Set<string>()
  const escapedArrayRegex = /(\[\{\\?"win_rate\\?":\\?"[^"]+\\?",\\?"itemIds\\?":\\?"(?:\d+,){2}\d+\\?",\\?"pick_rate\\?":\\?"[^"]+\\?",\\?"games\\?":\\?"\d+\\?",\\?"wins\\?":\\?"\d+\\?"\}(?:,\{\\?"win_rate\\?":\\?"[^"]+\\?",\\?"itemIds\\?":\\?"(?:\d+,){2}\d+\\?",\\?"pick_rate\\?":\\?"[^"]+\\?",\\?"games\\?":\\?"\d+\\?",\\?"wins\\?":\\?"\d+\\?"\}){2}\])/g

  for (const text of [rscText, unescapeLooseText(rscText)]) {
    let match: RegExpExecArray | null
    while ((match = escapedArrayRegex.exec(text)) !== null) {
      candidates.add(match[1])
    }
  }

  for (const candidate of candidates) {
    try {
      const parsed = normalizeJsonValue(JSON.parse(unescapeLooseText(candidate)) as JsonValue)
      if (isCoreItemBuildArray(parsed)) target.coreItemBuilds = toCoreItemBuilds(parsed)
    } catch {
      // Ignore unrelated escaped arrays.
    }
  }
}

export function parseAramggChampionRecommendation(text: string, championId?: number): AramggChampionRecommendation {
  const fixedText = normalizeRscInput(fixUtf8Mojibake(text))
  const result: AramggChampionRecommendation = {
    championStats: championId != null ? { championId: String(championId) } : null,
    augments: {},
    coreItemBuilds: [],
    items: {},
  }

  const flightTextRegex = /([0-9a-zA-Z]+):T([0-9a-fA-F]+),/g
  let match: RegExpExecArray | null

  while ((match = flightTextRegex.exec(fixedText)) !== null) {
    const contentLength = Number.parseInt(match[2], 16)
    if (!Number.isFinite(contentLength) || contentLength <= 0) continue

    const contentStart = match.index + match[0].length
    const content = fixedText.slice(contentStart, contentStart + contentLength)
    if (!isJsonLikePayload(content.trimStart())) continue

    try {
      collectChampionRecommendationData(parseJsonPayload(content), result)
    } catch {
      // Flight text records can also contain non-data payloads.
    }
  }

  for (const line of fixedText.split(/\r?\n/)) {
    const record = /^([0-9a-zA-Z]+):(.+)$/.exec(line)
    if (!record) continue

    const payload = record[2]
    if (payload.startsWith('T') || !isJsonLikePayload(payload)) continue

    try {
      collectChampionRecommendationData(parseJsonPayload(payload), result)
    } catch {
      // Ignore non-JSON RSC protocol records.
    }
  }

  collectEscapedCoreItemBuildArrays(fixedText, result)
  return result
}

export class AramggDataApi {
  static readonly BASE_URL = 'https://aramgg.com'
  static readonly DEFAULT_TIMEOUT_MS = 10000

  getMayhemAugmentsZhCn(options: AramggRequestOptions = {}): Promise<AramggMayhemAugments> {
    return this.request('/data/aram-mayhem-augments.zh_cn.json', options)
  }

  getAugmentsStatsRaw(options: AramggRequestOptions = {}): Promise<AramggAugmentStatsRaw> {
    return this.request('/data/augments-stats-raw.json', options)
  }

  async getAugmentsStats(options: AramggRequestOptions = {}): Promise<AramggAugmentStatsEntry[]> {
    const rawRows = await this.getAugmentsStatsRaw(options)
    return rawRows.map(([rawAugmentId, statsJson, patchVersion, updatedDate, marker]) => ({
      augmentId: Number(rawAugmentId),
      rawAugmentId,
      stats: JSON.parse(statsJson) as AramggAugmentStatsPayload,
      patchVersion,
      updatedDate,
      marker,
    }))
  }

  async getChampionRecommendation(championId: number, options: AramggRequestOptions = {}): Promise<AramggChampionRecommendation> {
    const text = await this.requestText(`/zh-CN/champion-stats/${championId}`, options)
    const parsed = parseAramggChampionRecommendation(text, championId)

    console.groupCollapsed(`[ARAMGG] champion ${championId} parsed recommendation`)
    console.log('raw text length:', text.length)
    console.log('raw text preview:', text.slice(0, 500))
    console.log('summary:', {
      hasChampionStats: parsed.championStats != null,
      augmentCount: Object.keys(parsed.augments).length,
      coreItemBuildCount: parsed.coreItemBuilds.length,
      itemCount: Object.keys(parsed.items).length,
    })
    console.log('championStats:', parsed.championStats)
    console.log('coreItemBuilds:', parsed.coreItemBuilds)
    console.log('augments:', parsed.augments)
    console.log('items:', parsed.items)
    console.log('full parsed recommendation:', parsed)
    console.groupEnd()

    return parsed
  }

  private async requestText(path: string, options: AramggRequestOptions = {}): Promise<string> {
    const url = new URL(path, AramggDataApi.BASE_URL)
    const controller = new AbortController()
    const timeoutMs = options.timeoutMs ?? AramggDataApi.DEFAULT_TIMEOUT_MS
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs)

    const relayAbort = () => controller.abort()
    options.signal?.addEventListener('abort', relayAbort, { once: true })

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        mode: 'cors',
        //  为了避免触发CORS，不能加那么多请求头
        // credentials: 'include',
        // referrer: `${AramggDataApi.BASE_URL}/zh-CN`,
        // headers: {
        //   accept: '*/*',
        //   'accept-language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        //   'next-url': '/zh-CN',
        //   rsc: '1',
        // },
        headers: { Accept: '*/*' },
        signal: controller.signal,
      })
      const text = await response.text()

      if (!response.ok) {
        throw new AramggApiError(`[ARAMGG] 请求失败: ${response.status} ${response.statusText}`, {
          url: url.toString(),
          status: response.status,
          statusText: response.statusText,
          body: text,
        })
      }

      return text
    } catch (err) {
      if (err instanceof AramggApiError) throw err
      const message = err instanceof Error ? err.message : String(err)
      throw new AramggApiError(`[ARAMGG] 请求异常: ${message}`, { url: url.toString() })
    } finally {
      window.clearTimeout(timeout)
      options.signal?.removeEventListener('abort', relayAbort)
    }
  }

  private async request<T>(path: string, options: AramggRequestOptions = {}): Promise<T> {
    const url = new URL(path, AramggDataApi.BASE_URL)
    const controller = new AbortController()
    const timeoutMs = options.timeoutMs ?? AramggDataApi.DEFAULT_TIMEOUT_MS
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs)

    const relayAbort = () => controller.abort()
    options.signal?.addEventListener('abort', relayAbort, { once: true })

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        mode: 'cors',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      })
      const text = await response.text()
      const body = text ? JSON.parse(text) as unknown : null

      if (!response.ok) {
        throw new AramggApiError(`[ARAMGG] 请求失败: ${response.status} ${response.statusText}`, {
          url: url.toString(),
          status: response.status,
          statusText: response.statusText,
          body,
        })
      }

      return body as T
    } catch (err) {
      if (err instanceof AramggApiError) throw err
      const message = err instanceof Error ? err.message : String(err)
      throw new AramggApiError(`[ARAMGG] 请求异常: ${message}`, { url: url.toString() })
    } finally {
      window.clearTimeout(timeout)
      options.signal?.removeEventListener('abort', relayAbort)
    }
  }
}

export const aramggApi = new AramggDataApi()

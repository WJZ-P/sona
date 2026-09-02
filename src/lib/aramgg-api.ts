export interface AramggRequestOptions {
  signal?: AbortSignal
  timeoutMs?: number
}

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
  top_champions: AramggAugmentTopChampionStats[] | null
  top_champion_ids?: string[]
  tier: string
  augment_stage_stats: AramggAugmentStageStats[] | null
  num_win_games: string | null
  win_rate: string
  num_games: string | null
  pick_rate: string
  source?: string
  region?: string
}

/** [augmentId, JSON.stringify(stats), patchVersion, updatedDate, marker] */
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

export interface AramggChampionRanking {
  championId: string
  tier: string
  winRate: number | null
  numWinGames: number | null
  numGames: number | null
  pickRate: number | null
  version: string
  date: string
  source: string
  region: string
  rank: number
  rankDelta: string | number | null
}

export type AramggChampionsStats = AramggChampionRanking[]

export type AramggChampionAugmentRawRow = [
  championId: string,
  statsJson: string,
  patchVersion: string,
  updatedDate: string,
]

export interface AramggChampionDetails {
  championId: string
  championAugments: AramggChampionAugmentRawRow[] | null
  trend?: unknown
}

export interface AramggChampionStatEntry {
  tier: string
  num_win_games: string | null
  win_rate: string | null
  num_games: string | null
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function toNullableString(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  return null
}

function parseChampionAugmentStats(statsJson: string): Record<string, AramggChampionStatEntry> {
  const payload = JSON.parse(statsJson) as unknown
  if (!isRecord(payload) || !isRecord(payload.augments)) return {}

  const result: Record<string, AramggChampionStatEntry> = {}
  for (const [augmentId, rawStats] of Object.entries(payload.augments)) {
    if (!/^\d+$/.test(augmentId) || !isRecord(rawStats)) continue

    const tier = toNullableString(rawStats.tier)
    const pickRate = toNullableString(rawStats.pick_rate)
    if (tier == null || pickRate == null) continue

    const averageIndex = toNullableString(rawStats.average_index)
    result[augmentId] = {
      tier,
      num_win_games: toNullableString(rawStats.num_win_games),
      win_rate: toNullableString(rawStats.win_rate),
      num_games: toNullableString(rawStats.num_games),
      pick_rate: pickRate,
      ...(averageIndex != null ? { average_index: averageIndex } : {}),
    }
  }

  return result
}

function mergeChampionStats(target: AramggChampionRecommendation, stats: AramggChampionStats) {
  target.championStats = {
    ...(target.championStats ?? {}),
    ...stats,
  }
}

function mergeChampionRanking(
  target: AramggChampionRecommendation,
  ranking: AramggChampionRanking | null,
  championId: number,
) {
  if (!ranking) {
    mergeChampionStats(target, { championId: String(championId) })
    return
  }

  mergeChampionStats(target, {
    championId: ranking.championId,
    tier: ranking.tier,
    num_win_games: ranking.numWinGames != null ? String(ranking.numWinGames) : undefined,
    win_rate: ranking.winRate != null ? String(ranking.winRate) : undefined,
    num_games: ranking.numGames != null ? String(ranking.numGames) : undefined,
    pick_rate: ranking.pickRate != null ? String(ranking.pickRate) : undefined,
    version: ranking.version,
    date: ranking.date,
  })
}

/** 解析新版 /data/champion-details/{id}.json 中的单英雄海克斯统计。 */
export function parseAramggChampionDetails(
  details: AramggChampionDetails,
  ranking: AramggChampionRanking | null = null,
  championId = Number(details.championId),
): AramggChampionRecommendation {
  const resolvedChampionId = Number.isFinite(championId) && championId > 0
    ? championId
    : Number(details.championId)
  const result: AramggChampionRecommendation = {
    championStats: { championId: String(resolvedChampionId || details.championId) },
    augments: {},
    coreItemBuilds: [],
    items: {},
  }

  for (const row of details.championAugments ?? []) {
    if (!Array.isArray(row) || typeof row[1] !== 'string') continue

    try {
      Object.assign(result.augments, parseChampionAugmentStats(row[1]))
      mergeChampionStats(result, {
        championId: row[0] || String(resolvedChampionId),
        version: row[2],
        date: row[3],
      })
    } catch {
      // Ignore malformed rows and keep any valid data from the response.
    }
  }

  mergeChampionRanking(result, ranking, resolvedChampionId)
  return result
}

export class AramggDataApi {
  static readonly BASE_URL = 'https://aramgg.com'
  static readonly DEFAULT_TIMEOUT_MS = 10000

  private championsStatsCache: AramggChampionsStats | null = null
  private championsStatsPromise: Promise<AramggChampionsStats> | null = null

  /**
   * 全英雄海克斯大乱斗 T 级/胜率榜。默认请求会缓存到当前客户端进程内，
   * 供启动预加载、选人角标和单英雄面板共同复用。
   */
  getChampionsStats(options: AramggRequestOptions = {}): Promise<AramggChampionsStats> {
    const cacheable = options.signal == null
    if (cacheable && this.championsStatsCache) return Promise.resolve(this.championsStatsCache)
    if (cacheable && this.championsStatsPromise) return this.championsStatsPromise

    const promise = this.request<AramggChampionsStats>('/data/champions-stats.json', options)
      .then((data) => {
        if (!Array.isArray(data)) {
          throw new AramggApiError('[ARAMGG] 全英雄统计格式异常', {
            url: new URL('/data/champions-stats.json', AramggDataApi.BASE_URL).toString(),
            body: data,
          })
        }

        if (cacheable) {
          this.championsStatsCache = data
          this.championsStatsPromise = null
        }
        return data
      })
      .catch((err) => {
        if (cacheable) this.championsStatsPromise = null
        throw err
      })

    if (cacheable) this.championsStatsPromise = promise
    return promise
  }

  async getChampionRanking(championId: number): Promise<AramggChampionRanking | null> {
    const rankings = await this.getChampionsStats()
    return rankings.find((entry) => Number(entry.championId) === championId) ?? null
  }

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

  async getChampionRecommendation(
    championId: number,
    options: AramggRequestOptions = {},
  ): Promise<AramggChampionRecommendation> {
    const rankingPromise = this.getChampionRanking(championId).catch((err) => {
      console.warn(`[ARAMGG] champion ${championId} ranking unavailable:`, err)
      return null
    })
    const [details, ranking] = await Promise.all([
      this.request<AramggChampionDetails>(`/data/champion-details/${championId}.json`, options),
      rankingPromise,
    ])
    const parsed = parseAramggChampionDetails(details, ranking, championId)

    console.groupCollapsed(`[ARAMGG] champion ${championId} parsed recommendation`)
    console.log('summary:', {
      championStats: parsed.championStats,
      augmentCount: Object.keys(parsed.augments).length,
      coreItemBuildCount: parsed.coreItemBuilds.length,
      itemCount: Object.keys(parsed.items).length,
    })
    console.groupEnd()

    return parsed
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

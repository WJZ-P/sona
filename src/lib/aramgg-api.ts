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

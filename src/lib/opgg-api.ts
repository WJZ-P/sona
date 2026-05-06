export type OpggRegion = 'global' | 'na' | 'euw' | 'kr' | 'br' | 'eune' | 'jp' | 'lan' | 'las' | 'oce' | 'tr' | 'ru' | 'sg' | 'id' | 'ph' | 'th' | 'vn' | 'tw' | 'me'
export type OpggMode = 'aram' | 'arena' | 'nexus_blitz' | 'urf' | 'ranked'
export type OpggTier = 'all' | 'ibsg' | 'iron' | 'bronze' | 'silver' | 'gold' | 'gold_plus' | 'platinum' | 'platinum_plus' | 'emerald' | 'emerald_plus' | 'diamond' | 'diamond_plus' | 'master' | 'master_plus' | 'grandmaster' | 'challenger'
export type OpggPosition = 'mid' | 'jungle' | 'adc' | 'top' | 'support' | 'all' | 'none'

export interface OpggVersions {
  data: string[]
}

export interface OpggMeta {
  version: string
  cached_at: string
  match_count?: number
  analyzed_at?: string
}

export interface OpggAverageStats {
  win_rate: number
  pick_rate: number
  ban_rate: number | null
  kda: number
  tier: number
  rank: number
  tier_data?: {
    tier: number
    rank: number
    rank_prev: number | null
    rank_prev_patch: number | null
  }
}

export interface OpggArenaAverageStats {
  win: number
  play: number
  total_place: number
  first_place: number
  pick_rate: number
  ban_rate: number
  kills: number
  assists: number
  deaths: number
  tier: number
  rank: number
}

export interface OpggSummary {
  id: number
  is_rotation: boolean
  is_rip: boolean
  average_stats: OpggAverageStats
  positions: null
  roles: unknown[]
}

export interface OpggArenaSummary {
  id: number
  is_rotation: boolean
  is_rip: boolean
  average_stats: OpggArenaAverageStats
}

export interface OpggItemBuild {
  ids: number[]
  win: number
  play: number
  pick_rate: number
  total_place?: number
  first_place?: number
}

export interface OpggRuneBuild {
  id: number
  primary_page_id: number
  primary_rune_ids: number[]
  secondary_page_id: number
  secondary_rune_ids: number[]
  stat_mod_ids: number[]
  play: number
  win: number
  pick_rate: number
}

export interface OpggRunePage {
  id: number
  primary_page_id: number
  secondary_page_id: number
  play: number
  win: number
  pick_rate: number
  builds: OpggRuneBuild[]
}

export interface OpggSkillBuild {
  order: string[]
  play: number
  win: number
  pick_rate: number
  total_place?: number
  first_place?: number
}

export interface OpggSkillMastery {
  ids: string[]
  play: number
  win: number
  pick_rate: number
  total_place?: number
  first_place?: number
  builds: OpggSkillBuild[]
}

export interface OpggTrendPoint {
  version: string
  rate: number
  rank: number
  created_at: string
}

export interface OpggTrends {
  total_rank: number
  total_position_rank: number
  win: OpggTrendPoint[]
  pick: OpggTrendPoint[]
  ban: OpggTrendPoint[]
}

export interface OpggGameLength {
  game_length: number
  rate: number
  average: number
  rank: number
}

export interface OpggNormalChampionData {
  summary: OpggSummary
  summoner_spells: OpggItemBuild[]
  core_items: OpggItemBuild[]
  mythic_items: OpggItemBuild[]
  boots: OpggItemBuild[]
  starter_items: OpggItemBuild[]
  last_items: OpggItemBuild[]
  rune_pages: OpggRunePage[]
  runes: OpggRuneBuild[]
  skill_masteries: OpggSkillMastery[]
  skills: OpggSkillBuild[]
  skill_evolves: unknown[]
  trends: OpggTrends
  game_lengths: OpggGameLength[]
  counters: unknown[]
  augment_group?: OpggAugmentGroup[]
}

export interface OpggAugment {
  id: number
  win: number
  play: number
  total_place: number
  first_place: number
  pick_rate: number
}

export interface OpggAugmentGroup {
  rarity: number
  augments: OpggAugment[]
}

export interface OpggSynergy {
  champion_id: number
  op_rank: number
  play: number
  win: number
  total_place: number
  first_place: number
  pick_rate: number
}

export interface OpggArenaChampionData {
  summary: OpggArenaSummary
  core_items: OpggItemBuild[]
  boots: OpggItemBuild[]
  starter_items: OpggItemBuild[]
  last_items: OpggItemBuild[]
  prism_items: OpggItemBuild[]
  skill_masteries: OpggSkillMastery[]
  skills: OpggSkillBuild[]
  skill_evolves: unknown[]
  augment_group: OpggAugmentGroup[]
  synergies: OpggSynergy[]
}

export interface OpggNormalModeChampion {
  data: OpggNormalChampionData
  meta: OpggMeta
}

export interface OpggArenaModeChampion {
  data: OpggArenaChampionData
  meta: OpggMeta
}

export interface OpggARAMDataItem {
  id: number
  is_rotation: boolean
  is_rip: boolean
  average_stats: OpggAverageStats
  positions: null
  roles: unknown[]
}

export interface OpggArenaDataItem {
  id: number
  is_rotation: boolean
  is_rip: boolean
  average_stats: OpggArenaAverageStats
}

export interface OpggRankedPositionStats {
  win_rate: number
  pick_rate: number
  role_rate: number
  ban_rate: number
  kda: number
  tier_data: {
    tier: number
    rank: number
    rank_prev: number | null
    rank_prev_patch: number | null
  }
}

export interface OpggRankedPosition {
  name: string
  stats: OpggRankedPositionStats
  roles: Array<{
    name: string
    stats: {
      win_rate: number
      role_rate: number
      play: number
      win: number
    }
  }>
  counters: Array<{
    champion_id: number
    play: number
    win: number
  }>
}

export interface OpggRankedDataItem {
  id: number
  is_rotation: boolean
  is_rip: boolean
  average_stats: OpggAverageStats | null
  positions: OpggRankedPosition[]
  roles: unknown[]
}

export interface OpggRankedChampionsSummary {
  data: OpggRankedDataItem[]
  meta: OpggMeta
}

export interface OpggARAMChampionSummary {
  data: OpggARAMDataItem[]
  meta: OpggMeta
}

export interface OpggArenaChampionSummary {
  data: OpggArenaDataItem[]
  meta: OpggMeta
}

export interface OpggBalanceDataItem {
  champion_id: number
  attack_speed: number
  damage_dealt: number
  damage_taken: number
  cooldown_reduction: number
  healing: number
  tenacity: number
  shield_amount: number
  energy_regen: number
  area_of_effect_damage: number
  default: boolean
}

export interface OpggARAMBalance {
  data: OpggBalanceDataItem[]
}

export type OpggChampionsTier = OpggRankedChampionsSummary | OpggArenaChampionSummary | OpggARAMChampionSummary
export type OpggChampion = OpggNormalModeChampion | OpggArenaModeChampion

export interface OpggRequestOptions {
  signal?: AbortSignal
  timeoutMs?: number
}

export interface OpggGetVersionsOptions extends OpggRequestOptions {
  region: OpggRegion
  mode: OpggMode
}

export interface OpggGetChampionsTierOptions extends OpggRequestOptions {
  region: OpggRegion
  mode: OpggMode
  tier: OpggTier
  version?: string
}

export interface OpggGetChampionOptions extends OpggRequestOptions {
  id: number
  region: OpggRegion
  mode: OpggMode
  tier: OpggTier
  position?: OpggPosition
  version?: string
}

export class OpggApiError extends Error {
  readonly url: string
  readonly status?: number
  readonly statusText?: string
  readonly body?: unknown

  constructor(message: string, options: { url: string; status?: number; statusText?: string; body?: unknown }) {
    super(message)
    this.name = 'OpggApiError'
    this.url = options.url
    this.status = options.status
    this.statusText = options.statusText
    this.body = options.body
  }
}

type QueryParams = Record<string, string | number | boolean | null | undefined>

export class OpggDataApi {
  static readonly BASE_URL = 'https://lol-api-champion.op.gg'
  static readonly DEFAULT_TIMEOUT_MS = 10000

  async getVersions(options: OpggGetVersionsOptions): Promise<OpggVersions> {
    const { region, mode, signal, timeoutMs } = options
    return this.request(`/api/${region}/champions/${mode}/versions`, { signal, timeoutMs })
  }

  async getChampionsTier(options: OpggGetChampionsTierOptions): Promise<OpggChampionsTier> {
    const { region, mode, tier, version, signal, timeoutMs } = options
    return this.request(`/api/${region}/champions/${mode}`, {
      params: { tier, version },
      signal,
      timeoutMs,
    })
  }

  async getChampion(options: OpggGetChampionOptions): Promise<OpggChampion> {
    const { id, region, mode, tier, version, signal, timeoutMs } = options
    const position = mode === 'aram' ? 'none' : options.position
    const path = mode === 'arena'
      ? `/api/${region}/champions/${mode}/${id}`
      : `/api/${region}/champions/${mode}/${id}/${position ?? 'none'}`

    return this.request(path, {
      params: { tier, version },
      signal,
      timeoutMs,
    })
  }

  async getARAMBalance(options: OpggRequestOptions = {}): Promise<OpggARAMBalance> {
    return this.request('/api/contents/aram-balance', options)
  }

  private async request<T>(
    path: string,
    options: OpggRequestOptions & { params?: QueryParams } = {},
  ): Promise<T> {
    const url = new URL(path, OpggDataApi.BASE_URL)
    Object.entries(options.params ?? {}).forEach(([key, value]) => {
      if (value != null && value !== '') url.searchParams.set(key, String(value))
    })

    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), options.timeoutMs ?? OpggDataApi.DEFAULT_TIMEOUT_MS)
    const relayAbort = () => controller.abort()
    options.signal?.addEventListener('abort', relayAbort, { once: true })

    try {
      const resp = await fetch(url.toString(), {
        method: 'GET',
        mode: 'cors',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      })
      const text = await resp.text()
      const body = parseJson(text)

      if (!resp.ok) {
        throw new OpggApiError(`OP.GG request failed: ${resp.status} ${resp.statusText}`, {
          url: url.toString(),
          status: resp.status,
          statusText: resp.statusText,
          body,
        })
      }

      return body as T
    } catch (err) {
      if (err instanceof OpggApiError) throw err
      const message = err instanceof Error ? err.message : String(err)
      throw new OpggApiError(`OP.GG request failed: ${message}`, { url: url.toString() })
    } finally {
      window.clearTimeout(timeout)
      options.signal?.removeEventListener('abort', relayAbort)
    }
  }
}

function parseJson(text: string): unknown {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export function normalizeOpggVersion(gameVersion: string): string | undefined {
  const match = gameVersion.match(/^(\d+\.\d+)/)
  return match?.[1]
}

export const opggApi = new OpggDataApi()

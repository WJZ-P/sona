/**
 * 海斗分 —— 海克斯大乱斗（gameMode = KIWI）专属的玩家实力分。
 *
 * 分数范围 1000 - 4000，2500 为平均水平。
 *
 * 设计思路：
 * 海克斯强化会让伤害、治疗等绝对数值严重膨胀且每局差异极大，所以这里**不使用任何绝对阈值**，
 * 每一项指标都只和同一局里的其他人比较：
 *
 * 1. 单局内先为全部 10 名玩家算出「综合表现」（0-1），各项都是「本人 / 本队人均」的比值；
 * 2. 再把目标玩家的综合表现在 10 人中做标准化（z 分），因此每一局所有人的 z 分均值恒为 0，
 *    分数天然以 2500 为中心，不会因为版本、强化强度变化而整体漂移；
 * 3. 叠加一个对称的胜负修正（赢 +、输 -，全体均值仍为 0）；
 * 4. 多局按时间衰减加权平均，再按样本量向 2500 收缩（场次少的人不会被几局超神/爆炸带飞），
 *    最后用 tanh 平滑映射到 1000 - 4000。
 *
 * 单局综合表现的构成（权重见 COMPOSITE_WEIGHTS）：
 * - 贡献：输出 / 承伤 / 辅助三条通道中，以最强的一条为主（不需要知道英雄定位，
 *   坦克不会因为伤害低被判差，奶妈不会因为承伤低被判差）；
 * - 参团：击杀 + 助攻相对本队人均；
 * - 生存：死亡数相对本队人均（越少越好）；
 * - KDA：相对全场 10 人均值，补上跨队伍的对比；
 * - 推进：对防御塔伤害相对本队人均。
 *
 * 注意：各权重与映射斜率是按指标含义推定的，尚未用大样本真实对局做过统计校准。
 */

import type { SgpGameSummaryLol, SgpParticipantLol } from '@/types/sgp'
import { shouldSkipSonaStrengthGame } from '@/lib/player-strength-score'

export const HEX_MAYHEM_GAME_MODE = 'KIWI'
export const HEX_MAYHEM_MIN_SCORE = 1000
export const HEX_MAYHEM_MAX_SCORE = 4000
export const HEX_MAYHEM_AVERAGE_SCORE = 2500

/** 各分项 0-100，50 = 与本队（或全场）人均持平。 */
export interface HexMayhemBreakdown {
  /** 输出：对英雄伤害 */
  damage: number
  /** 承伤：承受 + 自我减免伤害，按死亡次数折算 */
  tank: number
  /** 辅助：对队友的治疗 / 护盾 + 控制时长 */
  utility: number
  /** 贡献：以上三条通道的自适应合成 */
  contribution: number
  /** 参团 */
  participation: number
  /** 生存 */
  survival: number
  /** KDA（相对全场） */
  kda: number
  /** 推进 */
  push: number
}

export interface HexMayhemGameScore {
  gameId: number
  championId: number
  win: boolean
  /** 单局海斗分（1000 - 4000），仅反映这一局，未做样本收缩。 */
  score: number
  /** 综合表现在本局 10 人中的 z 分，已含胜负修正。 */
  performance: number
  breakdown: HexMayhemBreakdown
}

export interface HexMayhemScore {
  puuid: string
  /** 海斗分，整数，1000 - 4000。 */
  score: number
  /** 未按样本量收缩的原始分。 */
  rawScore: number
  /** 样本置信度 0-1，场次越多越接近 1。 */
  confidence: number
  validGames: number
  winRate: number
  breakdown: HexMayhemBreakdown
  games: HexMayhemGameScore[]
}

export interface HexMayhemScoreOptions {
  /** 时间衰减半衰期（按局数），传入的对局需按新到旧排列。 */
  recencyHalfLife: number
  /** 样本收缩强度：相当于先验里有这么多局「平均表现」的对局。 */
  priorGames: number
  /** 短于该时长（秒）的对局视为无效（重开 / 秒投）。 */
  minGameDurationSeconds: number
}

const DEFAULT_OPTIONS: HexMayhemScoreOptions = {
  recencyHalfLife: 12,
  priorGames: 5,
  minGameDurationSeconds: 300,
}

const COMPOSITE_WEIGHTS = {
  contribution: 0.42,
  participation: 0.22,
  survival: 0.2,
  kda: 0.1,
  push: 0.06,
} as const

/** 贡献通道按强弱排序后的权重：最强的一条为主。 */
const CONTRIBUTION_CHANNEL_WEIGHTS = [0.6, 0.28, 0.12] as const
/** 辅助通道内部：治疗护盾 / 控制。 */
const UTILITY_HEAL_SHIELD_WEIGHT = 0.7
/** 治疗护盾量达到「本队人均输出」的该比例时，视为与一名平均输出位贡献相当。 */
const HEAL_SHIELD_PARITY_RATIO = 0.4
/** 比值 → 0-1 的对数 logistic 曲线陡峭度：比值 2 → 0.75，比值 0.5 → 0.25。 */
const RATIO_CURVE_EXPONENT = 1.6
/** 单局 10 人综合表现标准差下限，避免全员表现接近时把微小差距放大。 */
const MIN_GAME_SPREAD = 0.04
const MAX_GAME_Z = 2.5
/** 胜负修正（z 分单位），赢加输减。 */
const WIN_BONUS = 0.3
/** z 分 → 分数的 tanh 尺度：收缩后的平均 z 为 ±1 时对应约 3640 / 1360 分。 */
const SCORE_Z_SCALE = 1
const MIN_PARTICIPANTS = 6

export function isHexMayhemGameMode(gameMode: string | null | undefined): boolean {
  return (gameMode ?? '').toUpperCase() === HEX_MAYHEM_GAME_MODE
}

export function isHexMayhemGame(game: SgpGameSummaryLol): boolean {
  return isHexMayhemGameMode(game.json.gameMode)
}

/**
 * 计算玩家的海斗分。
 *
 * @param games 战绩列表（新到旧）；非海克斯大乱斗的对局会被自动忽略
 * @returns 没有任何有效海斗对局时返回 null
 */
export function calculateHexMayhemScore(
  games: SgpGameSummaryLol[],
  puuid: string,
  options: Partial<HexMayhemScoreOptions> = {},
): HexMayhemScore | null {
  const resolvedOptions = { ...DEFAULT_OPTIONS, ...options }
  const gameScores = games
    .map((game) => calculateHexMayhemGameScore(game, puuid, resolvedOptions))
    .filter((score): score is HexMayhemGameScore => score !== null)

  if (gameScores.length === 0) return null

  const weights = gameScores.map((_, index) => Math.pow(0.5, index / Math.max(resolvedOptions.recencyHalfLife, 1)))
  const averagePerformance = weightedAverage(gameScores.map((game) => game.performance), weights)
  const confidence = gameScores.length / (gameScores.length + Math.max(resolvedOptions.priorGames, 0))

  return {
    puuid,
    score: Math.round(performanceToScore(averagePerformance * confidence)),
    rawScore: Math.round(performanceToScore(averagePerformance)),
    confidence,
    validGames: gameScores.length,
    winRate: weightedAverage(gameScores.map((game) => (game.win ? 1 : 0)), weights),
    breakdown: averageBreakdown(gameScores, weights),
    games: gameScores,
  }
}

export function calculateHexMayhemGameScore(
  game: SgpGameSummaryLol,
  puuid: string,
  options: Partial<HexMayhemScoreOptions> = {},
): HexMayhemGameScore | null {
  const resolvedOptions = { ...DEFAULT_OPTIONS, ...options }
  if (!isHexMayhemGame(game)) return null

  const participants = game.json.participants ?? []
  const participant = participants.find((item) => item.puuid === puuid)
  if (!participant) return null
  if (participants.length < MIN_PARTICIPANTS) return null

  const duration = participant.timePlayed || game.json.gameDuration || 0
  if (duration < resolvedOptions.minGameDurationSeconds) return null
  // 早投、有挂机队友的对局数据失真，与通用战力分保持同一套跳过规则。
  if (shouldSkipSonaStrengthGame(game, puuid)) return null

  const gameContext = buildGameContext(participants)
  const teamContexts = new Map<number, TeamContext>()
  const getTeamContext = (teamId: number): TeamContext => {
    let context = teamContexts.get(teamId)
    if (!context) {
      context = buildTeamContext(participants.filter((item) => item.teamId === teamId))
      teamContexts.set(teamId, context)
    }
    return context
  }

  const breakdowns = participants.map((item) => calculateBreakdown(item, getTeamContext(item.teamId), gameContext))
  const composites = breakdowns.map(calculateComposite)
  const index = participants.indexOf(participant)

  const spread = Math.max(standardDeviation(composites), MIN_GAME_SPREAD)
  const relative = clamp((composites[index] - average(composites)) / spread, -MAX_GAME_Z, MAX_GAME_Z)
  const performance = relative + (participant.win ? WIN_BONUS : -WIN_BONUS)

  return {
    gameId: game.json.gameId,
    championId: participant.championId,
    win: participant.win,
    score: Math.round(performanceToScore(performance)),
    performance,
    breakdown: toPercentBreakdown(breakdowns[index]),
  }
}

export function formatHexMayhemScore(score: HexMayhemScore | null | undefined): string {
  return score ? String(score.score) : '--'
}

// ==================== 单局计算 ====================

interface TeamContext {
  meanDamage: number
  meanTank: number
  meanTakedowns: number
  meanDeaths: number
  meanTurretDamage: number
}

interface GameContext {
  meanKda: number
  meanCrowdControl: number
}

function buildTeamContext(team: SgpParticipantLol[]): TeamContext {
  return {
    meanDamage: average(team.map((item) => safeNumber(item.totalDamageDealtToChampions))),
    meanTank: average(team.map(getTankValue)),
    meanTakedowns: average(team.map(getTakedowns)),
    meanDeaths: average(team.map((item) => safeNumber(item.deaths))),
    meanTurretDamage: average(team.map((item) => safeNumber(item.damageDealtToTurrets))),
  }
}

function buildGameContext(participants: SgpParticipantLol[]): GameContext {
  return {
    meanKda: average(participants.map(getKda)),
    meanCrowdControl: average(participants.map((item) => safeNumber(item.timeCCingOthers))),
  }
}

/** 各分项 0-1，0.5 = 与参照组人均持平。 */
function calculateBreakdown(
  participant: SgpParticipantLol,
  team: TeamContext,
  game: GameContext,
): HexMayhemBreakdown {
  const damage = ratioScore(safeNumber(participant.totalDamageDealtToChampions), team.meanDamage)
  const tank = ratioScore(getTankValue(participant), team.meanTank)

  const healShield =
    safeNumber(participant.totalHealsOnTeammates) + safeNumber(participant.totalDamageShieldedOnTeammates)
  const healShieldScore = ratioScore(healShield, team.meanDamage * HEAL_SHIELD_PARITY_RATIO)
  const crowdControlScore = ratioScore(safeNumber(participant.timeCCingOthers), game.meanCrowdControl)
  const utility =
    healShieldScore * UTILITY_HEAL_SHIELD_WEIGHT + crowdControlScore * (1 - UTILITY_HEAL_SHIELD_WEIGHT)

  const channels = [damage, tank, utility].sort((a, b) => b - a)
  const contribution = channels.reduce(
    (total, value, index) => total + value * CONTRIBUTION_CHANNEL_WEIGHTS[index],
    0,
  )

  return {
    damage,
    tank,
    utility,
    contribution,
    participation: ratioScore(getTakedowns(participant), team.meanTakedowns),
    // 分子分母各 +1 做平滑，避免 0 死亡时比值发散、低死亡数对局里差 1 次死亡就天差地别。
    survival: ratioScore(team.meanDeaths + 1, safeNumber(participant.deaths) + 1),
    kda: ratioScore(getKda(participant), game.meanKda),
    push: ratioScore(safeNumber(participant.damageDealtToTurrets), team.meanTurretDamage),
  }
}

function calculateComposite(breakdown: HexMayhemBreakdown): number {
  return (
    breakdown.contribution * COMPOSITE_WEIGHTS.contribution +
    breakdown.participation * COMPOSITE_WEIGHTS.participation +
    breakdown.survival * COMPOSITE_WEIGHTS.survival +
    breakdown.kda * COMPOSITE_WEIGHTS.kda +
    breakdown.push * COMPOSITE_WEIGHTS.push
  )
}

/**
 * 承伤价值：承受 + 自我减免的伤害，再按死亡次数的平方根折算。
 * 不折算的话，频繁送死的人会因为「吃了很多伤害」被误判成优秀前排。
 */
function getTankValue(participant: SgpParticipantLol): number {
  const absorbed = safeNumber(participant.totalDamageTaken) + safeNumber(participant.damageSelfMitigated)
  return absorbed / Math.sqrt(safeNumber(participant.deaths) + 1)
}

function getTakedowns(participant: SgpParticipantLol): number {
  return safeNumber(participant.kills) + safeNumber(participant.assists)
}

function getKda(participant: SgpParticipantLol): number {
  return getTakedowns(participant) / Math.max(safeNumber(participant.deaths), 1)
}

/**
 * 把「本人 / 参照值」的比值映射到 0-1：比值 1 → 0.5，对数对称（2 倍与 1/2 倍离中心等距），
 * 两端平滑饱和，单项再离谱也不会无限拉分。参照值为 0（全队该项都是 0）时视为无信息，返回 0.5。
 */
function ratioScore(value: number, reference: number): number {
  if (!(reference > 0)) return 0.5
  if (!(value > 0)) return 0

  const powered = Math.pow(value / reference, RATIO_CURVE_EXPONENT)
  return powered / (1 + powered)
}

// ==================== 汇总与映射 ====================

function performanceToScore(performance: number): number {
  const halfRange = (HEX_MAYHEM_MAX_SCORE - HEX_MAYHEM_MIN_SCORE) / 2
  return clamp(
    HEX_MAYHEM_AVERAGE_SCORE + halfRange * Math.tanh(performance / SCORE_Z_SCALE),
    HEX_MAYHEM_MIN_SCORE,
    HEX_MAYHEM_MAX_SCORE,
  )
}

function toPercentBreakdown(breakdown: HexMayhemBreakdown): HexMayhemBreakdown {
  return mapBreakdown((key) => breakdown[key] * 100)
}

function averageBreakdown(games: HexMayhemGameScore[], weights: number[]): HexMayhemBreakdown {
  return mapBreakdown((key) => weightedAverage(games.map((game) => game.breakdown[key]), weights))
}

function mapBreakdown(mapper: (key: keyof HexMayhemBreakdown) => number): HexMayhemBreakdown {
  return {
    damage: mapper('damage'),
    tank: mapper('tank'),
    utility: mapper('utility'),
    contribution: mapper('contribution'),
    participation: mapper('participation'),
    survival: mapper('survival'),
    kda: mapper('kda'),
    push: mapper('push'),
  }
}

function weightedAverage(values: number[], weights: number[]): number {
  const totalWeight = weights.reduce((total, weight) => total + weight, 0)
  if (values.length === 0 || totalWeight <= 0) return 0
  return values.reduce((total, value, index) => total + value * (weights[index] ?? 0), 0) / totalWeight
}

function average(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((total, value) => total + value, 0) / values.length
}

function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0
  const mean = average(values)
  return Math.sqrt(average(values.map((value) => Math.pow(value - mean, 2))))
}

function safeNumber(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

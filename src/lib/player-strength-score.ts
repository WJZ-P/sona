import type { SgpGameSummaryLol, SgpParticipantLol } from '@/types/sgp'
import { translate } from '@/i18n'

export type SonaStrengthRole =
  | 'TOP'
  | 'JUNGLE'
  | 'MIDDLE'
  | 'BOTTOM'
  | 'UTILITY'
  | 'ARAM'
  | 'SPECIAL'
  | 'UNKNOWN'

export type SonaStrengthGrade =
  | 'legendary'
  | 'carry'
  | 'strong'
  | 'reliable'
  | 'balanced'
  | 'unstable'
  | 'risky'
  | 'critical'

export interface SonaScoreBreakdown {
  combat: number
  win: number
  damage: number
  economy: number
  objectives: number
  vision: number
  durability: number
  farming: number
}

export interface SonaGameStrengthScore {
  gameId: number
  championId: number
  role: SonaStrengthRole
  win: boolean
  placement: number
  /** WeGame 风格展示分，约 3.0 - 19.9。 */
  score: number
  breakdown: SonaScoreBreakdown
  metrics: {
    kills: number
    deaths: number
    assists: number
    kda: number
    killParticipation: number
    damageShare: number
    goldShare: number
    csPerMinute: number
    visionPerMinute: number
  }
}

export interface SonaPlayerStrengthScore {
  puuid: string
  /** WeGame 风格综合展示分，约 3.0 - 19.9。 */
  score: number
  /** 未经过样本置信度、稳定性和趋势修正的原始展示分。 */
  rawScore: number
  confidence: number
  validGames: number
  winRate: number
  averageKda: number
  averageKillParticipation: number
  averageDamageShare: number
  consistencyScore: number
  trendScore: number
  grade: SonaStrengthGrade
  gradeLabel: string
  verdict: string
  breakdown: SonaScoreBreakdown
  games: SonaGameStrengthScore[]
}

export interface SonaTeamStrengthScore {
  score: number
  averageScore: number
  balancePenalty: number
  confidence: number
  grade: SonaStrengthGrade
  gradeLabel: string
  players: SonaPlayerStrengthScore[]
}

export interface SonaStrengthScoreOptions {
  /** 最近战绩权重半衰期。SGP 通常按新到旧返回，越靠前权重越高。 */
  recencyHalfLife: number
  /** 低于该样本数时仍计算，但会明显向中性分收缩。 */
  minConfidenceGames: number
  /** 达到该样本数后视为满置信度。 */
  fullConfidenceGames: number
  /** 样本足够时削弱极端局，避免一两场超神/爆炸扭曲评分。 */
  trimOutliers: boolean
  /** 早期投降局数据不完整，默认跳过。 */
  skipEarlySurrender: boolean
  /** 有挂机队友的对局会明显污染表现数据，默认跳过。 */
  skipAfkTeammate: boolean
}

type BreakdownKey = keyof SonaScoreBreakdown
type ScoreWeights = Record<BreakdownKey, number>

const INTERNAL_MIN_SCORE = 0
const INTERNAL_MAX_SCORE = 100
const INTERNAL_NEUTRAL_SCORE = 50
const DISPLAY_MIN_SCORE = 3.0
const DISPLAY_MAX_SCORE = 19.9
const DISPLAY_NEUTRAL_SCORE = toDisplayScore(INTERNAL_NEUTRAL_SCORE)

const DEFAULT_OPTIONS: SonaStrengthScoreOptions = {
  recencyHalfLife: 18,
  minConfidenceGames: 3,
  fullConfidenceGames: 16,
  trimOutliers: true,
  skipEarlySurrender: true,
  skipAfkTeammate: true,
}

const BASE_WEIGHTS: ScoreWeights = {
  combat: 0.26,
  win: 0.12,
  damage: 0.18,
  economy: 0.11,
  objectives: 0.1,
  vision: 0.08,
  durability: 0.09,
  farming: 0.06,
}

function getGradeLabel(grade: SonaStrengthGrade): string {
  return translate(`strength.grade.${grade}` as Parameters<typeof translate>[0])
}

export function calculateSonaPlayerStrengthScore(
  games: SgpGameSummaryLol[],
  puuid: string,
  options: Partial<SonaStrengthScoreOptions> = {},
): SonaPlayerStrengthScore | null {
  const resolvedOptions = { ...DEFAULT_OPTIONS, ...options }
  const gameScores = games
    .map((game) => calculateSonaGameStrengthScore(game, puuid, resolvedOptions))
    .filter((score): score is SonaGameStrengthScore => score !== null)

  if (gameScores.length === 0) {
    return null
  }

  const scoreSamples = resolvedOptions.trimOutliers
    ? winsorizeScores(gameScores.map((game) => game.score))
    : gameScores.map((game) => game.score)

  const recencyWeights = gameScores.map((_, index) => getRecencyWeight(index, resolvedOptions.recencyHalfLife))
  const rawScore = weightedAverage(scoreSamples, recencyWeights)
  const consistencyScore = calculateConsistencyScore(scoreSamples)
  const trendScore = calculateTrendScore(scoreSamples)
  const confidence = calculateSampleConfidence(gameScores.length, resolvedOptions)

  const consistencyAdjustment = clamp((consistencyScore - 50) * 0.012, -0.6, 0.6)
  const trendAdjustment = clamp((trendScore - 50) * 0.01, -0.5, 0.5)
  const score = clamp(
    DISPLAY_NEUTRAL_SCORE + (rawScore - DISPLAY_NEUTRAL_SCORE) * confidence + consistencyAdjustment + trendAdjustment,
    DISPLAY_MIN_SCORE,
    DISPLAY_MAX_SCORE,
  )
  const grade = getSonaStrengthGrade(score)

  return {
    puuid,
    score,
    rawScore,
    confidence,
    validGames: gameScores.length,
    winRate: weightedAverage(gameScores.map((game) => game.win ? 1 : 0), recencyWeights),
    averageKda: weightedAverage(gameScores.map((game) => game.metrics.kda), recencyWeights),
    averageKillParticipation: weightedAverage(
      gameScores.map((game) => game.metrics.killParticipation),
      recencyWeights,
    ),
    averageDamageShare: weightedAverage(gameScores.map((game) => game.metrics.damageShare), recencyWeights),
    consistencyScore,
    trendScore,
    grade,
    gradeLabel: getGradeLabel(grade),
    verdict: getSonaStrengthVerdict(score, confidence),
    breakdown: averageBreakdown(gameScores, recencyWeights),
    games: gameScores,
  }
}

export function calculateSonaGameStrengthScore(
  game: SgpGameSummaryLol,
  puuid: string,
  options: Partial<SonaStrengthScoreOptions> = {},
): SonaGameStrengthScore | null {
  const resolvedOptions = { ...DEFAULT_OPTIONS, ...options }
  const participant = game.json.participants.find((item) => item.puuid === puuid)

  if (!participant) {
    return null
  }

  if (shouldSkipSonaGameForParticipant(game, participant, resolvedOptions)) {
    return null
  }

  const teamParticipants = game.json.participants.filter((item) => item.teamId === participant.teamId)
  if (teamParticipants.length === 0) {
    return null
  }

  const role = inferStrengthRole(game, participant)
  const weights = normalizeWeights(BASE_WEIGHTS)
  const minutes = Math.max((participant.timePlayed || game.json.gameDuration || 1) / 60, 1)
  const teamKills = sum(teamParticipants, (item) => item.kills)
  const teamDamage = sum(teamParticipants, (item) => item.totalDamageDealtToChampions)
  const teamGold = sum(teamParticipants, (item) => item.goldEarned)
  const teamObjectiveDamage = sum(teamParticipants, (item) => item.damageDealtToObjectives)
  const teamDamageTaken = sum(teamParticipants, (item) => item.totalDamageTaken)

  const kills = safeNumber(participant.kills)
  const deaths = safeNumber(participant.deaths)
  const assists = safeNumber(participant.assists)
  const takedowns = kills + assists
  const kda = getChallengeNumber(participant, 'kda') || (kills + assists) / Math.max(deaths, 1)
  const killParticipation = clamp(
    getChallengeNumber(participant, 'killParticipation') || safeDivide(takedowns, teamKills),
    0,
    1,
  )
  const damageShare = clamp(
    getChallengeNumber(participant, 'teamDamagePercentage') ||
      safeDivide(participant.totalDamageDealtToChampions, teamDamage),
    0,
    1,
  )
  const goldShare = clamp(safeDivide(participant.goldEarned, teamGold), 0, 1)
  const damageTakenShare = clamp(
    getChallengeNumber(participant, 'damageTakenOnTeamPercentage') ||
      safeDivide(participant.totalDamageTaken, teamDamageTaken),
    0,
    1,
  )
  const csPerMinute = safeDivide(participant.totalMinionsKilled + participant.neutralMinionsKilled, minutes)
  const visionPerMinute = getChallengeNumber(participant, 'visionScorePerMinute') ||
    safeDivide(participant.visionScore, minutes)

  const breakdown: SonaScoreBreakdown = {
    combat: calculateCombatScore({ kda, killParticipation, deaths, minutes }),
    win: calculateWinScore(game, participant),
    damage: calculateDamageScore(role, participant, minutes, damageShare),
    economy: calculateEconomyScore(role, participant, minutes, damageShare, goldShare),
    objectives: calculateObjectiveScore(role, participant, minutes, teamObjectiveDamage),
    vision: calculateVisionScore(role, participant, minutes, visionPerMinute),
    durability: calculateDurabilityScore(role, participant, minutes, damageTakenShare),
    farming: calculateFarmingScore(role, csPerMinute),
  }

  return {
    gameId: game.json.gameId,
    championId: participant.championId,
    role,
    win: participant.win,
    placement: participant.placement || participant.subteamPlacement || 0,
    score: toDisplayScore(calculateWeightedBreakdownScore(breakdown, weights)),
    breakdown,
    metrics: {
      kills,
      deaths,
      assists,
      kda,
      killParticipation,
      damageShare,
      goldShare,
      csPerMinute,
      visionPerMinute,
    },
  }
}

export function shouldSkipSonaStrengthGame(
  game: SgpGameSummaryLol,
  puuid: string,
  options: Partial<SonaStrengthScoreOptions> = {},
): boolean {
  const participant = game.json.participants.find((item) => item.puuid === puuid)
  if (!participant) return true

  return shouldSkipSonaGameForParticipant(game, participant, { ...DEFAULT_OPTIONS, ...options })
}

export function calculateSonaTeamStrengthScore(
  players: Array<SonaPlayerStrengthScore | null | undefined>,
): SonaTeamStrengthScore | null {
  const validPlayers = players.filter((player): player is SonaPlayerStrengthScore => Boolean(player))
  if (validPlayers.length === 0) {
    return null
  }

  const averageScore = average(validPlayers.map((player) => player.score))
  const confidence = average(validPlayers.map((player) => player.confidence))
  const cv = coefficientOfVariation(validPlayers.map((player) => player.score))
  const balancePenalty = clamp(cv * 6, 0, 1.8)
  const score = clamp(averageScore - balancePenalty, DISPLAY_MIN_SCORE, DISPLAY_MAX_SCORE)
  const grade = getSonaStrengthGrade(score)

  return {
    score,
    averageScore,
    balancePenalty,
    confidence,
    grade,
    gradeLabel: getGradeLabel(grade),
    players: validPlayers,
  }
}

export function getSonaStrengthGrade(score: number): SonaStrengthGrade {
  if (score >= 16.5) return 'legendary'
  if (score >= 14.5) return 'carry'
  if (score >= 12.8) return 'strong'
  if (score >= 11.2) return 'reliable'
  if (score >= 9.8) return 'balanced'
  if (score >= 8.2) return 'unstable'
  if (score >= 6.5) return 'risky'
  return 'critical'
}

export function getSonaStrengthVerdict(score: number, confidence = 1): string {
  const prefix = confidence < 0.55 ? translate('strength.lowConfidence') : ''
  const grade = getGradeLabel(getSonaStrengthGrade(score))
  return `${prefix}${grade}`
}

export function formatSonaStrengthScoreLine(score: SonaPlayerStrengthScore): string {
  return translate('strength.line', {
    grade: score.gradeLabel,
    score: score.score.toFixed(1),
    winRate: formatPercent(score.winRate),
    kda: score.averageKda.toFixed(2),
  })
}

function inferStrengthRole(game: SgpGameSummaryLol, participant: SgpParticipantLol): SonaStrengthRole {
  const mode = game.json.gameMode
  if (mode === 'ARAM') return 'ARAM'
  if (mode === 'CHERRY' || mode === 'STRAWBERRY') return 'SPECIAL'

  const position = (participant.teamPosition || participant.individualPosition || participant.lane || '').toUpperCase()
  if (position === 'TOP') return 'TOP'
  if (position === 'JUNGLE') return 'JUNGLE'
  if (position === 'MIDDLE' || position === 'MID') return 'MIDDLE'
  if (position === 'BOTTOM' || position === 'BOT') return 'BOTTOM'
  if (position === 'UTILITY' || position === 'SUPPORT') return 'UTILITY'
  return 'UNKNOWN'
}

function calculateCombatScore(input: {
  kda: number
  killParticipation: number
  deaths: number
  minutes: number
}): number {
  const kdaScore = scoreRange(Math.log1p(input.kda), Math.log1p(1.1), Math.log1p(6.2))
  const participationScore = scoreRange(input.killParticipation, 0.32, 0.72)
  const deathSafetyScore = 1 - scoreRange(safeDivide(input.deaths, input.minutes), 0.18, 0.72)
  return toPercent(kdaScore * 0.38 + participationScore * 0.42 + deathSafetyScore * 0.2)
}

function calculateWinScore(game: SgpGameSummaryLol, participant: SgpParticipantLol): number {
  const mode = game.json.gameMode
  const placement = participant.placement || participant.subteamPlacement || 0

  if ((mode === 'CHERRY' || mode === 'STRAWBERRY') && placement > 0) {
    if (placement <= 1) return 100
    if (placement <= 2) return 86
    if (placement <= 4) return 64
    return 35
  }

  return participant.win ? 100 : 35
}

function calculateDamageScore(
  role: SonaStrengthRole,
  participant: SgpParticipantLol,
  minutes: number,
  damageShare: number,
): number {
  const excellentShare = role === 'UTILITY' ? 0.2 : role === 'ARAM' ? 0.26 : 0.29
  const shareScore = scoreRange(damageShare, role === 'UTILITY' ? 0.06 : 0.1, excellentShare)
  const damagePerMinute = getChallengeNumber(participant, 'damagePerMinute') ||
    safeDivide(participant.totalDamageDealtToChampions, minutes)
  const dpmTarget = getRoleTarget(role, {
    TOP: 650,
    JUNGLE: 560,
    MIDDLE: 730,
    BOTTOM: 760,
    UTILITY: 360,
    ARAM: 950,
    SPECIAL: 720,
    UNKNOWN: 620,
  })
  const dpmScore = scoreRange(damagePerMinute, dpmTarget * 0.42, dpmTarget)

  return toPercent(shareScore * 0.68 + dpmScore * 0.32)
}

function calculateEconomyScore(
  role: SonaStrengthRole,
  participant: SgpParticipantLol,
  minutes: number,
  damageShare: number,
  goldShare: number,
): number {
  const goldPerMinute = getChallengeNumber(participant, 'goldPerMinute') ||
    safeDivide(participant.goldEarned, minutes)
  const gpmTarget = getRoleTarget(role, {
    TOP: 420,
    JUNGLE: 390,
    MIDDLE: 430,
    BOTTOM: 455,
    UTILITY: 285,
    ARAM: 470,
    SPECIAL: 430,
    UNKNOWN: 395,
  })
  const gpmScore = scoreRange(goldPerMinute, gpmTarget * 0.58, gpmTarget)
  const efficiency = goldShare > 0 ? damageShare / goldShare : 0
  const efficiencyScore = scoreRange(efficiency, 0.55, role === 'UTILITY' ? 1.05 : 1.28)

  return toPercent(efficiencyScore * 0.56 + gpmScore * 0.44)
}

function calculateObjectiveScore(
  role: SonaStrengthRole,
  participant: SgpParticipantLol,
  minutes: number,
  teamObjectiveDamage: number,
): number {
  const objectiveShare = safeDivide(participant.damageDealtToObjectives, teamObjectiveDamage)
  const objectiveDamagePerMinute = safeDivide(participant.damageDealtToObjectives, minutes)
  const epicTakedowns =
    getChallengeNumber(participant, 'dragonTakedowns') +
    getChallengeNumber(participant, 'baronTakedowns')
  const turretTakedowns = getChallengeNumber(participant, 'turretTakedowns') || participant.turretTakedowns
  const objectiveTarget = role === 'JUNGLE' ? 360 : role === 'BOTTOM' ? 290 : 230

  const objectiveDamageScore = scoreRange(objectiveDamagePerMinute, 20, objectiveTarget)
  const objectiveShareScore = scoreRange(objectiveShare, 0.08, role === 'JUNGLE' ? 0.45 : 0.32)
  const takedownScore = scoreRange(epicTakedowns * 0.9 + turretTakedowns * 0.45, 0, 2.2)

  return toPercent(objectiveDamageScore * 0.38 + objectiveShareScore * 0.32 + takedownScore * 0.3)
}

function calculateVisionScore(
  role: SonaStrengthRole,
  participant: SgpParticipantLol,
  minutes: number,
  visionPerMinute: number,
): number {
  const target = getRoleTarget(role, {
    TOP: 0.75,
    JUNGLE: 0.95,
    MIDDLE: 0.75,
    BOTTOM: 0.65,
    UTILITY: 1.65,
    ARAM: 0.28,
    SPECIAL: 0.25,
    UNKNOWN: 0.75,
  })
  const visionScore = scoreRange(visionPerMinute, target * 0.28, target)
  const wardWorkPerMinute = safeDivide(
    participant.wardsPlaced +
      participant.wardsKilled +
      participant.detectorWardsPlaced * 1.5 +
      getChallengeNumber(participant, 'wardTakedowns') * 0.6 +
      getChallengeNumber(participant, 'wardsGuarded') * 0.4,
    minutes,
  )
  const wardWorkScore = scoreRange(wardWorkPerMinute, 0.05, role === 'UTILITY' ? 0.75 : 0.35)

  return toPercent(visionScore * 0.72 + wardWorkScore * 0.28)
}

function calculateDurabilityScore(
  role: SonaStrengthRole,
  participant: SgpParticipantLol,
  minutes: number,
  damageTakenShare: number,
): number {
  const deathsPerMinute = safeDivide(participant.deaths, minutes)
  const survivalScore = 1 - scoreRange(deathsPerMinute, 0.16, 0.7)
  const pressureTarget = role === 'TOP' || role === 'UTILITY' ? 0.32 : 0.24
  const pressureScore = scoreRange(damageTakenShare, 0.08, pressureTarget)
  const utilityPerMinute = safeDivide(
    participant.damageSelfMitigated +
      participant.totalHeal * 0.35 +
      participant.totalHealsOnTeammates * 0.8 +
      participant.totalDamageShieldedOnTeammates,
    minutes,
  )
  const utilityTarget = role === 'UTILITY' || role === 'TOP' ? 820 : 560
  const utilityScore = scoreRange(utilityPerMinute, utilityTarget * 0.18, utilityTarget)

  return toPercent(survivalScore * 0.46 + pressureScore * 0.32 + utilityScore * 0.22)
}

function calculateFarmingScore(role: SonaStrengthRole, csPerMinute: number): number {
  const target = getRoleTarget(role, {
    TOP: 7.2,
    JUNGLE: 5.8,
    MIDDLE: 7.4,
    BOTTOM: 7.8,
    UTILITY: 1.3,
    ARAM: 4.2,
    SPECIAL: 4.5,
    UNKNOWN: 6.2,
  })
  return toPercent(scoreRange(csPerMinute, target * 0.35, target))
}

function calculateWeightedBreakdownScore(breakdown: SonaScoreBreakdown, weights: ScoreWeights): number {
  return clamp(
    Object.entries(weights).reduce((total, [key, weight]) => {
      return total + breakdown[key as BreakdownKey] * weight
    }, 0),
    0,
    100,
  )
}

function averageBreakdown(games: SonaGameStrengthScore[], weights: number[]): SonaScoreBreakdown {
  const result = Object.keys(BASE_WEIGHTS).reduce((obj, key) => {
    obj[key as BreakdownKey] = weightedAverage(games.map((game) => game.breakdown[key as BreakdownKey]), weights)
    return obj
  }, {} as SonaScoreBreakdown)

  return result
}

function normalizeWeights(weights: ScoreWeights): ScoreWeights {
  const total = sum(Object.values(weights), (value) => value)
  if (total <= 0) return BASE_WEIGHTS

  return Object.entries(weights).reduce((obj, [key, value]) => {
    obj[key as BreakdownKey] = value / total
    return obj
  }, {} as ScoreWeights)
}

function getRoleTarget<T>(role: SonaStrengthRole, targets: Record<SonaStrengthRole, T>): T {
  return targets[role] ?? targets.UNKNOWN
}

function calculateSampleConfidence(validGames: number, options: SonaStrengthScoreOptions): number {
  const confidenceRange = Math.max(options.fullConfidenceGames - options.minConfidenceGames, 1)
  const normalized = clamp((validGames - options.minConfidenceGames) / confidenceRange, 0, 1)
  return 0.35 + normalized * 0.65
}

function calculateConsistencyScore(scores: number[]): number {
  if (scores.length <= 1) return INTERNAL_NEUTRAL_SCORE

  const deviation = standardDeviation(scores)
  return clamp(100 - deviation * 14, INTERNAL_MIN_SCORE, INTERNAL_MAX_SCORE)
}

function calculateTrendScore(scores: number[]): number {
  if (scores.length < 8) return INTERNAL_NEUTRAL_SCORE

  const recent = average(scores.slice(0, 5))
  const older = average(scores.slice(5))
  return clamp(INTERNAL_NEUTRAL_SCORE + (recent - older) * 6.5, INTERNAL_MIN_SCORE, INTERNAL_MAX_SCORE)
}

function winsorizeScores(scores: number[]): number[] {
  if (scores.length < 8) return scores

  const sorted = [...scores].sort((a, b) => a - b)
  const low = percentile(sorted, 0.1)
  const high = percentile(sorted, 0.9)
  return scores.map((score) => clamp(score, low, high))
}

function getRecencyWeight(index: number, halfLife: number): number {
  return Math.pow(0.5, index / Math.max(halfLife, 1))
}

function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0

  const index = p * (sortedValues.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  if (lower === upper) return sortedValues[lower]

  const fraction = index - lower
  return sortedValues[lower] + (sortedValues[upper] - sortedValues[lower]) * fraction
}

function coefficientOfVariation(values: number[]): number {
  const avg = average(values)
  if (avg <= 0) return 0
  return standardDeviation(values) / avg
}

function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0

  const avg = average(values)
  const variance = average(values.map((value) => Math.pow(value - avg, 2)))
  return Math.sqrt(variance)
}

function weightedAverage(values: number[], weights: number[]): number {
  const totalWeight = sum(weights, (value) => value)
  if (values.length === 0 || totalWeight <= 0) return 0

  return values.reduce((total, value, index) => total + value * (weights[index] ?? 1), 0) / totalWeight
}

function average(values: number[]): number {
  if (values.length === 0) return 0
  return sum(values, (value) => value) / values.length
}

function sum<T>(values: T[], mapper: (value: T) => number): number {
  return values.reduce((total, value) => total + safeNumber(mapper(value)), 0)
}

function getChallengeNumber(participant: SgpParticipantLol, key: string): number {
  const value = participant.challenges?.[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function getChallengeFlag(participant: SgpParticipantLol, key: string): boolean {
  const value = participant.challenges?.[key] as unknown
  return value === true || (typeof value === 'number' && value > 0)
}

function shouldSkipSonaGameForParticipant(
  game: SgpGameSummaryLol,
  participant: SgpParticipantLol,
  options: SonaStrengthScoreOptions,
): boolean {
  if (options.skipEarlySurrender && (participant.gameEndedInEarlySurrender || participant.teamEarlySurrendered)) {
    return true
  }

  return options.skipAfkTeammate && hasAfkTeammate(game, participant)
}

function hasAfkTeammate(game: SgpGameSummaryLol, participant: SgpParticipantLol): boolean {
  if (getChallengeFlag(participant, 'hadAfkTeammate')) {
    return true
  }

  return game.json.participants.some((item) => {
    return item.teamId === participant.teamId
      && item.puuid !== participant.puuid
      && getChallengeFlag(item, 'hadAfkTeammate')
  })
}

function scoreRange(value: number, zeroAt: number, fullAt: number): number {
  if (fullAt === zeroAt) return value >= fullAt ? 1 : 0
  return clamp((value - zeroAt) / (fullAt - zeroAt), 0, 1)
}

function safeDivide(numerator: number, denominator: number): number {
  return denominator > 0 ? numerator / denominator : 0
}

function safeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0
}

function toPercent(value: number): number {
  return clamp(value * 100, INTERNAL_MIN_SCORE, INTERNAL_MAX_SCORE)
}

function toDisplayScore(internalScore: number): number {
  const normalized = clamp(internalScore, INTERNAL_MIN_SCORE, INTERNAL_MAX_SCORE) / INTERNAL_MAX_SCORE
  return DISPLAY_MIN_SCORE + normalized * (DISPLAY_MAX_SCORE - DISPLAY_MIN_SCORE)
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

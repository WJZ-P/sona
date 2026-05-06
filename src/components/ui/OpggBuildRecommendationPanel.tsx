import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { SonaSelect } from '@/components/ui/SonaSelect'
import tier1Icon from '@/../assets/tier/t1.svg'
import tier2Icon from '@/../assets/tier/t2.svg'
import tier3Icon from '@/../assets/tier/t3.svg'
import tier4Icon from '@/../assets/tier/t4.svg'
import tier5Icon from '@/../assets/tier/t5.svg'
import {
  getAugmentInfo,
  getChampionById,
  getItemInfo,
  getPerkIcon,
  getPerkInfo,
  getPerkName,
  getPerkStyleIcon,
  getPerkStyleName,
  getQueueName,
  getSpellIcon,
  getSpellInfo,
  getSpellName,
} from '@/lib/assets'
import { lcu } from '@/lib/lcu'
import { type OpggItemBuild, type OpggMode, type OpggPosition, type OpggRuneBuild, type OpggTier } from '@/lib/opgg-api'
import '@/styles/OpggBuildRecommendationPanel.css'

const MAX_RECOMMENDATION_ROWS = 3
const RANKED_MINI_CREST_BASE = 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests'
const OPGG_TIER_BASE_OPTIONS: Array<{ value: OpggTier; label: string }> = [
  { value: 'all', label: '全部段位' },
  { value: 'challenger', label: '最强王者' },
  { value: 'grandmaster', label: '傲世宗师' },
  { value: 'master_plus', label: '超凡大师+' },
  { value: 'master', label: '超凡大师' },
  { value: 'diamond_plus', label: '璀璨钻石+' },
  { value: 'diamond', label: '璀璨钻石' },
  { value: 'emerald_plus', label: '流光翡翠+' },
  { value: 'emerald', label: '流光翡翠' },
  { value: 'platinum_plus', label: '华贵铂金+' },
  { value: 'platinum', label: '华贵铂金' },
  { value: 'gold_plus', label: '荣耀黄金+' },
  { value: 'gold', label: '荣耀黄金' },
  { value: 'silver', label: '不屈白银' },
  { value: 'bronze', label: '英勇黄铜' },
  { value: 'iron', label: '坚韧黑铁' },
]
const OPGG_TIER_OPTIONS: Array<{ value: OpggTier; label: string; icon?: string }> = OPGG_TIER_BASE_OPTIONS.map((option) => ({
  ...option,
  icon: getOpggTierIcon(option.value),
}))

function getOpggTierIcon(tier: OpggTier): string {
  if (tier === 'all' || tier === 'ibsg') return ''
  return `${RANKED_MINI_CREST_BASE}/${tier.replace('_plus', '')}.svg`
}

export interface RecommendationContext {
  championId: number
  queueId: number
  gameVersion: string
  gameMode: string
  position: OpggPosition
}

export interface BuildRecommendation {
  mode: OpggMode
  modeLabel: string
  version: string
  position: OpggPosition
  summary: string[]
  summonerSpells: OpggItemBuild[]
  starterItems: OpggItemBuild[]
  boots: OpggItemBuild[]
  coreItems: OpggItemBuild[]
  prismItems: OpggItemBuild[]
  lastItems: OpggItemBuild[]
  runePages: OpggRuneBuild[]
  augments: Array<{ rarity: number; items: Array<{ id: number; pickRate: number; averagePlace: number; firstPlace: number }> }>
  meta?: RecommendationMeta
  warning?: string
}

export interface RecommendationMeta {
  rank: number | null
  previousRank: number | null
  rankDelta: number | null
  totalRank: number | null
  matchCount: number | null
  version: string
  updatedAt: string
}

export interface OpggBuildRecommendationPanelProps {
  context: RecommendationContext
  recommendation: BuildRecommendation | null
  loadError: string
  isLoading: boolean
  selectedTier: OpggTier
  onTierChange: (tier: OpggTier) => void
  onClose: () => void
}

export function OpggBuildRecommendationPanel({
  context,
  recommendation,
  loadError,
  isLoading,
  selectedTier,
  onTierChange,
  onClose,
}: OpggBuildRecommendationPanelProps) {
  const champion = getChampionById(context.championId)
  const championName = champion ? `${champion.title} ${champion.name}` : '未识别英雄'
  const queueText = recommendation?.modeLabel || (context.queueId > 0 ? getQueueName(context.queueId) : '未知队列')
  const positionText = recommendation?.position ?? context.position
  const modeTags = [queueText, formatPositionText(positionText)].filter(Boolean).join(' · ')
  const showAugments = isKiwiMode(context) || recommendation?.mode === 'arena'

  return (
    <div className="sobp">
      <div className="sobp-ambient" />

      <header className="sobp-titlebar">
        <div className="sobp-title-main">
          <div className="sobp-champion-ring">
            <img src={`/lol-game-data/assets/v1/champion-icons/${context.championId}.png`} alt="" />
          </div>
          <div className="sobp-title-text">
            <div className="sobp-title">
              <span className="sobp-title-mark">❖</span>
              <span className="sobp-title-name">{championName}</span>
            </div>
            {modeTags && <div className="sobp-mode-tag">{modeTags}</div>}
          </div>
        </div>
        <div className="sobp-title-actions">
          <TierFilterSelect value={selectedTier} onChange={onTierChange} />
          <TrendMeta meta={recommendation?.meta} />
          <SummaryCards values={recommendation?.summary ?? []} />
          <button type="button" className="sobp-close" onClick={onClose} aria-label="关闭配装推荐">
            ×
          </button>
        </div>
      </header>

      <main className="sobp-body">
        <div className="sobp-grid">
          <ItemSection title="核心装备" builds={recommendation?.coreItems} itemLimit={3} />
          <RuneSection title="符文搭配" runes={recommendation?.runePages} championName={championName} />
          <SpellSection title="召唤师技能" builds={recommendation?.summonerSpells} limit={MAX_RECOMMENDATION_ROWS} />
        </div>

        {showAugments && <AugmentSection title="海克斯推荐" groups={recommendation?.augments} />}

        {isLoading && <PanelMessage>正在后台加载 OP.GG 推荐数据，完成后会自动刷新。</PanelMessage>}
        {loadError && <PanelMessage warning>OP.GG 请求失败：{loadError}</PanelMessage>}
        {recommendation?.warning && <PanelMessage warning>{recommendation.warning}</PanelMessage>}
        {!isLoading && !loadError && !recommendation && <PanelMessage>暂无可用 OP.GG 推荐数据。</PanelMessage>}
      </main>
    </div>
  )
}

function TierFilterSelect({ value, onChange }: { value: OpggTier; onChange: (tier: OpggTier) => void }) {
  return (
    <div className="sobp-tier-filter">
      <SonaSelect
        value={value}
        onChange={(nextValue) => onChange(nextValue as OpggTier)}
        options={OPGG_TIER_OPTIONS}
      />
    </div>
  )
}

function isKiwiMode(context: RecommendationContext): boolean {
  return context.gameMode.toLowerCase() === 'kiwi'
}

function formatPositionText(position: OpggPosition): string {
  switch (position) {
    case 'top':
      return '上路'
    case 'jungle':
      return '打野'
    case 'mid':
      return '中路'
    case 'adc':
      return '下路'
    case 'support':
      return '辅助'
    default:
      return ''
  }
}

function SummaryCards({ values }: { values: string[] }) {
  if (values.length === 0) return null

  return (
    <div className="sobp-summary">
      {values.map((value) => {
        const metric = splitSummaryMetric(value)
        return (
          <div className={`sobp-summary-card sobp-summary-card--${metric.kind}`} key={value}>
            {metric.kind === 'tier'
              ? <TierBadge value={metric.metric} />
              : (
                <>
                  {metric.label && <span className="sobp-summary-label">{metric.label}</span>}
                  <span className="sobp-summary-value">{metric.metric}</span>
                </>
              )}
          </div>
        )
      })}
    </div>
  )
}

function TrendMeta({ meta }: { meta?: RecommendationMeta }) {
  if (!meta) return null

  const trend = getRankTrend(meta.rankDelta)
  const rankText = meta.rank && meta.totalRank ? `${meta.rank}/${meta.totalRank}` : meta.rank ? `#${meta.rank}` : ''

  return (
    <div className="sobp-meta">
      <div className={`sobp-meta-trend sobp-meta-trend--${trend.kind}`}>
        <span className="sobp-meta-label">趋势：</span>
        <span className="sobp-meta-value">{trend.text}</span>
        {rankText && <span className="sobp-meta-rank">{rankText}</span>}
      </div>
    </div>
  )
}

function getRankTrend(delta: number | null): { kind: 'up' | 'down' | 'flat' | 'unknown'; text: string } {
  if (delta == null) return { kind: 'unknown', text: '暂无' }
  if (delta > 0) return { kind: 'up', text: `↑ ${delta}` }
  if (delta < 0) return { kind: 'down', text: `↓ ${Math.abs(delta)}` }
  return { kind: 'flat', text: '持平' }
}

function TierBadge({ value }: { value: string }) {
  const tier = Number.parseInt(value.replace(/\D/g, ''), 10)
  const icon = getTierIcon(tier)
  if (!icon) return <span className="sobp-summary-value">{value}</span>

  return <img className="sobp-tier-icon" src={icon} alt={value} title={value} />
}

function getTierIcon(tier: number): string {
  switch (tier) {
    case 1:
      return tier1Icon
    case 2:
      return tier2Icon
    case 3:
      return tier3Icon
    case 4:
      return tier4Icon
    case 5:
      return tier5Icon
    default:
      return ''
  }
}

type SummaryKind = 'win-high' | 'win-low' | 'win-even' | 'pick' | 'tier' | 'rank' | 'default'

function splitSummaryMetric(value: string): { label: string; metric: string; kind: SummaryKind } {
  const parts = value.trim().split(/\s+/)
  if (parts.length < 2) return { label: '', metric: value, kind: getSummaryKind(value) }

  const label = parts.slice(0, -1).join(' ')
  const metric = parts[parts.length - 1]
  if (label.toLowerCase() === 'tier') {
    return { label: '', metric: normalizeTierText(metric), kind: 'tier' }
  }

  return {
    label,
    metric,
    kind: getSummaryKind(value),
  }
}

function normalizeTierText(value: string): string {
  const tier = value.trim().replace(/^tier\s*/i, '')
  return tier ? `T${tier}` : 'T-'
}

function getSummaryKind(value: string): SummaryKind {
  const text = value.toLowerCase()
  if (value.includes('胜率')) {
    const winRate = Number.parseFloat(value.replace(/[^\d.]/g, ''))
    return Number.isFinite(winRate) && winRate > 50 ? 'win-high' : 'win-low'
  }
  if (value.includes('登场')) return 'pick'
  if (text.includes('tier')) return 'tier'
  if (value.includes('排名')) return 'rank'
  return 'default'
}

function Section({ title, children, empty = false, emptyText = '暂无数据' }: { title: string; children: ReactNode; empty?: boolean; emptyText?: string }) {
  return (
    <section className="sobp-section">
      <h3 className="sobp-section-title">
        <span />
        {title}
      </h3>
      <div className="sobp-section-card">
        {empty ? <div className="sobp-empty">{emptyText}</div> : children}
      </div>
    </section>
  )
}

function ItemSection({ title, builds, itemLimit }: { title: string; builds?: OpggItemBuild[]; itemLimit: number }) {
  const visibleBuilds = builds?.slice(0, MAX_RECOMMENDATION_ROWS) ?? []
  const maxRate = getMaxPickRate(visibleBuilds, 0.15)

  return (
    <Section title={title} empty={visibleBuilds.length === 0}>
      {visibleBuilds.map((build, index) => (
        <div className="sobp-row" key={`${index}-${build.ids.join('-')}`}>
          <div className="sobp-row-main">
            <RankBadge rank={index + 1} />
            <div className="sobp-icons sobp-icons--items">
              {build.ids.slice(0, itemLimit).map((id, itemIndex, ids) => {
                const item = getItemInfo(id)
                return (
                  <span className="sobp-icon-step" key={`${id}-${itemIndex}`}>
                    <BuildIcon src={item.iconPath} title={item.name} description={item.description} price={item.price} size={32} />
                    {itemIndex < ids.length - 1 && <span className="sobp-arrow">▶</span>}
                  </span>
                )
              })}
            </div>
          </div>
          <StatBar value={build.pick_rate} maxRate={maxRate} />
        </div>
      ))}
    </Section>
  )
}

function SpellSection({ title, builds, limit }: { title: string; builds?: OpggItemBuild[]; limit: number }) {
  const visibleBuilds = builds?.slice(0, limit) ?? []
  const maxRate = getMaxPickRate(visibleBuilds, 1)

  return (
    <Section title={title} empty={visibleBuilds.length === 0}>
      {visibleBuilds.map((build, index) => (
        <div className="sobp-row" key={`${index}-${build.ids.join('-')}`}>
          <div className="sobp-row-main">
            <RankBadge rank={index + 1} />
            <div className="sobp-icons">
              {[...build.ids].reverse().map((id) => {
                const spell = getSpellInfo(id)
                return <BuildIcon key={id} src={spell.iconPath || getSpellIcon(id)} title={spell.name || getSpellName(id)} description={spell.description} size={32} />
              })}
            </div>
          </div>
          <StatBar value={build.pick_rate} maxRate={maxRate} />
        </div>
      ))}
    </Section>
  )
}

function RuneSection({ title, runes, championName }: { title: string; runes?: OpggRuneBuild[]; championName: string }) {
  const visibleRunes = runes?.slice(0, MAX_RECOMMENDATION_ROWS) ?? []
  const maxRate = getMaxRunePickRate(visibleRunes, 0.15)
  const [applyingKey, setApplyingKey] = useState('')
  const [appliedKey, setAppliedKey] = useState('')
  const [applyErrorKey, setApplyErrorKey] = useState('')

  const applyRune = async (rune: OpggRuneBuild, index: number) => {
    const key = `${index}-${rune.id}`
    setApplyingKey(key)
    setAppliedKey('')
    setApplyErrorKey('')

    try {
      await lcu.applyRunePage({
        name: championName,
        primaryStyleId: rune.primary_page_id,
        subStyleId: rune.secondary_page_id,
        selectedPerkIds: [
          ...rune.primary_rune_ids,
          ...rune.secondary_rune_ids,
          ...rune.stat_mod_ids,
        ],
      })
      setAppliedKey(key)
    } catch {
      setApplyErrorKey(key)
    } finally {
      setApplyingKey('')
    }
  }

  return (
    <Section title={title} empty={visibleRunes.length === 0} emptyText="不支持自定义符文">
      {visibleRunes.map((rune, index) => {
        const applyKey = `${index}-${rune.id}`
        const keystoneId = rune.primary_rune_ids[0] ?? 0
        const keystone = getPerkInfo(keystoneId)
        return (
          <div className="sobp-row" key={`${index}-${rune.primary_rune_ids.join('-')}-${rune.secondary_rune_ids.join('-')}`}>
            <div className="sobp-row-main">
              <RankBadge rank={index + 1} />
              <div className="sobp-runes">
                <div className="sobp-rune-group">
                  <BuildIcon src={keystone.iconPath || getPerkIcon(keystoneId)} title={keystone.name || getPerkName(keystoneId)} description={keystone.description} size={32} border="#c8aa6e" round />
                  <div className="sobp-small-runes">
                    {rune.primary_rune_ids.slice(1, 4).map((id) => {
                      const perk = getPerkInfo(id)
                      return <BuildIcon key={id} src={perk.iconPath || getPerkIcon(id)} title={perk.name || getPerkName(id)} description={perk.description} size={24} round />
                    })}
                  </div>
                </div>
                <span className="sobp-rune-divider" />
                <div className="sobp-rune-group">
                  <BuildIcon src={getPerkStyleIcon(rune.secondary_page_id)} title={getPerkStyleName(rune.secondary_page_id)} size={24} round />
                  {rune.secondary_rune_ids.slice(0, 2).map((id) => {
                    const perk = getPerkInfo(id)
                    return <BuildIcon key={id} src={perk.iconPath || getPerkIcon(id)} title={perk.name || getPerkName(id)} description={perk.description} size={24} round />
                  })}
                </div>
              </div>
            </div>
            <div className="sobp-rune-actions">
              <StatBar value={rune.pick_rate} maxRate={maxRate} />
              <button
                type="button"
                className={`sobp-apply-rune${appliedKey === applyKey ? ' sobp-apply-rune--done' : ''}${applyErrorKey === applyKey ? ' sobp-apply-rune--error' : ''}`}
                disabled={applyingKey === applyKey}
                onClick={(event) => {
                  event.stopPropagation()
                  void applyRune(rune, index)
                }}
              >
                {applyingKey === applyKey ? '应用中' : appliedKey === applyKey ? '已应用' : applyErrorKey === applyKey ? '失败' : '应用'}
              </button>
            </div>
          </div>
        )
      })}
    </Section>
  )
}

function AugmentSection({ title, groups }: { title: string; groups?: BuildRecommendation['augments'] }) {
  const visibleGroups = groups ?? []

  return (
    <div className="sobp-augment-wrap">
      <Section title={title} empty={visibleGroups.length === 0}>
        {visibleGroups.map((group) => (
          <div className="sobp-augment-group" key={group.rarity}>
            <div className="sobp-augment-rarity">{getAugmentRarityLabel(group.rarity)}</div>
            <div className="sobp-augment-grid">
              {group.items.map((augment) => {
                const info = getAugmentInfo(augment.id)
                return (
                  <div className="sobp-augment" key={augment.id}>
                    <BuildIcon
                      src={info?.iconPath ?? ''}
                      title={info?.name ?? String(augment.id)}
                      description={info?.description ?? ''}
                      subtitle={getAugmentRarityLabel(group.rarity)}
                      size={28}
                      border={getAugmentBorder(info?.rarity)}
                    />
                    <div className="sobp-augment-info">
                      <div className="sobp-augment-name">{info?.name ?? String(augment.id)}</div>
                      <div className="sobp-augment-meta">
                        登场 {formatPercent(augment.pickRate)} · 均排 {formatPlace(augment.averagePlace)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </Section>
    </div>
  )
}

function RankBadge({ rank }: { rank: number }) {
  return <div className={`sobp-rank${rank === 1 ? ' sobp-rank--first' : ''}`}>#{rank}</div>
}

function StatBar({ value, maxRate }: { value?: number; maxRate: number }) {
  const safeValue = Number.isFinite(value) ? (value ?? 0) : 0
  const safeMax = maxRate > 0 ? maxRate : 1
  const width = Math.max(0, Math.min(100, (safeValue / safeMax) * 100))

  return (
    <div className="sobp-stat">
      <span>{formatPercent(value)}</span>
      <div className="sobp-stat-track">
        <div className="sobp-stat-fill" style={{ width: `${width.toFixed(1)}%` }} />
      </div>
    </div>
  )
}

function BuildIcon({
  src,
  title,
  description = '',
  subtitle = '',
  price = 0,
  size,
  border = '#3c2e16',
  round = false,
}: {
  src: string
  title: string
  description?: string
  subtitle?: string
  price?: number
  size: number
  border?: string
  round?: boolean
}) {
  const style = {
    width: size,
    height: size,
    borderColor: border,
    borderRadius: round ? '50%' : 3,
  }

  if (!src) {
    return (
      <IconTooltip title={title} description={description} subtitle={subtitle} price={price} iconSrc={src} border={border}>
        <span className="sobp-icon sobp-icon--missing" style={style}>
          ?
        </span>
      </IconTooltip>
    )
  }

  return (
    <IconTooltip title={title} description={description} subtitle={subtitle} price={price} iconSrc={src} border={border}>
      <img className="sobp-icon" src={src} alt="" style={style} />
    </IconTooltip>
  )
}

interface TooltipPosition {
  left: number
  top: number
  arrowLeft: number
  placement: 'top' | 'bottom'
  ready: boolean
}

function IconTooltip({
  title,
  description,
  subtitle,
  price = 0,
  iconSrc,
  border,
  children,
}: {
  title: string
  description?: string
  subtitle?: string
  price?: number
  iconSrc: string
  border: string
  children: ReactNode
}) {
  const anchorRef = useRef<HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const closeTimerRef = useRef<number | null>(null)
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState<TooltipPosition>({ left: 0, top: 0, arrowLeft: 0, placement: 'top', ready: false })
  const parsedDescription = parseTooltipDescription(description)

  useLayoutEffect(() => {
    if (!mounted || !anchorRef.current || !tooltipRef.current) return

    const margin = 8
    const gap = 10
    const anchor = anchorRef.current.getBoundingClientRect()
    const tooltip = tooltipRef.current.getBoundingClientRect()
    const center = anchor.left + anchor.width / 2
    let left = center - tooltip.width / 2
    left = Math.max(margin, Math.min(left, window.innerWidth - tooltip.width - margin))

    let placement: TooltipPosition['placement'] = 'top'
    let top = anchor.top - tooltip.height - gap
    if (top < margin) {
      placement = 'bottom'
      top = anchor.bottom + gap
    }
    if (top + tooltip.height > window.innerHeight - margin) {
      top = Math.max(margin, window.innerHeight - tooltip.height - margin)
    }

    const arrowLeft = Math.max(14, Math.min(center - left, tooltip.width - 14))
    setPosition({ left, top, arrowLeft, placement, ready: true })

    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [mounted, title, description, subtitle, price])

  const showTooltip = () => {
    if (closeTimerRef.current != null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setMounted(true)
  }

  const hideTooltip = () => {
    setVisible(false)
    closeTimerRef.current = window.setTimeout(() => {
      setMounted(false)
      closeTimerRef.current = null
    }, 140)
  }

  return (
    <span
      ref={anchorRef}
      className="sobp-icon-tooltip-wrap"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {children}
      {mounted && createPortal(
        <div
          ref={tooltipRef}
          className={`sobp-official-tooltip sobp-official-tooltip--${position.placement}${position.ready && visible ? ' sobp-official-tooltip--ready' : ''}`}
          style={{
            left: position.left,
            top: position.top,
            ['--sobp-tooltip-arrow-left' as string]: `${position.arrowLeft}px`,
          }}
        >
          <div className="sobp-official-tooltip-head">
            <span className="sobp-official-tooltip-icon" style={{ borderColor: border }}>
              {iconSrc ? <img src={iconSrc} alt="" /> : '?'}
            </span>
            <div className="sobp-official-tooltip-titlebox">
              <div className="sobp-official-tooltip-title">{title}</div>
              {price > 0
                ? (
                  <div className="sobp-official-tooltip-price">
                    <span className="sobp-gold-icon" aria-hidden="true" />
                    <span>{price}</span>
                  </div>
                )
                : subtitle && <div className="sobp-official-tooltip-subtitle">{subtitle}</div>}
            </div>
          </div>
          {(parsedDescription.stats.length > 0 || parsedDescription.effectTitle || parsedDescription.effectBody) && (
            <div className="sobp-official-tooltip-desc">
              {parsedDescription.stats.length > 0 && (
                <div className="sobp-official-tooltip-stats">
                  {parsedDescription.stats.map((line) => <div key={line}>{line}</div>)}
                </div>
              )}
              {(parsedDescription.stats.length > 0 && (parsedDescription.effectTitle || parsedDescription.effectBody)) && (
                <div className="sobp-official-tooltip-separator" />
              )}
              {parsedDescription.effectTitle && <div className="sobp-official-tooltip-effect-title">{parsedDescription.effectTitle}</div>}
              {parsedDescription.effectBody && <div className="sobp-official-tooltip-effect-body">{parsedDescription.effectBody}</div>}
            </div>
          )}
        </div>,
        document.body,
      )}
    </span>
  )
}

function parseTooltipDescription(description = ''): { stats: string[]; effectTitle: string; effectBody: string } {
  const normalized = description.trim()
  if (!normalized) return { stats: [], effectTitle: '', effectBody: '' }

  const blocks = normalized
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)

  if (blocks.length >= 2) {
    const stats = blocks[0].split('\n').map((line) => line.trim()).filter(Boolean)
    const effectLines = blocks.slice(1).join('\n\n').split('\n').map((line) => line.trim()).filter(Boolean)
    return {
      stats,
      effectTitle: effectLines[0] ?? '',
      effectBody: effectLines.slice(1).join('\n'),
    }
  }

  const lines = normalized.split('\n').map((line) => line.trim()).filter(Boolean)
  if (lines.length >= 2 && lines.slice(0, -1).every(isStatLine)) {
    return { stats: lines, effectTitle: '', effectBody: '' }
  }

  return {
    stats: [],
    effectTitle: lines.length > 1 ? lines[0] : '',
    effectBody: lines.length > 1 ? lines.slice(1).join('\n') : lines[0] ?? '',
  }
}

function isStatLine(line: string): boolean {
  return /^[+\d]/.test(line)
}

function PanelMessage({ children, warning = false }: { children: ReactNode; warning?: boolean }) {
  return <div className={`sobp-message${warning ? ' sobp-message--warning' : ''}`}>{children}</div>
}

function getMaxPickRate(builds: OpggItemBuild[], fallback: number): number {
  return Math.max(fallback, ...builds.map((build) => Number.isFinite(build.pick_rate) ? build.pick_rate : 0))
}

function getMaxRunePickRate(runes: OpggRuneBuild[], fallback: number): number {
  return Math.max(fallback, ...runes.map((rune) => Number.isFinite(rune.pick_rate) ? rune.pick_rate : 0))
}

function formatPercent(value: number | undefined): string {
  if (!Number.isFinite(value)) return '-'
  return `${((value ?? 0) * 100).toFixed(1)}%`
}

function formatPlace(value: number | undefined): string {
  if (!Number.isFinite(value)) return '-'
  return `${(value ?? 0).toFixed(2)}名`
}

function getAugmentRarityLabel(rarity: number): string {
  if (rarity === 1) return '银色'
  if (rarity === 4) return '金色'
  if (rarity === 8) return '棱彩'
  return `稀有度 ${rarity}`
}

function getAugmentBorder(rarity: string | undefined): string {
  if (rarity === 'kPrismatic') return '#b788ff'
  if (rarity === 'kGold') return '#c8aa6e'
  if (rarity === 'kSilver') return '#a09b8c'
  return '#3c2e16'
}

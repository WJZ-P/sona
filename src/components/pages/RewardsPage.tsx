import { useCallback, useEffect, useMemo, useState } from 'react'
import { SonaButton } from '@/components/ui/SonaButton'
import { lcu, type RewardsGrant } from '@/lib/lcu'
import { useI18n } from '@/i18n'
import { logger } from '@/index'
import '@/styles/SettingsPage.css'
import '@/styles/RewardsPage.css'

const TARGET_STATUS = 'PENDING_SELECTION'

/** 取奖励组的最大可选数量，缺省为 1 */
function maxSelections(grant: RewardsGrant): number {
  return grant.rewardGroup.selectionStrategyConfig?.maxSelectionsAllowed ?? 1
}

/** 取奖励组的最少需选数量，缺省为 1 */
function minSelections(grant: RewardsGrant): number {
  return grant.rewardGroup.selectionStrategyConfig?.minSelectionsAllowed ?? 1
}

export function RewardsPage() {
  const { t } = useI18n()

  const [grants, setGrants] = useState<RewardsGrant[]>([])
  const [loading, setLoading] = useState(false)
  // 正在提交的是"领取所选"还是"一键领取"，null 表示空闲
  const [claiming, setClaiming] = useState<'selected' | 'all' | null>(null)
  const busy = claiming !== null
  const [status, setStatus] = useState('')
  // grantId -> 已选中的 rewardId 列表
  const [selections, setSelections] = useState<Record<string, string[]>>({})

  const load = useCallback(async () => {
    setLoading(true)
    setStatus('')
    try {
      const data = await lcu.getRewardGrants(TARGET_STATUS)
      const pending = (data ?? []).filter((g) => g.info.status === TARGET_STATUS)
      setGrants(pending)
      // 清理已不存在的 grant 的选择
      setSelections((prev) => {
        const next: Record<string, string[]> = {}
        for (const g of pending) {
          if (prev[g.info.id]) next[g.info.id] = prev[g.info.id]
        }
        return next
      })
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      logger.warn('[RewardsPage] 加载奖励失败: %s', reason)
      setStatus(t('rewards.loadFailed', { error: reason }))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    load()
  }, [load])

  // 监听 WS 事件，实时刷新待领取列表
  useEffect(() => {
    const unsub = lcu.observe('/lol-rewards/v1/grants', (event) => {
      const data = event.data as RewardsGrant[] | null
      if (!Array.isArray(data)) return
      setGrants(data.filter((g) => g?.info?.status === TARGET_STATUS))
    })
    return unsub
  }, [])

  const toggle = useCallback((grant: RewardsGrant, rewardId: string) => {
    const max = maxSelections(grant)
    setSelections((prev) => {
      const cur = prev[grant.info.id] ?? []
      let next: string[]
      if (cur.includes(rewardId)) {
        next = cur.filter((id) => id !== rewardId)
      } else if (max <= 1) {
        next = [rewardId]
      } else if (cur.length < max) {
        next = [...cur, rewardId]
      } else {
        // 已达上限：挤掉最早选中的一个，体验更顺手
        next = [...cur.slice(1), rewardId]
      }
      return { ...prev, [grant.info.id]: next }
    })
  }, [])

  // 扁平化：所有未领取奖励依次平铺
  const items = useMemo(
    () => grants.flatMap((grant) => grant.rewardGroup.rewards.map((reward) => ({ grant, reward }))),
    [grants],
  )

  const totalSelected = useMemo(
    () => Object.values(selections).reduce((sum, ids) => sum + ids.length, 0),
    [selections],
  )

  // 满足各自 min/max 约束、可以提交的 grant
  const claimableGrants = useMemo(
    () =>
      grants.filter((grant) => {
        const count = (selections[grant.info.id] ?? []).length
        return count > 0 && count >= minSelections(grant) && count <= maxSelections(grant)
      }),
    [grants, selections],
  )

  /** 依次提交一组 grant 的选择，任一失败即中止 */
  const submitPicks = useCallback(async (picks: Array<{ grant: RewardsGrant; ids: string[] }>) => {
    const claimedNames: string[] = []
    const claimedIds: string[] = []
    let failure = ''

    for (const { grant, ids } of picks) {
      try {
        await lcu.selectGrantReward(grant.info.id, grant.rewardGroup.id, ids)
        claimedIds.push(grant.info.id)
        for (const reward of grant.rewardGroup.rewards) {
          if (ids.includes(reward.id)) {
            claimedNames.push(reward.localizations?.title || t('rewards.untitled'))
          }
        }
      } catch (error) {
        failure = error instanceof Error ? error.message : String(error)
        logger.warn('[RewardsPage] 领取失败: %s', failure)
        break
      }
    }

    if (claimedIds.length) {
      setGrants((prev) => prev.filter((g) => !claimedIds.includes(g.info.id)))
      setSelections((prev) => {
        const next = { ...prev }
        for (const id of claimedIds) delete next[id]
        return next
      })
    }

    if (failure) {
      setStatus(t('rewards.claimFailed', { error: failure }))
    } else {
      setStatus(t('rewards.claimSuccess', { items: claimedNames.join('、') }))
    }
  }, [t])

  const claimAll = useCallback(async () => {
    if (!claimableGrants.length || busy) return

    setClaiming('selected')
    setStatus('')
    await submitPicks(claimableGrants.map((grant) => ({ grant, ids: selections[grant.info.id] ?? [] })))
    setClaiming(null)
  }, [claimableGrants, busy, selections, submitPicks])

  // 一键领取：每个 grant 按可选上限直接取前几个奖励提交，不做任何取舍
  const claimEverything = useCallback(async () => {
    if (!grants.length || busy) return

    setClaiming('all')
    setStatus('')
    await submitPicks(grants.map((grant) => ({
      grant,
      ids: grant.rewardGroup.rewards.slice(0, maxSelections(grant)).map((reward) => reward.id),
    })))
    setClaiming(null)
  }, [grants, busy, submitPicks])

  return (
    <div className="sona-settings sona-rewards">
      <h2 className="sona-settings-title">{t('rewards.title')}</h2>

      <div className="sona-rewards-bar">
        <p className="sona-rewards-hint">{t('rewards.hint')}</p>
        <div className="sona-rewards-actions">
          <SonaButton onClick={claimEverything} disabled={busy || loading || grants.length === 0}>
            {claiming === 'all' ? t('rewards.claiming') : t('rewards.claimEverything')}
          </SonaButton>
          <SonaButton onClick={load} disabled={loading || busy}>
            {loading ? t('common.loading') : t('rewards.refresh')}
          </SonaButton>
          <SonaButton variant="primary" onClick={claimAll} disabled={busy || claimableGrants.length === 0}>
            {claiming === 'selected'
              ? t('rewards.claiming')
              : totalSelected > 0
                ? t('rewards.claimSelected', { count: totalSelected })
                : t('rewards.claim')}
          </SonaButton>
        </div>
      </div>

      {status && <p className="sona-rewards-status">{status}</p>}

      {!loading && items.length === 0 && (
        <div className="sona-rewards-empty">{t('rewards.empty')}</div>
      )}

      {items.length > 0 && (
        <div className="sona-reward-card">
          <div className="sona-reward-items">
            {items.map(({ grant, reward }) => {
              const isSelected = (selections[grant.info.id] ?? []).includes(reward.id)
              const name = reward.localizations?.title || t('rewards.untitled')
              return (
                <button
                  key={`${grant.info.id}:${reward.id}`}
                  type="button"
                  className={`sona-reward-item${isSelected ? ' sona-reward-item--selected' : ''}`}
                  onClick={() => toggle(grant, reward.id)}
                  disabled={busy}
                  title={name}
                >
                  {isSelected && <span className="sona-reward-item-check" aria-hidden>✓</span>}
                  <span className="sona-reward-item-thumb">
                    {reward.media?.iconUrl
                      ? <img src={reward.media.iconUrl} alt={name} draggable={false} />
                      : <span className="sona-reward-item-thumb-placeholder" />}
                    {reward.quantity > 1 && (
                      <span className="sona-reward-item-qty">{t('rewards.quantity', { count: reward.quantity })}</span>
                    )}
                  </span>
                  <span className="sona-reward-item-name">{name}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

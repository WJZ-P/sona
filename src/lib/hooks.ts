import { useState, useEffect, useCallback } from 'react'
import { lcu } from './lcu'

/**
 * React hook for fetching LCU API data
 */
export function useLcuData<T>(endpoint: string | null) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    if (!endpoint) return

    setLoading(true)
    setError(null)

    try {
      const result = await lcu.get<T>(endpoint)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

/**
 * React hook for current summoner data
 */
export function useCurrentSummoner() {
  return useLcuData<{
    accountId: number
    displayName: string
    gameName: string
    tagLine: string
    profileIconId: number
    summonerId: number
    summonerLevel: number
  }>('/lol-summoner/v1/current-summoner')
}

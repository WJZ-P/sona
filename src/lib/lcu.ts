/**
 * LCU (League Client Update) API Helper
 * Provides methods to interact with the League Client's internal API.
 *
 * @see https://pengu.lol/guide/lcu-request
 */

/**
 * Make a request to the LCU API
 * The League Client runs on a local server, requests are relative to the client origin.
 */
export async function lcuRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`LCU Request failed: ${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<T>
}

/**
 * GET request to LCU API
 */
export function lcuGet<T = unknown>(endpoint: string): Promise<T> {
  return lcuRequest<T>(endpoint, { method: 'GET' })
}

/**
 * POST request to LCU API
 */
export function lcuPost<T = unknown>(endpoint: string, body?: unknown): Promise<T> {
  return lcuRequest<T>(endpoint, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * PUT request to LCU API
 */
export function lcuPut<T = unknown>(endpoint: string, body?: unknown): Promise<T> {
  return lcuRequest<T>(endpoint, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * PATCH request to LCU API
 */
export function lcuPatch<T = unknown>(endpoint: string, body?: unknown): Promise<T> {
  return lcuRequest<T>(endpoint, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * DELETE request to LCU API
 */
export function lcuDelete<T = unknown>(endpoint: string): Promise<T> {
  return lcuRequest<T>(endpoint, { method: 'DELETE' })
}

/**
 * Get current summoner info
 */
export async function getCurrentSummoner() {
  return lcuGet<{
    accountId: number
    displayName: string
    gameName: string
    tagLine: string
    internalName: string
    profileIconId: number
    summonerId: number
    summonerLevel: number
    xpSinceLastLevel: number
    xpUntilNextLevel: number
  }>('/lol-summoner/v1/current-summoner')
}

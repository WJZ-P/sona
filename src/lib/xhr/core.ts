import type { XhrMatchedRule, XhrRequestMeta, XhrRule } from './types'

interface XhrHookState {
  installed: boolean
  originalOpen: XMLHttpRequest['open']
  rules: XhrRule[]
  metaByRequest: WeakMap<XMLHttpRequest, XhrRequestMeta>
  originalSendByRequest: WeakMap<XMLHttpRequest, XMLHttpRequest['send']>
  loggedRuleIds: Set<string>
}

declare global {
  interface Window {
    __SONA_XHR_HOOK_STATE__?: XhrHookState
  }
}

function getState(): XhrHookState {
  if (!window.__SONA_XHR_HOOK_STATE__) {
    window.__SONA_XHR_HOOK_STATE__ = {
      installed: false,
      originalOpen: XMLHttpRequest.prototype.open,
      rules: [],
      metaByRequest: new WeakMap(),
      originalSendByRequest: new WeakMap(),
      loggedRuleIds: new Set(),
    }
  }

  return window.__SONA_XHR_HOOK_STATE__
}

export function registerXhrRule(rule: XhrRule): () => void {
  const state = getState()
  installXhrHook()

  const existingIndex = state.rules.findIndex((item) => item.id === rule.id)
  if (existingIndex >= 0) {
    state.rules[existingIndex] = rule
  } else {
    state.rules.push(rule)
  }

  return () => unregisterXhrRule(rule.id)
}

export function unregisterXhrRule(id: string) {
  const state = getState()
  const index = state.rules.findIndex((rule) => rule.id === id)
  if (index >= 0) {
    state.rules.splice(index, 1)
  }
}

export function getRegisteredXhrRules(): XhrRule[] {
  return [...getState().rules]
}

export function installXhrHook() {
  const state = getState()
  if (state.installed) return

  XMLHttpRequest.prototype.open = function sonaHookedOpen(this: XMLHttpRequest, method: string, url: string | URL, async = true) {
    const meta: XhrRequestMeta = {
      method: method.toUpperCase(),
      url: String(url),
      async: async !== false,
    }

    state.metaByRequest.set(this, meta)
    wrapSend(this, state, meta)

    return Reflect.apply(state.originalOpen, this, arguments)
  } as XMLHttpRequest['open']

  state.installed = true
  console.info('[Sona][XHR] Hook installed')
}

function wrapSend(xhr: XMLHttpRequest, state: XhrHookState, meta: XhrRequestMeta) {
  const request = xhr as XMLHttpRequest & { send: XMLHttpRequest['send'] }
  const previousOriginalSend = state.originalSendByRequest.get(xhr)
  if (previousOriginalSend) {
    request.send = previousOriginalSend
  }

  const originalSend = request.send
  state.originalSendByRequest.set(xhr, originalSend)

  request.send = function sonaHookedSend(this: XMLHttpRequest) {
    const latestMeta = state.metaByRequest.get(this) ?? meta
    const matchedRule = findMatchedRule(state, latestMeta)

    if (matchedRule) {
      logBlockedRequest(state, latestMeta, matchedRule)
      simulateNetworkError(this, latestMeta)
      return undefined
    }

    return Reflect.apply(originalSend, this, arguments)
  } as XMLHttpRequest['send']
}

function findMatchedRule(state: XhrHookState, meta: XhrRequestMeta): XhrMatchedRule | null {
  for (const rule of state.rules) {
    if (matchesRule(rule, meta)) {
      return rule
    }
  }

  return null
}

function matchesRule(rule: XhrRule, meta: XhrRequestMeta): rule is XhrMatchedRule {
  const candidates = createUrlCandidates(meta.url)
  const matcher = rule.match

  if (typeof matcher === 'string') {
    return candidates.includes(matcher)
  }

  if (matcher instanceof RegExp) {
    return candidates.some((candidate) => {
      matcher.lastIndex = 0
      return matcher.test(candidate)
    })
  }

  try {
    return matcher(meta)
  } catch (err) {
    console.warn('[Sona][XHR] Rule matcher failed: %s', rule.id, err)
    return false
  }
}

function createUrlCandidates(rawUrl: string): string[] {
  const candidates = new Set<string>([rawUrl])

  try {
    const parsed = new URL(rawUrl, window.location.href)
    candidates.add(parsed.href)
    candidates.add(`${parsed.pathname}${parsed.search}`)
    candidates.add(parsed.pathname)
  } catch {
    // Keep the raw URL candidate when URL parsing is unavailable.
  }

  return [...candidates]
}

function simulateNetworkError(xhr: XMLHttpRequest, meta: XhrRequestMeta) {
  const dispatchFailure = () => {
    defineXhrValue(xhr, 'readyState', XMLHttpRequest.DONE)
    defineXhrValue(xhr, 'status', 0)
    defineXhrValue(xhr, 'statusText', '')
    defineXhrValue(xhr, 'responseURL', meta.url)
    defineXhrValue(xhr, 'response', '')
    defineXhrValue(xhr, 'responseText', '')

    dispatchXhrEvent(xhr, 'readystatechange')
    dispatchXhrEvent(xhr, 'error')
    dispatchXhrEvent(xhr, 'loadend')
  }

  if (typeof queueMicrotask === 'function') {
    queueMicrotask(dispatchFailure)
  } else {
    window.setTimeout(dispatchFailure, 0)
  }
}

function defineXhrValue(xhr: XMLHttpRequest, key: keyof XMLHttpRequest, value: unknown) {
  try {
    Object.defineProperty(xhr, key, {
      configurable: true,
      writable: true,
      value,
    })
  } catch {
    // Native XHR properties are host-defined; best effort is enough here.
  }
}

function dispatchXhrEvent(xhr: XMLHttpRequest, type: string) {
  try {
    const event = type === 'error' || type === 'loadend'
      ? new ProgressEvent(type, { lengthComputable: false, loaded: 0, total: 0 })
      : new Event(type)
    xhr.dispatchEvent(event)
  } catch (err) {
    console.warn('[Sona][XHR] Failed to dispatch %s event', type, err)
  }
}

function logBlockedRequest(state: XhrHookState, meta: XhrRequestMeta, rule: XhrMatchedRule) {
  if (state.loggedRuleIds.has(rule.id)) return

  state.loggedRuleIds.add(rule.id)
  console.info('[Sona][XHR] Blocked request by rule "%s": %s %s', rule.id, meta.method, meta.url)
}

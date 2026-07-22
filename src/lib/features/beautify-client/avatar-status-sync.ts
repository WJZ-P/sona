import { lcu } from '@/lib/lcu'

const LEGACY_AVATAR_PAYLOAD_PREFIX = 'sona-avatar:v1:'
const CURRENT_PAYLOAD_VERSION = 2

// NekoCrypt uses FE00-FE0F as an invisible alphabet. Here we keep the same
// alphabet but encode bytes by nibbles, avoiding BigInteger/base-N work.
const ZERO_WIDTH_ALPHABET = Array.from({ length: 16 }, (_, index) => String.fromCharCode(0xFE00 + index))
const ZERO_WIDTH_INDEX = new Map(ZERO_WIDTH_ALPHABET.map((char, index) => [char, index]))
const AVATAR_STATUS_START = '\u200B\u200C\u200D\u2060'
const AVATAR_STATUS_END = '\u2060\u200D\u200C\u200B'

export interface SummonerNameGradientEffect {
  startColor: string
  endColor: string
  angle: number
}

export interface SonaStatusPayload {
  avatarUrl?: string
  nameGradient?: SummonerNameGradientEffect
}

interface CompactStatusPayload {
  v: 2
  a?: string
  n?: [string, string, number] | [string, string, string, number]
}

interface StatusPayloadPatch {
  avatarUrl?: string | null
  nameGradient?: SummonerNameGradientEffect | null
}

let statusWriteQueue: Promise<void> = Promise.resolve()

function encodeTextToZeroWidth(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let encoded = ''
  bytes.forEach((byte) => {
    encoded += ZERO_WIDTH_ALPHABET[byte >> 4]
    encoded += ZERO_WIDTH_ALPHABET[byte & 0x0f]
  })
  return encoded
}

function decodeTextFromZeroWidth(value: string): string | null {
  const bytes: number[] = []
  let highNibble: number | null = null

  for (const char of value) {
    const index = ZERO_WIDTH_INDEX.get(char)
    if (index == null) return null

    if (highNibble == null) {
      highNibble = index
    } else {
      bytes.push((highNibble << 4) | index)
      highNibble = null
    }
  }

  if (highNibble != null) return null

  try {
    return new TextDecoder().decode(new Uint8Array(bytes))
  } catch {
    return null
  }
}

function isValidAvatarUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

function normalizeColor(value: string): string | null {
  const normalized = value.trim().toLowerCase()
  if (/^#[0-9a-f]{6}$/.test(normalized)) return normalized
  if (/^[0-9a-f]{6}$/.test(normalized)) return `#${normalized}`
  if (/^#[0-9a-f]{3}$/.test(normalized)) {
    return `#${normalized.slice(1).split('').map((part) => part + part).join('')}`
  }
  return null
}

function normalizeNameGradient(value: SummonerNameGradientEffect): SummonerNameGradientEffect | null {
  const startColor = normalizeColor(value.startColor)
  const endColor = normalizeColor(value.endColor)
  if (!startColor || !endColor) return null

  return {
    startColor,
    endColor,
    angle: Math.min(Math.max(Math.round(Number(value.angle) || 0), 0), 360),
  }
}

function toCompactPayload(payload: SonaStatusPayload): CompactStatusPayload {
  const compact: CompactStatusPayload = { v: CURRENT_PAYLOAD_VERSION }
  if (payload.avatarUrl && isValidAvatarUrl(payload.avatarUrl)) compact.a = payload.avatarUrl

  if (payload.nameGradient) {
    const gradient = normalizeNameGradient(payload.nameGradient)
    if (gradient) {
      compact.n = [gradient.startColor.slice(1), gradient.endColor.slice(1), gradient.angle]
    }
  }

  return compact
}

function parseCompactPayload(value: string): SonaStatusPayload | null {
  try {
    const compact = JSON.parse(value) as Partial<CompactStatusPayload>
    if (compact.v !== CURRENT_PAYLOAD_VERSION) return null

    const payload: SonaStatusPayload = {}
    if (typeof compact.a === 'string' && isValidAvatarUrl(compact.a)) payload.avatarUrl = compact.a

    if (Array.isArray(compact.n) && compact.n.length >= 3) {
      // Accept both the minimal tuple [start, end, angle] and the short-lived
      // typed tuple [effectCode, start, end, angle]. All types now render as flow.
      const hasEffectCode = compact.n.length >= 4 && typeof compact.n[0] === 'string'
      const colorOffset = hasEffectCode ? 1 : 0
      const startColorValue = compact.n[colorOffset]
      const endColorValue = compact.n[colorOffset + 1]
      const startColor = typeof startColorValue === 'string' ? normalizeColor(startColorValue) : null
      const endColor = typeof endColorValue === 'string' ? normalizeColor(endColorValue) : null
      const angle = Number(compact.n[colorOffset + 2])
      if (startColor && endColor && Number.isFinite(angle)) {
        payload.nameGradient = normalizeNameGradient({
          startColor,
          endColor,
          angle,
        }) ?? undefined
      }
    }

    return payload
  } catch {
    return null
  }
}

function getDecodedPayloadBlocks(statusMessage: string | null | undefined): string[] {
  const source = statusMessage ?? ''
  const blocks: string[] = []
  let cursor = 0

  while (cursor < source.length) {
    const start = source.indexOf(AVATAR_STATUS_START, cursor)
    if (start < 0) break
    const payloadStart = start + AVATAR_STATUS_START.length
    const end = source.indexOf(AVATAR_STATUS_END, payloadStart)
    if (end < 0) break

    const decoded = decodeTextFromZeroWidth(source.slice(payloadStart, end))
    if (decoded) blocks.push(decoded)
    cursor = end + AVATAR_STATUS_END.length
  }

  return blocks
}

export function decodeSonaStatusPayload(statusMessage: string | null | undefined): SonaStatusPayload | null {
  const merged: SonaStatusPayload = {}
  let found = false

  for (const decoded of getDecodedPayloadBlocks(statusMessage)) {
    if (decoded.startsWith(LEGACY_AVATAR_PAYLOAD_PREFIX)) {
      const avatarUrl = decoded.slice(LEGACY_AVATAR_PAYLOAD_PREFIX.length)
      if (isValidAvatarUrl(avatarUrl) && !merged.avatarUrl) {
        merged.avatarUrl = avatarUrl
        found = true
      }
      continue
    }

    const current = parseCompactPayload(decoded)
    if (!current) continue
    if (current.avatarUrl) merged.avatarUrl = current.avatarUrl
    if (current.nameGradient) merged.nameGradient = current.nameGradient
    found = true
  }

  return found ? merged : null
}

export function encodeSonaStatusPayload(payload: SonaStatusPayload): string {
  const compact = toCompactPayload(payload)
  if (!compact.a && !compact.n) return ''
  return `${AVATAR_STATUS_START}${encodeTextToZeroWidth(JSON.stringify(compact))}${AVATAR_STATUS_END}`
}

export function encodeAvatarStatusPayload(avatarUrl: string): string {
  return encodeSonaStatusPayload({ avatarUrl })
}

export function stripAvatarStatusPayload(statusMessage: string | null | undefined): string {
  let output = statusMessage ?? ''

  while (true) {
    const start = output.indexOf(AVATAR_STATUS_START)
    if (start < 0) return output

    const end = output.indexOf(AVATAR_STATUS_END, start + AVATAR_STATUS_START.length)
    if (end < 0) return output.slice(0, start)
    output = output.slice(0, start) + output.slice(end + AVATAR_STATUS_END.length)
  }
}

export function embedSonaStatusPayload(
  statusMessage: string | null | undefined,
  payload: SonaStatusPayload,
): string {
  const visibleStatusMessage = stripAvatarStatusPayload(statusMessage)
  return `${encodeSonaStatusPayload(payload)}${visibleStatusMessage}`
}

export function embedAvatarStatusPayload(statusMessage: string | null | undefined, avatarUrl: string): string {
  const current = decodeSonaStatusPayload(statusMessage) ?? {}
  return embedSonaStatusPayload(statusMessage, { ...current, avatarUrl })
}

export function decodeAvatarStatusPayload(statusMessage: string | null | undefined): string | null {
  return decodeSonaStatusPayload(statusMessage)?.avatarUrl ?? null
}

async function applyStatusPayloadPatch(patch: StatusPayloadPatch, fallbackStatusMessage = ''): Promise<void> {
  const chatMe = await lcu.getChatMe()
  const currentStatusMessage = chatMe.statusMessage ?? ''
  const currentPayload = decodeSonaStatusPayload(currentStatusMessage) ?? {}
  const nextPayload: SonaStatusPayload = { ...currentPayload }

  if (patch.avatarUrl !== undefined) {
    if (patch.avatarUrl) nextPayload.avatarUrl = patch.avatarUrl
    else delete nextPayload.avatarUrl
  }
  if (patch.nameGradient !== undefined) {
    if (patch.nameGradient) nextPayload.nameGradient = patch.nameGradient
    else delete nextPayload.nameGradient
  }

  const currentVisibleStatusMessage = stripAvatarStatusPayload(currentStatusMessage)
  const fallbackVisibleStatusMessage = stripAvatarStatusPayload(fallbackStatusMessage)
  const baseStatusMessage = currentVisibleStatusMessage ? currentStatusMessage : fallbackVisibleStatusMessage
  const nextStatusMessage = embedSonaStatusPayload(baseStatusMessage, nextPayload)
  if (nextStatusMessage !== currentStatusMessage) await lcu.setStatusMessage(nextStatusMessage)
}

function writeStatusPayloadPatch(patch: StatusPayloadPatch, fallbackStatusMessage = ''): Promise<void> {
  const operation = statusWriteQueue.then(() => applyStatusPayloadPatch(patch, fallbackStatusMessage))
  statusWriteQueue = operation.catch(() => {})
  return operation
}

export function writeAvatarUrlToStatusMessage(avatarUrl: string, fallbackStatusMessage = ''): Promise<void> {
  return writeStatusPayloadPatch({ avatarUrl }, fallbackStatusMessage)
}

export function clearAvatarUrlFromStatusMessage(): Promise<void> {
  return writeStatusPayloadPatch({ avatarUrl: null })
}

export function writeNameGradientToStatusMessage(
  nameGradient: SummonerNameGradientEffect,
  fallbackStatusMessage = '',
): Promise<void> {
  return writeStatusPayloadPatch({ nameGradient }, fallbackStatusMessage)
}

export function clearNameGradientFromStatusMessage(): Promise<void> {
  return writeStatusPayloadPatch({ nameGradient: null })
}

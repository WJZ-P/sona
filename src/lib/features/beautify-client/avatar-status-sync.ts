import { lcu } from '@/lib/lcu'

const LEGACY_AVATAR_PAYLOAD_PREFIX = 'sona-avatar:v1:'
const LEGACY_JSON_PAYLOAD_VERSION = 2
const CURRENT_PAYLOAD_VERSION = 3
const HOSTED_IMAGE_URL_TOKEN = '~'
const HOSTED_IMAGE_COMMON_PATH_TOKEN = '!'
const HOSTED_IMAGE_COMMON_PATH_PREFIX = 'mall-im-user/'
const HOSTED_IMAGE_BASE_URL = decodeRuntimeConstant('aHR0cHM6Ly9vcGVyYXRpb24tdXBsb2FkLm1paG95by5jb20=')
const STATUS_VERIFY_DELAYS = [120, 320, 700]

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

interface LegacyCompactStatusPayload {
  v: 2
  a?: string
  n?: [string, string, number] | [string, string, string, number]
}

interface CompactStatusPayload {
  v: 3
  a?: string
  n?: string
}

interface StatusPayloadPatch {
  avatarUrl?: string | null
  nameGradient?: SummonerNameGradientEffect | null
}

let statusWriteQueue: Promise<void> = Promise.resolve()

function decodeRuntimeConstant(encodedValue: string): string {
  const binary = atob(encodedValue)
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

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

function compactAvatarUrl(value: string): string {
  try {
    const url = new URL(value)
    const hostedBase = new URL(HOSTED_IMAGE_BASE_URL)
    if (url.origin !== hostedBase.origin || url.search || url.hash) return value

    const path = url.pathname.replace(/^\/+/, '')
    if (!path) return value
    if (path.startsWith(HOSTED_IMAGE_COMMON_PATH_PREFIX)) {
      return `${HOSTED_IMAGE_COMMON_PATH_TOKEN}${path.slice(HOSTED_IMAGE_COMMON_PATH_PREFIX.length)}`
    }
    return `${HOSTED_IMAGE_URL_TOKEN}${path}`
  } catch {
    return value
  }
}

function expandAvatarUrl(value: string): string {
  if (value.startsWith(HOSTED_IMAGE_COMMON_PATH_TOKEN)) {
    return `${HOSTED_IMAGE_BASE_URL}/${HOSTED_IMAGE_COMMON_PATH_PREFIX}${value.slice(1)}`
  }
  if (value.startsWith(HOSTED_IMAGE_URL_TOKEN)) {
    return `${HOSTED_IMAGE_BASE_URL}/${value.slice(1)}`
  }
  return value
}

function packNameGradient(value: SummonerNameGradientEffect): string | null {
  const gradient = normalizeNameGradient(value)
  if (!gradient) return null
  return `${gradient.startColor.slice(1)}${gradient.endColor.slice(1)}${gradient.angle.toString(36)}`
}

function unpackNameGradient(value: string): SummonerNameGradientEffect | null {
  if (!/^[0-9a-f]{12}[0-9a-z]{1,2}$/i.test(value)) return null
  const angle = Number.parseInt(value.slice(12), 36)
  if (!Number.isFinite(angle) || angle < 0 || angle > 360) return null

  return normalizeNameGradient({
    startColor: value.slice(0, 6),
    endColor: value.slice(6, 12),
    angle,
  })
}

function toCompactPayload(payload: SonaStatusPayload): CompactStatusPayload {
  const compact: CompactStatusPayload = { v: CURRENT_PAYLOAD_VERSION }
  if (payload.avatarUrl && isValidAvatarUrl(payload.avatarUrl)) compact.a = compactAvatarUrl(payload.avatarUrl)

  if (payload.nameGradient) {
    const gradient = packNameGradient(payload.nameGradient)
    if (gradient) compact.n = gradient
  }

  return compact
}

function parseLegacyCompactPayload(compact: Partial<LegacyCompactStatusPayload>): SonaStatusPayload | null {
  if (compact.v !== LEGACY_JSON_PAYLOAD_VERSION) return null

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
}

function parseCompactPayload(value: string): SonaStatusPayload | null {
  try {
    const compact = JSON.parse(value) as Partial<CompactStatusPayload | LegacyCompactStatusPayload>
    if (compact.v === LEGACY_JSON_PAYLOAD_VERSION) {
      return parseLegacyCompactPayload(compact as Partial<LegacyCompactStatusPayload>)
    }
    if (compact.v !== CURRENT_PAYLOAD_VERSION) return null

    const payload: SonaStatusPayload = {}
    if (typeof compact.a === 'string') {
      const avatarUrl = expandAvatarUrl(compact.a)
      if (isValidAvatarUrl(avatarUrl)) payload.avatarUrl = avatarUrl
    }

    if (typeof compact.n === 'string') {
      payload.nameGradient = unpackNameGradient(compact.n) ?? undefined
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

export function hasCurrentAvatarStatusPayload(
  statusMessage: string | null | undefined,
  expectedAvatarUrl: string,
): boolean {
  for (const decoded of getDecodedPayloadBlocks(statusMessage)) {
    try {
      const compact = JSON.parse(decoded) as Partial<CompactStatusPayload>
      if (compact.v !== CURRENT_PAYLOAD_VERSION || typeof compact.a !== 'string') continue
      if (expandAvatarUrl(compact.a) === expectedAvatarUrl) return true
    } catch {
      // Legacy and malformed blocks are handled by the normal compatibility decoder.
    }
  }
  return false
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
  if (nextStatusMessage === currentStatusMessage) return

  // PUT 的响应会回显刚提交的内容，但 CHAT_ME 监听器或客户端自己的 presence
  // 同步仍可能紧接着覆盖它。延迟后重新 GET，才能确认最终持久化状态。
  await lcu.setStatusMessage(nextStatusMessage)
  let persistedStatusMessage = ''
  for (const delay of STATUS_VERIFY_DELAYS) {
    await wait(delay)
    persistedStatusMessage = (await lcu.getChatMe()).statusMessage ?? ''
    if (isStatusPayloadPatchPersisted(persistedStatusMessage, patch)) return
  }

  throw new Error(
    `Xác minh đọc lại thông tin đồng bộ ảnh đại diện/biệt danh thất bại sau khi ghi (đã ghi ${nextStatusMessage.length} ký tự, đọc lại ${persistedStatusMessage.length} ký tự)`,
  )
}

function isSameNameGradient(
  actual: SummonerNameGradientEffect | undefined,
  expected: SummonerNameGradientEffect,
): boolean {
  const normalizedExpected = normalizeNameGradient(expected)
  const normalizedActual = actual ? normalizeNameGradient(actual) : null
  return Boolean(
    normalizedExpected
    && normalizedActual
    && normalizedActual.startColor === normalizedExpected.startColor
    && normalizedActual.endColor === normalizedExpected.endColor
    && normalizedActual.angle === normalizedExpected.angle,
  )
}

function isStatusPayloadPatchPersisted(
  statusMessage: string | null | undefined,
  patch: StatusPayloadPatch,
): boolean {
  const payload = decodeSonaStatusPayload(statusMessage) ?? {}
  if (patch.avatarUrl !== undefined) {
    if (patch.avatarUrl && payload.avatarUrl !== patch.avatarUrl) return false
    if (patch.avatarUrl === null && payload.avatarUrl) return false
  }
  if (patch.nameGradient !== undefined) {
    if (patch.nameGradient && !isSameNameGradient(payload.nameGradient, patch.nameGradient)) return false
    if (patch.nameGradient === null && payload.nameGradient) return false
  }
  return true
}

function wait(delay: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, delay))
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

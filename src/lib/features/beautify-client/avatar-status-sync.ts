import { lcu } from '@/lib/lcu'

const AVATAR_PAYLOAD_PREFIX = 'sona-avatar:v1:'

// NekoCrypt uses FE00-FE0F as an invisible alphabet. Here we keep the same
// alphabet but encode bytes by nibbles, avoiding BigInteger/base-N work.
const ZERO_WIDTH_ALPHABET = Array.from({ length: 16 }, (_, index) => String.fromCharCode(0xFE00 + index))
const ZERO_WIDTH_INDEX = new Map(ZERO_WIDTH_ALPHABET.map((char, index) => [char, index]))
const AVATAR_STATUS_START = '\u200B\u200C\u200D\u2060'
const AVATAR_STATUS_END = '\u2060\u200D\u200C\u200B'

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

export function encodeAvatarStatusPayload(avatarUrl: string): string {
  return `${AVATAR_STATUS_START}${encodeTextToZeroWidth(`${AVATAR_PAYLOAD_PREFIX}${avatarUrl}`)}${AVATAR_STATUS_END}`
}

export function stripAvatarStatusPayload(statusMessage: string | null | undefined): string {
  let output = statusMessage ?? ''

  while (true) {
    const start = output.indexOf(AVATAR_STATUS_START)
    if (start < 0) return output

    const end = output.indexOf(AVATAR_STATUS_END, start + AVATAR_STATUS_START.length)
    if (end < 0) {
      return output.slice(0, start)
    }

    output = output.slice(0, start) + output.slice(end + AVATAR_STATUS_END.length)
  }
}

export function embedAvatarStatusPayload(statusMessage: string | null | undefined, avatarUrl: string): string {
  const visibleStatusMessage = stripAvatarStatusPayload(statusMessage)
  return `${encodeAvatarStatusPayload(avatarUrl)}${visibleStatusMessage}`
}

export function decodeAvatarStatusPayload(statusMessage: string | null | undefined): string | null {
  const source = statusMessage ?? ''
  const start = source.indexOf(AVATAR_STATUS_START)
  if (start < 0) return null

  const payloadStart = start + AVATAR_STATUS_START.length
  const end = source.indexOf(AVATAR_STATUS_END, payloadStart)
  if (end < 0) return null

  const decoded = decodeTextFromZeroWidth(source.slice(payloadStart, end))
  if (!decoded?.startsWith(AVATAR_PAYLOAD_PREFIX)) return null

  const avatarUrl = decoded.slice(AVATAR_PAYLOAD_PREFIX.length)
  return isValidAvatarUrl(avatarUrl) ? avatarUrl : null
}

export async function writeAvatarUrlToStatusMessage(avatarUrl: string, fallbackStatusMessage = ''): Promise<void> {
  const chatMe = await lcu.getChatMe()
  const currentStatusMessage = chatMe.statusMessage ?? ''
  const currentVisibleStatusMessage = stripAvatarStatusPayload(currentStatusMessage)
  const fallbackVisibleStatusMessage = stripAvatarStatusPayload(fallbackStatusMessage)
  const baseStatusMessage = currentVisibleStatusMessage
    ? currentStatusMessage
    : fallbackVisibleStatusMessage
  const nextStatusMessage = embedAvatarStatusPayload(baseStatusMessage, avatarUrl)
  if (nextStatusMessage !== (chatMe.statusMessage ?? '')) {
    await lcu.setStatusMessage(nextStatusMessage)
  }
}

export async function clearAvatarUrlFromStatusMessage(): Promise<void> {
  const chatMe = await lcu.getChatMe()
  const nextStatusMessage = stripAvatarStatusPayload(chatMe.statusMessage)
  if (nextStatusMessage !== (chatMe.statusMessage ?? '')) {
    await lcu.setStatusMessage(nextStatusMessage)
  }
}

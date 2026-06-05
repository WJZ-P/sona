import { lcu } from '@/lib/lcu'

// ImgBB API key 号池：单 key 容易触发速率上限，使用号池随机分摊，失败自动轮换。
const IMGBB_API_KEYS = [
  'fb01ca11e6e28914577b493ecca045bc',
  'c1289efc1b3d5b3cb46ca39696b3dedc',
  'b0f8447c3493a289af85667bd0579100',
  '0f88e687fe91b07d62b1818d69ccc57a',
  'de2178ae9854c16dc8f28f23b6ec7772',
  'ef53f3020d67083e1c831cfd483acc14',
  'e17591bdc02fbebbcc854d80b4d1a53f',
  '71a100fb76da44fffee851486e5a6bd4',
  '6d2fde37e85a9b70fcf0672cb0fdc637',
  '2cc0280c2500d36a3a64a9f6d4d05ca1'
]
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload'
const AVATAR_PAYLOAD_PREFIX = 'sona-avatar:v1:'

// NekoCrypt uses FE00-FE0F as an invisible alphabet. Here we keep the same
// alphabet but encode bytes by nibbles, avoiding BigInteger/base-N work.
const ZERO_WIDTH_ALPHABET = Array.from({ length: 16 }, (_, index) => String.fromCharCode(0xFE00 + index))
const ZERO_WIDTH_INDEX = new Map(ZERO_WIDTH_ALPHABET.map((char, index) => [char, index]))
const AVATAR_STATUS_START = '\u200B\u200C\u200D\u2060'
const AVATAR_STATUS_END = '\u2060\u200D\u200C\u200B'

interface ImgbbUploadResponse {
  success?: boolean
  data?: {
    url?: string
    display_url?: string
  }
  error?: {
    message?: string
  }
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

function shuffleImgbbApiKeys(): string[] {
  const keys = [...IMGBB_API_KEYS]
  for (let i = keys.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[keys[i], keys[j]] = [keys[j], keys[i]]
  }
  return keys
}

function maskImgbbApiKey(key: string): string {
  return key.length <= 6 ? key : `${key.slice(0, 6)}…`
}

async function uploadAvatarToImgbbWithKey(image: Blob, key: string): Promise<string> {
  const formData = new FormData()
  formData.set('image', image, 'sona-avatar.png')

  const response = await fetch(`${IMGBB_UPLOAD_URL}?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    body: formData,
  })
  const body = await response.json().catch(() => null) as ImgbbUploadResponse | null

  if (!response.ok || body?.success === false) {
    throw new Error(body?.error?.message || `ImgBB avatar upload failed: ${response.status} ${response.statusText}`)
  }

  const avatarUrl = body?.data?.url || body?.data?.display_url
  if (!avatarUrl) {
    throw new Error('ImgBB avatar upload response missing url.')
  }

  return avatarUrl
}

export async function uploadAvatarToImgbb(image: Blob): Promise<string> {
  const keys = shuffleImgbbApiKeys()
  const errors: string[] = []

  for (const key of keys) {
    try {
      return await uploadAvatarToImgbbWithKey(image, key)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      errors.push(`${maskImgbbApiKey(key)}: ${message}`)
      console.warn(`[AvatarSync] ImgBB key ${maskImgbbApiKey(key)} 上传失败，尝试下一个 key:`, message)
    }
  }

  throw new Error(`ImgBB avatar upload failed for all ${keys.length} API keys → ${errors.join(' | ')}`)
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
